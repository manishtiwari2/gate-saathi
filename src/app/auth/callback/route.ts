import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseAuthEnabled, syncUserFromAuth } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/utils";

/**
 * Supabase sends the browser here after Google/GitHub sign-in. Swap the
 * one-time code for a session (cookies), make sure the User row exists,
 * then return to the page the user came from.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeCallbackUrl(url.searchParams.get("next") ?? undefined);
  const failed = NextResponse.redirect(new URL("/login?error=signin", url.origin));

  if (!code || !isSupabaseAuthEnabled()) return failed;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return failed;

  const user = await syncUserFromAuth(data.user);
  if (!user) {
    // No verified email from the provider: don't keep a session we can't use.
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=email", url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
