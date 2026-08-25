import { NextResponse } from "next/server";
import { processConsultationReminders } from "@/server/booking/reminders";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (process.env.NODE_ENV === "production") {
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processConsultationReminders();
  return NextResponse.json({ ok: true, ...result });
}
