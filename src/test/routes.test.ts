/**
 * Route-handler tests for the security and money-relevant rules: auth,
 * ownership, premium gating, grading, the AI daily limit and rate limiting.
 * The database and session are mocked, so these run without a server or DB.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CurrentUser } from "@/lib/session";

const db = vi.hoisted(() => ({
  userFile: { findUnique: vi.fn(), create: vi.fn() },
  user: { upsert: vi.fn() },
  question: { findUnique: vi.fn() },
  questionAttempt: { create: vi.fn() },
  doubtQuery: { create: vi.fn(), count: vi.fn(), delete: vi.fn(), update: vi.fn() },
  officialQuestion: { findUnique: vi.fn() },
  officialPaper: { findUnique: vi.fn() },
  paperAttempt: { create: vi.fn() },
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
import { POST as checkPaperAnswer } from "@/app/api/papers/[id]/check/route";
import { POST as submitPaper } from "@/app/api/papers/[id]/submit/route";
import { POST as getUploadUrl } from "@/app/api/user/files/upload-url/route";
import { POST as completeUpload } from "@/app/api/user/files/complete/route";
import { resetRateLimits, rateLimit } from "@/lib/rate-limit";
import { syncUserFromAuth, verifiedEmail } from "@/lib/auth";

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

describe("official papers", () => {
  const key = [
    { section: "GA", number: 1, type: "MCQ", key: "D", marks: 1 },
    { section: "CS", number: 2, type: "MCQ", key: "B", marks: 1 },
    { section: "CS", number: 3, type: "MCQ", key: "MTA", marks: 1 },
    { section: "CS", number: 27, type: "NAT", key: "197.9 to 198.1", marks: 2 },
  ];

  it("checks one answer and only then reveals the key", async () => {
    db.officialQuestion.findUnique.mockResolvedValue(key[3]);
    const res = await checkPaperAnswer(json({ section: "CS", number: 27, answer: "198" }), params("cs-2016-1"));
    expect((await res.json()).data).toMatchObject({ isCorrect: true, key: "197.9 to 198.1", marksToAll: false });
  });

  it("returns 404 for a question without an official key", async () => {
    db.officialQuestion.findUnique.mockResolvedValue(null);
    const res = await checkPaperAnswer(json({ section: "CS", number: 5, answer: "A" }), params("cs-2025-1"));
    expect(res.status).toBe(404);
  });

  it("refuses to score a paper without an official key", async () => {
    db.officialPaper.findUnique.mockResolvedValue({ id: "cs-2025-1", keyStatus: "none", questions: [] });
    const res = await submitPaper(json({ mode: "mock", answers: {} }), params("cs-2025-1"));
    expect(res.status).toBe(409);
  });

  it("scores with GATE marking and saves signed-in attempts", async () => {
    session.user = user();
    db.officialPaper.findUnique.mockResolvedValue({ id: "cs-2016-1", keyStatus: "official", questions: key });
    db.paperAttempt.create.mockResolvedValue({});
    const res = await submitPaper(
      json({ mode: "mock", answers: { "GA-1": "D", "CS-2": "A", "CS-27": "198" }, durationSec: 600 }),
      params("cs-2016-1"),
    );
    const { data } = await res.json();
    // +1 − 1/3 + 1 (marks to all) + 2
    expect(data.score).toBe(3.67);
    expect(data.keys["CS-3"]).toBe("Marks to all");
    expect(data.saved).toBe(true);
    expect(db.paperAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "u1", paperId: "cs-2016-1", mode: "mock", correct: 3, wrong: 1 }) }),
    );
  });

  it("rejects malformed answer ids", async () => {
    const res = await submitPaper(json({ mode: "mock", answers: { "../x": "A" } }), params("cs-2016-1"));
    expect(res.status).toBe(400);
  });
});

describe("Supabase Storage uploads", () => {
  const env = { ...process.env };
  let calls: Array<{ url: string; method: string; body: unknown }>;
  let listing: unknown[];

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    delete process.env.ENABLE_UPLOADS;
    calls = [];
    listing = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : undefined });
        if (url.includes("/object/upload/sign/")) return Response.json({ url: "/object/upload/sign/user-files/p?token=t" });
        if (url.includes("/object/list/")) return Response.json(listing);
        if (url.includes("/object/sign/")) return Response.json({ signedURL: "/object/sign/user-files/p?token=s" });
        return Response.json({});
      }),
    );
  });
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it("signs an upload into the caller's own folder and keeps the key server-side", async () => {
    session.user = user();
    const res = await getUploadUrl(json({ name: "notes/../x.pdf", size: 1000 }));
    const body = await res.json();
    const { id, uploadUrl } = body;
    expect(res.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(["id", "uploadUrl"]);
    expect(uploadUrl).toBe("https://proj.supabase.co/storage/v1/object/upload/sign/user-files/p?token=t");
    expect(calls[0].url).toBe(`https://proj.supabase.co/storage/v1/object/upload/sign/user-files/u1/${id}/notes_.._x.pdf`);
  });

  it("refuses oversized uploads and anonymous callers", async () => {
    expect((await getUploadUrl(json({ name: "a.pdf", size: 1000 }))).status).toBe(401);
    session.user = user();
    expect((await getUploadUrl(json({ name: "a.pdf", size: 21 * 1024 * 1024 }))).status).toBe(413);
  });

  it("records size and type as Storage reports them", async () => {
    session.user = user();
    const id = "6f1c1f9e-2a7b-4c1d-9a51-1f2e3d4c5b6a";
    listing = [{ name: "a.pdf", id: "obj", metadata: { size: 1234, mimetype: "application/pdf" } }];
    db.userFile.findUnique.mockResolvedValue(null);
    db.userFile.create.mockImplementation(async ({ data }) => data);
    const res = await completeUpload(json({ id, originalFilename: "a.pdf" }));
    expect(res.status).toBe(201);
    expect(calls[0].body).toMatchObject({ prefix: `u1/${id}` });
    expect(db.userFile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "u1", fileSize: 1234, storagePath: `supabase:u1/${id}/a.pdf` }),
    });
  });

  it("deletes an object that arrived larger than the limit", async () => {
    session.user = user();
    listing = [{ name: "big.pdf", id: "obj", metadata: { size: 30 * 1024 * 1024, mimetype: "application/pdf" } }];
    const res = await completeUpload(json({ id: "6f1c1f9e-2a7b-4c1d-9a51-1f2e3d4c5b6a", originalFilename: "big.pdf" }));
    expect(res.status).toBe(413);
    expect(calls.some((c) => c.method === "DELETE")).toBe(true);
    expect(db.userFile.create).not.toHaveBeenCalled();
  });

  it("serves an owner's file by redirecting to a short-lived signed URL", async () => {
    session.user = user();
    db.userFile.findUnique.mockResolvedValue({
      id: "f1", userId: "u1", storagePath: "supabase:u1/x/a.zip", mimeType: "application/zip", originalFilename: "a.zip",
    });
    const res = await getUserFile(new Request("http://test.local"), params("f1"));
    expect(res.status).toBe(302);
    // Not on the inline allowlist, so Storage must send it as a download.
    expect(res.headers.get("location")).toBe(
      "https://proj.supabase.co/storage/v1/object/sign/user-files/p?token=s&download=a.zip",
    );
    expect(calls[0].body).toEqual({ expiresIn: 60 });
  });
});

describe("Supabase Auth identity", () => {
  const authUser = (over: Record<string, unknown> = {}) =>
    ({
      id: "a1",
      email: "Student@Example.com",
      email_confirmed_at: "2026-10-01T00:00:00Z",
      user_metadata: { full_name: "A Student", avatar_url: "https://avatars.githubusercontent.com/u/1" },
      ...over,
    }) as never;

  it("only trusts verified emails", () => {
    expect(verifiedEmail(authUser())).toBe("student@example.com");
    expect(verifiedEmail(authUser({ email_confirmed_at: undefined }))).toBeNull();
  });

  it("creates the User row on first sign-in without overwriting an edited name", async () => {
    db.user.upsert.mockResolvedValue({ id: "u1" });
    await syncUserFromAuth(authUser());
    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { email: "student@example.com" },
      update: { avatarUrl: "https://avatars.githubusercontent.com/u/1" },
      create: { email: "student@example.com", displayName: "A Student", avatarUrl: "https://avatars.githubusercontent.com/u/1" },
    });
  });
});
