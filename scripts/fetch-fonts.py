#!/usr/bin/env python3
"""Download the self-hosted webfonts into public/fonts/.

Google Fonts serves woff2 only to a browser-like User-Agent, so this sends a
desktop UA, keeps the `latin` and `latin-ext` subsets, and writes one file per
subset. Re-run when a family or weight range changes.

    python3 scripts/fetch-fonts.py

Standard library only, so it needs no install step.
"""

from __future__ import annotations

import os
import re
import urllib.request

UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
CSS_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=Space+Grotesk:wght@400..700"
    "&family=JetBrains+Mono:wght@400..600"
    "&display=swap"
)
SUBSETS = {"latin", "latin-ext"}
DEST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "fonts")


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def main() -> None:
    css = fetch(CSS_URL).decode("utf-8", errors="ignore")
    blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S)

    os.makedirs(DEST, exist_ok=True)
    written = 0
    for subset, body in blocks:
        if subset not in SUBSETS:
            continue
        family_match = re.search(r"font-family:\s*'([^']+)'", body)
        url_match = re.search(r"url\((https[^)]+)\)", body)
        if not family_match or not url_match:
            continue

        slug = family_match.group(1).lower().replace(" ", "-")
        path = os.path.join(DEST, f"{slug}-{subset}.woff2")
        data = fetch(url_match.group(1))
        with open(path, "wb") as handle:
            handle.write(data)
        print(f"{path}  {len(data)} bytes")
        written += 1

    if written == 0:
        raise SystemExit("no font files written — Google Fonts markup changed?")


if __name__ == "__main__":
    main()
