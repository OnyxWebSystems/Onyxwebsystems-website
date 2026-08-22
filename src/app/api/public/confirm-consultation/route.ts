import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import { z } from "zod";
import { prisma } from "@/server/db";
import { verifyScheduleToken } from "@/server/booking/schedule-token";
import { CONSULTATION_MINUTES, googleSlotIsBookable } from "@/server/calendar/slots";
import { notifyConsultationBooked } from "@/server/email/notifications";
import { addTimelineEvent } from "@/server/domain/customers";
import { publishActivity } from "@/server/events";
import { rateLimit } from "@/server/security/rate-limit";
import { logger } from "@/server/logger";

const schema = z.object({
  token: z.string().min(20),
  startsAt: z.string().min(1),
});

export async function POST(req: Request) {
  const limited = rateLimit("public:confirm-consultation", 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid scheduling payload" }, { status: 400 });
  }

  const payload = verifyScheduleToken(body.token);
  if (!payload) {
    return NextResponse.json({ error: "This scheduling link is invalid or has expired." }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
  }

  const open = await googleSlotIsBookable(startsAt);
  if (!open) {
    return NextResponse.json(
      { error: "That time is no longer available. Please choose another slot." },
      { status: 409 },
    );
  }

  const endsAt = addMinutes(startsAt, CONSULTATION_MINUTES);
  const details = [
    `Website consultation — ${payload.serviceInterest}`,
    payload.company ? `Company: ${payload.company}` : null,
    payload.modules.length ? `Modules: ${payload.modules.join(", ")}` : null,
    payload.goals ? `Goals: ${payload.goals}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  let appointmentId: string | undefined;
  try {
    if (payload.organizationId && payload.customerId) {
      const service =
        (await prisma.service.findFirst({
          where: { organizationId: payload.organizationId, slug: "consultation" },
        })) ??
        (await prisma.service.findFirst({ where: { organizationId: payload.organizationId } }));
      const employee = await prisma.employee.findFirst({
        where: {
          organizationId: payload.organizationId,
          isActive: true,
          role: { in: ["consultant", "sales", "scheduler", "manager", "owner"] },
        },
      });
      if (service) {
        const appointment = await prisma.appointment.create({
          data: {
            organizationId: payload.organizationId,
            customerId: payload.customerId,
            serviceId: service.id,
            employeeId: employee?.id,
            startsAt,
            endsAt,
            status: "confirmed",
            notes: details,
            confirmationSent: true,
          },
        });
        appointmentId = appointment.id;
        await addTimelineEvent({
          customerId: payload.customerId,
          type: "appointment_booked",
          title: "Consultation time selected",
          detail: details,
          channel: "web",
          refType: "appointment",
          refId: appointment.id,
        });
        if (payload.leadId) {
          await prisma.lead.update({
            where: { id: payload.leadId },
            data: { stage: "contacted" },
          });
        }
        await publishActivity({
          organizationId: payload.organizationId,
          type: "appointment",
          title: "Consultation scheduled",
          detail: `${payload.name} selected a calendar slot`,
          metadata: {
            customerId: payload.customerId,
            appointmentId: appointment.id,
            channel: "website",
          },
        });
      }
    }
  } catch (err) {
    logger.warn("Scheduled consultation was not saved to the database", { err });
  }

  try {
    await notifyConsultationBooked({
      customerName: payload.name,
      customerEmail: payload.email,
      customerPhone: payload.phone,
      company: payload.company,
      serviceName: "Consultation",
      startsAt,
      endsAt,
      details,
      appointmentId,
      organizationId: payload.organizationId,
    });
  } catch (err) {
    logger.warn("Consultation confirmation email failed", { err });
  }

  return NextResponse.json({
    ok: true,
    appointmentId,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });
}
