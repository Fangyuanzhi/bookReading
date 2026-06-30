#!/usr/bin/env python3
"""Validate SF book data packages (original Chinese retellings)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PACKAGES = [
    ("clarke-fountains", ["卡里达萨", "摩根", "太空电梯"]),
    ("stross-singularity-sky", ["曼苏尔", "节庆", "奇点"]),
    ("morgan-altered-carbon", ["科瓦奇", "班克罗夫特", "换壳"]),
]


def validate_package(slug: str, required_terms: list[str]) -> list[str]:
    data_dir = ROOT / "data" / slug
    manifest = json.loads((data_dir / "chapters.manifest.json").read_text(encoding="utf-8"))
    chapters_dir = data_dir / "chapters"
    errors: list[str] = []
    all_text = ""

    print(f"\n=== {slug} ===")
    for item in manifest:
        path = chapters_dir / item["filename"]
        if not path.exists():
            errors.append(f"{slug}: missing {item['filename']}")
            continue
        text = path.read_text(encoding="utf-8")
        all_text += text
        size = len(text)
        print(f"  {item['filename']}: {size:,} chars")
        if size < 1500:
            errors.append(f"{slug}/{item['filename']}: too short ({size})")

    for term in required_terms:
        if term not in all_text:
            errors.append(f"{slug}: missing required term: {term}")

    return errors


def main() -> int:
    errors: list[str] = []
    for slug, terms in PACKAGES:
        errors.extend(validate_package(slug, terms))

    if errors:
        print("\nValidation FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print("\nValidation OK (3 packages)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
