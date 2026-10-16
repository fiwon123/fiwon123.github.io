# AGENTS.md

> **How to work in this repo.** The project's identity — what it is, who it is
> for, the stack, architecture, settled decisions and constraints — lives in
> [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md), which is the source of truth for it.
> This file is the working guide: commands, conventions and gates. Where the two
> state the same fact, `PROJECT_CONTEXT.md` owns it, and `make check-docs` fails
> if they disagree — so update both together, or neither.

### Product

## Project Objective

felipeinoue.com — personal portfolio site showcasing work, projects, and skills.

### Problem

Need a fast, accessible, themeable single-page portfolio to present work and contact information without framework bloat.

### Goal

A terminal is docked beside the page (or below on a phone): visitors explore the
content conventionally, or type a command that focuses one section (`all`
restores the whole page), switch language (EN/PT-BR) and theme (5 presets ×
light/dark), with WCAG AA contrast.

### Main Technology

- Frontend: React 19 + TypeScript 6 + Vite 8
- Linting/Formatting: oxlint 1.81.0 + oxfmt 0.73.0
- Testing: Vitest 5 + @testing-library/react
- Fonts: self-hosted Space Grotesk + JetBrains Mono (SIL OFL 1.1)
- Deployment: GitHub Pages (static)
- Development: Node.js 22, npm

### Core Architecture

```text
React + Vite (SPA)
  ↓
Static build (dist/)
  ↓
GitHub Pages (felipeinoue.com)
```

## Project Structure

```
src/
  components/      # UI components (Header, Footer, Sections, Gallery, Lightbox, SkipLink, …)
  content/         # Typed bilingual content (about, experience, projects, skills, contact, repoStats.json)
  i18n/            # Language context/provider/hooks + dictionaries
  lib/             # Shared utilities/hooks
  assets/icons/    # Brand marks (masked with currentColor)
  terminal/        # Interactive terminal (parser, history, commands, UI)
  theme/           # Theme presets, contrast, tokens, fonts, context/provider/hooks
  test/            # Entry/build/asset tests
  types.ts         # Shared types
public/            # Static assets (avatar, self-hosted fonts, favicon, images)
docs/screenshots/  # Committed README images + regeneration notes
scripts/           # Gates and tooling (check-docs.py, check-sandbox.py, fetch-fonts.py, repo-stats.mjs, screenshots.mjs, favicons.mjs, favicon-ico.mjs)
```

## Development Commands

### Frontend (root app)

```bash
npm install           # Install dependencies
npm run dev           # Start dev server (http://localhost:5173)
npm run build         # Build for production (outputs dist/)
npm run preview       # Preview production build
npm run stats         # Refresh src/content/repoStats.json from the GitHub API (needs `gh`)
npm run screenshots   # Capture the README images into docs/screenshots/ (needs Chrome)
npm run favicons      # Regenerate the favicon rasters from public/favicon.svg (needs Chrome)
npm run lint          # Lint with oxlint
npm run fmt           # Format with oxfmt
npm run fmt:check     # Check formatting
npm run typecheck     # TypeScript type checking
npm run test          # Run unit tests (Vitest)
npm run test:watch    # Run tests in watch mode
npm run check         # fmt:check && lint && typecheck && test && build
make check            # Same as npm run check
make check-sandbox    # Static checks for the dev sandbox config (needs no Docker)
make dev              # npm run dev
make build            # npm run build
make test             # npm run test
make fmt              # npm run fmt
make lint             # npm run lint
make stats            # npm run stats
make screenshots      # npm run build && npm run screenshots
make favicons         # npm run favicons
make help             # Show Makefile targets
```

### Dev sandbox (optional, needs Docker)

The same project can be developed inside a container — useful for a machine with
no Node, or to keep the host clean. The source is bind-mounted, so edits on
either side are visible to the other.

```bash
make setup-host       # one-time host bootstrap (mise, gh login, config dirs)
make dev-up           # build + start; Vite on http://localhost:5173
make dev-log          # follow the container output
make opencode         # run opencode inside the sandbox
make opencode-auto    # same, with --auto (deny rules still apply)
make dev-shell        # interactive shell in the sandbox
make dev-down         # stop it
make opencode-upgrade # upgrade opencode on the HOST + restart the sandbox
```

- `HOST_PORT=5174 make dev-up` runs a second sandbox without a port collision.
- The GitHub token is forwarded at runtime from `GH_TOKEN` or `GITHUB_TOKEN` —
  never baked into the image — and `gh`/`opencode`/git config are mounted
  read-only so the container cannot rewrite host state.
- `opencode` is bind-mounted from `~/.opencode/bin/opencode`. A file bind mount
  pins the inode, so an in-container upgrade silently does nothing: upgrade on
  the host with `make opencode-upgrade`.
- Docker is not available in the agent's environment, so the sandbox is
  **author-only**: `make check-sandbox` statically validates the Dockerfile,
  compose file, Makefile and scripts, but a real `make dev-up` must be run by a
  human on a Docker-capable host.

## Key Conventions

- **Assignee**: `fiwon123`
- **Branch model**: `main` (release/deploy) ← `dev` (integration) ← feature branches `feat/<issue>-<slug>`
- **Local gate**: `make check` = `make check-sandbox` + `make check-docs` + `npm run check`
- **CI**: `ci.yml` runs on pull requests targeting `dev` and `main`, and pushes to `dev`; `pages.yml` deploys on push to `main`
- **Issue-first**: Every change tracked via GitHub issue → branch → PR → merge
- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`
- **Bilingual content**: EN and PT-BR live in the same typed records (never separate files); `en.ts` is source of truth, `pt-BR.ts` typed `: Strings`
- **Themes**: 5 presets (Studio/Paper/Terminal/Violet/Ember) × 2 readings (light/dark, no `system`; default dark); persisted with `portfolio.v1.*` keys; WCAG AA contrast enforced in tests
- **Terminal**: Docked beside the page, not a mode that hides it — pure parser/history modules, EN/PT-BR aliases, accessible (`role="log" aria-live="polite"`), a navigation command focuses one section (`all` restores the whole page, and the focus is not persisted), and the dock toggle is persisted (`portfolio.v1.dock`)
- **Repository cards**: language/stars/last-push come from the committed build-time snapshot (`src/content/repoStats.json`, `npm run stats`); the browser never calls the GitHub API, and a repo with no snapshot entry keeps the static card
- **Game gallery**: a game owns its image (`GameLink.image`) and the experience gallery is derived from the games, so a path is never written twice; a tile names its game in the accessible name and shows it as a hover/focus tooltip, the lightbox carries the game's detail (name, page link, trailer), and the trailer is a facade — the `youtube-nocookie.com` embed mounts only when play is pressed, so opening a gallery makes no third-party request (`youtubeId` decides embeddability)
- **Skill badges**: a skill is a link (`SkillItem { name, url, blurb }`) to its reference, with the blurb as the accessible name and a hover/focus tooltip; the group is shown by a single `--color-tag-*` dot on `--color-surface` while the label keeps `--color-fg`, so the tint only has to clear 3:1 as a non-text accent — which `tokens.test.ts` gates per palette
- **Accessibility**: a skip link is the first focusable element and targets `<main id="content">`; focus-visible styles on every control; `document.documentElement.lang` tracks the chosen language
- **README screenshots**: committed images under `docs/screenshots/`, reproduced by `make screenshots` (`scripts/screenshots.mjs`), which refuses to write a capture it cannot trust
- **Favicons**: the tab icon is the page's own mark — `public/favicon.svg` is generated from the same geometry/palette as `Logo.tsx` (a test derives both and fails on drift), and the rasters (`favicon.ico` as PNG-in-ICO, 16/32/180/192/512 PNGs) are reproduced by `make favicons` (`scripts/favicons.mjs`), which refuses a wrong-sized, blank or opaque-cornered capture; the SVG is listed first in `index.html`
- **Formatting/Linting**: oxlint + oxfmt (0.x tools pinned via lockfile)
- **Tests**: Unit tests for pure logic (parser/history), i18n parity, theme contrast/tokens, entry smoke test

## Environment Constraints

- Static site (no backend, no database)
- Node 22+, npm 10+. A dev sandbox (`Dockerfile` + `docker-compose.yml`) is
  optional — Docker is needed only for `make dev-up`/`make opencode`
- `make check` is the local gate. CI runs on `dev` (pull requests and pushes) and
  on pull requests to `main`; `pages.yml` deploys on push to `main` — never on a
  feature-branch push, so run
  `make check` before pushing. It starts with `check-sandbox`, which validates
  the dev sandbox config statically so a Docker-only mistake cannot sit
  unexamined; Docker itself is never exercised in CI
- No secrets committed; `.env*` ignored (except `.env.example`)
