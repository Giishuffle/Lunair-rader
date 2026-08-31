import { auth } from "@/lib/auth";
import { collectAccountData } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Data portability. Ungated on purpose: this is a legal right, not a plan
 * feature, so the free tier gets it too.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Sign in first", { status: 401 });

  const data = await collectAccountData(session.user.id);
  const filename = `lunair-account-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store, private",
    },
  });
}
