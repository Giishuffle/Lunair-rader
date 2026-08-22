/**
 * Creates every Lunair World product and price in Stripe, then prints the
 * STRIPE_PRICE_* lines to paste into .env.local.
 *
 * Idempotent: prices are keyed by `lookup_key`, so re-running finds the
 * existing price instead of creating a duplicate. Safe to run repeatedly.
 *
 * Usage:  node --env-file=.env.local scripts/stripe-bootstrap.mjs
 *         node --env-file=.env.local scripts/stripe-bootstrap.mjs --dry-run
 *
 * Needs STRIPE_SECRET_KEY with write access to Products and Prices.
 * Everything else (Stripe Tax, the customer portal, webhooks) is set up in
 * Phase 0 item 2 - see docs/stripe-setup.md.
 */

const KEY = process.env.STRIPE_SECRET_KEY;
const DRY = process.argv.includes("--dry-run");

if (!KEY) {
  console.error("STRIPE_SECRET_KEY not set. Run with: node --env-file=.env.local scripts/stripe-bootstrap.mjs");
  process.exit(1);
}

/** Master-plan §2.2 pricing. Amounts in cents (USD). */
const CATALOG = [
  {
    envPrefix: "VOYAGE",
    product: {
      name: "Lunair World - Voyage",
      description:
        "10 products, full baseline audit, real-time personalized alerts by email and Telegram, dollar-impact math, compliance checklist, AI assistant.",
    },
    prices: [
      { env: "VOYAGE_MONTHLY", lookup_key: "voyage_monthly", amount: 2900, interval: "month" },
      { env: "VOYAGE_ANNUAL", lookup_key: "voyage_annual", amount: 29000, interval: "year" },
    ],
  },
  {
    envPrefix: "FLEET",
    product: {
      name: "Lunair World - Fleet",
      description:
        "50 products, SKU breakeven and pricing impact, 3 team seats, CSV export, priority data refresh.",
    },
    prices: [
      { env: "FLEET_MONTHLY", lookup_key: "fleet_monthly", amount: 7900, interval: "month" },
      { env: "FLEET_ANNUAL", lookup_key: "fleet_annual", amount: 79000, interval: "year" },
    ],
  },
  {
    envPrefix: "LIGHTHOUSE",
    product: {
      name: "Lunair World - Lighthouse",
      description:
        "White-label alert feed and client workspaces for freight forwarders, customs brokers, and sourcing agents. 10 client workspaces included.",
    },
    prices: [
      { env: "LIGHTHOUSE_MONTHLY", lookup_key: "lighthouse_monthly", amount: 19900, interval: "month" },
      { env: "LIGHTHOUSE_ANNUAL", lookup_key: "lighthouse_annual", amount: 199000, interval: "year" },
      {
        env: "LIGHTHOUSE_WORKSPACE_ADDON",
        lookup_key: "lighthouse_workspace_addon",
        amount: 1000,
        interval: "month",
        usage: "licensed", // quantity = extra workspaces beyond the included 10
      },
    ],
  },
];

async function stripe(path, params, method = "POST") {
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${KEY}`,
      "content-type": "application/x-www-form-urlencoded",
      "stripe-version": "2025-06-30.basil",
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Stripe ${method} ${path}: ${json.error?.message ?? res.status}`);
  return json;
}

async function findPriceByLookupKey(key) {
  const res = await stripe(`prices?lookup_keys[]=${encodeURIComponent(key)}&limit=1&active=true`, null, "GET");
  return res.data?.[0] ?? null;
}

async function findProductByName(name) {
  const res = await stripe(`products?limit=100&active=true`, null, "GET");
  return res.data?.find((p) => p.name === name) ?? null;
}

const envLines = [];

for (const tier of CATALOG) {
  let product = await findProductByName(tier.product.name);
  if (product) {
    console.log(`= product exists: ${product.name} (${product.id})`);
  } else if (DRY) {
    console.log(`+ would create product: ${tier.product.name}`);
    product = { id: "prod_DRYRUN" };
  } else {
    product = await stripe("products", {
      name: tier.product.name,
      description: tier.product.description,
      "metadata[app]": "lunair",
      "metadata[tier]": tier.envPrefix.toLowerCase(),
      tax_code: "txcd_10103001", // SaaS - business use; Stripe Tax uses this
    });
    console.log(`+ created product: ${product.name} (${product.id})`);
  }

  for (const price of tier.prices) {
    const existing = await findPriceByLookupKey(price.lookup_key);
    if (existing) {
      console.log(`  = price exists: ${price.lookup_key} (${existing.id})`);
      envLines.push(`STRIPE_PRICE_${price.env}=${existing.id}`);
      continue;
    }
    if (DRY) {
      console.log(`  + would create price: ${price.lookup_key} $${(price.amount / 100).toFixed(2)}/${price.interval}`);
      envLines.push(`STRIPE_PRICE_${price.env}=price_DRYRUN`);
      continue;
    }
    const created = await stripe("prices", {
      product: product.id,
      currency: "usd",
      unit_amount: String(price.amount),
      "recurring[interval]": price.interval,
      ...(price.usage ? { "recurring[usage_type]": price.usage } : {}),
      lookup_key: price.lookup_key,
      transfer_lookup_key: "true",
      "metadata[app]": "lunair",
    });
    console.log(`  + created price: ${price.lookup_key} (${created.id})`);
    envLines.push(`STRIPE_PRICE_${price.env}=${created.id}`);
  }
}

console.log(`\n${DRY ? "DRY RUN - " : ""}Paste these into .env.local:\n`);
console.log(envLines.join("\n"));
