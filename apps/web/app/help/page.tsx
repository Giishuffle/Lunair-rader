import type { Metadata } from "next";
import Link from "next/link";
import "../pricing/pricing.css";

export const metadata: Metadata = {
  title: "Help",
  description: "How Lunair World works, what it does not do, and how to reach a person.",
};

const FAQ: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "Does this tell me whether I'm compliant?",
    a: (
      <>
        No, and it is worth being blunt about that. We show which US import requirements
        <em> appear to apply</em> to a product you describe, and we cite the regulation or
        ruling behind each one so you can check us. Whether a specific shipment satisfies
        those requirements is a judgement about your goods, your paperwork and your entry -
        that belongs to a licensed customs broker. We are the radar, not the sign-off.
      </>
    ),
  },
  {
    q: "Where does the information come from?",
    a: (
      <>
        Official US government sources only: CBP&apos;s published rulings, the Harmonized
        Tariff Schedule, the Federal Register, CPSC recalls, and the eCFR - the regulations
        themselves. Every requirement we show links its own source. Nothing is scraped from
        a blog or another vendor, and we do not show you anything we cannot cite.
      </>
    ),
  },
  {
    q: "How do you decide which rules apply to my product?",
    a: (
      <>
        From what you tell us, not from the tariff code alone. The code identifies the
        customs universe, but most safety obligations turn on what the product actually is -
        who it is for, what is in it, whether it has a battery or a radio, how it is
        marketed. That is why the questions are about the product rather than about customs.
        Where we have not asked something that matters, we show the requirement as
        conditional rather than hiding it.
      </>
    ),
  },
  {
    q: "How often do you check?",
    a: (
      <>
        Government sources are polled hourly to daily depending on how fast each one moves,
        and the regulations behind your requirements are re-read every day. You hear from us
        when something changes, not on a schedule - so quiet means nothing moved, not that
        nothing is running.
      </>
    ),
  },
  {
    q: "Can I cancel? Can I get a refund?",
    a: (
      <>
        Cancel yourself at any time in <Link href="/app/settings">account settings</Link>,
        through Stripe&apos;s billing portal - no email required, no retention call. You keep
        access until the end of the period you paid for. Within 14 days of a new
        subscription we refund in full, no questions asked: email us and we do it.
      </>
    ),
  },
  {
    q: "Can I delete my account and get my data?",
    a: (
      <>
        Both, from <Link href="/app/settings">account settings</Link>, on every plan
        including the free one. Download gives you everything we hold as a JSON file.
        Deleting removes your products, watches, alert history and your address from our
        mailing list, and cannot be undone. Cancel a paid subscription first - deleting your
        account here does not stop a Stripe subscription.
      </>
    ),
  },
  {
    q: "An alert looks wrong. What do I do?",
    a: (
      <>
        Tell us - that is the most useful email you can send, and we would rather hear it
        than not. Include the product and what looked off. If we surfaced a rule that does
        not reach your product, that is a bug in how we scoped it and we will fix the rule
        itself, not just your account.
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <main className="pricing" style={{ maxWidth: 760 }}>
      <header className="pricing-top">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Lunair World
        </Link>
        <Link href="/pricing" className="linkish">Pricing</Link>
      </header>

      <div className="pricing-head" style={{ textAlign: "left", margin: "0 0 32px" }}>
        <p className="label">Help</p>
        <h1>How this works, and how to reach us</h1>
        <p className="sub">
          One inbox, read by a person:{" "}
          <a href="mailto:guy@wershuffle.com" style={{ color: "var(--amber-2)" }}>
            guy@wershuffle.com
          </a>
          . No ticket numbers, no bot.
        </p>
      </div>

      <dl style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {FAQ.map(({ q, a }) => (
          <div key={q}>
            <dt style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{q}</dt>
            <dd style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.65, fontSize: 15 }}>{a}</dd>
          </div>
        ))}
      </dl>

      <p className="pricing-disclaimer" style={{ textAlign: "left", marginLeft: 0 }}>
        Lunair World is an informational monitoring service built on official US government
        sources. It is not legal, customs-brokerage, or professional advice - always verify
        decisions with your licensed customs broker. A Wershuffle Inc product.
      </p>
    </main>
  );
}
