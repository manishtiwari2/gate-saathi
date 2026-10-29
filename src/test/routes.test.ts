/**
 * Route-handler tests for the security and money-relevant rules: auth,
 * ownership, premium gating, grading, the AI daily limit and rate limiting.
 * The database and session are mocked, so these run without a server or DB.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CurrentUser } from "@/lib/session";

const db = vi.hoisted(() => ({
  userFile: { findUnique: vi.fn() },
  question: { findUnique: vi.fn() },
  questionAttempt: { create: vi.fn() },
  doubtQuery: { create: vi.fn(), count: vi.fn(), delete: vi.fn(), update: vi.fn() },
}));
const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));
const ai = vi.hoisted(() => ({ answerDoubt: vi.fn() }));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));
vi.mock("@/lib/anthropic", () => ai);

import { GET as getUserFile } from "@/app/api/user/files/[id]/route";
import { GET as getLibraryDoc } from "@/app/api/library/document/[id]/route";
import { POST as postAttempt } from "@/app/api/pyq/attempts/route";
import { POST as postDoubt } from "@/app/api/ai/doubt/route";
import { GET as getPresence, POST as postPresence } from "@/app/api/library/multiplayer/route";
import { resetRateLimits, rateLimit } from "@/lib/rate-limit";

function user(over: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "u1",
    email: "u1@test.local",
    displayName: "Test One",
    username: null,
    avatarUrl: null,
    dailyGoalMin: 120,
    timezone: "Asia/Kolkata",
    plan: "free",
    isPremium: false,
    ...over,
  };
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://test.local/api", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1", ...headers },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimits();
  session.user = null;
});

describe("GET /api/user/files/[id] (owner-only)", () => {
  it("requires sign-in", async () => {
    const res = await getUserFile(new Request("http://test.local"), params("f1"));
    expect(res.status).toBe(401);
  });

  it("refuses another user's file, even a published one", async () => {
    session.user = user();
    db.userFile.findUnique.mockResolvedValue({ id: "f1", userId: "someone-else", visibility: "published" });
    const res = await getUserFile(new Request("http://test.local"), params("f1"));
    expect(res.status).toBe(403);
  });
});

describe("GET /api/library/document/[id] (premium gate)", () => {
  it("refuses premium content to a free user", async () => {
    session.user = user();
    db.userFile.findUnique.mockResolvedValue({ id: "d1", visibility: "published", accessTier: "premium" });
    const res = await getLibraryDoc(new Request("http://test.local"), params("d1"));
    expect(res.status).toBe(403);
  });

  it("hides unpublished files", async () => {
    session.user = user({ plan: "premium", isPremium: true });
    db.userFile.findUnique.mockResolvedValue({ id: "d1", visibility: "private", accessTier: "free" });
    const res = await getLibraryDoc(new Request("http://test.local"), params("d1"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/pyq/attempts (grading)", () => {
  const q = { id: "q1", questionType: "MCQ", options: JSON.stringify(["2", "4", "8", "16"]) };

  it("reports an unverified key instead of guessing", async () => {
    db.question.findUnique.mockResolvedValue({ ...q, correctAnswer: null });
    const res = await postAttempt(json({ questionId: "q1", selectedAnswer: "A" }));
    expect((await res.json()).data).toEqual({ graded: false, reason: "answer_unverified" });
  });

  it("grades against an official letter key and stores signed-in attempts", async () => {
    session.user = user();
    db.question.findUnique.mockResolvedValue({ ...q, correctAnswer: "B" });
    const right = await postAttempt(json({ questionId: "q1", selectedAnswer: "B" }));
    expect((await right.json()).data).toEqual({ graded: true, isCorrect: true });
    expect(db.questionAttempt.create).toHaveBeenCalledTimes(1);
  });

  it("is rate limited per client", async () => {
    db.question.findUnique.mockResolvedValue({ ...q, correctAnswer: "B" });
    let last: Response | undefined;
    for (let i = 0; i < 31; i++) last = await postAttempt(json({ questionId: "q1", selectedAnswer: "A" }));
    expect(last!.status).toBe(429);
  });
});

describe("POST /api/ai/doubt (daily limit)", () => {
  beforeEach(() => {
    session.user = user();
    db.doubtQuery.create.mockResolvedValue({ id: "slot1" });
    db.doubtQuery.delete.mockResolvedValue({});
    db.doubtQuery.update.mockResolvedValue({});
  });

  it("rejects the 6th doubt of the day and gives the slot back", async () => {
    db.doubtQuery.count.mockResolvedValue(6); // 5 earlier + this reservation
    const res = await postDoubt(json({ question: "What is a TLB?" }));
    expect(res.status).toBe(402);
    expect(db.doubtQuery.delete).toHaveBeenCalledWith({ where: { id: "slot1" } });
    expect(ai.answerDoubt).not.toHaveBeenCalled();
  });

  it("answers within the limit and saves the answer into the reserved slot", async () => {
    db.doubtQuery.count.mockResolvedValue(1);
    ai.answerDoubt.mockResolvedValue({ available: true, answer: "Step 1…", model: "m" });
    const res = await postDoubt(json({ question: "What is a TLB?" }));
    const body = await res.json();
    expect(body).toMatchObject({ available: true, answer: "Step 1…", remaining: 4 });
    expect(db.doubtQuery.update).toHaveBeenCalled();
    expect(db.doubtQuery.delete).not.toHaveBeenCalled();
  });

  it("releases the slot when the AI isn't configured (coming soon)", async () => {
    db.doubtQuery.count.mockResolvedValue(1);
    ai.answerDoubt.mockResolvedValue({ available: false });
    const res = await postDoubt(json({ question: "What is a TLB?" }));
    expect(await res.json()).toEqual({ available: false });
    expect(db.doubtQuery.delete).toHaveBeenCalled();
  });
});

describe("library presence", () => {
  it("never returns the caller in the player list", async () => {
    session.user = user({ id: "me", displayName: "Same Name" });
    await postPresence(json({ x: 1, y: 2, roomId: "test-room" }));
    session.user = user({ id: "other", displayName: "Same Name" });
    const res = await postPresence(json({ x: 3, y: 4, roomId: "test-room" }));
    const { players } = await res.json();
    expect(players.map((p: { id: string }) => p.id)).toEqual(["me"]);

    session.user = user({ id: "me", displayName: "Same Name" });
    const listed = await (await getPresence(new Request("http://test.local/api?roomId=test-room"))).json();
    expect(listed.players.map((p: { id: string }) => p.id)).toEqual(["other"]);
  });
});

describe("rateLimit with the shared store", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it("uses Upstash counts when configured", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://kv.test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    let count = 0;
    const fetchMock = vi.fn(async () => {
      count++;
      return new Response(JSON.stringify([{ result: "OK" }, { result: count }]));
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await rateLimit("t", "who", 2, 60_000)).toBeNull();
    expect(await rateLimit("t", "who", 2, 60_000)).toBeNull();
    expect((await rateLimit("t", "who", 2, 60_000))?.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledWith("https://kv.test/pipeline", expect.anything());
  });

  it("falls back to memory if the store is down", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://kv.test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await rateLimit("t2", "who", 1, 60_000)).toBeNull();
    expect((await rateLimit("t2", "who", 1, 60_000))?.status).toBe(429);
  });
});
