/**
 * Telegram delivery via the Bot API (grammY is only needed for the inbound
 * webhook in Phase 2; outbound pings are a plain HTTPS call).
 * Two audiences: the owner watchdog channel, and user alerts.
 */

const API = "https://api.telegram.org";

export interface TelegramConfig {
  botToken: string;
  ownerChatId?: string;
}

export function telegramConfigFromEnv(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;
  return { botToken, ownerChatId: process.env.TELEGRAM_OWNER_CHAT_ID };
}

export async function sendTelegram(
  cfg: TelegramConfig,
  chatId: string,
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const res = await fetchImpl(`${API}/bot${cfg.botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`telegram sendMessage HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}

/**
 * A seller's own chat. Throws when unconfigured rather than logging and
 * returning, so a missing token leaves sent_at null on the alert row instead of
 * recording a delivery that never happened.
 */
export async function sendUserTelegram(
  chatId: string,
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const cfg = telegramConfigFromEnv();
  if (!cfg) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  await sendTelegram(cfg, chatId, text, fetchImpl);
}

/** Owner watchdog channel: source health, newsletter drafts, ops incidents. */
export async function pingOwner(text: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const cfg = telegramConfigFromEnv();
  if (!cfg?.ownerChatId) {
    console.warn("[telegram] owner ping skipped - TELEGRAM_BOT_TOKEN/OWNER_CHAT_ID not set");
    return false;
  }
  await sendTelegram(cfg, cfg.ownerChatId, text, fetchImpl);
  return true;
}
