# Live verify checklist (Loom readiness)

Run after completing `docs/live-setup.md`.

## Automated (repo)

- [x] Unit tests (`npm test`) — signature helpers, routing, urgency, tool param parsing, Meta/TikTok signatures  
- [x] Production build (`npm run build`)  
- [x] Twilio webhook returns **503 READY_FOR_INTEGRATION** without Twilio env  
- [x] Vapi webhook returns **503** without Vapi env (unless `VAPI_ALLOW_WEBHOOKS_WHEN_READY=true`)  

## Manual (requires your accounts)

### Phone (Vapi)

- [ ] Dial `VAPI_PHONE_NUMBER`
- [ ] Book AC repair mid-call via tools
- [ ] Appointment appears in dashboard
- [ ] Conversation saved with `isSimulated: false`
- [ ] Confirmation email arrives (if Resend CONNECTED + customer email)

### WhatsApp (Twilio sandbox)

- [ ] Join sandbox
- [ ] Send booking request
- [ ] Receive TwiML reply
- [ ] Appointment / ticket updates dashboard

### SMS

- [ ] Text Twilio SMS number
- [ ] Receive reply
- [ ] Dashboard updates

### Escalation

- [ ] Call/text gas smell scenario
- [ ] Safety script + CRITICAL ticket/escalation

### Social DMs (Meta + TikTok)

Requires public HTTPS (`PUBLIC_APP_URL`). See `docs/social-messaging.md`.

- [ ] Meta webhook GET hub challenge succeeds
- [ ] Instagram DM appears in Conversations and (if `SOCIAL_AI_REPLIES=true`) receives a Graph reply with `/book`
- [ ] Facebook Messenger DM uses the same webhook and inbox
- [ ] Duplicate `mid` does not create a second thread
- [ ] Escalation pauses AI on that thread
- [ ] TikTok Business Messaging webhook (if approved) stores and replies via the official send API
- [ ] Settings never shows CONNECTED without credentials

### Settings honesty

- [ ] CONNECTED only after credentials set
- [ ] Never film a channel as live until that channel’s round-trip succeeds
