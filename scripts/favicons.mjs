#!/usr/bin/env node
// Generate the consistent favicon set from public/favicon.svg.
//
// Mirrors the dependency-free headless-Chrome harness used by screenshots.mjs:
// launches a real Chrome, renders favicon.svg onto a canvas at each requested
// size, reads the pixels back, and writes the rasters plus a PNG-in-ICO
// favicon.ico. No Playwright, no browser download, no image library.
//
// Rasterising on a canvas is why the corners can be checked at all: the same
// canvas that produces the PNG also answers "is this corner transparent?" — a
// capture that lost its alpha channel is refused, never written.
//
// Every image is drawn supersampled (at SUPERSAMPLE× then downscaled), which is
// what keeps the 16px icon's rounded corners clean.
//
// Quick start
//   npm run favicons            # or: make favicons
//
// Environment overrides
//   FAVICONS_DIR        output dir            (default public)
//   CHROME              chrome binary         (default: google-chrome | chromium)
//   FAVICONS_PORT       static server port    (default 4320)
//   FAVICONS_MIN_BYTES  minimum PNG size      (default 250 — a blank or solid
//                                             icon compresses far below this)
//   FAVICONS_BUDGET_MS  virtual-time budget   (default 5000)

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'

import { buildIco, pngSize } from './favicon-ico.mjs'

// ── CONFIG ───────────────────────────────────────────────────────────────────
// One entry per committed raster. The PNGs are the browser/OS fallbacks; the SVG
// is preferred and listed first in index.html. `favicon.ico` packs the 16 and 32.
const SIZES = [
  { size: 16, file: 'favicon-16x16.png' },
  { size: 32, file: 'favicon-32x32.png' },
  { size: 180, file: 'apple-touch-icon.png' },
  { size: 192, file: 'android-chrome-192x192.png' },
  { size: 512, file: 'android-chrome-512x512.png' },
]
const ICO = { file: 'favicon.ico', sizes: [16, 32] }
// A corner may be faintly touched by antialiasing; a corner this opaque means the
// alpha channel was lost (a square icon on the tab), and the capture is refused.
const MAX_CORNER_ALPHA = 0.5
const SUPERSAMPLE = 4
// ─────────────────────────────────────────────────────────────────────────────

const SVG = resolve('public/favicon.svg')
const OUT_DIR = resolve(process.env.FAVICONS_DIR || 'public')
const PORT = Number(process.env.FAVICONS_PORT || 4320)
const MIN_BYTES = Number(process.env.FAVICONS_MIN_BYTES || 250)
const BUDGET_MS = Number(process.env.FAVICONS_BUDGET_MS || 5000)
const BASE = `http://127.0.0.1:${PORT}`

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const probe = spawnSync('which', [bin], { encoding: 'utf8' })
    if (probe.status === 0 && probe.stdout.trim()) return probe.stdout.trim()
  }
  return null
}

if (!existsSync(SVG)) {
  console.error(`[favicons] No source icon at ${SVG}.`)
  process.exit(2)
}

const CHROME = findChrome()
if (!CHROME) {
  console.error('[favicons] No Chrome/Chromium binary found.')
  console.error('  Install Google Chrome, or set CHROME=/path/to/chrome.')
  process.exit(2)
}

// The render page: an image of the source SVG, drawn supersampled onto a canvas
// of the requested size, with the pixels read back. The result (corner/centre
// alpha + a data-URL PNG) is put in the DOM, which `--dump-dom` returns.
const RENDER_PAGE = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>favicon render</title></head>
  <body>
    <pre id="out">pending</pre>
    <script>
      ;(async () => {
        const out = document.getElementById('out')
        const size = Number(new URLSearchParams(location.search).get('size'))
        const done = (value) => { out.textContent = JSON.stringify(value) }
        if (!Number.isInteger(size) || size < 1) return done({ error: 'bad size' })
        try {
          const img = new Image()
          img.src = '/favicon.svg'
          await img.decode()
          const big = document.createElement('canvas')
          big.width = size * ${SUPERSAMPLE}
          big.height = size * ${SUPERSAMPLE}
          big.getContext('2d').drawImage(img, 0, 0, big.width, big.height)
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')
          ctx.drawImage(big, 0, 0, size, size)
          const { data } = ctx.getImageData(0, 0, size, size)
          const alpha = (x, y) => data[(y * size + x) * 4 + 3] / 255
          done({
            size,
            corners: [alpha(0, 0), alpha(size - 1, 0), alpha(0, size - 1), alpha(size - 1, size - 1)],
            centre: alpha(size >> 1, size >> 1),
            png: canvas.toDataURL('image/png'),
          })
        } catch (error) {
          done({ error: String(error) })
        }
      })()
    </script>
  </body>
</html>`

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, BASE).pathname)
  const send = (status, type, body) => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' })
    res.end(body)
  }
  if (path === '/' || path === '/render.html')
    return send(200, 'text/html; charset=utf-8', RENDER_PAGE)
  if (path === '/favicon.svg') return send(200, 'image/svg+xml', readFileSync(SVG))
  send(404, 'text/plain', 'not found')
})

function chrome(args) {
  const profile = mkdtempSync(join(tmpdir(), 'favicons-profile-'))
  return new Promise((done) => {
    const child = spawn(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--no-first-run',
        '--disable-extensions',
        `--user-data-dir=${profile}`,
        ...args,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    const timer = setTimeout(() => child.kill('SIGKILL'), 60_000)
    child.on('close', (status) => {
      clearTimeout(timer)
      rmSync(profile, { recursive: true, force: true })
      done({ status, stdout, stderr })
    })
  })
}

async function render(size) {
  const url = `${BASE}/render.html?size=${size}`
  const dump = await chrome([`--virtual-time-budget=${BUDGET_MS}`, '--dump-dom', url])
  const match = /<pre id="out">([\s\S]*?)<\/pre>/.exec(dump.stdout || '')
  if (!match) {
    const detail = (dump.stderr || '').trim().split('\n').slice(-3).join(' ')
    console.error(
      `[favicons] no DOM for size ${size} (chrome exited ${dump.status})${detail ? ` — ${detail}` : ''}`,
    )
    return null
  }
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

await new Promise((ok) => server.listen(PORT, '127.0.0.1', ok))
mkdirSync(OUT_DIR, { recursive: true })

const written = []
const refused = []
const pngBySize = new Map()

for (const { size, file } of SIZES) {
  const target = join(OUT_DIR, file)
  const problems = []
  const result = await render(size)

  if (!result) problems.push('no render result (the page never reported back)')
  else if (result.error) problems.push(result.error)
  else if (result.size !== size) problems.push(`reported size ${result.size}, expected ${size}`)
  else {
    const opaque = result.corners.filter((alpha) => alpha > MAX_CORNER_ALPHA)
    if (opaque.length > 0) {
      problems.push(`opaque corner(s): alpha ${opaque.map((a) => a.toFixed(3)).join(', ')}`)
    }
    if (!(result.centre > 0)) problems.push('centre pixel is transparent (blank?)')

    if (problems.length === 0) {
      const base64 = String(result.png).replace(/^data:image\/png;base64,/, '')
      const data = Buffer.from(base64, 'base64')
      const actual = pngSize(data)
      if (actual.width !== size || actual.height !== size) {
        problems.push(`PNG is ${actual.width}x${actual.height}, not ${size}x${size}`)
      }
      if (data.length < MIN_BYTES) {
        problems.push(`PNG is ${data.length} B, below the ${MIN_BYTES} B floor (blank?)`)
      }
      if (problems.length === 0) {
        writeFileSync(target, data)
        pngBySize.set(size, data)
      }
    }
  }

  if (problems.length === 0) written.push(target)
  else refused.push({ file: target, problems })
  console.log(`[favicons] ${problems.length === 0 ? 'wrote' : 'refused'} ${target}`)
}

// The ICO only packs the sizes we actually produced, and only if all succeeded.
if (refused.length === 0) {
  const entries = ICO.sizes.map((size) => ({ size, data: pngBySize.get(size) }))
  const target = join(OUT_DIR, ICO.file)
  try {
    writeFileSync(target, buildIco(entries))
    written.push(target)
    console.log(`[favicons] wrote ${target}`)
  } catch (error) {
    refused.push({ file: target, problems: [String(error)] })
    console.error(`[favicons] refused ${target}`)
  }
}

server.close()

if (refused.length > 0) {
  console.error(`\n[favicons] REFUSED ${refused.length} file(s):`)
  for (const item of refused) {
    console.error(`  ${item.file}`)
    for (const problem of item.problems) console.error(`      - ${problem}`)
  }
  console.error(
    '\nFix the source icon or the harness config; a raster that failed a guard is never kept.',
  )
  process.exit(1)
}

console.log(`[favicons] done — ${written.length} file(s) in ${OUT_DIR}${sep}`)
