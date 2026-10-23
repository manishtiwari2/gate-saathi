import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const branchCode = code.toLowerCase();

  const branch = await db.branch.findUnique({ where: { code: branchCode } });
  if (!branch) return fail(404, "NOT_FOUND", "Branch not found");

  const subjects = await db.subject.findMany({
    where: { branchCode },
    orderBy: { displayOrder: "asc" },
    include: {
      topics: { include: { _count: { select: { questions: true } } } },
      _count: { select: { questions: true } },
    },
  });

  return ok({
    branch: { branchName: branch.name, displayName: branch.displayName },
    total: subjects.length,
    subjects: subjects.map((s) => ({
      subjectName: s.name,
      displayName: s.displayName,
      displayOrder: s.displayOrder,
      questionCount: s._count.questions,
      topicCount: s.topics.length,
      topics: s.topics.map((t) => ({
        topicName: t.name,
        displayName: t.name,
        questionCount: t._count.questions,
      })),
    })),
  });
}
