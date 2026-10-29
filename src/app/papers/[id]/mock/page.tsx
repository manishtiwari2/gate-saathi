import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker } from "@/components/ui";
import { getPaperSheet, paperTitle } from "@/lib/papers";
import { getCurrentUser } from "@/lib/session";
import { PaperMock } from "@/components/papers/PaperMock";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const sheet = await getPaperSheet((await params).id);
  return { title: sheet ? `${paperTitle(sheet.paper)} Timed Mock Test` : "GATE mock test" };
}

export default async function PaperMockPage({ params }: { params: Promise<{ id: string }> }) {
  const sheet = await getPaperSheet((await params).id);
  // A mock needs the official key to be scored.
  if (!sheet || sheet.paper.keyStatus !== "official") notFound();
  const { paper, questions } = sheet;
  const user = await getCurrentUser();
  const title = paperTitle(paper);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-[var(--muted)]">
        <Link href="/papers" className="hover:text-[var(--foreground)]">
          Official papers
        </Link>{" "}
        /{" "}
        <Link href={`/papers/${paper.id}`} className="hover:text-[var(--foreground)]">
          {title}
        </Link>{" "}
        / <span className="text-[var(--foreground)]">Timed mock</span>
      </nav>
      <Kicker className="mt-4">Timed mock · GATE marking</Kicker>
      <h1 className="mt-2 mb-6 font-display text-4xl">{title}</h1>
      <PaperMock
        paperId={paper.id}
        title={title}
        pdfPath={paper.pdfPath}
        questions={questions}
        continuous={paper.numbering === "continuous"}
        signedIn={Boolean(user)}
      />
    </div>
  );
}
