import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const org = await getDemoOrganization();
  const customers = await prisma.customer.findMany({
    where: { organizationId: org.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { appointments: true, tickets: true, conversations: true } },
    },
  });
  return NextResponse.json({ customers });
}
