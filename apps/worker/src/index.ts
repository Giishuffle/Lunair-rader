import PgBoss from "pg-boss";
import { createDb, schema } from "@lunair/core";
import { sql } from "drizzle-orm";
import { FederalRegisterAdapter } from "./sources/federalRegister.js";
import { randomUUID } from "node:crypto";

/**
 * Lunair worker: watchers -> diff -> AI pipeline -> alert router (master-plan §9.4).
 * Phase 0: queue scaffolding + federal_register watcher persisting to source_docs.
 * The AI pipeline and alert router land in Phase 2.
 */

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  if (!DATABASE_URL) {
    console.log("[worker] DATABASE_URL not set - nothing to do. Copy .env.example to .env.local first.");
    return;
  }

  const db = createDb(DATABASE_URL);
  const boss = new PgBoss(DATABASE_URL);
  boss.on("error", (err) => console.error("[pg-boss]", err));
  await boss.start();

  // Watcher schedules (master-plan §9.4). CSMS + HTS diff adapters land in Phase 2.
  await boss.createQueue("federal_register:poll");
  await boss.schedule("federal_register:poll", "0 * * * *"); // hourly

  await boss.work("federal_register:poll", async () => {
    const adapter = new FederalRegisterAdapter();
    const since = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    try {
      const docs = await adapter.fetchSince(since);
      for (const d of docs) {
        await db
          .insert(schema.sourceDocs)
          .values({
            id: randomUUID(),
            source: d.source,
            externalId: d.externalId,
            title: d.title,
            url: d.url,
            publishedAt: d.publishedAt,
            raw: d.raw,
          })
          .onConflictDoNothing();
      }
      await db
        .insert(schema.sourceHealth)
        .values({ source: "federal_register", lastSuccessAt: new Date(), errorStreak: 0, status: "ok" })
        .onConflictDoUpdate({
          target: schema.sourceHealth.source,
          set: { lastSuccessAt: new Date(), errorStreak: 0, status: "ok" },
        });
      console.log(`[federal_register] upserted ${docs.length} docs`);
    } catch (err) {
      await db
        .insert(schema.sourceHealth)
        .values({ source: "federal_register", errorStreak: 1, status: "degraded" })
        .onConflictDoUpdate({
          target: schema.sourceHealth.source,
          set: { errorStreak: sql`${schema.sourceHealth.errorStreak} + 1`, status: "degraded" },
        });
      throw err;
    }
  });

  console.log("[worker] started; watchers scheduled");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
