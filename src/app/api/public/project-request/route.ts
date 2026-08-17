import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { createCustomer, findCustomerByPhoneOrEmail, addTimelineEvent } from "@/server/domain/customers";
import { notifyProjectRequest } from "@/server/email/notifications";
import { publishActivity } from "@/server/events";
import { rateLimit } from "@/server/security/rate-limit";
import { logger } from "@/server/logger";

const schema = z.object({
  lookingFor: z.enum(["bos", "website", "application", "custom", "not-sure"]),
  modules: z.array(z.string()).default([]),
  problem: z.string().min(8).max(4000),
  company: z.string().min(1).max(120),
  industry: z.string().max(120).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
  teamSize: z.string().min(1).max(40),
  timeline: z.enum(["asap", "1-3-months", "3-6-months", "exploring"]),
  investment: z.enum(["under-5k", "5k-10k", "10k-25k", "25k-plus", "not-sure"]),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
});

const LOOKING_LABEL: Record<string, string> = {
  bos: "Business Operating System",
  website: "Website",
  application: "Application",
  custom: "Custom System",
  "not-sure": "Not Sure",
};

const TIMELINE_LABEL: Record<string, string> = {
  asap: "ASAP",
  "1-3-months": "1–3 months",
  "3-6-months": "3–6 months",
  exploring: "Exploring",
};

const INVESTMENT_LABEL: Record<string, string> = {
  "under-5k": "Under $5K",
  "5k-10k": "$5K–$10K",
  "10k-25k": "$10K–$25K",
  "25k-plus": "$25K+",
  "not-sure": "Not sure",
};

const INVESTMENT_CENTS: Record<string, number | null> = {
  "under-5k": 250000,
  "5k-10k": 750000,
  "10k-25k": 1750000,
  "25k-plus": 2500000,
  "not-sure": null,
};

export async function POST(req: Request) {
  const limited = rateLimit("public:project-request", 12, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid project request" }, { status: 400 });
  }

  let org;
  try {
    org = await getDemoOrganization();
  } catch {
    return NextResponse.json({ error: "Project intake is temporarily unavailable" }, { status: 503 });
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
  }

  const interest = LOOKING_LABEL[body.lookingFor];
  const moduleLine =
    body.lookingFor === "bos" && body.modules.length ? `Modules: ${body.modules.join(", ")}` : null;
  const summary = [
    `Services page project request — ${interest}`,
    `Company: ${body.company}`,
    body.industry ? `Industry: ${body.industry}` : null,
    body.website ? `Website: ${body.website}` : null,
    `Team size: ${body.teamSize}`,
    `Timeline: ${TIMELINE_LABEL[body.timeline]}`,
    `Investment: ${INVESTMENT_LABEL[body.investment]}`,
    moduleLine,
    `Problem: ${body.problem}`,
  ]
    .filter(Boolean)
    .join("\n");

  const notes = [customer.notes, summary].filter(Boolean).join("\n\n");
  await prisma.customer.update({
    where: { id: customer.id },
    data: { notes },
  });

  const lead = await prisma.lead.create({
    data: {
      organizationId: org.id,
      customerId: customer.id,
      source: "website-services",
      stage: "new",
      summary,
      estimatedValueCents: INVESTMENT_CENTS[body.investment] ?? undefined,
    },
  });

  await addTimelineEvent({
    customerId: customer.id,
    type: "project_request",
    title: "Project request via services page",
    detail: summary,
    channel: "web",
    refType: "lead",
    refId: lead.id,
  });

  try {
    await notifyProjectRequest({
      customerName: `${firstName} ${lastName}`,
      customerEmail: body.email,
      customerPhone: body.phone,
      company: body.company,
      lookingFor: interest,
      summary,
      organizationId: org.id,
    });
  } catch (err) {
    logger.warn("Project request email failed", { err });
  }

  await publishActivity({
    organizationId: org.id,
    type: "lead",
    title: "Project request received",
    detail: `${firstName} ${lastName} · ${interest}`,
    metadata: {
      customerId: customer.id,
      leadId: lead.id,
      channel: "website-services",
    },
  });

  return NextResponse.json({ ok: true, leadId: lead.id });
}
