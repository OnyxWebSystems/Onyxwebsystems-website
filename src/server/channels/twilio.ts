import type { ChannelAdapter, OutboundMessage } from "./types";
import { logger } from "@/server/logger";
import { createSimulatedAdapter } from "./simulated";

function e164(value: string) {
  let number = value.replace(/^whatsapp:/i, "").trim();
  if (number && !number.startsWith("+")) number = `+${number}`;
  return number;
}

export function twilioAddress(channel: "whatsapp" | "sms", value: string) {
  const number = e164(value);
  return channel === "whatsapp" ? `whatsapp:${number}` : number;
}

type TwilioMessageResponse = {
  sid?: string;
  status?: string | number;
  code?: number;
  error_code?: number | null;
  error_message?: string | null;
  message?: string;
  contents?: TwilioContentItem[];
  messages?: Array<{ sid?: string; content_sid?: string; body?: string }>;
  types?: Record<string, { body?: string }>;
  friendly_name?: string;
  variables?: Record<string, string>;
};

type TwilioContentItem = {
  sid?: string;
  friendly_name?: string;
  types?: Record<string, { body?: string }>;
  variables?: Record<string, string>;
};

function parseTwilioJson(raw: string): TwilioMessageResponse {
  try {
    return JSON.parse(raw) as TwilioMessageResponse;
  } catch {
    return {};
  }
}

function twilioFailed(res: Response, data: TwilioMessageResponse) {
  const twilioStatus = String(data.status ?? "");
  const failedStatus = ["failed", "undelivered", "canceled"].includes(twilioStatus.toLowerCase());
  const errorCode = data.error_code || data.code || null;
  return { failed: !res.ok || failedStatus || Boolean(errorCode), twilioStatus, errorCode };
}

export function variableKeysFromContent(item: TwilioContentItem): string[] {
  const body = Object.values(item.types ?? {})
    .map((t) => t.body ?? "")
    .join("\n");
  const fromBody = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]!);
  const fromVars = Object.keys(item.variables ?? {});
  const keys = [...new Set([...fromBody, ...fromVars])].sort((a, b) => Number(a) - Number(b));
  return keys.length ? keys : [];
}

export function contentVariablesForReply(keys: string[], reply: string) {
  const vars: Record<string, string> = {};
  const chunk = reply.replace(/\s+/g, " ").trim().slice(0, 320);
  for (const key of keys) {
    if (key === "1") vars[key] = chunk || "Onyx Web Systems";
    else if (key === "2") vars[key] = "a consultation";
    else if (key === "3") vars[key] = "this week";
    else vars[key] = chunk.slice(0, 80);
  }
  return vars;
}

async function fetchContentItem(auth: string, contentSid: string): Promise<TwilioContentItem | null> {
  const res = await fetch(`https://content.twilio.com/v1/Content/${contentSid}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const raw = await res.text();
  const data = parseTwilioJson(raw);
  if (!res.ok || !data.sid) {
    logger.warn("Twilio Content fetch failed", { contentSid, status: res.status, errText: raw.slice(0, 400) });
    return null;
  }
  return data;
}

async function listWhatsAppContent(auth: string): Promise<TwilioContentItem[]> {
  const urls = [
    "https://content.twilio.com/v1/Content?PageSize=50",
    "https://content.twilio.com/v1/ContentAndApprovals?PageSize=50",
  ];
  const bySid = new Map<string, TwilioContentItem>();
  for (const url of urls) {
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    const raw = await res.text();
    const data = parseTwilioJson(raw);
    if (!res.ok) {
      logger.warn("Twilio Content list failed", { url, status: res.status, errText: raw.slice(0, 400) });
      continue;
    }
    for (const item of data.contents ?? []) {
      if (item.sid) bySid.set(item.sid, item);
    }
  }
  const items = [...bySid.values()];
  logger.info("Twilio Content templates available", {
    count: items.length,
    templates: items.map((c) => ({
      sid: c.sid,
      name: c.friendly_name,
      types: Object.keys(c.types ?? {}),
    })),
  });
  return items;
}

async function contentSidFromRecentMessages(accountSid: string, auth: string): Promise<string | null> {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?PageSize=40`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  const raw = await res.text();
  const data = parseTwilioJson(raw);
  if (!res.ok) {
    logger.warn("Twilio message list failed while looking for ContentSid", {
      status: res.status,
      errText: raw.slice(0, 400),
    });
    return null;
  }
  const found = data.messages?.find((m) => m.content_sid?.startsWith("HX"));
  return found?.content_sid ?? null;
}

async function createSessionTextContent(auth: string, text: string): Promise<string | null> {
  const res = await fetch("https://content.twilio.com/v1/Content", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      friendly_name: `onyx_session_${Date.now()}`,
      language: "en",
      types: { "twilio/text": { body: text.slice(0, 1600) } },
    }),
  });
  const raw = await res.text();
  const data = parseTwilioJson(raw);
  if (!res.ok || !data.sid) {
    logger.warn("Twilio Content create skipped (trial cannot create custom templates)", {
      status: res.status,
      errText: raw.slice(0, 400),
    });
    return null;
  }
  return data.sid;
}

/**
 * WhatsApp send for this account: ContentSid only, never Body, never TwiML.
 * Trial "Try out WhatsApp" requires a Twilio-provided template SID (HX…).
 * Upgraded accounts can create a twilio/text content item with the full reply.
 */
export async function sendWhatsAppContentReply(input: {
  to: string;
  body: string;
  from?: string;
}): Promise<{ ok: boolean; simulated: boolean; providerId?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return createSimulatedAdapter("twilio").send({
      channel: "whatsapp",
      to: input.to,
      body: input.body,
    });
  }

  const fromRaw = input.from || process.env.TWILIO_WHATSAPP_FROM;
  if (!fromRaw) {
    logger.warn("Twilio WhatsApp from-number missing; falling back to simulated send");
    return createSimulatedAdapter("twilio").send({
      channel: "whatsapp",
      to: input.to,
      body: input.body,
    });
  }

  const to = twilioAddress("whatsapp", input.to);
  const fromValue = twilioAddress("whatsapp", fromRaw);
  const text = input.body.slice(0, 1600);
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const listed = await listWhatsAppContent(auth);
  const envSid = process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim();
  let preferred: TwilioContentItem | undefined =
    listed.find((c) => c.sid === envSid) ||
    listed.find((c) => Boolean(c.types?.["twilio/text"])) ||
    listed.find((c) => /text|session|reply|utility/i.test(c.friendly_name ?? "")) ||
    listed[0];

  let contentSid = preferred?.sid || envSid || null;
  if (!contentSid) {
    contentSid = await contentSidFromRecentMessages(sid, auth);
  }
  if (!preferred && contentSid) {
    preferred = (await fetchContentItem(auth, contentSid)) ?? undefined;
  }

  let variableKeys = preferred ? variableKeysFromContent(preferred) : [];
  if (!variableKeys.length && contentSid && !preferred) variableKeys = ["1", "2", "3"];

  if (!contentSid) {
    contentSid = await createSessionTextContent(auth, text);
    variableKeys = [];
  }

  if (!contentSid) {
    throw new Error(
      "No WhatsApp ContentSid. On Try out WhatsApp, open Outbound, copy ContentSid from the sample request, and set TWILIO_WHATSAPP_CONTENT_SID.",
    );
  }

  const params: Record<string, string> = {
    To: to,
    From: fromValue,
    ContentSid: contentSid,
  };
  if (variableKeys.length) {
    params.ContentVariables = JSON.stringify(contentVariablesForReply(variableKeys, text));
  }
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  if (messagingServiceSid) {
    params.MessagingServiceSid = messagingServiceSid;
  }
  const statusUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (statusUrl) {
    params.StatusCallback = `${statusUrl.replace(/\/$/, "")}/api/webhooks/twilio/status`;
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const raw = await res.text();
  const data = parseTwilioJson(raw);
  const { failed, twilioStatus, errorCode } = twilioFailed(res, data);
  if (failed) {
    logger.error("Twilio WhatsApp ContentSid send failed", {
      status: res.status,
      errText: raw.slice(0, 800),
      to,
      from: fromValue,
      contentSid,
      twilioStatus,
      errorCode,
    });
    throw new Error(data.error_message || data.message || `Twilio send failed (${res.status})`);
  }

  logger.info("Twilio WhatsApp ContentSid send accepted", {
    providerId: data.sid,
    contentSid,
    twilioStatus,
    to,
    from: fromValue,
  });
  return { ok: true, simulated: false, providerId: data.sid };
}

/**
 * Twilio adapter — READY_FOR_INTEGRATION until credentials are present.
 * Never pretends to be connected without credentials.
 */
export function createTwilioAdapter(): ChannelAdapter {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    return {
      ...createSimulatedAdapter("twilio"),
      key: "twilio",
      status: "READY_FOR_INTEGRATION",
    };
  }

  return {
    key: "twilio",
    status: "CONNECTED",
    async send(message: OutboundMessage) {
      if (message.channel === "whatsapp") {
        return sendWhatsAppContentReply({
          to: message.to,
          body: message.body,
          from: message.from,
        });
      }

      const fromRaw = message.from || process.env.TWILIO_SMS_FROM;
      if (!fromRaw) {
        logger.warn("Twilio from-number missing; falling back to simulated send");
        return createSimulatedAdapter("twilio").send(message);
      }

      const to = twilioAddress("sms", message.to);
      const fromValue = twilioAddress("sms", fromRaw);
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const params: Record<string, string> = { To: to, From: fromValue, Body: message.body };
      const statusUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
      if (statusUrl) {
        params.StatusCallback = `${statusUrl.replace(/\/$/, "")}/api/webhooks/twilio/status`;
      }
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
      });

      const raw = await res.text();
      const data = parseTwilioJson(raw);
      const { failed, twilioStatus, errorCode } = twilioFailed(res, data);
      if (failed) {
        logger.error("Twilio send failed", {
          status: res.status,
          errText: raw.slice(0, 800),
          to,
          from: fromValue,
          twilioStatus,
          errorCode,
        });
        throw new Error(data.error_message || data.message || `Twilio send failed (${res.status})`);
      }

      logger.info("Twilio send accepted", {
        providerId: data.sid,
        twilioStatus,
        to,
        from: fromValue,
      });
      return { ok: true, simulated: false, providerId: data.sid };
    },
  };
}
