# LUNAIR WORLD — Master Plan (v2)
### Personalized US import-compliance radar for e-commerce sellers.
**Domain:** lunairworld.com · **Owner:** Guy (Wershuffle Inc) · **Goal:** $5,000+/mo net profit, ~98% automated
**v2 — August 2026.** Changes from v1: payments moved to **Stripe** (existing Wershuffle Inc account); **AI support chat ships at launch**; **weekly newsletter system ("The Lunar Tide")** added with founder-approval workflow; **design language & motion system** added (see `docs/design-system.md` in the starter kit).
**Purpose:** Complete handoff file for Claude Code — build from this document top to bottom, together with the other files in the starter kit.

> **The product in one line:** A seller describes their product once ("Product Passport" — fun, 5 minutes), and Lunair World shows every US import requirement that appears to apply (duties, agency rules, labeling — the *old* laws) and pings them the moment anything changes (the *new* laws). Informational radar, never legal advice.

---

## 0. STRATEGY SNAPSHOT

- **Beachhead market:** US-based e-commerce importers (Amazon FBA + Shopify DTC brands sourcing from Asia). English-first, reachable via channels Guy already masters.
- **Phase 2 market (month 5+):** Asia-based sellers exporting to the US, entered via the white-label Partner tier (freight forwarders, sourcing agents) + bilingual EN/中文 UI.
- **Model:** Freemium SaaS. Free = 1 product, baseline audit teaser, weekly newsletter. Paid = full audit + real-time personalized alerts + dollar impact.
- **Why we win:** Incumbents are enterprise (Descartes, $10k+/yr), brokerages (Importal), or free-but-generic feeds (CBP CSMS, law-firm trackers). Nobody personalizes to *your* HTS codes with dollar impact at SMB prices. Data is free government data (Federal Register API, USITC HTS, CBP CSMS) — no platform lock-out risk.

---

## 1. BRAND — Lunair World

**Story:** The moon moves the tides; the tides move cargo. Lunair World watches the tides of US trade rules so sellers always ship in calm waters. Nautical + lunar + radar imagery throughout.

**Tagline (recommended):** "See every rule change before it hits your cargo." (Alternates: "Import with clear skies." / "Your radar for US import rules.")

**Brand colors:**

| Token | Hex | Use |
|---|---|---|
| Deep Space Navy | `#0B1B33` | Primary background (dark), logo on light |
| Midnight Indigo | `#22346B` | Secondary surfaces, gradients |
| Moonlight | `#F4F6FB` | Light background, text on dark |
| Lunar Silver | `#C7CEDB` | Borders, muted text |
| Signal Amber | `#F5A623` | THE alert color — CTAs, pings, highlights |
| Aurora Teal | `#2EC4B6` | Positive states ("all clear", success) |
| Flare Red | `#E4572E` | Urgent alerts, overdue items |

Chart palette (accessibility-validated on dark surfaces, use in this fixed order): `#C57C0C` amber · `#1FA394` teal · `#5F82E8` blue · `#D14E28` flare.

**Typography:** Space Grotesk (headlines/logo/numbers) + Inter (UI/body). Both on Google Fonts.

**Logo:** crescent moon with radar ping arcs and an amber signal dot. Files in `brand/`: `lunair-icon.svg`, `lunair-logo.svg` (light bg), `lunair-logo-dark.svg` (dark bg). Convert wordmark text to outlines before print/social export. Full identity in the Brand Book artifact.

**Voice:** calm, plain-English, zero legalese, lightly nautical ("all clear", "incoming change"). Never alarmist — we reduce panic, not create it.

**Founder to-dos:** register lunairworld.com (+ lunair.world defensively); USPTO knockout search for "Lunair" (classes 35/42) before spending on brand.

---

## 2. BUSINESS PLAN

### 2.1 ICP
US-registered e-commerce businesses importing physical goods, 1–50 employees, $100k–$10M/yr import value, sourcing mainly China/Vietnam/India. Persona: the owner-operator who learned about the last tariff change from a panicked Reddit thread or a surprise customs invoice.

### 2.2 Freemium tiers

| Tier | Price | Limits & features |
|---|---|---|
| **Free — "Harbor"** | $0 | 1 Product Passport, HTS suggestion, current duty snapshot, requirement list with details partially locked ("8 requirements found — 3 flagged. Unlock to see."), weekly Lunar Tide newsletter. Blurred change alerts ("Something changed that affects your product"). |
| **Seller — "Voyage"** | $29/mo or $290/yr | 10 products, full baseline audit, real-time personalized alerts (email + Telegram), dollar-impact math, compliance self-checklist tracking, AI assistant with product context. |
| **Pro — "Fleet"** | $79/mo or $790/yr | 50 products, SKU breakeven/pricing impact, team seats (3), CSV export, priority data refresh, (Phase 4: Chinese-language alerts). |
| **Partner — "Lighthouse"** | $199/mo | White-label alert feed + client workspaces for freight forwarders, customs brokers, sourcing agents. 10 client workspaces included, +$10/workspace after. |

### 2.3 Unit economics & path to $5k/mo profit (Stripe)

Target mix (~month 9–12): 90 Voyage ($2,610) + 30 Fleet ($2,370) + 6 Lighthouse ($1,194) = **$6,174 MRR**.
Costs: Stripe fees ~3.2% (~$198) + infra/tools ~$250 + AI API ~$100 + paid ads ~$400 = ~$950.
**Net ≈ $5,200/mo.**

Funnel assumptions: visitor→signup 6%, signup→activated (Passport completed) 60%, free→paid within 60 days 4–5%. Holding 126 paid subs at 7% monthly churn needs ~9 new paid/mo → ~200 new free signups/mo → ~3,300 visitors/mo.

Milestones: M1–2 build + beta (20 sellers, free Fleet for feedback) → M3 public launch, 30 paid → M6 ~$2.5–3k MRR → M9–12 $5k+ profit. **Kill/pivot criterion:** if free→paid < 2% by M5 with ≥1,500 free users, fix packaging before spending more on traffic.

### 2.4 KPIs (tracked on the KPI Command Center artifact; live in admin from Phase 3)

**North Star: Products under paid monitoring.**

| KPI | Definition | Target |
|---|---|---|
| Unique visitors /mo | marketing site | 3,000 by M4, 8,000 by M9 |
| Visitor→signup | free account creation | ≥6% |
| Activation rate | Passport completed within 24h | ≥60% |
| Time-to-wow | signup → audit screen viewed | <15 min median |
| Free→paid (60-day) | cohort conversion | ≥4% |
| MRR / Net profit | Stripe | $6.1k MRR / $5.2k profit by M12 |
| Logo churn /mo | paid cancels ÷ paid subs | ≤7% |
| Expansion MRR | upgrades + workspace add-ons | ≥10% of new MRR |
| CAC by channel | ad spend ÷ new paid (first-touch UTM) | ≤$60 blended; pause channel at >$120 |
| LTV:CAC | (ARPU×margin÷churn) : CAC | ≥5:1 |
| Alert usefulness | 👍 share on alerts | ≥80% |
| Alert latency | rule published → alert sent | <6h median |
| Newsletter subscribers / open rate | Lunar Tide list | 2,000 by M6 · ≥45% opens |
| Support automation | tickets resolved without Guy | ≥90% |
| Source uptime | watcher health | ≥99% |
| NPS | day-14 + quarterly | ≥40 |

---

## 3. TRAFFIC — six sources + tracking stack

1. **Programmatic SEO.** Auto-generated pages from the rule library: "Current US import requirements: [category] from [country]" (~2,000 combos), "HTS [code] duty rate history". Each page = live data + "get alerted when this changes" capture. Target 2,500 organic visits/mo by M6.
2. **Paid social + search (Guy's superpower).** Meta lookalikes of FBA-seller interests; Google Search on high-intent terms ("fba tariff calculator", "section 301 alert"). Start $400/mo; scale only at CAC ≤ $60.
3. **The Lunar Tide newsletter (see §11).** Free weekly digest anyone can join without an account — a standalone acquisition asset: every issue is forwardable, every story links a product page or SEO page. Newsletter subscribers are the warmest upgrade pool.
4. **Niche media sponsorships.** FBA/e-comm newsletters, podcasts, YouTube. $200–500 test placements; unique UTMs + promo codes.
5. **Affiliate/referral.** 25% recurring for 12 months to seller-tool reviewers; give-a-month/get-a-month for users. Stripe coupons + promotion codes; affiliate attribution via UTM + referral code at checkout.
6. **Community roundup (semi-auto).** The newsletter's top section repurposed to Reddit/FB seller groups + a public changelog page after a 2-minute founder review.

**Tracking stack:** Plausible (site analytics) + PostHog (product funnels, session replay, feature flags) + strict UTM convention (link builder in admin) + Stripe webhooks joined to first-touch UTM at signup → revenue attribution per channel → admin KPI page + weekly founder digest.

---

## 4. PRODUCT

### 4.1 The Product Passport (onboarding centerpiece — fun and easy)
A conversational, game-like wizard — a travel passport application for your product, not a customs form:

1. **Start:** "Let's get your product its US travel papers 🛂" — paste an Amazon/Shopify/Alibaba listing URL **or** drop a product photo **or** type what you sell. AI pre-fills everything it can.
2. **Five friendly questions max** (only what AI couldn't infer): What is it made of? Who uses it (kids/adults)? Does it plug in / have a battery? Where is it made? Rough yearly import value (slider, optional).
3. **Progress & delight:** the passport visual fills with "stamps" as sections complete; instant micro-reveals after each answer ("Battery? Noted — that wakes up 2 extra rules 👀").
4. **The Wow screen:** "**Your Passport is ready.** Duty stack today: 7.5% + 25% §301 = 32.5%. **9 requirements found** — 6 all-clear, 3 flagged." Radar-sweep reveal animation, then a shareable branded summary card (auto-generated PNG).
5. **The hook:** "We're now watching 14 rule sources for this product. We'll ping you the moment anything moves." → connect Telegram / confirm email → done.

Rules: one question per screen, plain words ("your product's customs code," never "HTS classification"), skip-anything, save-and-resume, mobile-first, <5 minutes, every field explains *why we ask* in one line.

### 4.2 Ongoing experience
- **Alert anatomy:** what changed (one sentence) → does it hit you ($ impact on your import value) → effective date → official source link → 2-step "what to do" checklist → 👍/👎.
- **Weekly "All Clear" digest:** even when nothing happened — "We checked 312 updates this week. None affect your products. Sleep well ⚓" (silence made visible = retention).
- **Compliance checklist:** per requirement, self-marked status (Done / Need this / Not sure), progress ring per product.
- **Lunair Assistant (AI chat, ships at launch):** a chat bubble on every screen. Answers product questions ("why does this rule apply to me?", "what's a §301 exclusion?") from the docs, the user's own passports/alerts, and the rule library — with the same guardrails as alerts: quotes sources, never advises, suggests a licensed broker for judgment calls. Handles support tier-0 (billing, how-to) and hands off to email with full context when stuck. Every answer gets 👍/👎.
- **Upsell moments (automated):** 2nd product on Free → paywall; blurred alert opened → trial offer; 10th product on Voyage → Fleet prompt; forwarder email domain detected → Lighthouse pitch.

### 4.3 Design language — "calm mission control" (full spec: `docs/design-system.md`)
Modern, simple, dark, and quietly addictive — the pull comes from *anticipation and reward*, never from clutter or fake urgency:

- **The Radar is the home screen.** A slow ambient radar sweep over the user's product constellation; each product is a dot, green-ringed when all-clear, amber-pulsing when something changed. One glance = full status. The sweep is the brand.
- **Signature animations (all <400ms, CSS-first, `prefers-reduced-motion` respected):** radar sweep (ambient 8s loop) · amber ping ripple on new alerts · count-up tickers on duty rates and $ impact · passport stamps that thunk in on completion · progress rings that fill with a spring ease · confetti burst once per milestone (passport done, first catch) — never repeated for the same event.
- **Addictive-but-healthy loops:** the weekly All-Clear creates a check-in habit (variable reward: usually calm, sometimes a catch); a **Watch Streak** counts consecutive weeks covered; badges for real moments ("First Catch", "Fleet of 10", "Early Bird — acted before an effective date"); the "scene pulse" ticker on the dashboard shows anonymized platform-wide catches ("Lunair caught 37 changes for sellers this week") for social proof. **No dark patterns:** no fake countdowns, no shame copy, no artificial scarcity — trust is the moat.
- **Feel:** generous whitespace on navy, one amber voice, tabular numbers, instant page transitions (<100ms perceived), skeleton shimmer in brand indigo while data loads.

---

## 5. AUTOMATION MAP — end to end

| Stage | How it runs without humans |
|---|---|
| Acquisition | SEO pages auto-generated; ads on auto-rules (Guy reviews 30 min/wk); newsletter + affiliates self-serve |
| Signup→Activation | Self-serve Passport; AI autofill; lifecycle emails (D0 welcome, D1 finish-passport nudge, D3 audit recap, D7 case study, D12 trial offer) triggered by PostHog events |
| Service delivery | Watchers → diff → AI impact analysis → alert router (fully automated, §9) |
| Billing & dunning | Stripe Billing: checkout, invoices, Smart Retries on failed payments, cancellation flows; Stripe Tax for US sales-tax calculation/filing exposure |
| Support tier 0 | Lunair Assistant in-app (day one) + help center; email auto-triage: AI drafts reply → auto-send if confidence high, else queued in Admin for 1-click approve |
| Customer success | Usage-based nudges; monthly value recap ("Lunair caught 4 changes for you, est. $6,200 impact") |
| Newsletter | Auto-drafted Monday from the week's events; founder approves in admin (or by reply); auto-sends Tuesday (§11) |
| Upsells | Limit-based paywalls + event-triggered offers; annual-plan prompt after 3rd paid month |
| Winback | Cancel → exit survey → 50% off 2 months (auto) → 60-day winback with "what changed since you left" |
| Ops watchdog | Source-health pings to OWNER's Telegram; daily business KPI digest; Sentry alerts |

**Honest number: ~95–98% automated.** Human steady state: ~30 min/wk (ads review + AI-queued support edge cases) + ~15 min/wk newsletter approval + ~2 hrs/mo maintenance via Claude Code sessions.

---

## 6. ADMIN CONSOLE (`/admin`, owner-only, 2FA)

- **Command deck:** live KPIs (§2.4), MRR chart, funnel, today's alerts, source health lights.
- **Users:** search, view-as, plan override/comp, ban, GDPR/CCPA delete button.
- **Products & classifications:** review queue of low-confidence HTS suggestions (<80%); corrections feed back into prompt examples.
- **Rule library editor:** requirement templates per category (agency, plain-English, source URL, versions). AI proposes; owner approves. The crown-jewel data asset.
- **Watchers:** per-source status, "Run now", pause/resume, latency stats.
- **Alerts:** searchable log, delivery status, resend, kill-switch (pause all outbound).
- **Newsletter desk:** Monday's AI draft side-by-side with sources → edit inline → Approve & schedule / Regenerate section / Skip week; subscriber stats (opens, clicks, growth); archive auto-published to the site (SEO).
- **Support inbox:** AI-drafted replies with confidence — approve/edit/send; Assistant conversation review; auto-resolved log.
- **Growth:** UTM link builder, affiliate approvals, Stripe coupon creation, announcement composer, lifecycle email editor.
- **System:** feature flags, maintenance mode, admin audit log.
- **Code control:** GitHub + CI/CD (push→deploy, rollback). Claude Code is the maintenance engineer; `docs/runbook.md` documents every operational procedure.

---

## 7. LEGAL POSTURE (US company, minimal exposure)

> ⚠️ Preparation for Guy's lawyers, not legal advice. Have US counsel confirm every item before launch.

1. **Entity:** Guy already has a US inc (Wershuffle) with Stripe. Options: run Lunair World as a DBA/product of Wershuffle Inc (fastest, fine for launch) or a separate subsidiary LLC for liability isolation once revenue is real. **Decide with counsel** — the ToS liability caps do most of the protective work either way.
2. **Payments & tax:** Stripe under Wershuffle Inc. Because Stripe is *not* a merchant of record, enable **Stripe Tax** from day one — it calculates US sales tax where SaaS is taxable and tracks economic-nexus thresholds by state; register + remit when thresholds trip (accountant task, mostly none at early scale).
3. **Product legal posture (the core shield):** informational monitoring service. Never "you are compliant," never certifies, never advises. Every requirement links its official source; checklists are self-declared. Banned words in all UI/marketing: "guaranteed," "certified," "legal advice," "we ensure compliance."
4. **Terms of Service:** no-professional-advice clause; disclaimer of warranties (info "as is," may be incomplete/delayed); liability capped at 12 months of fees; no indirect/consequential damages (seized cargo, fines, lost profits); user indemnification; binding arbitration + class-action waiver; modification/termination rights.
5. **Privacy:** CCPA/CPRA-ready policy; minimal PII; deletion endpoint (built, §6); CAN-SPAM-compliant email — the newsletter is opt-in (double opt-in), one-click unsubscribe, physical address in footer.
6. **Insurance:** Tech E&O + cyber (~$500–1,500/yr) at first revenue.
7. **Data sourcing:** exclusively public US government publications (public domain). Listing-autofill fetches only pages the user pastes.
8. **IP:** USPTO knockout search "Lunair"/"Lunair World" (classes 35, 42) pre-launch; file after first revenue.
9. **Lawyer checklist:** ToS + Privacy review · DBA vs subsidiary · arbitration enforceability · insurance adequacy · trademark results · landing page + newsletter claims review.

---

## 8. FOUNDER DECISION LOG — decisions only Guy can make

**Pre-build (this week):** approve brand/tagline · buy domains · DBA vs subsidiary with counsel (§7.1) · confirm pricing table · approve kill/pivot criterion · confirm newsletter send day/time (§11).
**Pre-launch (M1–2):** pick 20 beta users · refund policy (recommend 14-day no-questions) · support SLA (recommend 24h) · ad budget cap ($400/mo) + CAC ceiling ($60 target / $120 pause) · sign off ToS + Privacy · enable Stripe Tax + confirm with accountant · E&O insurance now or at first revenue.
**Scale (M3+):** affiliate % (25–30) · licensed data source if a gov feed degrades (trigger: >$1k MRR) · Asia phase timing + translation bar · VA hire when human support >3 hrs/wk · annual discount depth · price raise at 100 customers (+20% for new, grandfather existing).
**Standing weekly (~45 min):** ads review · approve newsletter draft (15 min, §11) · approve AI-queued support edge cases · KPI digest glance.

---

## 9. ARCHITECTURE & CODEBASE PLAN

### 9.1 Stack
Next.js 15 (App Router, TypeScript) · Postgres (Neon or Supabase) + Drizzle ORM · pg-boss job queue (no Redis) · Node worker · **Stripe** (Billing + Checkout + Customer Portal + Tax + webhooks) · Resend + React Email (alerts, lifecycle, newsletter) · Telegram via grammY (webhook) · Claude API (classification, summarization, Assistant, support drafts, newsletter drafts) · PostHog + Plausible + Sentry · Railway or Fly.io (~$40–80/mo).

### 9.2 Repo layout (monorepo)
```
lunair/
  apps/web/          # marketing site, app, admin, API routes
  apps/worker/       # watchers, diff engine, AI pipeline, alert router, lifecycle + newsletter jobs
  packages/core/     # drizzle schema, shared types, source adapters, utils
  packages/rules/    # requirement template library (versioned JSON + loader)
  docs/              # runbook.md, data-access.md, design-system.md, newsletter.md, legal/
```

### 9.3 Data model (Postgres, key tables)
```sql
users(id, email, name, telegram_chat_id, plan, stripe_customer_id, stripe_sub_id,
      utm_first_touch jsonb, locale, streak_weeks, created_at)
workspaces(id, owner_user_id, name, type)            -- type: seller | partner_client
products(id, workspace_id, name, description, listing_url, image_url, materials jsonb,
         audience, has_battery, has_plug, origin_country, annual_import_value,
         hts_code, hts_confidence, passport_status, created_at)
requirements(id, category_key, agency, title, plain_english, source_url, severity,
             version, effective_from, superseded_by)
product_requirements(product_id, requirement_id, status)   -- done|todo|unsure|na
tariff_lines(hts_code, base_rate, s301_rate, other_rates jsonb, total_rate,
             effective_date, source_doc_id)                 -- append-only history
source_docs(id, source, external_id, title, url, published_at, raw jsonb, processed_at)
events(id, type, source_doc_id, affected_hts text[], affected_categories text[],
       summary, dollar_impact_formula, effective_date, confidence, created_at)
alerts(id, event_id, user_id, product_id, channel, sent_at, opened_at, feedback, feedback_note)
assistant_threads(id, user_id, messages jsonb, escalated, created_at)
newsletter_issues(id, week_of, draft_md, html, status, approved_at, sent_at, stats jsonb)
   -- status: drafted | approved | sent | skipped
newsletter_subscribers(id, email, source, confirmed_at, unsubscribed_at)
feedback(id, user_id, kind, score, text, context jsonb, created_at)  -- nps|alert|assistant|cancel|feature
support_tickets(id, user_id, channel, body, ai_draft, ai_confidence, status, resolved_by)
badges(user_id, key, earned_at)
source_health(source, last_success_at, error_streak, status)
affiliates(id, user_id, code, rate, earnings)
admin_audit(id, actor, action, target, at)
```

### 9.4 Data pipeline (the engine)
```
WATCHERS (pg-boss cron)
  federal_register:poll   hourly   # free API, no key; agencies: USTR, CBP, ITA, Commerce,
                                   # CPSC, FDA, FCC; types: rules, proposed rules, notices, proclamations
  usitc_hts:diff          daily    # HTS revision download → diff duty columns → tariff_lines
  cbp_csms:ingest         hourly   # CSMS bulletins → source_docs
  (optional) lawfirm_rss  daily    # Reed Smith / ST&R as secondary confirmation
        ▼
AI PIPELINE (worker, Claude API, strict JSON outputs)
  1. classify: relevant to importers? which HTS ranges / categories?
  2. impact: rates, dates, requirements; per-product $ impact via formula
  3. render: plain-English ≤3 sentences, must link/quote source
  4. confidence gate: <0.8 → admin review queue, never auto-send
        ▼
ALERT ROUTER
  events → products (HTS prefix + category) → users; tier gates (free = blurred);
  dedupe (event+user+product unique); quiet hours; Telegram + Resend email
        ▼
WEEKLY JOBS
  all_clear:digest  Fri            # per-user weekly status + streak update
  newsletter:draft  Mon 05:30 UTC  # §11 — aggregate week's events → Claude draft → admin desk
  newsletter:send   Tue 14:00 UTC  # sends ONLY if status=approved
        ▼
FEEDBACK LOOP: 👍/👎 on alerts + assistant → weekly relevance report → admin
```
Passport autofill: user-pasted URL fetched server-side (best effort), text + image → Claude → prefill + HTS suggestion with confidence. Fallback: the 5 questions.

### 9.5 Build phases (each numbered item ≈ one Claude Code session/PR)

**Phase 0 — Foundation (wk 1):** 1. Monorepo scaffold, schema migrations, pg-boss, CI/CD, Sentry, `docs/runbook.md`. 2. Auth.js (magic link + Google), **Stripe**: products/prices for all tiers (monthly+annual), Checkout, Customer Portal, webhook → plan state, Stripe Tax enabled; PostHog/Plausible with UTM capture.
**Phase 1 — Passport, Audit & Assistant (wk 2–3):** 3. Rule library v1: top 20 e-comm categories in `packages/rules` (AI-drafted, founder-reviewed). 4. Product Passport wizard (§4.1 incl. autofill, animations per design-system.md, wow screen, share card). 5. HTS suggestion pipeline + duty-stack snapshot from USITC data. 6. **Lunair Assistant** (in-app chat: docs + rule library + user's own data; guardrails; escalation to email; 👍/👎). **→ Free tier live and valuable.**
**Phase 2 — The Radar (wk 4–6):** 7. Watchers (Federal Register, HTS diff, CSMS) + source_health. 8. AI pipeline + events + confidence gate. 9. Alert router + Telegram bot + email templates + weekly All-Clear digest + streaks/badges. 10. Paywalls, upsell triggers, referral codes (Stripe promotion codes). 11. **Newsletter engine:** public subscribe page + double opt-in, Monday draft job, admin Newsletter Desk, Tuesday send job, public archive pages. **→ Public launch.**
**Phase 3 — Autonomy & Growth (M2–3):** 12. Admin console (full §6). 13. AI support email triage. 14. Lifecycle email engine. 15. Programmatic SEO pages + community roundup generator. 16. KPI pipeline → command deck + weekly founder digest.
**Phase 4 — Expansion (M4–6):** 17. Lighthouse partner workspaces + white-label. 18. Bilingual EN/中文. 19. Winback + annual-plan engine. 20. Data-vendor fallback adapter.

**Definition of done (launch):** new user reaches Wow screen <15 min · alert latency <6h on test events · zero uncaught alert errors in 7-day soak · confidence gate verified · Stripe live checkout all tiers (monthly + annual) with Tax enabled · newsletter loop tested end-to-end (draft → approve → send) · Assistant answers the 25 seed FAQs correctly · ToS/Privacy live · admin kill-switch works · `prefers-reduced-motion` honored everywhere.

**Standing instructions to Claude Code:** read `CLAUDE.md` first · verify every government feed empirically before coding against it → `docs/data-access.md` · all AI outputs strict JSON with confidence, never free-form text into the alert path · every source adapter implements the shared interface + reports to source_health · UI copy follows §7.3 banned words · animations follow `docs/design-system.md` and respect reduced motion · seed script with 10 demo products · integration tests: HTS diff fixtures, event→alert routing, tier gating, newsletter approval gate.

---

## 10. FEEDBACK SYSTEM — the product gets better by itself

1. **Alert-level:** 👍/👎 + one-tap reason on every alert → weekly relevance tuning report.
2. **Assistant-level:** 👍/👎 on every AI chat answer; low-rated answers auto-queued for review; corrections become new help-center entries.
3. **Moment NPS:** day-14 one-tap NPS, then quarterly; detractors get an AI follow-up, paid detractors flagged to founder.
4. **Cancel flow:** reason picker + free text → auto save-offer → monthly clustering.
5. **Voice-of-customer synthesis:** weekly job feeds ALL feedback + tickets + cancel reasons to Claude → themed report → auto-filed GitHub issues tagged `vox-populi` → Claude Code picks top issues monthly. Feedback literally becomes code.
6. **Advisory harbor:** 10 power users get free Fleet for a monthly 15-min async survey.
7. **Behavioral signals:** unopened alerts, abandoned passports, ignored checklists → each has an automated remedy and a KPI-dashboard row.

---

## 11. THE LUNAR TIDE — weekly newsletter (created by Claude, approved by Guy)

**What:** a free weekly plain-English digest of US import-rule changes for e-commerce sellers. Anyone can subscribe without an account → top-of-funnel asset + authority builder + retention touch.

**Issue structure (5 blocks, ~600 words):**
1. *The Tide This Week* — 2-sentence overview + "calm/choppy/storm" indicator.
2. *What Changed* — 2–4 rule changes, each: plain-English what/who/when + $ example + official source link.
3. *On the Radar* — upcoming effective dates and proposed rules worth watching.
4. *One Practical Tip* — a short actionable (e.g., "how to check if your supplier's invoice matches your HTS code").
5. *CTA* — "Put your own products on the radar" → free Passport.

**Weekly schedule (times in Israel time, Guy's timezone):**

| When | What | Who |
|---|---|---|
| Monday 09:00 | Draft lands: AI aggregates the week's events (Federal Register, HTS diffs, CSMS) and writes the full issue | Claude (automated) |
| Monday–Tuesday 16:00 | Review window: approve as-is, edit inline, regenerate a section, or skip the week | **Guy (~15 min)** |
| Tuesday 17:00 (= 10:00 ET) | Send to list; archive page auto-published to site | Automated — sends **only if approved** |

**Compliance:** double opt-in, one-click unsubscribe, physical address footer, no tracking pixels beyond open/click counts.

**Before the product exists:** the same loop already runs in this Cowork workspace — a scheduled task drafts The Lunar Tide every Monday 09:00 from live government sources and delivers it to Guy for approval; send manually via any email tool (or just bank the issues as launch content). When Phase 2 ships, the in-product engine replaces it — delete the Cowork scheduled task then.

---

## APPENDIX A — Competitor snapshot (researched Aug 2026)
Descartes CustomsInfo (enterprise, contact-sales) · Importal.ai (AI customs brokerage) · Zonos (outbound landed-cost APIs) · Flexport (freight-bundled) · Free: CBP CSMS bulletins, Reed Smith tariff tracker (active Aug 2026), ST&R daily report. **No personalized SMB alert product found** (caveat: web search unavailable during research — run a 30-min fresh search before build).

## APPENDIX B — Starter kit contents
`CLAUDE.md` (Claude Code instructions) · `README.md` (how to start) · `docs/master-plan.md` (this file) · `docs/design-system.md` · `docs/newsletter.md` · `docs/data-access.md` (verification checklist) · `docs/legal/tos-outline.md` · `.env.example` · `brand/` (3 logo SVGs) · `seed/rules.sample.json` · `seed/demo-products.json`
