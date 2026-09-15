import {
  COMPETING_CATEGORIES,
  DEFAULT_SCORING_WEIGHTS,
  HIGH_FIT_CATEGORIES,
  NETWORK_HEAVY_CATEGORIES,
  type ScoringWeights,
} from "./constants";

export type ScoreInput = {
  category?: string | null;
  industry?: string | null;
  description?: string | null;
  companySize?: string | null;
  estimatedRevenueCents?: number | null;
  targetClientDescription?: string | null;
  targetClientSize?: string | null;
  targetIndustries?: string[];
  country?: string | null;
  province?: string | null;
  city?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;
  contactPageUrl?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  primaryContactLinkedin?: string | null;
  recommendedServices?: string[];
};

export type ScoreCriterion = {
  key: keyof ScoringWeights;
  label: string;
  points: number;
  max: number;
  reason: string;
};

export type ScoreBreakdown = {
  total: number;
  clientValueScore: number;
  fitScore: number;
  relationshipScore: number;
  networkScore: number;
  technologyGapScore: number;
  competitionRiskScore: number;
  criteria: ScoreCriterion[];
};

const PURCHASING_HINTS = [
  "sme",
  "established",
  "mid-market",
  "mid market",
  "enterprise",
  "growing business",
  "scale",
  "4,000",
  "4000",
  "$4",
  "revenue",
  "operations",
];

const SMALL_CLIENT_HINTS = ["startup", "solopreneur", "freelancer", "micro"];
const TECH_BUILDER_HINTS = [
  "web development",
  "website development",
  "app development",
  "software agency",
  "custom software",
  "full-stack",
];
const ADVISORY_HINTS = ["advisory", "consult", "strategy", "cfo", "account", "brand", "marketing", "recruit"];

function blob(input: ScoreInput) {
  return [
    input.category,
    input.industry,
    input.description,
    input.targetClientDescription,
    input.targetClientSize,
    ...(input.targetIndustries ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function scaleTo100(points: number, max: number) {
  if (max <= 0) return 0;
  return clamp((points / max) * 100, 100);
}

function sizeBand(companySize?: string | null) {
  const value = (companySize ?? "").toLowerCase();
  if (!value) return "unknown";
  if (/(1\s*[-–]\s*10|1-10|solo|2-10|small)/.test(value)) return "small";
  if (/(11|20|25|50|medium)/.test(value)) return "medium";
  if (/(100|200|500|1000|enterprise|large)/.test(value)) return "large";
  return "unknown";
}

export function scorePartner(input: ScoreInput, weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS): ScoreBreakdown {
  const text = blob(input);
  const size = sizeBand(input.companySize);

  const purchasing = scorePurchasingPower(input, text, weights.purchasingPower);
  const relevance = scoreRelevance(input, text, weights.relevance);
  const network = scoreNetwork(input, size, weights.network);
  const competition = scoreNonCompete(input, text, weights.competition);
  const gap = scoreTechnologyGap(text, input.category, weights.technologyGap);
  const credibility = scoreCredibility(input, weights.credibility);
  const contactability = scoreContactability(input, weights.contactability);
  const geography = scoreGeography(input, weights.geography);

  const criteria = [purchasing, relevance, network, competition, gap, credibility, contactability, geography];
  const total = clamp(
    criteria.reduce((sum, item) => sum + item.points, 0),
    100,
  );

  return {
    total,
    clientValueScore: scaleTo100(purchasing.points, purchasing.max),
    fitScore: scaleTo100(relevance.points, relevance.max),
    relationshipScore: scaleTo100(network.points, network.max),
    networkScore: scaleTo100(network.points, network.max),
    technologyGapScore: scaleTo100(gap.points, gap.max),
    competitionRiskScore: scaleTo100(competition.max - competition.points, competition.max),
    criteria,
  };
}

function scorePurchasingPower(input: ScoreInput, text: string, max: number): ScoreCriterion {
  let points = max * 0.4;
  let reason = "Client purchasing power is not fully known, so this is scored conservatively.";

  if (PURCHASING_HINTS.some((hint) => text.includes(hint))) {
    points = max * 0.85;
    reason = "Target clients appear to be established or growing businesses that can fund $4,000+ projects.";
  }
  if (SMALL_CLIENT_HINTS.some((hint) => text.includes(hint)) && !PURCHASING_HINTS.some((hint) => text.includes(hint))) {
    points = max * 0.35;
    reason = "Target clients look smaller, so purchasing power for $4,000+ work is less certain.";
  }
  if (["Fractional CFOs", "Accounting Advisory Firms", "Corporate Finance Firms", "Business Consultants"].includes(input.category ?? "")) {
    points = Math.max(points, max * 0.9);
    reason = "This category typically works with businesses that already have budget for operations and technology.";
  }
  if ((input.estimatedRevenueCents ?? 0) >= 500_000_00) {
    points = Math.max(points, max * 0.8);
  }
  if (input.targetClientSize && /enterprise|mid|50\+|established/i.test(input.targetClientSize)) {
    points = Math.max(points, max * 0.9);
    reason = "Stated target client size is aligned with businesses that can afford substantial technology work.";
  }
  if (!input.targetClientDescription && !input.targetClientSize && !input.category) {
    points = max * 0.4;
    reason = "No target-client information yet.";
  }

  return {
    key: "purchasingPower",
    label: "Client purchasing power",
    points: clamp(points, max),
    max,
    reason,
  };
}

function scoreRelevance(input: ScoreInput, text: string, max: number): ScoreCriterion {
  const category = input.category ?? "";
  let points = max * 0.5;
  let reason = "Relevance is based on limited category or industry information.";

  if (HIGH_FIT_CATEGORIES.has(category)) {
    points = max * 0.9;
    reason = "This partner type regularly advises growing businesses that later need implementation partners.";
  } else if (NETWORK_HEAVY_CATEGORIES.has(category)) {
    points = max * 0.8;
    reason = "Ecosystem partners can introduce Onyx to many relevant companies, even if they are not day-to-day advisors.";
  } else if (COMPETING_CATEGORIES.has(category)) {
    points = max * 0.7;
    reason = "IT/MSP firms can refer custom application work, but overlap with Onyx services is possible.";
  }

  if (/(consult|advisor|cfo|brand|marketing|account|operat)/.test(text)) {
    points = Math.max(points, max * 0.85);
  }
  if ((input.recommendedServices?.length ?? 0) >= 2) {
    points = Math.min(max, points + max * 0.05);
  }

  return { key: "relevance", label: "Onyx relevance", points: clamp(points, max), max, reason };
}

function scoreNetwork(input: ScoreInput, size: string, max: number): ScoreCriterion {
  const category = input.category ?? "";
  let points = max * 0.45;
  let reason = "Client-network strength is inferred conservatively until more is known.";

  if (NETWORK_HEAVY_CATEGORIES.has(category)) {
    points = max * 0.95;
    reason = "This category typically has a wide network of businesses by design.";
  } else if (HIGH_FIT_CATEGORIES.has(category)) {
    points = max * 0.8;
    reason = "Advisory firms usually have ongoing client relationships they can introduce.";
  }
  if (size === "large") {
    points = Math.max(points, max * 0.9);
    reason = "A larger firm is more likely to have a substantial client book.";
  } else if (size === "medium") {
    points = Math.max(points, max * 0.75);
  } else if (size === "small") {
    points = Math.min(points, max * 0.65);
    reason = "Smaller firms can still refer well, but the network is likely narrower.";
  }

  return { key: "network", label: "Client network", points: clamp(points, max), max, reason };
}

function scoreNonCompete(input: ScoreInput, text: string, max: number): ScoreCriterion {
  let points = max * 0.7;
  let reason = "Competition with Onyx is not fully known.";

  if (TECH_BUILDER_HINTS.some((hint) => text.includes(hint))) {
    points = max * 0.25;
    reason = "Public description suggests they already build websites or applications.";
  } else if (COMPETING_CATEGORIES.has(input.category ?? "")) {
    points = max * 0.65;
    reason = "IT/MSP companies may overlap with implementation work, but can still refer custom systems.";
  } else if (ADVISORY_HINTS.some((hint) => text.includes(hint)) || HIGH_FIT_CATEGORIES.has(input.category ?? "")) {
    points = max;
    reason = "Their work is advisory, brand, or financial — complementary rather than competing.";
  }

  return { key: "competition", label: "Does not compete with Onyx", points: clamp(points, max), max, reason };
}

function scoreTechnologyGap(text: string, category: string | null | undefined, max: number): ScoreCriterion {
  let points = max * 0.5;
  let reason = "Technology gap is unknown until services are researched.";

  if (TECH_BUILDER_HINTS.some((hint) => text.includes(hint))) {
    points = max * 0.3;
    reason = "They already appear to offer technology build services, so the gap is smaller.";
  } else if (ADVISORY_HINTS.some((hint) => text.includes(hint)) || HIGH_FIT_CATEGORIES.has(category ?? "")) {
    points = max * 0.9;
    reason = "They advise on growth or operations, which often outpaces the client's current technology.";
  }

  return { key: "technologyGap", label: "Potential technology gap", points: clamp(points, max), max, reason };
}

function scoreCredibility(input: ScoreInput, max: number): ScoreCriterion {
  let points = 0;
  const parts: string[] = [];
  if (input.website) {
    points += max * 0.3;
    parts.push("website");
  }
  if ((input.description ?? "").length > 40) {
    points += max * 0.25;
    parts.push("company description");
  }
  if (input.linkedinUrl) {
    points += max * 0.2;
    parts.push("LinkedIn");
  }
  if (input.companySize) {
    points += max * 0.15;
    parts.push("company size");
  }
  if (input.primaryContactName) {
    points += max * 0.1;
    parts.push("named contact");
  }
  if (points === 0) {
    return {
      key: "credibility",
      label: "Partner credibility",
      points: clamp(max * 0.3, max),
      max,
      reason: "Little public information is on file yet.",
    };
  }
  return {
    key: "credibility",
    label: "Partner credibility",
    points: clamp(points, max),
    max,
    reason: `Credibility is based on ${parts.join(", ")}.`,
  };
}

function scoreContactability(input: ScoreInput, max: number): ScoreCriterion {
  let points = 0;
  const parts: string[] = [];
  if (input.primaryContactEmail) {
    points += 3;
    parts.push("email");
  }
  if (input.primaryContactPhone) {
    points += 1;
    parts.push("phone");
  }
  if (input.primaryContactLinkedin || input.linkedinUrl) {
    points += 1;
    parts.push("LinkedIn");
  }
  if (input.contactPageUrl) {
    points += 1;
    parts.push("contact page");
  }
  if (points === 0) {
    return {
      key: "contactability",
      label: "Ease of reaching a decision maker",
      points: 1,
      max,
      reason: "No public contact path is recorded yet.",
    };
  }
  return {
    key: "contactability",
    label: "Ease of reaching a decision maker",
    points: clamp((points / 6) * max, max),
    max,
    reason: `Contact path includes ${parts.join(", ")}.`,
  };
}

function scoreGeography(input: ScoreInput, max: number): ScoreCriterion {
  const place = [input.country, input.province, input.city].filter(Boolean).join(" ").toLowerCase();
  if (!place) {
    return {
      key: "geography",
      label: "Geographical relevance",
      points: clamp(max * 0.4, max),
      max,
      reason: "Location is not recorded yet.",
    };
  }
  if (/(south africa|za|johannesburg|cape town|durban|pretoria|gauteng|western cape)/.test(place)) {
    return {
      key: "geography",
      label: "Geographical relevance",
      points: max,
      max,
      reason: "Located in South Africa, which is highly relevant for Onyx.",
    };
  }
  if (/(united kingdom|uk|united states|usa|us|australia|canada|ireland|netherlands)/.test(place)) {
    return {
      key: "geography",
      label: "Geographical relevance",
      points: clamp(max * 0.8, max),
      max,
      reason: "English-speaking market that can still refer or collaborate remotely.",
    };
  }
  return {
    key: "geography",
    label: "Geographical relevance",
    points: clamp(max * 0.6, max),
    max,
    reason: "A location is recorded, but it is outside the core South African market.",
  };
}

export function recommendedActionForScore(total: number, hasContact: boolean, researched: boolean) {
  if (!researched) return "Research company";
  if (total >= 80 && hasContact) return "Send personalised partnership invitation.";
  if (total >= 80) return "Identify decision maker";
  if (total >= 70) return "Review score and generate outreach";
  if (total >= 50) return "Qualify further before outreach";
  return "Archive or mark unqualified unless new information appears";
}
