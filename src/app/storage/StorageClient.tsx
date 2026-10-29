"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, EmptyState } from "@/components/ui";

interface FileRow {
  id: string;
  name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export function StorageClient() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadsEnabled, setUploadsEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/user/files");
    if (r.ok) {
      const d = await r.json();
      setFiles(d.files ?? []);
      setUploadsEnabled(d.uploadsEnabled !== false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/user/files", { method: "POST", body: fd });
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      setError(j?.error?.message ?? "Upload failed.");
    } else {
      await load();
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove(id: string) {
    if (!confirm("Delete this file?")) return;
    setError(null);
    const r = await fetch(`/api/user/files/${id}`, { method: "DELETE" }).catch(() => null);
    if (!r?.ok) setError("Couldn't delete that file. Please try again.");
    load();
  }

  const used = files.reduce((a, f) => a + f.file_size, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">My Storage</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {(used / 1024 / 1024).toFixed(1)} MB used · {files.length} file{files.length === 1 ? "" : "s"}
          </p>
        </div>
        <div>
          <input ref={inputRef} type="file" className="hidden" onChange={upload} id="file-upload" />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading || !uploadsEnabled}>
            {uploading ? "Uploading…" : "Upload file"}
          </Button>
        </div>
      </div>

      {!uploadsEnabled && (
        <Card className="mt-6">
          <p className="font-medium">File uploads are coming soon.</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Uploading needs file storage that this deployment doesn&apos;t have yet. The library&apos;s
            PDFs are still available on the Library page.
          </p>
        </Card>
      )}

      {error && <p className="mt-4 text-sm text-[var(--error)]">{error}</p>}

      <div className="mt-8">
        {loading ? (
          <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--background-alt)]" />
        ) : files.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No files yet"
            description={uploadsEnabled ? "Upload your notes and PDFs to private storage." : "Uploads open soon."}
          />
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id}>
                <Card className="flex items-center justify-between py-3">
                  <a
                    href={`/api/user/files/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm hover:text-[var(--accent)]"
                  >
                    {f.name}
                  </a>
                  <span className="flex items-center gap-4">
                    <span className="text-xs text-[var(--muted)]">
                      {Math.round(f.file_size / 1024)} KB
                    </span>
                    <button onClick={() => remove(f.id)} className="text-xs text-[var(--error)] hover:underline">
                      Delete
                    </button>
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
