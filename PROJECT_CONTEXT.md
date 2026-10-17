# Project Context

> **This file is the project identity, and it is the source of truth for what this
> repository is.** `AGENTS.md` describes how to work in it; where the two state the
> same fact, this file owns it, and `make check-docs` fails if they disagree.
> Update this file when the project changes, then propagate to `AGENTS.md`.

---

## Identity

- **Project Name**: felipeinoue.com
- **One-liner**: A fast, accessible, bilingual single-page portfolio for Felipe Inoue — the work is browsable with the keyboard, the theme is switchable, and there is no framework bloat.
- **GitHub repository**: `https://github.com/fiwon123/fiwon123.github.io`
- **Live site**: `https://felipeinoue.com/`

## Problem

A portfolio has to present work, experience and contact information without the
weight of a framework-built site, and it has to stay usable for people who
navigate by keyboard or screen reader, read Portuguese, or want a dark page.
Those constraints are usually the first thing dropped, so they are enforced by
tests here instead of by intention.

## Goal

A visitor can explore the content through conventional navigation, switch
language (EN/PT-BR) and theme (5 presets × light/dark), and read everything at
WCAG AA contrast — with the whole site served as static files.

## Stack

- **Frontend**: React 19 + TypeScript 6 + Vite 8 (SPA, single page, no router)
- **Styling**: CSS Modules + custom-property tokens in `src/theme/tokens.css` — no utility framework
- **Linting / formatting**: oxlint 1.81.0 + oxfmt 0.73.0 (pinned via lockfile)
- **Testing**: Vitest 5 + @testing-library/react + jsdom (per-file, via the `// @vitest-environment jsdom` pragma)
- **Fonts**: self-hosted Space Grotesk + JetBrains Mono (SIL OFL 1.1)
- **Deployment**: GitHub Pages, static (`dist/`), custom domain via `dist/CNAME`
- **Dev environment**: Node.js 22 + npm on the host; an optional Docker Compose
  sandbox (`make dev-up`) for machines without Node or to keep the host clean
- **Backend / database / auth**: none — this is a static site

## Architecture

```text
src/ (React + TS: content records, i18n, theme, components)
  ↓
vite build → dist/   (static HTML + CSS + JS + copied public/ assets)
  ↓
push to main → Pages workflow → GitHub Pages → https://felipeinoue.com/
```

Everything a visitor sees is computed in the browser from typed content records.
There is no API call at runtime: repository facts are read from a committed
build-time snapshot, and fonts and images are served from this origin.

## Design Decisions

Each entry is settled; the reason is what stops it being re-opened.

- **CSS Modules + design tokens, not a utility framework** — the tokens are the
  single source of truth for colour, and the contrast tests parse
  `src/theme/tokens.css` directly to prove every preset meets AA. A utility
  framework would move the values out of reach of that test. (2026-10-15)
- **One page with anchor sections, no router** — static hosting gives no server to
  route with, the content is a single narrative, and a router would add weight
  and a history model for no navigation the anchors do not already provide.
- **i18n in typed records, one module per language, `en.ts` as source of truth** —
  `pt-BR.ts` is typed `: Strings`, so a missing or misspelled key is a `tsc`
  error rather than a blank string in production.
- **There is no terminal; the page stands on its own** (#119) — an earlier
  version docked an interactive console beside the page (a `portfolio.v1.dock`
  overlay, plus a command that focused one section and `theme`/`mode`/`lang`
  commands that mirrored the header controls). It duplicated the header
  navigation and the preference controls in a second surface, and the content is
  the real product, so the whole feature — the console, the dock, the
  focus-one-section command and its i18n — was removed. The header nav and
  `#section` deep links still scroll to a section, and the preference controls are
  the one way to change theme, mode and language. (2026-10-17)
- **The contact links live in the hero** (#99) — the footer used to render a
  second `ContactRow` under `#contact-footer`; it now carries only the
  copyright / built-with / source lines, and the hero row keeps its own `#contact`
  anchor. One row, one source, no dead anchor. (2026-10-16)
- **The preference controls carry their meaning in an icon, not a visible label**
  — the appearance is a single button that cycles light ↔ dark and the language a
  select of flag + short code, so the bar reads without spelling out "Appearance"
  and "Language"; the theme and language selects keep an accessible name (and the
  theme options name the presets). Each control keeps an accessible name — the
  mode button also a `title` — so dropping the label costs sighted users nothing
  that the icon does not say. (2026-10-16)
- **Two theme axes: 5 presets × 2 readings, and no `system`** — `PRESETS` grew
  from Studio/Paper/Terminal to add Violet and Ember, and `MODES` collapsed from
  `light`/`dark`/`system` to `light`/`dark` (#102). `system` was a third of the
  appearance button's cycle spent on a reading nobody chose and the site could not
  show differently from the OS; dropping it makes the control a two-state toggle
  and the default `dark`, the site's signature look. Light/dark stays a **mode**
  (`data-mode`), not a theme: a preset is an identity, a reading is how you read
  it, and folding them into one axis (the #100 proposal) would have made every
  preset a separate theme. (2026-10-16)
- **The whole page flips with the reading — one token set** (#112) — light/dark
  changes header, footer, page sides, the content and the floating controls
  together, so the palette is a single `--color-*` family and no
  `--color-chrome-*` set exists. §101 had split the page into a dark
  `--color-chrome-*` frame around a `--color-*` reading column; the frame read as
  a card around the page (the "rectangle" the owner asked to remove), so the split
  and the whole chrome token family are gone. The accent is the page accent, so
  the particle field reads `--color-accent` (it changes with the reading again).
  `tokens.test.ts` gates the particle contrast against the page surface, and
  `surfaces.test.ts` pins that no chrome family survives, so the split cannot come
  back silently. The overlay pair (`--color-overlay-*`) is unchanged — it is a
  separate budget. (2026-10-17)
- **Motion ships with zero runtime dependencies** (hand-rolled
  `IntersectionObserver` and canvas) and every motion feature is **fail-open**
  under `prefers-reduced-motion` — an animation library would outweigh the whole
  effect it provides, and a motion feature that can leave content unrevealed
  under reduced motion is a bug, not a decoration.
- **The ambient field is sparse straight streaks with a radial centre fade**
  (#113, #121) — 6–14 trails (area-scaled, hard-capped) are born in the left/right
  gutters, within the top third, and travel inward-and-downward at constant
  velocity: the path is a `lineTo`, never a `quadraticCurveTo`. This replaced the
  #96 rebuild (24–80 curved particles), which read as too busy. Lifecycle alpha
  (`alphaAt`) ramps in at birth and to zero at death, peaking at **exactly 1**, so
  `PARTICLE_ALPHA` is the true drawn maximum the contrast gate caps. Each streak
  is a **uniform straight stroke** — a single accent-coloured line of constant
  width, with no round head and no gradient bulge, so it reads as a line rather
  than a tadpole (#121 dropped #113's gradient tail-to-head and its head dot). The
  centre is cleared by an **elliptical radial mask** (transparent centre → opaque
  edges), and `paint()` clears the whole frame each time. (2026-10-17)
- **Overlay chrome is mode-independent** (`--color-overlay-*`, fixed white on an
  82% black scrim) — page tokens cannot meet WCAG 1.4.11 once composited over a
  scrim (measured: caption 1.85:1 in light presets, control boundary 1.21:1 in
  dark ones), so the overlay carries its own pair and the test recomputes both
  ratios per preset from the scrim alpha. (2026-10-15)
- **The lightbox scrim has no `backdrop-filter`** — imperceptible at 82% opacity,
  it costs a full-viewport compositing layer, and it would turn the scrim into a
  mixture rather than the pure alpha blend the contrast guard recomputes.
  (2026-10-15)
- **The lightbox opens with a one-shot FLIP from the clicked thumbnail** (#97) —
  the gallery captures the tile's viewport rect and hands it to the viewer, which
  draws the image over it (a centre-aligned translate + scale from
  `zoomTransform`) and then clears the transform so a CSS transition settles it.
  The zoom waits until the image's real aspect is known, so it never starts from
  the placeholder box, and the image is held back until then rather than flashing
  in place; it runs once per mount, so navigating between images does not replay
  it, and it is skipped entirely under reduced motion (the image simply appears,
  never left at a transform). Closing goes through one path (`requestClose`) that
  fades the scrim and unmounts on a timer, so a missed transition cannot leave the
  page scroll-locked. (2026-10-16)
- **Repository facts come from a committed build-time snapshot**
  (`src/content/repoStats.json`), never a browser API call — no runtime token, no
  rate limit, no third-party origin between the visitor and the page, and the site
  keeps working when the API is down. (2026-10-15)
- **The avatar and fonts are served from this origin**, never hot-linked —
  self-hosting removes a third-party request, a layout shift, and a dependency on
  someone else's uptime and licence terms. (2026-10-15)
- **The dev sandbox adopts the account that already owns the host uid** rather
  than refusing to build — `node:22-bookworm` ships uid 1000 and so does nearly
  every single-user Linux host, so refusing a claimed uid made the _default_
  configuration the one that could not build. (2026-10-15)
- **Build-time user setup lives in `scripts/setup-container-user.sh`, not inline
  in the Dockerfile** — so `check-sandbox.py` can execute the shipped file under
  `sh` with the account tooling stubbed, which is the only way to test it where
  Docker is unavailable. (2026-10-15)
- **The mark is an "FI" monogram in a rounded tile** (#120) — two geometric
  stroke paths (an `F` and an `I`) inside the token-painted box, so the header
  logo and the tab icon are the same figure. It replaces the terminal-prompt
  carets, which tied the identity to the console; the letters keep the two-path
  shape the favicon test derives from `Logo.tsx`. (2026-10-17)
- **The favicon is the page's own mark, and its rasters are generated, not drawn
  twice** — `public/favicon.svg` shares `Logo.tsx`'s geometry and is painted with
  the studio-dark palette (a test derives both from source and fails on drift),
  and `make favicons` rasterises it in a real headless Chrome into `favicon.ico`
  (PNG-in-ICO) plus the 16/32/180/192/512 PNGs. A hand-maintained second copy of
  the icon is the way the tab and the page drift apart, and a capture harness that
  writes a blank or opaque-cornered file is worse than no harness. (2026-10-16)
- **A game owns its image; the experience gallery is derived from the games** —
  `GameLink.image` is the single place the title→image link lives, and the card
  builds its tiles as `{ src: game.image, game }`, so an image path is never
  written twice. The tile names its game in the accessible name and shows the name
  as a tooltip on hover and on keyboard focus, and the lightbox gains the game's
  detail (name, page link, trailer) only for a tile that carries a game.
  (2026-10-16)
- **The in-portfolio trailer is a facade, not an embed** — the lightbox shows the
  still with a play control and only mounts the `youtube-nocookie.com` iframe when
  it is pressed, so opening a gallery makes no third-party request. The pure
  `youtubeId` helper decides whether a trailer is embeddable; a title whose link
  is not a YouTube video simply gets no play control. (2026-10-16)
- **A `Tech:` entry is a linked tag, and the name is a union, not a string**
  (#98) — `TechName` in `content/types.ts` lists every technology, and
  `TECHNOLOGIES` is `Record<TechName, { url, blurb }>`, so a name with no entry —
  or a typo in a project — is a `tsc` error rather than a blank tag. The blurb is
  both the link's accessible name and its hover/focus tooltip (the tip is
  `aria-hidden`, so it is not read twice), and the tag carries a plain border with
  no tint, so no non-text accent has to clear 3:1 and no `--color-tag-*` token is
  resurrected. (2026-10-16)
- **A skill badge is a link, and its group colour is a dot, not the text** — each
  skill carries a `url` and a bilingual `blurb`; the badge is an anchor to the
  reference, with the blurb as its accessible name and a hover/focus tooltip, and
  the group is shown by a single `--color-tag-*` dot while the label keeps
  `--color-fg`. Only the dot is a non-text accent, so it must clear 3:1
  (WCAG 1.4.11) on `--color-surface` — which is why the tints are a separate
  token set gated by `tokens.test.ts` rather than a recolouring of the label.
  (2026-10-16)

## Topology

One component. There is no backend, no database, and no second frontend.

- kind: frontend, path: `.`, purpose: the whole site — build, test, deploy

## Directory Layout

```text
src/
  components/      # UI components (Header, Footer, Sections, Gallery, Lightbox, …)
  content/         # Typed bilingual content (about, experience, projects, skills, contact)
  i18n/            # Language context/provider/hooks + dictionaries (en.ts, pt-BR.ts)
  lib/             # Shared utilities/hooks
  assets/icons/    # Brand marks (masked with currentColor)
  theme/           # Presets, contrast, tokens, fonts, context/provider/hooks
  test/            # Entry/build/asset tests
public/            # Static assets (avatar, self-hosted fonts, favicon, images)
docs/screenshots/  # Committed README images + how to regenerate them
scripts/           # Gates and tooling (check-sandbox.py, check-docs.py, fetch-fonts.py,
                   #   repo-stats.mjs, screenshots.mjs, favicons.mjs, favicon-ico.mjs, sandbox scripts)
.opencode/         # Agent definitions, instructions, skills, gitignored session memory
```

## Key Commands

- **Install**: `npm install`
- **Dev server**: `npm run dev` (or `make dev`) — http://localhost:5173
- **Check (gate)**: `make check` = `make check-sandbox` + `make check-docs` + `npm run check` (fmt:check, lint, typecheck, test, build)
- **Tests**: `npm run test` (watch: `npm run test:watch`)
- **Lint**: `npm run lint`
- **Type check**: `npm run typecheck`
- **Format**: `npm run fmt` (check only: `npm run fmt:check`)
- **Build**: `npm run build`
- **Repo stats**: `npm run stats` (or `make stats`) — refreshes the committed
  `src/content/repoStats.json` from the GitHub API (needs an authenticated `gh`)
- **Screenshots**: `make screenshots` — rebuilds and captures the README images
  into `docs/screenshots/` with a real headless Chrome (see that directory's
  README); refuses to write a capture it cannot trust
- **Favicons**: `make favicons` (or `npm run favicons`) — re-renders
  `public/favicon.svg` into the committed rasters (`favicon.ico` as PNG-in-ICO,
  16/32/180/192/512 PNGs) with a real headless Chrome; refuses a wrong-sized,
  blank or opaque-cornered capture
- **Sandbox**: `make dev-up` / `make dev-log` / `make opencode` / `make dev-down`
  (needs Docker; `make check-sandbox` validates the config without it)

## Status

- **Done**: v1.0 — the Hugo site rewritten as React + TS + Vite, live at
  felipeinoue.com. v1.1 — Polish & Sandbox — released to `main` (#37): branding
  (#14), the dev sandbox (#15) and its uid fix (#25), the image lightbox (#16),
  scroll-reveal (#17), the particle background (#18) and its visibility fix
  (#33), the terminal-first view (#19), repository cards (#20) and the stability
  pass (#21).
- **Done**: v1.2 — Terminal & details — released to `main` (#66): the two-column
  layout (#40), the centred header and SVG-first favicons (#41), the particle
  reading-zone fade (#42), the game galleries with tile tooltips and in-portfolio
  trailers (#43), icon-only contact links (#45), the always-docked terminal panel
  (#47), skill badges (#44) and the `make shell` sandbox fix (#38).
- **Done**: v1.3 — Terminal controls & polish — released to `main` (#62): the
  animated dock, readable console and in-panel hide control (#52), one-section
  focus with `all` (#53), theme/appearance/language from the terminal (#54),
  preference controls as icons (#55), and a header centred on the page frame
  (#56).
- **Done**: v1.4 — Maintenance — released to `main` (#73): CI gating for release
  PRs (#67), a reworked README (#71), and the Context/docs sync (#69).
- **Done**: v1.5 — Polish — released to `main` (#109): a sticky header with a
  larger brand and a bare theme select (#74), terminal UX (floating FAB, icon
  hide, click-to-focus, prompt + type scale) (#76), the contact/skills restructure
  with hero contact and skill badges (#78), gallery/lightbox equal sizing and
  platform icon+name (#80), the sparse gutter meteor trails (#82), and the green-
  check restore (#84).
- **Done**: v1.6 — Content & visibility — released to `main` (#109): header/About
  navigation with the hero shown alongside About (#86), the hero skills block
  removed (#87), the meteor background made visible again (#88), a discoverable
  terminal show button (#89), and the studio-dark favicon palette (#90).
- **Done**: v1.7 — Ambient & themes — released to `main` (#109): `system` retired
  and the presets grown to five (#102), the light reading column over dark chrome
  (#101), the rebuilt ambient particle field (#96), the lightbox FLIP zoom from
  the clicked thumbnail (#97), linked `Tech:` tags (#98), and the hero-owned
  contact row with the `contact` command aimed at it (#99).
- **Done**: v1.8 — UX refinements — released to `main` (#126): the page flipped to
  a single token set with no dark chrome frame (#112), the ambient field rebuilt
  as sparse straight streaks (#113), and the terminal turned into a right-edge
  overlay with a phone show/hide toggle (#114).
- **Done**: v1.9 — Identity & focus — released to `main` (#126): a larger, more
  widely spaced header nav (#118), the streaks redrawn as clean uniform lines
  (#121), the mark replaced by an "FI" monogram shared with the tab icon (#120),
  and the terminal retired entirely (#119).
- **Next**: no filed work — `v1.0`–`v1.9` are released. The plan is to add new
  projects and possibly a new language track (e.g. Rust), on the released base.

## Backlog

No filed work: `v1.0`–`v1.9` are all released and their milestones hold no open
issues. Milestone tracking lives on GitHub (issue #2). The plan is to add new
projects and possibly a new language track (e.g. Rust) — deliberately _after_ the
polish, so the additions land on a base that already looks finished.

## Notes

- **`ASSIGNEE`** is `fiwon123`: issues and PRs are assigned to that handle.
- **Two-tier branches**: `main` is release/deploy, `dev` is integration, work
  happens on `<type>/<issue>-<slug>`. Never push directly to `main` or `dev`.
- **CI triggers**: `ci.yml` runs on pull requests targeting `dev` and `main`, and
  pushes to `dev`; `pages.yml` deploys on push to `main`. CI **never** runs on a
  feature branch, so
  local `make check` is the gate. A run that was never triggered, or whose jobs
  were all skipped, is not a pass.
- **Formatting of `docker-compose.yml` is owned by oxfmt** (it normalises to single
  quotes) — run `make fmt` after editing it.
- **The agent cannot read images.** Visual verdicts need a human, or a `visual`
  subagent in projects that define one. This repo does not: the agent captures
  and the user looks.
- **Docker is unavailable in the agent environment**, so the sandbox is
  author-only: `make check-sandbox` validates the config statically, and a real
  `make dev-up` is run by a human on a Docker-capable host.
- **No secrets in the repo.** `.env`, `.env.*` and `.envrc` are ignored;
  `.env.example` holds placeholders only. GitHub credentials reach the sandbox by
  runtime interpolation (`GH_TOKEN` or `GITHUB_TOKEN`), never baked into the image.
- **Repository facts are a committed build-time snapshot**
  (`src/content/repoStats.json`, refreshed by `npm run stats`). The site never calls
  the GitHub API from the browser; a private, missing, or not-yet-collected repo
  falls back to the static project card.
- **The skip link is the first focusable element** in the DOM, ahead of the header,
  and targets `<main id="content">` — the page's one main landmark. A test asserts
  it precedes the nav and that its `href` resolves to exactly one element, because
  a skip link that exists only as CSS and a translated string (which is how it went
  missing once) is invisible to every role-based test.
- **README images are committed, not generated on the fly**, and are reproduced by
  `make screenshots` (`scripts/screenshots.mjs`). The harness refuses to write a
  capture that did not render, so a blank image can never be committed silently.
- **`.opencode/memory/` is gitignored** — it holds per-machine session state and
  must never be committed.
