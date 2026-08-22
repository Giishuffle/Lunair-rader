# Lunair World — Starter Kit

Everything needed to start building Lunair World with Claude Code.

## What's in here
- `CLAUDE.md` — instructions Claude Code reads automatically. Keep it at repo root.
- `docs/master-plan.md` — business plan, product spec, architecture, build phases.
- `docs/design-system.md` — colors, type, motion, components.
- `docs/newsletter.md` — The Lunar Tide weekly newsletter engine.
- `docs/data-access.md` — checklist for verifying government data feeds (fill during Phase 1).
- `docs/legal/tos-outline.md` — outline for your lawyers.
- `.env.example` — every secret/config the app needs.
- `brand/` — logo SVGs (light, dark, icon).
- `seed/` — sample rule templates + demo products.

## How to start (Guy's steps)
1. Create an empty GitHub repo (e.g. `lunair`), put these files in it as-is.
2. Open a Claude Code session in that folder.
3. First prompt to paste:
   > Read CLAUDE.md and docs/master-plan.md, then start Phase 0 item 1: scaffold the
   > monorepo exactly as specified. When it builds and deploys, stop and show me.
4. Continue one numbered item per session ("do Phase 0 item 2", "do Phase 1 item 3"…).
   Each item ends with something working you can see.

## Before/while building — only you can do these
- Register lunairworld.com (+ lunair.world) and connect to the host.
- Stripe: create the 4 products & 8 prices (monthly + annual), enable Stripe Tax,
  copy price IDs into `.env.local`.
- Create the Telegram bot with @BotFather → token.
- Resend account + domain verification.
- Neon/Supabase database + Railway/Fly project.
- Anthropic API key, PostHog, Plausible, Sentry accounts.
- Lawyer review: `docs/legal/tos-outline.md` + entity question (DBA vs subsidiary).
- USPTO knockout search for "Lunair" before spending on the brand.
