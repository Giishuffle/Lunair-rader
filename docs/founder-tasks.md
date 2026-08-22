# Founder tasks - the 2% only Guy can do

Claude Code builds and operates everything else. Items are ordered; the ones marked
BLOCKING stop the build until done. Everything needs ~2-3 hours total, spread over a week.

## This week (unblocks Phase 0 item 2)
1. **BLOCKING - Accounts + keys into `.env.local`** (copy `.env.example` to `.env.local`, fill as you go):
   - Neon (or Supabase) Postgres database -> `DATABASE_URL` (~5 min)
   - GitHub: create empty repo `lunair` under your account; I push and set up CI (~2 min)
   - Railway project connected to that repo (~5 min)
   - Anthropic API key -> `ANTHROPIC_API_KEY` (~2 min)
   - Stripe: a restricted API key (Products, Prices, Checkout, Customer Portal, Webhooks: write) from the Wershuffle account -> `STRIPE_SECRET_KEY`. I create the 4 products and 8 prices via API. Enabling **Stripe Tax** is a dashboard toggle only you can click. (~10 min)
   - Resend account -> `RESEND_API_KEY` (~3 min)
   - Telegram: message @BotFather, `/newbot`, name it "Lunair World" -> `TELEGRAM_BOT_TOKEN` (~3 min)
   - PostHog + Plausible + Sentry accounts -> keys (~10 min)
2. **BLOCKING - Domain:** register lunairworld.com (+ lunair.world defensively). Then
   add the DNS records I give you (Resend domain verification, Railway). (~15 min + DNS waits)
3. **Lawyer (start now, slowest item):** send `docs/legal/tos-outline.md` plus one added
   question at the top: *"Does suggesting HTS classification codes to paying users
   constitute 'customs business' under 19 CFR 111, and how must we present code
   suggestions to stay clearly informational?"* Also: DBA vs subsidiary.
4. **Trademark:** USPTO knockout search "Lunair" / "Lunair World" (classes 35, 42).
   I can run a preliminary TESS search and hand the results to your lawyer - say the word.

## Decisions I need (one line each is enough)
5. Approve the repositioned tagline direction after reading `docs/plan-critique.md` #1
   (competitors exist now; recommended angle: "the only import radar that speaks seller,
   not broker").
6. Confirm pricing table as-is ($29/$79/$199) - I recommend keeping it and pushing
   annual harder at signup (critique #2).
7. Refund policy (recommend: 14-day no-questions) and support SLA (recommend: 24h).
8. Newsletter send day/time - plan says Tue 17:00 Israel time; confirm.
9. Kill/pivot criterion sign-off (plan §2.3) plus the earlier M3 product gate (critique #8).

## Standing weekly (~45 min, starts at beta)
- Ads review (30 min), newsletter draft approval (15 min, Mon-Tue), AI-flagged support
  edge cases (usually 0-3 items).

## What you do NOT need to do
Code, deploys, schema, watchers, alert pipeline, admin console, SEO pages, newsletter
drafting, support tier-0, lifecycle emails, KPI reporting - all built and operated by
Claude Code sessions per master-plan §9.5.
