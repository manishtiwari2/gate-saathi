import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

/**
 * Topic mastery heatmap. Premium-gated, mirroring the reference (HTTP 402 for
 * free accounts).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Not signed in");
  if (!user.isPremium) {
    return fail(402, "PAYMENT_REQUIRED", "The topic heatmap is a Premium feature");
  }

  const attempts = await db.questionAttempt.findMany({
    where: { userId: user.id },
    include: { question: { select: { subjectName: true, topicName: true } } },
  });

  const cells = new Map<string, { attempted: number; correct: number }>();
  for (const a of attempts) {
    const key = `${a.question.subjectName}::${a.question.topicName ?? "General"}`;
    const cell = cells.get(key) ?? { attempted: 0, correct: 0 };
    cell.attempted++;
    if (a.isCorrect) cell.correct++;
    cells.set(key, cell);
  }

  return ok({
    heatmap: [...cells.entries()].map(([key, v]) => {
      const [subject, topic] = key.split("::");
      return { subject, topic, attempted: v.attempted, correct: v.correct, accuracy: v.attempted ? Math.round((v.correct / v.attempted) * 100) : 0 };
    }),
  });
}
