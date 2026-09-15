import { prisma } from "@/server/db";
import { completeJson } from "@/server/llm/ai-service";
import { generatePartnershipAnalysis } from "./analysis";
import { addPartnerActivity, persistPartnerScore } from "./domain";
import { generateOutreach } from "./outreach";
import { RESEARCH_EXTRACT_SYSTEM } from "./prompts";
import { fetchPublicCompanyPage, ResearchFindingsSchema, type ResearchFindings } from "./research";

export async function researchPartner(organizationId: string, partnerId: string, actorId?: string, force = false) {
  const partner = await prisma.partner.findFirst({ where: { id: partnerId, organizationId } });
  if (!partner) return { error: "not_found" as const };
  if (!partner.website) return { error: "no_website" as const };

  if (!force && partner.lastResearchedAt) {
    const latest = await prisma.partnerResearch.findFirst({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      include: { sources: true },
    });
    if (latest) return { partner, research: latest, cached: true as const };
  }

  await prisma.partner.update({ where: { id: partnerId }, data: { status: partner.status === "DISCOVERED" ? "RESEARCHING" : partner.status } });

  const page = await fetchPublicCompanyPage(partner.website);
  let findings: ResearchFindings = page.findings;
  if (page.extracted.textExcerpt) {
    const extracted = await completeJson({
      schema: ResearchFindingsSchema,
      system: RESEARCH_EXTRACT_SYSTEM,
      user: JSON.stringify({
        companyName: partner.companyName,
        website: partner.website,
        title: page.extracted.title,
        metaDescription: page.extracted.description,
        text: page.extracted.textExcerpt.slice(0, 8000),
      }),
      fallback: page.findings,
    });
    findings = extracted.data;
  }

  const research = await prisma.$transaction(async (tx) => {
    const created = await tx.partnerResearch.create({
      data: {
        partnerId,
        findings,
        sources: {
          create: page.sources.map((source) => ({
            sourceName: source.sourceName,
            sourceUrl: source.sourceUrl,
            sourceType: source.sourceType,
            snippet: source.snippet,
          })),
        },
      },
      include: { sources: true },
    });

    await tx.partner.update({
      where: { id: partnerId },
      data: {
        description:
          findings.companyDescription !== "Unknown" && findings.companyDescription !== "Not found"
            ? findings.companyDescription
            : partner.description,
        companySize:
          findings.companySize !== "Unknown" && findings.companySize !== "Not found"
            ? findings.companySize
            : partner.companySize,
        industry: partner.industry || (findings.industriesServed !== "Unknown" ? findings.industriesServed : partner.industry),
        targetClientDescription:
          partner.targetClientDescription ||
          (findings.targetCustomers !== "Unknown" ? findings.targetCustomers : partner.targetClientDescription),
        city: partner.city,
        primaryContactEmail: partner.primaryContactEmail || page.extracted.contactEmail || null,
        linkedinUrl: partner.linkedinUrl || page.extracted.linkedinUrl || null,
        contactPageUrl: partner.contactPageUrl || page.extracted.contactPageUrl || null,
        lastResearchedAt: new Date(),
        status: partner.status === "DISCOVERED" || partner.status === "RESEARCHING" ? "QUALIFIED" : partner.status,
      },
    });
    return created;
  });

  await addPartnerActivity(partnerId, "researched", "Research completed", partner.website, actorId);
  const updated = await prisma.partner.findFirstOrThrow({ where: { id: partnerId } });
  await persistPartnerScore(updated);
  return { partner: updated, research, cached: false as const };
}

export async function analysePartner(organizationId: string, partnerId: string, actorId?: string) {
  const partner = await prisma.partner.findFirst({
    where: { id: partnerId, organizationId },
    include: { research: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!partner) return null;
  const findings = (partner.research[0]?.findings ?? {}) as Partial<ResearchFindings>;
  const result = await generatePartnershipAnalysis({
    companyName: partner.companyName,
    industry: partner.industry,
    category: partner.category,
    website: partner.website,
    description: partner.description ?? findings.companyDescription,
    services: findings.services,
    targetClients: partner.targetClientDescription ?? findings.targetCustomers,
    location: [partner.city, partner.province, partner.country].filter(Boolean).join(", "),
    decisionMakerName: partner.primaryContactName,
    decisionMakerRole: partner.primaryContactRole,
  });

  const updated = await prisma.partner.update({
    where: { id: partnerId },
    data: {
      whyGoodFit: result.data.whyGoodFit,
      potentialClientProfile: result.data.idealClientProfile,
      recommendedServices: result.data.recommendedServices,
      recommendedPitch: result.data.recommendedPitch,
      partnershipAngle: result.data.partnershipAngle,
      recommendedAction: result.data.recommendedApproach,
    },
  });
  await addPartnerActivity(partnerId, "analysed", "Partnership analysis generated", null, actorId);
  await persistPartnerScore(updated);
  return { partner: updated, analysis: result.data, usedFallback: result.usedFallback };
}

export async function createOutreachDraft(organizationId: string, partnerId: string, actorId?: string) {
  const partner = await prisma.partner.findFirst({
    where: { id: partnerId, organizationId },
    include: { research: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!partner) return { error: "not_found" as const };
  if (partner.doNotContact) return { error: "do_not_contact" as const };

  const findings = (partner.research[0]?.findings ?? {}) as Partial<ResearchFindings>;
  const draft = await generateOutreach({
    companyName: partner.companyName,
    personName: partner.primaryContactName,
    role: partner.primaryContactRole,
    industry: partner.industry,
    category: partner.category,
    services: findings.services,
    targetClients: partner.targetClientDescription ?? findings.targetCustomers,
    whyGoodFit: partner.whyGoodFit,
    partnershipAngle: partner.partnershipAngle,
    recommendedServices: partner.recommendedServices,
  });

  const outreach = await prisma.partnerOutreach.create({
    data: {
      partnerId,
      channel: partner.primaryContactEmail ? "EMAIL" : partner.contactPageUrl ? "WEBSITE_CONTACT" : "LINKEDIN",
      subject: draft.data.subject,
      message: draft.data.message,
      status: "AWAITING_APPROVAL",
    },
  });
  await prisma.partner.update({
    where: { id: partnerId },
    data: { status: partner.status === "ARCHIVED" ? partner.status : "AWAITING_APPROVAL" },
  });
  await addPartnerActivity(partnerId, "outreach_generated", "Outreach draft generated", outreach.subject, actorId);
  return { outreach, usedFallback: draft.usedFallback };
}

export async function reviewOutreach(
  organizationId: string,
  outreachId: string,
  action: "approve" | "reject" | "mark_contacted",
  actorId?: string,
  message?: string,
) {
  const outreach = await prisma.partnerOutreach.findFirst({
    where: { id: outreachId, partner: { organizationId } },
    include: { partner: true },
  });
  if (!outreach) return { error: "not_found" as const };
  if (outreach.partner.doNotContact) return { error: "do_not_contact" as const };

  if (action === "reject") {
    const updated = await prisma.partnerOutreach.update({
      where: { id: outreachId },
      data: { status: "CANCELLED", message: message ?? outreach.message },
    });
    await addPartnerActivity(outreach.partnerId, "outreach_rejected", "Outreach rejected", null, actorId);
    return { outreach: updated };
  }

  if (action === "approve") {
    const updated = await prisma.partnerOutreach.update({
      where: { id: outreachId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: actorId,
        message: message ?? outreach.message,
      },
    });
    await prisma.partner.update({
      where: { id: outreach.partnerId },
      data: { status: "APPROVED" },
    });
    await addPartnerActivity(outreach.partnerId, "outreach_approved", "Outreach approved", null, actorId);
    return { outreach: updated };
  }

  if (outreach.status !== "APPROVED" && outreach.status !== "READY") {
    return { error: "not_approved" as const };
  }

  const updated = await prisma.partnerOutreach.update({
    where: { id: outreachId },
    data: { status: "SENT", sentAt: new Date(), sentById: actorId },
  });
  await prisma.partner.update({
    where: { id: outreach.partnerId },
    data: { status: "CONTACTED", lastContactedAt: new Date() },
  });
  await addPartnerActivity(outreach.partnerId, "outreach_sent", "Marked as contacted", null, actorId);
  return { outreach: updated };
}
