import { logger } from "@/server/logger";
import { BRAND_FROM, BRAND_REPLY_TO, loadEmailLogo } from "./brand";

export type EmailAttachment = {
  filename: string;
  content: string;
  contentId?: string;
  contentType?: string;
};

const RESEND_TEST_FROM = "Onyx Web Systems <onboarding@resend.dev>";

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
        ...(file.contentId ? { content_id: file.contentId } : {}),
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
  const logo = await loadEmailLogo();
  const attachments = [
    ...(logo ? [{ filename: logo.filename, content: logo.content, contentId: logo.contentId }] : []),
    ...(input.attachments ?? []),
  ];

  if (!key) {
    logger.info("Resend not connected — email simulated", { to, subject: input.subject });
    return { ok: true, simulated: true as const };
  }

  const from = BRAND_FROM;
  try {
    return await postResendEmail({ from, to, subject: input.subject, html: input.html, text: input.text, attachments, key });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    const body = (error as Error & { body?: string }).body ?? "";
    const unverified = status === 403 || /not verified|invalid `from`/i.test(body);
    const testRecipientOnly = status === 403 && /only send testing emails/i.test(body);
    const accountInbox = BRAND_REPLY_TO;

    if (testRecipientOnly && !to.map((addr) => addr.toLowerCase()).includes(accountInbox.toLowerCase())) {
      logger.warn("Resend test mode — sending to the account inbox instead", {
        subject: input.subject,
        originalTo: to,
        accountInbox,
      });
      return postResendEmail({
        from,
        to: [accountInbox],
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments,
        key,
      });
    }

    if (unverified && !from.includes("onboarding@resend.dev")) {
      logger.warn("Retrying email with Resend test sender", { subject: input.subject });
      return postResendEmail({
        from: RESEND_TEST_FROM,
        to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments,
        key,
      });
    }
    logger.error("Resend send failed", { error: errorMessage(error), subject: input.subject });
    throw error;
  }
}
