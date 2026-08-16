import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDemoOrganization } from "@/server/demo/runner";
import { getActivityThread } from "@/server/activity/threads";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const org = await getDemoOrganization();
  const thread = await getActivityThread(org.id, id);
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ thread });
}
