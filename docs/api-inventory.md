# API & scraping inventory
_Every external interface Lunair World uses. All government feeds verified live 2026-08-22._

## Government data (the product's raw material)

| Source | Access | Status | Adapter |
|---|---|---|---|
| **Federal Register API** | `federalregister.gov/api/v1` - free JSON, no key, agency + doc-type filters, pagination | ✅ Verified & ingesting | `federalRegister.ts`, hourly |
| **USITC HTS export** | `hts.usitc.gov/reststop/exportList?format=JSON&from=X&to=Y&styles=false` - the `styles=false` param is REQUIRED (400 without it) | ✅ Verified & ingesting; hash-dedup snapshots, rate diff engine, watches Ch. 99 (9903) for §301/IEEPA/§232 | `usitcHts.ts`, daily |
| **USITC HTS search** | `hts.usitc.gov/reststop/search?keyword=...` - free JSON | ✅ Verified; used for HTS suggestion lookups (Phase 1) | Phase 1 |
| **CPSC Recall API** | `saferproducts.gov/RestWebServices/Recall?format=json` - free, no key | ✅ Verified & ingesting (v3 addition - recall alerts, no competitor has this) | `cpscRecalls.ts`, 6-hourly |
| **CBP CSMS bulletins** | No public feed (403 to bots; GovDelivery archive needs login). Plan: dedicated inbox subscribed to the GovDelivery list, parse from email. cbp.gov responds 200 to a browser user-agent for full-text fetches; monthly archive PDFs exist for backfill | ✅ Investigated; email-ingest adapter in Phase 2 | Phase 2 |
| **Regulations.gov v4** | `api.regulations.gov/v4` - needs free api.data.gov key (DEMO_KEY works for dev, low limits) | ✅ Verified; optional enrichment (comment periods, dockets) | Phase 3+, optional |
| **openFDA** | `api.fda.gov` - free, enforcement/recall data for food, cosmetics, devices | ✅ Verified; for FDA-heavy seller categories | Phase 4, optional |
| **Reed Smith / ST&R** | Law-firm RSS trackers | Secondary confirmation only, never quoted in alerts | Phase 2, optional |

### Scraping policy
Only public government pages. Polite pacing (1-1.5s between requests), identifying
user-agent with contact email where accepted; realistic browser UA only where the
server blocks default fetchers (cbp.gov full-text). Every adapter implements
`SourceAdapter`, reports to `source_health`, and fails loudly rather than silently.

## Service APIs (the product's plumbing)

| Service | Purpose | Key status |
|---|---|---|
| Anthropic (Claude API) | HTS suggestion, event classification, impact analysis, Assistant, support drafts, newsletter drafts | ✅ Key in `.env.local` |
| Telegram Bot API | Alerts + owner watchdog pings via @lunairworldbot | ✅ Token verified; owner chat id pending (Guy: message the bot once) |
| Stripe | Billing, Checkout, Customer Portal, Tax, webhooks | ⏳ Restricted key tomorrow |
| Resend | Alert emails, lifecycle, newsletter, CSMS ingest inbox | ⏳ Key tomorrow; domain verification after lunairworld.com registered |
| GitHub | Repo + CI/CD | ✅ github.com/Giishuffle/Lunair-rader |
| Railway | Hosting web + worker + Postgres | ✅ Project created; add the Postgres service + copy DATABASE_URL |
| PostHog / Plausible / Sentry | Product analytics / site analytics / errors | Not blocking; add before launch |
| api.data.gov | Free instant key for Regulations.gov | Optional; DEMO_KEY in dev |
