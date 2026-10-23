import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  questionId: z.string().min(1),
  selectedAnswer: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON body");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "BAD_REQUEST", "Missing required fields: questionId and selectedAnswer");
  }

  const q = await db.question.findUnique({ where: { id: parsed.data.questionId } });
  if (!q) return fail(404, "NOT_FOUND", "Question not found");

  // Without a verified key we cannot grade reliably; report that explicitly
  // instead of guessing.
  if (!q.correctAnswer) {
    return ok({ success: true, graded: false, reason: "answer_unverified" });
  }

  const isCorrect = parsed.data.selectedAnswer.trim() === q.correctAnswer.trim();

  // Persist the attempt for signed-in users (powers heatmap/progress later).
  const user = await getCurrentUser();
  if (user) {
    await db.questionAttempt.create({
      data: {
        userId: user.id,
        questionId: q.id,
        selectedAnswer: parsed.data.selectedAnswer,
        isCorrect,
      },
    });
  }

  return ok({ success: true, data: { success: true, graded: true, isCorrect } });
}
