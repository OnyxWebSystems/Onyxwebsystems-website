import { NextResponse } from "next/server";
import { listConsultationSlots } from "@/server/calendar/slots";
import { processConsultationReminders } from "@/server/booking/reminders";
import { getDemoOrganization } from "@/server/demo/runner";
import { rateLimit } from "@/server/security/rate-limit";
import { logger } from "@/server/logger";

export async function GET(req: Request) {
  const limited = rateLimit("public:slots", 60, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? 28);
  const timeZone = url.searchParams.get("timeZone");

  try {
    const org = await getDemoOrganization();
    const result = await listConsultationSlots({
      organizationId: org.id,
      days,
      timeZone,
    });
    void processConsultationReminders().catch((error) => {
      logger.warn("Opportunistic reminder pass failed", { error: String(error) });
    });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Consultation slots failed", { error: String(error) });
    return NextResponse.json(
      { slots: [], days: [], error: "Could not load availability." },
      { status: 200 },
    );
  }
}
