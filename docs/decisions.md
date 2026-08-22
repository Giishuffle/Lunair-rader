# Decision log

Decisions and who made them. Anything here can be reversed - tell me and I'll change it
and update this file.

## Made by Guy

| Date | Decision |
|---|---|
| 22 Aug 2026 | **Operate as Wershuffle Inc**, not a separate subsidiary, for launch |
| 22 Aug 2026 | Refund policy: **14-day, no questions asked** |
| 22 Aug 2026 | Newsletter: send **Monday 11:00 Israel time** |
| 22 Aug 2026 | Pricing unchanged: $29 Voyage / $79 Fleet / $199 Lighthouse |
| 22 Aug 2026 | Kill/pivot criterion and the earlier month-3 product gate: accepted |
| 22 Aug 2026 | Hosting: Railway. Database: Postgres on Railway |
| 22 Aug 2026 | **Founding-50 offer**: first 50 waitlist signups get 50% off their first year on an annual plan |

## Made by Claude Code (delegated)

| Decision | Choice | Reasoning |
|---|---|---|
| Liability cap | Greater of 12 months of fees **or $100** | A monthly subscriber who cancels then sues would otherwise face a cap near zero, which courts treat as unconscionable. The floor makes the clause more likely to survive |
| Arbitration opt-out | 30-day opt-out included | Opt-out provisions materially improve enforceability of consumer-facing arbitration clauses. Almost nobody uses it |
| Governing law | Left as a placeholder for counsel | Depends on Wershuffle's state of incorporation, which I don't have |
| Support SLA | 24 hours, business days | Matches the plan's recommendation and is achievable with AI triage handling tier zero |
| Refund mechanics | Email request, not self-serve | At this volume a human touch catches save-able cancellations. Revisit past ~100 customers |
| Cancellation | Fully self-serve, one click in settings | Required by auto-renewal statutes and simply the right thing. Never make people email to cancel |
| Annual discount | Two months free (10x monthly) | Standard, easy to explain, and it's the churn lever the growth model depends on |
| Affiliate rate | 25% recurring for 12 months | Plan's lower bound. Room to raise to 30% for a proven partner without repricing everyone |
| Price increases | New customers only, existing grandfathered | Grandfathering costs little at this scale and removes the main reason early adopters churn on a price change |
| Data retention | Delete within 90 days of account closure; backups purge on a 35-day cycle | Concrete and defensible. Vague retention language invites regulator questions |
| Deletion | Self-serve button, not an email request | CPRA-friendly and it removes a support task |
| Beta users | Same terms as everyone, free top tier for one month | A separate beta agreement is overhead we don't need; the ToS liability caps already do the work |
| AI disclosure | Always disclose AI-generated summaries, whether or not required | Cheap to do, and consistent with the "trust is the moat" positioning |
| AI training | Contractually confirm our AI vendor doesn't train on customer data, and say so in the privacy policy | Product descriptions are commercially sensitive to a seller. This is a selling point, not just compliance |
| Founding discount shape | 50% off the **first year only**, annual plans only, capped at 50 in Stripe | Year two renews at full price, so the offer is sustainable. Annual-only because churn is the growth model's weakest link - 50 annual subscribers is 50 people who cannot churn monthly. Capping it inside Stripe means the promise cannot be oversold even if our own count is wrong |
| Legal doc hosting | Rendered from `docs/legal/*.md` at build time | One source of truth: the file the lawyer reviews is the file customers read. Internal `[COUNSEL]` notes are stripped automatically and tested |
| Insurance | Tech E&O + cyber at first revenue, not before | No revenue means little to lose and premiums are dead weight pre-launch |
| Trademark | Proceed with the brand; file after first revenue | The USPTO screen came back clear in our classes (`docs/legal/trademark-search.md`) |
| Email sending domain | `mail.lunairworld.com`, separate from the root domain | Protects the root domain's reputation if a campaign ever goes wrong |
| Alert channel default | Email primary, Telegram opt-in | US sellers live in email; Telegram is a power-user delight, not the default path |
| Newsletter draft timing | Sunday 09:00 Israel | The Israeli workweek starts Sunday, so Guy gets two mornings to approve instead of a same-day scramble |
| Job scheduling | Hourly cron gated on real Israel local time | A fixed UTC hour would silently drift by an hour at each daylight-saving change |

## Still open

| Question | Waiting on |
|---|---|
| Governing law state and venue | Wershuffle's state of incorporation |
| Whether the arbitration clause as drafted is enforceable | Counsel (section C5) |
| HTS classification and 19 CFR 111 | Counsel (section A) - could change one product screen |
| Auto-renewal disclosure specifics | Counsel (section E1) - affects checkout build |
| Physical postal address for the CAN-SPAM footer | Guy |
| Newsletter at 11:00 Israel = 04:00 US Eastern | Guy - flagged, his call, no change made |
