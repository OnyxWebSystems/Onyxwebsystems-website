import { NextResponse } from "next/server";
import { z } from "zod";
import { bookWebsiteConsultation } from "@/server/booking/consultation";
import { rateLimit } from "@/server/security/rate-limit";
import { logger } from "@/server/logger";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  company: z.string().max(120).optional().nullable(),
  serviceInterest: z.enum(["bos", "app", "web"]),
  modules: z.array(z.string()).default([]),
  goals: z.string().max(4000).optional().nullable(),
  startsAt: z.string().min(1),
  timeZone: z.string().min(1).max(80).optional().nullable(),
});

export async function POST(req: Request) {
  const limited = rateLimit("public:book", 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please complete your details and choose a time." }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
  }

  try {
    const result = await bookWebsiteConsultation({
      ...body,
      startsAt,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    logger.warn("Consultation booking failed", { err: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not complete this booking." },
      { status },
    );
  }
}
