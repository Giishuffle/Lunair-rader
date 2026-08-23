# Master Plan v2 - Critical Review
_Claude Code, 2026-08-22. Ranked by how much each item threatens the $5k/mo goal._

## What the plan gets right (keep these)
The freemium teaser design, the confidence gate on AI output, the banned-words legal
discipline, the kill/pivot criterion, the pre-launch newsletter loop, and building on
free public-domain government data are all genuinely strong decisions. The Product
Passport concept (describe your product in plain English, no customs knowledge needed)
is the best idea in the plan. None of the issues below are fatal; all are fixable.

## 1. The moat claim is no longer true (HIGH - reposition now)
Appendix A says "no personalized SMB alert product found" with a caveat that web search
was unavailable. I ran the fresh search. Direct competitors now exist:
- **TariffDesk** (tariffdesk.com) - monitors your HTS codes, instant alerts on §301/§232/IEEPA changes, importer plans.
- **Tariff Sentinel** (tariffsentinel.com) - duty impact checker + source-linked email alerts per HTS code.
- **GingerControl "Compliance Radar"** (launched May 2026) - personalized closed-loop tariff alerts matched to your HTS codes with recommended actions.
- Plus comparison content (ustariffrates.com) reviewing "best tariff tracker tools" - a category page already exists, meaning a category already exists.

**What survives:** every competitor found is HTS-code-first (assumes the seller already
knows their codes and only cares about tariffs). Lunair's differentiation must be:
(a) the Passport - plain-English onboarding for sellers who do NOT know their HTS code;
(b) full agency requirements (CPSC/FDA/FCC/DOT), not just duty rates;
(c) dollar impact on YOUR import value; (d) the white-label partner tier.
**Action:** reposition marketing from "nobody does this" to "the only radar that speaks
seller, not broker". Do a 1-day teardown of those 3 products before writing landing copy.

## 2. The growth math does not reach the goal (HIGH - fix the model)
The plan's own numbers contradict each other. With 3,300 visitors/mo -> ~200 signups ->
~9 new paid/mo at 7% monthly churn, the subscriber base converges toward ~128 but gets
there asymptotically: after 12 months of constant 9/mo you hold roughly **75 paid subs
(~$3.5-3.7k MRR), not 126 subs / $6.2k MRR**. The M9-12 target quietly assumes the
steady state arrives immediately.

To actually hit ~126 paid by M12 you need one of:
- ~5,500-6,000 visitors/mo by mid-year (not 3,300), or
- free->paid ~7-8% (not 4-5%), or
- churn ~4% (annual plans + partner tier help most here).

**Action:** treat churn as the #1 lever (push annual at signup, not month 3; Lighthouse
partners churn less), set the traffic target at 6k/mo, and re-baseline the M6/M9
milestones. The $5k goal is still reachable - roughly a quarter later than planned.

## 3. The duty-stack problem is much harder than the plan admits (HIGH - engineering)
The example "7.5% + 25% §301 = 32.5%" is the pre-2025 world. In Aug 2026 the real
stack includes IEEPA reciprocal tariffs by country, fentanyl-related tariffs, §232
expansions, de minimis eliminated, and rates that change by executive order with days
of notice - sometimes reversed by litigation. Mechanically, most of these live as
**Chapter 99 HTS lines and footnotes**, not clean columns on the product's tariff line
(verified against the USITC data - see docs/data-access.md). Two consequences:
- The "diff the HTS revision" watcher alone will miss or misread stacked rates; the
  engine must resolve Ch. 99 references and country-of-origin conditions.
- A wrong total-rate number shown confidently is the fastest way to lose trust AND the
  most legally exposed output in the product.
**Action:** ship in two stages. Stage 1 (launch): event alerts from Federal Register +
CSMS (verified feeds) + "current rate per USITC, verify with your broker" display with
source links, dollar impact labeled as an estimate range. Stage 2 (post-launch): the
full stacked-rate calculator once fixtures cover Ch. 99. Do not gate launch on stage 2.

## 4. HTS code suggestion may be regulated activity (HIGH - lawyer, this week)
Providing HTS classification advice for compensation can fall under "customs business"
(19 CFR 111), which requires a customs broker license. The plan's lawyer checklist
covers ToS and entity but not this specific question, and it is the sharpest legal edge
in the product. Mitigations to design in now: show multiple candidate codes as
"codes commonly used for similar products", require the user to confirm their own code,
never present a single authoritative answer, keep the paid feature framed as monitoring
codes the USER selected. **Action: add this as question #1 for counsel.**

## 5. The confidence gate fights the latency KPI (MEDIUM - design decision)
Events with confidence <0.8 go to founder review and "never auto-send" - but Guy sleeps
during US business hours (Israel time) and the alert-latency KPI is <6h median. Options:
measure latency only on auto-sent (high-confidence) alerts; and/or send a neutral
holding alert ("a change affecting your category was published - we're reviewing it")
for low-confidence events. Also note the honest automation number during month 1-3 will
be closer to 90% than 98% while prompts are tuned - the plan's 45 min/wk assumes mature
AI triage from day one.

## 6. CSMS has no public feed (MEDIUM - verified, plan adjusted)
cbp.gov blocks non-browser fetchers (403) and the GovDelivery archive requires a
session. The watcher must ingest CSMS via a subscribed email inbox instead (reliable,
slightly delayed). Already recorded in docs/data-access.md. Not a blocker, but the plan
assumed a cleaner path.

## 7. $100/mo AI budget is thin (MEDIUM)
Passport autofill (image + listing analysis), an assistant bubble on every screen
including free users, hourly event classification, support drafts, and newsletter
generation will exceed $100/mo well before 1,000 users unless controlled. Actions:
per-user daily message caps on the assistant (generous for paid, tight for free),
Haiku-class models for classification and triage, aggressive caching of rule-library
answers, batch processing for weekly jobs. Budget $200-300/mo at M6 scale to be safe.

## 8. Optimistic marketing targets (LOW-MEDIUM - re-baseline, not a redesign)
- Newsletter: 2,000 subs by M6 from ~3k visitors/mo implies >10% visitor->subscriber
  every month; ≥45% opens is above industry norm for an acquired list. 1,000-1,200 subs
  and 38-42% opens are strong targets.
- Programmatic SEO: 2,000 auto-generated pages on a brand-new domain risks being
  ignored or flagged as thin content post-HCU. Roll out in batches of 100-200 with real
  live data per page and internal linking; expect meaningful organic traffic at M8-9,
  not M6.
- Kill criterion (free->paid <2% at M5) is good but late; add an earlier gate: if beta
  activation <60% or alert-usefulness <80% by end of M3, fix product before buying traffic.

## 9. Smaller gaps worth one line each (LOW)
- Email deliverability: send alerts from a subdomain (mail.lunair-world.com), set up
  SPF/DKIM/DMARC day one, warm up before the newsletter list grows - one spam-folder
  incident kills the "radar you can trust" promise.
- Telegram-first alerting is unusual for US sellers; treat email as primary, Telegram
  as power-user option (plan mostly does this, but the Passport "hook" step pushes
  Telegram - make email confirmation the default path).
- Stripe all-in cost will be ~3.6-4% (base + Billing + Tax per-transaction), not 3.2% - immaterial but fix the model.
- No backup/restore or data-retention line in the plan: enable Neon PITR, document restore in the runbook.
- Admin 2FA is specified but no mechanism named: passkey via Auth.js or TOTP; decide in Phase 3, item 12.
- "Lunair" trademark: knockout search is on the founder list - do it before spending on ads, aviation/lighting brands with similar names exist.

## Bottom line
The plan is unusually complete and the product thesis is sound, but it was written for
a market of zero competitors and a simpler tariff regime than Aug 2026 reality. Ship
the wedge the competitors don't have (Passport + agency requirements + partner tier),
re-baseline revenue one quarter later, and put the HTS-classification question in front
of counsel this week.
