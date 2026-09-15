import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDashboardOperator } from "@/server/auth/operators";
import { getDemoOrganization } from "@/server/demo/runner";

export async function requirePartnerOperator() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isDashboardOperator(session.user.email)) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse };
  }
  const org = await getDemoOrganization();
  return { session, org };
}

export function isSettingsAdmin(role?: string | null) {
  return role === "owner" || role === "manager";
}
