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
make dev              # npm run dev
make build            # npm run build
make test             # npm run test
make fmt              # npm run fmt
make lint             # npm run lint
make help             # Show Makefile targets
```

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

- Static site (no backend, no database, no Docker required)
- Node 22+, npm 10+
- `make check` is the local gate (CI only runs on release PRs to `main` and on pushes to `dev` per workflows)
- No secrets committed; `.env*` ignored (except `.env.example`)
