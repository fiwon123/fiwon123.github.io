# AGENTS.md

### Product

## Project Objective

felipeinoue.com — personal portfolio site showcasing work, projects, and skills.

### Problem

Need a fast, accessible, themeable single-page portfolio to present work and contact information without framework bloat.

### Goal

Visitors can explore content via an interactive terminal or conventional navigation, switch language (EN/PT-BR) and theme (3 presets × light/dark/system), with WCAG AA contrast.

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
  components/      # UI components (Header, Footer, Sections, Preferences, Logo, BrandIcon)
  content/         # Typed bilingual content (about, experience, projects, skills, contact)
  i18n/            # Language context/provider/hooks + dictionaries
  lib/             # Shared utilities/hooks
  assets/icons/    # Brand marks (masked with currentColor)
  terminal/        # Interactive terminal (parser, history, commands, UI)
  theme/           # Theme presets, contrast, tokens, fonts, context/provider/hooks
  test/            # Entry/build/asset tests
  types.ts         # Shared types
public/            # Static assets (avatar, self-hosted fonts, favicon, images)
scripts/           # Asset tooling (fetch-fonts.py)
```

## Development Commands

### Frontend (root app)

```bash
npm install           # Install dependencies
npm run dev           # Start dev server (http://localhost:5173)
npm run build         # Build for production (outputs dist/)
npm run preview       # Preview production build
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
- **Issue-first**: Every change tracked via GitHub issue → branch → PR → merge
- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`
- **Bilingual content**: EN and PT-BR live in the same typed records (never separate files); `en.ts` is source of truth, `pt-BR.ts` typed `: Strings`
- **Themes**: 3 presets (Studio/Paper/Terminal) × 3 modes (light/dark/system); persisted with `portfolio.v1.*` keys; WCAG AA contrast enforced in tests
- **Terminal**: Pure parser/history modules, EN/PT-BR aliases, accessible (`role="log" aria-live="polite"`), persisted visibility toggle
- **Formatting/Linting**: oxlint + oxfmt (0.x tools pinned via lockfile)
- **Tests**: Unit tests for pure logic (parser/history), i18n parity, theme contrast/tokens, entry smoke test

## Environment Constraints

- Static site (no backend, no database)
- Node 22+, npm 10+. A dev sandbox (`Dockerfile` + `docker-compose.yml`) is
  optional — Docker is needed only for `make dev-up`/`make opencode`
- `make check` is the local gate (CI only runs on release PRs to `main` and on
  pushes to `dev` per workflows). It starts with `check-sandbox`, which validates
  the dev sandbox config statically so a Docker-only mistake cannot sit
  unexamined; Docker itself is never exercised in CI
- No secrets committed; `.env*` ignored (except `.env.example`)
