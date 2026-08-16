# Failure Handling

| Failure | Fallback |
|---------|----------|
| LLM timeout / missing key | Fixture NLU |
| No appointment slots | Escalated scheduling ticket |
| KB miss | Escalate with honest “I don't want to give you incorrect information…” |
| Channel provider down | Simulated send + staff activity event |
| Duplicate customer identities | Match by phone/email before create |
| Low NLU confidence | Ticket + escalate |
| Critical safety keywords | Safety script + CRITICAL escalation (never DIY gas/CO advice) |
| After hours | Disclose office closed; still book / escalate per policy |
