import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getLiveIntegrationStatuses } from "@/server/channels/dispatch";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const live = getLiveIntegrationStatuses();
  const integrations = Object.entries(live).map(([key, value]) => ({
    key,
    status: value.status,
    description: value.detail,
  }));

  return NextResponse.json({
    integrations,
    phoneNumber: process.env.RETELL_PHONE_NUMBER ?? null,
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? null,
    smsFrom: process.env.TWILIO_SMS_FROM ?? null,
  });
}
