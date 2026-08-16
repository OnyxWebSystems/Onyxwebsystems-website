import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const org = await getDemoOrganization();
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel");

  const conversations = await prisma.conversation.findMany({
    where: {
      organizationId: org.id,
      ...(channel ? { channel } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 100,
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" }, take: 100 },
      callSession: true,
    },
  });
  return NextResponse.json({ conversations });
}
