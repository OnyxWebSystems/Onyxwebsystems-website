# Retell AI Assistant (Onyx Web Systems)

Use this with `docs/live-setup.md`. Vapi is deprecated — configure Retell instead.

## Prompt

Copy the system prompt from `src/server/voice/assistant-prompt.ts` (`ONYX_VOICE_SYSTEM_PROMPT`) into the Retell agent **General prompt** / system instructions.

First message:

> Thanks for calling Onyx Web Systems. How can I help you today?

## Webhook URL

`{PUBLIC_APP_URL}/api/webhooks/retell`

In the Retell dashboard (Account → Webhooks, or agent-level webhook), subscribe to:

| Event | What we do |
|-------|------------|
| `call_started` | Creates Conversation + CallSession (`isSimulated: false`) |
| `call_ended` | Marks call resolved, stores transcript when present |
| `call_analyzed` | Updates summary / ensures transcript is saved |

Signature verification uses `X-Retell-Signature` (HMAC with `RETELL_WEBHOOK_SECRET` or `RETELL_API_KEY`). You can also send a shared secret as `x-retell-secret` / `Authorization: Bearer …` / `?secret=`.

For local tunnels before keys are fully wired:

```env
RETELL_ALLOW_WEBHOOKS_WHEN_READY=true
RETELL_SKIP_SIGNATURE_VERIFY=true   # never in production Loom
```

## Custom functions (HTTP tools)

**Full click-by-click guide + JSON schemas:** [`docs/retell-custom-functions.md`](./retell-custom-functions.md)

In Retell: **Functions → + Add → Custom Function** (not Cal.com / Code).

Create **Custom Function** tools on the Retell agent. Use **POST**. Leave **Payload: args only** off so the body includes `{ name, args, call }` (our routes also accept flat args).

Base: `{PUBLIC_APP_URL}`

| Function | URL | Parameters |
|----------|-----|------------|
| `lookup_customer` | `/api/voice/tools/lookup_customer` | `phone` (string), `email` (string, optional) |
| `check_availability` | `/api/voice/tools/check_availability` | `serviceSlug` (string, default `consultation`), `days` (number, optional) |
| `book_appointment` | `/api/voice/tools/book_appointment` | `phone`, `firstName`, `lastName`, `serviceSlug`, `startsAt` (ISO), `email`, `address`, `postalCode` (optional) |
| `create_ticket` | `/api/voice/tools/create_ticket` | `phone`, `subject`, `description`, `priority` |
| `escalate` | `/api/voice/tools/escalate` | `phone`, `reason`, `summary`, `urgency` |
| `search_knowledge` | `/api/voice/tools/search_knowledge` | `query` |

Optional custom header for tools:

`x-retell-secret: {RETELL_TOOL_SECRET or RETELL_WEBHOOK_SECRET}`

Enable **Talk After Action Completed** so the agent speaks the JSON result.

Default booking service slug is `consultation` (30-minute discovery consult).

## Env

```env
RETELL_API_KEY=
RETELL_AGENT_ID=
RETELL_PHONE_NUMBER=+1...
RETELL_WEBHOOK_SECRET=
# Optional alias for tool endpoints only
RETELL_TOOL_SECRET=
# Dev only — never in production Loom
RETELL_SKIP_SIGNATURE_VERIFY=false
RETELL_ALLOW_WEBHOOKS_WHEN_READY=false
```

**CONNECTED** status (Settings): `RETELL_API_KEY` + `RETELL_AGENT_ID` (phone optional for status; required for outbound).

## Outbound “Call me”

`POST /api/demo/call-me` with `{ "phoneNumber": "+1..." }` (authenticated dashboard user) calls Retell `POST https://api.retellai.com/v2/create-phone-call` using `RETELL_PHONE_NUMBER` as `from_number` and `RETELL_AGENT_ID` as `override_agent_id`.

## Migration from Vapi

- Old webhook `POST /api/webhooks/vapi` returns **410 Gone** with a deprecation notice.
- Channel status key is `voice_retell` (not `voice_vapi`).
- Keep `src/server/channels/vapi.ts` for reference only; do not configure new Vapi assistants.
