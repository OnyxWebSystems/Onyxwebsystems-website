import { NextResponse } from "next/server";
import { requirePartnerOperator } from "@/server/partners/session";
import { researchPartner } from "@/server/partners/workflow";
import { logger } from "@/server/logger";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { id } = await ctx.params;
  const force = new URL(req.url).searchParams.get("force") === "1";
  try {
    const result = await researchPartner(authz.org.id, id, authz.session.user.id, force);
    if ("error" in result && result.error === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if ("error" in result && result.error === "no_website") {
      return NextResponse.json({ error: "Add a website URL before researching" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Partner research failed", { error: String(error) });
    return NextResponse.json({ error: "Research failed. Check the website URL and try again." }, { status: 502 });
  }
}
