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
