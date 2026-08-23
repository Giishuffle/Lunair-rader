# Data access — verify before coding (fill this in during Phase 1–2)

Rule: never code against an assumed feed. Verify each source empirically, record findings
here, and only then build its adapter.

## Sources to verify

### 1. Federal Register API (primary)
- Base: https://www.federalregister.gov/api/v1 — free, no API key (confirmed Aug 2026).
- Verify: filtering by agencies (USTR, CBP, Commerce/ITA, CPSC, FDA, FCC) and document
  types (RULE, PRORULE, NOTICE, PRESDOCU); pagination; rate limits; full-text availability.
- Findings (verified 2026-08-22, Claude Code): WORKING. `GET /documents.json` with
  `conditions[agencies][]=u-s-customs-and-border-protection&conditions[type][]=RULE`
  returns JSON with `count`, `total_pages`, `next_page_url` and per-doc fields:
  `document_number`, `title`, `type`, `abstract`, `html_url`, `pdf_url`,
  `publication_date`, `agencies[]`. No `raw_text_url` in default fieldset (request via
  `fields[]` if needed). No auth. Adapter implemented:
  `apps/worker/src/sources/federalRegister.ts` (hourly poll, 1s pacing between pages).

### 2. USITC Harmonized Tariff Schedule
- https://hts.usitc.gov — site offers revision downloads (JSON/CSV export expected; the
  site is a JS app, so confirm the export endpoint from the network tab or docs).
- Verify: download format, revision cadence, how §301/IEEPA columns appear, diffability.
- Findings (SOLVED 2026-08-22): `GET https://hts.usitc.gov/reststop/exportList?format=JSON&from=9503&to=9504&styles=false`
  WORKS - the **`styles=false` param is required**; without it the endpoint returns 400.
  Returns full JSON tariff lines: `htsno`, `indent`, `description`, `general`,
  `special`, `other`, `footnotes`. Adapter built (`apps/worker/src/sources/usitcHts.ts`):
  hash-dedup snapshots per range + pure diff engine, daily. Watched ranges include
  Chapter 99 (9903) where §301/IEEPA/§232 additional duties live.
  `reststop/search?keyword=...` also works (for Phase 1 HTS suggestion lookups).
  IMPORTANT: §301/IEEPA/§232 rates largely live in Chapter 99 lines and footnotes,
  not as clean columns on the base line - the duty-stack math must resolve Ch. 99
  references (see docs/plan-critique.md #3).

### 3. CBP CSMS bulletins
- https://www.cbp.gov/trade/automated/cargo-systems-messaging-service — bulletins via
  GovDelivery. Verify: RSS/JSON feed availability vs email-only; message numbering; volume.
- Findings (verified 2026-08-22, extended): NO public machine feed. cbp.gov returns
  403 to non-browser fetchers but **200 with a realistic Chrome user-agent** (usable
  for full-text fetches). The GovDelivery bulletin archive requires a session
  (302 -> login). CBP publishes **monthly CSMS archive PDFs** (e.g.
  /sites/default/files/2026-08/26_0813_csms_archive_incl_july.pdf) - good for
  backfill only, too slow for <6h alerts.
  PLAN: subscribe a dedicated inbox (csms@lunair-world.com via Resend inbound) to the
  GovDelivery email list (signup: public.govdelivery.com/accounts/USDHSCBP/subscriber/new)
  and parse bulletins from email in near-real-time; browser-UA fetch for full text;
  archive PDFs for historical backfill.

### 4. Secondary confirmation (optional)
- Reed Smith Trade Compliance Resource Hub (RSS available), ST&R Trade Report.
- Use only as confirmation signals, never as quoted sources in alerts.
- Findings: _(fill in)_

## Fallback policy
If a feed degrades: source_health flags it, dependent alerts pause with an in-app
"data delayed" notice (never send stale/false alerts), owner is pinged. Commercial fallback
(e.g., a licensed tariff-data API) is a founder decision at >$1k MRR.
