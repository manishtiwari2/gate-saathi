import { ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

/** Who is signed in, for the nav. Null (not 401) when nobody is. */
export async function GET() {
  const user = await getCurrentUser();
  return ok(
    { user: user && { id: user.id, name: user.displayName, avatarUrl: user.avatarUrl, plan: user.plan } },
    { headers: { "cache-control": "no-store" } },
  );
}
