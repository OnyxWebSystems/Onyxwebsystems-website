import { addMinutes } from "date-fns";
import { BRAND_TIMEZONE } from "@/server/email/brand";
import { intervalsOverlap, listGoogleBusyIntervals } from "./google";

export const CONSULTATION_MINUTES = 30;
const PHOENIX_OFFSET_MIN = -7 * 60;
const OPEN_MINUTES = 9 * 60;
const CLOSE_MINUTES = 17 * 60;
const MAX_SLOTS = 40;

export type PublicSlot = {
  startsAt: string;
  endsAt: string;
  label: string;
  dayLabel: string;
};

function toPhoenixParts(date: Date) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  const phoenix = new Date(utc + PHOENIX_OFFSET_MIN * 60_000);
  return {
    y: phoenix.getFullYear(),
    m: phoenix.getMonth(),
    d: phoenix.getDate(),
  };
}

function phoenixLocalToUtc(y: number, m: number, d: number, hours: number, minutes: number) {
  const asUtc = Date.UTC(y, m, d, hours, minutes, 0) - PHOENIX_OFFSET_MIN * 60_000;
  return new Date(asUtc);
}

function formatSlot(startsAt: Date) {
  return {
    label: startsAt.toLocaleString("en-US", {
      timeZone: BRAND_TIMEZONE,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    dayLabel: startsAt.toLocaleDateString("en-US", {
      timeZone: BRAND_TIMEZONE,
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
  };
}

export async function listGoogleConsultationSlots(days = 14): Promise<PublicSlot[]> {
  const from = addMinutes(new Date(), 120);
  const windowDays = Math.min(Math.max(days, 1), 21);
  const windowEnd = addMinutes(from, windowDays * 24 * 60);
  const busy = await listGoogleBusyIntervals(from, windowEnd);
  const startParts = toPhoenixParts(from);
  const slots: PublicSlot[] = [];

  for (let d = 0; d < windowDays; d++) {
    const dayDate = new Date(Date.UTC(startParts.y, startParts.m, startParts.d + d));
    const y = dayDate.getUTCFullYear();
    const m = dayDate.getUTCMonth();
    const day = dayDate.getUTCDate();
    const dow = new Date(Date.UTC(y, m, day)).getUTCDay();
    if (dow === 0 || dow === 6) continue;

    for (let cursorMin = OPEN_MINUTES; cursorMin + CONSULTATION_MINUTES <= CLOSE_MINUTES; cursorMin += CONSULTATION_MINUTES) {
      const startsAt = phoenixLocalToUtc(y, m, day, Math.floor(cursorMin / 60), cursorMin % 60);
      const endsAt = addMinutes(startsAt, CONSULTATION_MINUTES);
      if (startsAt < from) continue;
      const taken = busy.some((block) => intervalsOverlap({ start: startsAt, end: endsAt }, block));
      if (taken) continue;
      const labels = formatSlot(startsAt);
      slots.push({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        label: labels.label,
        dayLabel: labels.dayLabel,
      });
      if (slots.length >= MAX_SLOTS) return slots;
    }
  }

  return slots;
}

export async function googleSlotIsBookable(startsAt: Date) {
  const slots = await listGoogleConsultationSlots(21);
  return slots.some((slot) => slot.startsAt === startsAt.toISOString());
}
