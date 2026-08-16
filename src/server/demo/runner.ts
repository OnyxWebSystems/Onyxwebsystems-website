import { prisma } from "@/server/db";
import { processInbound, type InboundMessage } from "@/server/orchestration/process";
import { DEMO_SCENARIOS } from "./scenarios";
import { logger } from "@/server/logger";

export async function getDemoOrganization() {
  const org =
    (await prisma.organization.findFirst({ where: { slug: "onyx-web-systems" } })) ??
    (await prisma.organization.findFirst());
  if (!org) throw new Error("Demo organization not seeded — run npm run db:seed");
  return org;
}

export async function runDemoScenario(scenarioKey: string) {
  const scenario = DEMO_SCENARIOS.find((s) => s.key === scenarioKey);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioKey}`);

  const org = await getDemoOrganization();
  const run = await prisma.demoRun.create({
    data: {
      organizationId: org.id,
      scenarioKey,
      status: "running",
    },
  });

  const results = [];
  for (const beat of scenario.beats) {
    if (beat.delayMs > 0) {
      await new Promise((r) => setTimeout(r, beat.delayMs));
    }
    if (beat.action === "inbound") {
      const payload = beat.payload as Partial<InboundMessage>;
      const result = await processInbound({
        organizationId: org.id,
        channel: (payload.channel as InboundMessage["channel"]) ?? "phone",
        text: String(payload.text ?? ""),
        from: (payload.from as string) ?? null,
        email: (payload.email as string) ?? null,
        customerName: (payload.customerName as string) ?? null,
        subject: (payload.subject as string) ?? null,
        isMissedCall: Boolean(payload.isMissedCall),
        outdoorTempF: (payload.outdoorTempF as number) ?? null,
        simulateAfterHours: Boolean(payload.simulateAfterHours),
      });
      results.push(result);
    }
  }

  await prisma.demoRun.update({
    where: { id: run.id },
    data: { status: "completed", completedAt: new Date(), metadata: { results } },
  });

  logger.info("Demo scenario completed", { scenarioKey });
  return { runId: run.id, scenario, results };
}

export async function resetDemo() {
  const org = await getDemoOrganization();

  // Delete runtime operational data but keep seed customers/services/KB structure
  await prisma.$transaction([
    prisma.message.deleteMany({ where: { conversation: { organizationId: org.id } } }),
    prisma.callSession.deleteMany({ where: { conversation: { organizationId: org.id } } }),
    prisma.escalation.deleteMany({
      where: { OR: [{ conversation: { organizationId: org.id } }, { ticket: { organizationId: org.id } }] },
    }),
    prisma.timelineEvent.deleteMany({ where: { customer: { organizationId: org.id } } }),
    prisma.followUp.deleteMany({ where: { organizationId: org.id } }),
    prisma.activityEvent.deleteMany({ where: { organizationId: org.id } }),
    prisma.demoRun.deleteMany({ where: { organizationId: org.id } }),
    prisma.ticket.deleteMany({ where: { organizationId: org.id } }),
    prisma.appointment.deleteMany({ where: { organizationId: org.id } }),
    prisma.lead.deleteMany({ where: { organizationId: org.id } }),
    prisma.conversation.deleteMany({ where: { organizationId: org.id } }),
  ]);

  const { reseedRuntimeDemoData } = await import("./reseed");
  await reseedRuntimeDemoData(org.id);

  await prisma.demoRun.create({
    data: { organizationId: org.id, scenarioKey: "reset", status: "completed", completedAt: new Date() },
  });

  return { ok: true };
}
