import { db } from "@/lib/db";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  plan: string;
  isPremium: boolean;
}

/**
 * Returns the signed-in user, or null.
 *
 * Auth wiring lands in the auth slice; until then this resolves the dev user
 * when dev login is enabled, so authenticated flows can be exercised locally.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (process.env.ENABLE_DEV_LOGIN !== "true") return null;

  const email = "dev@gate-saathi.local";
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: "Dev User", username: "dev" },
  });
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    plan: user.plan,
    isPremium: user.plan === "premium",
  };
}
