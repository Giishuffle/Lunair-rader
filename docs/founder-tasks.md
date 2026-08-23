# Founder tasks - the 2% only Guy can do
_Updated 22 Aug 2026, second working session._

## ✅ Done
GitHub repo · Railway project · Anthropic API key · Telegram bot (@lunairworldbot,
owner chat id captured and the watchdog ping tested) · Sentry account + repo connected ·
domain lunair-world.com owned · decisions on refund policy, newsletter timing, pricing,
and the kill/pivot criterion.

## ⏳ Waiting on Guy

| # | Task | Why it matters | Time |
|---|---|---|---|
| 1 | **Sentry DSN** - Sentry → Settings → Projects → your project → Client Keys (DSN). Copy the `https://…@…ingest.sentry.io/…` string | Error tracking; not blocking | 1 min |
| 2 | **Railway Postgres** - in the Railway project: Create → Database → PostgreSQL, then copy the `DATABASE_URL` it generates | Production database. Local Docker Postgres covers dev until then | 2 min |
| 3 | **Stripe restricted key** - see `docs/stripe-setup.md` for the exact permissions | Unblocks billing. Send the **test** key first | 5 min |
| 4 | **Enable Stripe Tax** - Dashboard → Settings → Tax (dashboard-only, can't be done by API) | Sales-tax compliance from day one | 3 min |
| 5 | **Resend API key** + add the DNS records I'll give you for `mail.lunair-world.com` | Alert emails and the newsletter | 5 min + DNS wait |
| 6 | **Send the lawyer email** - ready to copy in `docs/legal/lawyer-email.md`, attach `docs/legal/tos-outline.md` | Slowest item; question 1 can change a product screen | 5 min |
| 7 | **PostHog + Plausible** accounts (optional until launch) | Funnels and site analytics | 10 min |

## Trademark - what it is and why the domain isn't enough

Owning **lunair-world.com** means you control that web address. It does **not** give you
rights to the name "Lunair World" as a brand. Those are two separate systems:

- **The domain** is a rental from a registrar. It stops nobody from launching
  "Lunair World" at lunair-world.io, lunair.app, or on Amazon.
- **A trademark** is a legal right to use a name for a *category of business*. It's what
  lets you stop a copycat, and what stops someone else from forcing *you* to rename.

The risk that matters right now is the second one. If a company already holds a
trademark on "Lunair" or something close in software or business services, they can send
you a cease-and-desist after you've spent money on ads, and you'd have to rebrand -
losing the domain value, the logo, the SEO, and the newsletter list's recognition.
This is why the knockout search comes **before** ad spend, not after.

**Knockout search** = a preliminary check of the USPTO database for identical or
confusingly similar marks in the relevant classes. For Lunair World those are
**class 35** (business services, advertising, data compilation) and **class 42**
(software as a service). It's a screen, not a guarantee - your lawyer interprets the
results, since "confusingly similar" is a judgment call, not a keyword match.

**Recommended sequence:** knockout search now (free, fast) → if clear, keep building and
spending → file the application after first revenue (roughly $250-350 per class in USPTO
fees plus attorney time). Filing early is only worth it if the search turns up someone
circling the same name.

I can run a preliminary USPTO search and hand the raw results to your lawyer - say the
word and it's done in one session.

## Standing weekly (~45 min, starts at beta)
Ads review (30 min) · newsletter approval (15 min, Sunday or Monday morning) ·
AI-flagged support edge cases (usually zero to three items).

## What you never need to do
Code, deploys, schema, watchers, alert pipeline, admin console, SEO pages, newsletter
drafting, support tier-0, lifecycle emails, KPI reporting.
