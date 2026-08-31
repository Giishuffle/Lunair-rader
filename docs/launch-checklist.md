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
2. [x] **Trim the pricing page** to what actually ships - we currently sell CSV
       export, team seats and client workspaces, none of which exist.
3. [x] **Split FCC** into intentional vs unintentional radiators - `powered_any`
       is not the legal trigger and is actively wrong (broker review).
4. [x] **Account deletion + data export** - none exists; GDPR/CCPA requirement.
5. [x] **Polish batch**: 404 + error pages, favicon, OG image, robots, sitemap.
6. [x] **Welcome email** - new signups currently hear nothing for weeks.
7. [x] **Admin console** - low-confidence events queue for review with nowhere to review.
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
14. [~] **More categories** - apparel, children's sleepwear, cosmetics,
        food-contact kitchenware and furniture shipped (8 categories, 34
        requirements). Still to do from the broker's list: children's jewelry,
        pet food & edible chews, ordinary pet accessories.
15. [ ] **AI assistant** - sold on Voyage, never built.
16. [~] **CSV export** shipped; team seats and client workspaces still unbuilt (removed from pricing) - sold on Fleet/Lighthouse.
17. [ ] **Support channel + refund runbook**.
18. [ ] **Durable infant & toddler products** - one module per product type,
        each with its own CFR part and trigger.
19. [ ] **Household textiles** (blankets, bed linen, towels - HTS 6301/6302).
        Deliberately out of apparel: care labelling and clothing flammability are
        scoped to wearing apparel and do not reach them.
20. [ ] **Child age band as a product attribute.** Several CPSC rules are scoped
        to under-3s (small parts, 16 CFR 1501) or to under-14s (the toy
        standard), but the only age fact we collect is kids/adults/both. So
        small-parts currently fires for a 10-year-old's t-shirt. The fix is an
        age-band attribute answered in the wizard; unknown should evaluate to
        unresolved rather than silently applying, which is what the tri-state
        engine is for.
21. [ ] **OR within conditions.** Conditions AND together, so a rule covering
        "toys OR child-care articles" has to be written as two entries sharing
        one citation, as phthalates now is. Workable, but it duplicates the
        citation and the evidence list.
