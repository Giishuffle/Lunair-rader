"use client";

import { useState } from "react";
import "./demo.css";

interface WatchSource {
  title: string;
  url: string;
}
interface WatchCandidate {
  id: string;
  type: string;
  label: string;
  rationale: string;
  sources: WatchSource[];
  confidence: number;
  recommended: boolean;
  watchKey: string;
  impactNote?: string;
}
interface Ruling {
  rulingNumber: string;
  subject: string;
  date: string;
  url: string;
  relevance: number;
}
interface HtsCandidate {
  htsPrefix: string;
  fullCodes: string[];
  rulings: Ruling[];
  support: number;
}
interface CrossRefResponse {
  ok: boolean;
  htsCandidates?: HtsCandidate[];
  watches?: WatchCandidate[];
  degraded?: string[];
  error?: string;
}

const PRESETS = [
  {
    name: "GlowPals LED Night Light for Kids",
    description: "Silicone tap-activated night light for children, USB-C rechargeable lithium battery, ages 3+",
    materials: ["silicone", "ABS plastic", "lithium battery"],
    audience: "kids",
    hasBattery: true,
    hasPlug: false,
    originCountry: "CN",
    annualImportValue: 120000,
  },
  {
    name: "DriftCast Bluetooth Fishing Speaker",
    description: "Waterproof floating Bluetooth speaker, lithium battery, USB-C",
    materials: ["ABS plastic", "lithium battery"],
    audience: "adults",
    hasBattery: true,
    hasPlug: false,
    originCountry: "VN",
    annualImportValue: 300000,
  },
  {
    name: "Linen Story Throw Blanket",
    description: "100% woven linen throw blanket, 130x170cm",
    materials: ["linen"],
    audience: "adults",
    hasBattery: false,
    hasPlug: false,
    originCountry: "IN",
    annualImportValue: 90000,
  },
];

const TYPE_LABEL: Record<string, string> = {
  hts_duty: "Duty rate",
  origin_tariff: "Origin tariffs",
  agency_requirement: "Agency rules",
  recall: "Recalls",
  adcvd: "AD/CVD",
};

export function CrossRefDemo() {
  const [form, setForm] = useState(PRESETS[0]!);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [data, setData] = useState<CrossRefResponse | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setData(null);
    setError("");
    try {
      const res = await fetch("/api/crossref", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as CrossRefResponse;
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong.");
        setState("error");
        return;
      }
      setData(json);
      setChosen(new Set((json.watches ?? []).filter((w) => w.recommended).map((w) => w.id)));
      setState("done");
    } catch {
      setError("Could not reach the server.");
      setState("error");
    }
  }

  function toggle(id: string) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <main className="demo">
      <header className="demo-head">
        <p className="label">Internal demo</p>
        <h1>Passport → Radar</h1>
        <p className="sub">
          Describe a product the way a seller would. We cross-reference it against CBP&apos;s
          published rulings, the requirement library, and origin-based tariff exposure, then
          offer the alerts they can switch on. Live data - each lookup calls CBP.
        </p>
      </header>

      <div className="presets">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            className={`preset ${form.name === p.name ? "on" : ""}`}
            onClick={() => {
              setForm(p);
              setData(null);
              setState("idle");
            }}
          >
            {p.name.split(" ").slice(1, 3).join(" ")}
          </button>
        ))}
      </div>

      <form onSubmit={run} className="card form">
        <label>
          <span>Product name</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          <span>What is it? (plain English)</span>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="grid-3">
          <label>
            <span>Who uses it</span>
            <select
              className="input"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            >
              <option value="adults">Adults</option>
              <option value="kids">Kids</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label>
            <span>Made in</span>
            <input
              className="input"
              value={form.originCountry}
              maxLength={2}
              onChange={(e) => setForm({ ...form, originCountry: e.target.value.toUpperCase() })}
            />
          </label>
          <label>
            <span>Yearly import value ($)</span>
            <input
              className="input"
              type="number"
              value={form.annualImportValue}
              onChange={(e) => setForm({ ...form, annualImportValue: Number(e.target.value) })}
            />
          </label>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={form.hasBattery}
            onChange={(e) => setForm({ ...form, hasBattery: e.target.checked })}
          />
          <span>Has a battery</span>
        </label>
        <button className="btn-amber" type="submit" disabled={state === "busy"}>
          {state === "busy" ? "Checking CBP rulings…" : "Cross-reference this product"}
        </button>
        {state === "busy" && (
          <p className="hint">Querying CBP CROSS with paced requests - this takes a few seconds.</p>
        )}
        {state === "error" && <p className="err">{error}</p>}
      </form>

      {data?.degraded && data.degraded.length > 0 && (
        <p className="degraded">
          Source unavailable this run: {data.degraded.join(", ")}. Results below come from the
          sources we could reach - we never fill the gap with a guess.
        </p>
      )}

      {data?.htsCandidates && data.htsCandidates.length > 0 && (
        <section>
          <h2>Codes CBP has used for similar products</h2>
          <p className="sub">
            We do not determine your classification. These are codes CBP assigned in published
            rulings on comparable goods - pick the one that matches your product.
          </p>
          <div className="codes">
            {data.htsCandidates.map((c) => (
              <div className="card code" key={c.htsPrefix}>
                <div className="code-head">
                  <span className="mono">{c.fullCodes[0]}</span>
                  <span className="support">{Math.round(c.support * 100)}% match</span>
                </div>
                <ul className="rulings">
                  {c.rulings.map((r) => (
                    <li key={r.rulingNumber}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.rulingNumber}
                      </a>{" "}
                      <span className="muted">
                        {r.date} — {r.subject}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {data?.watches && data.watches.length > 0 && (
        <section>
          <h2>Choose what we watch</h2>
          <p className="sub">
            {chosen.size} of {data.watches.length} selected. Nothing is monitored unless you
            switch it on.
          </p>
          <div className="watches">
            {data.watches.map((w) => (
              <label className={`card watch ${chosen.has(w.id) ? "on" : ""}`} key={w.id}>
                <input type="checkbox" checked={chosen.has(w.id)} onChange={() => toggle(w.id)} />
                <div className="watch-body">
                  <div className="watch-head">
                    <span className="chip">{TYPE_LABEL[w.type] ?? w.type}</span>
                    <strong>{w.label}</strong>
                  </div>
                  <p>{w.rationale}</p>
                  {w.impactNote && <p className="impact">{w.impactNote}</p>}
                  <div className="sources">
                    {w.sources.slice(0, 3).map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>
      )}

      <footer className="demo-foot">
        Informational only, built on public US government sources. Not legal, customs-brokerage,
        or professional advice - verify with your licensed customs broker.
      </footer>
    </main>
  );
}
