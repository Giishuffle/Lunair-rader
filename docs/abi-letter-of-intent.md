# ABI Letter of Intent - ready to send

**Recommendation: apply under 19 CFR 143.1(c) ("other purposes"), naming the service
bureau category as an alternative.** Reasoning is at the bottom.

## What I need from you before this can go out

| # | Item | Why |
|---|---|---|
| 1 | **Wershuffle Inc's principal US office address** | 143.2 requires the letter go to the port director *closest to the principal office*. I cannot pick the right port without it. Send it and I will look up the correct port director and address |
| 2 | **Signatory name and title** | e.g. "Guy [surname], President". Must be someone who can commit the company |
| 3 | **Direct phone number and email for the contact person** | Required by 143.2(c). The CBP client representative calls this |
| 4 | **State of incorporation** | Also fills the gap in the Terms of Service |
| 5 | **Whether "Lunair World" is a registered DBA of Wershuffle Inc** | Determines whether the letter says "Wershuffle Inc" alone or "Wershuffle Inc d/b/a Lunair World" |

Send those five and I will produce the final letter with the correct port director,
ready to sign and post.

---

## The letter

> [WERSHUFFLE INC LETTERHEAD]
>
> [DATE]
>
> Port Director
> U.S. Customs and Border Protection
> [PORT ADDRESS - I will fill this in once I have your office address]
>
> **Copy to:** Assistant Commissioner, Office of Information and Technology
> U.S. Customs and Border Protection
> 1300 Pennsylvania Avenue NW
> Washington, DC 20229
>
> **Re: Letter of Intent to participate in the Automated Broker Interface**
> **19 CFR 143.2 — application under 19 CFR 143.1(c)**
>
> Dear Port Director,
>
> Wershuffle Inc [d/b/a Lunair World], a [STATE] corporation with its principal office
> at [ADDRESS], submits this letter of intent to participate in the Automated Broker
> Interface.
>
> **Purpose of participation.** I want to be precise about what we are asking for,
> because it differs from a typical application. We are **not** seeking to transmit
> entry or entry summary data, and we do not conduct customs business as defined in
> 19 CFR 111.1. We are seeking **receive-only access to CBP reference data** —
> specifically the Harmonized Tariff Schedule extract described in the ACE ABI CATAIR,
> including the Other Government Agency codes carried on tariff records.
>
> We therefore apply under **19 CFR 143.1(c)**, which permits participation for other
> purposes upon approval by CBP. If CBP considers our activity better described by
> **19 CFR 143.1(a)(3)** — a corporation providing data processing services for
> importers without engaging in the conduct of customs business — we would be glad to
> be considered under that category instead, and we would welcome your guidance on
> which is correct.
>
> **What we do.** Wershuffle Inc operates an informational service for small
> United States importers, principally e-commerce sellers. A seller describes a
> product in plain language; we show which federal import requirements appear to
> relate to that product, each linked to its official government source, and we notify
> them when the underlying public information changes. We do not file entries, do not
> act as an agent for any importer before CBP, do not certify compliance, and direct
> every user to a licensed customs broker for decisions. Our sources today are
> published government data: the Federal Register API, the USITC Harmonized Tariff
> Schedule, CBP's public rulings database, CPSC recall notices, and the eCFR.
>
> Accurate agency-flag data would materially improve the quality of the information we
> give small importers, and would reduce both the over-warning and the omissions that
> come from working without it.
>
> **Commitment.** Wershuffle Inc commits to develop, maintain and adhere to the
> performance requirements and operational standards of the ABI system, so as to
> ensure the validity, integrity and confidentiality of data transmitted, in
> accordance with 19 CFR 143.2 and the standards in 19 CFR 143.5.
>
> The information required by 19 CFR 143.2 follows, as applicable to a receive-only
> participant.
>
> **(a) Systems and timing.** Our systems run on managed cloud infrastructure in the
> United States, on a Linux platform with a PostgreSQL database and Node.js
> application services, secured with TLS in transit and access controls at rest. We
> would develop the ABI interface against the published CATAIR specifications. We
> estimate ninety days from the assignment of a client representative to completion of
> programming and readiness for testing, and we can move faster if that is useful.
>
> **(b) Office locations.** Wershuffle Inc operates from a single principal office at
> the address above. There are no additional locations to list.
>
> **(c) Principal management and system contact.** [NAME], [TITLE], is the principal
> officer and the contact person regarding the system. Telephone [PHONE], email
> [EMAIL].
>
> **(d) Data processing company.** None. The system is developed and maintained
> in-house.
>
> **(e) Software vendor.** None. We would self-develop against the CATAIR
> specifications rather than use an approved vendor's application, though we would
> consider a vendor if CBP recommends it for a participant of our type.
>
> **(f) Entry filer code and volume.** Not applicable. We hold no entry filer code and
> file no entries, and we are not seeking to. We would apply for a filer code only if
> CBP advises that one is required for the receive-only access described above.
>
> We recognise that our request is unusual, and that CBP may conclude the data we seek
> is not available on the basis we have described. If so, we would be grateful to be
> told plainly, and to be pointed toward the correct route — including whether a
> licensed customs broker partner would be the appropriate channel.
>
> Thank you for your consideration. I am available at [PHONE] or [EMAIL].
>
> Sincerely,
>
> [NAME]
> [TITLE], Wershuffle Inc

---

## Why 143.1(c) rather than claiming service bureau status

The three doors in 143.1(a) are customs broker, importer, and ABI service bureau. We
are none of them today, and the honest reading matters here for a practical reason:
**19 CFR 143.3 provides that an application may be investigated, and the investigation
expressly includes "the accuracy of the information provided in the letter of intent."**

A letter claiming service bureau status would be describing an activity we do not
perform - service bureaus provide processing facilities so that brokers and importers
can transmit. Overstating that is the one thing likely to sink an application that
might otherwise have been helped along.

143.1(c) exists precisely for participation that does not fit the standard categories,
and it is decided by CBP on approval rather than by self-classification. Applying there
and inviting CBP to re-categorise us costs nothing and keeps the letter accurate.

**The realistic outcomes, in order of likelihood:**

1. The client representative says receive-only reference access is not something ABI
   provides, and points us at a broker or an approved vendor. **Useful** - it closes
   the question authoritatively and tells us what to ask the broker for.
2. CBP treats it as a 143.1(c) case and grants limited access. **Excellent** - free
   first-party data and a structural advantage.
3. CBP suggests we qualify as a service bureau once we have broker or importer clients
   - which the Lighthouse partner tier would eventually give us. **Useful** - it turns
   this into a roadmap item with a known unlock condition.

All three are worth an afternoon and a stamp. The one outcome we cannot get by any
other means is a straight answer from CBP itself.
