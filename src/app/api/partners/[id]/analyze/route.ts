import { NextResponse } from "next/server";
import { requirePartnerOperator } from "@/server/partners/session";
import { analysePartner } from "@/server/partners/workflow";
import { logger } from "@/server/logger";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { id } = await ctx.params;
  try {
    const result = await analysePartner(authz.org.id, id, authz.session.user.id);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Partner analysis failed", { error: String(error) });
    return NextResponse.json({ error: "Could not generate analysis" }, { status: 502 });
  }
}
