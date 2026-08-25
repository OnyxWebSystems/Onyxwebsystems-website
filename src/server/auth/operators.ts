export const DASHBOARD_OPERATORS = [
  { email: "nathysimelanei@gmail.com", name: "Nathy Simelane", role: "owner" as const },
  { email: "bhumbasimelane@gmail.com", name: "Bhumba Simelane", role: "manager" as const },
] as const;

const OPERATOR_EMAILS = new Set(DASHBOARD_OPERATORS.map((op) => op.email.toLowerCase()));

export function isDashboardOperator(email?: string | null) {
  return Boolean(email && OPERATOR_EMAILS.has(email.trim().toLowerCase()));
}
