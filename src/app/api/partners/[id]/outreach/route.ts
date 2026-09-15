import { NextResponse } from "next/server";
import { requirePartnerOperator } from "@/server/partners/session";
import { createOutreachDraft } from "@/server/partners/workflow";
import { logger } from "@/server/logger";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { id } = await ctx.params;
  try {
    const result = await createOutreachDraft(authz.org.id, id, authz.session.user.id);
    if ("error" in result && result.error === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if ("error" in result && result.error === "do_not_contact") {
      return NextResponse.json({ error: "This partner is marked do not contact" }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Outreach generation failed", { error: String(error) });
    return NextResponse.json({ error: "Could not generate outreach" }, { status: 502 });
  }
}
