import type { OutreachStatus, PartnerStatus } from "./constants";

export type NextActionInput = {
  status: PartnerStatus | string;
  doNotContact: boolean;
  lastResearchedAt?: Date | null;
  description?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactLinkedin?: string | null;
  contactPageUrl?: string | null;
  whyGoodFit?: string | null;
  pendingOutreachStatus?: OutreachStatus | string | null;
  lastContactedAt?: Date | null;
  nextFollowUpAt?: Date | null;
  contractStatus?: string | null;
  partnerScore?: number;
};

export function nextBestAction(input: NextActionInput): string {
  if (input.doNotContact) return "Do not contact — keep on file only";
  if (input.status === "ARCHIVED" || input.status === "UNQUALIFIED" || input.status === "NOT_INTERESTED") {
    return "No action — this partner is closed";
  }
  if (input.status === "ACTIVE_PARTNER") {
    if (input.contractStatus === "NOT_SENT") return "Send partnership agreement";
    return "Request first referral";
  }
  if (input.status === "NEGOTIATING") return "Send partnership agreement";
  if (input.status === "MEETING_BOOKED") return "Prepare for meeting";
  if (input.status === "INTERESTED" || input.status === "RESPONDED") return "Book meeting";
  if (input.status === "FOLLOW_UP" || (input.nextFollowUpAt && input.nextFollowUpAt <= new Date())) {
    return "Follow up";
  }
  if (input.pendingOutreachStatus === "AWAITING_APPROVAL" || input.pendingOutreachStatus === "DRAFT") {
    return "Review AI message";
  }
  if (input.pendingOutreachStatus === "APPROVED" || input.pendingOutreachStatus === "READY") {
    return "Send approved outreach";
  }
  if (input.status === "CONTACTED" && !input.lastContactedAt) return "Send approved outreach";
  if (input.status === "CONTACTED") return "Follow up";
  if (!input.lastResearchedAt && !input.description) return "Research company";
  if (!input.primaryContactName) return "Identify decision maker";
  if (!input.whyGoodFit) return "Generate partnership analysis";
  if (!input.pendingOutreachStatus) return "Generate outreach";
  if ((input.partnerScore ?? 0) >= 70 && input.status === "DISCOVERED") return "Qualify this partner";
  return "Review score and next step";
}
