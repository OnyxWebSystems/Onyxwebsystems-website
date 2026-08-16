import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { listAvailableSlots } from "@/server/booking/engine";
import { rateLimit } from "@/server/security/rate-limit";

export async function GET(req: Request) {
  const limited = rateLimit("public:slots", 60, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const days = Number(new URL(req.url).searchParams.get("days") ?? 14);
  const org = await getDemoOrganization();
  const service =
    (await prisma.service.findFirst({
      where: { organizationId: org.id, slug: "consultation" },
    })) ??
    (await prisma.service.findFirst({ where: { organizationId: org.id } }));

  if (!service) return NextResponse.json({ slots: [] });

  const slots = await listAvailableSlots({
    organizationId: org.id,
    serviceId: service.id,
    from: new Date(),
    days: Math.min(Math.max(days, 1), 21),
  });

  return NextResponse.json({
    service: { name: service.name, slug: service.slug },
    slots: slots.map((s) => ({
      startsAt: s.startsAt.toISOString(),
      label: s.startsAt.toLocaleString("en-US", {
        timeZone: org.timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      employeeId: s.employeeId,
      employeeName: s.employeeName,
    })),
  });
}
