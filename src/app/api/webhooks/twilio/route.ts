import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { logger } from "@/server/logger";
import { rateLimit } from "@/server/security/rate-limit";
import { getDemoOrganization } from "@/server/demo/runner";
import { processInbound } from "@/server/orchestration/process";
import { sendChannelReply } from "@/server/channels/dispatch";
import {
  detectTwilioChannel,
  stripWhatsappPrefix,
  twilioWebhookUrl,
  verifyTwilioSignature,
} from "@/server/channels/twilio-signature";

export const runtime = "nodejs";
export const maxDuration = 60;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function emptyTwiml() {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: Request) {
  const limited = rateLimit("webhook:twilio", 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken || !process.env.TWILIO_ACCOUNT_SID) {
    logger.warn("Twilio webhook hit while READY_FOR_INTEGRATION");
    return NextResponse.json(
      {
        status: "READY_FOR_INTEGRATION",
        message: "Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
      },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((value, key) => {
    params[key] = String(value);
  });

  const signature = req.headers.get("x-twilio-signature");
  const url = twilioWebhookUrl(req);
  const skipVerify = process.env.TWILIO_SKIP_SIGNATURE_VERIFY === "true";

  if (!skipVerify && !verifyTwilioSignature({ authToken, signature, url, params })) {
    logger.warn("Twilio signature verification failed", { url });
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const messageSid = params.MessageSid || params.SmsSid || "";
  const fromRaw = params.From || "";
  const toRaw = params.To || "";
  const body = params.Body || "";
  const profileName = params.ProfileName?.trim() || "";

  if (!fromRaw || !body) {
    return emptyTwiml();
  }

  const channel = detectTwilioChannel(fromRaw);
  const from = stripWhatsappPrefix(fromRaw);
  const inboundTo = stripWhatsappPrefix(toRaw);
  const senderFrom = inboundTo || process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_SMS_FROM || "";

  if (messageSid) {
    const existing = await prisma.message.findFirst({
      where: {
        metadata: {
          path: ["providerId"],
          equals: messageSid,
        },
      },
    });
    if (existing) {
      logger.info("Duplicate Twilio webhook — retrying unsent outbound if needed", { messageSid });
      if (channel === "whatsapp" || channel === "sms") {
        await deliverStoredReply({
          conversationId: existing.conversationId,
          channel,
          to: from,
          senderFrom,
        });
      }
      return emptyTwiml();
    }
  }

  const org = await getDemoOrganization();

  try {
    const result = await processInbound({
      organizationId: org.id,
      channel,
      from,
      text: body,
      customerName: profileName || undefined,
      isLiveChannel: true,
      dispatchLiveOutbound: false,
    });

    if (messageSid) {
      const inbound = await prisma.message.findFirst({
        where: { conversationId: result.conversationId, direction: "inbound" },
        orderBy: { createdAt: "desc" },
      });
      if (inbound) {
        await prisma.message.update({
          where: { id: inbound.id },
          data: {
            metadata: {
              provider: "twilio",
              providerId: messageSid,
              channel,
            },
          },
        });
      }
    }

    // Trial Try out WhatsApp ignores TwiML. Delivery is ContentSid REST only.
    if (channel === "whatsapp") {
      await deliverOutbound({
        conversationId: result.conversationId,
        channel: "whatsapp",
        to: from,
        senderFrom,
        body: result.reply,
      });
      return emptyTwiml();
    }

    const delivered = await deliverOutbound({
      conversationId: result.conversationId,
      channel,
      to: from,
      senderFrom,
      body: result.reply,
    });

    if (delivered) return emptyTwiml();

    const twiml = twimlReply(channel, from, result.reply, senderFrom);
    logger.info("Twilio TwiML fallback reply", { channel, to: from, from: senderFrom });
    return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (error) {
    logger.error("Twilio inbound processing failed", { error: String(error) });
    if (channel === "whatsapp") return emptyTwiml();
    const fallback =
      "Thanks for contacting Onyx Web Systems. We're having a brief issue — please try again shortly or call us.";
    return new NextResponse(twimlReply(channel, from, fallback, senderFrom), {
      headers: { "Content-Type": "text/xml" },
      status: 200,
    });
  }
}

async function deliverStoredReply(input: {
  conversationId: string;
  channel: "whatsapp" | "sms";
  to: string;
  senderFrom: string;
}) {
  const outbound = await prisma.message.findFirst({
    where: { conversationId: input.conversationId, direction: "outbound" },
    orderBy: { createdAt: "desc" },
  });
  if (!outbound?.body) return false;
  const meta = (outbound.metadata ?? {}) as { providerId?: string };
  if (meta.providerId && !meta.providerId.startsWith("sim_")) return true;
  return deliverOutbound({
    conversationId: input.conversationId,
    channel: input.channel,
    to: input.to,
    senderFrom: input.senderFrom,
    body: outbound.body,
    messageId: outbound.id,
  });
}

async function deliverOutbound(input: {
  conversationId: string;
  channel: "whatsapp" | "sms";
  to: string;
  senderFrom: string;
  body: string;
  messageId?: string;
}) {
  try {
    const sent = await sendChannelReply({
      channel: input.channel,
      to: input.to,
      from: input.senderFrom || undefined,
      body: input.body,
    });
    const providerId = "providerId" in sent ? sent.providerId : undefined;
    logger.info("Twilio REST reply result", {
      channel: input.channel,
      simulated: sent.simulated,
      skipped: "skipped" in sent ? sent.skipped : false,
      providerId,
      to: input.to,
      from: input.senderFrom,
    });
    if (sent.simulated || ("skipped" in sent && sent.skipped) || !sent.ok) return false;

    await tagOutbound(input, {
      provider: "twilio",
      providerId,
      channel: input.channel,
      sendStatus: "accepted",
    });
    return Boolean(providerId);
  } catch (error) {
    logger.error("Twilio REST reply failed", { error: String(error) });
    await tagOutbound(input, {
      provider: "twilio",
      channel: input.channel,
      sendStatus: "failed",
      errorMessage: String(error),
    });
    return false;
  }
}

async function tagOutbound(
  input: { conversationId: string; messageId?: string },
  metadata: Prisma.InputJsonValue,
) {
  if (input.messageId) {
    await prisma.message.update({ where: { id: input.messageId }, data: { metadata } });
    return;
  }
  const outbound = await prisma.message.findFirst({
    where: { conversationId: input.conversationId, direction: "outbound" },
    orderBy: { createdAt: "desc" },
  });
  if (outbound) {
    await prisma.message.update({ where: { id: outbound.id }, data: { metadata } });
  }
}

function bareWhatsAppTwiml(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(body)}</Message></Response>`;
}

function twimlReply(channel: "whatsapp" | "sms", to: string, body: string, senderFrom: string) {
  if (channel === "whatsapp") return bareWhatsAppTwiml(body);
  const from = senderFrom || process.env.TWILIO_SMS_FROM || "";
  const fromAttr = from ? ` from="${escapeXml(from)}"` : "";
  const toAttr = to ? ` to="${escapeXml(to)}"` : "";
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message${fromAttr}${toAttr}>${escapeXml(body)}</Message></Response>`;
}
