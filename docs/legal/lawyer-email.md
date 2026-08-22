# Email to counsel - copy, paste, send

Attach: `docs/legal/tos-outline.md`. Everything the lawyer needs to quote a fee is in
the email itself.

---

**Subject:** New SaaS product under Wershuffle Inc - ToS, entity question, and one regulatory question (customs)

Hi [Name],

I'm launching a new software product under Wershuffle Inc and would like your help
getting it set up correctly before it goes public. I've attached an outline my team
prepared covering the terms of service and privacy points we think are needed - please
treat it as a starting point rather than a draft.

**What the product does.** It's called Lunair World (lunairworld.com). E-commerce
sellers who import physical goods into the US describe their product once in plain
English. We then show them which US import requirements appear to apply - duty rates,
agency rules like CPSC, FDA and FCC, labeling - and email them when any of it changes.
All of our source data is public US government publication: the Federal Register,
the USITC tariff schedule, CBP bulletins, and CPSC recall notices. Every item we show
links back to its official government source.

We are deliberately positioning this as an **informational monitoring service**, not
advice. We do not certify compliance, we do not tell users they are compliant, and
compliance checklists inside the product are self-declared by the user. We have banned
the words "guaranteed", "certified", "legal advice" and "we ensure compliance"
throughout the product and marketing.

Pricing is a monthly subscription, $0 to $199 per month, sold to US businesses through
Stripe under the existing Wershuffle Inc account.

**My questions, in priority order:**

1. **The one that worries me most.** Part of the product suggests likely HTS
   classification codes for a user's product, and paying users get alerts when duty
   rates for those codes change. Does suggesting classification codes for compensation
   risk being treated as "customs business" under 19 CFR 111, which would require a
   licensed customs broker? If there is any real risk, how should we present code
   suggestions to stay clearly on the informational side? Our current design shows two
   or three candidate codes described as "codes commonly used for similar products",
   requires the user to select and confirm their own code, and frames the paid feature
   as monitoring the codes the user chose. I'd like to know whether that's enough, and
   what language you'd want on that screen.

2. **Entity.** Should Lunair World run as a DBA / product line of Wershuffle Inc, or
   should I form a separate subsidiary LLC to isolate liability? Wershuffle's existing
   business is unrelated (music and marketing services). I'd like your recommendation
   and the rough cost of each path.

3. **Terms of Service and Privacy Policy.** Please draft or review both. The key
   protections I believe we need: a no-professional-advice clause, disclaimer of
   warranties (information may be incomplete, delayed, or wrong), liability capped at
   fees paid in the prior 12 months, exclusion of consequential damages such as seized
   cargo, penalties, storage fees and lost profits, user indemnification, and binding
   arbitration with a class-action waiver. Please confirm the arbitration clause is
   enforceable as drafted and advise on venue. Privacy needs to be CCPA/CPRA-ready; we
   collect email, business name, product descriptions and usage analytics, and we use
   Stripe, Resend, Anthropic, Sentry, PostHog and a US cloud host as subprocessors.

4. **Marketing claims.** Before launch I'd like you to look at the landing page and a
   sample of our weekly email newsletter against the same standard, so nothing in the
   copy undercuts the informational posture.

5. **Insurance.** Do you recommend tech E&O and cyber coverage at launch, or once
   revenue is real? Rough coverage limits for a product like this would help.

6. **Trademark.** I own the domain lunairworld.com. I'd like a knockout search on
   "Lunair" and "Lunair World" in classes 35 and 42 before I spend on advertising, and
   your view on whether to file now or after first revenue.

**Timing.** I'm building now and would like to launch publicly in roughly 8 to 10
weeks. The classification question in item 1 affects how I build one screen, so an
early read on that one - even informally - is more useful to me than a complete
package later. Could you let me know your availability and an estimate for the work?

Thank you,

Guy
Wershuffle Inc
guy@wershuffle.com

---

_Note: item 1 is the one that could change the product design, so if the lawyer offers
a quick call, spend it there._
