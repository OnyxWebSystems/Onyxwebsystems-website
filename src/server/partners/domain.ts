import type { Partner, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import {
  DEFAULT_PARTNER_CATEGORIES,
  DEFAULT_SCORING_WEIGHTS,
  ONYX_SERVICES,
  PARTNER_STATUSES,
  type PartnerStatus,
} from "./constants";
import { nextBestAction } from "./next-action";
import { normalizeCompanyName, normalizeWebsiteDomain } from "./normalize";
import { recommendedActionForScore, scorePartner, type ScoreBreakdown } from "./scoring";

export { normalizeCompanyName, normalizeWebsiteDomain };

export class PartnerConflictError extends Error {
  existingId: string;
  constructor(existingId: string, message = "A partner with this company or domain already exists") {
    super(message);
    this.existingId = existingId;
  }
}

export type PartnerCreateInput = {
  companyName: string;
  website?: string | null;
  industry?: string | null;
  subIndustry?: string | null;
  category?: string | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  description?: string | null;
  companySize?: string | null;
  estimatedRevenueCents?: number | null;
  targetClientDescription?: string | null;
  targetClientSize?: string | null;
  targetIndustries?: string[];
  keywords?: string[];
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  contactPageUrl?: string | null;
  primaryContactName?: string | null;
  primaryContactRole?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  primaryContactLinkedin?: string | null;
  partnerType?: string;
  source?: string | null;
  sourceUrl?: string | null;
  tags?: string[];
  recommendedServices?: string[];
};

export type PartnerListFilters = {
  status?: string | null;
  q?: string | null;
  category?: string | null;
  industry?: string | null;
  country?: string | null;
  city?: string | null;
  minScore?: number | null;
  partnerType?: string | null;
  doNotContact?: boolean | null;
  tag?: string | null;
  companySize?: string | null;
  service?: string | null;
  contactAvailability?: string | null;
};

export async function getOrCreatePartnerSettings(organizationId: string) {
  const existing = await prisma.partnerEngineSettings.findUnique({ where: { organizationId } });
  if (existing) return existing;
  return prisma.partnerEngineSettings.create({
    data: {
      organizationId,
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      categories: [...DEFAULT_PARTNER_CATEGORIES],
      onyxServices: [...ONYX_SERVICES],
    },
  });
}

export async function findDuplicatePartner(
  organizationId: string,
  input: { companyName: string; website?: string | null },
  excludeId?: string,
) {
  const domain = normalizeWebsiteDomain(input.website);
  if (domain) {
    const byDomain = await prisma.partner.findFirst({
      where: {
        organizationId,
        websiteDomain: domain,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (byDomain) return byDomain;
  }

  const normalized = normalizeCompanyName(input.companyName);
  if (!normalized) return null;
  const candidates = await prisma.partner.findMany({
    where: {
      organizationId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, companyName: true },
  });
  return candidates.find((row) => normalizeCompanyName(row.companyName) === normalized) ?? null;
}

function applyScore(partnerId: string | undefined, input: PartnerCreateInput, breakdown: ScoreBreakdown) {
  return {
    partnerScore: breakdown.total,
    clientValueScore: breakdown.clientValueScore,
    fitScore: breakdown.fitScore,
    relationshipScore: breakdown.relationshipScore,
    networkScore: breakdown.networkScore,
    technologyGapScore: breakdown.technologyGapScore,
    competitionRiskScore: breakdown.competitionRiskScore,
    scoreBreakdown: breakdown as Prisma.InputJsonValue,
    recommendedAction: recommendedActionForScore(
      breakdown.total,
      Boolean(input.primaryContactEmail || input.primaryContactLinkedin || input.contactPageUrl),
      Boolean(input.description),
    ),
    ...(partnerId ? {} : {}),
  };
}

export async function createPartner(organizationId: string, input: PartnerCreateInput, actorId?: string) {
  const duplicate = await findDuplicatePartner(organizationId, input);
  if (duplicate) throw new PartnerConflictError(duplicate.id);

  const settings = await getOrCreatePartnerSettings(organizationId);
  const weights = (settings.scoringWeights ?? DEFAULT_SCORING_WEIGHTS) as typeof DEFAULT_SCORING_WEIGHTS;
  const breakdown = scorePartner(input, weights);
  const domain = normalizeWebsiteDomain(input.website);

  const partner = await prisma.partner.create({
    data: {
      organizationId,
      companyName: input.companyName.trim(),
      website: input.website?.trim() || null,
      websiteDomain: domain,
      industry: input.industry?.trim() || null,
      subIndustry: input.subIndustry?.trim() || null,
      category: input.category?.trim() || "Professional Services Firms",
      country: input.country?.trim() || null,
      province: input.province?.trim() || null,
      city: input.city?.trim() || null,
      description: input.description?.trim() || null,
      companySize: input.companySize?.trim() || null,
      estimatedRevenueCents: input.estimatedRevenueCents ?? null,
      targetClientDescription: input.targetClientDescription?.trim() || null,
      targetClientSize: input.targetClientSize?.trim() || null,
      targetIndustries: input.targetIndustries ?? [],
      keywords: input.keywords ?? [],
      linkedinUrl: input.linkedinUrl?.trim() || null,
      instagramUrl: input.instagramUrl?.trim() || null,
      facebookUrl: input.facebookUrl?.trim() || null,
      contactPageUrl: input.contactPageUrl?.trim() || null,
      primaryContactName: input.primaryContactName?.trim() || null,
      primaryContactRole: input.primaryContactRole?.trim() || null,
      primaryContactEmail: input.primaryContactEmail?.trim() || null,
      primaryContactPhone: input.primaryContactPhone?.trim() || null,
      primaryContactLinkedin: input.primaryContactLinkedin?.trim() || null,
      partnerType: input.partnerType || "REFERRAL",
      source: input.source || "manual",
      sourceUrl: input.sourceUrl || input.website || null,
      tags: input.tags ?? [],
      recommendedServices: input.recommendedServices ?? [],
      ...applyScore(undefined, input, breakdown),
    },
  });

  await addPartnerActivity(partner.id, "discovered", "Partner discovered", partner.companyName, actorId);
  return partner;
}

export async function updatePartner(
  organizationId: string,
  id: string,
  input: Partial<PartnerCreateInput> & {
    status?: string;
    doNotContact?: boolean;
    contractStatus?: string;
    whyGoodFit?: string | null;
    potentialClientProfile?: string | null;
    recommendedPitch?: string | null;
    partnershipAngle?: string | null;
  },
  actorId?: string,
) {
  const existing = await prisma.partner.findFirst({ where: { id, organizationId } });
  if (!existing) return null;

  if (input.companyName || input.website) {
    const duplicate = await findDuplicatePartner(
      organizationId,
      {
        companyName: input.companyName ?? existing.companyName,
        website: input.website === undefined ? existing.website : input.website,
      },
      id,
    );
    if (duplicate) throw new PartnerConflictError(duplicate.id);
  }

  if (input.status && !PARTNER_STATUSES.includes(input.status as PartnerStatus)) {
    throw new Error("Invalid status");
  }

  const merged: PartnerCreateInput = {
    companyName: input.companyName ?? existing.companyName,
    website: input.website === undefined ? existing.website : input.website,
    industry: input.industry === undefined ? existing.industry : input.industry,
    category: input.category === undefined ? existing.category : input.category,
    country: input.country === undefined ? existing.country : input.country,
    province: input.province === undefined ? existing.province : input.province,
    city: input.city === undefined ? existing.city : input.city,
    description: input.description === undefined ? existing.description : input.description,
    companySize: input.companySize === undefined ? existing.companySize : input.companySize,
    estimatedRevenueCents:
      input.estimatedRevenueCents === undefined ? existing.estimatedRevenueCents : input.estimatedRevenueCents,
    targetClientDescription:
      input.targetClientDescription === undefined ? existing.targetClientDescription : input.targetClientDescription,
    targetClientSize: input.targetClientSize === undefined ? existing.targetClientSize : input.targetClientSize,
    targetIndustries: input.targetIndustries ?? existing.targetIndustries,
    linkedinUrl: input.linkedinUrl === undefined ? existing.linkedinUrl : input.linkedinUrl,
    contactPageUrl: input.contactPageUrl === undefined ? existing.contactPageUrl : input.contactPageUrl,
    primaryContactName: input.primaryContactName === undefined ? existing.primaryContactName : input.primaryContactName,
    primaryContactEmail:
      input.primaryContactEmail === undefined ? existing.primaryContactEmail : input.primaryContactEmail,
    primaryContactPhone:
      input.primaryContactPhone === undefined ? existing.primaryContactPhone : input.primaryContactPhone,
    primaryContactLinkedin:
      input.primaryContactLinkedin === undefined ? existing.primaryContactLinkedin : input.primaryContactLinkedin,
    recommendedServices: input.recommendedServices ?? existing.recommendedServices,
  };

  const settings = await getOrCreatePartnerSettings(organizationId);
  const weights = (settings.scoringWeights ?? DEFAULT_SCORING_WEIGHTS) as typeof DEFAULT_SCORING_WEIGHTS;
  const breakdown = scorePartner(merged, weights);

  const partner = await prisma.partner.update({
    where: { id },
    data: {
      ...(input.companyName !== undefined ? { companyName: input.companyName.trim() } : {}),
      ...(input.website !== undefined
        ? { website: input.website?.trim() || null, websiteDomain: normalizeWebsiteDomain(input.website) }
        : {}),
      ...(input.industry !== undefined ? { industry: input.industry?.trim() || null } : {}),
      ...(input.subIndustry !== undefined ? { subIndustry: input.subIndustry?.trim() || null } : {}),
      ...(input.category !== undefined ? { category: (input.category ?? existing.category).trim() } : {}),
      ...(input.country !== undefined ? { country: input.country?.trim() || null } : {}),
      ...(input.province !== undefined ? { province: input.province?.trim() || null } : {}),
      ...(input.city !== undefined ? { city: input.city?.trim() || null } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.companySize !== undefined ? { companySize: input.companySize?.trim() || null } : {}),
      ...(input.estimatedRevenueCents !== undefined ? { estimatedRevenueCents: input.estimatedRevenueCents } : {}),
      ...(input.targetClientDescription !== undefined
        ? { targetClientDescription: input.targetClientDescription?.trim() || null }
        : {}),
      ...(input.targetClientSize !== undefined ? { targetClientSize: input.targetClientSize?.trim() || null } : {}),
      ...(input.targetIndustries !== undefined ? { targetIndustries: input.targetIndustries } : {}),
      ...(input.keywords !== undefined ? { keywords: input.keywords } : {}),
      ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl?.trim() || null } : {}),
      ...(input.instagramUrl !== undefined ? { instagramUrl: input.instagramUrl?.trim() || null } : {}),
      ...(input.facebookUrl !== undefined ? { facebookUrl: input.facebookUrl?.trim() || null } : {}),
      ...(input.contactPageUrl !== undefined ? { contactPageUrl: input.contactPageUrl?.trim() || null } : {}),
      ...(input.primaryContactName !== undefined
        ? { primaryContactName: input.primaryContactName?.trim() || null }
        : {}),
      ...(input.primaryContactRole !== undefined
        ? { primaryContactRole: input.primaryContactRole?.trim() || null }
        : {}),
      ...(input.primaryContactEmail !== undefined
        ? { primaryContactEmail: input.primaryContactEmail?.trim() || null }
        : {}),
      ...(input.primaryContactPhone !== undefined
        ? { primaryContactPhone: input.primaryContactPhone?.trim() || null }
        : {}),
      ...(input.primaryContactLinkedin !== undefined
        ? { primaryContactLinkedin: input.primaryContactLinkedin?.trim() || null }
        : {}),
      ...(input.partnerType !== undefined ? { partnerType: input.partnerType || "REFERRAL" } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.recommendedServices !== undefined ? { recommendedServices: input.recommendedServices } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.doNotContact !== undefined ? { doNotContact: input.doNotContact } : {}),
      ...(input.contractStatus !== undefined ? { contractStatus: input.contractStatus } : {}),
      ...(input.whyGoodFit !== undefined ? { whyGoodFit: input.whyGoodFit } : {}),
      ...(input.potentialClientProfile !== undefined ? { potentialClientProfile: input.potentialClientProfile } : {}),
      ...(input.recommendedPitch !== undefined ? { recommendedPitch: input.recommendedPitch } : {}),
      ...(input.partnershipAngle !== undefined ? { partnershipAngle: input.partnershipAngle } : {}),
      ...applyScore(id, merged, breakdown),
    },
  });

  if (input.status && input.status !== existing.status) {
    await addPartnerActivity(id, "status", `Status changed to ${input.status}`, null, actorId);
  }
  if (input.doNotContact && !existing.doNotContact) {
    await addPartnerActivity(id, "do_not_contact", "Marked do not contact", null, actorId);
  }
  return partner;
}

export async function persistPartnerScore(partner: Partner) {
  const settings = await getOrCreatePartnerSettings(partner.organizationId);
  const weights = (settings.scoringWeights ?? DEFAULT_SCORING_WEIGHTS) as typeof DEFAULT_SCORING_WEIGHTS;
  const breakdown = scorePartner(partner, weights);
  return prisma.partner.update({
    where: { id: partner.id },
    data: {
      ...applyScore(partner.id, partner, breakdown),
    },
  });
}

export function partnerListWhere(organizationId: string, filters: PartnerListFilters): Prisma.PartnerWhereInput {
  const and: Prisma.PartnerWhereInput[] = [{ organizationId }];
  if (filters.status && filters.status !== "all") and.push({ status: filters.status });
  if (filters.category && filters.category !== "all") and.push({ category: filters.category });
  if (filters.industry) {
    and.push({ industry: { contains: filters.industry, mode: "insensitive" } });
  }
  if (filters.country) and.push({ country: { contains: filters.country, mode: "insensitive" } });
  if (filters.city) and.push({ city: { contains: filters.city, mode: "insensitive" } });
  if (filters.minScore != null) and.push({ partnerScore: { gte: filters.minScore } });
  if (filters.partnerType && filters.partnerType !== "all") and.push({ partnerType: filters.partnerType });
  if (filters.doNotContact != null) and.push({ doNotContact: filters.doNotContact });
  if (filters.tag) and.push({ tags: { has: filters.tag } });
  if (filters.companySize) and.push({ companySize: { contains: filters.companySize, mode: "insensitive" } });
  if (filters.service) and.push({ recommendedServices: { has: filters.service } });
  if (filters.contactAvailability === "email") and.push({ primaryContactEmail: { not: null } });
  if (filters.contactAvailability === "none") {
    and.push({ primaryContactEmail: null, primaryContactPhone: null, contactPageUrl: null });
  }
  if (filters.q) {
    and.push({
      OR: [
        { companyName: { contains: filters.q, mode: "insensitive" } },
        { industry: { contains: filters.q, mode: "insensitive" } },
        { website: { contains: filters.q, mode: "insensitive" } },
        { primaryContactName: { contains: filters.q, mode: "insensitive" } },
        { city: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  return { AND: and };
}

export async function listPartners(organizationId: string, filters: PartnerListFilters) {
  return prisma.partner.findMany({
    where: partnerListWhere(organizationId, filters),
    orderBy: [{ partnerScore: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getPartner(organizationId: string, id: string) {
  return prisma.partner.findFirst({
    where: { id, organizationId },
    include: {
      research: { orderBy: { createdAt: "desc" }, take: 1, include: { sources: true } },
      outreach: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
      activity: { orderBy: { createdAt: "desc" }, take: 40 },
    },
  });
}

export function withNextAction<T extends Partner & { outreach?: { status: string }[] }>(partner: T) {
  const pending = partner.outreach?.[0]?.status ?? null;
  return {
    ...partner,
    nextAction: nextBestAction({
      status: partner.status,
      doNotContact: partner.doNotContact,
      lastResearchedAt: partner.lastResearchedAt,
      description: partner.description,
      primaryContactName: partner.primaryContactName,
      primaryContactEmail: partner.primaryContactEmail,
      primaryContactLinkedin: partner.primaryContactLinkedin,
      contactPageUrl: partner.contactPageUrl,
      whyGoodFit: partner.whyGoodFit,
      pendingOutreachStatus: pending,
      lastContactedAt: partner.lastContactedAt,
      nextFollowUpAt: partner.nextFollowUpAt,
      contractStatus: partner.contractStatus,
      partnerScore: partner.partnerScore,
    }),
  };
}

export async function addPartnerActivity(
  partnerId: string,
  type: string,
  title: string,
  detail?: string | null,
  actorId?: string,
) {
  return prisma.partnerActivity.create({
    data: { partnerId, type, title, detail: detail ?? undefined, actorId },
  });
}

export async function addPartnerNote(partnerId: string, body: string, createdById?: string) {
  const note = await prisma.partnerNote.create({
    data: { partnerId, body: body.trim(), createdById },
  });
  await addPartnerActivity(partnerId, "note", "Note added", body.trim().slice(0, 180), createdById);
  return note;
}

export async function archivePartner(organizationId: string, id: string, actorId?: string) {
  const existing = await prisma.partner.findFirst({ where: { id, organizationId } });
  if (!existing) return null;
  const partner = await prisma.partner.update({ where: { id }, data: { status: "ARCHIVED" } });
  await addPartnerActivity(id, "status", "Partner archived", null, actorId);
  return partner;
}

export async function bulkUpdatePartners(
  organizationId: string,
  ids: string[],
  action: { status?: string; archive?: boolean; tags?: string[]; doNotContact?: boolean; category?: string },
  actorId?: string,
) {
  const partners = await prisma.partner.findMany({ where: { organizationId, id: { in: ids } } });
  const results = [];
  for (const partner of partners) {
    if (action.archive) {
      results.push(await archivePartner(organizationId, partner.id, actorId));
      continue;
    }
    results.push(
      await updatePartner(
        organizationId,
        partner.id,
        {
          ...(action.status ? { status: action.status } : {}),
          ...(action.doNotContact !== undefined ? { doNotContact: action.doNotContact } : {}),
          ...(action.category ? { category: action.category } : {}),
          ...(action.tags ? { tags: Array.from(new Set([...partner.tags, ...action.tags])) } : {}),
        },
        actorId,
      ),
    );
  }
  return results.filter(Boolean);
}

export async function partnerOverviewStats(organizationId: string) {
  const partners = await prisma.partner.findMany({
    where: { organizationId, status: { not: "ARCHIVED" } },
    select: {
      id: true,
      status: true,
      partnerScore: true,
      nextFollowUpAt: true,
      createdAt: true,
    },
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = (status: string | string[]) =>
    partners.filter((p) => (Array.isArray(status) ? status.includes(p.status) : p.status === status)).length;

  const awaiting = count("AWAITING_APPROVAL");
  const followUpsDue = partners.filter((p) => p.nextFollowUpAt && p.nextFollowUpAt <= new Date()).length;
  const highPriorityNew = partners.filter((p) => p.partnerScore >= 80 && p.createdAt >= new Date(Date.now() - 7 * 86400000)).length;
  const responses = count("RESPONDED");
  const meetings = count("MEETING_BOOKED");

  return {
    potential: partners.length,
    qualified: count("QUALIFIED"),
    highPriority: partners.filter((p) => p.partnerScore >= 80).length,
    contacted: count(["CONTACTED", "FOLLOW_UP", "RESPONDED", "INTERESTED", "MEETING_BOOKED", "NEGOTIATING", "ACTIVE_PARTNER"]),
    interested: count("INTERESTED"),
    meetings,
    activePartners: count("ACTIVE_PARTNER"),
    referrals: 0,
    closedDeals: 0,
    revenueGeneratedCents: 0,
    commissionOwedCents: 0,
    commissionPaidCents: 0,
    today: {
      review: awaiting,
      followUpsDue,
      highPriorityNew,
      responses,
      meetings,
    },
    funnel: {
      DISCOVERED: count("DISCOVERED"),
      RESEARCHING: count("RESEARCHING"),
      QUALIFIED: count("QUALIFIED"),
      AWAITING_APPROVAL: count("AWAITING_APPROVAL"),
      CONTACTED: count("CONTACTED"),
      FOLLOW_UP: count("FOLLOW_UP"),
      INTERESTED: count("INTERESTED"),
      MEETING_BOOKED: count("MEETING_BOOKED"),
      NEGOTIATING: count("NEGOTIATING"),
      ACTIVE_PARTNER: count("ACTIVE_PARTNER"),
    },
  };
}
