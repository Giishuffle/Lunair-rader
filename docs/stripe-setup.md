# Stripe setup - who does what

Short answer to "isn't it easier if I give you a key and you build it?" - **yes.**
With one restricted API key I create and maintain everything below. Two things stay
yours because Stripe only exposes them in the dashboard.

## 1. What Guy does - step by step (about 10 minutes, once)

### Step 1: switch to Test mode
Open **dashboard.stripe.com** and sign in to the Wershuffle account. Top right, there's
a toggle labelled **Test mode**. Turn it **on**. Everything we do first happens in test
mode, where fake cards work and no real money moves. The toggle stays on for the rest of
these steps.

### Step 2: create the restricted key
1. Left sidebar → **Developers** → **API keys**.
   (If you don't see "Developers", it's under the "..." more menu.)
2. Scroll to **Restricted keys** → click **Create restricted key**.
3. Name it `lunair-claude-code`.
4. You'll see a long list of resources, all set to "None". Set the ones in the table
   below to **Write**, leave everything else on "None".
5. Click **Create key**, then **Reveal test key** and copy it. It starts with `rk_test_`.
6. Send it to me, or paste it into `.env.local` on the `STRIPE_SECRET_KEY=` line.

Stripe shows the key only once. If you lose it, delete that key and make another - no harm.

**Permissions to set to Write:**

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

A restricted key can't move money out of the account, can't touch your other Wershuffle
business beyond these resources, and you can revoke it in one click at any time.

### Step 3: enable Stripe Tax
1. Left sidebar → **Settings** (gear, top right) → find **Tax** under "Product settings".
2. Enter the business address for Wershuffle Inc.
3. Set the default tax category to **Software as a service (SaaS)**.
4. Turn Stripe Tax **on** and accept the terms.

This step is dashboard-only - Stripe requires a human to accept the tax terms, so it's
the one thing an API key can't do. Registering in individual states comes later, only
when sales in a state cross that state's threshold. That's an accountant task and it
almost never triggers in the first year.

### Step 4: when we go live
Repeat step 2 with **Test mode off** to get a `rk_live_` key. Send that when we're ready
to take real payments - not before.

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
