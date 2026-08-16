import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  detail?: Prisma.InputJsonValue;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? undefined,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      detail: input.detail,
      ipAddress: input.ipAddress,
    },
  });
}
