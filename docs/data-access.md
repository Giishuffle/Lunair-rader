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
- Findings (partially verified 2026-08-22): `GET https://hts.usitc.gov/reststop/search?keyword=9503`
  WORKS - returns JSON array of tariff lines (`htsno`, `description`, `indent`,
  `footnotes`, `units`, rate fields). The `reststop/exportList` endpoint returned
  HTTP 400 with every param combination tried; before building the diff watcher,
  capture the real export request from the site's network tab (likely different param
  names or a POST). Fallback: full revision CSV/JSON downloads from the site UI.
  IMPORTANT: §301/IEEPA/§232 rates largely live in Chapter 99 lines and footnotes,
  not as clean columns on the base line - the duty-stack math must resolve Ch. 99
  references (see docs/plan-critique.md #3).

### 3. CBP CSMS bulletins
- https://www.cbp.gov/trade/automated/cargo-systems-messaging-service — bulletins via
  GovDelivery. Verify: RSS/JSON feed availability vs email-only; message numbering; volume.
- Findings (verified 2026-08-22): NO public machine feed. cbp.gov returns 403 to
  non-browser fetchers (Akamai bot protection); the GovDelivery bulletin archive
  (content.govdelivery.com/accounts/USDHSCBP/bulletins) requires a session (302 -> login).
  PLAN: subscribe a dedicated inbox (e.g. csms@lunairworld.com via Resend inbound or
  an IMAP mailbox) to the CSMS GovDelivery email list and parse bulletins from email.
  Alternative to test in Phase 2: fetching cbp.gov with a realistic browser UA from a
  residential-quality IP, but email ingestion is the reliable path.

### 4. Secondary confirmation (optional)
- Reed Smith Trade Compliance Resource Hub (RSS available), ST&R Trade Report.
- Use only as confirmation signals, never as quoted sources in alerts.
- Findings: _(fill in)_

## Fallback policy
If a feed degrades: source_health flags it, dependent alerts pause with an in-app
"data delayed" notice (never send stale/false alerts), owner is pinged. Commercial fallback
(e.g., a licensed tariff-data API) is a founder decision at >$1k MRR.
