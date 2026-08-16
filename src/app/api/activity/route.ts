import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const org = await getDemoOrganization();
  const events = await prisma.activityEvent.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ events });
}
