# Onyx Web Systems — Live Setup Guide

Step-by-step credentials for the Customer Experience demo (Retell + Twilio + Resend).

## 0. App URL

Expose the Next.js app with a public HTTPS origin (ngrok, Cloudflare Tunnel, or Vercel).

```bash
# Example
PUBLIC_APP_URL=https://your-tunnel.example
NEXT_PUBLIC_APP_URL=https://your-tunnel.example
BETTER_AUTH_URL=https://your-tunnel.example
```

Also set:

```bash
DATABASE_URL=...          # Neon
BETTER_AUTH_SECRET=...    # long random
DASHBOARD_OPERATOR_NATHY_PASSWORD=...
DASHBOARD_OPERATOR_BHUMBA_PASSWORD=...
ONYX_NOTIFY_EMAIL=onyxwebsystems@gmail.com   # inbox notify on /book and project requests
```

Seed:

```bash
npm run db:seed
```

---

## 1. Retell AI (phone)

1. Create a Retell account and add ~$10 credits.
2. Create an Agent using the prompt in `docs/retell-assistant.md` / `src/server/voice/assistant-prompt.ts`.
3. Buy or assign a phone number.
4. Custom functions → POST to:
   - `{PUBLIC_APP_URL}/api/voice/tools/lookup_customer`
   - `{PUBLIC_APP_URL}/api/voice/tools/check_availability`
   - `{PUBLIC_APP_URL}/api/voice/tools/book_appointment`
   - `{PUBLIC_APP_URL}/api/voice/tools/create_ticket`
   - `{PUBLIC_APP_URL}/api/voice/tools/escalate`
   - `{PUBLIC_APP_URL}/api/voice/tools/search_knowledge`
5. Agent webhook → `{PUBLIC_APP_URL}/api/webhooks/retell`  
   Events: `call_started`, `call_ended`, `call_analyzed`.

```bash
RETELL_API_KEY=
RETELL_AGENT_ID=
RETELL_PHONE_NUMBER=+1...
RETELL_WEBHOOK_SECRET=long-random
# Dev only:
# RETELL_SKIP_SIGNATURE_VERIFY=true
# RETELL_ALLOW_WEBHOOKS_WHEN_READY=true
```

Settings should show **Phone (Retell)** as CONNECTED when keys are present.

---

## 2. Twilio (SMS + WhatsApp)

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=+1...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   # sandbox OK for Loom
```

Messaging webhook (both SMS + WhatsApp):

`POST {PUBLIC_APP_URL}/api/webhooks/twilio`

---

## 3. Resend (email)

Verify `onyxwebsystems.co.za` in Resend for production sending. Until that domain is verified, send from `onboarding@resend.dev`. Replies still go to `onyxwebsystems@gmail.com`. Gmail addresses cannot be used as the From address.

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Onyx Web Systems <hello@onyxwebsystems.co.za>
ONYX_NOTIFY_EMAIL=onyxwebsystems@gmail.com
```

Used for:

- Professional customer confirmation emails (with the ONYXWEBSYSTEMS logo)
- Team notification emails when someone books or requests a project
- `.ics` calendar invitations attached to consultation emails

Until `RESEND_API_KEY` is set, emails are logged as simulated and not delivered.

Fastest GoDaddy setup: in Resend → Domains → add `onyxwebsystems.co.za` → **Auto Configure**. Then create an API key under API Keys and set `RESEND_API_KEY` in Vercel.

---

## 3b. Google Calendar (Onyx Web Systems)

This creates and fills a dedicated **Onyx Web Systems** calendar (graphite/black) on the Google account connected to `onyxwebsystems@gmail.com`. Booked consultations are inserted as events and Google emails a calendar notification.

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. Enable **Google Calendar API**.
3. Create OAuth credentials (Desktop app or Web app).
4. Grant scope `https://www.googleapis.com/auth/calendar`.
5. Generate a refresh token for the Onyx Google account.
6. Set:

```bash
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=          # optional; created automatically as "Onyx Web Systems" if empty
```

On the first booking, the app will create the themed calendar if `GOOGLE_CALENDAR_ID` is blank, then add the meeting and notify attendees.

Customers also receive an `.ics` invite and an “Add to Google Calendar” link, so the meeting still lands on a calendar even before OAuth is connected.

---

## 4. Optional later

- Meta Instagram / Facebook Messaging → until then Social stays **SIMULATED**
- Google Calendar OAuth → Internal Calendar stays CONNECTED; Google is READY_FOR_INTEGRATION
- Custom domain `onyxwebsystems.co.za` → point at Vercel

---

## Loom verify checklist

1. Open `/` — brand-first **onyxwebsystems**, CREATE. CONNECT. CONVERT., Book CTA  
2. `/services` — BOS modules + App (SEC Nightlife) + Web + Custom Pricing  
3. `/book` — pick modules + slot → confirmation email (Resend)  
4. Dashboard → **Pipeline** shows the lead; **Appointments** shows the consult  
5. Theme toggle (header) — white ↔ black  
6. Dial Retell number → book another consultation live  
7. **Analytics** — phone metrics, peak hours, 7/30/90 filters  
8. WhatsApp / SMS enquiry → reply / ticket / appointment  
9. Settings — Retell / Twilio / Resend statuses truthful (no fake CONNECTED)  
10. Close story: Customer Experience module inside a Business Operating System  

Operator login: allowlisted Gmail + password, then emailed verification code.

---

## Related docs

- `docs/retell-assistant.md` — agent + tool schema detail  
- `docs/live-setup.md` — legacy notes (prefer this file for Onyx)
