import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { answerDoubt } from "@/lib/anthropic";

const DAILY_FREE_LIMIT = 5;

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

  // Enforce the free daily limit before doing any work.
  const startOfToday = new Date(new Date().toISOString().slice(0, 10));
  let remaining: number | null = null;
  if (!user.isPremium) {
    const usedToday = await db.doubtQuery.count({
      where: { userId: user.id, createdAt: { gte: startOfToday } },
    });
    if (usedToday >= DAILY_FREE_LIMIT) {
      return fail(402, "LIMIT_REACHED", "Daily free limit reached. Upgrade to Premium for unlimited doubts.");
    }
    remaining = DAILY_FREE_LIMIT - usedToday - 1;
  }

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

  await db.doubtQuery.create({
    data: {
      userId: user.id,
      question: parsed.data.question,
      branch: parsed.data.branch ?? null,
      subject: parsed.data.subject ?? null,
      answer: result.answer,
      model: result.model,
    },
  });

  return ok({ available: true, answer: result.answer, model: result.model, remaining });
}
