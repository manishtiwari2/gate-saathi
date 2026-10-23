/*
 * collect-resources.console.js
 * ---------------------------------------------------------------------------
 * Downloads the published library resource files (the 9 PDFs/notes shown in the
 * Virtual Library "Resources" panel) using the owner's authenticated session.
 *
 * HOW TO RUN
 *   1. Open https://www.padhaishuru.com in Chrome, logged in.
 *   2. DevTools (F12) → Console. If prompted, type: allow pasting (Enter).
 *   3. Paste this ENTIRE file, press Enter.
 *   4. It downloads `library-manifest.json` plus each resource file
 *      (your browser may ask to allow multiple downloads — allow it).
 *   5. Put the files in the repo under: storage/library/
 *      and the manifest at:            data/misc/library-manifest.json
 *      (filenames in the manifest match what gets downloaded.)
 * ---------------------------------------------------------------------------
 */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const res = (await (await fetch("/api/content/resources?visibility=published&limit=100")).json()).resources || [];
  const manifest = [];

  for (const f of res) {
    const safeName = (f.original_filename || f.name || f.id).replace(/[^\w.\-() ]+/g, "_");
    try {
      const r = await fetch(`/api/library/document/${f.id}/pdf`);
      if (!r.ok) { manifest.push({ id: f.id, name: safeName, status: r.status }); continue; }
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      manifest.push({
        id: f.id,
        name: safeName,
        mime: f.mime_type,
        size: blob.size,
        branch: f.branch,
        access_tier: f.access_tier,
        status: "ok",
      });
      await sleep(600);
    } catch (e) {
      manifest.push({ id: f.id, name: safeName, status: "error", error: String(e) });
    }
  }

  const mb = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), resources: manifest }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(mb);
  a.download = "library-manifest.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log(`DONE. ${manifest.filter((m) => m.status === "ok").length}/${res.length} files downloaded. Move files → storage/library/, manifest → data/misc/library-manifest.json`);
})();
