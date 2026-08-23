"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completePassport, saveWatches, type PassportResult } from "@/lib/products";
import "./wizard.css";

/**
 * The Product Passport: one question per screen, plain words, skippable, with a
 * line under each field explaining why we ask (master-plan §4.1).
 *
 * Deliberately never uses customs vocabulary. "Your product's customs code"
 * appears only at the end, next to the CBP rulings that justify it.
 */

type Step = 0 | 1 | 2 | 3 | 4;
const LAST_STEP: Step = 4;

interface Draft {
  name: string;
  description: string;
  materials: string;
  audience: "" | "kids" | "adults" | "both";
  hasBattery: boolean;
  hasPlug: boolean;
  originCountry: string;
  annualImportValue: string;
}

const EMPTY: Draft = {
  name: "",
  description: "",
  materials: "",
  audience: "",
  hasBattery: false,
  hasPlug: false,
  originCountry: "",
  annualImportValue: "",
};

const ORIGINS = [
  ["CN", "China"], ["VN", "Vietnam"], ["IN", "India"], ["TH", "Thailand"],
  ["MY", "Malaysia"], ["ID", "Indonesia"], ["KH", "Cambodia"], ["MX", "Mexico"],
  ["DE", "Germany"], ["IT", "Italy"], ["US", "United States"], ["OT", "Somewhere else"],
];

export function PassportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PassportResult | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await completePassport({
        name: draft.name,
        description: draft.description || undefined,
        materials: draft.materials ? draft.materials.split(",").map((m) => m.trim()).filter(Boolean) : undefined,
        audience: draft.audience || undefined,
        hasBattery: draft.hasBattery,
        hasPlug: draft.hasPlug,
        originCountry: draft.originCountry && draft.originCountry !== "OT" ? draft.originCountry : undefined,
        annualImportValue: draft.annualImportValue ? Number(draft.annualImportValue) : undefined,
      });
      setResult(res);
      setChosen(new Set(res.watches.filter((w) => w.recommended).map((w) => w.id)));
      setConfirmedCode(res.htsCandidates[0]?.fullCodes[0] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!result) return;
    setBusy(true);
    try {
      await saveWatches(
        result.productId,
        result.watches.filter((w) => chosen.has(w.id)),
        confirmedCode,
      );
      router.push("/app");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your choices.");
      setBusy(false);
    }
  }

  // ---------- the reveal ----------
  if (result) {
    return (
      <main className="wiz">
        <div className="reveal-head">
          <p className="label">Passport ready</p>
          <h1>{draft.name}</h1>
          <p className="sub">
            We checked CBP&apos;s published rulings and the requirement library. Confirm your
            code, then choose what we watch.
          </p>
        </div>

        {result.degraded.length > 0 && (
          <p className="degraded">
            One source was unreachable just now ({result.degraded.join(", ")}), so this view may
            be incomplete. We never fill a gap with a guess - reopen this product later for the
            full picture.
          </p>
        )}

        {result.htsCandidates.length > 0 ? (
          <section>
            <h2>Codes CBP has used for products like yours</h2>
            <p className="sub">
              We don&apos;t determine your classification. These are codes CBP assigned in
              published rulings on comparable goods - pick whichever matches, or skip and
              confirm it with your broker.
            </p>
            <div className="codes">
              {result.htsCandidates.map((c) => {
                const code = c.fullCodes[0]!;
                return (
                  <label key={c.htsPrefix} className={`code ${confirmedCode === code ? "on" : ""}`}>
                    <input
                      type="radio"
                      name="hts"
                      checked={confirmedCode === code}
                      onChange={() => setConfirmedCode(code)}
                    />
                    <span className="code-body">
                      <span className="code-head">
                        <code>{code}</code>
                        <span className="support">{Math.round(c.support * 100)}% match</span>
                      </span>
                      {c.rulings.slice(0, 2).map((r) => (
                        <span key={r.rulingNumber} className="ruling">
                          <a href={r.url} target="_blank" rel="noopener noreferrer">{r.rulingNumber}</a>
                          <span className="muted"> {r.date} — {r.subject}</span>
                        </span>
                      ))}
                    </span>
                  </label>
                );
              })}
              <label className={`code ${confirmedCode === null ? "on" : ""}`}>
                <input type="radio" name="hts" checked={confirmedCode === null} onChange={() => setConfirmedCode(null)} />
                <span className="code-body">
                  <span className="code-head"><strong>None of these / I&apos;ll confirm later</strong></span>
                  <span className="muted">We&apos;ll still watch everything else you pick below.</span>
                </span>
              </label>
            </div>
          </section>
        ) : (
          <p className="degraded">
            We couldn&apos;t find a close CBP ruling for this description. That happens with
            unusual products - your broker can confirm the code, and the alerts below still work.
          </p>
        )}

        <section>
          <h2>Choose what we watch</h2>
          <p className="sub">
            {chosen.size} of {result.watches.length} selected. Nothing is monitored unless you
            switch it on.
          </p>
          <div className="watches">
            {result.watches.map((w) => (
              <label key={w.id} className={`watch ${chosen.has(w.id) ? "on" : ""}`}>
                <input
                  type="checkbox"
                  checked={chosen.has(w.id)}
                  onChange={() =>
                    setChosen((prev) => {
                      const next = new Set(prev);
                      if (next.has(w.id)) next.delete(w.id);
                      else next.add(w.id);
                      return next;
                    })
                  }
                />
                <span className="watch-body">
                  <strong>{w.label}</strong>
                  <span className="rationale">{w.rationale}</span>
                  {w.impactNote && <span className="impact">{w.impactNote}</span>}
                  <span className="sources">
                    {w.sources.slice(0, 3).map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                    ))}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {error && <p className="err">{error}</p>}
        <div className="wiz-actions">
          <button className="btn-amber" onClick={finish} disabled={busy}>
            {busy ? "Saving…" : `Put ${chosen.size} alert${chosen.size === 1 ? "" : "s"} on the radar`}
          </button>
        </div>
      </main>
    );
  }

  // ---------- the questions ----------
  const steps: Array<{ title: string; why: string; body: React.ReactNode; ready: boolean }> = [
    {
      title: "What are you selling?",
      why: "The name and a plain description are what we match against CBP's published rulings.",
      ready: draft.name.trim().length > 1,
      body: (
        <>
          <label>
            <span>Product name</span>
            <input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} autoFocus placeholder="GlowPals LED Night Light" />
          </label>
          <label>
            <span>Describe it like you would to a friend</span>
            <textarea className="input" rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Silicone tap-activated night light for kids, rechargeable battery" />
          </label>
        </>
      ),
    },
    {
      title: "What's it made of?",
      why: "Materials decide whether chemical and labeling rules come into play.",
      ready: true,
      body: (
        <label>
          <span>Main materials, separated by commas</span>
          <input className="input" value={draft.materials} onChange={(e) => set("materials", e.target.value)} placeholder="silicone, ABS plastic, steel" />
        </label>
      ),
    },
    {
      title: "Who uses it?",
      why: "Products for children carry an entirely separate set of federal requirements.",
      ready: draft.audience !== "",
      body: (
        <div className="choices">
          {(["adults", "kids", "both"] as const).map((a) => (
            <button key={a} type="button" className={`choice ${draft.audience === a ? "on" : ""}`} onClick={() => set("audience", a)}>
              {a === "adults" ? "Adults" : a === "kids" ? "Children" : "Both"}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Does it have a battery or plug in?",
      why: "Batteries bring transport rules; anything powered can bring FCC requirements.",
      ready: true,
      body: (
        <div className="toggles">
          <label className="toggle">
            <input type="checkbox" checked={draft.hasBattery} onChange={(e) => set("hasBattery", e.target.checked)} />
            <span>It has a battery</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={draft.hasPlug} onChange={(e) => set("hasPlug", e.target.checked)} />
            <span>It plugs into mains power</span>
          </label>
        </div>
      ),
    },
    {
      title: "Where's it made, and roughly how much do you import?",
      why: "Country of origin drives extra tariffs. The value is only used to estimate what a rule change costs you - leave it blank if you'd rather not say.",
      ready: true,
      body: (
        <>
          <label>
            <span>Country of manufacture</span>
            <select className="input" value={draft.originCountry} onChange={(e) => set("originCountry", e.target.value)}>
              <option value="">Choose…</option>
              {ORIGINS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <label>
            <span>Roughly, yearly import value in dollars (optional)</span>
            <input className="input" type="number" min="0" value={draft.annualImportValue} onChange={(e) => set("annualImportValue", e.target.value)} placeholder="120000" />
          </label>
        </>
      ),
    },
  ];

  const current = steps[step]!;

  return (
    <main className="wiz">
      <div className="stamps" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((_, i) => <span key={i} className={`stamp ${i < step ? "done" : i === step ? "now" : ""}`} />)}
      </div>

      <p className="label">Product Passport &middot; step {step + 1} of {steps.length}</p>
      <h1>{current.title}</h1>
      <div className="fields">{current.body}</div>
      <p className="why">{current.why}</p>

      {error && <p className="err">{error}</p>}

      <div className="wiz-actions">
        {step > 0 && (
          <button type="button" className="btn-ghost" onClick={() => setStep((s) => (s - 1) as Step)} disabled={busy}>
            Back
          </button>
        )}
        {step < LAST_STEP ? (
          <button type="button" className="btn-amber" onClick={() => setStep((s) => (s + 1) as Step)} disabled={!current.ready}>
            Continue
          </button>
        ) : (
          <button type="button" className="btn-amber" onClick={submit} disabled={busy}>
            {busy ? "Checking CBP rulings…" : "Get my passport"}
          </button>
        )}
      </div>
      {busy && <p className="hint">Searching CBP&apos;s published rulings - takes a few seconds.</p>}
    </main>
  );
}
