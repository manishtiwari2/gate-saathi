import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Kicker } from "@/components/ui";
import { listPapers, paperTitle } from "@/lib/papers";

// Built from the database; refresh hourly so new papers or keys show up
// without a redeploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "GATE CS Previous Year Papers 2007–2026 with Official Answer Keys",
  description:
    "Every official GATE CS question paper from 2007 to 2026. Practise with the official answer key or take a timed 3-hour mock with GATE marking.",
};

export default async function PapersPage() {
  const papers = await listPapers("cs");
  const keyed = papers.filter((p) => p.keyStatus === "official").length;
  const years = [...new Set(papers.map((p) => p.year))];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Kicker>Official papers · Computer Science</Kicker>
      <h1 className="mt-3 font-display text-5xl">
        GATE CS papers{years.length > 0 && `, ${years.at(-1)}–${years[0]}`}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
        The official question papers as published by the organising institutes. Papers with an official
        answer key can be practised with instant checking or taken as a timed 3-hour mock with real GATE
        marking.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {papers.length} papers · {keyed} with an official answer key so far. The others are here to read and
        attempt; their keys will be added.
      </p>

      {papers.length === 0 ? (
        <p className="mt-10 text-[var(--muted)]">No papers have been loaded yet.</p>
      ) : (
        <div className="mt-10 space-y-8">
          {years.map((year) => (
            <section key={year}>
              <h2 className="font-display text-2xl">GATE {year}</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {papers
                  .filter((p) => p.year === year)
                  .map((p) => (
                    <li key={p.id}>
                      <Card className="flex h-full flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{paperTitle(p)}</span>
                          {p.keyStatus === "official" ? (
                            <Badge tone="success">Official key</Badge>
                          ) : (
                            <Badge>Paper only</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {[p.institute && `Organised by ${p.institute}`, p.note, `${p.pages} pages`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                          <Link
                            href={`/papers/${p.id}`}
                            className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]"
                          >
                            {p.keyStatus === "official" ? "Practise" : "Open paper"}
                          </Link>
                          {p.keyStatus === "official" && (
                            <Link
                              href={`/papers/${p.id}/mock`}
                              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
                            >
                              Timed mock (3 h)
                            </Link>
                          )}
                        </div>
                      </Card>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
