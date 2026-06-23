#!/usr/bin/env python3
"""Fetch / prepare 吴献书《理想国》 chapter files.

Sources (in priority order):
  1. Local PDF: data/plato-republic/source/republic-wu.pdf
  2. Local TXT:  data/plato-republic/source/republic-full.txt
  3. CADAL ssno=04912460 chapter manifest (titles only)

Usage:
  python3 scripts/fetch-wu-republic.py
  python3 scripts/fetch-wu-republic.py --pdf /path/to/republic-wu.pdf
  python3 scripts/fetch-wu-republic.py --txt /path/to/republic-full.txt
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "plato-republic"
SOURCE = DATA / "source"
CHAPTERS = DATA / "chapters"
MANIFEST = DATA / "chapters.manifest.json"

CHAPTER_MARKERS = [
    r"^\s*第[一二三四五六七八九十]+章[\s　].*$",
    r"^\s*第\s*[0-9]+\s*章[\s　].*$",
]


def load_manifest() -> list[dict]:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def normalize_paragraphs(text: str) -> str:
    text = text.replace("\u3000", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            lines.append("")
            continue
        if re.match(r"^[\d①②③④⑤⑥⑦⑧⑨⑩⑪⑫]+$", line):
            continue
        lines.append(line)
    merged: list[str] = []
    buf = ""
    for line in lines:
        if not line:
            if buf:
                merged.append(buf)
                buf = ""
            merged.append("")
            continue
        if buf and (buf.endswith("。") or buf.endswith("！") or buf.endswith("？") or buf.endswith("）")):
            merged.append(buf)
            buf = line
        elif buf:
            buf += line
        else:
            buf = line
    if buf:
        merged.append(buf)
    return "\n".join([x for x in merged if x.strip()])


def split_by_markers(text: str) -> list[tuple[str, str]]:
    pattern = re.compile("|".join(f"({m})" for m in CHAPTER_MARKERS), re.MULTILINE)
    matches = list(pattern.finditer(text))
    if len(matches) < 5:
        raise ValueError(
            f"expected >=5 chapter markers, found {len(matches)}; "
            "check PDF text layer or provide a cleaned TXT"
        )
    sections: list[tuple[str, str]] = []
    for i, match in enumerate(matches):
        title = match.group(0).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if body:
            sections.append((title, body))
    return sections


def write_chapters(sections: list[tuple[str, str]], manifest: list[dict]) -> None:
    CHAPTERS.mkdir(parents=True, exist_ok=True)
    if len(sections) != len(manifest):
        print(
            f"warning: split got {len(sections)} sections, manifest has {len(manifest)}",
            file=sys.stderr,
        )
    count = min(len(sections), len(manifest))
    for i in range(count):
        meta = manifest[i]
        title, body = sections[i]
        path = CHAPTERS / meta["filename"]
        content = normalize_paragraphs(body)
        path.write_text(content + "\n", encoding="utf-8")
        print(f"wrote {path.name} ({len(content)} chars) <- {title}")


def fetch_cadal_manifest() -> list[dict]:
    url = "https://cadal.edu.cn/cardpage/bookCardPage?ssno=04912460"
    html = urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}),
        timeout=30,
    ).read().decode("utf-8", errors="replace")
    match = re.search(r"var data = (\[.*?\]);", html, re.S)
    if not match:
        raise RuntimeError("CADAL chapter tree not found")
    tree = json.loads(match.group(1))
    chapters: list[dict] = []
    idx = 1
    for volume in tree:
        for child in volume.get("children", []):
            chapters.append(
                {
                    "idx": idx,
                    "filename": f"{idx:02d}-第{'一二三四五六七八九十'[idx-1] if idx<=10 else str(idx)}章.txt",
                    "title": child["title"],
                    "start_page": child.get("displaypage"),
                }
            )
            idx += 1
    return chapters


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare 吴献书《理想国》 chapter files")
    parser.add_argument("--pdf", type=Path, help="PDF path (default: data/.../source/republic-wu.pdf)")
    parser.add_argument("--txt", type=Path, help="full TXT path")
    parser.add_argument("--refresh-manifest", action="store_true", help="refresh chapters.manifest.json from CADAL")
    args = parser.parse_args()

    if args.refresh_manifest or not MANIFEST.exists():
        manifest = fetch_cadal_manifest()
        for i, item in enumerate(manifest, start=1):
            item["filename"] = f"{i:02d}-第{'一二三四五六七八九十'[i-1]}章.txt"
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"updated {MANIFEST}")
    else:
        manifest = load_manifest()

    pdf_path = args.pdf or SOURCE / "republic-wu.pdf"
    txt_path = args.txt or SOURCE / "republic-full.txt"

    text = ""
    if txt_path.exists():
        text = txt_path.read_text(encoding="utf-8")
        print(f"loaded TXT: {txt_path}")
    elif pdf_path.exists():
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from pdf_text import extract_text_from_pdf

        text = extract_text_from_pdf(str(pdf_path))
        full_txt = SOURCE / "republic-full.txt"
        SOURCE.mkdir(parents=True, exist_ok=True)
        full_txt.write_text(text + "\n", encoding="utf-8")
        print(f"extracted PDF -> {full_txt} ({len(text)} chars)")
    else:
        print(
            "No source file found.\n"
            f"  Place PDF at: {pdf_path}\n"
            f"  or TXT at:    {txt_path}\n\n"
            "Recommended source (吴献书译本，1929，公版):\n"
            "  https://cadal.edu.cn/cardpage/bookCardPage?ssno=04912460\n"
            "  https://taiwanebook.ncl.edu.tw/zh-tw/book/NCL-000025488/reader\n",
            file=sys.stderr,
        )
        return 1

    sections = split_by_markers(text)
    write_chapters(sections, manifest)
    print(f"done: {len(sections)} chapters in {CHAPTERS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
