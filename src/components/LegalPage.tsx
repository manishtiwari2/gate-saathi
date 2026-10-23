import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Renders a legal document from a plain-text file in src/content.
 * Lines matching "N. Heading" become section headings; blank-line-separated
 * runs become paragraphs.
 */
export function LegalPage({ file, title }: { file: string; title: string }) {
  const raw = readFileSync(join(process.cwd(), "src", "content", file), "utf8");
  const lines = raw.split("\n").map((l) => l.trim());

  const blocks: Array<{ type: "h2" | "meta" | "p"; text: string }> = [];
  for (const line of lines) {
    if (!line) continue;
    if (line === title || line === "Privacy Policy" || line === "Terms of Service") continue;
    if (/^Last updated:/i.test(line)) {
      blocks.push({ type: "meta", text: line });
    } else if (/^\d+\.\s+\S/.test(line)) {
      blocks.push({ type: "h2", text: line });
    } else {
      blocks.push({ type: "p", text: line });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-8 space-y-4">
        {blocks.map((b, i) => {
          if (b.type === "meta") return <p key={i} className="text-sm text-[var(--muted)]">{b.text}</p>;
          if (b.type === "h2") return <h2 key={i} className="pt-4 text-lg font-semibold">{b.text}</h2>;
          return <p key={i} className="text-sm leading-relaxed text-[var(--muted)]">{b.text}</p>;
        })}
      </div>
    </div>
  );
}
