# Where the build actually stands
_23 Aug 2026. Honest audit - what works, what is stubbed, what is absent._

## Working, in production

| Area | State |
|---|---|
| **Site** | Live. Landing page, waitlist with the founding-50 counter, Terms, Privacy |
| **Sign-in** | Passwordless magic link, real emails via Resend. Google ready, needs credentials |
| **Billing** | Stripe checkout, customer portal, webhook as the only writer of plan state. Founding-50 discount applies automatically. **Test mode** |
| **Product Passport** | Five-step wizard, saves products, enforces the free-tier limit server-side |
| **Cross-reference** | Live CBP rulings, candidate codes with citations, opt-in alert chooser |
| **Radar dashboard** | Product list, status, per-product detail, self-serve delete |
| **Watchers** | Federal Register hourly, USITC daily, CPSC recalls 6-hourly, eCFR daily |
| **Ops** | Sentry on web and worker, Telegram watchdog, daily health digest |
| **CI** | Green |

## Missing before beta users

1. **The alert loop is not closed.** Watchers detect changes and write `events`;
   sellers choose watches. **Nothing joins the two.** No alert has ever been sent to a
   user. This is the single biggest gap - the product's whole promise.
2. **No AI pipeline.** Events carry raw titles, not plain-English summaries or dollar
   impact. The confidence gate exists in design only.
3. **Rule library is 2 categories.** Needs 5-8 verified ones. Blocked on broker review.
4. **No Lunair Assistant.** Specified for launch, not built.
5. **No pricing page.** Checkout works but nothing links to it; `/pricing` 404s.
6. **No account settings page.** Cancellation must be self-serve per the ToS and the
   auto-renewal statutes. Currently only reachable through the Stripe portal API.
7. **No email templates beyond the magic link.** No alert email, no weekly digest.

## Missing before public launch

8. **Newsletter engine** - subscribe, double opt-in, Monday draft, admin approval desk,
   Tuesday send, public archive.
9. **Admin console** - currently nothing. No way to see users, review low-confidence
   events, or hit a kill switch.
10. **Telegram alert delivery** - the bot only talks to the owner.
11. **CSMS ingestion** - needs the email-inbox route.
12. **AD/CVD matching** - the data already lands in `source_docs`; nothing reads it.
13. **Analytics** - PostHog and Plausible keys absent, so no funnel data at all.
14. **Lifecycle emails**, **programmatic SEO**, **referral codes**.

## Known debt

- Web service on Railway is still named `Lunair-rader` - project tokens cannot rename.
- Stripe is in **test mode**. Live keys needed before real money.
- `/demo/passport` is a public, unauthenticated route that calls CBP on each request.
  Fine now, worth rate-limiting or removing before traffic arrives.
- Google sign-in registers only when credentials exist; untested.
- No rate limiting on any public endpoint.
