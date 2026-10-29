"""
Builds the official GATE CS paper set from the owner's folder of official PDFs.

Owner-run (needs Python 3 + `pip install pypdf`):

    python scripts/official-papers/build.py "C:/Desktop/Gate2027/Gate PYQs"

For every paper it:
  * writes the question pages to public/papers/cs/<id>.pdf. Answer-key pages
    and "SESSION - n" separator pages are left out, so students don't see the
    answers while solving;
  * extracts the official answer key printed in the PDF (where there is one)
    to data/papers/official/keys/<id>.csv;
  * writes the manifest data/papers/official/cs.json.

Extracted keys are checked: 65 questions (10 GA + 55 CS) worth 100 marks. A
key that fails the check is not written. Nothing is guessed.
"""
import csv
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[2]
PDF_OUT = ROOT / "public" / "papers" / "cs"
KEY_OUT = ROOT / "data" / "papers" / "official" / "keys"
MANIFEST = ROOT / "data" / "papers" / "official" / "cs.json"

# Per source file: one entry per paper inside it. Page numbers are 1-based and
# inclusive. `key` = pages holding the printed answer key, `fmt` = its layout.
# `institute` is as printed on the paper; None where it isn't printed.
PAPERS = [
    *[{"file": f"{y}_CS.pdf", "id": f"cs-{y}", "year": y, "set": None, "pages": None} for y in range(2007, 2012)],
    {"file": "2012_CS.pdf", "id": "cs-2012", "year": 2012, "set": None, "pages": (1, 17), "key": (18, 19), "fmt": "codes", "code": "A", "note": "Question booklet code CS-A"},
    *[{"file": "2013_CS.pdf", "id": f"cs-2013-{c.lower()}", "year": 2013, "set": f"Code {c}", "pages": p}
      for c, p in [("A", (2, 15)), ("B", (17, 30)), ("C", (32, 45)), ("D", (47, 60))]],
    *[{"file": "2014_CS.pdf", "id": f"cs-2014-{n}", "year": 2014, "set": f"Session {n}", "pages": p, "key": (k, k), "fmt": "twocol"}
      for n, p, k in [(1, (2, 21), 22), (2, (24, 44), 45), (3, (47, 66), 67)]],
    *[{"file": "2015_CS.pdf", "id": f"cs-2015-{n}", "year": 2015, "set": f"Session {n}", "pages": p}
      for n, p in [(1, (2, 25)), (2, (27, 51)), (3, (53, 79))]],
    {"file": "2016_CS.pdf", "id": "cs-2016-1", "year": 2016, "set": "Set 1", "pages": (1, 20), "key": (21, 22), "fmt": "table"},
    {"file": "2016_CS.pdf", "id": "cs-2016-2", "year": 2016, "set": "Set 2", "pages": (23, 43), "key": (44, 45), "fmt": "table"},
    {"file": "2017_CS1.pdf", "id": "cs-2017-1", "year": 2017, "set": "Set 1", "pages": None},
    {"file": "2017_CS2.pdf", "id": "cs-2017-2", "year": 2017, "set": "Set 2", "pages": (1, 25), "key": (26, 27), "fmt": "table"},
    {"file": "2018_CS.pdf", "id": "cs-2018", "year": 2018, "set": None, "pages": (1, 23), "key": (24, 26), "fmt": "table"},
    {"file": "2019_CS.pdf", "id": "cs-2019", "year": 2019, "set": None, "pages": None},
    {"file": "2020_CS.pdf", "id": "cs-2020", "year": 2020, "set": None, "pages": (1, 16), "key": (17, 18), "fmt": "table", "institute": "IIT Delhi"},
    {"file": "2021_CS.pdf", "id": "cs-2021", "year": 2021, "set": "Both sets", "pages": None},
    {"file": "2022_CS.pdf", "id": "cs-2022", "year": 2022, "set": None, "pages": None},
    {"file": "2023_CS.pdf", "id": "cs-2023", "year": 2023, "set": None, "pages": None, "institute": "IIT Kanpur"},
    {"file": "2024_CS1.pdf", "id": "cs-2024-1", "year": 2024, "set": "Set 1", "pages": None, "institute": "IISc Bengaluru"},
    {"file": "2024_CS2.pdf", "id": "cs-2024-2", "year": 2024, "set": "Set 2", "pages": None, "institute": "IISc Bengaluru"},
    {"file": "2025_CS1.pdf", "id": "cs-2025-1", "year": 2025, "set": "Set 1", "pages": None, "institute": "IIT Roorkee"},
    {"file": "2025_CS2.pdf", "id": "cs-2025-2", "year": 2025, "set": "Set 2", "pages": None, "institute": "IIT Roorkee"},
    {"file": "2026_CS1.pdf", "id": "cs-2026-1", "year": 2026, "set": "Set 1", "pages": None, "institute": "IIT Guwahati"},
    {"file": "2026_CS2.pdf", "id": "cs-2026-2", "year": 2026, "set": "Set 2", "pages": None, "institute": "IIT Guwahati"},
]


def page_text(reader, n):
    try:
        return reader.pages[n - 1].extract_text() or ""
    except Exception:
        return ""


def gate_marks(section, number, numbering):
    """Marks GATE assigns by position (fixed across these years)."""
    if numbering == "continuous":  # 2012-style: CS Q1-55, GA Q56-65
        if number <= 25:
            return 1
        if number <= 55:
            return 2
        return 1 if number <= 60 else 2
    if section == "GA":
        return 1 if number <= 5 else 2
    return 1 if number <= 25 else 2


def norm_key(raw):
    """'0.24 to 0.27' / '197.9 : 198.1' → '0.24 to 0.27'; several accepted
    ranges are joined with ' OR '; letters stay letters."""
    k = re.sub(r"\s+", " ", raw.replace("‐", "-").replace("−", "-")).strip()
    parts = re.split(r"\s+OR\s+", k, flags=re.I)
    out = []
    for part in parts:
        m = re.fullmatch(r"(-?\d*\.?\d+)\s*(?:to|:)\s*(-?\d*\.?\d+)", part.strip())
        if not m:
            return k if len(parts) == 1 else None
        a, b = m.groups()
        out.append(f"{float(a):g} to {float(b):g}")
    return " OR ".join(out)


def clean(text):
    return text.replace(" ", " ").replace("‐", "-").replace("−", "-")


def split_marks(key, section, number, numbering="sections"):
    """Some keys have the marks digit glued on ('3 to 31' = '3 to 3', 1 mark).
    Marks are fixed by question position, so strip that digit."""
    marks = gate_marks(section, number, numbering)
    key = key.strip()
    if re.search(r"\d$", key) and key.endswith(str(marks)) and not re.fullmatch(r"[A-D]", key):
        candidate = key[: -len(str(marks))].strip()
        if norm_key(candidate) and re.search(r"\d$", candidate):
            return candidate, marks
    return key, marks


def parse_table(text):
    """Rows like '41 NAT CS-1 256.0 : 256.0 2' or '1 6 MCQ GA D 1' (2020).
    A row can wrap onto the next line; the marks may be glued to the key."""
    start = re.compile(r"^\s*\d+\s+(?:\d+\s+)?(MCQ|MSQ|NAT)\s")
    lines = []
    for line in clean(text).splitlines():
        if start.match(line) or not lines:
            lines.append(line.strip())
        # Only join a wrapped line that looks like the rest of an answer
        # ('13.5 1', 'to 99.65 1'); page headers and footers are dropped.
        elif re.fullmatch(r"\s*(?:-?\d*\.?\d+|to|OR|:)(?:\s+(?:-?\d*\.?\d+|to|OR|:))*\s*", line):
            lines[-1] += " " + line.strip()
    pat = re.compile(r"^(\d+)\s+(?:\d+\s+)?(MCQ|MSQ|NAT)\s+(GA|CS)(?:-\d)?\s+(.+?)(?:\s+([12]))?$")
    rows = []
    for line in lines:
        m = pat.match(line)
        if not m:
            continue
        q, typ, sec, key, marks = m.groups()
        q = int(q)
        if marks:
            marks = int(marks)
        else:
            key, marks = split_marks(key, sec, q)
        key = norm_key(key)
        if key:
            rows.append({"section": sec, "number": q, "type": typ, "key": key, "marks": marks})
    return rows


def parse_twocol(text):
    """2014 layout: 'GA 1 B 1 CS 24 C 1' per line; marks digit sometimes glued
    onto a range ('5 to 52' = key '5 to 5', 2 marks). Marks are fixed by
    position, so they are taken from gate_marks and stripped from the key."""
    rows = []
    # An entry runs until the next 'GA n'/'CS n' or the page footer.
    entry = re.compile(r"(GA|CS)\s+(\d+)\s+(.+?)(?=\s+(?:GA|CS)\s+\d+\s|\s+GATE\b|\s+SESSION\b|$)")
    # Entries wrap across lines ('CS 20 99.55' / 'to 99.65 1'), so work on the
    # flattened text.
    flat = re.sub(r"\s+", " ", clean(text)).replace("Key / Range Marks", " ")
    for sec, q, rest in entry.findall(flat):
        q = int(q)
        marks = gate_marks(sec, q, "sections")
        rest = rest.strip()
        if rest.endswith(" " + str(marks)):
            rest = rest[: -len(str(marks))].strip()
        elif not re.fullmatch(r"[A-D]", rest):
            rest, marks = split_marks(rest, sec, q)
        letter = re.fullmatch(r"[A-D]", rest)
        rng = re.fullmatch(r"-?\d*\.?\d+\s*to\s*-?\d*\.?\d+", rest)
        if not (letter or rng):
            continue
        rows.append({"section": sec, "number": q, "type": "MCQ" if letter else "NAT", "key": norm_key(rest), "marks": marks})
    return rows


def parse_codes(text, code):
    """2012 layout: one column per booklet code (A-D). 'Marks to All' = every
    candidate got the marks. All 2012 questions are MCQ."""
    col = "ABCD".index(code)
    rows = []
    flat = re.sub(r"\s+", " ", clean(text))
    for m in re.finditer(r"CS\s+(\d+)\s*((?:(?:[A-D]|Marks to All)\s*){4})", flat):
        q = int(m.group(1))
        cells = re.findall(r"Marks to All|[A-D]", m.group(2))
        if len(cells) != 4:
            continue
        key = "MTA" if cells[col] == "Marks to All" else cells[col]
        sec = "GA" if q > 55 else "CS"
        rows.append({"section": sec, "number": q, "type": "MCQ", "key": key, "marks": gate_marks(sec, q, "continuous")})
    return rows


def check(rows):
    counts = {"GA": 0, "CS": 0}
    for r in rows:
        counts[r["section"]] += 1
    total = sum(r["marks"] for r in rows)
    keys = {(r["section"], r["number"]) for r in rows}
    # Every key must be a letter (MCQ), letters joined by ';' (MSQ), one or
    # more numeric ranges (NAT), or MTA (marks to all).
    rng = r"-?\d*\.?\d+ to -?\d*\.?\d+"
    valid = {
        "MCQ": re.compile(r"[A-D]|MTA"),
        "MSQ": re.compile(r"[A-D](;[A-D])*|MTA"),
        "NAT": re.compile(rf"{rng}( OR {rng})*|MTA"),
    }
    bad = [f"{r['section']}-{r['number']}={r['key']!r}" for r in rows
           if r["type"] not in valid or not valid[r["type"]].fullmatch(r["key"])]
    ok = counts == {"GA": 10, "CS": 55} and total == 100 and len(keys) == 65 and not bad
    return ok, f"GA={counts['GA']} CS={counts['CS']} marks={total} unique={len(keys)}" + (f" bad keys: {bad[:3]}" if bad else "")


def main(src):
    src = Path(src)
    PDF_OUT.mkdir(parents=True, exist_ok=True)
    KEY_OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for p in PAPERS:
        reader = PdfReader(str(src / p["file"]))
        first, last = p["pages"] or (1, len(reader.pages))
        writer = PdfWriter()
        for n in range(first, last + 1):
            writer.add_page(reader.pages[n - 1])
        out_pdf = PDF_OUT / f"{p['id']}.pdf"
        with open(out_pdf, "wb") as fh:
            writer.write(fh)

        key_status, detail = "none", "no answer key printed in the source PDF"
        if p.get("key"):
            text = "\n".join(page_text(reader, n) for n in range(p["key"][0], p["key"][1] + 1))
            rows = {"table": parse_table, "twocol": parse_twocol}.get(p["fmt"], lambda t: parse_codes(t, p["code"]))(text)
            ok, detail = check(rows)
            if ok:
                rows.sort(key=lambda r: (r["section"] != "GA" if p["fmt"] != "codes" else 0, r["number"]))
                with open(KEY_OUT / f"{p['id']}.csv", "w", newline="", encoding="utf-8") as fh:
                    w = csv.DictWriter(fh, fieldnames=["section", "number", "type", "key", "marks"], lineterminator="\n")
                    w.writeheader()
                    w.writerows(rows)
                key_status = "official"
            else:
                key_status = "none"
                detail = f"key extraction failed the check ({detail}); not used"
                (KEY_OUT / f"{p['id']}.csv").unlink(missing_ok=True)  # never leave a stale key behind

        manifest.append({
            "id": p["id"],
            "branch": "cs",
            "year": p["year"],
            "set": p["set"],
            "institute": p.get("institute"),
            "note": p.get("note"),
            "pdf": f"/papers/cs/{p['id']}.pdf",
            "pages": last - first + 1,
            "numbering": "continuous" if p.get("fmt") == "codes" else "sections",
            "keyStatus": key_status,
            "source": f"Official GATE {p['year']} CS question paper ({p['file']})",
        })
        print(f"{p['id']:>11}: {last - first + 1:>2} pages, key={key_status} ({detail})")

    MANIFEST.write_text(json.dumps({"papers": manifest}, indent=2) + "\n", encoding="utf-8")
    print(f"\n{len(manifest)} papers, {sum(m['keyStatus'] == 'official' for m in manifest)} with official keys")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python scripts/official-papers/build.py <folder with the official PDFs>")
    main(sys.argv[1])
