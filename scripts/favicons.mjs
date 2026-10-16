#!/usr/bin/env node
// Generate the consistent favicon set from favicon.svg.
//
// Mirrors the dependency-free headless-Chrome harness used by screenshots.mjs:
// launches a real Chrome, renders favicon.svg in the page, takes PNGs at the
// requested sizes, writes them, and packs a valid PNG-in-ICO as favicon.ico.
//
// Fails loudly if a capture is blank, too small, or has opaque corners.
