/**
 * Five-year scenario model for the partner pitch.
 *
 * Monthly cohort mechanics: subs(t+1) = subs(t) * (1 - churn) + new(t).
 * That compounding is the whole point - it is why a constant "new customers per
 * month" converges on new/churn rather than growing forever, and why churn is
 * the most valuable lever in the business.
 *
 * Run: node scripts/model-scenarios.mjs
 */

const MONTHS = 60;

const SCENARIOS = {
  headwind: {
    label: "Headwind",
    // Competitors squeeze pricing, SEO never compounds, conversion stays weak.
    newPaidPerMonthByYear: [5, 8, 10, 11, 12],
    monthlyChurn: 0.08,
    arpu: 45, // mix skews to the cheapest tier
    adsPerMonthByYear: [400, 400, 400, 400, 400],
    dataReviewPerMonth: 500,
    teamPerMonthByYear: [0, 0, 0, 0, 0],
  },
  plan: {
    label: "On plan",
    newPaidPerMonthByYear: [8, 20, 38, 55, 70],
    monthlyChurn: 0.06, // annual plans pull this down from the 7% base case
    arpu: 50,
    adsPerMonthByYear: [400, 1200, 2200, 3000, 3500],
    dataReviewPerMonth: 500,
    teamPerMonthByYear: [0, 0, 1800, 1800, 3600], // VA from year 3, second from year 5
  },
  tailwind: {
    label: "Tailwind",
    // Partner/white-label tier lands, Asia expansion, category leadership.
    newPaidPerMonthByYear: [12, 40, 90, 150, 220],
    monthlyChurn: 0.045,
    arpu: 65, // mix shifts up: more Fleet, Lighthouse workspaces
    adsPerMonthByYear: [800, 3000, 7000, 12000, 18000],
    dataReviewPerMonth: 1500,
    teamPerMonthByYear: [0, 3000, 8000, 16000, 26000],
  },
};

const STRIPE_RATE = 0.038;
const INFRA_BASE = 250;
const INFRA_PER_SUB = 0.35;
const AI_BASE = 250;
const AI_PER_SUB = 0.6;
const TOOLS = 150;

function run(s) {
  let subs = 0;
  const years = [];

  for (let y = 0; y < 5; y++) {
    let revenue = 0;
    let costs = 0;

    for (let m = 0; m < 12; m++) {
      // Ramp new signups smoothly between year targets instead of stepping.
      const from = y === 0 ? 0 : s.newPaidPerMonthByYear[y - 1];
      const to = s.newPaidPerMonthByYear[y];
      const newPaid = from + ((to - from) * (m + 1)) / 12;

      subs = subs * (1 - s.monthlyChurn) + newPaid;

      const mrr = subs * s.arpu;
      revenue += mrr;

      costs +=
        mrr * STRIPE_RATE +
        INFRA_BASE +
        subs * INFRA_PER_SUB +
        AI_BASE +
        subs * AI_PER_SUB +
        s.adsPerMonthByYear[y] +
        s.dataReviewPerMonth +
        s.teamPerMonthByYear[y] +
        TOOLS;
    }

    years.push({
      year: y + 1,
      endingSubs: Math.round(subs),
      exitMrr: Math.round(subs * s.arpu),
      revenue: Math.round(revenue),
      costs: Math.round(costs),
      profit: Math.round(revenue - costs),
      margin: revenue > 0 ? (revenue - costs) / revenue : 0,
    });
  }
  return years;
}

const fmt = (n) => `$${n.toLocaleString("en-US")}`;

for (const [key, s] of Object.entries(SCENARIOS)) {
  const years = run(s);
  console.log(`\n=== ${s.label} (${key}) - churn ${(s.monthlyChurn * 100).toFixed(1)}%/mo, ARPU $${s.arpu} ===`);
  console.log("Yr  Subs   Exit MRR    Revenue      Costs      Profit   Margin");
  for (const y of years) {
    console.log(
      `${y.year}   ${String(y.endingSubs).padStart(5)}  ${fmt(y.exitMrr).padStart(9)}  ${fmt(y.revenue).padStart(10)}  ${fmt(y.costs).padStart(9)}  ${fmt(y.profit).padStart(10)}   ${(y.margin * 100).toFixed(0)}%`,
    );
  }
  const y5 = years[4];
  console.log(`Year 5 ARR: ${fmt(y5.exitMrr * 12)}  |  steady-state ceiling: ${Math.round(s.newPaidPerMonthByYear[4] / s.monthlyChurn)} subs`);
}

// Sensitivity: what one point of churn is worth in the base case.
console.log("\n=== Churn sensitivity (on-plan scenario, year 5 exit MRR) ===");
for (const churn of [0.04, 0.05, 0.06, 0.07, 0.08]) {
  const years = run({ ...SCENARIOS.plan, monthlyChurn: churn });
  console.log(`  ${(churn * 100).toFixed(0)}% monthly churn -> ${fmt(years[4].exitMrr)} MRR, ${years[4].endingSubs} subs`);
}
