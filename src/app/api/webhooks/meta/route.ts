import { NextResponse } from "next/server";
import { logger } from "@/server/logger";
import { rateLimit } from "@/server/security/rate-limit";
import { getDemoOrganization } from "@/server/demo/runner";
import { processInbound } from "@/server/orchestration/process";
import { sendChannelReply } from "@/server/channels/dispatch";
import {
  isMetaReceiveConfigured,
  parseMetaMessagingEvents,
  verifyMetaSignature,
} from "@/server/channels/meta";
import {
  alreadyDelivered,
  findMessageByProviderId,
  tagLatestInbound,
  tagLatestOutbound,
} from "@/server/channels/inbound-dedupe";
import { socialAiRepliesEnabled } from "@/server/messaging/front-desk";
import { prisma } from "@/server/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const verifyToken = process.env.META_VERIFY_TOKEN;
  if (!verifyToken) {
    return NextResponse.json(
      { status: "READY_FOR_INTEGRATION", message: "Configure META_VERIFY_TOKEN." },
      { status: 503 },
    );
  }
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const limited = rateLimit("webhook:meta", 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  if (!isMetaReceiveConfigured()) {
    logger.warn("Meta webhook hit while READY_FOR_INTEGRATION");
    return NextResponse.json(
      {
        status: "READY_FOR_INTEGRATION",
        message: "Configure META_APP_SECRET and META_VERIFY_TOKEN.",
      },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const skipVerify = process.env.META_SKIP_SIGNATURE_VERIFY === "true";
  if (!skipVerify && !verifyMetaSignature(rawBody, signature)) {
    logger.warn("Meta signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = parseMetaMessagingEvents(payload);
  if (!events.length) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const org = await getDemoOrganization();

  for (const event of events) {
    try {
      if (event.mid) {
        const existing = await findMessageByProviderId(event.mid);
        if (existing) {
          logger.info("Duplicate Meta webhook", { mid: event.mid, channel: event.channel });
          await maybeResendStored(existing.conversationId, event.channel, event.senderId);
          continue;
        }
      }

      const result = await processInbound({
        organizationId: org.id,
        channel: event.channel,
        from: event.senderId,
        text: event.text,
        customerName: event.customerName,
        isLiveChannel: true,
        dispatchLiveOutbound: false,
      });

      if (event.mid) {
        await tagLatestInbound(result.conversationId, {
          provider: "meta",
          providerId: event.mid,
          channel: event.channel,
        });
      }

      if (!result.reply || result.actions.includes("ai_paused_escalated") || !socialAiRepliesEnabled()) {
        continue;
      }

      const sent = await sendChannelReply({
        channel: event.channel,
        to: event.senderId,
        body: result.reply,
      });
      if (sent.ok && "providerId" in sent && sent.providerId) {
        await tagLatestOutbound(result.conversationId, {
          provider: "meta",
          providerId: sent.providerId,
        });
      }
    } catch (error) {
      logger.error("Meta inbound processing failed", { error: String(error), channel: event.channel });
    }
  }

  return NextResponse.json({ ok: true });
}

async function maybeResendStored(
  conversationId: string,
  channel: "instagram" | "facebook",
  to: string,
) {
  if (!socialAiRepliesEnabled()) return;
  const outbound = await prisma.message.findFirst({
    where: { conversationId, direction: "outbound" },
    orderBy: { createdAt: "desc" },
  });
  if (!outbound?.body || alreadyDelivered(outbound.metadata)) return;
  const sent = await sendChannelReply({ channel, to, body: outbound.body });
  if (sent.ok && "providerId" in sent && sent.providerId) {
    await tagLatestOutbound(conversationId, { provider: "meta", providerId: sent.providerId });
  }
}
