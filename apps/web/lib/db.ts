import { createDb, type Db } from "@lunair/core";

/**
 * One pooled connection per server process. Next.js re-evaluates modules on hot
 * reload in dev, so the pool is cached on globalThis to avoid leaking one per edit.
 */
const globalForDb = globalThis as unknown as { lunairDb?: Db };

export function db(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  globalForDb.lunairDb ??= createDb(url);
  return globalForDb.lunairDb;
}

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
