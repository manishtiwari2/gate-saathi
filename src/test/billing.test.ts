/**
 * POST /api/billing/checkout: auth, key gating, the already-premium guard and
 * the rule that the server (not the browser) decides the amount. Razorpay and
 * the database are mocked, so no network or DB is needed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CurrentUser } from "@/lib/session";

const db = vi.hoisted(() => ({ payment: { create: vi.fn() } }));
const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));
const rzp = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));
vi.mock("razorpay", () => ({
  default: class {
    orders = { create: rzp.create };
  },
}));

import { POST as checkout } from "@/app/api/billing/checkout/route";
import { resetRateLimits } from "@/lib/rate-limit";

function user(over: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "user_abcdefghijklmnop",
    email: "u@test.local",
    displayName: "Test",
    username: null,
    avatarUrl: null,
    dailyGoalMin: 120,
    timezone: "Asia/Kolkata",
    plan: "free",
    isPremium: false,
    ...over,
  };
}

beforeEach(() => {
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_key");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
  session.user = user();
  rzp.create.mockResolvedValue({ id: "order_123" });
  db.payment.create.mockResolvedValue({});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  resetRateLimits();
});

describe("POST /api/billing/checkout", () => {
  it("401 when signed out", async () => {
    session.user = null;
    expect((await checkout()).status).toBe(401);
    expect(rzp.create).not.toHaveBeenCalled();
  });

  it("503 when Razorpay keys are not set", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    expect((await checkout()).status).toBe(503);
    expect(rzp.create).not.toHaveBeenCalled();
  });

  it("409 for a user who is already premium", async () => {
    session.user = user({ plan: "premium", isPremium: true });
    expect((await checkout()).status).toBe(409);
    expect(rzp.create).not.toHaveBeenCalled();
  });

  it("creates an order at the server price and saves a created Payment", async () => {
    const res = await checkout();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      orderId: "order_123",
      amount: 4900,
      currency: "INR",
      keyId: "rzp_test_key",
    });
    const arg = rzp.create.mock.calls[0][0];
    expect(arg.amount).toBe(4900);
    expect(arg.currency).toBe("INR");
    expect(arg.receipt.length).toBeLessThanOrEqual(40);
    expect(db.payment.create).toHaveBeenCalledWith({
      data: {
        userId: "user_abcdefghijklmnop",
        orderId: "order_123",
        amountPaise: 4900,
        currency: "INR",
        status: "created",
      },
    });
  });

  it("never returns the key secret", async () => {
    const text = JSON.stringify(await (await checkout()).json());
    expect(text).not.toContain("secret");
  });

  it("502 and no Payment row when Razorpay fails", async () => {
    rzp.create.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await checkout()).status).toBe(502);
    expect(db.payment.create).not.toHaveBeenCalled();
  });

  it("429 after 5 attempts in a minute", async () => {
    for (let i = 0; i < 5; i++) expect((await checkout()).status).toBe(200);
    expect((await checkout()).status).toBe(429);
  });
});
