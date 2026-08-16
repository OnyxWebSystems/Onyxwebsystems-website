export const RETELL_CALL_HISTORY_URL = "https://dashboard.retellai.com/call-history";
export const RETELL_ANALYTICS_URL =
  "https://dashboard.retellai.com/analytics?dashboard_id=dashboard_d929ebb60a48859a8a4fab";

export function retellCallHistoryUrl(callId?: string | null) {
  if (!callId) return RETELL_CALL_HISTORY_URL;
  return `${RETELL_CALL_HISTORY_URL}?history=${encodeURIComponent(callId)}`;
}

export function retellCallIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const id = (metadata as { callId?: unknown }).callId;
  return typeof id === "string" && id.length > 0 ? id : null;
}
