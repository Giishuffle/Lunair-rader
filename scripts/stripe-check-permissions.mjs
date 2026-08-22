/**
 * Probes the Stripe restricted key for the permissions Lunair needs and prints
 * exactly which toggles are missing, so the key gets fixed in one pass.
 *
 * Usage: node --env-file=.env.local scripts/stripe-check-permissions.mjs
 *
 * Read access is probed directly. Write access can't be probed without creating
 * objects, so it's inferred: Stripe's "Write" setting always includes read, and
 * a resource that fails the read probe cannot have write either.
 */

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error("STRIPE_SECRET_KEY not set.");
  process.exit(1);
}

const PROBES = [
  { label: "Products", path: "products?limit=1", need: "Write" },
  { label: "Prices", path: "prices?limit=1", need: "Write" },
  { label: "Customers", path: "customers?limit=1", need: "Write" },
  { label: "Subscriptions", path: "subscriptions?limit=1", need: "Write" },
  { label: "Checkout Sessions", path: "checkout/sessions?limit=1", need: "Write" },
  { label: "Billing Portal", path: "billing_portal/configurations?limit=1", need: "Write" },
  { label: "Webhook Endpoints", path: "webhook_endpoints?limit=1", need: "Write" },
  { label: "Coupons", path: "coupons?limit=1", need: "Write" },
  { label: "Promotion Codes", path: "promotion_codes?limit=1", need: "Write" },
  { label: "Invoices", path: "invoices?limit=1", need: "Read" },
  { label: "Tax Settings", path: "tax/settings", need: "Read" },
];

console.log(`Key: ${KEY.slice(0, 8)}…${KEY.slice(-4)}  (${KEY.startsWith("rk_test") || KEY.startsWith("sk_test") ? "TEST mode" : "LIVE mode"})\n`);

const missing = [];

for (const probe of PROBES) {
  const res = await fetch(`https://api.stripe.com/v1/${probe.path}`, {
    headers: { authorization: `Bearer ${KEY}` },
  });
  if (res.ok) {
    console.log(`  ok       ${probe.label}`);
    continue;
  }
  const body = await res.json().catch(() => ({}));
  const msg = body.error?.message ?? `HTTP ${res.status}`;
  if (res.status === 403 || /permission/i.test(msg)) {
    console.log(`  MISSING  ${probe.label}  (needs ${probe.need})`);
    missing.push(probe);
  } else {
    // e.g. tax/settings 400 when Stripe Tax isn't configured yet - not a permission problem
    console.log(`  ok?      ${probe.label} - ${msg.slice(0, 80)}`);
  }
}

if (missing.length === 0) {
  console.log("\nAll required permissions present. Ready to run stripe-bootstrap.mjs.");
} else {
  console.log(`\n${missing.length} permission(s) to fix. In the Stripe dashboard:`);
  console.log("Developers -> API keys -> your restricted key -> Edit, then set:");
  for (const m of missing) console.log(`   ${m.label}  ->  ${m.need}`);
  console.log("\nSave, then re-run this script.");
  process.exit(1);
}
