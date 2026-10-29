import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, fail, parsePagination } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const { page, pageSize } = parsePagination(sp, 50);

  const branch = sp.get("branch");
  const subject = sp.get("subject");
  const topic = sp.get("topic");
  const year = sp.get("year");
  const sortDir = sp.get("sortDir") === "asc" ? "asc" : "desc";

  const where: Prisma.QuestionWhereInput = {};
  if (branch) where.branchCode = branch.toLowerCase();
  if (subject) where.subjectName = subject;
  if (topic) where.topicName = topic;
  if (year) {
    if (!/^\d{4}$/.test(year)) return fail(400, "BAD_REQUEST", "year must be a 4-digit year");
    where.year = Number(year);
  }

  const [totalCount, found] = await Promise.all([
    db.question.count({ where }),
    db.question.findMany({
      where,
      // Paper order: by year (sortDir), then session and question number.
      orderBy: [{ year: sortDir }, { session: "asc" }, { questionNumber: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  // questionNumber is stored as text, so the DB sorts "10" before "9"; fix
  // that within the page (a subject's questions fit in one page).
  const rows = [...found].sort(
    (a, b) =>
      (sortDir === "asc" ? 1 : -1) * ((a.year ?? 0) - (b.year ?? 0)) ||
      (a.session ?? "").localeCompare(b.session ?? "") ||
      (Number(a.questionNumber) || 0) - (Number(b.questionNumber) || 0),
  );

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
