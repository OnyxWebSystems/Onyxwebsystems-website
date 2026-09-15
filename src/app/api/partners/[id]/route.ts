import { NextResponse } from "next/server";
import { archivePartner, getPartner, PartnerConflictError, updatePartner, withNextAction } from "@/server/partners/domain";
import { partnerUpdateSchema } from "@/server/partners/schemas";
import { requirePartnerOperator } from "@/server/partners/session";
import { logger } from "@/server/logger";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { id } = await ctx.params;
  const partner = await getPartner(authz.org.id, id);
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ partner: withNextAction(partner) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = partnerUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid partner data" }, { status: 400 });
  try {
    const partner = await updatePartner(authz.org.id, id, {
      ...parsed.data,
      primaryContactEmail: parsed.data.primaryContactEmail || null,
    }, authz.session.user.id);
    if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ partner });
  } catch (error) {
    if (error instanceof PartnerConflictError) {
      return NextResponse.json({ error: error.message, existingId: error.existingId }, { status: 409 });
    }
    logger.error("Update partner failed", { error: String(error) });
    return NextResponse.json({ error: "Could not update partner" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { id } = await ctx.params;
  const partner = await archivePartner(authz.org.id, id, authz.session.user.id);
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ partner });
}
