import { readFile } from "fs/promises";
import path from "path";

export type EmailInlineImage = {
  filename: string;
  content: string;
  contentId: string;
  contentType: string;
};

export const BRAND_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Onyx Web Systems <hello@onyxwebsystems.co.za>";
export const BRAND_REPLY_TO = process.env.ONYX_NOTIFY_EMAIL ?? "onyxwebsystems@gmail.com";
export const BRAND_TIMEZONE = "America/Phoenix";

export function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || "https://onyxwebsystems.co.za").replace(
    /\/$/,
    "",
  );
}

export async function loadEmailAssets(): Promise<EmailInlineImage[]> {
  const files = [
    { file: "onyx-email-mark.png", filename: "onyxwebsystems-mark.png", contentId: "onyx-mark" },
    { file: "onyx-email-wordmark.png", filename: "onyxwebsystems-wordmark.png", contentId: "onyx-wordmark" },
  ];
  const loaded: EmailInlineImage[] = [];
  for (const item of files) {
    try {
      const filePath = path.join(process.cwd(), "public", "brand", item.file);
      const buf = await readFile(filePath);
      loaded.push({
        filename: item.filename,
        content: buf.toString("base64"),
        contentId: item.contentId,
        contentType: "image/png",
      });
    } catch {
      /* skip missing asset */
    }
  }
  return loaded;
}

export function formatWhen(date: Date) {
  return date.toLocaleString("en-US", {
    timeZone: BRAND_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value?: string | null) {
  if (!value) return "";
  return `<tr>
    <td style="padding:18px 0;border-bottom:1px solid #ecece8;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7a7a76;width:132px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:18px 0;border-bottom:1px solid #ecece8;font-size:16px;line-height:1.5;color:#0a0a0a;vertical-align:top;">${escapeHtml(value)}</td>
  </tr>`;
}

export function emailCta(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 8px;">
    <tr>
      <td style="background:#0a0a0a;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:16px 28px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;color:#ffffff;font-weight:700;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>
  <p style="margin:0;font-size:12px;line-height:1.7;color:#7a7a76;">If the button does not open, use this link:<br /><a href="${escapeHtml(href)}" style="color:#0a0a0a;text-decoration:underline;">${escapeHtml(href)}</a></p>`;
}

export function brandedEmailHtml(input: {
  eyebrow: string;
  heading: string;
  intro: string;
  fields?: { label: string; value?: string | null }[];
  extraHtml?: string;
  closing?: string;
}) {
  const fields = (input.fields ?? []).filter((f) => f.value).map((f) => row(f.label, f.value)).join("");
  const closing =
    input.closing ??
    "If you have any questions, reply to this email or write to onyxwebsystems@gmail.com.";
  const site = publicSiteUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Onyx Web Systems</title>
</head>
<body style="margin:0;padding:0;background:#f3f2ef;color:#0a0a0a;font-family:Georgia,'Times New Roman',Times,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f2ef;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;">
          <tr>
            <td align="center" style="padding:48px 40px 32px;border-bottom:1px solid #0a0a0a;">
              <img src="cid:onyx-mark" alt="ONYXWEBSYSTEMS" width="196" style="display:block;margin:0 auto;width:196px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
              <p style="margin:22px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:#7a7a76;">Create. Connect. Convert.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 16px;">
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#7a7a76;">${escapeHtml(input.eyebrow)}</p>
              <h1 style="margin:0 0 20px;font-size:30px;line-height:1.28;font-weight:400;color:#0a0a0a;letter-spacing:-0.02em;">${escapeHtml(input.heading)}</h1>
              <p style="margin:0 0 8px;font-size:16px;line-height:1.75;color:#4a4a46;">${escapeHtml(input.intro)}</p>
            </td>
          </tr>
          ${
            fields
              ? `<tr>
            <td style="padding:8px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #0a0a0a;">${fields}</table>
            </td>
          </tr>`
              : ""
          }
          ${
            input.extraHtml
              ? `<tr>
            <td style="padding:8px 40px 0;font-family:Arial,Helvetica,sans-serif;">${input.extraHtml}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding:28px 40px 8px;">
              <p style="margin:0;font-size:16px;line-height:1.75;color:#4a4a46;">${escapeHtml(closing)}</p>
              <p style="margin:28px 0 0;font-size:16px;line-height:1.75;color:#0a0a0a;">
                Kind regards,<br />
                <span style="letter-spacing:0.08em;">Onyx Web Systems</span>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:36px 40px 44px;border-top:1px solid #ecece8;">
              <img src="cid:onyx-wordmark" alt="ONYXWEBSYSTEMS" width="248" style="display:block;margin:0 auto 18px;width:248px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.08em;line-height:1.7;color:#7a7a76;">
                Technology partner for operators who want systems that create, connect, and convert.
              </p>
              <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">
                <a href="${escapeHtml(site)}" style="color:#0a0a0a;text-decoration:none;">onyxwebsystems.co.za</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="mailto:onyxwebsystems@gmail.com" style="color:#0a0a0a;text-decoration:none;">onyxwebsystems@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function brandedEmailText(input: {
  heading: string;
  intro: string;
  fields?: { label: string; value?: string | null }[];
  extra?: string;
  closing?: string;
}) {
  const lines = [
    "ONYXWEBSYSTEMS",
    "",
    input.heading,
    "",
    input.intro,
    "",
    ...(input.fields ?? [])
      .filter((f) => f.value)
      .map((f) => `${f.label}: ${f.value}`),
    input.extra ? `\n${input.extra}` : "",
    "",
    input.closing ?? "If you have any questions, reply to this email or write to onyxwebsystems@gmail.com.",
    "",
    "Kind regards,",
    "Onyx Web Systems",
    "onyxwebsystems@gmail.com",
  ];
  return lines.filter((line) => line !== undefined).join("\n");
}
