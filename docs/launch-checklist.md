# Launch checklist

Ordered working plan agreed 26 Aug 2026. Guy's items run in parallel; Claude works
this list top to bottom, one at a time. Tick items as they land.

## Guy's items (all due 27 Aug 2026)

- [ ] Stripe live keys (nothing else matters until this flips)
- [ ] Stripe restricted key: enable **Customer Portal Write** - "Manage billing" 500s without it
- [ ] Chase the lawyer: 12 unresolved `[COUNSEL]` markers across ToS + Privacy
- [ ] www TLS certificate: delete + re-add the custom domain in Railway, or move DNS to Cloudflare
- [ ] Create a PostHog or Plausible account and send the key

## Claude's queue, in order

1. [x] **Free-tier gating** - `fullAudit: false` is never enforced, so free users
       see everything paid users do. No reason to upgrade. Biggest revenue bug.
2. [ ] **Trim the pricing page** to what actually ships - we currently sell CSV
       export, team seats and client workspaces, none of which exist.
3. [x] **Split FCC** into intentional vs unintentional radiators - `powered_any`
       is not the legal trigger and is actively wrong (broker review).
4. [ ] **Account deletion + data export** - none exists; GDPR/CCPA requirement.
5. [ ] **Polish batch**: 404 + error pages, favicon, OG image, robots, sitemap.
6. [ ] **Welcome email** - new signups currently hear nothing for weeks.
7. [ ] **Admin console** - low-confidence events queue for review with nowhere to review.
8. [ ] **Analytics** - wire whichever tool Guy picks; funnel is invisible today.
9. [x] **Requirement schema fields** - authority_layer, legal_status, timing,
       evidence, enforcement_effect, review_status (broker review §10).
10. [x] **Remaining CPSC modules** - small parts + choking warnings, electrically
        operated toys, magnets, imitation firearms, art materials. **Not done:**
        durable infant/toddler products (cribs, strollers, high chairs, gates,
        bassinets, carriers) - each has its own CFR part and needs a
        product-type trigger, so it is a module set of its own, listed at 18.
11. [x] **CPSC certificate eFiling** - mandatory since 8 Jul 2026, unmentioned.
12. [x] **Prop 65 / state overlays** as a separate authority layer.
13. [x] **Incorporated-standard edition watching** - eCFR cannot see an ASTM edition change.
14. [ ] **More categories**, in the broker's priority order.
15. [ ] **AI assistant** - sold on Voyage, never built.
16. [ ] **CSV export, team seats, client workspaces** - sold on Fleet/Lighthouse.
17. [ ] **Support channel + refund runbook**.
18. [ ] **Durable infant & toddler products** - one module per product type,
        each with its own CFR part and trigger.
