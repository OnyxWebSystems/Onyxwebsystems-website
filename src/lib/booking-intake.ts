export const BOS_MODULES = [
  "Customer Experience / Front Desk",
  "Lead Management & Speed-to-Lead",
  "Sales & CRM",
  "Marketing",
  "Operations",
  "Customer Support",
  "Internal Comms",
  "Reporting & Analytics",
  "Follow-Ups",
  "Document / Data Processing",
  "Custom Agents / Workflows",
  "Custom module",
] as const;

export const BOS_STAGES = ["Exploring", "Replacing current tools", "Ready to build"] as const;
export const TEAM_SIZES = ["1–10", "11–50", "51–200", "200+"] as const;
export const TIMELINES = ["ASAP", "1–3 months", "Exploring"] as const;

export const WEB_NEEDS = ["New site", "Redesign", "Shop", "Booking", "Brochure"] as const;
export const WEB_FEATURES = [
  "Home",
  "About",
  "Services",
  "Shop",
  "Blog",
  "Booking",
  "Contact",
  "WhatsApp",
] as const;
export const EXISTING_WEBSITE = ["Yes", "No"] as const;

export const APP_PLATFORMS = ["Web app", "iOS", "Android", "Both mobile"] as const;
export const APP_USERS = ["Customers", "Staff", "Both"] as const;
export const APP_FEATURES = ["Accounts", "Payments", "Bookings", "Admin", "Notifications"] as const;

export type ServiceInterest = "bos" | "app" | "web";

export type BookingIntake = {
  stage?: string | null;
  teamSize?: string | null;
  webNeed?: string[];
  webFeatures?: string[];
  existingWebsite?: string | null;
  timeline?: string | null;
  appPlatform?: string[];
  appUsers?: string[];
  appFeatures?: string[];
};

function has(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasAny(values?: string[] | null) {
  return Boolean(values?.length);
}

export function intakeSummaryLines(serviceInterest: ServiceInterest, intake: BookingIntake | undefined) {
  const data = intake ?? {};
  if (serviceInterest === "bos") {
    return [
      data.stage ? `Stage: ${data.stage}` : null,
      data.teamSize ? `Team size: ${data.teamSize}` : null,
    ];
  }
  if (serviceInterest === "web") {
    return [
      hasAny(data.webNeed) ? `Website need: ${data.webNeed!.join(", ")}` : null,
      hasAny(data.webFeatures) ? `Website features: ${data.webFeatures!.join(", ")}` : null,
      data.existingWebsite ? `Existing website: ${data.existingWebsite}` : null,
      data.timeline ? `Timeline: ${data.timeline}` : null,
    ];
  }
  return [
    hasAny(data.appPlatform) ? `Platform: ${data.appPlatform!.join(", ")}` : null,
    hasAny(data.appUsers) ? `Who uses it: ${data.appUsers!.join(", ")}` : null,
    hasAny(data.appFeatures) ? `App features: ${data.appFeatures!.join(", ")}` : null,
    data.timeline ? `Timeline: ${data.timeline}` : null,
  ];
}

export function intakeIsComplete(serviceInterest: ServiceInterest, intake: BookingIntake | undefined) {
  const data = intake ?? {};
  if (serviceInterest === "bos") return has(data.stage) && has(data.teamSize);
  if (serviceInterest === "web") {
    return hasAny(data.webNeed) && hasAny(data.webFeatures) && has(data.existingWebsite) && has(data.timeline);
  }
  return hasAny(data.appPlatform) && hasAny(data.appUsers) && hasAny(data.appFeatures) && has(data.timeline);
}
