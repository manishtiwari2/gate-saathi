import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { withUser } from "@/components/RequireAuth";

export const metadata: Metadata = { title: "Document" };

export default async function LibraryDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return withUser(async () => {
    const file = await db.userFile.findUnique({ where: { id } });
    if (!file || file.visibility !== "published") notFound();

    const src = `/api/library/document/${id}`;

    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <nav className="text-sm text-[var(--muted)]">
          <Link href="/library/content" className="hover:text-[var(--foreground)]">
            ← Library Content
          </Link>
        </nav>

        <h1 className="mt-4 font-display text-3xl">{file.name}</h1>

        <iframe
          src={src}
          className="mt-6 w-full h-[80vh] rounded-[var(--radius-card)] border border-[var(--border)]"
          title={file.name}
        />

        {file.mimeType !== "application/pdf" && (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Inline preview may be unavailable for this file type. Use the download link below to open
            it.
          </p>
        )}

        <div className="mt-6">
          <a href={src} className="text-sm text-[var(--accent)] hover:underline">
            Download file
          </a>
        </div>
      </div>
    );
  });
}
