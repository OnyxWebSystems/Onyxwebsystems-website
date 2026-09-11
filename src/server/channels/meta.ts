import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/server/logger";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function safeEqual(a: string, b: string) {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function isMetaConfigured() {
  return Boolean(
    process.env.META_APP_SECRET && process.env.META_VERIFY_TOKEN && process.env.META_PAGE_ACCESS_TOKEN,
  );
}

export function isMetaReceiveConfigured() {
  return Boolean(process.env.META_APP_SECRET && process.env.META_VERIFY_TOKEN);
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret = process.env.META_APP_SECRET) {
  if (!appSecret || !signatureHeader) return false;
  const provided = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  return safeEqual(expected, provided);
}

export type MetaInboundEvent = {
  channel: "instagram" | "facebook";
  senderId: string;
  text: string;
  mid: string;
  customerName?: string;
};

type MetaMessaging = {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    is_self?: boolean;
    attachments?: unknown[];
  };
  postback?: { payload?: string; title?: string; mid?: string };
};

type MetaPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    messaging?: MetaMessaging[];
    changes?: Array<{ field?: string; value?: { messaging?: MetaMessaging[] } }>;
  }>;
};

export function parseMetaMessagingEvents(payload: unknown): MetaInboundEvent[] {
  const body = payload as MetaPayload;
  const events: MetaInboundEvent[] = [];
  const objectType = body.object;
  const channel: "instagram" | "facebook" | null =
    objectType === "instagram" ? "instagram" : objectType === "page" ? "facebook" : null;
  if (!channel) return events;

  for (const entry of body.entry ?? []) {
    const messaging = [
      ...(entry.messaging ?? []),
      ...((entry.changes ?? []).flatMap((change) => change.value?.messaging ?? [])),
    ];
    for (const item of messaging) {
      if (item.message?.is_echo || item.message?.is_self) continue;
      const senderId = item.sender?.id;
      if (!senderId) continue;
      const mid = item.message?.mid || item.postback?.mid || "";
      const text =
        item.message?.text?.trim() ||
        item.postback?.title?.trim() ||
        item.postback?.payload?.trim() ||
        (item.message?.attachments?.length ? "I sent a photo or video. Could you reply in text so we can help?" : "");
      if (!text) continue;
      events.push({ channel, senderId, text, mid });
    }
  }
  return events;
}

export async function sendMetaMessage(input: { to: string; body: string }) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    logger.warn("Meta send skipped — META_PAGE_ACCESS_TOKEN missing");
    return { ok: false, simulated: false, skipped: true as const, reason: "READY_FOR_INTEGRATION" };
  }

  const res = await fetch(`${GRAPH_BASE}/me/messages?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: input.to },
      messaging_type: "RESPONSE",
      message: { text: input.body.slice(0, 2000) },
    }),
    signal: AbortSignal.timeout(12000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message_id?: string;
    error?: { message?: string; code?: number; type?: string };
  };
  if (!res.ok || data.error) {
    logger.error("Meta Graph send failed", {
      status: res.status,
      code: data.error?.code,
      type: data.error?.type,
      message: data.error?.message,
    });
    return {
      ok: false,
      simulated: false,
      skipped: false as const,
      reason: data.error?.message || `graph_http_${res.status}`,
    };
  }
  return { ok: true, simulated: false, skipped: false as const, providerId: data.message_id };
}
