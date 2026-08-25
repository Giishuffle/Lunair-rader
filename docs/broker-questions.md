# Broker review — written questionnaire

Send this instead of booking the USA Customs Clearance 45-minute session. A written
questionnaire gets a more careful, referenceable answer than a live call, costs the same
or less (it's still "an accuracy review with written comments," not "classification"),
and gives us something we can diff against our JSON files line by line.

Pair this with the engagement framing already in `docs/broker-engagement.md` §"The scope
to send" — that email gets the relationship and the price right; this document is the
actual content to attach once they've agreed to the scope.

---

## Email to send (attach the two sections below as a doc)

> Subject: Written accuracy review — import-requirements library (no attribution, capped fee)
>
> Hi [name],
>
> We'd like a written review rather than a live session, since we want your comments
> captured against specific line items we can check off. Two parts, both attached:
>
> **Part A** — 3 requirements we've already drafted, for you to confirm or correct.
> **Part B** — 6 product categories we haven't drafted yet; we'd like your read on what
> actually applies to each, so we can write it accurately the first time.
>
> No need to check every CFR citation yourself if that's not billable at this fee — flag
> anything that looks wrong and we'll verify the exact part/section ourselves against the
> live eCFR. What we most need from you is domain judgment: what's missing, what's
> overstated, and what real importers get wrong.
>
> Written comments back in whatever format is easiest — marked-up copy of this doc,
> a call to walk through your notes, whatever works. Capped fixed fee, as discussed.

---

## Part A — Verify what we already have

For each line: **Correct as stated? / Needs a correction (what)? / Missing anything for
this category?**

### Toys & children's products (HTS 9503, 9504, 9505)

| Requirement | Agency | Basis as we have it |
|---|---|---|
| Children's Product Certificate (CPC), backed by CPSC-lab testing | CPSC | 16 CFR 1110 |
| Lead & phthalates limits | CPSC | 16 CFR 1303 (lead paint), 16 CFR 1307 (phthalates), 15 U.S.C. 1278a |
| Tracking label on product & packaging | CPSC | 15 U.S.C. 2063(a)(5) (statutory, no CFR part) |

Specific questions:
- Is there a CPSC General Conformity Certificate (GCC) requirement we're missing for any
  non-children's-but-still-CPSC-regulated items in this HTS range?
- Any state-level requirement (e.g. California Prop 65) common enough to belong here?

### Consumer electronics & accessories (HTS 8471, 8504, 8517, 8518, 8543, 9405)

| Requirement | Agency | Basis as we have it |
|---|---|---|
| FCC equipment authorization (SDoC or full certification) for anything that transmits, powered | FCC | 47 CFR Part 2 |
| Lithium battery shipping rules (UN38.3) | DOT/PHMSA | 49 CFR 173 |

Specific questions:
- Do we need an FCC Part 15 (unintentional radiator) callout distinct from the Part 2
  authorization line, for devices with no transmitter but a clock/microprocessor?
- Anything from CPSC here too (e.g. a powered nightlight, HTS 9405, is both electronics
  and potentially a children's product) — is our cross-category logic (see Part B intro)
  the right way to think about that overlap?

---

## Part B — Help us draft categories we haven't built yet

We're picking the next 5–6 categories to launch with, chosen for volume among US
e-commerce importers sourcing from China/Vietnam/India. For each, we need:

1. **The requirements that actually apply** — agency, plain-English description, and (if
   you know it) the CFR title/part or US Code section that creates the obligation.
2. **What triggers it** — e.g. "only if it touches food," "only if battery-powered,"
   "only for children's sizing."
3. **What sellers most commonly get wrong** — this is the part software can't source from
   a regulation text; it's the reason we're paying for a human review at all.
4. **Severity** — would getting this wrong actually stop a shipment at the port, or is it
   a paperwork gap that surfaces later (recall, audit, fine)?

Candidate categories (open to your input if a different 6 would be higher-value):

- **Apparel & footwear** (textiles, care labeling, flammability for children's sleepwear)
- **Cosmetics & personal care** (FDA — ingredient labeling, banned substances, MoCRA
  facility registration if applicable)
- **Kitchenware & food-contact items** (FDA food-contact substance rules, lead/cadmium in
  ceramics/glassware)
- **Furniture & home furnishings** (flammability standards, formaldehyde/CARB for
  composite wood, TSCA Title VI)
- **Jewelry & fashion accessories** (CPSC lead/cadmium limits, especially children's
  jewelry; FTC precious-metal marking rules)
- **Pet products** (APHIS/USDA for certain materials, CPSC where a product could reach a
  child, FDA if it's a consumable)

If any of these is clearly out of your expertise, say so rather than guessing — we'd
rather drop a category than launch it wrong.

---

## What we'll do with the answers

Your Part A corrections go straight into the existing JSON files
(`packages/rules/rules/*.json`). Your Part B answers become new category files in the
same format — before anything ships, every CFR/USC citation you or we identify gets
checked against the live eCFR API (`packages/core/src/sources/ecfr.ts`) so a plausible
but wrong part number never reaches a user; we already caught one of these ourselves
(16 CFR 1130 miscited for a statutory requirement) so we know this step matters.
