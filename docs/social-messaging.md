# Social DMs — Instagram, Facebook, TikTok

Instagram, Facebook Messenger, and TikTok DMs enter the **existing** Conversations pipeline (`processInbound`). There is no second inbox, CRM, or AI.

Official APIs only. Do not scrape or automate the Instagram / Facebook / TikTok apps.

## Shared behaviour

- Inbound → same customer identity + conversation reuse as WhatsApp/SMS
- One Onyx front-desk brain: Knowledge + NLU + `composeSocialReply` (no numbered SMS menu)
- Booking link is `{PUBLIC_APP_URL}/book` — never invent prices
- Escalated threads store the inbound DM and **do not auto-reply** until a human sets status back to `open`
- `SOCIAL_AI_REPLIES=false` still stores DMs and can create leads / escalations; Graph and TikTok replies are not sent
- Settings shows **CONNECTED** only when credentials exist; otherwise **READY_FOR_INTEGRATION**

Localhost cannot receive Meta or TikTok webhooks. Use the same public HTTPS origin as Twilio (`PUBLIC_APP_URL` via ngrok, Cloudflare Tunnel, or Vercel).

## Meta (Instagram + Facebook, one app)

1. Create a Meta Developer App.
2. Add a Facebook Page and link an Instagram **professional** account to that Page.
3. Add products: **Messenger** and **Instagram**.
4. Webhook callback: `{PUBLIC_APP_URL}/api/webhooks/meta`
   - Verify token: `META_VERIFY_TOKEN`
   - Subscribe to `messages` and `messaging_postbacks` on both the Page and Instagram objects.
5. Long-lived **Page access token** → `META_PAGE_ACCESS_TOKEN`.

Production messaging needs **App Review**:

- `pages_messaging`
- `instagram_manage_messages`
- `pages_manage_metadata`
- `instagram_basic`

Until review is approved, only testers/admins on the app can DM the Page / IG account.

Env:

```
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
META_PAGE_ACCESS_TOKEN=
META_PAGE_ID=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
SOCIAL_AI_REPLIES=true
```

Webhook signatures use `X-Hub-Signature-256` (HMAC-SHA256 of the raw body with `META_APP_SECRET`). Duplicate `mid` values are ignored.

## TikTok (Business Messaging API only)

TikTok Business Messaging is **official Open Beta** (APAC, LATAM, METAP, North America). Personal TikTok accounts are **not** supported. EEA / UK / CH business accounts are often ineligible.

1. Create a TikTok API for Business developer app and request **Business Messaging**.
2. `@OnyxWebSystems` (or the live handle) must be a **Business Account** that accepts DMs from everyone.
3. Subscribe to `DIRECT_MESSAGE` (events `im_receive_msg` / `im_receive_msg_eu`) with callback `{PUBLIC_APP_URL}/api/webhooks/tiktok`.
4. Replies use `POST https://business-api.tiktok.com/open_api/v1.3/business/message/send/` with the inbound `conversation_id`.

If TikTok rejects access, keep the adapter and Settings row as **READY_FOR_INTEGRATION**. Do not scrape.

Env:

```
TIKTOK_APP_ID=
TIKTOK_APP_SECRET=
TIKTOK_ACCESS_TOKEN=
TIKTOK_BUSINESS_ACCOUNT_ID=
```

Signatures use the `TikTok-Signature` header (`t=<unix>,s=<hmac>`). Duplicate `message_id` values are ignored.

## Live checklist

Requires HTTPS tunnel + real apps. Do not claim CONNECTED until a round-trip succeeds.

- [ ] Instagram DM → Conversations row → AI reply in Instagram (or stored-only if `SOCIAL_AI_REPLIES=false`)
- [ ] Facebook Messenger DM → same Conversations inbox
- [ ] TikTok DM (if the app is approved) → same inbox
- [ ] Asking for a human / KB miss → ticket + `escalated`; further DMs are stored without AI
- [ ] Reply includes `/book`
- [ ] Expired Page / TikTok token logs an error — never a fake send success
- [ ] Settings rows stay honest (`READY_FOR_INTEGRATION` until credentials exist)

See also `docs/onyx-live-setup.md`.
