/**
 * Supabase Storage over its REST API, for user uploads in production.
 *
 * Serverless functions (Netlify) cap request and response bodies at a few MB,
 * so file bytes never pass through the app: the browser uploads straight to
 * a signed upload URL, and downloads redirect to a short-lived signed URL.
 * The service-role key stays on the server; the bucket must be private.
 */

const DEFAULT_BUCKET = "user-files";

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function bucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
}

function base() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/+$/, "")}/storage/v1`;
}

/** Encode each path segment; keep the slashes. */
const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

async function call(method: string, path: string, body?: unknown): Promise<Response> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: { authorization: `Bearer ${key}`, apikey: key, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase Storage ${method} ${path.split("/")[1]}: ${res.status}`);
  return res;
}

/** A URL the browser can PUT one file to, once. Valid for 2 hours. */
export async function createSignedUploadUrl(objectPath: string): Promise<string> {
  const res = await call("POST", `/object/upload/sign/${bucket()}/${encodePath(objectPath)}`);
  const { url } = (await res.json()) as { url: string };
  return `${base()}${url}`;
}

export interface StoredObject {
  name: string;
  size: number;
  mimeType: string;
}

/** Objects directly inside a folder, with the size and type Storage recorded. */
export async function listFolder(folder: string): Promise<StoredObject[]> {
  const res = await call("POST", `/object/list/${bucket()}`, { prefix: folder, limit: 10 });
  const rows = (await res.json()) as Array<{
    name: string;
    id: string | null;
    metadata?: { size?: number; mimetype?: string } | null;
  }>;
  return rows
    .filter((r) => r.id) // folders have no id
    .map((r) => ({
      name: r.name,
      size: Number(r.metadata?.size ?? 0),
      mimeType: r.metadata?.mimetype || "application/octet-stream",
    }));
}

/**
 * A short-lived download URL. `downloadAs` makes Storage send it as an
 * attachment with that file name instead of rendering it.
 */
export async function createSignedDownloadUrl(
  objectPath: string,
  { expiresIn = 60, downloadAs }: { expiresIn?: number; downloadAs?: string } = {},
): Promise<string> {
  const res = await call("POST", `/object/sign/${bucket()}/${encodePath(objectPath)}`, { expiresIn });
  const { signedURL } = (await res.json()) as { signedURL: string };
  const url = `${base()}${signedURL}`;
  return downloadAs === undefined ? url : `${url}&download=${encodeURIComponent(downloadAs)}`;
}

export async function removeObjects(paths: string[]): Promise<void> {
  if (paths.length) await call("DELETE", `/object/${bucket()}`, { prefixes: paths });
}
