import { logger } from "@/server/logger";
import { BRAND_FROM, BRAND_REPLY_TO } from "./brand";

export type EmailAttachment = {
  filename: string;
  content: string;
  contentId?: string;
  contentType?: string;
};

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function postResendEmail(input: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  attachments: EmailAttachment[];
  key: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      reply_to: BRAND_REPLY_TO,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments.map((file) => ({
        filename: file.filename,
        content: file.content,
        ...(file.contentId ? { content_id: file.contentId, content_disposition: "inline" } : {}),
        ...(file.contentType ? { content_type: file.contentType } : {}),
      })),
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    logger.error("Resend send failed", { status: res.status, body, subject: input.subject, from: input.from });
    const error = new Error(`Resend send failed (${res.status})`);
    (error as Error & { status?: number; body?: string }).status = res.status;
    (error as Error & { status?: number; body?: string }).body = body;
    throw error;
  }

  const data = body ? (JSON.parse(body) as { id?: string }) : {};
  logger.info("Branded email sent", { id: data.id, to: input.to, subject: input.subject, from: input.from });
  return { ok: true, simulated: false as const, providerId: data.id };
}

export async function sendBrandedEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}) {
  const key = process.env.RESEND_API_KEY;
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const attachments = input.attachments ?? [];

  if (!key) {
    logger.info("Resend not connected — email simulated", { to, subject: input.subject });
    return { ok: true, simulated: true as const };
  }

  return postResendEmail({
    from: BRAND_FROM,
    to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments,
    key,
  }).catch((error) => {
    logger.error("Resend send failed", { error: errorMessage(error), subject: input.subject });
    throw error;
  });
}
