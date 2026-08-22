import PgBoss from "pg-boss";
import { createDb } from "@lunair/core";
import { JOB_SCHEDULES, jobHandlers, type JobName } from "./jobs.js";

/**
 * Lunair worker: watchers -> diff -> AI pipeline -> alert router (master-plan §9.4).
 * Usage:
 *   node dist/index.js                     start pg-boss with cron schedules
 *   node dist/index.js --once <job>        run one job immediately, no queue (ops/testing)
 */

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  if (!DATABASE_URL) {
    console.log("[worker] DATABASE_URL not set - nothing to do. Copy .env.example to .env.local first.");
    return;
  }
  const db = createDb(DATABASE_URL);
  const handlers = jobHandlers(db);

  const onceIdx = process.argv.indexOf("--once");
  if (onceIdx !== -1) {
    const job = process.argv[onceIdx + 1] as JobName | undefined;
    if (!job || !(job in handlers)) {
      console.error(`Usage: --once <${Object.keys(handlers).join("|")}>`);
      process.exit(1);
    }
    await handlers[job]();
    process.exit(0);
  }

  const boss = new PgBoss(DATABASE_URL);
  boss.on("error", (err) => console.error("[pg-boss]", err));
  await boss.start();

  for (const [job, cron] of Object.entries(JOB_SCHEDULES) as Array<[JobName, string]>) {
    await boss.createQueue(job);
    await boss.schedule(job, cron);
    await boss.work(job, handlers[job]);
  }
  console.log(`[worker] started; ${Object.keys(JOB_SCHEDULES).length} watchers scheduled`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
