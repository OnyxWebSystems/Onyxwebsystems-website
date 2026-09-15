import { NextResponse } from "next/server";
import { bulkUpdatePartners } from "@/server/partners/domain";
import { bulkSchema } from "@/server/partners/schemas";
import { requirePartnerOperator } from "@/server/partners/session";
import { logger } from "@/server/logger";

export async function POST(req: Request) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid bulk request" }, { status: 400 });
  try {
    const partners = await bulkUpdatePartners(authz.org.id, parsed.data.ids, parsed.data, authz.session.user.id);
    return NextResponse.json({ partners });
  } catch (error) {
    logger.error("Bulk partner update failed", { error: String(error) });
    return NextResponse.json({ error: "Could not update partners" }, { status: 500 });
  }
}
