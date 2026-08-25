import { prisma } from "@/server/db";

export async function recordWebIntake(input: {
  organizationId: string;
  customerId: string;
  subject: string;
  summary: string;
  intent?: string;
}) {
  return prisma.conversation.create({
    data: {
      organizationId: input.organizationId,
      customerId: input.customerId,
      channel: "web",
      status: "open",
      subject: input.subject,
      summary: input.summary,
      intent: input.intent ?? "lead",
      messages: {
        create: {
          direction: "inbound",
          senderType: "customer",
          body: input.summary,
        },
      },
    },
  });
}
