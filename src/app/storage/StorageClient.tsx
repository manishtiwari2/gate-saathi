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
  const [uploadMode, setUploadMode] = useState<string>("disk");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/user/files");
    if (r.ok) {
      const d = await r.json();
      setFiles(d.files ?? []);
      setUploadsEnabled(d.uploadsEnabled !== false);
      setUploadMode(d.uploadMode ?? "disk");
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
    try {
      const failed = uploadMode === "supabase" ? await uploadDirect(file) : await uploadForm(file);
      if (failed) setError(failed);
      else await load();
    } catch {
      setError("Upload failed. Check your connection and try again.");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const message = async (r: Response, fallback: string) =>
    ((await r.json().catch(() => null)) as { error?: { message?: string } } | null)?.error?.message ?? fallback;

  /** Local disk: send the file to the app. Returns an error message or null. */
  async function uploadForm(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/user/files", { method: "POST", body: fd });
    return r.ok ? null : message(r, "Upload failed.");
  }

  /** Supabase Storage: get a signed URL, PUT the file there, then record it. */
  async function uploadDirect(file: File) {
    const signed = await fetch("/api/user/files/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size }),
    });
    if (!signed.ok) return message(signed, "Upload failed.");
    const { id, uploadUrl } = (await signed.json()) as { id: string; uploadUrl: string };

    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!put.ok) return "Upload failed. Please try again.";

    const done = await fetch("/api/user/files/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, originalFilename: file.name }),
    });
    return done.ok ? null : message(done, "Upload failed.");
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
