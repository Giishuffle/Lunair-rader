import { describe, expect, it, vi } from "vitest";
import { fetchWithRetry } from "../src/http.js";

function seq(responses: Array<Response | Error>) {
  let i = 0;
  return vi.fn(async () => {
    const r = responses[Math.min(i, responses.length - 1)]!;
    i += 1;
    if (r instanceof Error) throw r;
    return r;
  });
}

const ok = () => new Response("{}", { status: 200 });
const bad = (status: number) => new Response("nope", { status });

describe("fetchWithRetry", () => {
  it("returns immediately on success, no retry", async () => {
    const fetchImpl = seq([ok()]);
    const res = await fetchWithRetry("https://x", {}, fetchImpl, { delayMs: 1 });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries a 503 and succeeds on the next attempt", async () => {
    const fetchImpl = seq([bad(503), ok()]);
    const res = await fetchWithRetry("https://x", {}, fetchImpl, { delayMs: 1 });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up after the attempt budget and returns the last failing response", async () => {
    const fetchImpl = seq([bad(503), bad(503), bad(503)]);
    const res = await fetchWithRetry("https://x", {}, fetchImpl, { attempts: 3, delayMs: 1 });
    expect(res.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("never retries a plain 404 - the request itself is wrong, not the server", async () => {
    const fetchImpl = seq([bad(404)]);
    const res = await fetchWithRetry("https://x", {}, fetchImpl, { delayMs: 1 });
    expect(res.status).toBe(404);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries 429 (rate limited), which is transient by nature", async () => {
    const fetchImpl = seq([bad(429), ok()]);
    const res = await fetchWithRetry("https://x", {}, fetchImpl, { delayMs: 1 });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries a thrown network error, not just a bad status", async () => {
    const fetchImpl = seq([new Error("ECONNRESET"), ok()]);
    const res = await fetchWithRetry("https://x", {}, fetchImpl, { delayMs: 1 });
    expect(res.status).toBe(200);
  });

  it("throws the last error if every attempt fails with a thrown error", async () => {
    const fetchImpl = seq([new Error("down"), new Error("down"), new Error("down")]);
    await expect(fetchWithRetry("https://x", {}, fetchImpl, { attempts: 3, delayMs: 1 })).rejects.toThrow("down");
  });
});
