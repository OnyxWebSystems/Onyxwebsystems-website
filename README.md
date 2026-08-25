# Customer Experience (Demo)

Sales demonstration of **Onyx Web Systems — Customer Experience**: a 24/7 digital front desk for fictional HVAC company **Apex Climate Solutions**.

This is not branded as an “AI receptionist.” The product UI says **Customer Experience**.

## Quick start

```bash
cp .env.example .env
# Set DATABASE_URL (Neon) and BETTER_AUTH_SECRET

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login) (or the port Next reports if 3000 is busy).

If the app starts on another port, set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to match.

**Operator login**

Sign in with an allowlisted operator Gmail. A verification code is emailed after the password step. Set `DASHBOARD_OPERATOR_NATHY_PASSWORD` and `DASHBOARD_OPERATOR_BHUMBA_PASSWORD` before `npm run db:seed` or `npx tsx scripts/ensure-operators.ts`.

## Live channels (primary Loom)

The product demo is **calling and messaging the system**, not charts.

1. Follow **[docs/live-setup.md](docs/live-setup.md)** (Vapi phone, Twilio WhatsApp/SMS, Resend email)
2. Configure the Vapi assistant with **[docs/vapi-assistant.md](docs/vapi-assistant.md)**
3. Sign in → **Settings** — confirm CONNECTED badges
4. Dial the Vapi number → book on the call → cut to **Appointments**
5. WhatsApp / SMS → real replies → same CRM updates
6. **Demo Mode** remains as an offline backup if a vendor is down

## Integration honesty

Settings status is derived from environment credentials:

- **SIMULATED** — offline / Demo Mode behaviour
- **CONNECTED** — credentials present (complete a live round-trip before filming)
- **READY_FOR_INTEGRATION** — adapter coded, awaiting credentials

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push Prisma schema |
| `npm run db:seed` | Seed Apex demo data |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke |

## Docs

- [Task map](docs/task-map.md)
- [Production gap](docs/production-gap.md)
- [Security notes](docs/security.md)
- [Failure handling](docs/failure-handling.md)
- [KPI thresholds](docs/kpis.md)
