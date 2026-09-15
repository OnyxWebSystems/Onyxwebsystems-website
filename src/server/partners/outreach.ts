import { z } from "zod";
import { completeJson } from "@/server/llm/ai-service";
import { PARTNER_OUTREACH_SYSTEM } from "./prompts";

export const OutreachDraftSchema = z.object({
  subject: z.string().min(4),
  message: z.string().min(40),
});

export type OutreachDraft = z.infer<typeof OutreachDraftSchema>;

export type OutreachInput = {
  companyName: string;
  personName?: string | null;
  role?: string | null;
  industry?: string | null;
  category?: string | null;
  services?: string | null;
  targetClients?: string | null;
  whyGoodFit?: string | null;
  partnershipAngle?: string | null;
  recommendedServices?: string[];
};

function openingName(input: OutreachInput) {
  const name = input.personName?.trim();
  if (!name || /^unknown|not found$/i.test(name)) return null;
  return name.split(/\s+/)[0];
}

export function fallbackOutreach(input: OutreachInput): OutreachDraft {
  const first = openingName(input);
  const greeting = first ? `Hi ${first},` : `Hi,`;
  const noticed = input.category
    ? `I was looking at ${input.category.toLowerCase()} that work with growing businesses`
    : `I was looking at firms that work with growing businesses`;
  const angle =
    input.partnershipAngle ||
    "There could be a fit when one of your clients reaches the point where spreadsheets, disconnected tools or manual processes are holding them back.";
  const services = input.recommendedServices?.slice(0, 3).join(", ") || "dashboards, booking systems and business operating systems";

  return {
    subject: `Partnership with ${input.companyName}`,
    message: `${greeting}

I came across ${input.companyName} while ${noticed}.

I run Onyx Web Systems, where we build the technology that sits behind growing businesses — from premium websites and custom applications to CRM workflows, ${services}.

${angle}

You can see what we do here:
https://onyxwebsystems.co.za/

If this sounds relevant to the businesses you work with, I would be happy to explore a simple referral or technology partnership. If it is not a fit, just say so and I will not follow up.`,
  };
}

export async function generateOutreach(input: OutreachInput) {
  const fallback = fallbackOutreach(input);
  return completeJson({
    schema: OutreachDraftSchema,
    system: PARTNER_OUTREACH_SYSTEM,
    user: JSON.stringify(input, null, 2),
    fallback,
    timeoutMs: 20_000,
  });
}
