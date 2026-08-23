# Lunair World - Runbook

Operational procedures. Keep updated with every phase (CLAUDE.md hard rule).

## Local development
```
npm install
npm run build            # builds packages then apps (order matters: core -> rules -> apps)
npm run test             # vitest in every workspace
npm run dev:web          # Next.js on :3000
npm run dev:worker       # worker (needs DATABASE_URL in .env.local)
```
Note: `@lunair/core` and `@lunair/rules` must be built before app typechecks pass
(`npm run build --workspace packages/core` etc.). CI does this via root `npm run build`.

## Database
- Local dev: Docker Postgres on port 5433 -
  `docker run -d --name lunair-pg -e POSTGRES_USER=lunair -e POSTGRES_PASSWORD=lunair -e POSTGRES_DB=lunair -p 5433:5432 postgres:16-alpine`
  (`docker start lunair-pg` after reboots). `DATABASE_URL` in `.env.local` points at it.
- Production: Railway Postgres service; same migrations.
- Schema: `packages/core/src/schema.ts` (Drizzle). Migrations in `packages/core/drizzle/`.
- Generate a migration after schema changes: `npm run db:generate` (root).
- Apply migrations: `cd packages/core && DATABASE_URL=... npx drizzle-kit migrate`.
- Never edit applied migration files; always generate a new one.

## Worker & watchers
- Entry: `apps/worker/src/index.ts`. Queue = pg-boss on the same Postgres (no Redis).
- Schedules (in `src/jobs.ts`): `federal_register:poll` hourly · `usitc_hts:diff` daily
  06:30 UTC · `cpsc_recalls:poll` every 6h. (Phase 2 adds `cbp_csms:ingest` via email,
  weekly digest + newsletter jobs.)
- **Run any watcher once, manually:**
  `DATABASE_URL=... node apps/worker/dist/index.js --once federal_register:poll`
  (also `usitc_hts:diff`, `cpsc_recalls:poll`). Build first: `npm run build -w apps/worker`.
- Every source failure increments `source_health.error_streak` and sets status
  `degraded`; success resets to `ok`. Alerting on error streaks -> Phase 2 watchdog.
- USITC gotcha: the exportList endpoint requires `styles=false` or it 400s. If it
  regresses, check docs/data-access.md before touching the adapter.

## Environment files
- Secrets live in `/.env.local` at the repo root (gitignored).
- `apps/web/.env.local` is a **symlink** to it, because Next.js only reads env files
  from its own directory. Recreate it with:
  `ln -sf ../../.env.local apps/web/.env.local`
- The worker reads the root file directly via `node --env-file=.env.local`.
- On Railway none of this applies: variables are set per service (see docs/deploy.md).

## Founding-member offer
- First 50 waitlist signups get 50% off their first year (`FOUNDING_SPOTS` in
  `packages/core/src/plans.ts`).
- Position comes from the Postgres sequence `waitlist_position_seq`. Never assign
  positions with `count(*) + 1` - concurrent signups would collide.
- The API checks for an existing email **before** inserting, because Postgres
  evaluates `nextval()` before detecting a duplicate key, so a blind insert would
  burn a founding spot on every repeat submission.
- Stripe side: `node --env-file=.env.local scripts/stripe-founding-coupon.mjs`
  creates coupon `founding50` and promotion code `FOUNDING50`, capped at 50
  redemptions so the cap is enforced by Stripe as well as by us.
- To check how many spots are gone: `GET /api/waitlist`.

## Cross-reference engine (Passport -> Radar)
- Engine: `packages/core/src/crossref.ts`. CBP client: `src/sources/crossRulings.ts`.
- Try it: `npm run dev:web`, then open `/demo/passport` (noindex, internal only).
- API: `POST /api/crossref` with a product profile; returns `htsCandidates`,
  `watches`, and `degraded`.
- **CROSS gotchas, all learned the hard way - see the tests before changing any:**
  - The API ANDs search terms. A long query returns *zero* results; queries must
    be short noun phrases. `buildQueries()` mines them from the name/description.
  - Its relevance ranking is loose - "bluetooth speaker" returns a plastic water
    bottle - so results are filtered against the query terms, not trusted as-is.
  - Rulings can be revoked or modified. Never present those as current precedent.
  - Chapter 99 codes appear alongside real codes in rulings. They are additional
    duties, not classifications, and must not become candidates.
- Requirement matching is by HTS prefix **and** product attributes. The attribute
  path is load-bearing: a children's night light is classified as a lamp, so
  prefix-only matching returns zero CPSC rules for it.

## Telegram
- Bot: @lunairworldbot. Verify token / capture owner chat id: `node scripts/check-telegram.mjs`
  (owner must have messaged the bot at least once for the chat id to appear).

## Deploy (to wire up when Railway project exists)
- Two services from this repo: `web` (Next.js, `apps/web`) and `worker` (`apps/worker`).
- Build: `npm ci && npm run build`. Start web: `npm start -w apps/web`. Start worker: `npm run start -w apps/worker`.
- Env vars: see `.env.example`. Sentry DSN + PostHog keys are optional in dev, required in prod.
- Migrations run as a release step before the new worker starts: `npm run db:migrate`.

## Incident: a government feed breaks
1. Check `source_health` table and worker logs.
2. Per docs/data-access.md fallback policy: dependent alerts pause automatically only
   once the Phase 2 pipeline lands; before that, nothing user-facing depends on feeds.
3. Verify the feed manually (see verification commands in docs/data-access.md).
4. If the API changed shape, fix the adapter + its fixture test together.

## Auth & billing
- Sign-in: passwordless magic link (`/signin`), plus Google when
  `GOOGLE_CLIENT_ID`/`SECRET` are set - the provider is registered conditionally,
  so the app runs fine before those exist.
- **Without `RESEND_API_KEY` the magic link prints to the server console.** That is a
  complete local sign-in flow; grep the dev log for `[email:dev]`.
- `AUTH_SECRET` is required. Generate with `openssl rand -base64 32`.
- Sessions are database-backed (`sessions` table), 30 days.
- The session callback returns only id/email/name/image/plan/isAdmin. Do not widen
  it - `/api/auth/session` is readable by the browser and the adapter's user row
  carries Stripe ids and the Telegram chat id.

### Plan state
- **Stripe is the only writer of `users.plan`.** The webhook at
  `/api/webhooks/stripe` is the single place it changes; nothing else may promote
  or demote an account.
- `planForSubscription()` grants a plan only for `active`, `trialing` or
  `past_due`. `past_due` deliberately keeps access during Stripe's retry window
  rather than punishing an expired card.
- The webhook refuses to run without `STRIPE_WEBHOOK_SECRET` and verifies every
  signature: unverified, this endpoint would hand out paid plans to anyone.
- An event for an unknown Stripe customer throws, so Stripe retries and the
  failure is visible, rather than silently dropping a paying customer.

### Local webhook testing
```
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`, then
`stripe trigger customer.subscription.created`.

### Founding-50 at checkout
Annual checkout looks up the buyer's waitlist position; positions 1-50 get the
`FOUNDING50` promotion code applied automatically, so they never have to remember
a code. Verified live: annual Voyage came to $145.00 instead of $290.00.
