// Verifies TELEGRAM_BOT_TOKEN from .env.local and prints the bot username.
// If the owner has already messaged the bot, prints the chat id to put in
// TELEGRAM_OWNER_CHAT_ID. Run: node scripts/check-telegram.mjs
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(resolve(root, ".env.local"), "utf8");
const token = env.match(/^TELEGRAM_BOT_TOKEN=(.+)$/m)?.[1]?.trim();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN not set in .env.local");
  process.exit(1);
}

const me = await (await fetch(`https://api.telegram.org/bot${token}/getMe`)).json();
if (!me.ok) {
  console.error("Token rejected by Telegram:", me.description);
  process.exit(1);
}
console.log(`Bot OK: @${me.result.username} (${me.result.first_name})`);

const updates = await (await fetch(`https://api.telegram.org/bot${token}/getUpdates`)).json();
const chats = new Map();
for (const u of updates.result ?? []) {
  const chat = u.message?.chat;
  if (chat) chats.set(chat.id, chat.username ?? chat.first_name ?? "unknown");
}
if (chats.size === 0) {
  console.log(`No messages yet. Send any message to @${me.result.username}, then re-run to capture TELEGRAM_OWNER_CHAT_ID.`);
} else {
  for (const [id, name] of chats) console.log(`chat_id ${id} (${name})`);
}
