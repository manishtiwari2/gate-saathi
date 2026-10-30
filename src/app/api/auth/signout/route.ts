import { cookies } from "next/headers";
import { ok } from "@/lib/api";
import { DEV_LOGIN_COOKIE, createSupabaseServerClient, isSupabaseAuthEnabled } from "@/lib/auth";

export async function POST() {
  (await cookies()).delete(DEV_LOGIN_COOKIE);
  if (isSupabaseAuthEnabled()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  return ok({ signedOut: true });
}
