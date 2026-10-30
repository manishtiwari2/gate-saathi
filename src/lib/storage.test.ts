import { describe, it, expect, afterEach } from "vitest";
import { join } from "node:path";
import { resolveStoragePath, supabaseObjectPath, supabaseStoragePath, uploadBackend } from "./storage";

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe("uploadBackend", () => {
  const noSupabase = { NEXT_PUBLIC_SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined };

  it("uses Supabase Storage when configured", () => {
    setEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k", ENABLE_UPLOADS: undefined });
    expect(uploadBackend()).toBe("supabase");
  });

  it("uses local disk in development and is off in production without Supabase", () => {
    setEnv({ ...noSupabase, ENABLE_UPLOADS: undefined, NODE_ENV: "development" });
    expect(uploadBackend()).toBe("disk");
    setEnv({ NODE_ENV: "production" });
    expect(uploadBackend()).toBe("none");
  });

  it("can be forced either way", () => {
    setEnv({ ...noSupabase, NODE_ENV: "production", ENABLE_UPLOADS: "true" });
    expect(uploadBackend()).toBe("disk");
    setEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k", ENABLE_UPLOADS: "false" });
    expect(uploadBackend()).toBe("none");
  });
});

describe("storage paths", () => {
  it("resolves relative paths from the project root and keeps absolute ones", () => {
    expect(resolveStoragePath("storage/library/a.pdf")).toBe(join(process.cwd(), "storage/library/a.pdf"));
    const abs = join(process.cwd(), "x.pdf");
    expect(resolveStoragePath(abs)).toBe(abs);
  });

  it("round-trips Supabase object paths and leaves disk paths alone", () => {
    expect(supabaseObjectPath(supabaseStoragePath("u1/id/a.pdf"))).toBe("u1/id/a.pdf");
    expect(supabaseObjectPath("storage/library/a.pdf")).toBeNull();
  });
});
