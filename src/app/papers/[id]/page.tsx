import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Kicker } from "@/components/ui";
import { getPaperSheet, paperTitle } from "@/lib/papers";
import { PaperViewer } from "@/components/papers/PaperViewer";
import { PaperPractice } from "@/components/papers/PaperPractice";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const sheet = await getPaperSheet((await params).id);
  return { title: sheet ? `${paperTitle(sheet.paper)} Question Paper` : "GATE paper" };
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const sheet = await getPaperSheet((await params).id);
  if (!sheet) notFound();
  const { paper, questions } = sheet;
  const title = paperTitle(paper);
  const keyed = paper.keyStatus === "official";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-[var(--muted)]">
        <Link href="/papers" className="hover:text-[var(--foreground)]">
          Official papers
        </Link>{" "}
        / <span className="text-[var(--foreground)]">{title}</span>
      </nav>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>{keyed ? "Practice · official answer key" : "Question paper"}</Kicker>
          <h1 className="mt-2 font-display text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {[paper.institute && `Organised by ${paper.institute}`, paper.source].filter(Boolean).join(" · ")}
          </p>
        </div>
        {keyed && (
          <Link
            href={`/papers/${paper.id}/mock`}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
          >
            Take as a timed 3-hour mock
          </Link>
        )}
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <PaperViewer pdfPath={paper.pdfPath} title={title} />
        {keyed ? (
          <PaperPractice paperId={paper.id} questions={questions} continuous={paper.numbering === "continuous"} />
        ) : (
          <Card>
            <p className="font-medium">The official answer key for this paper hasn&apos;t been added yet.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              You can read and attempt the paper now. Once its official key is added, you&apos;ll be able to
              check your answers here and take it as a timed mock.
            </p>
            <p className="mt-4 text-sm">
              <Link href="/papers" className="text-[var(--accent)] hover:underline">
                See papers that already have a key →
              </Link>
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
