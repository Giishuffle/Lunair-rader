import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import "../app/app.css";

/**
 * Everything under /admin requires an admin session.
 *
 * A plain 404 rather than a 403: an admin console that announces its own
 * existence to every signed-in user is an invitation to go looking.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin");
  if (!session.user.isAdmin) redirect("/app");

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/admin" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Lunair admin
        </Link>
        <nav>
          <Link href="/admin" className="linkish">Review</Link>
          <Link href="/app" className="linkish">Back to app</Link>
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
