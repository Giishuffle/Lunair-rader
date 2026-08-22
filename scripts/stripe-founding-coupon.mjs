/**
 * Creates the founding-member offer in Stripe: 50% off the FIRST YEAR of an
 * annual plan, capped at 50 redemptions.
 *
 * Usage: node --env-file=.env.local scripts/stripe-founding-coupon.mjs
 *
 * Idempotent: the coupon uses a fixed id, so re-running finds the existing one.
 *
 * Design notes:
 *  - duration "once" on a yearly price = the first annual invoice only. Year two
 *    renews at full price, which is what makes the offer sustainable.
 *  - max_redemptions 50 enforces the cap in Stripe itself, so the promise on the
 *    landing page cannot be oversold even if the site count is wrong.
 *  - applies_to is left open rather than product-restricted, because the code is
 *    only ever handed out with an annual checkout link.
 */

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error("STRIPE_SECRET_KEY not set.");
  process.exit(1);
}

const COUPON_ID = "founding50";
const PROMO_CODE = "FOUNDING50";
const MAX_REDEMPTIONS = 50;

async function stripe(path, params, method = "POST") {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Stripe ${method} ${path}: ${json.error?.message ?? res.status}`);
  return json;
}

// 1. The coupon: what the discount is.
let coupon;
try {
  coupon = await stripe(`coupons/${COUPON_ID}`, null, "GET");
  console.log(`= coupon exists: ${coupon.id} (${coupon.percent_off}% off, ${coupon.duration})`);
} catch {
  coupon = await stripe("coupons", {
    id: COUPON_ID,
    percent_off: "50",
    duration: "once",
    name: "Founding Member - 50% off first year",
    max_redemptions: String(MAX_REDEMPTIONS),
    "metadata[app]": "lunair",
    "metadata[cohort]": "founding-50",
  });
  console.log(`+ created coupon: ${coupon.id} (50% off, first invoice, max ${MAX_REDEMPTIONS})`);
}

// 2. The promotion code: what the customer types.
const existing = await stripe(`promotion_codes?code=${PROMO_CODE}&limit=1`, null, "GET");
if (existing.data?.length) {
  const p = existing.data[0];
  console.log(`= promotion code exists: ${p.code} (${p.id}), active=${p.active}, used ${p.times_redeemed}/${MAX_REDEMPTIONS}`);
} else {
  const promo = await stripe("promotion_codes", {
    coupon: coupon.id,
    code: PROMO_CODE,
    max_redemptions: String(MAX_REDEMPTIONS),
    "restrictions[first_time_transaction]": "true",
    "metadata[app]": "lunair",
  });
  console.log(`+ created promotion code: ${promo.code} (${promo.id})`);
}

console.log(`\nFounding offer live. Customers enter ${PROMO_CODE} at checkout, or we
attach the coupon to their Checkout Session automatically from their waitlist position.`);
