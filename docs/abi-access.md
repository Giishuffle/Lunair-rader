# Getting the PGA data: buy it, or go direct to CBP

_Researched 23 Aug 2026. Eligibility text pulled from eCFR directly - 19 CFR Part 143
Subpart A, current as of 2026-08-01._

There are two routes to the HTS→agency mapping. They are not exclusive and the second
one is free to explore.

---

## Route A: buy it from a vendor

### Descartes CustomsInfo - the $750 figure
- **Where:** `customsinfo.com` → "Request a demo". US phone 1-877-328-7866.
- **What to ask for:** the catalog line **"US HTS with ABI PGA Codes"**, plus
  "U.S. PGA (OGA) Codes" on CustomsInfo Reference. Naming the exact SKU shortcuts a
  lot of discovery.
- **Price caveat:** $750/user/month is **Capterra's reported starting price, not a
  Descartes-published one.** Their own catalog carries no line-item prices at all -
  every module reads "call your client manager". Treat $750 as the entry tier for the
  self-serve product, not as the price of a data feed we can redistribute.

### KYG Trade - better first call, because the price is public
- **Where:** `kygtrade.com/pricing` - **$825/month** for 5,000 classifications
  (also $1,650 / $4,584 / $18,334 tiers). A separate platform fee applies.
- **Why call them first:** they are the only vendor found that explicitly lists
  **PGA flags and admissibility** as returned fields, and the only one with published
  pricing. Demo-gated, so confirm the field list before believing it.

### The question that decides everything, ask it first
> "We are a SaaS product. Our end users - third-party sellers - would see this data in
> our interface. Does your standard licence permit that, or do we need redistribution
> or OEM terms, and what does that cost?"

Almost every trade-content licence covers **internal compliance use by the licensee**.
A product that surfaces the data to other companies is a different, materially pricier
licence class. This disqualifies options faster than price does - ask before you demo.

---

## Route B: get ABI access ourselves

The mapping is CBP's own data and it is free. Access is the gate, not cost.

### Who is allowed - 19 CFR 143.1(a), verbatim structure

ABI participants for entry and entry-summary purposes may be:

1. **Customs brokers** as defined in 19 CFR 111.1 - requires passing the broker licence
   exam. Slow, but it also solves the review problem permanently.
2. **Importers** as defined in 19 CFR 101.1 - a company that actually imports goods.
   Wershuffle does not, so this door is closed unless that changes.
3. **ABI service bureaus** - "an individual, partnership, association or corporation
   which provides communications facilities and data processing services for brokers
   and importers, but which does not engage in the conduct of customs business."

**Category 3 is the closest description of what Lunair actually is**, and it is
explicitly for companies that serve brokers and importers *without* doing customs
business themselves - which is exactly the posture our legal position depends on.

There is also **143.1(c)**: "Upon approval by CBP, any party may participate in ABI for
other purposes" - a discretionary catch-all worth raising in the conversation.

**The honest caveat:** a service bureau normally participates in order to *transmit*
entries on behalf of clients, and qualification testing is reportedly done with real
entry-summary filings. Whether CBP will admit a participant who only wants to *receive*
the reference file is exactly the question to put to them. I could not find a published
answer either way.

### The process - 19 CFR 143.2

1. **Send a Letter of Intent** to the port director nearest our principal office, copy
   to the Assistant Commissioner, Information and Technology. It must commit to
   developing and adhering to ABI performance and operational standards, and describe:
   the hardware, communications and processing systems we will use; expected
   completion date; office locations; and principal management contacts.
2. **CBP assigns a Client Representative** - a named technical advisor, at no cost, who
   guides development, testing and implementation. **This person is the point of the
   exercise.** They will say plainly whether our use case qualifies.
3. **Qualification testing**, minimum 10 days.
4. Approval by the Assistant Commissioner, subject to a fitness review covering the
   accuracy of the letter, business integrity, and character and reputation.

**There is no application fee.** The cost is engineering time and the testing period.

### Why this is worth doing even if it fails

Sending the Letter of Intent costs a stamp and an afternoon. The worst outcome is a
client representative telling us we do not qualify - and we would learn that from CBP
rather than from a vendor with an interest in the answer. The best outcome is free,
authoritative, first-party data and a permanent structural advantage over every
competitor paying Descartes for it.

## Recommended sequence

1. **Call KYG Trade** - published price, explicit PGA claim. Lead with the
   redistribution question.
2. **Call Descartes**, naming "US HTS with ABI PGA Codes". Same question first.
3. **Send the ABI Letter of Intent in parallel.** Free, and the client representative
   is the only authoritative source on whether Route B is open to us.
4. **Ask the broker** (the $495 session) which route they would take, and whether they
   would consider being our ABI partner. A broker who already has the connection can
   often supply the reference file far more cheaply than a data vendor.
