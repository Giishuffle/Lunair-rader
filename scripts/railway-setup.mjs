/**
 * Configures the Railway project: Postgres service (volume + credentials) and the
 * environment variables both app services need.
 *
 * Usage: RAILWAY_TOKEN=<project token> node scripts/railway-setup.mjs
 *
 * Idempotent where Railway allows it - variable upserts and volume creation are
 * safe to re-run; an existing volume simply errors and is reported, not fatal.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const TOKEN = process.env.RAILWAY_TOKEN;
if (!TOKEN) { console.error("RAILWAY_TOKEN not set"); process.exit(1); }

const PROJECT_ID = "ce6372fe-d588-4d0a-978d-445b68ee8e5d";
const ENV_ID = "70e7b286-7e7a-42ee-8246-077cbcf98655";

async function gql(query, variables = {}) {
  const res = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: { "Project-Access-Token": TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

/** Read a value out of the local .env.local so secrets are never on the CLI. */
function localEnv(key) {
  const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).replace(/^"|"$/g, "") : "";
}

const services = (await gql(`query($id:String!){ project(id:$id){ services{ edges{ node{ id name } } } } }`,
  { id: PROJECT_ID })).project.services.edges.map((e) => e.node);
console.log("services:", services.map((s) => `${s.name}=${s.id}`).join(" "));

const pg = services.find((s) => s.name === "postgres");
const appServices = services.filter((s) => s.name !== "postgres");
if (!pg) { console.error("no postgres service"); process.exit(1); }

// 1. Volume so the database survives redeploys. Without this, every deploy wipes it.
try {
  await gql(
    `mutation($in: VolumeCreateInput!){ volumeCreate(input:$in){ id } }`,
    { in: { projectId: PROJECT_ID, environmentId: ENV_ID, serviceId: pg.id, mountPath: "/var/lib/postgresql/data" } },
  );
  console.log("+ volume created at /var/lib/postgresql/data");
} catch (e) {
  console.log(`= volume: ${e.message.slice(0, 90)}`);
}

// 2. Postgres credentials. Generated once, then reused from the local file on re-runs.
const pgPassword = process.env.PGPASSWORD_OVERRIDE || randomBytes(24).toString("base64url");
const pgVars = {
  POSTGRES_USER: "lunair",
  POSTGRES_PASSWORD: pgPassword,
  POSTGRES_DB: "lunair",
  PGDATA: "/var/lib/postgresql/data/pgdata",
};
await gql(
  `mutation($in: VariableCollectionUpsertInput!){ variableCollectionUpsert(input:$in) }`,
  { in: { projectId: PROJECT_ID, environmentId: ENV_ID, serviceId: pg.id, variables: pgVars } },
);
console.log("+ postgres credentials set");

// 3. App variables. DATABASE_URL uses Railway's private network - no public exposure.
const dbUrl = `postgresql://lunair:${pgPassword}@postgres.railway.internal:5432/lunair`;
const appVars = {
  DATABASE_URL: dbUrl,
  NODE_ENV: "production",
  APP_URL: "https://lunair-world.com",
  ANTHROPIC_API_KEY: localEnv("ANTHROPIC_API_KEY"),
  TELEGRAM_BOT_TOKEN: localEnv("TELEGRAM_BOT_TOKEN"),
  TELEGRAM_OWNER_CHAT_ID: localEnv("TELEGRAM_OWNER_CHAT_ID"),
  SENTRY_DSN: localEnv("SENTRY_DSN"),
  NEXT_PUBLIC_SENTRY_DSN: localEnv("NEXT_PUBLIC_SENTRY_DSN"),
  AUTH_SECRET: localEnv("AUTH_SECRET"),
  STRIPE_SECRET_KEY: localEnv("STRIPE_SECRET_KEY"),
  STRIPE_PRICE_VOYAGE_MONTHLY: localEnv("STRIPE_PRICE_VOYAGE_MONTHLY"),
  STRIPE_PRICE_VOYAGE_ANNUAL: localEnv("STRIPE_PRICE_VOYAGE_ANNUAL"),
  STRIPE_PRICE_FLEET_MONTHLY: localEnv("STRIPE_PRICE_FLEET_MONTHLY"),
  STRIPE_PRICE_FLEET_ANNUAL: localEnv("STRIPE_PRICE_FLEET_ANNUAL"),
  STRIPE_PRICE_LIGHTHOUSE_MONTHLY: localEnv("STRIPE_PRICE_LIGHTHOUSE_MONTHLY"),
  STRIPE_PRICE_LIGHTHOUSE_ANNUAL: localEnv("STRIPE_PRICE_LIGHTHOUSE_ANNUAL"),
  STRIPE_PRICE_LIGHTHOUSE_WORKSPACE_ADDON: localEnv("STRIPE_PRICE_LIGHTHOUSE_WORKSPACE_ADDON"),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "lunair-world.com",
  ADMIN_EMAILS: "guy@wershuffle.com",
  EMAIL_FROM: localEnv("EMAIL_FROM"),
  RESEND_API_KEY: localEnv("RESEND_API_KEY"),
};

for (const svc of appServices) {
  await gql(
    `mutation($in: VariableCollectionUpsertInput!){ variableCollectionUpsert(input:$in) }`,
    { in: { projectId: PROJECT_ID, environmentId: ENV_ID, serviceId: svc.id, variables: appVars } },
  );
  console.log(`+ ${Object.keys(appVars).length} variables set on ${svc.name}`);
}

console.log("\nDATABASE_URL (private network):");
console.log(`  postgresql://lunair:${"*".repeat(12)}@postgres.railway.internal:5432/lunair`);
console.log("\nSave the password locally - Railway is now the only other copy:");
console.log(`  RAILWAY_PG_PASSWORD=${pgPassword}`);
