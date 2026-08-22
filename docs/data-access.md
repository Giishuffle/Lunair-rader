# Data access — verify before coding (fill this in during Phase 1–2)

Rule: never code against an assumed feed. Verify each source empirically, record findings
here, and only then build its adapter.

## Sources to verify

### 1. Federal Register API (primary)
- Base: https://www.federalregister.gov/api/v1 — free, no API key (confirmed Aug 2026).
- Verify: filtering by agencies (USTR, CBP, Commerce/ITA, CPSC, FDA, FCC) and document
  types (RULE, PRORULE, NOTICE, PRESDOCU); pagination; rate limits; full-text availability.
- Findings: _(fill in)_

### 2. USITC Harmonized Tariff Schedule
- https://hts.usitc.gov — site offers revision downloads (JSON/CSV export expected; the
  site is a JS app, so confirm the export endpoint from the network tab or docs).
- Verify: download format, revision cadence, how §301/IEEPA columns appear, diffability.
- Findings: _(fill in)_

### 3. CBP CSMS bulletins
- https://www.cbp.gov/trade/automated/cargo-systems-messaging-service — bulletins via
  GovDelivery. Verify: RSS/JSON feed availability vs email-only; message numbering; volume.
- Findings: _(fill in)_

### 4. Secondary confirmation (optional)
- Reed Smith Trade Compliance Resource Hub (RSS available), ST&R Trade Report.
- Use only as confirmation signals, never as quoted sources in alerts.
- Findings: _(fill in)_

## Fallback policy
If a feed degrades: source_health flags it, dependent alerts pause with an in-app
"data delayed" notice (never send stale/false alerts), owner is pinged. Commercial fallback
(e.g., a licensed tariff-data API) is a founder decision at >$1k MRR.
