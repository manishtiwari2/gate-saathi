import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { scorePaper, questionId, MARKS_TO_ALL } from "@/lib/grading";
import { PAPER_MINUTES } from "@/lib/papers";

const schema = z.object({
  mode: z.enum(["practice", "mock"]),
  answers: z.record(z.string().regex(/^(GA|CS)-\d{1,2}$/), z.string().max(64)),
  durationSec: z.number().int().min(0).max(PAPER_MINUTES * 60 + 300).optional(),
});

/**
 * Score a whole paper with GATE's marking scheme and return the key for the
 * review. Signed-in students' attempts are saved.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit("paper-submit", clientIp(req), 20, 60 * 60_000);
  if (limited) return limited;

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(400, "BAD_REQUEST", "Invalid answers");

  const paper = await db.officialPaper.findUnique({ where: { id }, include: { questions: true } });
  if (!paper) return fail(404, "NOT_FOUND", "Paper not found");
  if (paper.keyStatus !== "official" || paper.questions.length === 0) {
    return fail(409, "NO_KEY", "This paper doesn't have an official answer key yet");
  }

  const result = scorePaper(paper.questions, parsed.data.answers);

  const user = await getCurrentUser();
  if (user) {
    await db.paperAttempt
      .create({
        data: {
          userId: user.id,
          paperId: id,
          mode: parsed.data.mode,
          answers: JSON.stringify(parsed.data.answers),
          score: result.score,
          maxScore: result.maxScore,
          correct: result.correct,
          wrong: result.wrong,
          unanswered: result.unanswered,
          durationSec: parsed.data.durationSec ?? null,
        },
      })
      .catch((e) => console.error("Failed to save paper attempt", e));
  }

  const keys = Object.fromEntries(
    paper.questions.map((q) => [questionId(q), q.key === MARKS_TO_ALL ? "Marks to all" : q.key]),
  );
  return ok({ success: true, data: { ...result, keys, saved: Boolean(user) } });
}
