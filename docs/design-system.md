# Lunair World — Design System & Motion Language
### "Calm mission control" — modern, simple, dark, quietly addictive.

The pull comes from **anticipation and reward** (what did the radar catch this week?),
never from clutter, noise, or fake urgency. Trust is the moat; no dark patterns, ever.

---

## 1. Tokens

### Color
```css
:root {
  /* grounds */
  --bg:        #0A1730;  /* page */
  --surface:   #12244A;  /* cards */
  --surface-2: #0F1F3F;  /* nested/inset */
  --line:      #263B66;  /* borders, grid */
  /* ink */
  --ink:       #F4F6FB;  /* primary text */
  --ink-2:     #B9C4D9;  /* secondary */
  --muted:     #8493AE;  /* captions, labels */
  /* voice */
  --amber:     #F5A623;  /* THE signal: alerts, CTAs, pings. Use sparingly. */
  --amber-2:   #FFC461;  /* amber hover / secondary arc */
  /* status (never used as series colors) */
  --good:      #2EC4B6;  /* all clear */
  --warn:      #F5A623;  /* attention */
  --bad:       #E4572E;  /* urgent / overdue */
  /* charts — validated, fixed order */
  --c1: #C57C0C; --c2: #1FA394; --c3: #5F82E8; --c4: #D14E28;
}
```
Marketing pages may use a light "Moonlight" mode (`#F4F6FB` ground, `#0B1B33` ink); the
app itself is committed dark. One amber voice per screen — if everything glows, nothing does.

### Type
- **Space Grotesk** 700/500 — headlines, big numbers, wordmark.
- **Inter** 400/500/600 — UI, body, alerts.
- Scale: 12 / 14 / 16 (body) / 20 / 25 / 31 / 39 px. Line-height 1.5 body, 1.2 headings.
- Numbers always `font-variant-numeric: tabular-nums`. Uppercase labels: 12px, +0.14em tracking.
- Body text max-width ~65ch.

### Space, radius, elevation
- 4px spacing grid: 4/8/12/16/24/32/48/64.
- Radius: 12px cards, 8px inputs/buttons, 999px pills. No mixed radii on one screen.
- Elevation via border (`--line`) + subtle shadow `0 6px 24px rgba(0,0,0,.35)` on overlays only.

---

## 2. Motion language

Defaults: durations 150–400ms · easing `cubic-bezier(0.2, 0.8, 0.2, 1)` ("lunar ease") ·
CSS-first, JS only for orchestration · **every** animation wrapped in
`@media (prefers-reduced-motion: no-preference)`.

### Signature moves (build these; they ARE the product feel)
1. **Radar sweep** — home screen ambient: a conic-gradient beam rotating 360° every 8s over
   the product constellation. Products = dots; teal ring when all-clear, amber ping when
   something changed. Pure CSS (`conic-gradient` + `mask` + `rotate` keyframes).
2. **Ping ripple** — a new alert lands: amber dot + two expanding rings (scale 1→2.4,
   opacity 1→0, 900ms, staggered 150ms). Also used on the Telegram-connect success moment.
3. **Count-up ticker** — duty rates and $ impact numbers count from 0 on first reveal
   (600ms, ease-out; skip when reduced-motion). Numbers are the drama — let them land.
4. **Passport stamp** — completing a wizard section: stamp scales 1.6→1 with 8° rotation
   settle + 1px screen-shake-free "thunk" (200ms). One per section, five per passport.
5. **Progress ring** — checklist completion: SVG stroke-dashoffset spring fill (400ms).
6. **Confetti** — ONCE per real milestone only: passport completed, first catch, upgrade.
   Never repeated for the same event (store in `badges`).
7. **Skeleton shimmer** — loading states shimmer in indigo (`--surface-2` → `--line`),
   1.2s loop. No spinners anywhere.
8. **Page transitions** — content fades/slides 8px up, 150ms. Perceived nav <100ms:
   prefetch on hover, optimistic UI.

### The addiction loop (healthy version)
- **Weekly All-Clear** (Friday): variable reward — usually calm ("312 updates checked,
  0 hit you ⚓"), sometimes a catch. This builds the check-in habit.
- **Watch Streak**: consecutive covered weeks, shown as a small flame-free moon-phase
  counter (🌑→🌕 per 4 weeks). Streaks never punish — a lapsed streak says
  "welcome back", not "you failed".
- **Badges** for real moments only: First Catch · Fleet of 10 · Early Bird (acted before an
  effective date) · Founding Voyager (first 100 customers).
- **Scene pulse**: anonymized platform ticker — "Lunair caught 37 changes for sellers this
  week" — social proof on dashboard + marketing site.
- **Share cards**: passport summary + "we caught this before it cost me" cards auto-render
  as branded PNGs (dark navy, amber accent, logo) — the product markets itself.

### Banned
Fake countdowns · artificial scarcity · shame copy ("Don't miss out!!") · autoplaying
sound · notification spam (respect quiet hours; bundle 23:00–08:00 user-local into a
morning digest) · more than one amber CTA per screen.

---

## 3. Core components
- **Alert card**: severity stripe (status color) + one-sentence headline + $ impact chip +
  effective-date chip + source link + 2-step checklist + 👍/👎. Compact; expands on tap.
- **Product dot / constellation**: radar-home representation; tap → product page.
- **Passport wizard**: one question per screen, progress stamps, back always available,
  skip always available, "why we ask" microcopy under every field.
- **Duty stack visual**: stacked horizontal bar of base + §301 + other rates with count-up
  labels — the single most screenshotted element; make it beautiful.
- **Tier paywall sheet**: bottom sheet, shows exactly what unlocks, one amber CTA,
  "not now" equally easy to tap.
- **Assistant bubble**: bottom-right, opens a panel; suggests 3 contextual questions;
  every answer carries its source links and a 👍/👎.
- **Streak/badge shelf**: quiet row on dashboard, never modal-interrupts.

## 4. Accessibility
WCAG AA contrast on all text (`--ink-2` on `--surface` passes; verify anything new) ·
focus-visible rings (2px amber offset 2px) · full keyboard nav in wizard + assistant ·
alert feeds have a text-only table view · charts follow the validated palette + direct
labels, never color-alone meaning.
