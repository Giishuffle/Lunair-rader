# Email to counsel - copy, paste, send

Self-contained: every question is in the email body. `docs/legal/tos-outline.md` is
optional supporting detail if the lawyer wants our draft structure.

---

**Subject:** New SaaS product under Wershuffle Inc - regulatory question, entity, ToS and privacy

Hi [Name],

I'm launching a new software product under Wershuffle Inc and would like your help
getting it set up correctly before it goes public. Below is what the product does,
followed by my questions grouped by area. If you'd rather scope this in stages,
**sections A, B and C are what actually block launch** - the rest can follow.

## What the product does

It's called Lunair World (lunairworld.com). E-commerce sellers who import physical
goods into the US describe their product once in plain English. We then show them which
US import requirements appear to apply - duty rates, agency rules such as CPSC, FDA and
FCC, labeling - and we email them when any of it changes.

All source data is public US government publication: the Federal Register, the USITC
tariff schedule, CBP bulletins, and CPSC recall notices. Every item we display links
back to its official government source.

We are deliberately positioning this as an **informational monitoring service**, not
advice. We do not certify compliance, we never tell a user they are compliant, and
compliance checklists inside the product are self-declared by the user. We have banned
the words "guaranteed", "certified", "legal advice" and "we ensure compliance"
throughout the product and marketing.

Customers are US businesses. Pricing is a monthly or annual subscription from $0 to
$199 per month, sold through Stripe under the existing Wershuffle Inc account.

---

## A. The regulatory question I'm most worried about

**A1.** Part of the product suggests likely HTS classification codes for a user's
product, and paying users get alerts when duty rates for those codes change. Does
suggesting classification codes for compensation risk being treated as "customs
business" under 19 CFR 111, which would require a licensed customs broker?

**A2.** If there is real risk there, how should we present code suggestions to stay
clearly informational? Our current design shows two or three candidate codes described
as "codes commonly used for similar products", requires the user to select and confirm
their own code, and frames the paid feature as monitoring the codes the user chose. Is
that enough, and what exact language would you want on that screen?

**A3.** Does the answer change if we display an estimated dollar impact of a duty
change on the user's stated annual import value? We label it as an estimate and show
our formula.

**A4.** Are there parallel exposures with the other agencies we cover - for example,
telling a seller that an FDA or FCC requirement appears to apply to their product?

## B. Entity and structure

**B1.** Should Lunair World run as a DBA or product line of Wershuffle Inc, or should I
form a separate subsidiary for liability isolation? Wershuffle's existing business is
unrelated (music and marketing services).

**B2.** If a subsidiary is the better answer, which state, what's the rough cost, and
does it need its own Stripe account or can it use Wershuffle's?

**B3.** Anything I should do now to keep the option of separating later without a mess?

## C. Terms of Service

Please draft or review. The protections I believe we need:

**C1.** No-professional-advice clause - informational only, users directed to licensed
customs brokers or attorneys for decisions.

**C2.** Disclaimer of warranties - information provided "as is", may be incomplete,
delayed, or wrong, including when a government source itself is delayed or wrong.

**C3.** Limitation of liability capped at fees paid in the prior 12 months, with
explicit exclusion of consequential damages: seized cargo, customs penalties, storage
and demurrage fees, and lost profits.

**C4.** User indemnification.

**C5.** Binding arbitration with a class-action waiver - please confirm this is
enforceable as drafted and advise on venue.

**C6.** Acceptable use, account termination, and our right to modify terms with notice.

**C7.** Is there anything in our disclaimer stack that a court would likely refuse to
enforce against a small business customer? I would rather know now.

## D. Privacy and data

**D1.** CCPA/CPRA-ready privacy policy. We collect: email, business name, product
descriptions, product photos users upload, and usage analytics.

**D2.** Our subprocessors are Stripe, Resend (email), Anthropic (AI), Sentry (error
tracking), PostHog and Plausible (analytics), and a US cloud host. Do we need data
processing agreements with any of them, and does the list need to be public?

**D3.** We plan a self-serve account deletion button. What is the required scope and
timeline for deletion, and what may we retain (for example billing records)?

**D4.** We do not sell personal information. Does sharing product descriptions with an
AI vendor for processing count as a "sale" or "sharing" under CPRA?

**D5.** Data retention - is there a period you'd recommend we commit to, or is it
better to stay silent?

**D6.** Our Phase 2 plan targets Asia-based sellers who export to the US, and we may get
EU or UK signups by accident regardless. At what point does GDPR become our problem, and
should the policy cover it from the start or should we geo-block instead?

## E. Subscriptions and consumer protection

**E1.** Auto-renewal. We bill monthly and annually with automatic renewal. What do
California's Automatic Renewal Law and equivalent state statutes require from us in
terms of pre-purchase disclosure, post-purchase confirmation, and cancellation
mechanics? I want the checkout screen built correctly the first time.

**E2.** We've chosen a 14-day no-questions refund policy. Does that need to appear in a
specific place or format, and does offering it create any obligation beyond its terms?

**E3.** Cancellation must be as easy as signing up - is a self-serve cancel button in
the account settings sufficient, or is there a specific standard we should meet?

**E4.** Our free tier shows partial results and asks users to upgrade to see the rest.
Any disclosure requirements around that kind of gating?

## F. Marketing, newsletter and affiliates

**F1.** Please review our landing page and a sample of our weekly email newsletter
against the informational posture, so nothing in the copy undercuts the disclaimers.
I'll send both before launch.

**F2.** The newsletter is a free weekly digest of US import-rule changes, sent to people
who may not be customers. We plan double opt-in, one-click unsubscribe, and a physical
address in the footer. Is that sufficient for CAN-SPAM, and does the physical address
have to be a street address rather than a mailbox?

**F3.** We plan an affiliate program paying 25% recurring for 12 months to people who
review seller tools. What disclosure obligations do the FTC endorsement guidelines put
on us versus on the affiliate, and what should our affiliate agreement require?

**F4.** We want to show anonymized platform statistics such as "Lunair caught 37 changes
for sellers this week". Any issue with that as a marketing claim?

**F5.** We will name competitors in comparison content. Any constraints I should brief
my copywriter on?

## G. AI-specific

**G1.** We use AI to summarize government rules into plain English and to estimate
dollar impact. Summaries always link the official source. If an AI-generated summary is
wrong and a customer relies on it, does our disclaimer stack hold, or do we need
something specific about automated processing?

**G2.** Do we need to disclose to users that summaries are AI-generated? We plan to
anyway, but I'd like to know if it's required.

**G3.** We run an AI support and product chat assistant. It is instructed never to give
advice and to refer judgment calls to a licensed broker. Anything else you'd want in its
guardrails or in the terms covering it?

## H. The white-label partner tier

**H1.** One paid tier lets freight forwarders, customs brokers and sourcing agents
resell our alert feed to their own clients under their branding. Who carries liability
to the end client, and what must our partner agreement say?

**H2.** Several of those partners will be licensed customs brokers. Does supplying data
into their licensed practice change our regulatory position, positively or negatively?

**H3.** Do we need a separate agreement for partners, or can our standard ToS plus an
addendum cover it?

## I. IP, insurance and housekeeping

**I1.** Trademark. I own the domain lunairworld.com. I'd like a knockout search on
"Lunair" and "Lunair World" in classes 35 and 42 before I spend on advertising, plus
your view on whether to file now or after first revenue.

**I2.** Our data is entirely US government publication, which I understand to be public
domain. Is there any restriction on how we redistribute or reformat it commercially, and
do any of the sources have terms of use we'd be bound by?

**I3.** One product feature fetches a product listing page the user pastes in, to
pre-fill their product details. Any exposure from fetching third-party pages that way?

**I4.** Do you recommend tech E&O and cyber insurance at launch or once revenue is real,
and what coverage limits would you suggest for a product like this?

**I5.** We'll host a public archive of our newsletter, and later possibly comments. Do
we need to register a DMCA agent?

**I6.** Stripe is not the merchant of record, so we'll enable Stripe Tax to calculate
US sales tax and track economic-nexus thresholds by state. Is that a you question or an
accountant question, and is there anything on the legal side I should handle now?

**I7.** For roughly the first month we'll give about 20 beta users the top tier free in
exchange for feedback. Do they need different terms?

**I8.** Anything I haven't asked that you'd expect to see for a product like this?

---

**Timing.** I'm building now and would like to launch publicly in roughly 8 to 10 weeks.
Section A affects how I build one screen, so an early read on that - even informally on
a call - is worth more to me than a complete package later. Could you let me know your
availability and an estimate for the work, and tell me if you'd prefer to stage it?

Thank you,

Guy
Wershuffle Inc
guy@wershuffle.com
