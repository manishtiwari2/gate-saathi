import { describe, it, expect, afterEach } from "vitest";
import { join } from "node:path";
import { isUploadsEnabled, resolveStoragePath } from "./storage";

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

describe("isUploadsEnabled", () => {
  it("is on by default and off on Vercel", () => {
    delete process.env.VERCEL;
    delete process.env.ENABLE_UPLOADS;
    expect(isUploadsEnabled()).toBe(true);
    process.env.VERCEL = "1";
    expect(isUploadsEnabled()).toBe(false);
  });
  it("can be forced either way", () => {
    process.env.VERCEL = "1";
    process.env.ENABLE_UPLOADS = "true";
    expect(isUploadsEnabled()).toBe(true);
    delete process.env.VERCEL;
    process.env.ENABLE_UPLOADS = "false";
    expect(isUploadsEnabled()).toBe(false);
  });
});

describe("resolveStoragePath", () => {
  it("resolves relative paths from the project root and keeps absolute ones", () => {
    expect(resolveStoragePath("storage/library/a.pdf")).toBe(join(process.cwd(), "storage/library/a.pdf"));
    const abs = join(process.cwd(), "x.pdf");
    expect(resolveStoragePath(abs)).toBe(abs);
  });
});
