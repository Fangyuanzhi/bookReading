#!/usr/bin/env python3
"""Validate translated chapters against glossary consistency."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "plato-republic"
GLOSSARY = json.loads((DATA / "glossary.json").read_text(encoding="utf-8"))
CHAPTERS = DATA / "chapters"

# English terms that must NOT appear in final text
FORBIDDEN_EN = [
    r"\bSocrates\b",
    r"\bGlaucon\b",
    r"\bAdeimantus\b",
    r"\bPolemarchus\b",
    r"\bThrasymachus\b",
    r"\bPiraeus\b",
    r"\bjustice\b",
    r"\bRepublic\b",
]

# Required Chinese terms (at least one chapter should have these globally)
REQUIRED_ZH = ["苏格拉底", "格劳孔", "正义", "城邦", "灵魂"]


def main() -> int:
    files = sorted(CHAPTERS.glob("*.txt"))
    if len(files) != 10:
        print(f"error: expected 10 chapter files, got {len(files)}", file=sys.stderr)
        return 1

    all_text = ""
    errors: list[str] = []
    stats: list[tuple[str, int]] = []

    for path in files:
        text = path.read_text(encoding="utf-8")
        all_text += text
        stats.append((path.name, len(text)))

        for pat in FORBIDDEN_EN:
            if re.search(pat, text, re.I):
                errors.append(f"{path.name}: forbidden English pattern {pat}")

        if len(text.strip()) < 5000:
            errors.append(f"{path.name}: suspiciously short ({len(text)} chars)")

    for term in REQUIRED_ZH:
        if term not in all_text:
            errors.append(f"missing required term globally: {term}")

    print("Chapter sizes:")
    for name, size in stats:
        print(f"  {name}: {size:,} chars")

    print("\nGlossary spot-check:")
    for group in ("characters", "places", "terms"):
        for _en, zh in list(GLOSSARY[group].items())[:5]:
            print(f"  {zh}: {all_text.count(zh)}")

    if errors:
        print("\nValidation FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print("\nValidation OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
