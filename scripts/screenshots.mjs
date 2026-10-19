#!/usr/bin/env node
// README / docs screenshot harness.
//
// Captures the *built* site (dist/) in a real headless Chrome and writes the
// PNGs the README embeds, so the images are reproducible rather than hand-taken.
//
// Dependency-free on purpose: it drives the `google-chrome` binary the host
// already needs and serves dist/ from a tiny Node server. No Playwright, no
// browser download.
//
// Why it holds a request open: `--screenshot` fires at the load event, and this
// app renders with React, so a plain capture is the *pre-React* frame. Serving a
// deferred /slow.js that stalls keeps the load event pending while the module
// mounts first — the same trick the local probes use.
//
// Quick start
//   npm run build && npm run screenshots     # or: make screenshots
//
// Environment overrides
//   SCREENSHOTS_DIR    output dir           (default docs/screenshots)
//   CHROME             chrome binary        (default: google-chrome | chromium)
//   SCREENSHOTS_PORT   static server port   (default 4319)
//   SCREENSHOTS_HOLD_MS   /slow.js hold, ms (default 3000)
//   SCREENSHOTS_MIN_BYTES minimum PNG size  (default 10000 — a blank capture
//                                           compresses far below this)

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'

// ── CONFIG ───────────────────────────────────────────────────────────────────
// One entry per README image. Keys are the localStorage values the app reads
// (mirroring src/theme/presets.ts, src/i18n/context.ts).
// `expect` strings must appear in the rendered DOM — they are the fail-loud
// guard, chosen so a page that did not mount (no React) cannot satisfy them.
const PRESET = 'studio'
// `<canvas` is the particle layer: the static shell ships no canvas, and
// ParticleBackground renders one only after React mounts (it used to carry a
// data-testid that the component no longer renders — the guard failed loud and
// exposed the drift).
const COMMON = ['<canvas', 'class="skip-link"', '<nav']
//
// There is one conventional page (no terminal), so one dark capture is the README
// set: the site's default reading. Light/dark *verification* is a throwaway
// visual-QA concern, not a committed artifact.
const CAPTURES = [{ name: 'home-dark', mode: 'dark', expect: [...COMMON] }]
// ─────────────────────────────────────────────────────────────────────────────

const DIST = resolve('dist')
const OUT_DIR = resolve(process.env.SCREENSHOTS_DIR || 'docs/screenshots')
const PORT = Number(process.env.SCREENSHOTS_PORT || 4319)
const HOLD_MS = Number(process.env.SCREENSHOTS_HOLD_MS || 3000)
const MIN_BYTES = Number(process.env.SCREENSHOTS_MIN_BYTES || 10000)
const BASE = `http://127.0.0.1:${PORT}`
const WINDOW = { width: 1280, height: 900 }

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const probe = spawnSync('which', [bin], { encoding: 'utf8' })
    if (probe.status === 0 && probe.stdout.trim()) return probe.stdout.trim()
  }
  return null
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('[screenshots] No build in dist/.')
  console.error('  Run `npm run build` (or `make build`) first, then re-run `make screenshots`.')
  process.exit(2)
}

const CHROME = findChrome()
if (!CHROME) {
  console.error('[screenshots] No Chrome/Chromium binary found.')
  console.error('  Install Google Chrome, or set CHROME=/path/to/chrome.')
  process.exit(2)
}

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

// Defeat the scroll-reveal + transitions so a capture is the settled page, not
// whatever animation frame the load event happened to land on.
const SETTLE_CSS =
  '<style>*,*::before,*::after{transition:none !important;animation:none !important}' +
  '.reveal{opacity:1 !important;transform:none !important}</style>'

function prelude({ preset, mode, lang }) {
  const seed = {
    'portfolio.v1.theme': preset,
    'portfolio.v1.mode': mode,
    'portfolio.v1.lang': lang,
  }
  const body = Object.entries(seed)
    .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)})`)
    .join(';')
  return `<script>try{${body}}catch(e){}</script>`
}

// The server injects the *current* capture's seed, so captures must run one at
// a time (they do — Chrome is launched per capture).
let currentCapture = CAPTURES[0]

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, BASE).pathname)
  if (path === '/slow.js') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' })
      res.end('/* held open so the load event waits for React */')
    }, HOLD_MS)
    return
  }
  const rel = path === '/' ? '/index.html' : path
  const file = resolve(join(DIST, rel))
  if (!file.startsWith(DIST + sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('not found')
    return
  }
  let body = readFileSync(file)
  if (rel === '/index.html') {
    let html = body.toString('utf8')
    html = html.replace(
      '<head>',
      `<head>${prelude({ preset: PRESET, ...currentCapture })}${SETTLE_CSS}`,
      1,
    )
    html = html.replace('</body>', '<script defer src="/slow.js"></script></body>', 1)
    body = Buffer.from(html)
  }
  res.writeHead(200, {
    'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  })
  res.end(body)
})

function chrome(args) {
  const profile = mkdtempSync(join(tmpdir(), 'screenshots-profile-'))
  // async spawn, not spawnSync: the server must keep serving while Chrome runs.
  return new Promise((done) => {
    const child = spawn(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        '--no-first-run',
        '--disable-extensions',
        `--user-data-dir=${profile}`,
        `--window-size=${WINDOW.width},${WINDOW.height}`,
        ...args,
        `${BASE}/`,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    const timer = setTimeout(() => child.kill('SIGKILL'), 90_000)
    child.on('close', (status) => {
      clearTimeout(timer)
      rmSync(profile, { recursive: true, force: true })
      done({ status, stdout, stderr })
    })
  })
}

await new Promise((ok) => server.listen(PORT, '127.0.0.1', ok))
mkdirSync(OUT_DIR, { recursive: true })

const written = []
const refused = []

for (const capture of CAPTURES) {
  currentCapture = capture
  const file = join(OUT_DIR, `${capture.name}.png`)
  const problems = []

  // Guard run: dump the rendered DOM and require the mount markers.
  const dump = await chrome(['--dump-dom'])
  const html = dump.stdout || ''
  if (dump.status !== 0) problems.push(`chrome exited ${dump.status}`)
  for (const needle of capture.expect) {
    if (!html.includes(needle)) problems.push(`expected marker absent: ${needle}`)
  }
  if (capture.forbid && html.includes(capture.forbid)) {
    problems.push(`unexpected marker present: ${capture.forbid}`)
  }

  // Capture run (only if the page proved it mounted).
  if (problems.length === 0) {
    const shot = await chrome([`--screenshot=${file}`])
    if (shot.status !== 0) {
      problems.push(`chrome exited ${shot.status}`)
    } else if (!existsSync(file)) {
      problems.push('no PNG written')
    } else if (statSync(file).size < MIN_BYTES) {
      // A blank/solid capture compresses to almost nothing.
      problems.push(`PNG is ${statSync(file).size} B, below the ${MIN_BYTES} B floor (blank?)`)
    }
  }

  if (problems.length === 0) written.push(file)
  else refused.push({ file, problems })
  console.log(`[screenshots] ${problems.length === 0 ? 'wrote' : 'refused'} ${file}`)
}

server.close()

if (refused.length > 0) {
  console.error(`\n[screenshots] REFUSED ${refused.length} capture(s):`)
  for (const item of refused) {
    console.error(`  ${item.file}`)
    for (const problem of item.problems) console.error(`      - ${problem}`)
  }
  console.error(
    '\nFix the page or the harness config; a capture that failed a guard is never kept.',
  )
  process.exit(1)
}

console.log(`[screenshots] done — ${written.length} image(s) in ${OUT_DIR}${sep}`)
