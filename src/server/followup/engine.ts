import { addDays, addHours } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { logger } from "@/server/logger";

const MAX_FOLLOWUPS_PER_WEEK = 3;

export async function scheduleFollowUp(input: {
  organizationId: string;
  customerId: string;
  type: string;
  channel: string;
  scheduledFor?: Date;
  payload?: Prisma.InputJsonValue;
}) {
  const weekAgo = addDays(new Date(), -7);
  const recent = await prisma.followUp.count({
    where: {
      customerId: input.customerId,
      createdAt: { gte: weekAgo },
      status: { in: ["pending", "sent"] },
    },
  });

  if (recent >= MAX_FOLLOWUPS_PER_WEEK) {
    logger.info("Follow-up suppressed by frequency cap", { customerId: input.customerId });
    return null;
  }

  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  const prefs = (customer?.preferences as { reminders?: boolean; channel?: string } | null) ?? {};
  if (prefs.reminders === false && input.type === "reminder") {
    return null;
  }

  return prisma.followUp.create({
    data: {
      organizationId: input.organizationId,
      customerId: input.customerId,
      type: input.type,
      channel: prefs.channel ?? input.channel,
      scheduledFor: input.scheduledFor ?? addHours(new Date(), 4),
      payload: input.payload,
      status: "pending",
    },
  });
}

export async function processDueFollowUps(organizationId: string) {
  const due = await prisma.followUp.findMany({
    where: {
      organizationId,
      status: "pending",
      scheduledFor: { lte: new Date() },
    },
    take: 50,
    include: { customer: true },
  });

  for (const item of due) {
    await prisma.followUp.update({
      where: { id: item.id },
      data: { status: "sent", sentAt: new Date() },
    });
    logger.info("Follow-up marked sent (demo)", { followUpId: item.id, type: item.type });
  }

  return due.length;
}
