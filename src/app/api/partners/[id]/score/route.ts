import { NextResponse } from "next/server";
import { persistPartnerScore, addPartnerActivity } from "@/server/partners/domain";
import { prisma } from "@/server/db";
import { requirePartnerOperator } from "@/server/partners/session";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { id } = await ctx.params;
  const partner = await prisma.partner.findFirst({ where: { id, organizationId: authz.org.id } });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await persistPartnerScore(partner);
  await addPartnerActivity(id, "scored", "Score calculated", `${updated.partnerScore}/100`, authz.session.user.id);
  return NextResponse.json({ partner: updated });
}
