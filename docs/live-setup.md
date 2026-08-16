# Live Channel Setup — Retell + Twilio + Resend

Goal: call a real number, text WhatsApp/SMS, and receive confirmation emails — all updating the Onyx Web Systems dashboard.

Do **not** mark a channel CONNECTED in Settings until you complete a successful round-trip for that channel.

Vapi is deprecated (`/api/webhooks/vapi` returns 410). Use Retell — see `docs/retell-assistant.md`.

---

## 0. Prerequisites

- Node app running (`npm run dev`, note the port)
- Neon `DATABASE_URL` already configured
- Demo seeded (`npm run db:seed`)

---

## 1. Public HTTPS URL (required for webhooks)

Localhost cannot receive Twilio/Retell webhooks. Pick one:

### Option A — ngrok

```bash
ngrok http 3001
```

Copy the `https://….ngrok-free.app` URL → use as `{PUBLIC_URL}`.

### Option B — Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:3001
```

### Option C — Vercel deploy

Deploy the app and use the Vercel URL as `{PUBLIC_URL}`.

Update `.env`:

```env
NEXT_PUBLIC_APP_URL={PUBLIC_URL}
BETTER_AUTH_URL={PUBLIC_URL}
PUBLIC_APP_URL={PUBLIC_URL}
```

Restart the Next server after changing env.

---

## 2. Retell AI (phone)

Full agent + custom-function details: **`docs/retell-assistant.md`**.

1. Create account at [retellai.com](https://www.retellai.com)
2. Create an **Agent** for Onyx Web Systems (prompt in `src/server/voice/assistant-prompt.ts`)
3. Set account/agent **webhook** → `{PUBLIC_URL}/api/webhooks/retell` (`call_started`, `call_ended`, `call_analyzed`)
4. Add **Custom Function** tools pointing at `/api/voice/tools/*` (see retell-assistant.md)
5. Buy/assign a **phone number** and attach the agent
6. Copy into `.env`:

```env
RETELL_API_KEY=...
RETELL_AGENT_ID=...
RETELL_PHONE_NUMBER=+1...
RETELL_WEBHOOK_SECRET=...   # or rely on Retell X-Retell-Signature + API key
```

### Smoke test

1. Dial `RETELL_PHONE_NUMBER`
2. Ask to book a consultation
3. Confirm appointment appears under **Appointments** and Live Activity updates
4. Confirm `CallSession.isSimulated = false` in DB / Conversations

---

## 3. Twilio SMS + WhatsApp

1. Create account at [twilio.com](https://www.twilio.com)
2. Copy **Account SID** + **Auth Token**
3. Buy an SMS-capable number → `TWILIO_SMS_FROM=+1...`
4. WhatsApp → Messaging → Try WhatsApp Sandbox  
   - Note sandbox number (often `+14155238886`) → `TWILIO_WHATSAPP_FROM=+14155238886`  
   - Join by texting the sandbox join code from your phone
5. Configure webhooks on the SMS number **and** WhatsApp sandbox:

   - **A MESSAGE COMES IN** → `POST {PUBLIC_URL}/api/webhooks/twilio`
   - Method: HTTP POST

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_SMS_FROM=+1...
TWILIO_WHATSAPP_FROM=+14155238886
```

`TWILIO_AUTH_TOKEN` is used for `X-Twilio-Signature` verification.  
`PUBLIC_APP_URL` (or `NEXT_PUBLIC_APP_URL`) must match the URL Twilio calls (including https).

### Smoke test — SMS

Text your Twilio number: `Can I book a consultation about a Business Operating System?`  
Expect a reply + optional appointment in the dashboard.

### Smoke test — WhatsApp

After joining the sandbox, WhatsApp the sandbox number with the same request.

---

## 4. Resend (outbound confirmation email)

1. Create account at [resend.com](https://resend.com)
2. Create API key
3. For quick demo: use Resend’s onboarding sender, **or** verify your domain
4. Set:

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Onyx Web Systems <hello@onyxwebsystems.com>
```

Customer must have an `email` on file (or provide one during booking) to receive confirmations.

### Smoke test

Book via phone/WhatsApp with a customer that has your real email → check inbox.

---

## 5. Full `.env` checklist

| Variable | Required for |
|----------|----------------|
| `DATABASE_URL` | App |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Dashboard auth |
| `PUBLIC_APP_URL` | Twilio / Retell public webhooks |
| `RETELL_*` | Live phone |
| `TWILIO_*` | Live SMS/WhatsApp |
| `RESEND_*` | Confirmation emails |
| `OPENAI_API_KEY` | Better NLU (optional; fixture works without) |

---

## 6. Manual Loom checklist

- [ ] Settings shows Phone / WhatsApp / SMS / Email as CONNECTED after env + round-trip  
- [ ] Inbound call books consultation  
- [ ] Confirmation email received  
- [ ] WhatsApp reply works  
- [ ] SMS reply works  
- [ ] Escalation call creates CRITICAL/HIGH ticket  
- [ ] Demo Mode still works offline as backup  

---

## 7. Loom recording order

1. Settings — CONNECTED badges + dial/WhatsApp instructions  
2. Call on speaker — book consultation  
3. Cut to Appointments + customer timeline  
4. Show confirmation email  
5. WhatsApp reschedule or FAQ  
6. Optional SMS  
7. Escalation / speak-to-a-human call  
8. Close on capacity / never miss a lead  
