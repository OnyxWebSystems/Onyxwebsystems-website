export type RouteIntent =
  | "book_appointment"
  | "reschedule"
  | "cancel"
  | "emergency"
  | "complaint"
  | "billing"
  | "sales"
  | "support"
  | "faq"
  | "greeting"
  | "missed_call_recovery"
  | "human_request"
  | "unknown";

export type RoutingInput = {
  intent: RouteIntent;
  urgency: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  customerType?: string | null;
  serviceCategory?: string | null;
  isExistingCustomer?: boolean;
};

export type RoutingResult = {
  departmentSlug: string;
  reason: string;
};

/**
 * Deterministic router — business-critical decisions do not rely on the LLM.
 */
export function routeRequest(input: RoutingInput): RoutingResult {
  if (input.urgency === "CRITICAL" || input.intent === "emergency") {
    return { departmentSlug: "emergency", reason: "Critical/emergency urgency" };
  }

  if (input.intent === "complaint" || input.intent === "human_request") {
    return { departmentSlug: "management", reason: "Complaint or explicit human request" };
  }

  if (input.intent === "billing") {
    return { departmentSlug: "billing", reason: "Billing intent" };
  }

  if (input.intent === "sales" || (!input.isExistingCustomer && input.intent === "book_appointment" && input.serviceCategory === "install")) {
    return { departmentSlug: "sales", reason: "New installation / sales opportunity" };
  }

  if (
    input.intent === "book_appointment" ||
    input.intent === "reschedule" ||
    input.intent === "cancel" ||
    input.intent === "missed_call_recovery"
  ) {
    return { departmentSlug: "scheduling", reason: "Scheduling workflow" };
  }

  if (input.intent === "support" || input.urgency === "HIGH") {
    return { departmentSlug: "support", reason: "Support or high-priority issue" };
  }

  if (input.intent === "faq" || input.intent === "greeting") {
    return { departmentSlug: "support", reason: "FAQ / greeting" };
  }

  return { departmentSlug: "support", reason: "Default support queue" };
}
