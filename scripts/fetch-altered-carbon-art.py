#!/usr/bin/env python3
"""Download public-domain chapter art for 《副本》 from Met Open Access API."""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public"
MET = "https://collectionapi.metmuseum.org/public/collection/v1"
CREDITS_PATH = ROOT / "frontend" / "src" / "data" / "illustration-credits-altered-carbon.json"

# Met object IDs (isPublicDomain verified via Open Access API)
ASSETS = {
    # Cover: Whistler nocturne — urban night / noir mood
    "covers/altered-carbon.jpg": {"met": 337702},
    # 序章 — Alcatraz stack awakening
    "illustrations/altered-carbon/c01.jpg": {"met": 816189},
    # 第一部·抵达 — arrival on Earth
    "illustrations/altered-carbon/c02.jpg": {"met": 65417},
    # 第二部·反应 — interrogation & denial
    "illustrations/altered-carbon/c03.jpg": {"met": 437986},
    # 第三部·结盟 — alliance on the water
    "illustrations/altered-carbon/c04.jpg": {"met": 436947},
    # 第四部·说服 — family gathering
    "illustrations/altered-carbon/c05.jpg": {"met": 626692},
    # 第五部·复仇女神 — warrior deity
    "illustrations/altered-carbon/c06.jpg": {"met": 53162},
    # 尾声 — departure, bonfires on the bay
    "illustrations/altered-carbon/c07.jpg": {"met": 364371},
}

CHAPTER_LABELS = {
    1: "序章",
    2: "第一部·抵达",
    3: "第二部·反应",
    4: "第三部·结盟",
    5: "第四部·说服",
    6: "第五部·复仇女神",
    7: "尾声",
}


def fetch_json(url: str, retries: int = 5) -> dict:
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"User-Agent": "bookReading-art-fetch/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as exc:
            if exc.code == 403 and attempt < retries - 1:
                time.sleep(8 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"Failed to fetch {url}")


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
    }
    return url, meta


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "bookReading-art-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = resp.read()
    if len(data) < 5000:
        raise RuntimeError(f"Download too small ({len(data)} bytes): {url}")
    dest.write_bytes(data)
    print(f"  saved {dest.name} ({len(data) // 1024} KB)")


def main() -> int:
    credits = {
        "note": "Public-domain artworks via Met Open Access API.",
        "cover": None,
        "chapters": {},
    }

    for rel_path, spec in ASSETS.items():
        dest = OUT / rel_path
        print(f"-> {rel_path}")
        url, meta = met_image_url(spec["met"])
        time.sleep(3)
        download(url, dest)

        entry = {"file": Path(rel_path).name, **meta}
        if rel_path.startswith("covers/"):
            credits["cover"] = entry
        else:
            vol = int(Path(rel_path).stem[1:])
            credits["chapters"][str(vol)] = entry
            print(f"   ({CHAPTER_LABELS.get(vol, vol)})")

    CREDITS_PATH.write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"credits -> {CREDITS_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
