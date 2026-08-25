import { addMinutes } from "date-fns";
import { prisma } from "@/server/db";
import { intervalsOverlap, listGoogleBusyIntervals } from "./google";
import { ensureBusinessTimezone } from "./org-timezone";
import {
  parseHm,
  resolveDisplayTimeZone,
  toZonedParts,
  ymdInZone,
  zonedLocalToUtc,
} from "./timezone";

export const CONSULTATION_MINUTES = 30;
export const SLOT_STEP_MINUTES = 30;
const MAX_DAYS = 42;
const MAX_SLOTS = 240;
const MIN_NOTICE_MINUTES = 120;

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export type DayHours = { open: string; close: string } | null;
export type BusinessHours = Record<string, DayHours>;

export type PublicSlot = {
  startsAt: string;
  endsAt: string;
  label: string;
  dayLabel: string;
  localLabel: string;
  sastLabel: string;
  dateKey: string;
};

export type PublicDay = {
  dateKey: string;
  dayLabel: string;
  slots: PublicSlot[];
};

function asHours(value: unknown): BusinessHours {
  if (!value || typeof value !== "object") {
    return {
      mon: { open: "09:00", close: "17:00" },
      tue: { open: "09:00", close: "17:00" },
      wed: { open: "09:00", close: "17:00" },
      thu: { open: "09:00", close: "17:00" },
      fri: { open: "09:00", close: "17:00" },
      sat: null,
      sun: null,
    };
  }
  return value as BusinessHours;
}

function windowsForDay(input: {
  dow: number;
  dateKey: string;
  hours: BusinessHours;
  holidayKeys: Set<string>;
  override?: { isClosed: boolean; startTime: string | null; endTime: string | null } | null;
}): { startTime: string; endTime: string }[] {
  if (input.override?.isClosed) return [];
  if (input.holidayKeys.has(input.dateKey) && !input.override) return [];
  if (input.override?.startTime && input.override?.endTime) {
    return [{ startTime: input.override.startTime, endTime: input.override.endTime }];
  }
  const weekly = input.hours[DAY_NAMES[input.dow]];
  if (!weekly) return [];
  return [{ startTime: weekly.open, endTime: weekly.close }];
}

export async function listConsultationSlots(input: {
  organizationId: string;
  days?: number;
  timeZone?: string | null;
  durationMin?: number;
  from?: Date;
}): Promise<{
  businessTimeZone: string;
  timeZone: string;
  slots: PublicSlot[];
  days: PublicDay[];
}> {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: input.organizationId } });
  const businessTimeZone = await ensureBusinessTimezone(org.id, org.timezone);
  const displayTimeZone = resolveDisplayTimeZone(input.timeZone);
  const duration = input.durationMin ?? CONSULTATION_MINUTES;
  const from = input.from ?? addMinutes(new Date(), MIN_NOTICE_MINUTES);
  const windowDays = Math.min(Math.max(input.days ?? 28, 1), MAX_DAYS);
  const windowEnd = addMinutes(from, windowDays * 24 * 60);
  const hours = asHours(org.businessHours);

  const [holidays, overrides, existing, busy] = await Promise.all([
    prisma.holiday.findMany({ where: { organizationId: org.id } }),
    prisma.availabilityOverride.findMany({
      where: { organizationId: org.id, date: { gte: from, lte: windowEnd } },
    }),
    prisma.appointment.findMany({
      where: {
        organizationId: org.id,
        status: { notIn: ["cancelled", "no_show"] },
        startsAt: { lt: windowEnd },
        endsAt: { gt: from },
      },
      select: { startsAt: true, endsAt: true },
    }),
    listGoogleBusyIntervals(from, windowEnd),
  ]);

  const holidayKeys = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
  const overrideByDate = new Map(
    overrides.map((row) => [row.date.toISOString().slice(0, 10), row]),
  );

  const startParts = toZonedParts(from, businessTimeZone);
  const slots: PublicSlot[] = [];

  for (let d = 0; d < windowDays; d++) {
    const dayDate = new Date(Date.UTC(startParts.y, startParts.m, startParts.d + d));
    const y = dayDate.getUTCFullYear();
    const m = dayDate.getUTCMonth();
    const day = dayDate.getUTCDate();
    const dow = new Date(Date.UTC(y, m, day)).getUTCDay();
    const dateKey = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const windows = windowsForDay({
      dow,
      dateKey,
      hours,
      holidayKeys,
      override: overrideByDate.get(dateKey) ?? null,
    });

    for (const win of windows) {
      const { h: sh, m: sm } = parseHm(win.startTime);
      const { h: eh, m: em } = parseHm(win.endTime);
      let cursorMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      while (cursorMin + duration <= endMin) {
        const startsAt = zonedLocalToUtc(y, m, day, Math.floor(cursorMin / 60), cursorMin % 60, businessTimeZone);
        const endsAt = addMinutes(startsAt, duration);
        cursorMin += SLOT_STEP_MINUTES;
        if (startsAt < from) continue;
        const taken = existing.some((appt) =>
          intervalsOverlap({ start: startsAt, end: endsAt }, { start: appt.startsAt, end: appt.endsAt }),
        );
        if (taken) continue;
        const googleBusy = busy.some((block) => intervalsOverlap({ start: startsAt, end: endsAt }, block));
        if (googleBusy) continue;

        const localLabel = startsAt.toLocaleTimeString("en-ZA", {
          timeZone: displayTimeZone,
          hour: "numeric",
          minute: "2-digit",
        });
        const sastLabel = startsAt.toLocaleTimeString("en-ZA", {
          timeZone: businessTimeZone,
          hour: "numeric",
          minute: "2-digit",
        });
        const dayLabel = startsAt.toLocaleDateString("en-ZA", {
          timeZone: displayTimeZone,
          weekday: "long",
          month: "long",
          day: "numeric",
        });
        slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          label: `${dayLabel} · ${localLabel}`,
          dayLabel,
          localLabel,
          sastLabel,
          dateKey: ymdInZone(startsAt, displayTimeZone),
        });
        if (slots.length >= MAX_SLOTS) break;
      }
    }
    if (slots.length >= MAX_SLOTS) break;
  }

  const dayMap = new Map<string, PublicDay>();
  for (const slot of slots) {
    const existingDay = dayMap.get(slot.dateKey);
    if (existingDay) existingDay.slots.push(slot);
    else dayMap.set(slot.dateKey, { dateKey: slot.dateKey, dayLabel: slot.dayLabel, slots: [slot] });
  }

  return {
    businessTimeZone,
    timeZone: displayTimeZone,
    slots,
    days: [...dayMap.values()],
  };
}

export async function consultationSlotIsBookable(organizationId: string, startsAt: Date) {
  const listed = await listConsultationSlots({
    organizationId,
    days: 42,
    from: addMinutes(new Date(), 1),
  });
  return listed.slots.some((slot) => slot.startsAt === startsAt.toISOString());
}

export async function listGoogleConsultationSlots(days = 14, timeZone?: string) {
  const org = await prisma.organization.findFirst({ where: { slug: "onyx-web-systems" } });
  if (!org) return [];
  const listed = await listConsultationSlots({ organizationId: org.id, days, timeZone });
  return listed.slots;
}

export async function googleSlotIsBookable(startsAt: Date) {
  const org = await prisma.organization.findFirst({ where: { slug: "onyx-web-systems" } });
  if (!org) return false;
  return consultationSlotIsBookable(org.id, startsAt);
}
