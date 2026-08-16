import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { bookAppointment } from "@/server/booking/engine";
import { createCustomer, findCustomerByPhoneOrEmail, addTimelineEvent } from "@/server/domain/customers";
import { sendAppointmentConfirmationEmail } from "@/server/channels/dispatch";
import { publishActivity } from "@/server/events";
import { rateLimit } from "@/server/security/rate-limit";
import { logger } from "@/server/logger";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  company: z.string().max(120).optional().nullable(),
  serviceInterest: z.enum(["bos", "app", "web"]),
  modules: z.array(z.string()).default([]),
  goals: z.string().max(4000).optional().nullable(),
  startsAt: z.string().min(1),
  employeeId: z.string().min(1),
});

const INTEREST_LABEL: Record<string, string> = {
  bos: "Business Operating Systems",
  app: "App Development",
  web: "Web Development",
};

export async function POST(req: Request) {
  const limited = rateLimit("public:book", 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid booking payload" }, { status: 400 });
  }

  const org = await getDemoOrganization();
  const service =
    (await prisma.service.findFirst({
      where: { organizationId: org.id, slug: "consultation" },
    })) ??
    (await prisma.service.findFirst({ where: { organizationId: org.id } }));

  if (!service) {
    return NextResponse.json({ error: "Consultation service not configured" }, { status: 503 });
  }

  const parts = body.name.trim().split(/\s+/);
  const firstName = parts[0] ?? body.name;
  const lastName = parts.slice(1).join(" ") || "Prospect";

  let customer = await findCustomerByPhoneOrEmail(org.id, body.phone, body.email);
  if (!customer) {
    customer = await createCustomer({
      organizationId: org.id,
      firstName,
      lastName,
      email: body.email,
      phone: body.phone,
      customerType: "lead",
    });
    if (body.company) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { notes: `Company: ${body.company}` },
      });
    }
  }

  const interest = INTEREST_LABEL[body.serviceInterest];
  const moduleLine =
    body.serviceInterest === "bos" && body.modules.length
      ? `Modules: ${body.modules.join(", ")}`
      : null;
  const summary = [
    `Website consultation — ${interest}`,
    body.company ? `Company: ${body.company}` : null,
    moduleLine,
    body.goals ? `Goals: ${body.goals}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const appointment = await bookAppointment({
    organizationId: org.id,
    customerId: customer.id,
    serviceId: service.id,
    employeeId: body.employeeId,
    startsAt: new Date(body.startsAt),
    notes: summary,
  });

  await prisma.lead.create({
    data: {
      organizationId: org.id,
      customerId: customer.id,
      serviceId: service.id,
      source: "website",
      stage: "new",
      summary,
    },
  });

  await addTimelineEvent({
    customerId: customer.id,
    type: "appointment_booked",
    title: "Consultation booked via website",
    detail: summary,
    channel: "web",
    refType: "appointment",
    refId: appointment.id,
  });

  try {
    await sendAppointmentConfirmationEmail({
      toEmail: body.email,
      customerName: `${firstName} ${lastName}`,
      serviceName: "Consultation",
      startsAt: appointment.startsAt,
      technicianName: appointment.employee?.name,
    });
  } catch (err) {
    logger.warn("Consultation confirmation email failed", { err });
  }

  const notify = process.env.ONYX_NOTIFY_EMAIL || org.email;
  if (notify) {
    try {
      await sendAppointmentConfirmationEmail({
        toEmail: notify,
        customerName: "Onyx team",
        serviceName: `New consult — ${firstName} ${lastName}`,
        startsAt: appointment.startsAt,
        address: summary.slice(0, 500),
      });
    } catch (err) {
      logger.warn("Onyx notify email failed", { err });
    }
  }

  await publishActivity({
    organizationId: org.id,
    type: "appointment",
    title: "Consultation booked",
    detail: `${firstName} ${lastName} · ${interest}`,
    metadata: {
      customerId: customer.id,
      appointmentId: appointment.id,
      channel: "website",
    },
  });

  return NextResponse.json({
    ok: true,
    appointmentId: appointment.id,
    startsAt: appointment.startsAt.toISOString(),
  });
}
