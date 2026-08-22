# Stripe setup - who does what

Short answer to "isn't it easier if I give you a key and you build it?" - **yes.**
With one restricted API key I create and maintain everything below. Two things stay
yours because Stripe only exposes them in the dashboard.

## 1. What Guy does (about 10 minutes, once)

**a. Create the restricted key.** Stripe Dashboard → Developers → API keys →
"Create restricted key". Name it `lunair-claude-code`. Set these permissions to **Write**:

| Resource | Why |
|---|---|
| Products, Prices | create the 4 tiers and 8 prices |
| Checkout Sessions | the signup/upgrade flow |
| Customers, Subscriptions | plan state, upgrades, cancellations |
| Billing Portal | self-serve plan changes and card updates |
| Webhook Endpoints | plan state syncs to our database automatically |
| Coupons, Promotion codes | referral and win-back offers |
| Invoices | read for the admin console and dunning |
| Tax (read) | verify Tax is applying correctly |

Everything else stays "None". A restricted key can't move money out, can't read your
other Wershuffle products' data beyond these resources, and you can revoke it in one
click at any time.

**b. Enable Stripe Tax.** Dashboard → Settings → Tax. Add the business address and
turn Tax on. This one is dashboard-only - Stripe requires a human to accept the tax
terms. Registrations by state come later, when a nexus threshold trips (accountant task).

## 2. What Claude Code does with that key

```bash
node --env-file=.env.local scripts/stripe-bootstrap.mjs --dry-run   # preview
node --env-file=.env.local scripts/stripe-bootstrap.mjs             # create
```

Creates, idempotently (safe to re-run - it finds existing items instead of duplicating):

| Product | Monthly | Annual |
|---|---|---|
| Voyage | $29 | $290 |
| Fleet | $79 | $790 |
| Lighthouse | $199 | $1,990 |
| Lighthouse extra workspace | $10 each | - |

Harbor (free) needs no Stripe product - it's the default plan in our database.

Then, in Phase 0 item 2, also via API: the Checkout flow, the Customer Portal
configuration, the webhook endpoint (needs the deployed URL first), and plan-state
sync so `users.plan` always follows Stripe.

## 3. Price changes later

Never edit a live price - Stripe prices are immutable by design. To change pricing I
create a new price, point checkout at it, and leave existing subscribers on the old
one (grandfathering, per master-plan §8). The `lookup_key` on each price means the
code refers to `voyage_monthly`, not a raw ID, so a price swap is a one-line change.

## 4. Test mode first

The bootstrap script runs against whichever key you give it. If the key starts with
`sk_test_` or `rk_test_`, everything lands in test mode - we can run a full fake
checkout end to end before touching live. Recommended: send the **test** key first,
then the live one at launch.
