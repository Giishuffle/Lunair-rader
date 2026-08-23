import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import "./signin.css";

export const metadata: Metadata = {
  title: "Sign in - Lunair World",
  description: "Sign in to your Lunair World radar.",
};

const ERRORS: Record<string, string> = {
  Verification: "That link has already been used or has expired. Request a new one below.",
  OAuthAccountNotLinked: "That email is already registered with a different sign-in method. Use the email link instead.",
  Default: "Something went wrong signing you in. Try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/app");

  const { error, callbackUrl } = await searchParams;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="signin">
      <div className="signin-card">
        <p className="label">Lunair World</p>
        <h1>Sign in</h1>
        <p className="sub">
          No password. We email you a link that signs you in and expires in 15 minutes.
        </p>

        {error && <p className="signin-error">{ERRORS[error] ?? ERRORS.Default}</p>}

        <form
          action={async (formData: FormData) => {
            "use server";
            const email = String(formData.get("email") ?? "").trim().toLowerCase();
            await signIn("email", { email, redirectTo: callbackUrl ?? "/app" });
          }}
        >
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@yourbrand.com"
          />
          <button className="btn-amber" type="submit">
            Email me a sign-in link
          </button>
        </form>

        {googleEnabled && (
          <>
            <div className="divider"><span>or</span></div>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: callbackUrl ?? "/app" });
              }}
            >
              <button className="btn-ghost" type="submit">Continue with Google</button>
            </form>
          </>
        )}

        <p className="fine">
          By signing in you agree to our <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
