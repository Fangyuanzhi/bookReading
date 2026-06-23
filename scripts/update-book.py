#!/usr/bin/env python3
"""Replace chapters for an existing book (keep the same book id).

Usage:
  python3 scripts/update-book.py --book-id 33631cda-65b8-459c-9c18-69984cade79c data/plato-republic
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path


def load_chapters_from_dir(book_dir: Path) -> list[dict]:
    manifest_path = book_dir / "chapters.manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        chapters = []
        for item in manifest:
            path = book_dir / "chapters" / item["filename"]
            if not path.exists():
                raise FileNotFoundError(path)
            chapters.append(
                {
                    "title": item["title"],
                    "idx": item["idx"],
                    "href": item["filename"],
                    "content": path.read_text(encoding="utf-8").strip(),
                }
            )
        return chapters

    chapters_dir = book_dir / "chapters"
    chapter_files = sorted(chapters_dir.glob("*.txt"))
    chapters: list[dict] = []
    for idx, path in enumerate(chapter_files, start=1):
        stem = path.stem
        title_match = re.match(r"^\d+-(.+)$", stem)
        title = title_match.group(1) if title_match else stem
        chapters.append(
            {
                "title": title,
                "idx": idx,
                "href": f"{path.stem}.txt",
                "content": path.read_text(encoding="utf-8").strip(),
            }
        )
    return chapters


def psql(sql: str) -> str:
    cmd = [
        "psql",
        "-h",
        "localhost",
        "-U",
        "peidu",
        "-d",
        "peidu",
        "-t",
        "-A",
        "-c",
        sql,
    ]
    env = {**os.environ, "PGPASSWORD": "peidu123"}
    result = subprocess.run(cmd, capture_output=True, text=True, env=env, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "psql failed")
    return result.stdout.strip()


def load_chapters(book_dir: Path) -> list[dict]:
    return load_chapters_from_dir(book_dir)


def update_via_api(api_base: str, token: str, book_id: str, chapters: list[dict]) -> None:
    # Backend has no update-chapter API; recreate via SQL is safer for bulk replace.
    raise NotImplementedError("use default SQL mode")


def update_via_sql(book_id: str, chapters: list[dict]) -> None:
    psql(f"DELETE FROM chapters WHERE book_id = '{book_id}';")
    for ch in chapters:
        title = ch["title"].replace("'", "''")
        href = ch["href"].replace("'", "''")
        content = ch["content"].replace("'", "''")
        psql(
            "INSERT INTO chapters (book_id, idx, title, href, content) "
            f"VALUES ('{book_id}', {ch['idx']}, '{title}', '{href}', '{content}');"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Replace chapters for an existing book")
    parser.add_argument("book_dir", type=Path, help="book data directory")
    parser.add_argument("--book-id", required=True, help="existing book UUID")
    parser.add_argument("--api", default="http://127.0.0.1:8080/api/v1")
    parser.add_argument("--email", default="importer@peidu.local")
    parser.add_argument("--password", default="Importer123")
    args = parser.parse_args()

    book_dir = args.book_dir.resolve()
    chapters = load_chapters_from_dir(book_dir)
    if not chapters:
        print("no chapters to import", file=sys.stderr)
        return 1

    try:
        update_via_sql(args.book_id, chapters)
    except Exception as exc:  # noqa: BLE001
        print(f"error: {exc}", file=sys.stderr)
        return 1

    count = psql(f"SELECT COUNT(*) FROM chapters WHERE book_id = '{args.book_id}';")
    print(json.dumps({"book_id": args.book_id, "chapters": int(count or 0)}, ensure_ascii=False, indent=2))
    print(f"Updated book {args.book_id} with {count} chapters.")
    print(f"Open: http://127.0.0.1:3000/book/{args.book_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
