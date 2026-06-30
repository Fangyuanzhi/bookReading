#!/usr/bin/env python3
"""Validate translated chapters for Twelve Against the Gods."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "twelve-against-gods"
GLOSSARY = json.loads((DATA / "glossary.json").read_text(encoding="utf-8"))
CHAPTERS = DATA / "chapters"
MANIFEST = json.loads((DATA / "chapters.manifest.json").read_text(encoding="utf-8"))

FORBIDDEN_EN = [
    r"\bAlexander the Great\b",
    r"\bChristopher Columbus\b",
    r"\bWoodrow Wilson\b",
    r"\bIsadora Duncan\b",
    r"\bTwelve Against the Gods\b",
    r"\bWilliam Bolitho\b",
]

REQUIRED_ZH = ["冒险", "亚历山大", "拿破仑", "哥伦布"]


def main() -> int:
    errors: list[str] = []
    all_text = ""
    stats: list[tuple[str, int]] = []

    for item in MANIFEST:
        path = CHAPTERS / item["filename"]
        if not path.exists():
            errors.append(f"missing file: {item['filename']}")
            continue
        text = path.read_text(encoding="utf-8")
        all_text += text
        stats.append((path.name, len(text)))

        for pat in FORBIDDEN_EN:
            if re.search(pat, text, re.I):
                errors.append(f"{path.name}: forbidden English pattern {pat}")

        if len(text.strip()) < 1500:
            errors.append(f"{path.name}: suspiciously short ({len(text)} chars)")

    if len(stats) != len(MANIFEST):
        errors.append(f"expected {len(MANIFEST)} chapters, got {len(stats)}")

    for term in REQUIRED_ZH:
        if term not in all_text:
            errors.append(f"missing required term globally: {term}")

    print("Chapter sizes:")
    for name, size in stats:
        print(f"  {name}: {size:,} chars")

    if errors:
        print("\nValidation FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print("\nValidation OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
