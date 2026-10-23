import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await db.question.findUnique({
    where: { id },
    include: { branch: true },
  });
  if (!q) return fail(404, "NOT_FOUND", "Question not found");

  // Correct answer is intentionally omitted — grading happens via /attempts,
  // mirroring the reference API.
  return ok({
    id: q.id,
    questionId: q.sourceId,
    branchCode: q.branchCode.toUpperCase(),
    branchName: q.branch.name,
    exam: "GATE",
    year: q.year,
    session: q.session,
    questionNumber: q.questionNumber,
    subjectName: q.subjectName,
    topicName: q.topicName,
    questionType: q.questionType,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    difficulty: q.difficulty,
    questionText: q.questionText,
    questionHtml: q.questionHtml,
    options: JSON.parse(q.options) as string[],
    answerVerified: q.answerVerified,
  });
}
