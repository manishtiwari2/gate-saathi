import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { gradeAnswer, MARKS_TO_ALL, PAPER_OPTIONS } from "@/lib/grading";

const schema = z.object({
  section: z.enum(["GA", "CS"]),
  number: z.number().int().min(1).max(65),
  answer: z.string().trim().min(1).max(64),
});

/**
 * Practice mode: check one answer against the official key. The key is
 * revealed only in this response, after the student has answered.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit("paper-check", clientIp(req), 120, 60_000);
  if (limited) return limited;

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(400, "BAD_REQUEST", "section, number and answer are required");
  const { section, number, answer } = parsed.data;

  const q = await db.officialQuestion.findUnique({
    where: { paperId_section_number: { paperId: id, section, number } },
  });
  if (!q) return fail(404, "NOT_FOUND", "No official answer key for this question");

  const isCorrect = gradeAnswer({ questionType: q.type, options: PAPER_OPTIONS, correctAnswer: q.key }, answer);
  if (isCorrect === null) return fail(500, "BAD_KEY", "This question's key couldn't be read");
  const marksToAll = q.key === MARKS_TO_ALL;
  return ok({
    success: true,
    data: { isCorrect, key: marksToAll ? null : q.key, marksToAll, marks: q.marks, type: q.type },
  });
}
