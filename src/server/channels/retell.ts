import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/server/logger";

export type RetellStatus = "SIMULATED" | "CONNECTED" | "READY_FOR_INTEGRATION";

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

export function getRetellStatus(): RetellStatus {
  if (process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID) {
    return "CONNECTED";
  }
  return "READY_FOR_INTEGRATION";
}

/**
 * Verify Retell webhooks / custom-function posts.
 * Accepts:
 * - shared secret via x-retell-secret, authorization bearer, or ?secret=
 * - Retell HMAC `x-retell-signature` (`v={ts},d={hex}`) using RETELL_WEBHOOK_SECRET or RETELL_API_KEY
 * Dev: RETELL_SKIP_SIGNATURE_VERIFY=true bypasses checks.
 */
export function verifyRetellWebhook(req: Request, rawBody: string): boolean {
  if (process.env.RETELL_SKIP_SIGNATURE_VERIFY === "true") return true;

  const sharedSecret =
    process.env.RETELL_TOOL_SECRET || process.env.RETELL_WEBHOOK_SECRET || "";

  const headerSecret =
    req.headers.get("x-retell-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    new URL(req.url).searchParams.get("secret");

  if (sharedSecret && headerSecret && safeEqual(headerSecret, sharedSecret)) {
    return true;
  }

  const signature =
    req.headers.get("x-retell-signature") || req.headers.get("X-Retell-Signature");
  const hmacKey = process.env.RETELL_WEBHOOK_SECRET || process.env.RETELL_API_KEY;
  if (signature && hmacKey && verifyRetellHmac(rawBody, hmacKey, signature)) {
    return true;
  }

  logger.warn("Retell webhook signature verification failed");
  return false;
}

function verifyRetellHmac(rawBody: string, apiKey: string, signature: string): boolean {
  const match = signature.match(/v=(\d+),d=(.*)/);
  if (!match) {
    // Plain shared-secret style header fallback
    if (safeEqual(signature, apiKey)) return true;
    const expectedPlain = createHmac("sha256", apiKey).update(rawBody).digest("hex");
    return safeEqual(signature.replace(/^sha256=/, ""), expectedPlain);
  }

  const timestamp = match[1]!;
  const digest = match[2]!;
  const now = Date.now();
  if (Math.abs(now - Number(timestamp)) > 5 * 60 * 1000) return false;

  const expected = createHmac("sha256", apiKey)
    .update(rawBody + timestamp)
    .digest("hex");
  return safeEqual(expected, digest);
}

export async function createOutboundRetellCall(phoneNumber: string) {
  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;
  const fromNumber = process.env.RETELL_PHONE_NUMBER;
  if (!apiKey || !agentId) {
    throw new Error("Retell is not CONNECTED — set RETELL_API_KEY and RETELL_AGENT_ID");
  }
  if (!fromNumber) {
    throw new Error("RETELL_PHONE_NUMBER is required for outbound calls");
  }

  const res = await fetch("https://api.retellai.com/v2/create-phone-call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from_number: fromNumber,
      to_number: phoneNumber,
      override_agent_id: agentId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("Retell outbound call failed", { status: res.status, text });
    throw new Error("Failed to start Retell call");
  }

  return res.json();
}
