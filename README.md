# Personal Portfolio

[![CI](https://github.com/fiwon123/fiwon123.github.io/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/fiwon123/fiwon123.github.io/actions/workflows/ci.yml)
[![Deploy](https://github.com/fiwon123/fiwon123.github.io/actions/workflows/pages.yml/badge.svg)](https://github.com/fiwon123/fiwon123.github.io/actions/workflows/pages.yml)
[![Live](https://img.shields.io/badge/live-felipeinoue.com-1f6feb)](https://felipeinoue.com/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev/)
[![Node](https://img.shields.io/badge/Node-22-5fa04e?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

A fast, accessible, bilingual **single-page portfolio** for **Felipe Inoue**,
built with **React 19 + TypeScript + Vite** and served as a static site from
GitHub Pages at <https://felipeinoue.com/>. There is no backend and no framework
bloat — every section is rendered in the browser from typed content records.

## Main page

![The portfolio home page with the terminal docked, in dark mode](docs/screenshots/home-terminal-dark.png)

## Purpose

A portfolio has to present work, experience and contact details without the
weight of a framework-built site, and it has to stay usable for people who
navigate by keyboard or screen reader, read Portuguese, or want a dark page.
Those constraints are usually the first to be dropped, so here they are
**enforced by tests** instead of by intention: WCAG AA contrast, the skip link and
the bilingual parity are all gated before anything is merged.

## Features

- **Terminal-docked navigation** — a pure parser/history layer with EN/PT-BR
  command aliases (`help`, `clear`, `about`, `projects`, `work`, …): a navigation
  command focuses one section (`all` restores the page), and `theme`, `mode` and
  `lang` change the preferences.
- **One page, optional console** — every section always renders; the terminal
  dock is toggled per visitor and remembered.
- **Three theme presets** (Studio, Paper, Terminal) × light/dark/system, applied
  before first paint so there is no flash of the wrong palette.
- **Bilingual** — EN and PT-BR, with the document language kept in sync.
- **Repository cards** — language, stars and last-push date, read from a
  build-time snapshot (`npm run stats`), never from the browser.
- **Accessible** — skip link, WCAG AA contrast enforced in tests, keyboard-operable
  terminal, gallery, image viewer and back-to-top.
- **Reduced-motion aware** — the particle layer and scroll reveals stand down.

## Screenshots

The console collapses for visitors who would rather just read:

![The portfolio with the terminal dock collapsed, in dark mode](docs/screenshots/home-browse-dark.png)

Regenerate these with `make screenshots` (dark mode, the site's default) — see
[`docs/screenshots/README.md`](docs/screenshots/README.md).

## Prerequisites

- **Node.js 22+** and **npm 10+** — to build and run the site.
- **Docker** _(optional)_ — only for the containerised dev sandbox
  (`make dev-up` / `make opencode`).
- **Google Chrome** _(optional)_ — only to regenerate the README screenshots
  (`make screenshots`) and the favicon rasters (`make favicons`).
- **GitHub CLI (`gh`)** _(optional)_ — only to refresh the repository cards
  (`npm run stats`).

## How to run

```bash
npm install          # install dependencies
npm run dev          # start the dev server at http://localhost:5173
npm run build        # build the static site into dist/
npm run preview      # preview the production build
make check           # the full gate: sandbox config, docs, format, lint, types, tests, build
```

`make check` is the local gate and the one CI runs — see [`AGENTS.md`](./AGENTS.md)
for the conventions behind it. Regenerate a derived asset with:

```bash
npm run stats                    # refresh the repository cards (needs `gh`)
make screenshots                 # rebuild + capture the README images (needs Chrome)
make favicons                    # regenerate the favicon rasters (needs Chrome)
python3 scripts/fetch-fonts.py   # refresh the self-hosted webfonts
```

## Dev sandbox

Docker is optional — `npm run dev` needs nothing but Node. To work inside a
container instead (a machine with no Node, or to keep the host clean):

```bash
make setup-host     # one-time host bootstrap (mise, gh login, config dirs)
make dev-up         # build + start; Vite on http://localhost:5173
make dev-log        # follow the container output
make opencode       # run opencode inside the sandbox
make dev-shell      # interactive shell in the sandbox
make dev-down       # stop it
```

The source is bind-mounted, the GitHub token is forwarded at runtime (never baked
into the image), and `gh`/`opencode`/git config are mounted read-only. See
`AGENTS.md` → "Dev sandbox" for the details, including why `opencode` must be
upgraded on the host (`make opencode-upgrade`).

## Assets

- `public/avatar/felipeinoue-512.jpg` — the hero portrait, downloaded from the
  GitHub profile. Re-download it when the profile photo changes:
  `curl -fsSL "https://github.com/fiwon123.png?size=512" -o public/avatar/felipeinoue-512.jpg`
- `public/fonts/` — self-hosted Space Grotesk and JetBrains Mono (SIL OFL 1.1);
  see `public/fonts/README.md`.
- `src/assets/icons/` — brand marks, painted with a CSS mask so they take the
  active theme colour.
- `public/favicon.svg` — the tab icon, the same mark as the page logo. The PNG
  fallbacks and `favicon.ico` are generated from it by `make favicons`.
- `docs/screenshots/` — the images above; see
  [`docs/screenshots/README.md`](docs/screenshots/README.md) to regenerate them.

## Documentation

Project conventions, the branching model, the CI strategy and the development
workflow live in [`AGENTS.md`](./AGENTS.md). The repository previously held a Hugo
site; the Hugo sources are preserved at the tag `archive/hugo`.

## License

All rights reserved. The source is public for reference; no license is granted
for reuse.
