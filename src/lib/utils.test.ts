import { describe, it, expect } from "vitest";
import { cn, formatDuration, generateRoomKey, loginHref, safeCallbackUrl } from "./utils";

describe("cn", () => {
  it("joins truthy classes and drops falsy ones", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("formatDuration", () => {
  it("formats sub-hour as MM:SS", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(65)).toBe("01:05");
    expect(formatDuration(599)).toBe("09:59");
  });
  it("formats hour+ as H:MM:SS", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });
  it("clamps negatives to zero", () => {
    expect(formatDuration(-5)).toBe("00:00");
  });
});

describe("generateRoomKey", () => {
  it("returns 8 unambiguous uppercase chars", () => {
    const key = generateRoomKey();
    expect(key).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  });
});

describe("loginHref", () => {
  it("returns to the current page, except home and login", () => {
    expect(loginHref("/rooms/abc")).toBe("/login?callbackUrl=%2Frooms%2Fabc");
    expect(loginHref("/")).toBe("/login");
    expect(loginHref("/login")).toBe("/login");
  });
});

describe("safeCallbackUrl", () => {
  it("accepts same-site paths only", () => {
    expect(safeCallbackUrl("/rooms/abc")).toBe("/rooms/abc");
    expect(safeCallbackUrl("//evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("/\\evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("https://evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl(undefined)).toBe("/dashboard");
  });
});
