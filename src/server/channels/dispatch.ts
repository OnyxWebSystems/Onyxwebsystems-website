import { createTwilioAdapter } from "./twilio";
import { createResendAdapter } from "./resend";
import { logger } from "@/server/logger";
import type { ChannelStatus } from "./types";
import { notifyConsultationBooked } from "@/server/email/notifications";
import { isGoogleCalendarConfigured } from "@/server/calendar/google";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeE164(value: string) {
  const digits = digitsOnly(value);
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (value.startsWith("+")) return value;
  return digits ? `+${digits}` : value;
}

export async function sendChannelReply(input: {
  channel: "whatsapp" | "sms" | "phone" | "email" | string;
  to: string;
  body: string;
  from?: string;
}) {
  if (input.channel === "phone") {
    return { ok: true, simulated: false, skipped: true as const, reason: "voice_reply_via_retell" };
  }

  if (input.channel === "whatsapp" || input.channel === "sms") {
    const adapter = createTwilioAdapter();
    const to = normalizeE164(input.to.replace(/^whatsapp:/i, ""));
    const result = await adapter.send({
      channel: input.channel,
      to,
      from: input.from,
      body: input.body,
    });
    logger.info("Channel reply dispatched", {
      channel: input.channel,
      simulated: result.simulated,
      providerId: result.providerId,
    });
    return { ...result, skipped: false as const };
  }

  if (input.channel === "email") {
    const adapter = createResendAdapter();
    const result = await adapter.send({
      channel: "email",
      to: input.to,
      body: input.body,
    });
    return { ...result, skipped: false as const };
  }

  logger.warn("No outbound adapter for channel", { channel: input.channel });
  return { ok: false, simulated: true, skipped: true as const, reason: "unsupported_channel" };
}

export async function sendAppointmentConfirmationEmail(input: {
  toEmail: string;
  customerName: string;
  serviceName: string;
  startsAt: Date;
  endsAt?: Date;
  technicianName?: string | null;
  address?: string | null;
  customerPhone?: string | null;
  company?: string | null;
  details?: string | null;
  appointmentId?: string;
  organizationId?: string;
}) {
  return notifyConsultationBooked({
    customerName: input.customerName,
    customerEmail: input.toEmail,
    customerPhone: input.customerPhone,
    company: input.company,
    serviceName: input.serviceName,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    technicianName: input.technicianName,
    details: input.details ?? input.address,
    appointmentId: input.appointmentId,
    organizationId: input.organizationId,
  });
}

export function getLiveIntegrationStatuses(): Record<
  string,
  { status: ChannelStatus; detail: string }
> {
  const twilioReady = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const smsFrom = Boolean(process.env.TWILIO_SMS_FROM);
  const waFrom = Boolean(process.env.TWILIO_WHATSAPP_FROM);
  const retellReady = Boolean(process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID);
  const resendReady = Boolean(process.env.RESEND_API_KEY);

  return {
    voice_retell: {
      status: retellReady ? "CONNECTED" : "READY_FOR_INTEGRATION",
      detail: retellReady
        ? `Live number ${process.env.RETELL_PHONE_NUMBER ?? "(set RETELL_PHONE_NUMBER)"}`
        : "Set RETELL_API_KEY, RETELL_AGENT_ID (and RETELL_PHONE_NUMBER for outbound)",
    },
    voice_simulator: {
      status: "SIMULATED",
      detail: "Demo Mode phone scenarios",
    },
    whatsapp: {
      status: twilioReady && waFrom ? "CONNECTED" : "READY_FOR_INTEGRATION",
      detail:
        twilioReady && waFrom
          ? `Twilio WhatsApp ${process.env.TWILIO_WHATSAPP_FROM}`
          : "Set TWILIO_* and TWILIO_WHATSAPP_FROM (sandbox OK)",
    },
    sms: {
      status: twilioReady && smsFrom ? "CONNECTED" : "READY_FOR_INTEGRATION",
      detail:
        twilioReady && smsFrom
          ? `Twilio SMS ${process.env.TWILIO_SMS_FROM}`
          : "Set TWILIO_* and TWILIO_SMS_FROM",
    },
    email: {
      status: resendReady ? "CONNECTED" : "READY_FOR_INTEGRATION",
      detail: resendReady
        ? "Resend outbound confirmations"
        : "Set RESEND_API_KEY for confirmation emails",
    },
    calendar: { status: "CONNECTED", detail: "Internal scheduling engine" },
    google_calendar: {
      status: isGoogleCalendarConfigured() ? "CONNECTED" : "READY_FOR_INTEGRATION",
      detail: isGoogleCalendarConfigured()
        ? "Onyx Web Systems Google Calendar"
        : "Set GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN",
    },
    crm: { status: "CONNECTED", detail: "Internal customer records" },
    llm: {
      status: process.env.OPENAI_API_KEY ? "CONNECTED" : "SIMULATED",
      detail: process.env.OPENAI_API_KEY ? "OpenAI NLU" : "Fixture NLU (no OPENAI_API_KEY)",
    },
    social: {
      status: "SIMULATED",
      detail: "Social inbox not live in this pivot",
    },
  };
}
