import { addMinutes, areIntervalsOverlapping } from "date-fns";
import { prisma } from "@/server/db";
import { logger } from "@/server/logger";
import { parseHm, toZonedParts, zonedLocalToUtc } from "@/server/calendar/timezone";
import { ensureBusinessTimezone } from "@/server/calendar/org-timezone";

export type Slot = {
  startsAt: Date;
  endsAt: Date;
  employeeId: string;
  employeeName: string;
};

export async function getOrganizationHours(organizationId: string) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  return org.businessHours as Record<string, { open: string; close: string } | null>;
}

export async function listAvailableSlots(input: {
  organizationId: string;
  serviceId: string;
  from: Date;
  days?: number;
  emergency?: boolean;
}): Promise<Slot[]> {
  const service = await prisma.service.findUniqueOrThrow({ where: { id: input.serviceId } });
  const duration = service.durationMin + service.bufferMin;
  const travel = service.travelBufferMin;
  const days = input.days ?? 5;
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: input.organizationId } });
  const timeZone = await ensureBusinessTimezone(org.id, org.timezone);
  const hours = org.businessHours as Record<string, { open: string; close: string } | null>;

  const techs = await prisma.employee.findMany({
    where: {
      organizationId: input.organizationId,
      isActive: true,
      role: {
        in: ["technician", "lead_technician", "consultant", "sales", "scheduler", "manager"],
      },
    },
    include: { availability: true },
  });

  const holidays = await prisma.holiday.findMany({
    where: { organizationId: input.organizationId },
  });
  const holidayKeys = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
  const overrides = await prisma.availabilityOverride.findMany({
    where: { organizationId: input.organizationId },
  });
  const overrideByDate = new Map(overrides.map((row) => [row.date.toISOString().slice(0, 10), row]));

  const windowEnd = addMinutes(input.from, days * 24 * 60);
  const existing = await prisma.appointment.findMany({
    where: {
      organizationId: input.organizationId,
      status: { notIn: ["cancelled", "no_show"] },
      startsAt: { lt: windowEnd },
      endsAt: { gt: input.from },
    },
  });

  const slots: Slot[] = [];
  const startParts = toZonedParts(input.from, timeZone);

  for (let d = 0; d < days; d++) {
    const dayDate = new Date(Date.UTC(startParts.y, startParts.m, startParts.d + d));
    const y = dayDate.getUTCFullYear();
    const m = dayDate.getUTCMonth();
    const day = dayDate.getUTCDate();
    const dow = new Date(Date.UTC(y, m, day)).getUTCDay();
    const dayKey = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const override = overrideByDate.get(dayKey);
    if (override?.isClosed && !input.emergency) continue;
    if (holidayKeys.has(dayKey) && !override && !input.emergency) continue;

    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const orgDay = hours[dayNames[dow]];
    if (!orgDay && !override && !input.emergency) continue;

    for (const tech of techs) {
      const rules = tech.availability.filter((r) => r.dayOfWeek === dow && r.isActive);
      const windows =
        override?.startTime && override?.endTime
          ? [{ startTime: override.startTime, endTime: override.endTime }]
          : rules.length > 0
            ? rules.map((r) => ({ startTime: r.startTime, endTime: r.endTime }))
            : orgDay
              ? [{ startTime: orgDay.open, endTime: orgDay.close }]
              : input.emergency
                ? [{ startTime: "08:00", endTime: "20:00" }]
                : [];

      for (const win of windows) {
        const { h: sh, m: sm } = parseHm(win.startTime);
        const { h: eh, m: em } = parseHm(win.endTime);
        let cursorMin = sh * 60 + sm;
        const endMin = eh * 60 + em;

        while (cursorMin + duration <= endMin) {
          const hh = Math.floor(cursorMin / 60);
          const mm = cursorMin % 60;
          const startsAt = zonedLocalToUtc(y, m, day, hh, mm, timeZone);
          const endsAt = addMinutes(startsAt, service.durationMin);
          const blockEnd = addMinutes(endsAt, service.bufferMin + travel);

          if (startsAt >= input.from) {
            const conflict = existing.some(
              (a) =>
                a.employeeId === tech.id &&
                areIntervalsOverlapping(
                  { start: startsAt, end: blockEnd },
                  { start: a.startsAt, end: addMinutes(a.endsAt, travel) },
                  { inclusive: false },
                ),
            );
            if (!conflict) {
              slots.push({
                startsAt,
                endsAt,
                employeeId: tech.id,
                employeeName: tech.name,
              });
              if (slots.length >= 12) return slots;
            }
          }
          cursorMin += 30;
        }
      }
    }
  }

  return slots;
}

export async function bookAppointment(input: {
  organizationId: string;
  customerId: string;
  serviceId: string;
  employeeId: string;
  startsAt: Date;
  urgency?: string;
  notes?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  guestTimeZone?: string | null;
}) {
  const service = await prisma.service.findUniqueOrThrow({ where: { id: input.serviceId } });
  const endsAt = addMinutes(input.startsAt, service.durationMin);

  const conflict = await prisma.appointment.findFirst({
    where: {
      organizationId: input.organizationId,
      status: { notIn: ["cancelled", "no_show"] },
      startsAt: { lt: addMinutes(endsAt, service.bufferMin) },
      endsAt: { gt: addMinutes(input.startsAt, -service.travelBufferMin) },
    },
  });
  if (conflict) {
    throw new Error("Selected slot is no longer available");
  }

  const appointment = await prisma.appointment.create({
    data: {
      organizationId: input.organizationId,
      customerId: input.customerId,
      serviceId: input.serviceId,
      employeeId: input.employeeId,
      startsAt: input.startsAt,
      endsAt,
      status: "confirmed",
      urgency: input.urgency ?? "NORMAL",
      notes: input.notes,
      addressLine1: input.addressLine1,
      city: input.city,
      postalCode: input.postalCode,
      confirmationSent: true,
      guestTimeZone: input.guestTimeZone ?? null,
      remindersSent: {},
    },
    include: { service: true, employee: true, customer: true },
  });

  logger.info("Appointment booked", { appointmentId: appointment.id });
  return appointment;
}

export async function rescheduleAppointment(appointmentId: string, startsAt: Date, employeeId?: string) {
  const existing = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
    include: { service: true },
  });
  const endsAt = addMinutes(startsAt, existing.service.durationMin);
  const techId = employeeId ?? existing.employeeId;
  if (!techId) throw new Error("No technician assigned");

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      startsAt,
      endsAt,
      employeeId: techId,
      status: "confirmed",
      confirmationSent: true,
      remindersSent: {},
    },
    include: { service: true, employee: true, customer: true },
  });
}

export async function cancelAppointment(appointmentId: string, reason?: string) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "cancelled",
      notes: reason ? reason : undefined,
    },
    include: { service: true, customer: true },
  });
}
