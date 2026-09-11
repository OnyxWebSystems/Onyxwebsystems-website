import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

export async function findMessageByProviderId(providerId: string) {
  if (!providerId) return null;
  return prisma.message.findFirst({
    where: {
      metadata: {
        path: ["providerId"],
        equals: providerId,
      },
    },
  });
}

export async function tagLatestInbound(conversationId: string, metadata: Prisma.InputJsonValue) {
  const inbound = await prisma.message.findFirst({
    where: { conversationId, direction: "inbound" },
    orderBy: { createdAt: "desc" },
  });
  if (!inbound) return null;
  await prisma.message.update({
    where: { id: inbound.id },
    data: { metadata },
  });
  return inbound;
}

export async function tagLatestOutbound(conversationId: string, metadata: Record<string, string>) {
  const outbound = await prisma.message.findFirst({
    where: { conversationId, direction: "outbound" },
    orderBy: { createdAt: "desc" },
  });
  if (!outbound) return null;
  const current = (outbound.metadata ?? {}) as Record<string, string>;
  await prisma.message.update({
    where: { id: outbound.id },
    data: { metadata: { ...current, ...metadata } },
  });
  return outbound;
}

export function alreadyDelivered(metadata: unknown) {
  const meta = (metadata ?? {}) as { providerId?: string };
  return Boolean(meta.providerId && !meta.providerId.startsWith("sim_"));
}
