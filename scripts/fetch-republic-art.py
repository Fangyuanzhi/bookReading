#!/usr/bin/env python3
"""Download public-domain chapter art for 《理想国》 from Met Open Access + NGA."""

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
    "covers/republic.jpg": {"met": 10482},  # Frederic Edwin Church, The Parthenon
    "illustrations/b1_piraeus.jpg": {"met": 436105},  # David, Death of Socrates
    "illustrations/b2_citybirth.jpg": {"met": 702994},  # Temple of Bacchus, Athens
    "illustrations/b3_muses.jpg": {"met": 435844},  # Caravaggio, The Musicians
    "illustrations/b4_virtues.jpg": {"met": 195384},  # Triumph of the Cardinal Virtues
    "illustrations/b5_guardians.jpg": {"met": 253512},  # Bronze warrior
    "illustrations/b6_dividedline.jpg": {"met": 436843},  # Apollo and Aurora
    "illustrations/b7_cave.jpg": {
        "url": "https://media.nga.gov/iiif/66e4ef40-041c-410a-bd57-abd3c7544b93/full/!1400,1000/0/default.jpg",
        "title": "Plato's Cave (Antrum Platonicum)",
        "artist": "Jan Pietersz Saenredam after Cornelis van Haarlem",
        "year": "1604",
        "source": "https://www.nga.gov/collection/art-object-page.62542.html",
    },
    "illustrations/b8_regimes.jpg": {"met": 251929},  # Marble wounded warrior (polis & war)
    "illustrations/b9_tyrant.jpg": {"met": 544062},  # Horses Harnessed to a Chariot
    "illustrations/b10_mythofer.jpg": {"met": 435725},  # Christ's Descent into Hell
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
    credits = {"note": "Public-domain artworks via Met Open Access API and NGA Open Access.", "cover": None, "chapters": {}}

    for rel_path, spec in ASSETS.items():
        dest = OUT / rel_path
        print(f"-> {rel_path}")
        if "met" in spec:
            url, meta = met_image_url(spec["met"])
        else:
            url = spec["url"]
            meta = {k: spec[k] for k in ("title", "artist", "year", "source") if k in spec}
        download(url, dest)

        entry = {"file": Path(rel_path).name, **meta}
        if rel_path.startswith("covers/"):
            credits["cover"] = entry
        else:
            vol = int(Path(rel_path).stem.split("_")[0][1:])
            credits["chapters"][str(vol)] = entry

    credits_path = OUT / "illustrations" / "credits.json"
    credits_path.write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    src_credits = ROOT / "frontend" / "src" / "data" / "illustration-credits.json"
    src_credits.write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"credits -> {credits_path}")
    print(f"credits -> {src_credits}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
