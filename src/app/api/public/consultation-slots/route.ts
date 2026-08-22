import { NextResponse } from "next/server";
import { listGoogleConsultationSlots } from "@/server/calendar/slots";
import { rateLimit } from "@/server/security/rate-limit";
import { logger } from "@/server/logger";

export async function GET(req: Request) {
  const limited = rateLimit("public:slots", 60, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const days = Number(new URL(req.url).searchParams.get("days") ?? 14);
  try {
    const slots = await listGoogleConsultationSlots(days);
    return NextResponse.json({ slots });
  } catch (error) {
    logger.error("Consultation slots failed", { error: String(error) });
    return NextResponse.json({ slots: [], error: "Could not load availability." }, { status: 200 });
  }
}
