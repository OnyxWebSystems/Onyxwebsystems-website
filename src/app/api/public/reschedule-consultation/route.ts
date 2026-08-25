import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyRescheduleToken } from "@/server/booking/schedule-token";
import { rescheduleWebsiteConsultation } from "@/server/booking/consultation";
import { canRescheduleMeeting } from "@/server/calendar/timezone";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/security/rate-limit";

const schema = z.object({
  token: z.string().min(20),
  startsAt: z.string().min(1),
  timeZone: z.string().min(1).max(80).optional().nullable(),
});

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const payload = verifyRescheduleToken(token);
  if (!payload) return NextResponse.json({ error: "This reschedule link is invalid or has expired." }, { status: 400 });
  const appointment = await prisma.appointment.findUnique({
    where: { id: payload.appointmentId },
    include: { customer: true },
  });
  if (!appointment) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  return NextResponse.json({
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    canReschedule: canRescheduleMeeting(appointment.startsAt),
    guestTimeZone: appointment.guestTimeZone,
    name: `${appointment.customer.firstName} ${appointment.customer.lastName}`.trim(),
  });
}

export async function POST(req: Request) {
  const limited = rateLimit("public:reschedule", 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid reschedule payload" }, { status: 400 });
  }

  const payload = verifyRescheduleToken(body.token);
  if (!payload) {
    return NextResponse.json({ error: "This reschedule link is invalid or has expired." }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
  }

  try {
    const result = await rescheduleWebsiteConsultation({
      appointmentId: payload.appointmentId,
      email: payload.email,
      startsAt,
      timeZone: body.timeZone,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not reschedule." },
      { status },
    );
  }
}
