import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/server/logger";

const TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3";

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

export function isTikTokConfigured() {
  return Boolean(
    process.env.TIKTOK_APP_SECRET && process.env.TIKTOK_ACCESS_TOKEN && process.env.TIKTOK_BUSINESS_ACCOUNT_ID,
  );
}

/**
 * Official TikTok webhook signature: TikTok-Signature header `t=<unix>,s=<hex>`.
 * HMAC-SHA256 of `${t}.${rawBody}` keyed with the app secret.
 */
export function verifyTikTokSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret?: string;
  nowMs?: number;
  maxAgeMs?: number;
}) {
  const secret = input.appSecret ?? process.env.TIKTOK_APP_SECRET;
  if (!secret || !input.signatureHeader) return false;
  const parts = Object.fromEntries(
    input.signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.s;
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${input.rawBody}`, "utf8").digest("hex");
  if (!safeEqual(expected, signature)) return false;
  const maxAge = input.maxAgeMs ?? 5 * 60 * 1000;
  const age = Math.abs((input.nowMs ?? Date.now()) - Number(timestamp) * 1000);
  if (Number.isFinite(age) && age > maxAge) return false;
  return true;
}

export type TikTokInboundEvent = {
  senderId: string;
  conversationId: string;
  messageId: string;
  text: string;
  customerName?: string;
};

type TikTokWebhook = {
  event?: string;
  content?: string | Record<string, unknown>;
};

type TikTokContent = {
  unique_identifier?: string;
  from?: string;
  conversation_id?: string;
  message_id?: string;
  type?: string;
  text?: { body?: string } | string;
  from_user?: { id?: string; role?: string };
};

export function parseTikTokMessagingEvents(payload: unknown): TikTokInboundEvent[] {
  const body = payload as TikTokWebhook;
  const event = body.event ?? "";
  if (event && event !== "im_receive_msg" && event !== "im_receive_msg_eu") return [];

  let content: TikTokContent;
  try {
    content = typeof body.content === "string" ? (JSON.parse(body.content) as TikTokContent) : ((body.content ?? body) as TikTokContent);
  } catch {
    return [];
  }

  if (content.from_user?.role === "business_account") return [];

  const conversationId = content.conversation_id ?? "";
  const senderId = content.unique_identifier || content.from_user?.id || "";
  const messageId = content.message_id ?? "";
  const textBody = typeof content.text === "string" ? content.text : content.text?.body;
  const text =
    textBody?.trim() ||
    (content.type && content.type !== "text"
      ? "I sent a photo or video. Could you reply in text so we can help?"
      : "");
  if (!conversationId || !senderId || !text) return [];

  return [
    {
      senderId,
      conversationId,
      messageId,
      text,
      customerName: typeof content.from === "string" ? content.from : undefined,
    },
  ];
}

export async function sendTikTokMessage(input: { conversationId: string; body: string }) {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  const businessId = process.env.TIKTOK_BUSINESS_ACCOUNT_ID;
  if (!token || !businessId) {
    logger.warn("TikTok send skipped — missing TIKTOK_ACCESS_TOKEN or TIKTOK_BUSINESS_ACCOUNT_ID");
    return { ok: false, simulated: false, skipped: true as const, reason: "READY_FOR_INTEGRATION" };
  }
  if (!input.conversationId) {
    return { ok: false, simulated: false, skipped: true as const, reason: "missing_conversation_id" };
  }

  const res = await fetch(`${TIKTOK_API}/business/message/send/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": token,
    },
    body: JSON.stringify({
      business_id: businessId,
      message_type: "TEXT",
      recipient_type: "CONVERSATION",
      recipient: input.conversationId,
      text: input.body.slice(0, 2000),
    }),
    signal: AbortSignal.timeout(12000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    code?: number;
    message?: string;
    data?: { message?: { message_id?: string } };
  };
  if (!res.ok || (data.code !== undefined && data.code !== 0)) {
    logger.error("TikTok Business Messaging send failed", {
      status: res.status,
      code: data.code,
      message: data.message,
    });
    return {
      ok: false,
      simulated: false,
      skipped: false as const,
      reason: data.message || `tiktok_http_${res.status}`,
    };
  }
  return {
    ok: true,
    simulated: false,
    skipped: false as const,
    providerId: data.data?.message?.message_id,
  };
}
