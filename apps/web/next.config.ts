import { join } from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "pg-boss"],
  // Pin the monorepo root so Next doesn't guess from a stray parent lockfile.
  outputFileTracingRoot: join(import.meta.dirname, "..", ".."),
  // docs/legal/*.md are read at build time to render /terms and /privacy.
  outputFileTracingIncludes: {
    "/terms": ["../../docs/legal/**"],
    "/privacy": ["../../docs/legal/**"],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // Source-map upload needs SENTRY_AUTH_TOKEN; without it the build still
  // succeeds, we just get minified stack traces. Token is a deploy-time task.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  webpack: { treeshake: { removeDebugLogging: true } },
  // Route Sentry's browser requests through our own domain so ad blockers
  // don't silently swallow error reports.
  tunnelRoute: "/monitoring",
});
