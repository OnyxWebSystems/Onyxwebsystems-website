export const INTAKE_PRESET_EVENT = "onyx-services-intake-preset";

export const BOS_MODULES = [
  {
    id: "sales",
    label: "Sales",
    capabilities: ["Lead Capture", "Qualification", "CRM", "Follow-ups", "Appointments", "Pipeline"],
  },
  {
    id: "customer-experience",
    label: "Customer Experience",
    capabilities: ["Communication", "Support", "Onboarding", "Feedback", "Customer Workflows"],
  },
  {
    id: "finance",
    label: "Finance",
    capabilities: ["Invoices", "Payments", "Approvals", "Financial Workflows", "Reporting"],
  },
  {
    id: "hr",
    label: "HR",
    capabilities: ["Recruitment", "Onboarding", "Employee Workflows", "Documents", "Internal Processes"],
  },
  {
    id: "office-operations",
    label: "Office Operations",
    capabilities: ["Tasks", "Scheduling", "Documents", "Internal Workflows", "Administrative Processes"],
  },
  {
    id: "reporting",
    label: "Reporting & Analytics",
    capabilities: ["Dashboards", "KPIs", "Reports", "Performance", "Business Intelligence"],
  },
  {
    id: "custom",
    label: "Custom",
    capabilities: ["Custom Workflows", "AI Agents", "Integrations", "Specialized Systems"],
  },
] as const;

export const SALES_WORKFLOW = ["Capture", "Qualify", "Follow up", "Book", "Convert", "Report"] as const;

export const PROCESS_STEPS = [
  { n: "01", title: "Discovery", body: "Understand the business." },
  { n: "02", title: "Strategy", body: "Identify opportunities." },
  { n: "03", title: "Architecture", body: "Map workflows and technology." },
  { n: "04", title: "Design", body: "Design the experience." },
  { n: "05", title: "Development", body: "Build the system." },
  { n: "06", title: "Testing", body: "Test real workflows." },
  { n: "07", title: "Launch", body: "Deploy the system." },
  { n: "08", title: "Optimization", body: "Continue improving the system." },
] as const;

export const LOOKING_OPTIONS = [
  { id: "bos", label: "Business Operating System" },
  { id: "website", label: "Website" },
  { id: "application", label: "Application" },
  { id: "custom", label: "Custom System" },
  { id: "not-sure", label: "Not Sure" },
] as const;

export const TIMELINE_OPTIONS = [
  { id: "asap", label: "ASAP" },
  { id: "1-3-months", label: "1–3 Months" },
  { id: "3-6-months", label: "3–6 Months" },
  { id: "exploring", label: "Exploring" },
] as const;

export const INVESTMENT_OPTIONS = [
  { id: "under-5k", label: "Under $5K" },
  { id: "5k-10k", label: "$5K–$10K" },
  { id: "10k-25k", label: "$10K–$25K" },
  { id: "25k-plus", label: "$25K+" },
  { id: "not-sure", label: "Not Sure" },
] as const;

export const TEAM_SIZE_OPTIONS = ["1–10", "11–50", "51–200", "200+"] as const;

export const CONFIRMATION_STEPS = [
  { n: "01", title: "Project Review" },
  { n: "02", title: "Internal Assessment" },
  { n: "03", title: "Consultation" },
  { n: "04", title: "Proposal" },
  { n: "05", title: "Build" },
] as const;

export type LookingFor = (typeof LOOKING_OPTIONS)[number]["id"];
export type TimelineId = (typeof TIMELINE_OPTIONS)[number]["id"];
export type InvestmentId = (typeof INVESTMENT_OPTIONS)[number]["id"];
