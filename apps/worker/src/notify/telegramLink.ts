import { eq } from "drizzle-orm";
import { schema, userIdFromTelegramPayload, type Db } from "@lunair/core";
import { sendTelegram, telegramConfigFromEnv } from "./telegram.js";

const API = "https://api.telegram.org";

/**
 * Links a seller's Telegram account by polling getUpdates, rather than exposing
 * a public webhook.
 *
 * Telegram drops updates once they are acknowledged with a higher offset, so the
 * acknowledgement at the end of a run is what makes this stateless - there is no
 * cursor to persist and a crash mid-run simply reprocesses the same /start,
 * which is idempotent anyway.
 */

interface TgUpdate {
  update_id: number;
  message?: { chat?: { id?: number }; text?: string };
}

export interface LinkResult {
  updates: number;
  linked: number;
}

export async function processTelegramLinks(
  db: Db,
  fetchImpl: typeof fetch = fetch,
): Promise<LinkResult> {
  const result: LinkResult = { updates: 0, linked: 0 };
  const cfg = telegramConfigFromEnv();
  const secret = process.env.AUTH_SECRET;
  if (!cfg || !secret) return result;

  const res = await fetchImpl(`${API}/bot${cfg.botToken}/getUpdates?timeout=0&allowed_updates=%5B%22message%22%5D`);
  if (!res.ok) throw new Error(`telegram getUpdates HTTP ${res.status}`);
  const body = (await res.json()) as { ok: boolean; result?: TgUpdate[] };
  const updates = body.result ?? [];
  result.updates = updates.length;
  if (updates.length === 0) return result;

  let maxId = 0;
  for (const u of updates) {
    maxId = Math.max(maxId, u.update_id);
    const chatId = u.message?.chat?.id;
    const text = (u.message?.text ?? "").trim();
    if (!chatId) continue;

    // Opting out must work from here, without a login - it is the only control
    // someone reading these messages actually has to hand.
    if (text.startsWith("/stop")) {
      await db
        .update(schema.users)
        .set({ telegramChatId: null })
        .where(eq(schema.users.telegramChatId, String(chatId)));
      await say(cfg, chatId, "Done - no more Lunair alerts here. Email alerts are unaffected; change those in your account settings.", fetchImpl);
      continue;
    }

    if (!text.startsWith("/start")) continue;

    const payload = text.slice("/start".length).trim();
    // A bare /start is someone finding the bot on their own - no claim to verify.
    if (!payload) {
      await say(cfg, chatId, "To get alerts here, open Telegram from your Lunair World account settings so we know which account to connect.", fetchImpl);
      continue;
    }

    const userId = userIdFromTelegramPayload(payload, secret);
    if (!userId) {
      await say(cfg, chatId, "That link could not be verified. Try again from your Lunair World account settings.", fetchImpl);
      continue;
    }

    const [user] = await db
      .update(schema.users)
      .set({ telegramChatId: String(chatId) })
      .where(eq(schema.users.id, userId))
      .returning({ email: schema.users.email });

    if (!user) {
      await say(cfg, chatId, "We could not find that account. Try again from your Lunair World account settings.", fetchImpl);
      continue;
    }

    result.linked += 1;
    await say(
      cfg,
      chatId,
      `Connected to <b>${escapeHtml(user.email)}</b>.\n\nYou'll get alerts here as well as by email, for the products you asked us to watch. Send /stop to turn these off.`,
      fetchImpl,
    );
  }

  // Acknowledge everything we just read so the next run starts clean.
  await fetchImpl(`${API}/bot${cfg.botToken}/getUpdates?offset=${maxId + 1}&timeout=0`).catch(() => undefined);
  return result;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function say(
  cfg: { botToken: string },
  chatId: number,
  text: string,
  fetchImpl: typeof fetch,
): Promise<void> {
  await sendTelegram(cfg, String(chatId), text, fetchImpl).catch((e) =>
    console.error("[telegram-link] reply failed", e),
  );
}
