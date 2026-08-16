export type UrgencyLevel = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export type UrgencyInput = {
  text: string;
  outdoorTempF?: number | null;
  hasVulnerableOccupant?: boolean | null;
  systemFullyDown?: boolean | null;
};

export type UrgencyResult = {
  level: UrgencyLevel;
  matchedRule?: string;
  requiresEscalation: boolean;
  safetyScript?: string;
  reasons: string[];
};

const CRITICAL_PATTERNS: { name: string; patterns: RegExp[]; script: string }[] = [
  {
    name: "security_incident",
    patterns: [
      /security\s*(breach|incident|issue)/i,
      /hack(ed|ing)?/i,
      /unauthorized\s*access/i,
      /data\s*(leak|breach|stolen)/i,
    ],
    script:
      "We are treating this as a priority security concern and escalating to management immediately. Please preserve any evidence and avoid sharing passwords or one-time codes over this channel.",
  },
];

const HIGH_PATTERNS = [
  /urgent/i,
  /emergency/i,
  /asap/i,
  /outage/i,
  /down\s*(site|system|app)/i,
  /production\s*(issue|down)/i,
];

const COMPLAINT_PATTERNS = [
  /complaint/i,
  /angry/i,
  /unacceptable/i,
  /lawsuit/i,
  /lawyer/i,
  /refund/i,
  /chargeback/i,
  /dispute/i,
  /manager/i,
  /speak\s*to\s*(a\s*)?(human|person|supervisor|manager)/i,
];

export function classifyUrgency(input: UrgencyInput): UrgencyResult {
  const text = input.text ?? "";
  const reasons: string[] = [];

  for (const rule of CRITICAL_PATTERNS) {
    if (rule.patterns.some((p) => p.test(text))) {
      return {
        level: "CRITICAL",
        matchedRule: rule.name,
        requiresEscalation: true,
        safetyScript: rule.script,
        reasons: [`Matched safety rule: ${rule.name}`],
      };
    }
  }

  if (COMPLAINT_PATTERNS.some((p) => p.test(text))) {
    return {
      level: "HIGH",
      matchedRule: "complaint_or_human_request",
      requiresEscalation: true,
      reasons: ["Complaint, dispute, or human handoff requested"],
    };
  }

  if (HIGH_PATTERNS.some((p) => p.test(text))) {
    return {
      level: "HIGH",
      matchedRule: "urgent_ops",
      requiresEscalation: false,
      reasons: ["Urgent operational language"],
    };
  }

  if (
    /quote|estimate|pricing|consultation|modules?|portfolio|hours|warranty|bos|app\s*dev|web\s*dev/i.test(
      text,
    )
  ) {
    return {
      level: "LOW",
      matchedRule: "informational",
      requiresEscalation: false,
      reasons: ["Informational / consult enquiry"],
    };
  }

  return {
    level: "NORMAL",
    matchedRule: "default",
    requiresEscalation: false,
    reasons: ["Standard service request"],
  };
}
