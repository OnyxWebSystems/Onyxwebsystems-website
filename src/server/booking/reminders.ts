import { prisma } from "@/server/db";
import { notifyConsultationReminder } from "@/server/email/notifications";
import { logger } from "@/server/logger";

export const REMINDER_OFFSETS = [
  { key: "5d" as const, ms: 5 * 24 * 60 * 60 * 1000, catchUpMs: 18 * 60 * 60 * 1000 },
  { key: "3d" as const, ms: 3 * 24 * 60 * 60 * 1000, catchUpMs: 18 * 60 * 60 * 1000 },
  { key: "1d" as const, ms: 24 * 60 * 60 * 1000, catchUpMs: 6 * 60 * 60 * 1000 },
  { key: "1h" as const, ms: 60 * 60 * 1000, catchUpMs: 20 * 60 * 1000 },
  { key: "15m" as const, ms: 15 * 60 * 1000, catchUpMs: 10 * 60 * 1000 },
];

type ReminderKey = (typeof REMINDER_OFFSETS)[number]["key"];

export async function processConsultationReminders(now = new Date()) {
  const horizon = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const appointments = await prisma.appointment.findMany({
    where: {
      status: { in: ["scheduled", "confirmed"] },
      startsAt: { gt: now, lte: horizon },
    },
    include: { customer: true },
  });

  let sent = 0;
  for (const appointment of appointments) {
    if (!appointment.customer.email) continue;
    const already = (appointment.remindersSent as Record<string, string> | null) ?? {};
    const next: Record<string, string> = { ...already };

    for (const offset of REMINDER_OFFSETS) {
      if (next[offset.key]) continue;
      const dueAt = new Date(appointment.startsAt.getTime() - offset.ms);
      if (dueAt.getTime() < appointment.createdAt.getTime() - 60_000) continue;
      if (now.getTime() < dueAt.getTime()) continue;
      if (now.getTime() > dueAt.getTime() + offset.catchUpMs) continue;

      try {
        await notifyConsultationReminder({
          customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`.trim(),
          customerEmail: appointment.customer.email,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          appointmentId: appointment.id,
          guestTimeZone: appointment.guestTimeZone,
          kind: offset.key,
        });
        next[offset.key] = now.toISOString();
        sent += 1;
      } catch (error) {
        logger.warn("Consultation reminder failed", {
          appointmentId: appointment.id,
          kind: offset.key as ReminderKey,
          error: String(error),
        });
      }
    }

    if (Object.keys(next).length !== Object.keys(already).length) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { remindersSent: next },
      });
    }
  }

  return { scanned: appointments.length, sent };
}
