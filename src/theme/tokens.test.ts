import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

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

function parsePalettes(source: string): Palette[] {
  const palettes: Palette[] = []
  const blockPattern = /([^{}]+)\{([^{}]*)\}/g
  let match: RegExpExecArray | null
  while ((match = blockPattern.exec(source)) !== null) {
    const [, selector, body] = match
    const preset = /\[data-theme='([a-z-]+)'\]/.exec(selector)?.[1]
    const mode = /\[data-mode='([a-z]+)'\]/.exec(selector)?.[1]
    if (!preset || !mode) continue

    const colors: Record<string, string> = {}
    for (const declaration of body.split(';')) {
      const [property, value] = declaration.split(':')
      if (!property || !value) continue
      const name = property.trim()
      if (name.startsWith('--color-')) colors[name] = value.trim()
    }
    palettes.push({ preset, mode, colors })
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
