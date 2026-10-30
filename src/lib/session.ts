import { cache } from "react";
import { getSignedInEmail } from "@/lib/auth";
import { db } from "@/lib/db";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  dailyGoalMin: number;
  timezone: string;
  plan: string;
  isPremium: boolean;
}

/**
 * Returns the signed-in user (from the DB), or null. Cached per request, so
 * the auth check runs once however many times it is called.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const email = await getSignedInEmail();
  if (!email) return null;

  // The row is created at sign-in (/auth/callback, dev login).
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    dailyGoalMin: user.dailyGoalMin,
    timezone: user.timezone,
    plan: user.plan,
    isPremium: user.plan === "premium",
  };
});

/** Throws a 401-style sentinel when there is no user; use in route handlers. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
