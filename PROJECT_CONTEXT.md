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

A visitor can explore the content either through an interactive terminal or
through conventional navigation, switch language (EN/PT-BR) and theme (3 presets
× light/dark/system), and read everything at WCAG AA contrast — with the whole
site served as static files.

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
src/ (React + TS: content records, i18n, theme, terminal, components)
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
- **The page is one conventional page; the terminal is a dock, not a mode**
  (`portfolio.v1.dock`) — the console sits beside the page (or below on a phone)
  rather than replacing it. An earlier two-presentation "view mode" hid the page
  behind the console; it meant a visitor could not see the work and the console at
  once, and the first version of that idea had `#section` and a translated string
  doing work a DOM element should do. The dock keeps the terminal optional without
  making the content conditional. (2026-10-16)
- **A terminal navigation command focuses one section; `all` restores the page**
  — the sections are rendered by the page, so a command asks the page to show one.
  Focusing filters the hero out but keeps a visually-hidden h1 and a `#top` anchor,
  so the heading outline, the skip link and back-to-top still resolve; the focus
  is **not persisted**, so a reload is always the whole page, and while focused a
  nav link to a hidden section moves the focus there rather than landing on
  nothing. This replaced the scroll-on-navigate of the first dock (2026-10-16).
- **Terminal settings commands drive the same setters as the header controls**
  (`theme`, `mode`, `lang`) rather than a parallel copy of the state — the
  console is a second way in, never a second source of truth, so the terminal
  and the controls cannot disagree. A bare command, or one whose value is not
  recognised, prints the valid values and changes nothing, so a typo answers
  with the choices instead of failing silently. (2026-10-16)
- **The preference controls carry their meaning in an icon, not a visible label**
  — the appearance is a single button that cycles light → dark → system and the
  language a select of flag + short code, so the bar reads without spelling out
  "Appearance" and "Language"; the theme select keeps its visible label and gains
  a palette glyph. Each control keeps an accessible name — the mode button also a
  `title` — so dropping the label costs sighted users nothing that the icon does
  not say. (2026-10-16)
- **Theme and dock are separate axes with separate storage keys**
  (`portfolio.v1.mode` and `portfolio.v1.dock`) — dark mode and whether the
  console is open are independent: a visitor can want either without the other,
  and the dock key migrates the `portfolio.v1.view` value it replaced. (2026-10-16)
- **Motion ships with zero runtime dependencies** (hand-rolled
  `IntersectionObserver` and canvas) and every motion feature is **fail-open**
  under `prefers-reduced-motion` — an animation library would outweigh the whole
  effect it provides, and a motion feature that can leave content unrevealed
  under reduced motion is a bug, not a decoration.
- **Overlay chrome is mode-independent** (`--color-overlay-*`, fixed white on an
  82% black scrim) — page tokens cannot meet WCAG 1.4.11 once composited over a
  scrim (measured: caption 1.85:1 in light presets, control boundary 1.21:1 in
  dark ones), so the overlay carries its own pair and the test recomputes both
  ratios per preset from the scrim alpha. (2026-10-15)
- **The lightbox scrim has no `backdrop-filter`** — imperceptible at 82% opacity,
  it costs a full-viewport compositing layer, and it would turn the scrim into a
  mixture rather than the pure alpha blend the contrast guard recomputes.
  (2026-10-15)
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
  terminal/        # Interactive terminal (parser, history, commands, UI)
  theme/           # Presets, contrast, tokens, fonts, context/provider/hooks
  test/            # Entry/build/asset tests
public/            # Static assets (avatar, self-hosted fonts, favicon, images)
docs/screenshots/  # Committed README images + how to regenerate them
scripts/           # Gates and tooling (check-sandbox.py, check-docs.py, fetch-fonts.py,
                   #   repo-stats.mjs, screenshots.mjs, sandbox scripts)
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
- **Sandbox**: `make dev-up` / `make dev-log` / `make opencode` / `make dev-down`
  (needs Docker; `make check-sandbox` validates the config without it)

## Status

- **Done**: v1.0 — the Hugo site rewritten as React + TS + Vite, live at
  felipeinoue.com. v1.1 — Polish & Sandbox — released to `main` (#37): branding
  (#14), the dev sandbox (#15) and its uid fix (#25), the image lightbox (#16),
  scroll-reveal (#17), the particle background (#18) and its visibility fix
  (#33), the terminal-first view (#19), repository cards (#20) and the stability
  pass (#21).
- **In progress**: milestone `v1.2 — Terminal & details`. Merged to `dev` so far:
  the two-column layout (#40), the centred header and SVG-first favicons (#41),
  the particle reading-zone fade (#42), icon-only contact links (#45), and the
  always-docked terminal panel (#47). Milestone `v1.3 — Terminal controls &
  polish`: the animated dock, readable console and in-panel hide control (#52),
  one-section focus with `all` (#53), theme/appearance/language from the
  terminal (#54), and preference controls as icons (#55).

## Backlog

The rest of `v1.2`, then `v1.3`; each item is a GitHub issue already filed.

1. `#43` — game gallery tooltips, a lightbox detail view and in-portfolio trailer
   playback
2. `#44` — skill badges with group tints, tooltips and official links
3. `#38` — `make shell` fails with `exec: docker compose: not found` (carried over
   from v1.1)
4. `#56` — centre the header within a max-width

Milestone tracking lives on GitHub (milestones `v1.2 — Terminal & details` and
`v1.3 — Terminal controls & polish`, issue #2). After these are released, the plan
is to add new projects and possibly a new language track (e.g. Rust) —
deliberately _after_ the polish, so the additions land on a base that already
looks finished.

## Notes

- **`ASSIGNEE`** is `fiwon123`: issues and PRs are assigned to that handle.
- **Two-tier branches**: `main` is release/deploy, `dev` is integration, work
  happens on `<type>/<issue>-<slug>`. Never push directly to `main` or `dev`.
- **CI triggers**: `ci.yml` runs on pull requests and pushes targeting `dev`;
  `pages.yml` deploys on push to `main`. CI **never** runs on a feature branch, so
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
