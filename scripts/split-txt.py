#!/usr/bin/env python3
"""Split a full-text file into chapter files for import-book.py.

Default markers match 吴献书译本常见的「第一卷 … 第十卷」标题行。

Usage:
  python3 scripts/split-txt.py source/republic-full.txt -o data/plato-republic/chapters
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

DEFAULT_MARKERS = [
    r"^\s*第[一二三四五六七八九十]+卷\s*$",
    r"^\s*第\s*[0-9]+\s*卷\s*$",
    r"^\s*卷\s*[一二三四五六七八九十]+\s*$",
]


def split_text(text: str, markers: list[str]) -> list[tuple[str, str]]:
    pattern = re.compile("|".join(f"({m})" for m in markers), re.MULTILINE)
    matches = list(pattern.finditer(text))
    if not matches:
        raise ValueError("no chapter markers found; adjust --marker or clean the source text")

    sections: list[tuple[str, str]] = []
    for i, match in enumerate(matches):
        title = match.group(0).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if body:
            sections.append((title, body))
    return sections


def write_chapters(sections: list[tuple[str, str]], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for old in output_dir.glob("*.txt"):
        old.unlink()

    for idx, (title, body) in enumerate(sections, start=1):
        safe_title = re.sub(r"\s+", "", title)
        filename = f"{idx:02d}-{safe_title}.txt"
        path = output_dir / filename
        path.write_text(body + "\n", encoding="utf-8")
        print(f"wrote {path} ({len(body)} chars)")


def main() -> int:
    parser = argparse.ArgumentParser(description="Split full book txt into chapter files")
    parser.add_argument("source", type=Path, help="full text file")
    parser.add_argument("-o", "--output", type=Path, required=True, help="output chapters directory")
    parser.add_argument(
        "--marker",
        action="append",
        default=[],
        help="extra regex marker for chapter headings (repeatable)",
    )
    args = parser.parse_args()

    text = args.source.read_text(encoding="utf-8")
    markers = DEFAULT_MARKERS + args.marker
    sections = split_text(text, markers)
    write_chapters(sections, args.output)
    print(f"done: {len(sections)} chapters -> {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
