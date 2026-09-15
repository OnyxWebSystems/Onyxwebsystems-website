import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getOrCreatePartnerSettings } from "@/server/partners/domain";
import { settingsSchema } from "@/server/partners/schemas";
import { isSettingsAdmin, requirePartnerOperator } from "@/server/partners/session";

export async function GET() {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const settings = await getOrCreatePartnerSettings(authz.org.id);
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const role = (authz.session.user as { role?: string }).role ?? "agent";
  if (!isSettingsAdmin(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  const existing = await getOrCreatePartnerSettings(authz.org.id);
  const settings = await prisma.partnerEngineSettings.update({
    where: { id: existing.id },
    data: parsed.data,
  });
  return NextResponse.json({ settings });
}
