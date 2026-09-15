export const PARTNER_STATUSES = [
  "DISCOVERED",
  "RESEARCHING",
  "QUALIFIED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "CONTACTED",
  "FOLLOW_UP",
  "RESPONDED",
  "INTERESTED",
  "MEETING_BOOKED",
  "NEGOTIATING",
  "ACTIVE_PARTNER",
  "NOT_INTERESTED",
  "UNQUALIFIED",
  "ARCHIVED",
] as const;

export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const FUNNEL_STATUSES = [
  "DISCOVERED",
  "RESEARCHING",
  "QUALIFIED",
  "AWAITING_APPROVAL",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "MEETING_BOOKED",
  "NEGOTIATING",
  "ACTIVE_PARTNER",
] as const;

export const FUNNEL_LABELS: Record<(typeof FUNNEL_STATUSES)[number], string> = {
  DISCOVERED: "Discovered",
  RESEARCHING: "Researching",
  QUALIFIED: "Qualified",
  AWAITING_APPROVAL: "Awaiting Approval",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  INTERESTED: "Interested",
  MEETING_BOOKED: "Meeting",
  NEGOTIATING: "Negotiating",
  ACTIVE_PARTNER: "Active Partner",
};

export const STATUS_LABELS: Record<PartnerStatus, string> = {
  DISCOVERED: "Discovered",
  RESEARCHING: "Researching",
  QUALIFIED: "Qualified",
  AWAITING_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  RESPONDED: "Responded",
  INTERESTED: "Interested",
  MEETING_BOOKED: "Meeting booked",
  NEGOTIATING: "Negotiating",
  ACTIVE_PARTNER: "Active partner",
  NOT_INTERESTED: "Not interested",
  UNQUALIFIED: "Unqualified",
  ARCHIVED: "Archived",
};

export const OUTREACH_STATUSES = [
  "DRAFT",
  "AWAITING_APPROVAL",
  "APPROVED",
  "READY",
  "SENT",
  "CANCELLED",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const OUTREACH_CHANNELS = [
  "EMAIL",
  "LINKEDIN",
  "PHONE",
  "WEBSITE_CONTACT",
  "REFERRAL_INTRO",
  "OTHER",
] as const;

export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];

export const PARTNER_TYPES = ["REFERRAL", "TECHNOLOGY", "STRATEGIC"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const CONTRACT_STATUSES = ["NOT_SENT", "SENT", "SIGNED", "ACTIVE"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const DEFAULT_PARTNER_CATEGORIES = [
  "Business Consultants",
  "Growth Consultants",
  "Fractional CFOs",
  "Accounting Advisory Firms",
  "Branding Agencies",
  "Marketing Agencies",
  "IT / MSP Companies",
  "Recruitment Firms",
  "Business Brokers",
  "Commercial Property Firms",
  "Startup Accelerators",
  "Startup Incubators",
  "Enterprise Development Organisations",
  "Corporate Finance Firms",
  "Professional Services Firms",
  "Industry Associations",
] as const;

export const ONYX_SERVICES = [
  "Premium Web Development",
  "Custom App Development",
  "Business Operating Systems",
  "Dashboards",
  "Booking Systems",
  "CRM / Lead Management",
  "Business Automation",
  "Customer Portals",
  "Internal Business Systems",
  "Digital workflows and connected business infrastructure",
] as const;

export const DEFAULT_SCORING_WEIGHTS = {
  purchasingPower: 20,
  relevance: 20,
  network: 15,
  competition: 15,
  technologyGap: 10,
  credibility: 10,
  contactability: 5,
  geography: 5,
} as const;

export type ScoringWeights = {
  purchasingPower: number;
  relevance: number;
  network: number;
  competition: number;
  technologyGap: number;
  credibility: number;
  contactability: number;
  geography: number;
};

export const HIGH_FIT_CATEGORIES = new Set([
  "Business Consultants",
  "Growth Consultants",
  "Fractional CFOs",
  "Accounting Advisory Firms",
  "Branding Agencies",
  "Marketing Agencies",
  "Recruitment Firms",
  "Business Brokers",
  "Corporate Finance Firms",
  "Professional Services Firms",
]);

export const NETWORK_HEAVY_CATEGORIES = new Set([
  "Startup Accelerators",
  "Startup Incubators",
  "Enterprise Development Organisations",
  "Industry Associations",
  "Corporate Finance Firms",
  "Business Brokers",
]);

export const COMPETING_CATEGORIES = new Set(["IT / MSP Companies"]);

export const SCORE_BANDS = [
  { min: 90, max: 100, label: "Excellent", key: "excellent" },
  { min: 80, max: 89, label: "High Priority", key: "high" },
  { min: 70, max: 79, label: "Good", key: "good" },
  { min: 50, max: 69, label: "Potential", key: "potential" },
  { min: 0, max: 49, label: "Low Priority", key: "low" },
] as const;

export function scoreBand(score: number) {
  return SCORE_BANDS.find((band) => score >= band.min && score <= band.max) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

export const ONYX_POSITIONING =
  "Onyx builds the digital infrastructure behind growing businesses — from premium websites and custom applications to dashboards, booking systems, CRM workflows, automation and business operating systems.";

export const ONYX_TAGLINE = "Your clients grow. Their technology needs to grow with them.";

export const SITE_URL = "https://onyxwebsystems.co.za/";
