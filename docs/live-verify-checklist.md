# Live verify checklist (Loom readiness)

Run after completing `docs/live-setup.md`.

## Automated (repo)

- [x] Unit tests (`npm test`) — signature helpers, routing, urgency, tool param parsing  
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

### Settings honesty

- [ ] CONNECTED only after credentials set
- [ ] Never film a channel as live until that channel’s round-trip succeeds
