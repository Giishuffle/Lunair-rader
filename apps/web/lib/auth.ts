import NextAuth, { type NextAuthConfig } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import { schema } from "@lunair/core";
import { db } from "./db";
import { sendMagicLink } from "./email";

/**
 * Sign-in: passwordless magic link, plus Google once credentials exist.
 *
 * Providers are registered conditionally so the app runs before every account is
 * set up. Without RESEND_API_KEY the magic link prints to the server console,
 * which is a complete local sign-in flow with no third-party dependency.
 */

const providers: NextAuthConfig["providers"] = [
  {
    id: "email",
    type: "email",
    name: "Email",
    from: process.env.EMAIL_FROM ?? "Lunair World <tide@mail.lunair-world.com>",
    maxAge: 15 * 60, // a sign-in link is good for 15 minutes
    options: {},
    async sendVerificationRequest({ identifier, url }) {
      await sendMagicLink(identifier, url);
    },
  },
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Same email arriving by link or by Google resolves to one account.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

/**
 * Built lazily, per request. Constructing the Drizzle adapter needs a database
 * URL, and doing that at module scope made merely *importing* this file require
 * one - which broke `next build`, since collecting page data evaluates route
 * modules with no runtime environment.
 */
export function buildAuthConfig(): NextAuthConfig {
  return {
    adapter: DrizzleAdapter(db(), {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    providers,
    session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
    pages: {
      signIn: "/signin",
      verifyRequest: "/signin/check-email",
      error: "/signin",
    },
    callbacks: {
      /**
       * Return only what the UI needs. The adapter hands us the whole user row,
       * and /api/auth/session is readable by the browser - Stripe ids, the
       * Telegram chat id and other internals have no business going over the wire.
       */
      session({ session, user }) {
        const u = user as typeof user & { plan?: string; isAdmin?: boolean };
        session.user = {
          id: user.id,
          email: user.email,
          name: u.name ?? null,
          image: u.image ?? null,
          plan: u.plan ?? "harbor",
          isAdmin: Boolean(u.isAdmin),
        } as typeof session.user;
        return session;
      },
    },
    trustHost: true,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth(() =>
  buildAuthConfig(),
);
