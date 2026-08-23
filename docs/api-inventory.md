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

## Candidate sources - verified reachable 23 Aug 2026, not yet built

Ranked by value to the seller. All are free US government sources.

| Source | Access | Why it matters |
|---|---|---|
| **CBP CROSS rulings** | `rulings.cbp.gov/api/search?term=…&collection=ALL` - working JSON API, no key. Returns ruling number, subject, date, and the **tariff codes CBP actually assigned** | The highest-value addition. It is CBP's own published precedent: search "night light" and get a ruling classifying one from China as 9405.40.8000. Turns our classification feature from *our opinion* into *a citation of CBP's published decision* - which is both more accurate and a materially safer legal posture (see counsel question A) |
| **AD/CVD orders** | Already flowing: the International Trade Administration is in our Federal Register agency list. 10,000+ matching documents | Antidumping and countervailing duties can exceed 100% of product value - the single largest dollar surprise an importer can hit. **The data is already in `source_docs`; only the product-matching logic is missing** |
| **UFLPA Entity List** | dhs.gov/uflpa-entity-list (HTML, browser UA) | Goods traceable to listed entities are barred from entry outright. Binary, catastrophic, and directly relevant to China sourcing |
| **California Prop 65** | oehha.ca.gov chemical list + oag.ca.gov 60-day notice search | The one piece of **state** law that reliably bites e-commerce sellers, enforced by private bounty suits. Our biggest current gap outside federal agencies |
| **FDA import alerts** | accessdata.fda.gov/cms_ia/ialist.html | Supplier-level detention risk: goods from listed firms are held without physical examination |

**Not worth building: municipal / city council codes.** Import regulation is a federal
power; a city cannot regulate what enters the country. The only sub-federal law that
reaches these sellers is state-level (Prop 65 above, plus state chemical bans and
packaging EPR laws). ~19,000 municipalities would add enormous noise for almost no
signal.

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
