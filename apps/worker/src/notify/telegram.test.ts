import { describe, expect, it } from "vitest";
import { sendTelegram } from "./telegram.js";

describe("sendTelegram", () => {
  it("posts to the Bot API with previews disabled", async () => {
    let captured: { url: string; body: unknown } | null = null;
    const fakeFetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      captured = { url: String(url), body: JSON.parse(String(init?.body)) };
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    await sendTelegram({ botToken: "T" }, "123", "<b>All clear</b>", fakeFetch);
    expect(captured!.url).toBe("https://api.telegram.org/botT/sendMessage");
    expect(captured!.body).toMatchObject({
      chat_id: "123",
      text: "<b>All clear</b>",
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  });

  it("throws with the API body on failure so source_health records it", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ ok: false, description: "chat not found" }), { status: 400 })) as typeof fetch;
    await expect(sendTelegram({ botToken: "T" }, "123", "hi", fakeFetch)).rejects.toThrow(/chat not found/);
  });
});
