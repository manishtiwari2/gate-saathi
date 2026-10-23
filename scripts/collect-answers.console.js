/*
 * collect-answers.console.js
 * ---------------------------------------------------------------------------
 * Derives verified MCQ answer keys for the PYQ bank by submitting each option
 * to the server-side grading endpoint and keeping the one graded correct.
 * The public API never exposes the key directly; this is the only way to get
 * real answers, and it only works for the data owner's own authenticated session.
 *
 * HOW TO RUN
 *   1. Open https://www.padhaishuru.com in Chrome and make sure you are logged in.
 *   2. Open DevTools (F12 or Cmd/Ctrl+Shift+I) → Console tab.
 *   3. If Chrome shows "Allow pasting", type: allow pasting  (then Enter).
 *   4. Paste this ENTIRE file into the console and press Enter.
 *   5. Wait. Progress prints per branch. Takes a few minutes (~1400 requests,
 *      throttled). Keep the tab focused and awake.
 *   6. When it finishes it auto-downloads `answers.json`.
 *   7. Move that file to the repo at: data/pyq/answers.json
 *
 * Only MCQ questions with a fixed option list are gradable this way. MSQ/NAT
 * questions are skipped and stay flagged unverified.
 * ---------------------------------------------------------------------------
 */
(async () => {
  const CODES = ["CS","EC","EE","ME","CE","IN","PI","CH","BT","MT","XE","XL","TF","PE","EY","MA","AR","AG","GG","PH"];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rfetch = async (u, opts, tries = 5) => {
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(u, opts);
        if (r.status === 429) { await sleep(1500 * (i + 1)); continue; }
        return r;
      } catch (e) { await sleep(600 * (i + 1)); }
    }
    throw new Error("fetch failed: " + u);
  };

  const answers = {};
  let attempts = 0, solved = 0, skipped = 0, failed = 0;

  for (const code of CODES) {
    const subsRes = await rfetch(`/api/pyq/branches/${code}/subjects`);
    const subs = (await subsRes.json()).subjects || [];
    const seen = new Map();
    for (const s of subs) {
      let page = 1;
      while (true) {
        const d = await (await rfetch(`/api/pyq/questions?branch=${code}&subject=${encodeURIComponent(s.subjectName)}&pageSize=100&page=${page}`)).json();
        for (const q of d.data) seen.set(q.id, q);
        if (!d.pagination.hasMore) break;
        page++;
      }
      await sleep(40);
    }
    for (const q of seen.values()) {
      if (q.questionType !== "MCQ" || !Array.isArray(q.options) || q.options.length === 0) { skipped++; continue; }
      let got = false;
      for (const opt of q.options) {
        const r = await rfetch("/api/pyq/attempts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ questionId: q.id, selectedAnswer: opt }),
        });
        attempts++;
        if (!r.ok) { failed++; break; }
        const j = await r.json();
        if (j && j.data && j.data.isCorrect) { answers[q.id] = opt; solved++; got = true; break; }
        await sleep(30);
      }
      if (!got && !answers[q.id]) { /* no option graded correct; leave unset */ }
      await sleep(30);
    }
    console.log(`[${code}] done — solved so far: ${solved}, attempts: ${attempts}`);
  }

  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), solved, skipped, failed, attempts, answers }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "answers.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log(`DONE. solved=${solved} skipped(non-MCQ)=${skipped} failed=${failed} attempts=${attempts}. Downloaded answers.json → move to data/pyq/answers.json`);
})();
