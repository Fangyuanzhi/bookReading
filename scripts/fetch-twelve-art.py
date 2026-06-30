#!/usr/bin/env python3
"""Download public-domain chapter art for 《十二个对抗众神的人》 from Met Open Access API."""

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
# Chapter order matches data/twelve-against-gods/chapters.manifest.json
ASSETS = {
    "covers/twelve.jpg": {
        "met": 337700,
        "note": "Cover — Hercules chasing Avarice from the Temple of the Muses (defiance of the gods)",
    },
    "illustrations/twelve/c01.jpg": {
        "met": 355651,
        "note": "引言 — Fall of the Rebel Angels (Delacroix after Rubens)",
    },
    "illustrations/twelve/c02.jpg": {
        "met": 191486,
        "note": "亚历山大 — Alexander the Great cameo",
    },
    "illustrations/twelve/c03.jpg": {
        "met": 437812,
        "note": "卡萨诺瓦 — A Dance in the Country (Tiepolo, Venice)",
    },
    "illustrations/twelve/c04.jpg": {
        "met": 437854,
        "note": "哥伦布 — Whalers (Turner, maritime adventure)",
    },
    "illustrations/twelve/c05.jpg": {
        "met": 454661,
        "note": "穆罕默德 — Folio from the Tashkent Qur'an",
    },
    "illustrations/twelve/c06.jpg": {
        "met": 436944,
        "note": "洛拉·蒙特斯 — The Spanish Singer (Manet)",
    },
    "illustrations/twelve/c07.jpg": {
        "met": 435725,
        "note": "卡格利奥斯特罗 — Christ's Descent into Hell (Bosch, mysticism)",
    },
    "illustrations/twelve/c08.jpg": {
        "met": 715877,
        "note": "查理十二世 — The Battle of Qoš-qulaq",
    },
    "illustrations/twelve/c09.jpg": {
        "met": 436408,
        "note": "拿破仑一世 — Napoleon Bonaparte portrait",
    },
    "illustrations/twelve/c10.jpg": {
        "met": 248722,
        "note": "卡提林 — Marble bust of a man (Roman senator)",
    },
    "illustrations/twelve/c11.jpg": {
        "met": 205721,
        "note": "拿破仑三世 — Napoléon III (Carpeaux)",
    },
    "illustrations/twelve/c12.jpg": {
        "met": 436155,
        "note": "伊莎多拉·邓肯 — The Rehearsal of the Ballet Onstage (Degas)",
    },
    "illustrations/twelve/c13.jpg": {
        "met": 189425,
        "note": "伍德罗·威尔逊 — The Louis XV Room (Versailles, Peace Conference era)",
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

    src_credits = ROOT / "frontend" / "src" / "data" / "illustration-credits-twelve.json"
    src_credits.write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"credits -> {src_credits}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
