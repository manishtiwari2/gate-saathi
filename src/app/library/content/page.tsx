import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { withUser } from "@/components/RequireAuth";
import { Card, Badge, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Library Content" };

export default async function LibraryContentPage() {
  return withUser(async () => {
    const files = await db.userFile.findMany({
      where: { visibility: "published" },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="font-display text-4xl">Library Content</h1>
          <p className="mt-3 text-lg text-[var(--muted)]">
            Browse published study materials by GATE branch and subject.
          </p>
        </header>

        <div className="mt-10">
          {files.length === 0 ? (
            <EmptyState
              icon="📚"
              title="No published materials yet"
              description="Published study materials will appear here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {files.map((file) => (
                <Link key={file.id} href={`/library/document/${file.id}`} className="block">
                  <Card className="h-full transition-colors hover:border-[var(--accent)]">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-medium">{file.name}</h2>
                      <div className="flex shrink-0 gap-1">
                        {file.accessTier === "premium" && <Badge>🔒 Premium</Badge>}
                        {file.branch && <Badge tone="accent">{file.branch.toUpperCase()}</Badge>}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {Math.max(1, Math.round(file.fileSize / 1024))} KB
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  });
}
