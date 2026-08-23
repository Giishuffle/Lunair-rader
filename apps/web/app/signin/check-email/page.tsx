import type { Metadata } from "next";
import Link from "next/link";
import "../signin.css";

export const metadata: Metadata = {
  title: "Check your email - Lunair World",
  robots: { index: false, follow: false },
};

export default function CheckEmailPage() {
  return (
    <main className="signin">
      <div className="signin-card">
        <p className="label">Lunair World</p>
        <h1>Check your email</h1>
        <p className="sub">
          We sent you a sign-in link. It works once and expires in 15 minutes. You can close
          this tab - open the link on any device.
        </p>
        <p className="fine">
          Nothing arrived? Check spam, then <Link href="/signin">request another link</Link>.
        </p>
      </div>
    </main>
  );
}
