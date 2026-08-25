import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { ensureBusinessTimezone } from "@/server/calendar/org-timezone";
import { BUSINESS_TIMEZONE } from "@/lib/timezones";

const hoursSchema = z.object({
  mon: z.object({ open: z.string(), close: z.string() }).nullable(),
  tue: z.object({ open: z.string(), close: z.string() }).nullable(),
  wed: z.object({ open: z.string(), close: z.string() }).nullable(),
  thu: z.object({ open: z.string(), close: z.string() }).nullable(),
  fri: z.object({ open: z.string(), close: z.string() }).nullable(),
  sat: z.object({ open: z.string(), close: z.string() }).nullable(),
  sun: z.object({ open: z.string(), close: z.string() }).nullable(),
});

const putSchema = z.object({
  businessHours: hoursSchema,
});

const overrideSchema = z.object({
  date: z.string().min(8),
  isClosed: z.boolean().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  note: z.string().max(200).nullable().optional(),
  remove: z.boolean().optional(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const org = await getDemoOrganization();
  const timezone = await ensureBusinessTimezone(org.id, org.timezone);
  const [overrides, appointments] = await Promise.all([
    prisma.availabilityOverride.findMany({
      where: { organizationId: org.id },
      orderBy: { date: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        organizationId: org.id,
        status: { notIn: ["cancelled", "no_show"] },
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      include: { customer: true },
      take: 80,
    }),
  ]);
  return NextResponse.json({
    timezone,
    businessHours: org.businessHours,
    overrides,
    appointments: appointments.map((a) => ({
      id: a.id,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
      status: a.status,
      customer: `${a.customer.firstName} ${a.customer.lastName}`.trim(),
    })),
  });
}

export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const org = await getDemoOrganization();
  let body: z.infer<typeof putSchema>;
  try {
    body = putSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid weekly hours." }, { status: 400 });
  }
  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: { businessHours: body.businessHours, timezone: BUSINESS_TIMEZONE },
  });
  return NextResponse.json({ ok: true, businessHours: updated.businessHours });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const org = await getDemoOrganization();
  let body: z.infer<typeof overrideSchema>;
  try {
    body = overrideSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid date override." }, { status: 400 });
  }
  const date = new Date(`${body.date}T00:00:00.000Z`);
  if (body.remove) {
    await prisma.availabilityOverride.deleteMany({
      where: { organizationId: org.id, date },
    });
    return NextResponse.json({ ok: true });
  }
  const row = await prisma.availabilityOverride.upsert({
    where: { organizationId_date: { organizationId: org.id, date } },
    update: {
      isClosed: body.isClosed ?? false,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      note: body.note ?? null,
    },
    create: {
      organizationId: org.id,
      date,
      isClosed: body.isClosed ?? false,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      note: body.note ?? null,
    },
  });
  return NextResponse.json({ ok: true, override: row });
}
