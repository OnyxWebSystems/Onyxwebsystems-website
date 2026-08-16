# Production Gap — DEMO vs PRODUCTION

## Demo (what this repo is)
- Single-tenant fictional company: Apex Climate Solutions
- Channels default to **SIMULATED** for Loom reliability
- Internal CRM + calendar (not ServiceTitan / Google Calendar)
- Fixture NLU when `OPENAI_API_KEY` is unset
- Simple Better Auth email/password for demo users
- Estimated ROI figures clearly labeled as estimates

## Before a real business deployment
1. **Verified telephony** — production numbers, recording consent, call retention policies
2. **WhatsApp Business** verification + template approval
3. **FSM / CRM sync** — ServiceTitan, Housecall Pro, Jobber, or HubSpot
4. **Calendar sync** — Google / Microsoft with field tech mobile
5. **Multi-tenant auth** — SSO, org isolation, RBAC audit
6. **Compliance** — TCPA, call recording laws, WhatsApp policy, DPA, data retention
7. **LLM eval harness** — regression tests against hallucination and unsafe advice
8. **On-call ops** — paging, SLOs, incident runbooks
9. **Legal review** of emergency / safety scripts for jurisdiction
10. **Penetration test** and secrets management (Vault/KMS)

Integration statuses in Settings must remain honest: SIMULATED / CONNECTED / READY_FOR_INTEGRATION.
