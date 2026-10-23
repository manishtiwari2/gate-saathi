import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  return ok({
    user: {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      username: user.username,
      hasUsername: Boolean(user.username),
      daily_goal_minutes: user.dailyGoalMin,
      timezone: user.timezone,
      plan: user.plan,
      isPremium: user.isPremium,
    },
    subscription: user.isPremium ? { plan: user.plan } : null,
    isPremium: user.isPremium,
  });
}
