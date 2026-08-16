import { EventEmitter } from "events";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { logger } from "./logger";

export type ActivityMetadata = {
  customerId?: string | null;
  conversationId?: string | null;
  channel?: string | null;
  appointmentId?: string | null;
  ticketId?: string | null;
  callId?: string | null;
  [key: string]: unknown;
};

type ActivityPayload = {
  organizationId: string;
  type: string;
  title: string;
  detail?: string;
  severity?: string;
  metadata?: ActivityMetadata;
};

const bus = new EventEmitter();
bus.setMaxListeners(100);

export function subscribeActivity(
  listener: (event: ActivityPayload & { id: string; createdAt: Date }) => void,
) {
  bus.on("activity", listener);
  return () => bus.off("activity", listener);
}

export async function publishActivity(payload: ActivityPayload) {
  try {
    const event = await prisma.activityEvent.create({
      data: {
        organizationId: payload.organizationId,
        type: payload.type,
        title: payload.title,
        detail: payload.detail,
        severity: payload.severity ?? "info",
        metadata: (payload.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
    bus.emit("activity", {
      id: event.id,
      organizationId: event.organizationId,
      type: event.type,
      title: event.title,
      detail: event.detail ?? undefined,
      severity: event.severity,
      metadata: (event.metadata as Prisma.InputJsonValue) ?? undefined,
      createdAt: event.createdAt,
    });
    return event;
  } catch (error) {
    logger.error("Failed to publish activity", { error: String(error) });
    throw error;
  }
}
