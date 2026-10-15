# felipeinoue.com

Personal portfolio of **Felipe Inoue** — a single-page static site built with
**React + TypeScript + Vite**, deployed to GitHub Pages at
<https://felipeinoue.com/>.

This repository previously held a Hugo site. The Hugo sources are preserved at
the tag `archive/hugo`; the rewrite is in progress on the `dev` branch.

## Development

```bash
npm install          # install dependencies
npm run dev          # start the dev server
make check           # format-check, lint, type-check, test, build
python3 scripts/fetch-fonts.py   # refresh the self-hosted webfonts
```

## Assets

- `public/avatar/felipeinoue-512.jpg` — the hero portrait, downloaded from the
  GitHub profile. Re-download it when the profile photo changes:
  `curl -fsSL "https://github.com/fiwon123.png?size=512" -o public/avatar/felipeinoue-512.jpg`
- `public/fonts/` — self-hosted Space Grotesk and JetBrains Mono (SIL OFL 1.1);
  see `public/fonts/README.md`.
- `src/assets/icons/` — brand marks, painted with a CSS mask so they take the
  active theme colour.

## Documentation

Project conventions, the branching model, and the development workflow live in
[`AGENTS.md`](./AGENTS.md). This README is expanded, with screenshots, in a
follow-up change.

## License

All rights reserved. The source is public for reference; no license is granted
for reuse.
