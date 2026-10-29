/**
 * The official question paper. Desktop browsers show the PDF inline; many
 * phone browsers can't display a PDF in a frame, so small screens get a
 * button that opens it in a new tab instead.
 */
export function PaperViewer({ pdfPath, title }: { pdfPath: string; title: string }) {
  return (
    <div>
      <a
        href={pdfPath}
        target="_blank"
        rel="noreferrer"
        className="mb-3 inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]"
      >
        Open the question paper (PDF) ↗
      </a>
      <iframe
        src={`${pdfPath}#view=FitH`}
        title={`${title} question paper`}
        className="hidden h-[80vh] w-full rounded-[var(--radius-card)] border border-[var(--border)] lg:block"
      />
      <p className="text-xs text-[var(--muted)] lg:hidden">
        Open the paper in a new tab, then come back here to mark your answers.
      </p>
    </div>
  );
}
