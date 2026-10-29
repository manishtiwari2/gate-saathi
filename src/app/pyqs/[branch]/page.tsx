import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getBranch, BRANCH_CODES } from "@/lib/branches";
import { Kicker } from "@/components/ui";
import { SubjectPicker } from "@/components/pyq/SubjectPicker";

export function generateStaticParams() {
  return BRANCH_CODES.map((branch) => ({ branch }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string }>;
}): Promise<Metadata> {
  const { branch } = await params;
  const b = getBranch(branch);
  if (!b) return { title: "GATE PYQs" };
  return {
    title: `GATE ${b.code.toUpperCase()} PYQs: ${b.displayName} Previous Year Questions`,
    description: `Previous-year GATE questions for ${b.displayName}, organized by subject and topic.`,
  };
}

export default async function BranchPyqPage({
  params,
  searchParams,
}: {
  params: Promise<{ branch: string }>;
  searchParams: Promise<{ subject?: string }>;
}) {
  const { branch } = await params;
  const { subject } = await searchParams;
  const b = getBranch(branch);
  if (!b) notFound();

  const subjects = await db.subject.findMany({
    where: { branchCode: b.code },
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { questions: true, topics: true } } },
  });

  const subjectItems = subjects
    .filter((s) => s._count.questions > 0)
    .map((s) => ({
      subjectName: s.name,
      displayName: s.displayName,
      questionCount: s._count.questions,
      topicCount: s._count.topics,
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <nav className="text-sm text-[var(--muted)]">
        <Link href="/pyqs" className="hover:text-[var(--foreground)]">
          PYQs
        </Link>{" "}
        / <span className="text-[var(--foreground)]">{b.displayName}</span>
      </nav>

      <header className="mt-4">
        <Kicker>{b.code.toUpperCase()} · Previous-year questions</Kicker>
        <h1 className="mt-2 font-display text-4xl">{b.displayName}</h1>
        {b.note && <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">{b.note}</p>}
      </header>

      <div className="mt-10">
        {subjectItems.length === 0 ? (
          <p className="text-[var(--muted)]">No questions available for this branch yet.</p>
        ) : (
          <SubjectPicker branchCode={b.code} subjects={subjectItems} initialSubject={subject} />
        )}
      </div>
    </div>
  );
}
