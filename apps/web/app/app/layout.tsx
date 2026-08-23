import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import "./app.css";

/** Everything under /app requires a session. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/app");

  const plan = session.user.plan ?? "harbor";
  const planLabel = { harbor: "Harbor", voyage: "Voyage", fleet: "Fleet", lighthouse: "Lighthouse" }[plan] ?? plan;

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/app" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Lunair World
        </Link>
        <nav>
          <span className="plan-chip">{planLabel}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="linkish">Sign out</button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
