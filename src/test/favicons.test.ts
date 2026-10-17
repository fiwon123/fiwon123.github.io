import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { buildIco, pngSize } from '../../scripts/favicon-ico.mjs'
import { rasterSvgSource } from '../../scripts/favicon-svg.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (...parts: string[]) => readFileSync(path.join(repoRoot, ...parts), 'utf8')

const svg = read('public', 'favicon.svg')
const logo = read('src', 'components', 'Logo.tsx')
const logoCss = read('src', 'components', 'Logo.module.css')
const tokens = read('src', 'theme', 'tokens.css')

/** Simple `name="value"` attributes of the first matching tag. */
function attrs(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
}
function tags(source: string, name: string): string[] {
  return [...source.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => m[0])
}
/** The `--color-*` values of one studio palette block (`dark` or `light`). */
function palette(mode: 'dark' | 'light'): Record<string, string> {
  const block = new RegExp(
    `\\[data-theme='studio'\\]\\[data-mode='${mode}'\\]\\s*\\{([^}]*)\\}`,
  ).exec(tokens)
  if (!block) throw new Error(`studio-${mode} token block not found`)
  return Object.fromEntries(
    [...block[1].matchAll(/(--color-[a-z-]+):\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [m[1], m[2]]),
  )
}
/** The `<style>` blocks of the SVG, split into their attributes and CSS. */
function svgStyles(): { attrs: string; css: string }[] {
  return [...svg.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)].map((match) => ({
    attrs: match[1],
    css: match[2],
  }))
}
/** One `--color-*` value from a CSS block. */
function cssVar(css: string, name: string): string | undefined {
  return new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(css)?.[1]
}
function parseIco(buffer: Buffer) {
  const count = buffer.readUInt16LE(4)
  const entries = Array.from({ length: count }, (_, index) => {
    const base = 6 + index * 16
    const bytes = buffer.readUInt32LE(base + 8)
    const offset = buffer.readUInt32LE(base + 12)
    return {
      width: buffer.readUInt8(base) || 256,
      height: buffer.readUInt8(base + 1) || 256,
      data: buffer.subarray(offset, offset + bytes),
    }
  })
  return { reserved: buffer.readUInt16LE(0), type: buffer.readUInt16LE(2), count, entries }
}

/**
 * The tab icon must be the page mark, not a lookalike: it is the same geometry as
 * `Logo.tsx`, painted with the studio-dark palette (the default preset's dark
 * mode). Parsing both files keeps the two from drifting apart.
 */
describe('favicon.svg matches the page logo', () => {
  it('uses the same viewBox and the same glyph paths as Logo.tsx', () => {
    expect(attrs(tags(svg, 'svg')[0]).viewBox).toBe(attrs(tags(logo, 'svg')[0]).viewBox)
    expect(attrs(tags(svg, 'svg')[0]).viewBox).toBe('0 0 32 32')

    const logoD = [...logo.matchAll(/d="([^"]+)"/g)].map((m) => m[1])
    const svgD = [...svg.matchAll(/d="([^"]+)"/g)].map((m) => m[1])
    expect(logoD.length).toBe(2)
    expect(svgD).toEqual(logoD)
  })

  it('uses the same inset rounded box as Logo.tsx', () => {
    const box = attrs(tags(logo, 'rect')[0])
    const icon = attrs(tags(svg, 'rect')[0])
    for (const key of ['x', 'y', 'width', 'height', 'rx']) {
      expect(icon[key]).toBe(box[key])
    }
  })

  it('uses the same stroke widths as Logo.module.css', () => {
    const boxWidth = /\.box\s*\{[^}]*stroke-width:\s*([\d.]+)/.exec(logoCss)?.[1]
    const glyphWidth = /\.glyph\s*\{[^}]*stroke-width:\s*([\d.]+)/.exec(logoCss)?.[1]
    expect(attrs(tags(svg, 'rect')[0])['stroke-width']).toBe(boxWidth)
    for (const tag of tags(svg, 'path')) {
      expect(attrs(tag)['stroke-width']).toBe(glyphWidth)
    }
  })

  it('paints from the studio-dark palette by default, and studio-light in a light scheme', () => {
    // A favicon cannot read data-theme/data-mode, so it follows the OS reading:
    // a dark base (the site's default) and a light override.
    const styles = svgStyles()
    const base = styles.find((style) => !/prefers-color-scheme/.test(style.attrs))
    const light = styles.find((style) => /prefers-color-scheme:\s*light/.test(style.attrs))
    expect(base, 'no default palette style').toBeTruthy()
    expect(light, 'no light-scheme palette style').toBeTruthy()

    const dark = palette('dark')
    const bright = palette('light')
    for (const key of ['--color-surface', '--color-border', '--color-accent']) {
      expect(cssVar(base?.css ?? '', key), key).toBe(dark[key])
      expect(cssVar(light?.css ?? '', key), key).toBe(bright[key])
    }

    // The shapes read the variables, so they take whichever palette is active.
    const box = attrs(tags(svg, 'rect')[0])
    expect(box.fill).toBe('var(--color-surface)')
    expect(box.stroke).toBe('var(--color-border)')
    for (const tag of tags(svg, 'path')) {
      const glyph = attrs(tag)
      expect(glyph.stroke).toBe('var(--color-accent)')
      expect(glyph.fill).toBe('none')
    }
  })
})

describe('rasterSvgSource keeps the fallback rasters on the default palette', () => {
  it('drops the light-scheme style and leaves the dark base', () => {
    const raster = rasterSvgSource(svg)
    expect(raster).not.toMatch(/prefers-color-scheme/)
    expect(raster).toMatch(/--color-accent:\s*#6ea8fe/)
    // Geometry is untouched, so the rasters are still the page mark.
    expect([...raster.matchAll(/d="([^"]+)"/g)].map((m) => m[1])).toEqual(
      [...svg.matchAll(/d="([^"]+)"/g)].map((m) => m[1]),
    )
  })
})

describe('index.html favicon order', () => {
  it('lists the SVG first, then the raster fallbacks', () => {
    const head = read('index.html')
    const order = (...needles: string[]) => needles.map((needle) => head.indexOf(needle))
    const [svgIndex, icoIndex, png32, png16, apple] = order(
      'href="/favicon.svg"',
      'href="/favicon.ico"',
      'href="/favicon-32x32.png"',
      'href="/favicon-16x16.png"',
      'href="/apple-touch-icon.png"',
    )
    for (const index of [svgIndex, icoIndex, png32, png16, apple]) expect(index).toBeGreaterThan(-1)
    expect(svgIndex).toBeLessThan(icoIndex)
    expect(icoIndex).toBeLessThan(png32)
    expect(png32).toBeLessThan(png16)
    expect(png16).toBeLessThan(apple)
  })
})

describe('pngSize and buildIco', () => {
  const png16 = readFileSync(path.join(repoRoot, 'public', 'favicon-16x16.png'))
  const png32 = readFileSync(path.join(repoRoot, 'public', 'favicon-32x32.png'))

  it('reads a PNG’s real dimensions from its IHDR', () => {
    expect(pngSize(png16)).toEqual({ width: 16, height: 16 })
    expect(pngSize(png32)).toEqual({ width: 32, height: 32 })
    expect(() => pngSize(Buffer.from('not a png'))).toThrow(/not a PNG/)
  })

  it('packs a PNG-in-ICO whose entries are the images it was given', () => {
    const ico = buildIco([
      { size: 32, data: png32 },
      { size: 16, data: png16 },
    ])
    const parsed = parseIco(ico)
    expect(parsed.reserved).toBe(0)
    expect(parsed.type).toBe(1)
    expect(parsed.count).toBe(2)
    expect(parsed.entries.map((entry) => [entry.width, entry.height])).toEqual([
      [16, 16],
      [32, 32],
    ])
    expect(pngSize(parsed.entries[0].data)).toEqual({ width: 16, height: 16 })
    expect(pngSize(parsed.entries[1].data)).toEqual({ width: 32, height: 32 })
  })

  it('refuses an entry whose PNG does not match its declared size', () => {
    expect(() => buildIco([{ size: 16, data: png32 }])).toThrow(/32x32, not 16x16/)
    expect(() => buildIco([])).toThrow(/at least one image/)
  })
})

describe('the committed icon set', () => {
  const expected = [
    ['favicon-16x16.png', 16],
    ['favicon-32x32.png', 32],
    ['apple-touch-icon.png', 180],
    ['android-chrome-192x192.png', 192],
    ['android-chrome-512x512.png', 512],
  ] as const

  it('ships every raster at its declared size', () => {
    for (const [file, size] of expected) {
      const asset = path.join(repoRoot, 'public', file)
      expect(existsSync(asset), `missing ${file}`).toBe(true)
      expect(pngSize(readFileSync(asset))).toEqual({ width: size, height: size })
    }
  })

  it('ships a favicon.ico packing the 16 and 32 PNGs', () => {
    const ico = parseIco(readFileSync(path.join(repoRoot, 'public', 'favicon.ico')))
    expect(ico.type).toBe(1)
    expect(ico.entries.map((entry) => entry.width)).toEqual([16, 32])
    for (const entry of ico.entries) {
      expect(pngSize(entry.data)).toEqual({ width: entry.width, height: entry.height })
    }
  })
})

describe('the favicon harness is wired up', () => {
  it('runs scripts/favicons.mjs from npm and make', () => {
    expect(JSON.parse(read('package.json')).scripts.favicons).toBe('node scripts/favicons.mjs')
    const makefile = read('Makefile')
    expect(makefile).toMatch(/^favicons:.*\n\tnpm run favicons$/m)
    expect(makefile).toMatch(/^\.PHONY:[\s\S]*?\bfavicons\b/m)
  })

  it('parses the generator scripts', () => {
    for (const script of [
      'scripts/favicons.mjs',
      'scripts/favicon-ico.mjs',
      'scripts/favicon-svg.mjs',
    ]) {
      expect(() =>
        execFileSync(process.execPath, ['--check', script], { cwd: repoRoot }),
      ).not.toThrow()
    }
  })
})
