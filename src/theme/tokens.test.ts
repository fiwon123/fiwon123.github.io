import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { PARTICLE_ALPHA } from '../lib/meteors'
import { AA_NORMAL, contrastRatio, parseHex, type Rgb } from './contrast'
import { PRESETS } from './presets'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const tokensPath = path.join(repoRoot, 'src/theme/tokens.css')

/** Colour variables every palette must define. */
const REQUIRED = [
  '--color-bg',
  '--color-surface',
  '--color-fg',
  '--color-fg-muted',
  '--color-accent',
  '--color-accent-contrast',
  '--color-border',
] as const

/** Pairs that must reach WCAG AA. `[foreground, background]`. */
const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['--color-fg', '--color-bg'],
  ['--color-fg', '--color-surface'],
  ['--color-fg-muted', '--color-bg'],
  ['--color-fg-muted', '--color-surface'],
  ['--color-accent', '--color-bg'],
  ['--color-accent-contrast', '--color-accent'],
]

interface Palette {
  preset: string
  mode: string
  colors: Record<string, string>
}

const css = readFileSync(tokensPath, 'utf8')

function declarationsOf(body: string): Record<string, string> {
  const colors: Record<string, string> = {}
  for (const declaration of body.split(';')) {
    const [property, value] = declaration.split(':')
    if (!property || !value) continue
    const name = property.trim()
    if (name.startsWith('--color-')) colors[name] = value.trim()
  }
  return colors
}

function parsePalettes(source: string): Palette[] {
  const palettes: Palette[] = []
  const modeOverrides: Record<string, Record<string, string>> = {}
  const blockPattern = /([^{}]+)\{([^{}]*)\}/g
  let match: RegExpExecArray | null
  while ((match = blockPattern.exec(source)) !== null) {
    const [, selector, body] = match
    const preset = /\[data-theme='([a-z-]+)'\]/.exec(selector)?.[1]
    const mode = /\[data-mode='([a-z]+)'\]/.exec(selector)?.[1]
    if (!mode) continue
    if (!preset) {
      // A mode-only block (e.g. the appearance control tokens) applies to
      // every preset in that reading.
      modeOverrides[mode] = { ...modeOverrides[mode], ...declarationsOf(body) }
      continue
    }
    palettes.push({ preset, mode, colors: declarationsOf(body) })
  }
  for (const palette of palettes) {
    palette.colors = { ...palette.colors, ...modeOverrides[palette.mode] }
  }
  return palettes
}

const palettes = parsePalettes(css)

describe('theme colour tokens', () => {
  it('defines a light and a dark palette for every preset', () => {
    expect(palettes).toHaveLength(PRESETS.length * 2)
    for (const preset of PRESETS) {
      const modes = palettes
        .filter((palette) => palette.preset === preset)
        .map((palette) => palette.mode)
        .sort()
      expect(modes, `preset "${preset}"`).toEqual(['dark', 'light'])
    }
  })

  it('defines every required colour in every palette', () => {
    for (const { preset, mode, colors } of palettes) {
      for (const name of REQUIRED) {
        expect(colors[name], `${preset}/${mode} is missing ${name}`).toMatch(/^#[0-9a-f]{3,8}$/i)
      }
    }
  })

  it.each(palettes)(
    '$preset/$mode meets WCAG AA on every required pair',
    ({ preset, mode, colors }) => {
      for (const [foreground, background] of PAIRS) {
        const ratio = contrastRatio(parseHex(colors[foreground]), parseHex(colors[background]))
        expect(
          ratio,
          `${preset}/${mode}: ${foreground} on ${background} = ${ratio.toFixed(2)}:1 (needs ${AA_NORMAL})`,
        ).toBeGreaterThanOrEqual(AA_NORMAL)
      }
    },
  )
})

/** WCAG 1.4.11: a UI component's boundary needs 3:1 against what is next to it. */
const AA_NON_TEXT = 3

/** Read the mode-independent `:root` block (no `[data-theme]`, no `[data-mode]`). */
function parseRoot(source: string): Record<string, string> {
  // Comments are stripped first: prose in this file contains colons, and the
  // declaration loop below splits on the first one.
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const match = /:root\s*\{([\s\S]*?)\}/.exec(withoutComments)
  if (!match) throw new Error('tokens.css has no :root block')
  const values: Record<string, string> = {}
  for (const declaration of match[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+)/g)) {
    values[declaration[1]] = declaration[2].trim()
  }
  return values
}

/** Parse `rgb(r g b / a)` or `rgba(r, g, b, a)`; alpha defaults to 1. */
function parseRgba(input: string): { rgb: Rgb; alpha: number } {
  const numbers = input.match(/[\d.]+%?/g)
  if (!numbers || numbers.length < 3) throw new Error(`Not a colour: ${input}`)
  const channel = (raw: string) => {
    const value = Number.parseFloat(raw)
    return raw.endsWith('%') ? Math.round((value / 100) * 255) : Math.round(value)
  }
  const [r, g, b, a] = numbers
  return {
    rgb: { r: channel(r), g: channel(g), b: channel(b) },
    alpha:
      a === undefined ? 1 : a.endsWith('%') ? Number.parseFloat(a) / 100 : Number.parseFloat(a),
  }
}

/** What the scrim does to a colour underneath it: pure source-over over black. */
function throughScrim(under: Rgb, alpha: number): Rgb {
  const mix = (channel: number) => Math.round(channel * (1 - alpha))
  return { r: mix(under.r), g: mix(under.g), b: mix(under.b) }
}

const root = parseRoot(css)

describe('overlay chrome', () => {
  const scrim = parseRgba(root['--color-overlay-scrim'] ?? '')
  const chromeBg = parseHex(root['--color-overlay-chrome-bg'] ?? '')
  const chromeFg = parseHex(root['--color-overlay-chrome-fg'] ?? '')

  it('defines the scrim and the chrome colours it carries', () => {
    expect(root['--color-overlay-scrim']).toBeDefined()
    expect(root['--color-overlay-chrome-bg']).toBeDefined()
    expect(root['--color-overlay-chrome-fg']).toBeDefined()
    expect(scrim.alpha).toBeGreaterThan(0)
    expect(scrim.alpha).toBeLessThan(1)
  })

  // The lightbox controls sit on the scrim, not on the page. An earlier version
  // used `--color-surface` and `--color-fg-muted` for them, which is fine on a
  // page and invisible on an overlay: 1.85:1 in light presets for the caption,
  // 1.21:1 in dark ones for the control boundaries.
  it.each(palettes)(
    '$preset/$mode keeps the overlay controls visible against the dimmed page',
    ({ preset, mode, colors }) => {
      const dimmed = throughScrim(parseHex(colors['--color-bg']), scrim.alpha)
      const boundary = contrastRatio(chromeBg, dimmed)
      expect(
        boundary,
        `${preset}/${mode}: overlay control vs dimmed ${colors['--color-bg']} = ${boundary.toFixed(2)}:1 (needs ${AA_NON_TEXT})`,
      ).toBeGreaterThanOrEqual(AA_NON_TEXT)

      const glyph = contrastRatio(chromeFg, chromeBg)
      expect(
        glyph,
        `${preset}/${mode}: overlay glyph = ${glyph.toFixed(2)}:1 (needs ${AA_NORMAL})`,
      ).toBeGreaterThanOrEqual(AA_NORMAL)
    },
  )
})

/**
 * The particle background draws the page accent (`--color-accent`) at
 * `PARTICLE_ALPHA` over the page (`--color-bg`). With the #101 chrome frame gone
 * there is one surface, so a particle can sit behind the text and this gate
 * models the worst case: text directly over a blended particle.
 *
 * The lifecycle fade in `alphaAt` peaks at exactly 1, so `PARTICLE_ALPHA` **is**
 * the drawn maximum — the gate below caps that constant directly rather than a
 * multiple of it. The tightest palette binds at alpha 0.23, so the constant is
 * capped there and cannot be raised in isolation.
 *
 * `throughParticle` is source-over: what a particle does to the surface
 * underneath it.
 */
function throughParticle(under: Rgb, particle: Rgb, alpha: number): Rgb {
  const mix = (over: number, below: number) => Math.round(over * alpha + below * (1 - alpha))
  return { r: mix(particle.r, under.r), g: mix(particle.g, under.g), b: mix(particle.b, under.b) }
}

function parseModeBlocks(source: string): Record<string, string> {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const values: Record<string, string> = {}
  const modePattern = /:root\[data-mode='([a-z]+)'\]\s*\{([\s\S]*?)\}/g
  let m: RegExpExecArray | null
  while ((m = modePattern.exec(withoutComments)) !== null) {
    const [, mode, body] = m
    for (const declaration of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+)/g)) {
      values[`${mode}:${declaration[1]}`] = declaration[2].trim()
    }
  }
  return values
}

describe('mode glyph (#170)', () => {
  it('is a white chip with a black glyph in light, the inverse in dark', () => {
    // #170 supersedes #167: the control now flips with the reading — a white
    // button with a black glyph in light, a dark chip with a white glyph in
    // dark. Pinned so a per-mode block cannot drift silently.
    const modes = parseModeBlocks(css)
    expect(modes['light:--color-mode-btn-bg']).toBe('#ffffff')
    expect(modes['light:--color-mode-icon']).toBe('#1a1a1a')
    expect(modes['dark:--color-mode-btn-bg']).toBe('#1a1a1a')
    expect(modes['dark:--color-mode-icon']).toBe('#ffffff')
  })

  it.each(palettes)(
    '$preset/$mode keeps the glyph readable on its chip and on the page',
    ({ preset, mode, colors }) => {
      // The glyph is the identifying visual of the control: it must clear 3:1
      // against the chip it sits on and against the page behind it, in both
      // readings (the chip itself matches the page too closely to carry the
      // boundary in either mode — #1a1a1a on #0e1116 is 1.09:1, #ffffff on
      // #ffffff is 1.00:1 — so the glyph does the work).
      const glyph = parseHex(colors['--color-mode-icon'] ?? '')
      const chip = parseHex(colors['--color-mode-btn-bg'] ?? '')
      const page = parseHex(colors['--color-bg'])
      const onChip = contrastRatio(glyph, chip)
      expect(
        onChip,
        `${preset}/${mode}: glyph vs chip = ${onChip.toFixed(2)}:1 (needs ${AA_NON_TEXT})`,
      ).toBeGreaterThanOrEqual(AA_NON_TEXT)
      const onPage = contrastRatio(glyph, page)
      expect(
        onPage,
        `${preset}/${mode}: glyph vs page = ${onPage.toFixed(2)}:1 (needs ${AA_NON_TEXT})`,
      ).toBeGreaterThanOrEqual(AA_NON_TEXT)
    },
  )
})

describe('particle background over the page', () => {
  it('draws below the measured contrast budget', () => {
    expect(PARTICLE_ALPHA).toBeGreaterThan(0)
    expect(PARTICLE_ALPHA).toBeLessThan(0.23)
  })

  it.each(palettes)(
    '$preset/$mode keeps WCAG AA when a particle sits over the page',
    ({ preset, mode, colors }) => {
      const under = parseHex(colors['--color-bg'])
      const behind = throughParticle(under, parseHex(colors['--color-accent']), PARTICLE_ALPHA)
      for (const foreground of ['--color-fg', '--color-fg-muted']) {
        const ratio = contrastRatio(parseHex(colors[foreground]), behind)
        expect(
          ratio,
          `${preset}/${mode}: ${foreground} over a particle-blended page = ${ratio.toFixed(2)}:1 (needs ${AA_NORMAL})`,
        ).toBeGreaterThanOrEqual(AA_NORMAL)
      }
    },
  )
})
