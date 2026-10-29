import { describe, it, expect, beforeEach } from "vitest";
import { hit, clientIp, resetRateLimits } from "./rate-limit";

describe("hit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit inside a window, then blocks", () => {
    const now = 1_000_000;
    expect(hit("k", 2, 1000, now)).toBe(true);
    expect(hit("k", 2, 1000, now + 1)).toBe(true);
    expect(hit("k", 2, 1000, now + 2)).toBe(false);
  });

  it("opens a fresh window once the old one expires", () => {
    const now = 2_000_000;
    hit("k", 1, 1000, now);
    expect(hit("k", 1, 1000, now + 10)).toBe(false);
    expect(hit("k", 1, 1000, now + 1000)).toBe(true);
  });

  it("tracks keys independently", () => {
    const now = 3_000_000;
    expect(hit("a", 1, 1000, now)).toBe(true);
    expect(hit("b", 1, 1000, now)).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientIp(req)).toBe("1.2.3.4");
  });
  it("falls back to unknown", () => {
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
