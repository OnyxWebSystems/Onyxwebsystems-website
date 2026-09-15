import { NextResponse } from "next/server";
import { PartnerConflictError, createPartner, listPartners, partnerOverviewStats } from "@/server/partners/domain";
import { partnerCreateSchema } from "@/server/partners/schemas";
import { requirePartnerOperator } from "@/server/partners/session";
import { logger } from "@/server/logger";

export async function GET(req: Request) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { org } = authz;
  const url = new URL(req.url);
  if (url.searchParams.get("view") === "stats") {
    const stats = await partnerOverviewStats(org.id);
    return NextResponse.json({ stats });
  }
  const minScoreRaw = url.searchParams.get("minScore");
  const partners = await listPartners(org.id, {
    status: url.searchParams.get("status"),
    q: url.searchParams.get("q"),
    category: url.searchParams.get("category"),
    industry: url.searchParams.get("industry"),
    country: url.searchParams.get("country"),
    city: url.searchParams.get("city"),
    minScore: minScoreRaw ? Number(minScoreRaw) : null,
    partnerType: url.searchParams.get("partnerType"),
    tag: url.searchParams.get("tag"),
    companySize: url.searchParams.get("companySize"),
    service: url.searchParams.get("service"),
    contactAvailability: url.searchParams.get("contact"),
  });
  return NextResponse.json({ partners });
}

export async function POST(req: Request) {
  const authz = await requirePartnerOperator();
  if ("error" in authz && authz.error) return authz.error;
  const { org, session } = authz;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = partnerCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid partner data" }, { status: 400 });

  try {
    const partner = await createPartner(org.id, {
      ...parsed.data,
      primaryContactEmail: parsed.data.primaryContactEmail || null,
      source: parsed.data.source || "manual",
    }, session.user.id);
    return NextResponse.json({ partner }, { status: 201 });
  } catch (error) {
    if (error instanceof PartnerConflictError) {
      return NextResponse.json({ error: error.message, existingId: error.existingId }, { status: 409 });
    }
    logger.error("Create partner failed", { error: String(error) });
    return NextResponse.json({ error: "Could not create partner" }, { status: 500 });
  }
}
