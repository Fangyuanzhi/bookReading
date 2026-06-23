"""Minimal PDF text extraction without third-party deps.

Works for PDFs with an embedded text layer (not pure scan images).
"""

from __future__ import annotations

import re
import zlib


def _decode_pdf_literal(raw: bytes) -> str:
    out = bytearray()
    i = 0
    while i < len(raw):
        ch = raw[i]
        if ch == ord("\\") and i + 1 < len(raw):
            nxt = raw[i + 1]
            mapping = {
                ord("n"): ord("\n"),
                ord("r"): ord("\r"),
                ord("t"): ord("\t"),
                ord("b"): ord("\b"),
                ord("f"): ord("\f"),
                ord("("): ord("("),
                ord(")"): ord(")"),
                ord("\\"): ord("\\"),
            }
            if nxt in mapping:
                out.append(mapping[nxt])
                i += 2
                continue
            if 48 <= nxt <= 55 and i + 3 < len(raw):  # octal \ddd
                oct_digits = bytes([nxt, raw[i + 2], raw[i + 3]])
                if all(48 <= b <= 55 for b in oct_digits):
                    out.append(int(oct_digits.decode("ascii"), 8))
                    i += 4
                    continue
        out.append(ch)
        i += 1
    for enc in ("utf-8", "gb18030", "big5", "latin-1"):
        try:
            return out.decode(enc)
        except UnicodeDecodeError:
            continue
    return out.decode("utf-8", errors="replace")


def _extract_strings(blob: bytes) -> list[str]:
    strings: list[str] = []
    for match in re.finditer(rb"\((?:\\.|[^\\\)])*\)\s*Tj", blob):
        literal = match.group(0)
        inner = literal[1 : literal.rfind(b")")]
        strings.append(_decode_pdf_literal(inner))
    for match in re.finditer(rb"\[(.*?)\]\s*TJ", blob, re.S):
        array = match.group(1)
        for part in re.finditer(rb"\((?:\\.|[^\\\)])*\)", array):
            strings.append(_decode_pdf_literal(part.group(0)[1:-1]))
    return strings


def extract_text_from_pdf(path: str) -> str:
    data = open(path, "rb").read()
    chunks: list[str] = []

    for stream in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", data, re.S):
        raw = stream.group(1).strip(b"\r\n")
        candidates = [raw]
        try:
            candidates.insert(0, zlib.decompress(raw))
        except zlib.error:
            pass
        for blob in candidates:
            chunks.extend(_extract_strings(blob))

    if not chunks:
        raise ValueError(f"no embedded text found in PDF: {path}")

    text = "\n".join(chunks)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
