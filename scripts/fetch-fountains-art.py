#!/usr/bin/env python3
"""Download public-domain chapter art for 《天堂的喷泉》 from Met Open Access API."""

from __future__ import annotations

import json
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public"
MET = "https://collectionapi.metmuseum.org/public/collection/v1"
API_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; bookReading-art-fetch/1.0)",
    "Accept": "application/json",
}
IMAGE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; bookReading-art-fetch/1.0)",
    "Accept": "image/*,*/*",
    "Referer": "https://www.metmuseum.org/",
}

# Met object IDs (all isPublicDomain via Open Access API)
ASSETS = {
    "covers/fountains.jpg": {
        "met": 10481,
        "note": "Heart of the Andes — monumental peaks (Sigiriya/tower echo), sublime epic scope",
    },
    "illustrations/fountains/c01.jpg": {
        "met": 10480,
        "note": "序言 — The Aegean Sea, opening vista",
    },
    "illustrations/fountains/c02.jpg": {
        "met": 452102,
        "note": "第一部·宫殿 — Damascus Room palace interior",
    },
    "illustrations/fountains/c03.jpg": {
        "met": 74832,
        "note": "第二部·神殿 — Buddha Expounding the Dharma",
    },
    "illustrations/fountains/c04.jpg": {
        "met": 206965,
        "note": "第三部·钟 — Longcase astronomical regulator",
    },
    "illustrations/fountains/c05.jpg": {
        "met": 435922,
        "note": "第四部·塔 — Salisbury Cathedral spire/tower",
    },
    "illustrations/fountains/c06.jpg": {
        "met": 436843,
        "note": "第五部·升天 — Apollo and Aurora, celestial ascension",
    },
    "illustrations/fountains/c07.jpg": {
        "met": 438816,
        "note": "尾声 — The Forest in Winter at Sunset",
    },
}


def fetch_json(url: str) -> dict:
    time.sleep(1.5)
    req = urllib.request.Request(url, headers=API_HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)


def met_image_url(object_id: int) -> tuple[str, dict]:
    obj = fetch_json(f"{MET}/objects/{object_id}")
    if not obj.get("isPublicDomain"):
        raise RuntimeError(f"Met object {object_id} is not public domain")
    url = obj.get("primaryImage") or obj.get("primaryImageSmall")
    if not url:
        raise RuntimeError(f"Met object {object_id} has no image")
    meta = {
        "title": obj.get("title"),
        "artist": obj.get("artistDisplayName"),
        "year": obj.get("objectDate"),
        "source": obj.get("objectURL"),
        "metId": object_id,
    }
    return url, meta


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers=IMAGE_HEADERS)
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = resp.read()
    if len(data) < 5000:
        raise RuntimeError(f"Download too small ({len(data)} bytes): {url}")
    dest.write_bytes(data)
    print(f"  saved {dest.name} ({len(data)//1024} KB)")


def chapter_index(rel_path: str) -> int | None:
    stem = Path(rel_path).stem
    if stem.startswith("c") and stem[1:].isdigit():
        return int(stem[1:])
    return None


def main() -> int:
    credits = {
        "note": "Public-domain artworks via Met Open Access API (isPublicDomain only).",
        "cover": None,
        "chapters": {},
    }

    for rel_path, spec in ASSETS.items():
        dest = OUT / rel_path
        print(f"-> {rel_path} (Met {spec['met']})")
        url, meta = met_image_url(spec["met"])
        download(url, dest)

        entry = {"file": Path(rel_path).name, **{k: v for k, v in meta.items() if k != "metId"}}
        if rel_path.startswith("covers/"):
            credits["cover"] = entry
        else:
            idx = chapter_index(rel_path)
            if idx is not None:
                credits["chapters"][str(idx)] = entry

    src_credits = ROOT / "frontend" / "src" / "data" / "illustration-credits-fountains.json"
    src_credits.write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"credits -> {src_credits}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
