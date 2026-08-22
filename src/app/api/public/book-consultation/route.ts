import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { createCustomer, findCustomerByPhoneOrEmail, addTimelineEvent } from "@/server/domain/customers";
import { notifyConsultationRequested } from "@/server/email/notifications";
import { signScheduleToken } from "@/server/booking/schedule-token";
import { publicSiteUrl } from "@/server/email/brand";
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

  const parts = body.name.trim().split(/\s+/);
  const firstName = parts[0] ?? body.name;
  const lastName = parts.slice(1).join(" ") || "Prospect";
  const interest = INTEREST_LABEL[body.serviceInterest];
  const moduleLine =
    body.serviceInterest === "bos" && body.modules.length ? `Modules: ${body.modules.join(", ")}` : null;
  const summary = [
    `Website consultation — ${interest}`,
    body.company ? `Company: ${body.company}` : null,
    moduleLine,
    body.goals ? `Goals: ${body.goals}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  let customerId: string | undefined;
  let leadId: string | undefined;
  let organizationId: string | undefined;

  try {
    const org = await getDemoOrganization();
    organizationId = org.id;
    const service =
      (await prisma.service.findFirst({
        where: { organizationId: org.id, slug: "consultation" },
      })) ?? (await prisma.service.findFirst({ where: { organizationId: org.id } }));

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
    customerId = customer.id;

    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        customerId: customer.id,
        serviceId: service?.id,
        source: "website",
        stage: "new",
        summary,
      },
    });
    leadId = lead.id;

    await addTimelineEvent({
      customerId: customer.id,
      type: "consultation_requested",
      title: "Consultation requested via website",
      detail: summary,
      channel: "web",
      refType: "lead",
      refId: lead.id,
    });

    await publishActivity({
      organizationId: org.id,
      type: "lead",
      title: "Consultation requested",
      detail: `${firstName} ${lastName} · ${interest}`,
      metadata: { customerId: customer.id, leadId: lead.id, channel: "website" },
    });
  } catch (err) {
    logger.warn("Consultation request was not saved to the database", { err });
  }

  const token = signScheduleToken({
    name: `${firstName} ${lastName}`.trim(),
    email: body.email,
    phone: body.phone,
    company: body.company,
    serviceInterest: body.serviceInterest,
    modules: body.modules,
    goals: body.goals,
    customerId,
    leadId,
    organizationId,
  });
  const scheduleUrl = `${publicSiteUrl()}/book/schedule?token=${encodeURIComponent(token)}`;

  try {
    await notifyConsultationRequested({
      customerName: `${firstName} ${lastName}`.trim(),
      customerEmail: body.email,
      customerPhone: body.phone,
      company: body.company,
      serviceName: "Consultation",
      details: summary,
      scheduleUrl,
    });
  } catch (err) {
    logger.warn("Consultation request email failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "We received your request but could not send email. Write to onyxwebsystems@gmail.com." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, leadId, scheduleUrl });
}
