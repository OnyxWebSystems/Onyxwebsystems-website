import { z } from "zod";
import { completeJson } from "@/server/llm/ai-service";
import { ONYX_SERVICES } from "./constants";
import { PARTNER_ANALYSIS_SYSTEM } from "./prompts";

export const PartnershipAnalysisSchema = z.object({
  whyGoodFit: z.string(),
  whyOnyx: z.string(),
  idealClientProfile: z.string(),
  recommendedServices: z.array(z.string()).default([]),
  recommendedApproach: z.string(),
  partnershipAngle: z.string(),
  recommendedPitch: z.string(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
});

export type PartnershipAnalysis = z.infer<typeof PartnershipAnalysisSchema>;

export type AnalysisInput = {
  companyName: string;
  industry?: string | null;
  category?: string | null;
  website?: string | null;
  description?: string | null;
  services?: string | null;
  targetClients?: string | null;
  location?: string | null;
  decisionMakerName?: string | null;
  decisionMakerRole?: string | null;
};

function fallbackAnalysis(input: AnalysisInput): PartnershipAnalysis {
  const category = input.category ?? "professional services";
  return {
    whyGoodFit: input.description
      ? `${input.companyName} works in ${category}, which often sits next to implementation work rather than competing with it.`
      : `Not enough verified information yet to explain why ${input.companyName} is a fit. Research the company first.`,
    whyOnyx:
      "Onyx builds the digital infrastructure behind growing businesses, which complements advisory, brand, finance, and operations work.",
    idealClientProfile: input.targetClients || "Unknown",
    recommendedServices: [...ONYX_SERVICES].slice(0, 3),
    recommendedApproach: "Lead with a specific overlap between their client work and Onyx implementation, then ask if a simple referral conversation is useful.",
    partnershipAngle: angleForCategory(input.category),
    recommendedPitch: angleForCategory(input.category),
    priority: input.description ? "MEDIUM" : "LOW",
  };
}

function angleForCategory(category?: string | null) {
  const value = (category ?? "").toLowerCase();
  if (value.includes("brand")) return "You build the brand; Onyx builds the technology.";
  if (value.includes("cfo") || value.includes("account") || value.includes("finance")) {
    return "You manage the financial side; Onyx builds the operational system.";
  }
  if (value.includes("it") || value.includes("msp")) {
    return "You manage IT infrastructure; Onyx builds custom business applications.";
  }
  if (value.includes("consult") || value.includes("growth")) {
    return "You handle strategy; Onyx handles implementation.";
  }
  return "You grow the client relationship; Onyx builds the systems those clients need next.";
}

export async function generatePartnershipAnalysis(input: AnalysisInput) {
  const fallback = fallbackAnalysis(input);
  return completeJson({
    schema: PartnershipAnalysisSchema,
    system: PARTNER_ANALYSIS_SYSTEM,
    user: JSON.stringify(input, null, 2),
    fallback,
    timeoutMs: 20_000,
  });
}
