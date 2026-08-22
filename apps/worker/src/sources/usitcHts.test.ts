import { describe, expect, it } from "vitest";
import { UsitcHtsAdapter, diffHtsLines, snapshotHash, type HtsLine } from "./usitcHts.js";

const line = (htsno: string, general: string, other = "70%"): HtsLine => ({
  htsno,
  indent: "0",
  description: `Line ${htsno}`,
  general,
  special: "",
  other,
  footnotes: [],
});

describe("diffHtsLines", () => {
  it("detects rate changes, additions, and removals; ignores heading rows", () => {
    const prev = [line("9503.00.00", "Free"), line("9903.88.15", "7.5%"), { ...line("", "") }];
    const next = [line("9503.00.00", "Free"), line("9903.88.15", "25%"), line("9903.01.24", "20%")];
    const changes = diffHtsLines(prev, next);
    expect(changes).toHaveLength(2);
    expect(changes.find((c) => c.htsno === "9903.88.15")).toMatchObject({
      kind: "changed",
      before: { general: "7.5%" },
      after: { general: "25%" },
    });
    expect(changes.find((c) => c.htsno === "9903.01.24")?.kind).toBe("added");
  });

  it("returns empty for identical snapshots", () => {
    const lines = [line("9503.00.00", "Free")];
    expect(diffHtsLines(lines, lines)).toHaveLength(0);
  });
});

describe("snapshotHash", () => {
  it("is stable across order and changes only when rates change", () => {
    const a = [line("9503.00.00", "Free"), line("9903.88.15", "7.5%")];
    const shuffled = [a[1]!, a[0]!];
    expect(snapshotHash(a)).toBe(snapshotHash(shuffled));
    const changed = [line("9503.00.00", "Free"), line("9903.88.15", "25%")];
    expect(snapshotHash(a)).not.toBe(snapshotHash(changed));
  });
});

describe("UsitcHtsAdapter", () => {
  it("builds snapshot docs with hash-based external ids (dedupe key)", async () => {
    const payload = [line("9503.00.00", "Free")];
    const fakeFetch = (async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch;
    const adapter = new UsitcHtsAdapter([{ from: "9503", to: "9503" }], fakeFetch);
    const docs = await adapter.fetchSince(null);
    expect(docs).toHaveLength(1);
    expect(docs[0]!.externalId).toMatch(/^9503-9503:[0-9a-f]{16}$/);
    expect(docs[0]!.source).toBe("usitc_hts");
  });

  it("throws on HTTP errors (styles=false param regression guard)", async () => {
    const fakeFetch = (async () => new Response("Bad Request", { status: 400 })) as typeof fetch;
    const adapter = new UsitcHtsAdapter([{ from: "9503", to: "9503" }], fakeFetch);
    await expect(adapter.fetchSince(null)).rejects.toThrow("usitc_hts HTTP 400");
  });
});
