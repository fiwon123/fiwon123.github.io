# Screenshots

The image in this directory is referenced from the project README (the home page
in dark mode). It is committed, not generated on the fly, so a visitor sees the
site before running it.

| File            | What it shows           |
| --------------- | ----------------------- |
| `home-dark.png` | Home page, Studio, dark |

## Regenerate

The harness (`scripts/screenshots.mjs`) captures the **built** site, so build
first — `make screenshots` depends on `build` and does it for you:

```bash
make screenshots            # build + capture into docs/screenshots/
```

It drives the `google-chrome` binary directly (no Playwright, no browser
download); override the binary or the output directory when needed:

```bash
CHROME=/usr/bin/chromium SCREENSHOTS_DIR=../docs/screenshots make screenshots
```

## Why it is trustworthy

A capture that looks fine is easy to produce and worthless if the page never
rendered. This harness **refuses to write an image it cannot trust** and exits
non-zero:

- it dumps the rendered DOM first and requires mount markers React can only
  produce (`<canvas`, `class="skip-link"`, and per-capture ones) —
  a page that did not mount has none of them, so the capture is never taken;
- it rejects a PNG below a size floor (a blank or single-colour image compresses
  far below it);
- it holds `/slow.js` open so `--screenshot` fires on the mounted page, not the
  pre-React frame (see below).

## Capturing a React page headlessly

`--screenshot` fires at the load event, and this app renders with React, so a
plain capture is the _pre-React_ frame and looks like a broken app that is not
one. The harness serves a deferred `/slow.js` that stalls for a few seconds:
deferred scripts run in order, so the module mounts first while the held request
keeps the load event pending and the capture lands on the real page. It also
injects `transition:none` and forces the scroll-reveal visible, so a capture is
the settled page rather than whatever animation frame the load event caught.

## Fonts

A capture environment with **no fonts** renders glyphs as nothing: layout and
colours still draw, so every PNG comes out looking like a blank console. Install
a font package on a bare host (e.g. `fonts-dejavu-core`) — the file size looks
fine, the image does not.

## Dark only

The README set is **dark** — the site's default — captured as one state (the home
page). Light/dark _verification_ is a throwaway visual-QA concern, not a committed
artifact: a change is checked in both themes while it is made, but only the dark
capture is published. See the visual-check rules in the project's agent
instructions.
