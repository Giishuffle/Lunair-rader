import { describe, expect, it } from "vitest";
import {
  CrossRulingsClient,
  candidatesFromRulings,
  isSuperseded,
  scoreRelevance,
  type CrossRuling,
} from "../src/sources/crossRulings.js";

const raw = (over: Record<string, unknown> = {}) => ({
  rulingNumber: "N233202",
  subject: "The tariff classification of a Bluetooth Wireless Speaker from the Philippines",
  categories: "Classification",
  rulingDate: "2012-10-02T00:00:00",
  tariffs: ["8517.62.0050"],
  collection: "ny",
  revokedBy: [] as string[],
  modifiedBy: [] as string[],
  operationallyRevoked: false,
  ...over,
});

function client(rulings: unknown[]) {
  const fakeFetch = (async () =>
    new Response(JSON.stringify({ rulings }), { status: 200 })) as typeof fetch;
  return new CrossRulingsClient(fakeFetch);
}

describe("scoreRelevance", () => {
  it("scores overlap and ignores boilerplate words", () => {
    const s = scoreRelevance("bluetooth speaker", "The tariff classification of a Bluetooth Wireless Speaker");
    expect(s).toBe(1);
  });
  it("scores an unrelated subject near zero", () => {
    expect(scoreRelevance("bluetooth speaker", "The tariff classification of a plastic water bottle")).toBe(0);
  });
});

describe("isSuperseded", () => {
  it("flags revoked, modified, and operationally revoked rulings", () => {
    expect(isSuperseded({ revokedBy: ["H281100"], modifiedBy: [], operationallyRevoked: false })).toBe(true);
    expect(isSuperseded({ revokedBy: [], modifiedBy: ["H1"], operationallyRevoked: false })).toBe(true);
    expect(isSuperseded({ revokedBy: [], modifiedBy: [], operationallyRevoked: true })).toBe(true);
    expect(isSuperseded({ revokedBy: [], modifiedBy: [], operationallyRevoked: false })).toBe(false);
  });
});

describe("CrossRulingsClient.search", () => {
  it("drops superseded rulings so stale precedent is never cited", async () => {
    const c = client([raw(), raw({ rulingNumber: "OLD1", revokedBy: ["H281100"] })]);
    const out = await c.search("bluetooth speaker");
    expect(out.map((r) => r.rulingNumber)).toEqual(["N233202"]);
  });

  it("drops non-classification rulings and ones naming no code", async () => {
    const c = client([
      raw(),
      raw({ rulingNumber: "V1", categories: "Valuation" }),
      raw({ rulingNumber: "V2", tariffs: [] }),
    ]);
    const out = await c.search("bluetooth speaker");
    expect(out).toHaveLength(1);
  });

  it("drops weak matches - CROSS relevance ranking is loose", async () => {
    const c = client([
      raw(),
      raw({ rulingNumber: "W1", subject: "The tariff classification of a plastic water bottle from China" }),
    ]);
    const out = await c.search("bluetooth speaker");
    expect(out.map((r) => r.rulingNumber)).toEqual(["N233202"]);
  });

  it("surfaces HTTP failures so source_health records them", async () => {
    const fakeFetch = (async () => new Response("nope", { status: 503 })) as typeof fetch;
    await expect(new CrossRulingsClient(fakeFetch).search("x")).rejects.toThrow("cross_rulings HTTP 503");
  });
});

describe("candidatesFromRulings", () => {
  const r = (num: string, tariff: string, relevance: number): CrossRuling => ({
    rulingNumber: num,
    subject: `subject ${num}`,
    date: "2024-01-01",
    tariffs: [tariff],
    url: `https://rulings.cbp.gov/ruling/${num}`,
    relevance,
  });

  it("groups rulings by 6-digit subheading and ranks by support", () => {
    const out = candidatesFromRulings([
      r("A", "8517.62.0050", 0.9),
      r("B", "8517.62.0090", 0.7),
      r("C", "3924.10.4000", 0.3),
    ]);
    expect(out[0]!.htsPrefix).toBe("851762");
    expect(out[0]!.fullCodes).toEqual(["8517.62.0050", "8517.62.0090"]);
    expect(out[0]!.support).toBeGreaterThan(out[1]!.support);
  });

  it("ignores codes too short to identify a subheading", () => {
    expect(candidatesFromRulings([r("A", "8517", 0.9)])).toHaveLength(0);
  });

  it("excludes Chapter 99 additional-duty codes, which are not classifications", () => {
    const withCh99: CrossRuling = {
      rulingNumber: "N1",
      subject: "The tariff classification of a Bluetooth-enabled speaker from China",
      date: "2024-01-01",
      tariffs: ["8518.21.0000", "9903.88.15"],
      url: "https://rulings.cbp.gov/ruling/N1",
      relevance: 0.9,
    };
    const out = candidatesFromRulings([withCh99]);
    expect(out.map((c) => c.htsPrefix)).toEqual(["851821"]);
  });

  it("caps the number of candidates offered", () => {
    const many = ["1111.11", "2222.22", "3333.33", "4444.44"].map((t, i) => r(`R${i}`, `${t}.0000`, 0.5));
    expect(candidatesFromRulings(many, 3)).toHaveLength(3);
  });
});
