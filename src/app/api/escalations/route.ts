import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const escalations = await prisma.escalation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { customer: true, ticket: true },
  });
  return NextResponse.json({ escalations });
}
