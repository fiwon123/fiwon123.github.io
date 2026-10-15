# Screenshots

The images in this directory are referenced from the project README (the home
page, in both themes and both views). They are committed, not generated on the
fly, so a visitor sees the site before running it.

| File                      | What it shows                       |
| ------------------------- | ----------------------------------- |
| `home-terminal-light.png` | Terminal view, Studio preset, light |
| `home-terminal-dark.png`  | Terminal view, Studio preset, dark  |
| `home-browse-light.png`   | Browse view, Studio preset, light   |
| `home-browse-dark.png`    | Browse view, Studio preset, dark    |

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
  produce (`data-testid="particles"`, `class="skip-link"`, and per-view ones) —
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

## Both themes

The default set is dark **and** light. A change verified in one theme only is
unverified; see the visual-check rules in the project's agent instructions.
