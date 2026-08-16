import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/server/logger";

export type VapiStatus = "SIMULATED" | "CONNECTED" | "READY_FOR_INTEGRATION";

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

export function getVapiStatus(): VapiStatus {
  if (
    process.env.VAPI_API_KEY &&
    process.env.VAPI_ASSISTANT_ID &&
    process.env.VAPI_PHONE_NUMBER_ID
  ) {
    return "CONNECTED";
  }
  return "READY_FOR_INTEGRATION";
}

/**
 * Accept either shared-secret header/query or HMAC if VAPI_WEBHOOK_SECRET is set.
 * In development, VAPI_SKIP_SIGNATURE_VERIFY=true bypasses checks.
 */
export function verifyVapiWebhook(req: Request, rawBody: string): boolean {
  if (process.env.VAPI_SKIP_SIGNATURE_VERIFY === "true") return true;

  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("VAPI_WEBHOOK_SECRET not set — rejecting webhook");
    return false;
  }

  const headerSecret =
    req.headers.get("x-vapi-secret") ||
    req.headers.get("x-vapi-signature") ||
    new URL(req.url).searchParams.get("secret");

  if (headerSecret && safeEqual(headerSecret, secret)) return true;

  const hmacHeader = req.headers.get("x-vapi-signature-256");
  if (hmacHeader) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return safeEqual(hmacHeader.replace(/^sha256=/, ""), expected);
  }

  return false;
}

export async function createOutboundVapiCall(phoneNumber: string) {
  const apiKey = process.env.VAPI_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  if (!apiKey || !assistantId || !phoneNumberId) {
    throw new Error("Vapi is not CONNECTED — set VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID");
  }

  const res = await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: { number: phoneNumber },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("Vapi outbound call failed", { status: res.status, text });
    throw new Error("Failed to start Vapi call");
  }

  return res.json();
}
