import { z } from "zod";
import {
  CONTRACT_STATUSES,
  OUTREACH_CHANNELS,
  PARTNER_STATUSES,
  PARTNER_TYPES,
} from "./constants";

export const partnerCreateSchema = z.object({
  companyName: z.string().min(2).max(160),
  website: z.string().max(300).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  subIndustry: z.string().max(120).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  province: z.string().max(80).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  companySize: z.string().max(40).optional().nullable(),
  estimatedRevenueCents: z.number().int().nonnegative().optional().nullable(),
  targetClientDescription: z.string().max(2000).optional().nullable(),
  targetClientSize: z.string().max(80).optional().nullable(),
  targetIndustries: z.array(z.string().max(80)).optional(),
  keywords: z.array(z.string().max(60)).optional(),
  linkedinUrl: z.string().max(300).optional().nullable(),
  instagramUrl: z.string().max(300).optional().nullable(),
  facebookUrl: z.string().max(300).optional().nullable(),
  contactPageUrl: z.string().max(300).optional().nullable(),
  primaryContactName: z.string().max(120).optional().nullable(),
  primaryContactRole: z.string().max(120).optional().nullable(),
  primaryContactEmail: z.string().email().max(180).optional().nullable().or(z.literal("")),
  primaryContactPhone: z.string().max(40).optional().nullable(),
  primaryContactLinkedin: z.string().max(300).optional().nullable(),
  partnerType: z.enum(PARTNER_TYPES).optional(),
  source: z.string().max(40).optional(),
  sourceUrl: z.string().max(300).optional().nullable(),
  tags: z.array(z.string().max(40)).optional(),
  recommendedServices: z.array(z.string().max(80)).optional(),
});

export const partnerUpdateSchema = partnerCreateSchema.partial().extend({
  status: z.enum(PARTNER_STATUSES).optional(),
  doNotContact: z.boolean().optional(),
  contractStatus: z.enum(CONTRACT_STATUSES).optional(),
  whyGoodFit: z.string().max(4000).optional().nullable(),
  potentialClientProfile: z.string().max(4000).optional().nullable(),
  recommendedPitch: z.string().max(4000).optional().nullable(),
  partnershipAngle: z.string().max(400).optional().nullable(),
});

export const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(PARTNER_STATUSES).optional(),
  archive: z.boolean().optional(),
  tags: z.array(z.string().max(40)).optional(),
  doNotContact: z.boolean().optional(),
  category: z.string().max(120).optional(),
});

export const outreachPatchSchema = z.object({
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(8000).optional(),
  channel: z.enum(OUTREACH_CHANNELS).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const outreachActionSchema = z.object({
  action: z.enum(["approve", "reject", "mark_contacted"]),
  message: z.string().min(10).max(8000).optional(),
});

export const noteSchema = z.object({
  body: z.string().min(2).max(4000),
});

export const settingsSchema = z.object({
  scoringWeights: z
    .object({
      purchasingPower: z.number().min(0).max(40),
      relevance: z.number().min(0).max(40),
      network: z.number().min(0).max(30),
      competition: z.number().min(0).max(30),
      technologyGap: z.number().min(0).max(20),
      credibility: z.number().min(0).max(20),
      contactability: z.number().min(0).max(10),
      geography: z.number().min(0).max(10),
    })
    .optional(),
  categories: z.array(z.string().max(80)).optional(),
  onyxServices: z.array(z.string().max(80)).optional(),
  minPartnerScore: z.number().int().min(0).max(100).optional(),
  minClientValueScore: z.number().int().min(0).max(100).optional(),
  defaultCommissionBps: z.number().int().min(0).max(5000).optional(),
  minProjectValueCents: z.number().int().min(0).optional(),
});
