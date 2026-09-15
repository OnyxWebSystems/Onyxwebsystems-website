import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { subDays } from "date-fns";
import {
  DEFAULT_PARTNER_CATEGORIES,
  DEFAULT_SCORING_WEIGHTS,
  ONYX_SERVICES,
} from "../src/server/partners/constants";
import { normalizeWebsiteDomain } from "../src/server/partners/normalize";
import { recommendedActionForScore, scorePartner } from "../src/server/partners/scoring";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({ where: { slug: "onyx-web-systems" } });
  if (!org) throw new Error("Organization not found — run npm run db:seed first.");

  await prisma.partnerEngineSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      categories: [...DEFAULT_PARTNER_CATEGORIES],
      onyxServices: [...ONYX_SERVICES],
    },
  });

  const existing = await prisma.partner.count({ where: { organizationId: org.id } });
  if (existing > 0) {
    console.log(`Partners already exist (${existing}). Skipping.`);
    return;
  }

  const rows = [
    {
      companyName: "Example Advisory",
      website: "https://example-advisory.test",
      industry: "Business consulting",
      category: "Business Consultants",
      country: "South Africa",
      city: "Johannesburg",
      description:
        "Fictional development seed — operational improvement advisory for established SMEs. Not a real company.",
      companySize: "11-50",
      targetClientDescription: "Established SMEs improving operations and scaling.",
      targetClientSize: "mid-market" as string | null,
      primaryContactName: "Jordan Hale" as string | null,
      primaryContactRole: "Managing Director" as string | null,
      primaryContactEmail: "jordan@example-advisory.test" as string | null,
      primaryContactLinkedin: null as string | null,
      contactPageUrl: null as string | null,
      status: "AWAITING_APPROVAL",
      tags: ["HIGH_VALUE", "BUSINESS_CONSULTANT", "seed"],
      recommendedServices: ["Business Operating Systems", "Dashboards"],
      whyGoodFit: "They advise growing businesses on operations; Onyx can implement the systems those clients need." as
        | string
        | null,
      potentialClientProfile: "Established SMEs leaving spreadsheets and disconnected tools behind." as string | null,
      recommendedPitch: "You handle strategy; Onyx handles implementation." as string | null,
    },
    {
      companyName: "Example Branding",
      website: "https://example-branding.test",
      industry: "Branding",
      category: "Branding Agencies",
      country: "South Africa",
      city: "Cape Town",
      description: "Fictional development seed — brand studios for growing consumer and services companies.",
      companySize: "2-10",
      targetClientDescription: "Growing brands that need a website and customer-facing systems after a rebrand.",
      targetClientSize: null,
      primaryContactName: "Amina Vos",
      primaryContactRole: "Founder",
      primaryContactEmail: null,
      primaryContactLinkedin: "https://linkedin.com/company/example-branding-seed",
      contactPageUrl: "https://example-branding.test/contact",
      status: "QUALIFIED",
      tags: ["BRANDING_AGENCY", "seed"],
      recommendedServices: ["Premium Web Development", "Customer Portals"],
      whyGoodFit: "They build the brand; Onyx can build the technology behind it.",
      potentialClientProfile: "Companies that have just invested in brand and now need a site or portal that matches.",
      recommendedPitch: "You build the brand; Onyx builds the technology.",
    },
    {
      companyName: "Example IT Solutions",
      website: "https://example-it-solutions.test",
      industry: "Managed IT",
      category: "IT / MSP Companies",
      country: "South Africa",
      city: "Durban",
      description: "Fictional development seed — managed IT for mid-size firms. Not a software product studio.",
      companySize: "51-200",
      targetClientDescription: "Mid-size firms needing infrastructure plus occasional custom business applications.",
      targetClientSize: null,
      primaryContactName: "Chris Naidoo",
      primaryContactRole: "Director",
      primaryContactEmail: "chris@example-it-solutions.test",
      primaryContactLinkedin: null,
      contactPageUrl: null,
      status: "CONTACTED",
      tags: ["IT_PARTNER", "seed"],
      recommendedServices: ["Custom App Development", "Internal Business Systems"],
      whyGoodFit: "They manage IT infrastructure; Onyx can build the custom applications their clients still lack.",
      potentialClientProfile: "Companies whose MSP relationship is strong but whose internal software is still generic.",
      recommendedPitch: "You manage IT infrastructure; Onyx builds custom business applications.",
    },
    {
      companyName: "Example Growth Partners",
      website: "https://example-growth-partners.test",
      industry: "Growth consulting",
      category: "Growth Consultants",
      country: "South Africa",
      city: "Pretoria",
      description: "Fictional development seed — growth retainers for owner-led companies.",
      companySize: "2-10",
      targetClientDescription: "Owner-led companies that have outgrown ad-hoc tools.",
      targetClientSize: null,
      primaryContactName: null,
      primaryContactRole: null,
      primaryContactEmail: null,
      primaryContactLinkedin: null,
      contactPageUrl: null,
      status: "DISCOVERED",
      tags: ["seed"],
      recommendedServices: ["CRM / Lead Management", "Business Automation"],
      whyGoodFit: null,
      potentialClientProfile: null,
      recommendedPitch: null,
    },
  ];

  for (const row of rows) {
    const breakdown = scorePartner(row);
    const partner = await prisma.partner.create({
      data: {
        organizationId: org.id,
        companyName: row.companyName,
        website: row.website,
        websiteDomain: normalizeWebsiteDomain(row.website),
        industry: row.industry,
        category: row.category,
        country: row.country,
        city: row.city,
        description: row.description,
        companySize: row.companySize,
        targetClientDescription: row.targetClientDescription,
        targetClientSize: row.targetClientSize,
        primaryContactName: row.primaryContactName,
        primaryContactRole: row.primaryContactRole,
        primaryContactEmail: row.primaryContactEmail,
        primaryContactLinkedin: row.primaryContactLinkedin,
        contactPageUrl: row.contactPageUrl,
        status: row.status,
        source: "seed",
        sourceUrl: row.website,
        tags: row.tags,
        recommendedServices: row.recommendedServices,
        whyGoodFit: row.whyGoodFit,
        potentialClientProfile: row.potentialClientProfile,
        recommendedPitch: row.recommendedPitch,
        partnerScore: breakdown.total,
        clientValueScore: breakdown.clientValueScore,
        fitScore: breakdown.fitScore,
        relationshipScore: breakdown.relationshipScore,
        networkScore: breakdown.networkScore,
        technologyGapScore: breakdown.technologyGapScore,
        competitionRiskScore: breakdown.competitionRiskScore,
        scoreBreakdown: breakdown,
        recommendedAction: recommendedActionForScore(
          breakdown.total,
          Boolean(row.primaryContactEmail || row.primaryContactLinkedin || row.contactPageUrl),
          Boolean(row.description),
        ),
        lastResearchedAt: row.status === "DISCOVERED" ? null : subDays(new Date(), 3),
        lastContactedAt: row.status === "CONTACTED" ? subDays(new Date(), 5) : null,
      },
    });
    await prisma.partnerActivity.create({
      data: {
        partnerId: partner.id,
        type: "discovered",
        title: "Partner discovered",
        detail: "Development seed data — fictional company",
      },
    });
    console.log(`Created ${partner.companyName} (${partner.partnerScore}/100)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
