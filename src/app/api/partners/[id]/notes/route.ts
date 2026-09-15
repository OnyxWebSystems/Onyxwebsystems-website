import { NextResponse } from "next/server";
import { addPartnerNote } from "@/server/partners/domain";
import { prisma } from "@/server/db";
import { noteSchema } from "@/server/partners/schemas";
import { requirePartnerOperator } from "@/server/partners/session";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { id } = await ctx.params;
  const partner = await prisma.partner.findFirst({ where: { id, organizationId: authz.org.id } });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid note" }, { status: 400 });
  const note = await addPartnerNote(id, parsed.data.body, authz.session.user.id);
  return NextResponse.json({ note }, { status: 201 });
}
