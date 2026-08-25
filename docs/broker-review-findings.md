# Broker accuracy review — what it changes

Source: `docs/broker-review-2026-08-25.pdf` (19 pages, received 25 Aug 2026), answering
`docs/broker-questions.md`. This file is the actionable extract; the PDF is the record.

**The reviewer's bottom line: "The current draft should not be published as written."**
The corrections below are launch-blocking for the rule library. They do not affect the
app's infrastructure, only the content it serves.

## The one structural finding

> HTS codes help identify the customs universe; **product attributes determine most
> product-safety obligations.**

Our `matchCategories()` already matches on attributes as well as HTS prefix, and the
reviewer explicitly endorses that ("cross-category logic is the right architecture").
The problem is our **attribute vocabulary is far too thin**: we have `audience`,
`has_battery`, `has_plug`, `powered_any`, `materials_any`. The review needs, at minimum,
age grade, intended user, marketing claims, accessible components, coatings, food/mouth
contact, battery chemistry and cell form, wireless function, dimensions, animal species,
and sales jurisdictions.

Also: **"a flat HTS-to-requirement list" is the wrong model** — requirements must be
modular, so one SKU can pull several independent modules.

## Schema changes needed (review §10)

Each requirement currently carries: id, agency, title, severity, plain_english,
source_url, self_check_hint, cfr, statute, conditions. The review says each needs:

| Field | Values / purpose |
|---|---|
| `authority_layer` | federal product safety, customs, transport, state, carrier, retailer, marketplace, insurance, voluntary — **so we stop presenting a retailer's UL demand as a federal entry condition** |
| `legal_status` | mandatory statute/regulation, incorporated consensus standard, guidance/enforcement policy, voluntary standard, contractual |
| `timing` | before manufacture, before import, at entry, before sale, at listing, ongoing, post-market |
| `evidence` | the artifact that proves it: test report, certificate, registration, permit, label artwork, technical file, supplier statement, filing data |
| `enforcement_effect` | transport rejection, CBP hold, detention/refusal, sale prohibition, recall, relabeling, audit, civil penalty, state notice, commercial rejection |
| `source_control` | primary URL + legal citation + **incorporated-standard edition** + source revision date + our review date + next recheck |
| `review_status` | confirmed, conditional, unresolved, specialist-review-required |

Severity also needs a fourth level, **`critical`**, above our current high: "likely to
stop, detain, refuse, or render a shipment non-transportable."

**Acceptance rule — do not mark any entry `confirmed` until we can state all six:**
(1) the product facts that trigger it, (2) legal authority and current version, (3) the
exact evidence required, (4) who creates or files that evidence, (5) when it must exist,
(6) what happens if it is missing.

## Corrections to the two categories we already ship

### toys_children

| # | Correction | Severity |
|---|---|---|
| 1 | **ADD the mandatory federal toy standard — entirely missing.** 16 CFR Part 1250 incorporating **ASTM F963-23** (current edition for products made on/after 20 Apr 2024). Must map *applicable sections*, not treat it as one universal test. Importers wrongly test only lead+phthalates and skip mechanical/physical hazards, magnets, cords, sound, projectiles, battery access, use-and-abuse. | Critical |
| 2 | **Rewrite the CPC line.** The **U.S. importer or domestic manufacturer issues the CPC** — the lab does not. Our text implies the lab certifies. Correct framing: "testing by a CPSC-accepted third-party laboratory *where a children's product safety rule requires it*." Add basis 15 U.S.C. 2063(a)(2) alongside 16 CFR 1110. Certificate must identify the product, each applicable rule, certifier, record custodian, manufacture and test dates/places, and each third-party lab. | Critical |
| 3 | **Split our merged lead entry into three rule objects**, each with its own trigger and test: (a) lead **paint / surface coatings** — 16 CFR 1303; (b) **total lead content** in accessible substrate/components — 15 U.S.C. 1278a; (c) **toy-standard soluble elements** — ASTM F963 where applicable. | Critical / High |
| 4 | **Narrow phthalates.** Not a blanket children's-product rule. Applies to children's **toys and child-care articles** with **accessible plasticized components**. Our `audience: kids` trigger is too broad. Watch for vinyl decals, grips, inks, artificial leather, tubing, flexible coatings. | Critical / High |
| 5 | Tracking label — **substantively correct** (our 15 U.S.C. 2063(a)(5) statutory cite was right). Add the required data fields and the "to the extent practicable" analysis. Note it is *distinct from* a CPC and is not listed as a rule on the CPC. | High / Medium |
| 6 | **GCC**: use the official name *General Certificate of Conformity*, and trigger it **by an applicable CPSC rule, never by HTS heading**. Do not build a blanket GCC rule for 9503–9505. | — |
| 7 | **CPSC certificate eFiling is already live** — mandatory since **8 July 2026**, i.e. in the past. Treat as a current import-data obligation, not a future note. | High |
| 8 | HTS 9503/9504/9505 are **screening headings only** — 9504 includes adult games, 9505 festive articles that may not be toys. Age grading, design, marketing, size, play value and themes decide. | — |

Additional CPSC trigger modules to add: small parts (16 CFR 1501), choking-hazard
warnings (1500.19/.20, 1500.121), electrically operated toys (1505), toy/imitation
firearms (1272), magnets (1262), art materials (1500.14(b)(8), LHAMA), **button-cell
(1263)**, durable infant/toddler products (product-specific parts).

### electronics_consumer

| # | Correction | Severity |
|---|---|---|
| 1 | **Split FCC into two entries. `powered_any` is not the legal trigger** — this contradicts our recent change. (a) **Intentional radiators** — deliberately emits RF (Wi-Fi, Bluetooth, cellular, RFID): 47 CFR Parts 2 **and 15**; most require **certification**, not SDoC. (b) **Unintentional radiators** — digital device with clock/microprocessor, no transmitter: 47 CFR Part 15 Subpart B / **15.101**; SDoC or certification per the authorization table. A passive non-digital powered product may be neither. | High / Medium |
| 2 | Add **other FCC scope checks**: Part 18 (industrial/scientific/medical RF), service-specific authorization, modular-approval conditions, FCC ID and labeling, user manuals, and the **U.S. responsible party under 47 CFR 2.909**. | High / Medium |
| 3 | **Replace the lithium line with a transport module.** Ours cites 49 CFR 173 broadly; it must center on **49 CFR 173.185** plus 49 CFR Parts 171–180, and **UN Manual of Tests and Criteria subsection 38.3** (a *design-type test*, not a shipping-compliance file). Cover classification, state of charge, quantity, packaging, marking, documentation, damaged/defective status, packed-with vs contained-in, and mode-specific air rules. | Critical |
| 4 | **ADD button-cell / coin-battery product safety — entirely missing and separate from transport.** **Reese's Law, 15 U.S.C. 2056e; 16 CFR Part 1263.** Secure battery compartments, use-and-abuse tests, warnings, packaging, and the applicable CPC or GCC path. | Critical / High |
| 5 | UL/ETL marks are **retailer/marketplace/insurer/local-code requirements — not federal entry conditions.** Must be labeled as a non-federal authority layer. | — |

### Cross-cutting

- **California Prop 65 and state chemical/children's-product laws are a state-market
  overlay, NOT a federal import-admissibility condition.** Keep as separate
  jurisdictional modules. Common enough to include commercially.
- **No universal federal cadmium limit for all jewelry** exists. ASTM F2923 is useful for
  children's jewelry but is not a universal mandatory federal rule.
- We must not claim our "most common mistakes" ordering is statistically complete unless
  backed by agency data or a named reviewer's documented experience.

## Recommended launch modules, in the reviewer's priority order

1. General textile apparel · 2. Children's sleepwear · 3. Cosmetics · 4. Food-contact
kitchenware · 5. Composite-wood furniture · 6. Upholstered furniture & mattresses ·
7. Children's jewelry · 8. Pet food & edible chews · 9. Ordinary pet accessories

Categories the reviewer says **must be split, not shipped whole**: apparel (separate
footwear), furniture (upholstered / mattresses / composite wood / clothing storage),
jewelry (children's / adult / precious-metal claims / state overlays), pet products
(consumables / animal-derived / pesticidal-or-drug / ordinary accessories).

Kitchenware carries an explicit prohibition: **do not publish a universal "FDA food-grade
certificate required" line** — compliance turns on each substance's authorization route
(21 CFR 174–186 regulation, effective FCN, GRAS, prior sanction) for the intended use.

## Why eCFR watching alone is not enough

Our daily eCFR watcher is necessary but incomplete. The library also needs monitoring of:
U.S. Code (statutory duties with no CFR part — tracking labels, parts of MoCRA);
**incorporated standards including ASTM editions** (the CFR names the standard without
reproducing it); FDA guidance, compliance policy guides, import alerts and effective
FCNs; CPSC rule pages, recalls and effective-date changes such as certificate eFiling;
APHIS country/species/process matrices; and state regulations including Prop 65.

## Where a human specialist stays required

Licensed customs broker / customs counsel (HTS classification, AD/CVD, origin, entry
strategy, ACE facts, CBP rulings) · CPSC-accepted or accredited lab (sampling plans,
component testing, age-grade protocol, use-and-abuse) · FCC-recognized lab / TCB (radio
test plans, grant scope, permissive change, module-host integration) · toxicologist or
Prop 65 counsel · FDA/food-contact specialist · attorney (formal opinions, enforcement
disputes, contested scope).
