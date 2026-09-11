import { NextResponse } from "next/server";
import { logger } from "@/server/logger";
import { rateLimit } from "@/server/security/rate-limit";
import { getDemoOrganization } from "@/server/demo/runner";
import { processInbound } from "@/server/orchestration/process";
import { sendChannelReply } from "@/server/channels/dispatch";
import { parseTikTokMessagingEvents, verifyTikTokSignature } from "@/server/channels/tiktok";
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

export async function POST(req: Request) {
  const limited = rateLimit("webhook:tiktok", 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const appSecret = process.env.TIKTOK_APP_SECRET;
  if (!appSecret) {
    logger.warn("TikTok webhook hit while READY_FOR_INTEGRATION");
    return NextResponse.json(
      {
        status: "READY_FOR_INTEGRATION",
        message: "Configure TIKTOK_APP_SECRET (and TIKTOK_ACCESS_TOKEN to send replies).",
      },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("tiktok-signature") ?? req.headers.get("TikTok-Signature");
  const skipVerify = process.env.TIKTOK_SKIP_SIGNATURE_VERIFY === "true";
  if (!skipVerify && !verifyTikTokSignature({ rawBody, signatureHeader: signature, appSecret })) {
    logger.warn("TikTok signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = parseTikTokMessagingEvents(payload);
  if (!events.length) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const org = await getDemoOrganization();

  for (const event of events) {
    try {
      if (event.messageId) {
        const existing = await findMessageByProviderId(event.messageId);
        if (existing) {
          logger.info("Duplicate TikTok webhook", { messageId: event.messageId });
          await maybeResendStored(existing.conversationId, event.conversationId);
          continue;
        }
      }

      const result = await processInbound({
        organizationId: org.id,
        channel: "tiktok",
        from: event.senderId,
        text: event.text,
        customerName: event.customerName,
        isLiveChannel: true,
        dispatchLiveOutbound: false,
        providerThreadId: event.conversationId,
      });

      if (event.messageId) {
        await tagLatestInbound(result.conversationId, {
          provider: "tiktok",
          providerId: event.messageId,
          channel: "tiktok",
          conversationId: event.conversationId,
        });
      }

      if (!result.reply || result.actions.includes("ai_paused_escalated") || !socialAiRepliesEnabled()) {
        continue;
      }

      const sent = await sendChannelReply({
        channel: "tiktok",
        to: event.senderId,
        body: result.reply,
        providerThreadId: event.conversationId,
      });
      if (sent.ok && "providerId" in sent && sent.providerId) {
        await tagLatestOutbound(result.conversationId, {
          provider: "tiktok",
          providerId: sent.providerId,
        });
      }
    } catch (error) {
      logger.error("TikTok inbound processing failed", { error: String(error) });
    }
  }

  return NextResponse.json({ ok: true });
}

async function maybeResendStored(conversationId: string, providerThreadId: string) {
  if (!socialAiRepliesEnabled()) return;
  const outbound = await prisma.message.findFirst({
    where: { conversationId, direction: "outbound" },
    orderBy: { createdAt: "desc" },
  });
  if (!outbound?.body || alreadyDelivered(outbound.metadata)) return;
  const sent = await sendChannelReply({
    channel: "tiktok",
    to: providerThreadId,
    body: outbound.body,
    providerThreadId,
  });
  if (sent.ok && "providerId" in sent && sent.providerId) {
    await tagLatestOutbound(conversationId, { provider: "tiktok", providerId: sent.providerId });
  }
}
