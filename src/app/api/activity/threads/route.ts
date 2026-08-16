import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDemoOrganization } from "@/server/demo/runner";
import { listActivityThreads } from "@/server/activity/threads";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const take = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 40));
  const org = await getDemoOrganization();
  const threads = await listActivityThreads(org.id, take);
  return NextResponse.json({ threads });
}
