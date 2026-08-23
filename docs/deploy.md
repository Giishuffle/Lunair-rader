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

---

## Live deployment (provisioned 23 Aug 2026)

Railway project `vibrant-youthfulness` (`ce6372fe-d588-4d0a-978d-445b68ee8e5d`),
environment `production` (`70e7b286-7e7a-42ee-8246-077cbcf98655`).

| Service | Id | Notes |
|---|---|---|
| `Lunair-rader` (the web app) | `84cc8b19…` | Reads `apps/web/railway.json`. Public at lunair-rader-production.up.railway.app |
| `worker` | `ce29dc09…` | Reads `apps/worker/railway.json`. Runs migrations, then the watchers |
| `postgres` | `b4e8f2cf…` | `ghcr.io/railwayapp-templates/postgres-ssl:16`, volume at `/var/lib/postgresql/data` |

The web service is still *named* `Lunair-rader` because renaming needs an account
token and we only hold a project token. Cosmetic; the config file decides what runs.

### Provisioning scripts
```
RAILWAY_TOKEN=<project token> node scripts/railway-services.mjs   # services + config files
RAILWAY_TOKEN=<project token> PGPASSWORD_OVERRIDE=<pw> node scripts/railway-setup.mjs   # volume + variables
```
**Always pass `PGPASSWORD_OVERRIDE` on a re-run.** Without it the script generates a
fresh Postgres password and writes it to the app services while the database keeps
the old one - every connection then fails.

### Two build traps, both hit and fixed
1. **Do not put `npm ci` in `buildCommand`.** Nixpacks already installed
   dependencies and mounts the build cache inside `node_modules`; a second
   `npm ci` dies with `EBUSY … rmdir '/app/node_modules/.cache'`.
2. **`NODE_ENV=production` makes npm skip devDependencies**, so `tsc` disappears
   and the build fails with `tsc: not found`. `NPM_CONFIG_INCLUDE=dev` is set on
   both app services to keep the build tools while the runtime stays production.

### Deploy or check status by hand
```
# trigger:  mutation { serviceInstanceDeployV2(serviceId: "…", environmentId: "…") }
# status:   query { deployments(first:5, input:{projectId:"…"}){ edges{ node{ status service{ name } } } } }
# logs:     query { buildLogs(deploymentId:"…"){ message } }   /   deploymentLogs(…)
```
POST to `https://backboard.railway.com/graphql/v2` with header
`Project-Access-Token: $RAILWAY_TOKEN`.

### Custom domain - DNS records for Guy
At the registrar for **lunair-world.com**:

| Type | Host | Value |
|---|---|---|
| CNAME | `@` (root) | `3zheie3l.up.railway.app` |
| CNAME | `www` | `rl5zyve5.up.railway.app` |

If the registrar refuses a CNAME at the root, use its ALIAS/ANAME/flattened-CNAME
option. TLS is issued automatically once the records resolve.
