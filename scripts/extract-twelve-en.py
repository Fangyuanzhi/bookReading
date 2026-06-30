#!/usr/bin/env python3
"""Extract chapters from English full text of Twelve Against the Gods.

Expects source at data/twelve-against-gods/source/en/full.txt
Chapter markers are ALL-CAPS titles on their own line, e.g. ALEXANDER THE GREAT
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "twelve-against-gods"
SOURCE = DATA / "source" / "en" / "full.txt"
OUT = DATA / "source" / "en"

CHAPTER_MARKERS = [
    (1, "INTRODUCTION", "intro.txt"),
    (2, "ALEXANDER THE GREAT", "02-alexander.txt"),
    (3, "CASANOVA", "03-casanova.txt"),
    (4, "CHRISTOPHER COLUMBUS", "04-columbus.txt"),
    (5, "MAHOMET", "05-mahomet.txt"),
    (6, "LOLA MONTEZ", "06-lola-montez.txt"),
    (7, "CAGLIOSTRO", "07-cagliostro.txt"),
    (8, "CHARLES XII", "08-charles-xii.txt"),
    (9, "NAPOLEON I", "09-napoleon-i.txt"),
    (10, "CATILINE", "10-catiline.txt"),
    (11, "NAPOLEON III", "11-napoleon-iii.txt"),
    (12, "ISADORA DUNCAN", "12-isadora-duncan.txt"),
    (13, "WOODROW WILSON", "13-woodrow-wilson.txt"),
]


def find_marker_line(lines: list[str], marker: str) -> int:
    pat = re.compile(rf"^\s*{re.escape(marker)}\s*$", re.I)
    for i, line in enumerate(lines):
        if pat.match(line.strip()):
            return i
    raise ValueError(f"marker not found: {marker}")


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"missing source: {SOURCE}\nDownload PD text to this path first.")

    lines = SOURCE.read_text(encoding="utf-8", errors="replace").splitlines()
    positions: list[tuple[int, str, str]] = []
    for _idx, marker, filename in CHAPTER_MARKERS:
        positions.append((find_marker_line(lines, marker), marker, filename))
    positions.sort()

    OUT.mkdir(parents=True, exist_ok=True)
    for j, (pos, marker, filename) in enumerate(positions):
        end = positions[j + 1][0] if j + 1 < len(positions) else len(lines)
        text = "\n".join(lines[pos + 1 : end]).strip()
        path = OUT / filename
        path.write_text(text + "\n", encoding="utf-8")
        print(f"{marker}: {len(text)} chars -> {path}")


if __name__ == "__main__":
    main()
