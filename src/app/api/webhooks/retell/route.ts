import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { logger } from "@/server/logger";
import { rateLimit } from "@/server/security/rate-limit";
import { getDemoOrganization } from "@/server/demo/runner";
import { getRetellStatus, verifyRetellWebhook } from "@/server/channels/retell";
import { publishActivity } from "@/server/events";
import { addTimelineEvent } from "@/server/domain/customers";
import { resolveCallerCustomerId } from "@/server/activity/resolve-caller";

export const runtime = "nodejs";

type RetellCall = {
  call_id?: string;
  agent_id?: string;
  call_type?: string;
  call_status?: string;
  from_number?: string;
  to_number?: string;
  direction?: string;
  disconnection_reason?: string;
  transcript?: string;
  duration_ms?: number;
  recording_url?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  call_analysis?: {
    call_summary?: string;
    user_sentiment?: string;
    call_successful?: boolean;
  };
};

type RetellWebhookPayload = {
  event?: string;
  call?: RetellCall;
};

export async function POST(req: Request) {
  const limited = rateLimit("webhook:retell", 180, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const status = getRetellStatus();
  if (status !== "CONNECTED" && process.env.RETELL_ALLOW_WEBHOOKS_WHEN_READY !== "true") {
    return NextResponse.json(
      {
        status,
        message: "Configure RETELL_API_KEY and RETELL_AGENT_ID.",
      },
      { status: 503 },
    );
  }

  const raw = await req.text();
  if (!verifyRetellWebhook(req, raw)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: RetellWebhookPayload;
  try {
    payload = JSON.parse(raw) as RetellWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const call = payload.call ?? {};

  logger.info("Retell webhook", { event, callId: call.call_id });

  if (event === "call_started") {
    await handleCallStarted(call);
    return NextResponse.json({ ok: true });
  }

  if (event === "call_ended") {
    await handleCallEnded(call);
    return NextResponse.json({ ok: true });
  }

  if (event === "call_analyzed") {
    await handleCallAnalyzed(call);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

function customerPhone(call: RetellCall) {
  // Inbound: customer is from_number; outbound: customer is to_number
  if (call.direction === "outbound") return call.to_number ?? null;
  return call.from_number ?? call.to_number ?? null;
}

async function findConversationByCallId(callId: string | undefined) {
  if (!callId) return null;
  const message = await prisma.message.findFirst({
    where: {
      metadata: {
        path: ["callId"],
        equals: callId,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      conversation: { include: { callSession: true } },
    },
  });
  return message?.conversation ?? null;
}

async function resolveCustomerId(
  orgId: string,
  phone: string | null,
  transcript?: string | null,
  summary?: string | null,
) {
  return resolveCallerCustomerId({
    organizationId: orgId,
    phone,
    transcript,
    summary,
  });
}

async function handleCallStarted(call: RetellCall) {
  const org = await getDemoOrganization();
  const phone = customerPhone(call);
  const callId = call.call_id;
  if (!callId) return;

  const existing = await findConversationByCallId(callId);
  if (existing) {
    await publishActivity({
      organizationId: org.id,
      type: "phone",
      title: "Call in progress",
      detail: phone ?? callId,
      metadata: { customerId: existing.customerId, conversationId: existing.id, channel: "phone", callId },
    });
    return;
  }

  const customerId = await resolveCustomerId(org.id, phone, call.transcript, call.call_analysis?.call_summary);
  const direction = call.direction === "outbound" ? "outbound" : "inbound";

  const created = await prisma.conversation.create({
    data: {
      organizationId: org.id,
      customerId,
      channel: "phone",
      status: "open",
      subject: "Live phone call",
      summary: "Call in progress",
      urgency: "NORMAL",
      intent: "phone_call",
      callSession: {
        create: {
          fromNumber: call.from_number ?? undefined,
          toNumber: call.to_number ?? process.env.RETELL_PHONE_NUMBER ?? org.phone ?? undefined,
          direction,
          outcome: "answered",
          isSimulated: false,
          startedAt: call.start_timestamp ? new Date(call.start_timestamp) : new Date(),
        },
      },
      messages: {
        create: [
          {
            direction: "system",
            senderType: "system",
            body: "Call started",
            metadata: { provider: "retell", callId, event: "call_started" },
          },
        ],
      },
    },
  });

  await publishActivity({
    organizationId: org.id,
    type: "phone",
    title: "Live call started",
    detail: phone ?? callId,
    metadata: { customerId, conversationId: created.id, channel: "phone", callId },
  });
}

async function handleCallEnded(call: RetellCall) {
  const org = await getDemoOrganization();
  const phone = customerPhone(call);
  const callId = call.call_id;
  const durationSec =
    typeof call.duration_ms === "number" ? Math.round(call.duration_ms / 1000) : undefined;
  const transcript = call.transcript?.trim() || "";
  const summary =
    call.call_analysis?.call_summary ||
    transcript.slice(0, 280) ||
    "Phone conversation";

  let conversation = await findConversationByCallId(callId);
  const customerId =
    conversation?.customerId ??
    (await resolveCustomerId(org.id, phone, transcript, summary)) ??
    undefined;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        organizationId: org.id,
        customerId,
        channel: "phone",
        status: "resolved",
        subject: "Live phone call",
        summary,
        urgency: "NORMAL",
        intent: "phone_call",
        endedAt: call.end_timestamp ? new Date(call.end_timestamp) : new Date(),
        callSession: {
          create: {
            fromNumber: call.from_number ?? undefined,
            toNumber: call.to_number ?? process.env.RETELL_PHONE_NUMBER ?? org.phone ?? undefined,
            direction: call.direction === "outbound" ? "outbound" : "inbound",
            outcome: call.disconnection_reason ?? "answered",
            durationSec,
            recordingUrl: call.recording_url ?? undefined,
            isSimulated: false,
            startedAt: call.start_timestamp ? new Date(call.start_timestamp) : new Date(),
            endedAt: call.end_timestamp ? new Date(call.end_timestamp) : new Date(),
          },
        },
        messages: {
          create: [
            {
              direction: "system",
              senderType: "system",
              body: "Call ended",
              metadata: { provider: "retell", callId, event: "call_ended" },
            },
            ...(transcript
              ? [
                  {
                    direction: "inbound" as const,
                    senderType: "customer" as const,
                    body: transcript.slice(0, 8000),
                    metadata: { provider: "retell", callId },
                  },
                ]
              : []),
          ],
        },
      },
      include: { callSession: true },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: "resolved",
        summary,
        endedAt: call.end_timestamp ? new Date(call.end_timestamp) : new Date(),
        customerId: conversation.customerId ?? customerId,
      },
    });

    if (conversation.callSession) {
      await prisma.callSession.update({
        where: { id: conversation.callSession.id },
        data: {
          outcome: call.disconnection_reason ?? "answered",
          durationSec,
          recordingUrl: call.recording_url ?? undefined,
          isSimulated: false,
          endedAt: call.end_timestamp ? new Date(call.end_timestamp) : new Date(),
        },
      });
    }

    if (transcript) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "inbound",
          senderType: "customer",
          body: transcript.slice(0, 8000),
          metadata: { provider: "retell", callId, event: "call_ended" },
        },
      });
    } else {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "system",
          senderType: "system",
          body: "Call ended",
          metadata: { provider: "retell", callId, event: "call_ended" },
        },
      });
    }
  }

  if (customerId) {
    await addTimelineEvent({
      customerId,
      type: "conversation_started",
      title: "Live phone call completed",
      detail: summary,
      channel: "phone",
      refType: "conversation",
      refId: conversation.id,
    });
  }

  await publishActivity({
    organizationId: org.id,
    type: "phone",
    title: "Live call completed",
    detail: phone ?? conversation.id,
    metadata: { customerId, conversationId: conversation.id, channel: "phone", callId },
  });
}

async function handleCallAnalyzed(call: RetellCall) {
  const org = await getDemoOrganization();
  const callId = call.call_id;
  const summary = call.call_analysis?.call_summary;
  const transcript = call.transcript?.trim() || "";

  let conversation = await findConversationByCallId(callId);
  if (!conversation) {
    // Analysis can arrive without a prior started/ended event — persist like end-of-call
    await handleCallEnded(call);
    conversation = await findConversationByCallId(callId);
  }
  if (!conversation) return;

  const customerId =
    conversation.customerId ??
    (await resolveCustomerId(org.id, customerPhone(call), transcript, summary)) ??
    undefined;

  if (summary || customerId) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        ...(summary ? { summary } : {}),
        ...(customerId && !conversation.customerId ? { customerId } : {}),
      },
    });
  }

  if (transcript) {
    const existingTranscript = await prisma.message.findFirst({
      where: {
        conversationId: conversation.id,
        metadata: { path: ["callId"], equals: callId },
        direction: "inbound",
        senderType: "customer",
      },
    });
    if (!existingTranscript) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "inbound",
          senderType: "customer",
          body: transcript.slice(0, 8000),
          metadata: { provider: "retell", callId, event: "call_analyzed" },
        },
      });
    }
  }

  if (call.recording_url && conversation.callSession) {
    await prisma.callSession.update({
      where: { id: conversation.callSession.id },
      data: { recordingUrl: call.recording_url },
    });
  }

  await publishActivity({
    organizationId: org.id,
    type: "phone",
    title: "Call analyzed",
    detail: summary ?? callId,
    metadata: {
      customerId: customerId ?? conversation.customerId,
      conversationId: conversation.id,
      channel: "phone",
      callId,
    },
  });
}
