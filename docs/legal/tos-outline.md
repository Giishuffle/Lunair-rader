# Terms of Service & legal setup — outline for counsel

> Prepared by the product team for attorney review. Not legal advice. Please review,
> correct, and bless before public launch.

## Entity & payments
- Operating entity: Wershuffle Inc (existing US inc, existing Stripe account).
- Question for counsel: run "Lunair World" as a DBA/product line vs. forming a subsidiary
  LLC for liability isolation. Recommendation requested.
- Stripe (not merchant of record): Stripe Tax enabled from day one; accountant to monitor
  state economic-nexus thresholds for SaaS sales tax.

## Product posture (drives all drafting)
Lunair World is an **informational monitoring service**. It aggregates public US government
publications (Federal Register, USITC HTS, CBP bulletins), matches them to product profiles
users describe, and notifies users of potentially relevant changes. It does not provide
legal, customs-brokerage, or professional advice; does not certify compliance; every item
links its official source; compliance checklists are user-self-declared.

## ToS must include
1. No professional advice — informational only; users directed to licensed customs brokers
   / attorneys for decisions.
2. Disclaimer of warranties — information "as is"; may be incomplete, delayed, or wrong.
3. Limitation of liability — cap at fees paid in prior 12 months; exclusion of indirect and
   consequential damages (incl. seized cargo, penalties, storage fees, lost profits).
4. Indemnification by user.
5. Binding arbitration + class-action waiver (confirm enforceability and venue).
6. Acceptable use; account termination; modification of terms with notice.
7. Subscription terms: billing cycle, 14-day refund policy (founder decision), cancellation.

## Privacy policy must cover
- Data collected: email, business name, product descriptions, usage analytics (PostHog,
  Plausible), payment via Stripe (no card data stored by us).
- CCPA/CPRA rights + deletion mechanism (self-serve delete built into product/admin).
- No sale of personal information; subprocessor list (Stripe, Resend, Neon/Supabase,
  Railway/Fly, PostHog, Sentry, Anthropic).
- Email: CAN-SPAM — double opt-in newsletter, one-click unsubscribe, physical address.

## Marketing claims review
Banned everywhere: "guaranteed", "certified", "we ensure compliance", "legal advice".
Standard phrasing: "appears to apply", "informational only", "verify with your broker".
Please review landing page + newsletter template against this.

## Other
- Tech E&O + cyber insurance quote (~$500–1,500/yr) — at first revenue.
- USPTO knockout search "Lunair" / "Lunair World", classes 35 & 42; file after revenue.
- DMCA agent registration (site hosts a public archive + comments later).
