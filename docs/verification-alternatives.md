# Verifying the rule library without (only) a broker

_Researched 23 Aug 2026. The question: can data replace paying a licensed customs
broker to check our requirement content?_

**Short answer: data can replace a large part of it, but not all of it.** Below is
what actually exists, verified, ranked by value.

---

## 1. CBP's PGA flag system - the authoritative answer, partly public

CBP's ACE system already encodes what we are trying to hand-write: for each tariff
code, which partner government agencies (FDA, CPSC, EPA, DOT, FCC…) require data at
entry, and whether that requirement is mandatory or conditional.

**What is public (verified, downloaded, parsed):**

- **ACE Agency Tariff Code Reference** - the *flag dictionary*.
  https://www.cbp.gov/document/guidance/agency-tariff-code-agency-program-cross-reference
  → `ace_agency_tariff_codes_04march2026_0.pdf`, 6 pages, updated March 2026.
  Defines every flag: `FD2` = FDA data **required** under 801(a); `EP1` = EPA ozone
  data **may be** required; `DT2` = NHTSA HS-7 **required**; and so on, each with its
  agency code, program code, and an R (required) / M (may be required) marker.
  **This gives us the vocabulary and the required-vs-conditional distinction.**
- **PGA Flag Enforcement Table** (July 2026) - which flags are actually enforced, by
  entry type. https://www.cbp.gov/document/guidance/pga-flag-enforcement-table
- **ACE CATAIR Appendix PGA** - the per-agency data elements behind each flag.
  https://www.cbp.gov/document/guidance/ace-appendix-pga

**What is not public in bulk:** the **per-HTS-code flag assignment** itself. That
lives inside ACE and is distributed to ABI filers (licensed brokers and self-filers)
through the ACE HTS reference file. AESTIR Appendix X is export-side and narrative,
not an import mapping - checked, not useful to us.

**So:** the mapping we most want exists, is authoritative, and is machine-readable -
but reaching it means being an ACE filer or licensing it from someone who is. That is
the single strongest argument for a data vendor, and it is a *better* argument than
"we need someone to check our writing".

All CBP pages return 403 to plain fetchers; a realistic browser user-agent works.

## 2. eCFR API - the primary law, free, current

`https://www.ecfr.gov/api/versioner/v1/` - **verified working, no key.**
Returns the full structure and text of the Code of Federal Regulations, with
`up_to_date_as_of` dates (checked 2026-08-20, three days old).

The titles that matter to us: **16** (CPSC), **21** (FDA), **47** (FCC),
**49** (DOT/PHMSA), **19** (Customs).

This is the actual law rather than someone's summary. It does not tell us *which rule
applies to which product* - that is the judgment we are missing - but it does let us:
- quote and cite primary text instead of paraphrasing a website;
- detect when a regulation we cite has been amended;
- ground every requirement in a citation a broker or lawyer can check quickly, which
  makes any review we do buy dramatically cheaper and faster.

## 3. CPSC's own small-business tools

CPSC publishes a "Regulatory Robot" aimed at exactly our users - a free walkthrough
that tells a small business which CPSC requirements apply to their product. Its page
blocks automated fetching (403), so it needs a browser to evaluate.

**Worth doing:** run our own demo products through it and compare its output with
ours. It is a free, government-authored answer key for the CPSC slice of the library.
It does not cover FDA, FCC or DOT.

## 4. What data still cannot buy

Two things no dataset resolves:

1. **Completeness by omission.** A vendor feed tells us what is flagged. It does not
   tell us that our plain-English explanation of a rule is misleading, or that we have
   framed a conditional requirement as an absolute one.
2. **The judgment call at the edges.** Whether a particular product *is* a "children's
   product" under CPSIA is a legal test, not a lookup. Our night-light case - a lamp by
   tariff code, a children's product in substance - is exactly this, and no flag file
   would have caught it.

## Recommendation

Do both, in this order, because they are cheap and complementary:

1. **Wire in the eCFR API** so every requirement carries a primary-law citation with an
   amendment date. Free, and it makes everything downstream more defensible.
2. **Run the demo products through CPSC's Regulatory Robot** and diff the results
   against our library. Free answer key for one agency.
3. **Buy one $495 broker session** - but with a much sharper brief than before. Not
   "please check our content", which is open-ended and expensive, but "here are eight
   products, here is what we say about each, here are the CFR citations - where are we
   wrong, and what have we missed?" Grounded questions get grounded answers in less time.
4. **Price a PGA data feed** from a vendor once volume justifies it. That replaces the
   hand-written mapping permanently, which the broker session never will.

---

# Commercial vendors - researched 23 Aug 2026

**Headline: there is no SMB-priced US requirement feed on the market.** Every vendor
holding the content we want sells enterprise, contact-sales only. This makes the free
government path more important, not less.

_Caveat: the research hit search-engine rate limits and several review sites blocked
automated access, so absence of a published price below means "not found", not
"does not exist"._

| Vendor | Relevant content | API | Price |
|---|---|---|---|
| **Descartes Visual Compliance / MK Data Services** | The closest match found: ECCN, USML, Schedule B, export-licence determination, denied-party screening. Feeds into SAP/Oracle | Integration-led, no public docs found | Contact sales |
| **MIC Global Trade Content Service** | Tariffs, exchange rates, export-control lists, some licensing flags. Largely **EU-oriented**; resells Mendel Verlag, PST.AG, Kharon, Dow Jones | None public | Contact sales |
| **AEB Intelligence** | Classification + sanctions screening, EU dual-use. Content from Reguvis and Dow Jones | **Public developer docs** (customer-gated) | Contact sales |
| **Customs4trade CAS** | Classification is a platform *feature*, not a licensable dataset | **Public API docs** | Pricing page 404s |
| **Livingston TradeSphere** | No licensable data product - content is an input to their own services | None found | Contact sales |
| **Tradebeam Global Trade Content** | Existed to ~2020; the brand is now "TradeBeam AI", an inventory product with no trade content at all | - | Discontinued |

Three of the six are EU-first, which makes them a poor fit for a US-import product.

## The one genuinely useful finding: shipment manifest data

**ImportGenius** (legal name Trade Data Services) sells searchable **US customs
manifest records** - who imported what, from where, under which tariff code.
Self-serve and affordable, with real published pricing:

- $229/mo single seat (12 months of data), $183/mo billed annually
- $449/mo Pro, $359/mo billed annually, 150,000 rows, data back to 2006
- REST API on the Enterprise tier ($1,999/mo) or as a Business/Pro add-on

This is **not** requirement data - it is shipment flows. But it answers a question we
currently cannot: *what tariff code do real importers actually declare for a product
like this?*

That is empirical validation of our classification suggestions, from actual filed
entries rather than our reading of CBP rulings. Where CROSS gives us published
precedent, manifests give us observed practice - and where the two agree, our
confidence is genuinely earned rather than asserted.

**Worth a one-month $229 trial** once we have real products in the system: check our
top code suggestion against what comparable shipments actually declared, and use any
disagreement as the agenda for the broker session.

## Revised recommendation

Unchanged in shape, sharper in detail:

1. **eCFR citations** - free, do it first.
2. **CPSC Regulatory Robot cross-check** - free answer key for one agency.
3. **One $495 broker session** with a grounded brief.
4. **ImportGenius, one month, $229** - validate classifications against observed
   filings. Cancel after if it does not earn its place.
5. **Enterprise PGA feeds: revisit at real revenue.** Nobody in that tier will quote a
   sensible price to a pre-launch company, and their content skews EU anyway.
