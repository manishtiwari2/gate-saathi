/**
 * Seeds the database from collected reference data under data/.
 * Idempotent: clears PYQ/paper/cutoff tables and re-inserts. Does not touch
 * user/room data. Answer keys are applied if data/pyq/answers.json exists.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { BRANCHES } from "../src/lib/branches";

// Load env from .env / .env.local for standalone runs (Prisma Client, unlike
// the CLI, does not read dotenv files on its own).
for (const f of [".env", ".env.local"]) {
  const p = join(process.cwd(), f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const db = new PrismaClient();
const DATA = join(process.cwd(), "data");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

async function main() {
  console.log("Seeding from data/ …");

  // ---- answers (optional) ----
  let answers: Record<string, string> = {};
  const answersPath = join(DATA, "pyq", "answers.json");
  if (existsSync(answersPath)) {
    const a = readJson<{ answers: Record<string, string> }>(answersPath);
    answers = a.answers ?? {};
    console.log(`  answer keys: ${Object.keys(answers).length}`);
  } else {
    console.log("  answer keys: none (run scripts/collect-answers.console.js to add)");
  }

  // ---- collected questions (de-duped by subject) ----
  const collected = (() => {
    const raw = readFileSync(join(DATA, "pyq", "questions-all-session.json"), "utf8");
    const parsed = JSON.parse(raw);
    return (typeof parsed === "string" ? JSON.parse(parsed) : parsed) as {
      all: Record<string, Array<Record<string, unknown>>>;
    };
  })();

  // real per-branch counts from what we actually have
  const realCounts: Record<string, number> = {};
  for (const [code, qs] of Object.entries(collected.all)) realCounts[code.toLowerCase()] = qs.length;

  // ---- reset PYQ-related tables ----
  await db.questionAttempt.deleteMany();
  await db.question.deleteMany();
  await db.topic.deleteMany();
  await db.subject.deleteMany();
  await db.cutoff.deleteMany();
  await db.paper.deleteMany();
  await db.branch.deleteMany();

  // ---- branches ----
  const branchMeta = readJson<{ branches: Array<{ branchCode: string; branchName: string; displayName: string; yearMin: number; yearMax: number }> }>(
    join(DATA, "pyq", "branches.json"),
  ).branches;

  for (const b of BRANCHES) {
    const meta = branchMeta.find((m) => m.branchCode.toLowerCase() === b.code);
    await db.branch.create({
      data: {
        code: b.code,
        name: b.name,
        displayName: b.displayName,
        icon: b.icon,
        questionCount: realCounts[b.code] ?? 0,
        yearMin: meta?.yearMin ?? null,
        yearMax: meta?.yearMax ?? null,
      },
    });
  }
  console.log(`  branches: ${BRANCHES.length}`);

  // ---- subjects + topics ----
  const subjectIdByKey = new Map<string, string>(); // `${code}::${subjectName}` -> id
  const topicIdByKey = new Map<string, string>(); // `${subjectId}::${topicName}` -> id

  for (const b of BRANCHES) {
    const path = join(DATA, "pyq", `subjects-${b.code.toUpperCase()}.json`);
    if (!existsSync(path)) continue;
    const subs = readJson<{ subjects: Array<{ subjectName: string; displayName: string; displayOrder: number; topics: Array<{ topicName: string; displayName: string }> }> }>(path).subjects;
    for (const s of subs) {
      if (!s.subjectName) continue;
      const subject = await db.subject.create({
        data: {
          branchCode: b.code,
          name: s.subjectName,
          displayName: s.displayName || s.subjectName,
          displayOrder: s.displayOrder ?? 0,
        },
      });
      subjectIdByKey.set(`${b.code}::${s.subjectName}`, subject.id);
      for (const t of s.topics ?? []) {
        if (!t.topicName) continue;
        const key = `${subject.id}::${t.topicName}`;
        if (topicIdByKey.has(key)) continue;
        const topic = await db.topic.create({
          data: { subjectId: subject.id, name: t.topicName },
        });
        topicIdByKey.set(key, topic.id);
      }
    }
  }
  console.log(`  subjects: ${subjectIdByKey.size}, topics: ${topicIdByKey.size}`);

  // ---- questions ----
  let qCount = 0;
  let verified = 0;
  for (const [codeRaw, qs] of Object.entries(collected.all)) {
    const code = codeRaw.toLowerCase();
    for (const q of qs) {
      const subjectName = (q.subjectName as string) ?? "General";
      const topicName = (q.topicName as string) || null;
      const subjectId = subjectIdByKey.get(`${code}::${subjectName}`) ?? null;
      const topicId = topicName && subjectId ? topicIdByKey.get(`${subjectId}::${topicName}`) ?? null : null;
      const id = q.id as string;
      const correct = answers[id] ?? null;
      if (correct) verified++;
      await db.question.create({
        data: {
          sourceId: (q.questionId as string) ?? null,
          branchCode: code,
          subjectId,
          topicId,
          subjectName,
          topicName,
          year: (q.year as number) ?? null,
          session: q.session != null ? String(q.session) : null,
          questionNumber: q.questionNumber != null ? String(q.questionNumber) : null,
          questionType: (q.questionType as string) ?? "MCQ",
          marks: (q.marks as number) ?? 1,
          difficulty: (q.difficulty as string) ?? "medium",
          questionText: (q.questionText as string) ?? "",
          questionHtml: (q.questionHtml as string) ?? null,
          options: JSON.stringify(q.options ?? []),
          correctAnswer: correct,
          answerVerified: Boolean(correct),
        },
      });
      qCount++;
    }
  }
  console.log(`  questions: ${qCount} (${verified} with a verified answer key)`);

  // ---- papers ----
  let paperCount = 0;
  for (const b of BRANCHES) {
    const path = join(DATA, "papers", `papers-${b.code.toUpperCase()}.json`);
    if (!existsSync(path)) continue;
    const data = readJson<{ papers?: Array<{ id: string; title: string; description?: string; totalQuestions?: number; totalMarks?: number; difficultyDistribution?: unknown; subjectBreakdown?: unknown }> }>(path);
    for (const p of data.papers ?? []) {
      await db.paper.create({
        data: {
          id: p.id,
          branchCode: b.code,
          title: p.title,
          description: p.description ?? null,
          totalQuestions: p.totalQuestions ?? 0,
          totalMarks: p.totalMarks ?? 0,
          meta: JSON.stringify({ difficultyDistribution: p.difficultyDistribution ?? null, subjectBreakdown: p.subjectBreakdown ?? null }),
        },
      });
      paperCount++;
    }
  }
  console.log(`  papers: ${paperCount}`);

  // ---- cutoffs ----
  const cutoffs = readJson<{ cutoffs: Array<{ year: number; branchCode: string; branchName: string; generalCutoff?: number; obCutoff?: number; scCutoff?: number; stCutoff?: number; totalApplicants?: number; totalQualified?: number; qualifyingRate?: number; maxMarks?: number }> }>(
    join(DATA, "misc", "cutoffs.json"),
  ).cutoffs;
  // The feed has multiple rows per branch/year (one per category), each
  // carrying different non-null fields. Merge them into one record.
  type CutoffAcc = {
    year: number;
    branchCode: string;
    branchName: string;
    generalCutoff: number | null;
    obcCutoff: number | null;
    scCutoff: number | null;
    stCutoff: number | null;
    totalApplicants: number | null;
    totalQualified: number | null;
    qualifyingRate: number | null;
    maxMarks: number | null;
  };
  const merged = new Map<string, CutoffAcc>();
  const pick = <T>(a: T | null | undefined, b: T | null | undefined): T | null => (a ?? b ?? null);
  for (const c of cutoffs) {
    const code = c.branchCode.toLowerCase();
    const key = `${c.year}::${code}`;
    const prev = merged.get(key);
    merged.set(key, {
      year: c.year,
      branchCode: code,
      branchName: c.branchName,
      generalCutoff: pick(prev?.generalCutoff, c.generalCutoff),
      obcCutoff: pick(prev?.obcCutoff, c.obCutoff),
      scCutoff: pick(prev?.scCutoff, c.scCutoff),
      stCutoff: pick(prev?.stCutoff, c.stCutoff),
      totalApplicants: pick(prev?.totalApplicants, c.totalApplicants),
      totalQualified: pick(prev?.totalQualified, c.totalQualified),
      qualifyingRate: pick(prev?.qualifyingRate, c.qualifyingRate),
      maxMarks: pick(prev?.maxMarks, c.maxMarks),
    });
  }
  for (const c of merged.values()) {
    await db.cutoff.create({ data: c });
  }
  const seenCutoff = merged;
  console.log(`  cutoffs: ${seenCutoff.size}`);

  // ---- published library resources (from the owner-run collector) ----
  const manifestPath = join(DATA, "misc", "library-manifest.json");
  if (existsSync(manifestPath)) {
    const manifest = readJson<{ resources: Array<{ id: string; name: string; mime?: string; size?: number; branch?: string; access_tier?: string; status: string }> }>(manifestPath);
    const okFiles = manifest.resources.filter((r) => r.status === "ok");

    // Owner for published library files (a system account).
    const libraryUser = await db.user.upsert({
      where: { email: "library@gate-saathi.local" },
      update: {},
      create: { email: "library@gate-saathi.local", displayName: "GATE Saathi Library", username: "library" },
    });

    // Normalize a few branch codes from the source to ours.
    const branchMap: Record<string, string> = { cse: "cs", ece: "ec" };
    const libDir = join(process.cwd(), "storage", "library");

    await db.userFile.deleteMany({ where: { userId: libraryUser.id } });
    let added = 0;
    for (const r of okFiles) {
      const safeName = r.name.replace(/[^\w.\-() ]+/g, "_").replace(/ /g, "-");
      const storagePath = join(libDir, safeName);
      if (!existsSync(storagePath)) continue; // only seed files actually present on disk
      await db.userFile.create({
        data: {
          id: r.id,
          userId: libraryUser.id,
          name: r.name,
          originalFilename: r.name,
          mimeType: r.mime ?? "application/pdf",
          fileSize: r.size ?? 0,
          storagePath,
          visibility: "published",
          accessTier: r.access_tier ?? "free",
          branch: r.branch ? branchMap[r.branch] ?? r.branch : null,
        },
      });
      added++;
    }
    console.log(`  library resources: ${added} published`);
  } else {
    console.log("  library resources: none (run scripts/collect-resources.console.js)");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
