# Lunair World — Handoff

_Written 24 Aug 2026 to resume this project in a new chat. Paste this whole file as
your first message, or just point Claude at `docs/HANDOFF.md` in the repo._

## What this is

**Lunair World** (lunair-world.com) — a personalized US import-compliance radar for
e-commerce sellers. A seller describes a product in plain English; the product shows
which US import requirements appear to apply, cites the actual CBP rulings and CFR
regulations behind each one, and alerts them when something changes. A product of
**Wershuffle Inc** (Delaware corp), run by **Guy Tal** (CEO), deliberately separate
from Shuffle/the playlist business.

Repo: `/Users/guy/Projects/lunair`, its own git repo, pushed to
**github.com/Giishuffle/Lunair-rader**. Read `CLAUDE.md` first, then
`docs/master-plan.md`. This file is the fast-resume version of everything below it.

## Live right now

- **Site:** https://lunair-rader-production.up.railway.app (working — use this one)
- **Custom domain:** https://www.lunair-world.com (DNS is correct; Railway's TLS
  certificate has been stuck "validating" for an unusually long time — not a problem
  on our side, worth nudging Railway support if it's still stuck)
- **Sign in:** `/signin` → real magic-link email via Resend
- **Product Passport:** `/app` (behind sign-in) → add a product, get a live CBP
  cross-reference, choose alerts
- **Terms / Privacy:** `/terms`, `/privacy` (drafted, attorney review pending)
- **Telegram watchdog:** @lunairworldbot pings Guy on source failures and daily health

## What actually works end-to-end (not just "built" — verified live)

- **4 government watchers**, hourly/daily: Federal Register, USITC tariff schedule
  (with a rate-diff engine), CPSC recalls, and a **daily eCFR watcher** that reads the
  actual regulation text behind every rule-library requirement and fires an alert when
  it's amended — a source no competitor has.
- **Passport → cross-reference engine**: live CBP CROSS rulings lookup, candidate HTS
  codes with real ruling citations, agency requirements, origin-tariff and AD/CVD
  watches — all opt-in, nothing pre-selected below 80% confidence.
- **The alert loop is closed**: an event (e.g. a CFR amendment) reaches the right
  seller by email, gated by confidence → watch match → paid tier only → dedupe (DB
  unique index, can't double-send) → delivery. Verified with a real regulation change.
- **Auth + billing**: passwordless email sign-in, Stripe checkout/portal/webhook
  (webhook is the *only* writer of plan state), founding-50 discount auto-applies.
  **Stripe is in TEST mode** — switch to live keys before real money.
- **Rate limiting** on the two public endpoints that could get us blocked by CBP or
  spammed (`/api/crossref`, `/api/waitlist`).
- **107+ tests, CI green** on GitHub Actions (was red for a while — see gotchas below).
- **Sentry** on both web and worker, with secret-scrubbing before anything is reported.

## What's NOT done — the honest gap list

_Updated 26 Aug 2026, after the broker review came back._

1. **The rule library is the launch blocker, and it is now a known quantity.** A
   licensed reviewer answered our questionnaire in full (`docs/broker-review-2026-08-25.pdf`,
   actionable extract in `docs/broker-review-findings.md`). Verdict: *"the current
   draft should not be published as written."* Two critical omissions have since been
   fixed (the mandatory toy standard, and button-cell safety), along with the CPC
   wording, the lead/phthalates split, and lithium transport. **Still outstanding
   from that review:**
   - Split FCC into intentional vs unintentional radiators. `powered_any` is *not*
     the legal trigger — this contradicts a change we made on 23 Aug.
   - Add the remaining CPSC trigger modules: small parts (1501), choking warnings,
     electrically operated toys (1505), magnets (1262), art materials, imitation
     firearms (1272), durable infant/toddler products.
   - Add the per-requirement fields the reviewer asked for: `authority_layer`,
     `legal_status`, `timing`, `evidence`, `enforcement_effect`, `review_status`.
     Without `authority_layer` we present a retailer's UL demand as if it were a
     federal entry condition. (`severity: critical` and `incorporated_standard` are
     already in.)
   - CPSC certificate eFiling has been mandatory since **8 July 2026** — already
     live, and we do not mention it.
   - Prop 65 and state chemical laws as a separate state overlay, never as a federal
     admissibility condition.
2. **Still only 2 categories.** The reviewer's recommended launch order:
   general textile apparel, children's sleepwear, cosmetics, food-contact
   kitchenware, composite-wood furniture, upholstered furniture & mattresses,
   children's jewelry, pet food & edible chews, ordinary pet accessories. Several
   must be *split*, not shipped whole — see the findings doc.
3. **No admin console.** Low-confidence events queue for review with no UI to review
   them in; the newsletter is approved from a signed Telegram link instead.
4. **eCFR watching is necessary but not sufficient.** It cannot see a changed ASTM
   edition (the CFR names the standard without reproducing it), U.S. Code changes,
   FDA guidance and import alerts, or CPSC effective-date changes. `incorporated_standard`
   records the edition but nothing watches it yet.

## Founder tasks outstanding (Guy's side)

- **Send the lawyer email** — `docs/legal/lawyer-email.md`, fully self-contained
  (40 questions, no attachment needed). Longest lead time item — send it first.
- **Send the ABI Letter of Intent** — `docs/Lunair-ABI-Letter-of-Intent.docx`
  (also `docs/abi-letter-of-intent.md` as text). Signature-ready. Mail to:
  Port Director TenaVel T. Thomas, US Customs and Border Protection, Area Port of
  New York/Newark, 1100 Raymond Blvd., Newark, NJ 07102 — **plus a copy** to
  Assistant Commissioner, Office of Information and Technology, CBP, 1300
  Pennsylvania Avenue NW, Washington, DC 20229. Full context in `docs/abi-access.md`.
- **Book the customs broker review** — `docs/broker-engagement.md`. Best first move:
  USA Customs Clearance, $495 for a 45-min session, covers FDA/CPSC/FCC. Ask for
  "internal accuracy review, no published attribution, capped fixed fee" — the word
  "classification" alone triggers $5–15k pricing.
- **KYG Trade follow-up** (Guy already messaged them) — the only vendor with public
  pricing that explicitly claims PGA/admissibility fields, $825+/mo. Ask about
  redistribution rights (showing their data to our own users) before price.
- **Check the www TLS certificate** — if still stuck validating, contact Railway
  support directly; DNS on our end is confirmed correct.

## Access already configured — don't ask Guy to re-supply these

All of the following are live and working; read real values from `.env.local`
(gitignored, in the repo root) or Railway's environment variables, never re-request
them from Guy:

- Anthropic API key, Telegram bot token + owner chat ID, Sentry DSN
- Stripe restricted key (test mode) + all price IDs, founding-50 coupon
- Resend API key, verified sending domain (root domain, not a subdomain — a known
  suboptimal choice, see gotchas)
- Railway **project token** (not account token) — works for deploys/variables but
  **cannot rename services** (needs an account token, which we don't have)
- GitHub repo access via `gh` CLI, already authenticated

## Decisions already made — don't re-litigate these

- Operate as Wershuffle Inc directly (no subsidiary) for launch
- 14-day no-questions refund policy
- Newsletter: draft Sunday 09:00 Israel, send Monday 11:00 Israel (DST-proof)
- Pricing unchanged: Harbor free / Voyage $29 / Fleet $79 / Lighthouse $199
- Founding-50: first 50 waitlist signups get 50% off first year, annual plans only
- Domain is **lunair-world.com** (with hyphen) — corrected from an earlier typo
- Trademark: USPTO screen came back clear in classes 35/42, proceed with the brand
- Full log with reasoning: `docs/decisions.md`

## Gotchas worth knowing before touching the code

- **Build order matters**: `packages/core` and `packages/rules` must be built before
  `apps/web`/`apps/worker` typecheck — CI runs build before typecheck/test for
  exactly this reason. If you add a new package, check `.github/workflows/ci.yml`.
- **`cp -R rules dist/rules` bug**: copying INTO an existing directory nests instead
  of replacing. The rules package build now does `rm -rf dist/rules` first — don't
  remove that.
- **Auth config must be built lazily** (a factory function), not at module scope —
  constructing it eagerly requires `DATABASE_URL` at import time, which breaks
  `next build` in CI where no database exists yet.
- **CROSS (CBP rulings API) ANDs its search terms** — a long query returns zero
  results. Always use short noun-phrase queries (see `buildQueries()` in
  `packages/core/src/sources/crossRulings.ts`).
- **eCFR citations need real verification**, not just a plausible-looking CFR part —
  one was miscited early on (16 CFR 1130 for tracking labels; the real duty is
  statutory, no CFR part exists). Always resolve a new citation against the live
  eCFR API before shipping it.
- **Drizzle correlated subqueries inside `sql\`\`` templates can silently return 0**
  due to table aliasing — use a separate grouped query instead, as in
  `apps/web/lib/products.ts`.
- **Don't tight-poll Railway's GraphQL API** — it starts rejecting requests.
- **LibreOffice is not installed** on this Mac — can't render .docx to PDF locally;
  verify Word documents by reading `word/document.xml` directly instead.
- **The Browser pane tool in this environment only reliably screenshots at
  scroll-top** — to inspect a lower section, hide the preceding elements with a
  script instead of scrolling.

## In-progress, not yet finished

A **market-education document** (`import-compliance-market.html`, in the session
scratchpad, not yet published as an Artifact) explaining the broader trade-compliance
software market to Guy's business partner — competitive landscape, market sizing
across 8 research firms, the 2026 tariff-policy timeline (6 legal regime changes in 6
months, Supreme Court struck down IEEPA tariffs Feb 20 2026), and the data-access
economics (free government data vs. paid vendors vs. the ABI gate). All research is
done and verified; the artifact was mid-visual-QA (checking chart rendering) when this
handoff was written. Worth finishing and publishing in the next session if wanted.

## Where to look for more detail

Everything above is a summary. Full depth lives in `docs/`:
`master-plan.md` (product spec) · `decisions.md` (every call + why) ·
`plan-critique.md` (competitive/market critique) · `status.md` (build audit) ·
`deploy.md` (Railway specifics) · `runbook.md` (operational how-tos) ·
`api-inventory.md` (every data source, verified) · `legal/` (ToS, Privacy, lawyer email).
