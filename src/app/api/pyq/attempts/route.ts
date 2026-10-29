import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { gradeAnswer } from "@/lib/grading";

const schema = z.object({
  questionId: z.string().min(1),
  selectedAnswer: z.string().min(1).max(64),
});

export async function POST(req: Request) {
  // Grading reveals correctness, so throttle it to stop answer-key scraping.
  const limited = await rateLimit("pyq-attempt", clientIp(req), 30, 60_000);
  if (limited) return limited;

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

  // Without a usable verified key we cannot grade reliably; report that
  // explicitly instead of guessing. Ungraded attempts are not stored, since
  // they would count as wrong in accuracy stats.
  const isCorrect = q.correctAnswer
    ? gradeAnswer({ questionType: q.questionType, options: JSON.parse(q.options) as string[], correctAnswer: q.correctAnswer }, parsed.data.selectedAnswer)
    : null;
  if (isCorrect === null) {
    return ok({ success: true, data: { graded: false, reason: "answer_unverified" } });
  }

  // Persist the attempt for signed-in users (powers heatmap/progress).
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

  return ok({ success: true, data: { graded: true, isCorrect } });
}
