/**
 * Points the two app services at their railway.json files and creates the worker.
 *
 * A monorepo needs one service per app, each told which config file to read -
 * Railway looks for railway.json at the service root, and ours live under
 * apps/web and apps/worker while the build must run from the repo root so npm
 * workspaces resolve.
 */
const TOKEN = process.env.RAILWAY_TOKEN;
if (!TOKEN) { console.error("RAILWAY_TOKEN not set"); process.exit(1); }

const PROJECT_ID = "ce6372fe-d588-4d0a-978d-445b68ee8e5d";
const ENV_ID = "70e7b286-7e7a-42ee-8246-077cbcf98655";
const REPO = "Giishuffle/Lunair-rader";

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

const listServices = async () =>
  (await gql(`query($p:String!){ project(id:$p){ services{ edges{ node{ id name } } } } }`, { p: PROJECT_ID }))
    .project.services.edges.map((e) => e.node);

let services = await listServices();

// 1. The existing repo-connected service becomes the web app.
const web = services.find((s) => s.name === "Lunair-rader" || s.name === "web");
if (web) {
  // Renaming needs an account token; a project token cannot. The name is
  // cosmetic, so leave it and rely on the config file to decide what it runs.
  await gql(
    `mutation($s:String!,$e:String!,$in:ServiceInstanceUpdateInput!){ serviceInstanceUpdate(serviceId:$s,environmentId:$e,input:$in) }`,
    { s: web.id, e: ENV_ID, in: { railwayConfigFile: "apps/web/railway.json" } },
  );
  console.log("+ web -> apps/web/railway.json");
}

// 2. The worker: same repo, its own config file, no public port.
let worker = services.find((s) => s.name === "worker");
if (!worker) {
  const created = await gql(
    `mutation($in:ServiceCreateInput!){ serviceCreate(input:$in){ id name } }`,
    { in: { projectId: PROJECT_ID, name: "worker", source: { repo: REPO } } },
  );
  worker = created.serviceCreate;
  console.log(`+ created worker service ${worker.id}`);
}
await gql(
  `mutation($s:String!,$e:String!,$in:ServiceInstanceUpdateInput!){ serviceInstanceUpdate(serviceId:$s,environmentId:$e,input:$in) }`,
  { s: worker.id, e: ENV_ID, in: { railwayConfigFile: "apps/worker/railway.json" } },
);
console.log("+ worker -> apps/worker/railway.json");

services = await listServices();
console.log("\nservices now:", services.map((s) => s.name).join(", "));
console.log(JSON.stringify({ webId: web?.id, workerId: worker.id }, null, 0));
