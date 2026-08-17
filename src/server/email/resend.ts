import { logger } from "@/server/logger";
import { BRAND_FROM, BRAND_REPLY_TO, loadEmailLogo } from "./brand";

export type EmailAttachment = {
  filename: string;
  content: string;
  contentId?: string;
  contentType?: string;
};

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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: BRAND_FROM,
      reply_to: BRAND_REPLY_TO,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: attachments.map((file) => ({
        filename: file.filename,
        content: file.content,
        ...(file.contentId ? { content_id: file.contentId } : {}),
        ...(file.contentType ? { content_type: file.contentType } : {}),
      })),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    logger.error("Resend send failed", { status: res.status, errText, subject: input.subject });
    throw new Error("Resend send failed");
  }

  const data = (await res.json()) as { id?: string };
  logger.info("Branded email sent", { id: data.id, to, subject: input.subject });
  return { ok: true, simulated: false as const, providerId: data.id };
}
