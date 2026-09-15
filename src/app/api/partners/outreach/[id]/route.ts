import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { outreachActionSchema, outreachPatchSchema } from "@/server/partners/schemas";
import { requirePartnerOperator } from "@/server/partners/session";
import { reviewOutreach } from "@/server/partners/workflow";
import { logger } from "@/server/logger";

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
  const parsed = outreachPatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid outreach" }, { status: 400 });
  const existing = await prisma.partnerOutreach.findFirst({
    where: { id, partner: { organizationId: authz.org.id } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const outreach = await prisma.partnerOutreach.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ outreach });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = outreachActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  try {
    const result = await reviewOutreach(
      authz.org.id,
      id,
      parsed.data.action,
      authz.session.user.id,
      parsed.data.message,
    );
    if ("error" in result && result.error === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if ("error" in result && result.error === "do_not_contact") {
      return NextResponse.json({ error: "This partner is marked do not contact" }, { status: 409 });
    }
    if ("error" in result && result.error === "not_approved") {
      return NextResponse.json({ error: "Approve the message before marking it contacted" }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Outreach review failed", { error: String(error) });
    return NextResponse.json({ error: "Could not update outreach" }, { status: 500 });
  }
}
