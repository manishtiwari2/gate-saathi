import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { answerDoubt } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";

const DAILY_FREE_LIMIT = 5;
// Premium is "unlimited" for students, but a hard ceiling keeps spend bounded.
const DAILY_PREMIUM_LIMIT = 100;

// One doubt in flight per user. Without this, parallel requests all read the
// same "used today" count before any of them is saved and slip past the limit.
// (In-process, like presence: assumes a single Node instance.)
const inFlight = new Set<string>();

const schema = z.object({
  question: z.string().min(3).max(4000),
  branch: z.string().max(8).optional(),
  subject: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Sign in to ask a doubt");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail(400, "BAD_REQUEST", "A question is required");

  const limited = rateLimit("ai-doubt", user.id, 10, 60_000);
  if (limited) return limited;

  if (inFlight.has(user.id)) {
    return fail(429, "IN_PROGRESS", "Your previous doubt is still being answered.");
  }
  inFlight.add(user.id);
  try {
    // Enforce the daily limit before doing any work.
    const startOfToday = new Date(new Date().toISOString().slice(0, 10));
    const usedToday = await db.doubtQuery.count({
      where: { userId: user.id, createdAt: { gte: startOfToday } },
    });
    const limit = user.isPremium ? DAILY_PREMIUM_LIMIT : DAILY_FREE_LIMIT;
    if (usedToday >= limit) {
      return user.isPremium
        ? fail(429, "LIMIT_REACHED", "You have reached today's doubt limit. It resets tomorrow.")
        : fail(402, "LIMIT_REACHED", "Daily free limit reached. Upgrade to Premium for unlimited doubts.");
    }
    const remaining = user.isPremium ? null : limit - usedToday - 1;

    let result;
    try {
      result = await answerDoubt(parsed.data);
    } catch {
      return fail(502, "AI_ERROR", "The AI tutor is temporarily unavailable. Please try again.");
    }

    // Not configured → tell the client to show the coming-soon state.
    if (!result.available) {
      return ok({ available: false });
    }

    // The answer has been paid for; still return it if saving fails.
    await db.doubtQuery
      .create({
        data: {
          userId: user.id,
          question: parsed.data.question,
          branch: parsed.data.branch ?? null,
          subject: parsed.data.subject ?? null,
          answer: result.answer,
          model: result.model,
        },
      })
      .catch((e) => console.error("Failed to save doubt", e));

    return ok({ available: true, answer: result.answer, model: result.model, remaining });
  } finally {
    inFlight.delete(user.id);
  }
}
