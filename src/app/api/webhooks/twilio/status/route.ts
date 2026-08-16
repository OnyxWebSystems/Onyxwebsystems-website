import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { logger } from "@/server/logger";

export const runtime = "nodejs";

/**
 * Twilio Message status callback — logs delivery failures so WhatsApp
 * "queued then never arrived" is visible in Vercel logs and on the message.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const messageSid = String(form.get("MessageSid") || form.get("SmsSid") || "");
  const messageStatus = String(form.get("MessageStatus") || "");
  const errorCode = String(form.get("ErrorCode") || "");
  const errorMessage = String(form.get("ErrorMessage") || "");
  const to = String(form.get("To") || "");

  logger.info("Twilio message status", {
    messageSid,
    messageStatus,
    errorCode: errorCode || undefined,
    errorMessage: errorMessage || undefined,
    to,
  });

  if (messageSid) {
    const existing = await prisma.message.findFirst({
      where: {
        metadata: {
          path: ["providerId"],
          equals: messageSid,
        },
      },
    });
    if (existing) {
      const metadata = {
        ...((existing.metadata as Record<string, unknown>) ?? {}),
        provider: "twilio",
        providerId: messageSid,
        sendStatus: messageStatus,
        errorCode: errorCode || undefined,
        errorMessage: errorMessage || undefined,
      };
      await prisma.message.update({
        where: { id: existing.id },
        data: { metadata },
      });
    }
  }

  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}
