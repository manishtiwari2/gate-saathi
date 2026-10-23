import { describe, it, expect } from "vitest";
import { cn, formatDuration, generateRoomKey } from "./utils";

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
  it("returns 6 unambiguous uppercase chars", () => {
    const key = generateRoomKey();
    expect(key).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
});
