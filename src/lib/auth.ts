import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User as AuthUser } from "@supabase/supabase-js";
import { db } from "@/lib/db";

/**
 * Sign-in is Supabase Auth (Google and GitHub, enabled in the Supabase
 * dashboard). Supabase only proves who the person is; the app's own User
 * row, matched by verified email, holds everything else (plan, goals...).
 */
export function isSupabaseAuthEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

// Local dev login (no external service). It accepts any email with no password,
// so it is never available in production, whatever ENABLE_DEV_LOGIN says.
export const isDevLoginEnabled =
  process.env.ENABLE_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

export const DEV_LOGIN_COOKIE = "gs-dev-login";

/**
 * Supabase client bound to this request's cookies. Server components can't
 * set cookies, so refreshed tokens are written by the middleware instead.
 */
export async function createSupabaseServerClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a server component; the middleware refreshes the session.
        }
      },
    },
  });
}

/** The signed-in person's verified email, or null. */
export async function getSignedInEmail(): Promise<string | null> {
  if (isDevLoginEnabled) {
    const dev = (await cookies()).get(DEV_LOGIN_COOKIE)?.value;
    if (dev) return dev;
  }
  if (!isSupabaseAuthEnabled()) return null;

  // getUser() checks the token with Supabase, unlike getSession().
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return verifiedEmail(data.user);
}

/** Only a verified email may identify a User row. */
export function verifiedEmail(user: AuthUser | null | undefined): string | null {
  if (!user?.email || !user.email_confirmed_at) return null;
  return user.email.trim().toLowerCase();
}

/** Create the app's User row on first sign-in; refresh the avatar after that. */
export async function syncUserFromAuth(user: AuthUser) {
  const email = verifiedEmail(user);
  if (!email) return null;
  const meta = user.user_metadata ?? {};
  const name = [meta.full_name, meta.name, meta.user_name].find((v) => typeof v === "string" && v.trim());
  const avatar = typeof meta.avatar_url === "string" ? meta.avatar_url : undefined;
  return db.user.upsert({
    where: { email },
    // Never overwrite a display name the user edited.
    update: avatar ? { avatarUrl: avatar } : {},
    create: { email, displayName: (name as string | undefined)?.trim() ?? email.split("@")[0], avatarUrl: avatar },
  });
}
