import { readFile } from "fs/promises";
import path from "path";

export const BRAND_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Onyx Web Systems <onyxwebsystems@gmail.com>";
export const BRAND_REPLY_TO = process.env.ONYX_NOTIFY_EMAIL ?? "onyxwebsystems@gmail.com";
export const BRAND_TIMEZONE = "America/Phoenix";

export function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || "https://onyxwebsystems.com").replace(
    /\/$/,
    "",
  );
}

export async function loadEmailLogo(): Promise<{ filename: string; content: string; contentId: string } | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "brand", "onyx-email-logo.png");
    const buf = await readFile(filePath);
    return {
      filename: "onyxwebsystems-logo.png",
      content: buf.toString("base64"),
      contentId: "onyx-logo",
    };
  } catch {
    return null;
  }
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
    <td style="padding:8px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#5c5c5c;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:15px;color:#0a0a0a;vertical-align:top;">${escapeHtml(value)}</td>
  </tr>`;
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Onyx Web Systems</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;border-bottom:1px solid #0a0a0a;">
              <img src="cid:onyx-logo" alt="ONYXWEBSYSTEMS" width="280" style="display:block;max-width:100%;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding-top:28px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5c5c5c;">${escapeHtml(input.eyebrow)}</p>
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:700;color:#0a0a0a;">${escapeHtml(input.heading)}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5c5c5c;">${escapeHtml(input.intro)}</p>
              ${
                fields
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e2e0;">${fields}</table>`
                  : ""
              }
              ${input.extraHtml ?? ""}
              <p style="margin:28px 0 0;font-size:15px;line-height:1.6;color:#5c5c5c;">${escapeHtml(closing)}</p>
              <p style="margin:28px 0 0;font-size:15px;line-height:1.6;color:#0a0a0a;">
                Kind regards,<br />
                <strong>Onyx Web Systems</strong><br />
                <a href="mailto:onyxwebsystems@gmail.com" style="color:#0a0a0a;">onyxwebsystems@gmail.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;border-top:1px solid #e2e2e0;font-size:12px;color:#5c5c5c;">
              Technology partner for operators who want systems that create, connect, and convert.
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
