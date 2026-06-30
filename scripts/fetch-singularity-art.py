#!/usr/bin/env python3
"""Download public-domain chapter art for 《奇点天空》 from Met Open Access API."""

from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public"
MET = "https://collectionapi.metmuseum.org/public/collection/v1"

# Met object IDs (all isPublicDomain via Open Access API)
ASSETS = {
    "covers/singularity.jpg": {"met": 193606},  # Celestial globe with clockwork
    "illustrations/singularity/c01.jpg": {"met": 786870},  # Solar Eclipse from Caroline Island
    "illustrations/singularity/c02.jpg": {"met": 283180},  # Eclipse of the Sun
    "illustrations/singularity/c03.jpg": {"met": 459029},  # The Molo, Venice (ships / departure)
    "illustrations/singularity/c04.jpg": {"met": 437326},  # Blind Orion Searching for the Rising Sun
    "illustrations/singularity/c05.jpg": {"met": 206965},  # Longcase astronomical regulator
    "illustrations/singularity/c06.jpg": {"met": 251929},  # Marble statue of a wounded warrior
    "illustrations/singularity/c07.jpg": {"met": 889523},  # Astro map almanac (New York)
    "illustrations/singularity/c08.jpg": {"met": 451379},  # Bowl with Courtly and Astrological Motifs
    "illustrations/singularity/c09.jpg": {"met": 436843},  # Apollo and Aurora
    "illustrations/singularity/c10.jpg": {"met": 437790},  # Allegory of the Planets and Continents
    "illustrations/singularity/c11.jpg": {"met": 544062},  # Horses Harnessed to a Chariot
    "illustrations/singularity/c12.jpg": {"met": 435997},  # The Storm
    "illustrations/singularity/c13.jpg": {"met": 428401},  # Jupiter, from "The Seven Planets"
    "illustrations/singularity/c14.jpg": {"met": 444553},  # Basin with Zodiac Signs and Royal Titles
    "illustrations/singularity/c15.jpg": {"met": 194191},  # Clock watch with astronomical dial
    "illustrations/singularity/c16.jpg": {"met": 724720},  # Family Christian Almanac (celestial charts)
}


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "bookReading-art-fetch/1.0"})
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
    print(f"  saved {dest.name} ({len(data)//1024} KB)")


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
        download(url, dest)

        entry = {"file": Path(rel_path).name, **meta}
        if rel_path.startswith("covers/"):
            credits["cover"] = entry
        else:
            ch = int(Path(rel_path).stem[1:])  # c01 -> 1
            credits["chapters"][str(ch)] = entry

    credits_path = OUT / "illustrations" / "singularity" / "credits.json"
    credits_path.write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    src_credits = ROOT / "frontend" / "src" / "data" / "illustration-credits-singularity.json"
    src_credits.write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"credits -> {credits_path}")
    print(f"credits -> {src_credits}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
