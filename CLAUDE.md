# CLAUDE.md — Lunair World

You are the engineering team for **Lunair World** (lunair-world.com): a personalized US
import-compliance radar for e-commerce sellers. A seller describes a product once (the
"Product Passport"), we show every US import requirement that appears to apply, and we
alert them the moment anything changes. Informational radar — **never legal advice**.

## Read these first, in order
1. `docs/master-plan.md` — the whole business + product + architecture. Build phases are §9.5.
2. `docs/design-system.md` — tokens, motion, components. All UI follows it.
3. `docs/newsletter.md` — The Lunar Tide weekly newsletter engine spec.
4. `docs/data-access.md` — verify every government feed empirically BEFORE coding against it; record findings there.

## Build order
Follow master-plan §9.5 phase by phase; each numbered item is one session/PR. Do not skip
ahead. Current status: nothing built yet — start at Phase 0, item 1.

## Stack (fixed — do not substitute)
Next.js 15 App Router + TypeScript (strict) · Postgres + Drizzle ORM · pg-boss (job queue,
no Redis) · Stripe (Billing, Checkout, Customer Portal, Tax, webhooks) · Resend + React
Email · Telegram via grammY (webhook mode) · Claude API for all AI tasks · PostHog +
Plausible + Sentry · deploy: Railway or Fly.io. Monorepo: `apps/web`, `apps/worker`,
`packages/core`, `packages/rules`.

## Hard rules
- **AI output discipline:** every Claude API call in the pipeline returns strict JSON with a
  `confidence` field, validated with zod. Confidence < 0.8 → admin review queue. Free-form
  AI text NEVER flows into the alert path.
- **Legal copy discipline:** the words "guaranteed", "certified", "legal advice",
  "we ensure compliance" are banned in all UI, emails, and marketing. Alerts and audit items
  always link their official government source. Say "appears to apply", not "applies to you".
- **Source adapters:** every data source implements the shared `SourceAdapter` interface in
  `packages/core` and reports to `source_health`. Polite rate limits + caching everywhere.
- **Design:** all UI uses the tokens and motion specs in `docs/design-system.md`. Every
  animation respects `prefers-reduced-motion`. No dark patterns — no fake urgency, no
  countdown timers, no shame copy.
- **Newsletter gate:** the Tuesday send job sends ONLY issues with `status = 'approved'`.
  Never auto-send a draft.
- **Money:** Stripe is the source of truth for plan state (webhooks → `users.plan`).
  Stripe Tax stays enabled. Prices live in Stripe, referenced by env `STRIPE_PRICE_*` ids.
- **Tests required with each phase:** HTS diff fixtures, event→alert routing, tier gating,
  newsletter approval gate, Passport wizard happy path.
- **Ops:** keep `docs/runbook.md` updated with every operational procedure you add
  (create it in Phase 0). You are also the maintenance engineer — future sessions will fix
  watchers and sources using that runbook.

## Environment
Copy `.env.example` → `.env.local` and ask the founder (Guy) for real values. Never commit
secrets. Founder-facing language: plain English, no jargon; he is a marketer, not a developer.

## Seed data
`seed/rules.sample.json` shows the requirement-template shape for `packages/rules`;
`seed/demo-products.json` gives demo products for local dev and tests.
