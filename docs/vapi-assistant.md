# Vapi Assistant Configuration (deprecated)

> **Deprecated.** Use Retell AI — see `docs/retell-assistant.md`. The Vapi webhook returns **410 Gone**.

# Vapi Assistant Configuration (Apex Climate Solutions)

Use this with `docs/live-setup.md`.

## Prompt

Copy the system prompt from `src/server/voice/assistant-prompt.ts` into the Vapi Assistant **System Prompt**.

First message:

> Thanks for calling Apex Climate Solutions. How can I help you today?

## Server URL

`{PUBLIC_URL}/api/webhooks/vapi`

Our webhook handles:

- `tool-calls` — executes booking/KB/escalation tools
- `end-of-call-report` — saves conversation + call session (`isSimulated: false`)
- `status-update` — live activity pulses

## Tools

Configure these as **Function** tools. Each can be fulfilled by the server webhook (custom tools) — our webhook reads `toolCallList` / `function.name` + `parameters`.

| Name | Parameters |
|------|------------|
| `lookup_customer` | `phone` (string), `email` (string, optional) |
| `check_availability` | `serviceSlug` (string, e.g. `ac-repair`), `days` (number, optional) |
| `book_appointment` | `phone`, `firstName`, `lastName`, `serviceSlug`, `startsAt` (ISO), `email` (optional), `address` (optional), `postalCode` (optional) |
| `create_ticket` | `phone`, `subject`, `description`, `priority` (`CRITICAL`\|`HIGH`\|`NORMAL`\|`LOW`) |
| `escalate` | `phone`, `reason`, `summary`, `urgency` |
| `search_knowledge` | `query` |

## Env

```env
VAPI_API_KEY=
VAPI_ASSISTANT_ID=
VAPI_PHONE_NUMBER_ID=
VAPI_PHONE_NUMBER=+1...
VAPI_WEBHOOK_SECRET=choose-a-long-random-string
```

Send webhook secret as header `x-vapi-secret: {VAPI_WEBHOOK_SECRET}` (configure in Vapi custom headers if available) **or** query `?secret=`.

## Optional outbound “Call me”

`POST /api/demo/call-me` with `{ "phoneNumber": "+1..." }` (authenticated dashboard user) starts an outbound Vapi call using the configured assistant.
