#!/usr/bin/env python3
"""Import a book + chapters into 陪读 via REST API.

Usage:
  python3 scripts/import-book.py data/plato-republic
  python3 scripts/import-book.py data/plato-republic --api http://127.0.0.1:8080/api/v1
  python3 scripts/import-book.py data/plato-republic --email x@y.com --password 'Pass123!'
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path


def request_json(method: str, url: str, token: str | None = None, body: dict | list | None = None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} -> HTTP {exc.code}: {detail}") from exc
    if payload.get("code") != 200:
        raise RuntimeError(f"{method} {url} -> API error: {payload}")
    return payload.get("data")


def login(api_base: str, email: str, password: str) -> str:
    data = request_json(
        "POST",
        f"{api_base}/auth/login",
        body={"email": email, "password": password},
    )
    return data["token"]


def load_manifest(book_dir: Path) -> dict:
    manifest_path = book_dir / "book.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"missing manifest: {manifest_path}")
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def load_chapters(book_dir: Path) -> list[dict]:
    chapters_dir = book_dir / "chapters"
    if not chapters_dir.is_dir():
        raise FileNotFoundError(f"missing chapters dir: {chapters_dir}")

    chapter_files = sorted(chapters_dir.glob("*.txt"))
    if not chapter_files:
        raise FileNotFoundError(f"no chapter txt files in {chapters_dir}")

    chapters: list[dict] = []
    for idx, path in enumerate(chapter_files, start=1):
        stem = path.stem
        title_match = re.match(r"^\d+-(.+)$", stem)
        title = title_match.group(1) if title_match else stem
        content = path.read_text(encoding="utf-8").strip()
        if not content:
            raise ValueError(f"empty chapter file: {path}")
        chapters.append(
            {
                "title": title,
                "idx": idx,
                "href": f"{path.stem}.txt",
                "content": content,
            }
        )
    return chapters


def import_book(api_base: str, token: str, book_dir: Path, *, publish: bool) -> dict:
    manifest = load_manifest(book_dir)
    chapters = load_chapters(book_dir)
    book_meta = manifest["book"]
    should_publish = publish or bool(manifest.get("publish"))

    book = request_json("POST", f"{api_base}/books", token=token, body=book_meta)
    book_id = book["id"]

    request_json("POST", f"{api_base}/books/{book_id}/chapters", token=token, body=chapters)

    if should_publish and book.get("status") != "published":
        request_json(
            "PATCH",
            f"{api_base}/books/{book_id}/status",
            token=token,
            body={"status": "published"},
        )

    detail = request_json("GET", f"{api_base}/books/{book_id}", token=token)
    return {
        "id": book_id,
        "title": detail.get("title", book_meta.get("title")),
        "chapters": len(chapters),
        "status": detail.get("status", book.get("status")),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Import a book directory into 陪读")
    parser.add_argument("book_dir", type=Path, help="directory containing book.json and chapters/")
    parser.add_argument("--api", default="http://127.0.0.1:8080/api/v1", help="API base URL")
    parser.add_argument("--email", default="importer@peidu.local", help="login email")
    parser.add_argument("--password", default="Importer123", help="login password")
    parser.add_argument(
        "--publish",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="publish after import (default: true; original-source books start as draft)",
    )
    args = parser.parse_args()

    book_dir = args.book_dir.resolve()
    if not book_dir.is_dir():
        print(f"error: not a directory: {book_dir}", file=sys.stderr)
        return 1

    try:
        token = login(args.api.rstrip("/"), args.email, args.password)
        result = import_book(args.api.rstrip("/"), token, book_dir, publish=args.publish)
    except Exception as exc:  # noqa: BLE001 - CLI tool
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"\nImported «{result['title']}» with {result['chapters']} chapters.")
    print(f"Open: http://127.0.0.1:3000/book/{result['id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
