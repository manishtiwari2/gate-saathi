import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, parsePagination } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const { page, pageSize } = parsePagination(sp, 50);

  const branch = sp.get("branch");
  const subject = sp.get("subject");
  const topic = sp.get("topic");
  const year = sp.get("year");
  const sortBy = sp.get("sortBy") === "year" ? "year" : "questionNumber";
  const sortDir = sp.get("sortDir") === "asc" ? "asc" : "desc";

  const where: Prisma.QuestionWhereInput = {};
  if (branch) where.branchCode = branch.toLowerCase();
  if (subject) where.subjectName = subject;
  if (topic) where.topicName = topic;
  if (year) where.year = Number(year);

  const [totalCount, rows] = await Promise.all([
    db.question.count({ where }),
    db.question.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok({
    data: rows.map((q) => ({
      id: q.id,
      questionId: q.sourceId,
      questionNumber: q.questionNumber,
      subjectName: q.subjectName,
      topicName: q.topicName,
      questionType: q.questionType,
      marks: q.marks,
      difficulty: q.difficulty,
      year: q.year,
      session: q.session,
      questionText: q.questionText,
      questionHtml: q.questionHtml,
      options: JSON.parse(q.options) as string[],
      answerVerified: q.answerVerified,
    })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      hasMore: page * pageSize < totalCount,
    },
  });
}
