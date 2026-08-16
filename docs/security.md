# Security Architecture (Demo)

- Authentication via Better Auth (httpOnly session cookies)
- Role field: `owner` | `manager` | `agent`
- Secrets only in environment variables (never client bundles)
- Zod validation on inbound API bodies
- NLU prompts isolate user text; business routing stays deterministic
- Webhook signature hooks prepared for Twilio/Vapi when CONNECTED
- PII masking helpers for logs (`maskPii`)
- AuditLog model available for sensitive actions
- Rate limiting: rely on platform limits in demo; production needs Upstash/WAF

Never commit `.env`. Never place API keys in frontend code.
