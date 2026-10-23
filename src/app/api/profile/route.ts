import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  username: z.string().min(2).max(30).regex(/^[a-z0-9_]+$/i).optional(),
  dailyGoalMin: z.number().int().min(5).max(1440).optional(),
  timezone: z.string().max(64).optional(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(400, "BAD_REQUEST", "Invalid fields");

  // Username must be unique.
  if (parsed.data.username) {
    const taken = await db.user.findFirst({
      where: { username: parsed.data.username, NOT: { id: user.id } },
    });
    if (taken) return fail(409, "CONFLICT", "That username is taken");
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  return ok({
    user: {
      id: updated.id,
      display_name: updated.displayName,
      username: updated.username,
      daily_goal_minutes: updated.dailyGoalMin,
      timezone: updated.timezone,
    },
  });
}
