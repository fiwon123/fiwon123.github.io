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
- **Theme and view mode are separate axes with separate storage keys**
  (`portfolio.v1.mode` and `portfolio.v1.view`) — dark mode and terminal-first
  browsing are independent: a visitor can want either without the other.
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
scripts/           # Gates and tooling (check-sandbox.py, check-docs.py, fetch-fonts.py, sandbox scripts)
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
- **Sandbox**: `make dev-up` / `make dev-log` / `make opencode` / `make dev-down`
  (needs Docker; `make check-sandbox` validates the config without it)

## Status

- **Done**: v1.0 — the Hugo site rewritten as React + TS + Vite, live at
  felipeinoue.com. v1.1 in progress on `dev`.
- **In progress**: milestone `v1.1 — Polish & Sandbox` — sandbox (#15), branding
  (#14) and the image lightbox (#16) are merged; the sandbox uid fix (#25) landed.

## Backlog

Build order for the rest of `v1.1`; each item is a GitHub issue already filed.

1. `#17` — scroll-reveal motion + back-to-top
2. `#19` — terminal-first view mode (welcome screen + commands reveal sections)
3. `#18` — optimized particle background
4. `#20` — repository cards from a build-time snapshot + store links
5. `#21` — v1.1 stability pass (accessibility, performance, docs)

Milestone tracking lives on GitHub (milestone `v1.1 — Polish & Sandbox`, issue #2).
After `v1.1` is released, the plan is to add new projects and possibly a new
language track (e.g. Rust) — deliberately _after_ the polish, so the additions
land on a base that already looks finished.

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
- **`.opencode/memory/` is gitignored** — it holds per-machine session state and
  must never be committed.
