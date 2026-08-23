# Deploying to Railway

Two services from one repo, sharing one Postgres database. Config lives in
`apps/web/railway.json` and `apps/worker/railway.json`, so Railway reads the build
and start commands from the repo rather than from dashboard settings.

## Service layout

| Service | Root directory | Start command | Notes |
|---|---|---|---|
| `lunair-web` | `/` (repo root) | `npm run start --workspace apps/web` | Public. Gets the domain |
| `lunair-worker` | `/` (repo root) | migrate, then `npm run start --workspace apps/worker` | No public port. Runs the watchers |
| `Postgres` | - | - | Railway plugin. Provides `DATABASE_URL` |

Both services build from the repo root because npm workspaces need the root
`package-lock.json`. The worker runs migrations on every deploy before starting, which
is safe: Drizzle skips migrations that have already been applied.

## Environment variables

Set on **both** services (Railway → service → Variables):

```
DATABASE_URL=${{Postgres.DATABASE_URL}}     # Railway reference, not a literal
ANTHROPIC_API_KEY=…
TELEGRAM_BOT_TOKEN=…
TELEGRAM_OWNER_CHAT_ID=…
SENTRY_DSN=…
NODE_ENV=production
```

Web only:
```
APP_URL=https://lunair-world.com
NEXT_PUBLIC_SENTRY_DSN=…
STRIPE_SECRET_KEY=…
STRIPE_WEBHOOK_SECRET=…
STRIPE_PRICE_*=…
RESEND_API_KEY=…
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=lunair-world.com
NEXT_PUBLIC_POSTHOG_KEY=…
ADMIN_EMAILS=guy@wershuffle.com
```

`DATABASE_URL` must use Railway's `${{Postgres.DATABASE_URL}}` reference syntax so it
follows the database if it is ever replaced.

## Domain

Railway → `lunair-web` → Settings → Networking → Custom Domain → `lunair-world.com`.
Railway shows a CNAME target; add it at the registrar. Add `www` as a second domain
redirecting to the apex. TLS is automatic once DNS resolves.

## First deploy checklist

1. Create the Postgres service first, so `${{Postgres.DATABASE_URL}}` resolves.
2. Deploy `lunair-worker` before `lunair-web` - it runs the migrations that create the
   tables the web app reads.
3. Confirm the watchers started: worker logs should show
   `[worker] started; 4 watchers scheduled`.
4. Check `/` loads and `/terms` renders.
5. Run `node --env-file=.env.local scripts/check-sentry.mjs` and confirm the event
   arrives, proving production error reporting works.

## Rollback

Railway keeps every deploy. Service → Deployments → three-dot menu on a previous
deploy → Redeploy. Database migrations are not rolled back automatically; a migration
that must be undone needs a new forward migration.
