/**
 * Probes the Stripe restricted key for every permission Lunair needs - READ and
 * WRITE separately - and prints exactly which toggles are missing.
 *
 * Usage: node --env-file=.env.local scripts/stripe-check-permissions.mjs
 *
 * Write probing without creating anything: we POST with a deliberately invalid
 * body. Stripe checks permissions BEFORE validating parameters, so
 *   403 "Permission denied"        -> the key lacks write
 *   400 "Missing required param"   -> the key has write, the call just failed validation
 * Either way no object is ever created.
 */

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error("STRIPE_SECRET_KEY not set.");
  process.exit(1);
}

const PROBES = [
  { label: "Products", read: "products?limit=1", write: "products" },
  { label: "Prices", read: "prices?limit=1", write: "prices" },
  { label: "Customers", read: "customers?limit=1", write: null },
  { label: "Subscriptions", read: "subscriptions?limit=1", write: null },
  { label: "Checkout Sessions", read: "checkout/sessions?limit=1", write: "checkout/sessions" },
  { label: "Billing Portal", read: "billing_portal/configurations?limit=1", write: null },
  { label: "Webhook Endpoints", read: "webhook_endpoints?limit=1", write: "webhook_endpoints" },
  { label: "Coupons", read: "coupons?limit=1", write: null },
  { label: "Promotion Codes", read: "promotion_codes?limit=1", write: null },
  { label: "Invoices", read: "invoices?limit=1", write: null },
  { label: "Tax Settings", read: "tax/settings", write: null },
];

async function call(path, method) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${KEY}`,
      ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    // Empty body on purpose: fails validation, never creates anything.
    ...(method === "POST" ? { body: "" } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, message: json.error?.message ?? "", ok: res.ok };
}

function isPermissionDenied(r) {
  return r.status === 403 || /permission/i.test(r.message);
}

/** Extract the permission names Stripe itself names in its error message. */
function neededPermissions(message) {
  return [...message.matchAll(/"([^"]+)"\s*\('([a-z_]+)'\)/g)].map((m) => `${m[1]} (${m[2]})`);
}

console.log(
  `Key: ${KEY.slice(0, 8)}…${KEY.slice(-4)}  (${/^(rk|sk)_test/.test(KEY) ? "TEST mode" : "LIVE mode"})\n`,
);

const missing = new Set();
let allGood = true;

for (const probe of PROBES) {
  const r = await call(probe.read, "GET");
  if (isPermissionDenied(r)) {
    console.log(`  MISSING READ   ${probe.label}`);
    neededPermissions(r.message).forEach((p) => missing.add(p));
    allGood = false;
    continue;
  }

  if (!probe.write) {
    console.log(`  ok             ${probe.label}`);
    continue;
  }

  const w = await call(probe.write, "POST");
  if (isPermissionDenied(w)) {
    console.log(`  MISSING WRITE  ${probe.label}`);
    neededPermissions(w.message).forEach((p) => missing.add(p));
    allGood = false;
  } else {
    console.log(`  ok  read+write ${probe.label}`);
  }
}

if (allGood) {
  console.log("\nAll required permissions present. Ready to run stripe-bootstrap.mjs.");
} else {
  console.log("\nStripe reports these permissions are missing. In the dashboard:");
  console.log("Developers -> API keys -> your restricted key -> Edit\n");
  for (const p of [...missing].sort()) console.log(`   ${p}`);
  console.log("\nSave, then re-run this script.");
  process.exit(1);
}
