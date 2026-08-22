# The Lunar Tide — weekly newsletter spec

Free weekly plain-English digest of US import-rule changes for e-commerce sellers.
Purpose: top-of-funnel acquisition, authority, retention. Anyone can subscribe without an
account (double opt-in). Drafted by AI every Monday, **sent only after founder approval**.

## Issue structure (~600 words)
1. **The Tide This Week** — 2-sentence overview + indicator: 🌊 calm / choppy / storm.
2. **What Changed** — 2–4 items. Each: plain-English what/who/when · a concrete $ example
   ("on $100k/yr of imports this adds ~$3,100") · official source link.
3. **On the Radar** — upcoming effective dates + proposed rules worth watching.
4. **One Practical Tip** — short, actionable, evergreen.
5. **CTA** — "Put your own products on the radar" → free Product Passport.

Tone: calm, specific, zero legalese, lightly nautical. Banned words apply (see CLAUDE.md).
Every claim links a government source. Footer: physical address, one-click unsubscribe.

## Weekly schedule (Israel time) — confirmed by Guy, 22 Aug 2026
| When | What | Who |
|---|---|---|
| **Sun 09:00** | Draft generated from the week's events (Federal Register, HTS diffs, CPSC recalls, CSMS) | Automated |
| Sun 09:00 – Mon 10:00 | Review in admin Newsletter Desk: approve / edit inline / regenerate section / skip | **Guy (~15 min)** |
| **Mon 11:00** | Send to list; archive page auto-published (SEO) | Automated — only if `status='approved'` |

Drafting on Sunday uses the Israeli workweek: Guy gets Sunday and Monday morning to
approve, instead of a same-day scramble.

**DST note:** Israel is UTC+3 in summer and UTC+2 in winter, so both jobs run **hourly**
in UTC and gate on real Israel local time via `apps/worker/src/schedule/israelTime.ts`
(tested against both). Never hard-code a UTC hour for these two jobs.

**Open trade-off for Guy:** Monday 11:00 Israel is **04:00 US Eastern**. The issue lands
before US sellers wake, so it sits at the top of the inbox but competes with everything
that arrives during their morning. Sending at **16:00 Israel = 09:00 ET** would land it
mid-morning US time, which typically reads better for a US B2B audience. One-line change
in `israelTime.ts` if he wants it — the Monday send day stays either way.

## Engine (build in Phase 2, item 11)
- `newsletter_subscribers`: public subscribe form on site + footer of every SEO page;
  double opt-in via Resend; source tracked (utm).
- `newsletter:draft` job (hourly, fires Sun 09:00 Israel): aggregate last 7 days of
  `events` + `source_docs` → Claude drafts markdown per the structure above (strict
  template) → save `newsletter_issues(status='drafted')` → notify founder (Telegram + email).
- Admin **Newsletter Desk**: draft beside its sources; inline edit; per-section regenerate;
  Approve & schedule / Skip week buttons; stats (subs, opens, clicks) per issue.
- `newsletter:send` job (hourly, fires Mon 11:00 Israel): render React Email template
  (dark-friendly, logo header, amber accents) → Resend broadcast → write stats back →
  publish archive page. Sends **only** if `status='approved'`.
- KPIs (v3, realistic): subscribers 1,200 by M6, open rate ≥38%, CTR ≥5%, subscriber→signup ≥3%/mo.

## Pre-launch mode (already running)
Until the engine ships, the same loop runs in Guy's Cowork workspace: a scheduled task
drafts The Lunar Tide every Monday 09:00 (Israel) from live government sources and delivers
it to Guy for approval; he sends manually or banks issues as launch content. When Phase 2
item 11 ships, delete the Cowork scheduled task and let the in-product engine take over.
