import { createHmac, timingSafeEqual } from "crypto";

/**
 * Validate Twilio X-Twilio-Signature.
 * @see https://www.twilio.com/docs/usage/security#validating-requests
 */
export function verifyTwilioSignature(input: {
  authToken: string;
  signature: string | null;
  url: string;
  params: Record<string, string>;
}): boolean {
  if (!input.signature) return false;

  const sorted = Object.keys(input.params)
    .sort()
    .reduce((acc, key) => acc + key + input.params[key], "");

  const data = input.url + sorted;
  const expected = createHmac("sha1", input.authToken).update(data, "utf8").digest("base64");

  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(input.signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function twilioWebhookUrl(req: Request): string {
  const configured = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return `${configured.replace(/\/$/, "")}/api/webhooks/twilio`;
  }
  return req.url.split("?")[0];
}

export function detectTwilioChannel(from: string): "whatsapp" | "sms" {
  return from.toLowerCase().startsWith("whatsapp:") ? "whatsapp" : "sms";
}

export function stripWhatsappPrefix(from: string): string {
  return from.replace(/^whatsapp:/i, "");
}
