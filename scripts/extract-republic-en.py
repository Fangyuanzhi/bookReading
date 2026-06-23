#!/usr/bin/env python3
"""Extract 10 books from Gutenberg Republic (Jowett, PD) dialogue section."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "plato-republic" / "source" / "en"
EN2 = Path("/tmp/republic-en2.txt")
TAIL = Path("/tmp/republic-tail.txt")


def read_lines(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8", errors="replace").splitlines()


def extract_dialogue_books(lines: list[str], start_line: int) -> dict[int, str]:
    markers: list[tuple[int, int]] = []
    for i, line in enumerate(lines):
        if i < start_line:
            continue
        if re.fullmatch(r"BOOK [IVX]+\.", line.strip()):
            num = roman_to_int(line.strip().split()[1].rstrip("."))
            markers.append((num, i))
    markers.sort()
    books: dict[int, str] = {}
    for j, (num, pos) in enumerate(markers):
        end = markers[j + 1][1] if j + 1 < len(markers) else len(lines)
        text = "\n".join(lines[pos + 1 : end]).strip()
        books[num] = text
    return books


def roman_to_int(s: str) -> int:
    mapping = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10}
    return mapping[s]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    en2 = read_lines(EN2)
    books = extract_dialogue_books(en2, start_line=8000)

    tail = read_lines(TAIL)
    tail_books = extract_dialogue_books(tail, start_line=0)
    vi_tail = "\n".join(tail[: next(i for i, l in enumerate(tail) if l.strip().startswith("BOOK VII."))]).strip()
    if books.get(6) and vi_tail:
        books[6] = (books[6] + "\n\n" + vi_tail).strip()

    for num in range(7, 11):
        if num in tail_books:
            books[num] = tail_books[num]

    for num in range(1, 11):
        if num not in books:
            raise SystemExit(f"missing book {num}")
        path = OUT / f"book-{num:02d}.txt"
        path.write_text(books[num] + "\n", encoding="utf-8")
        print(f"book {num}: {len(books[num])} chars -> {path}")


if __name__ == "__main__":
    main()
