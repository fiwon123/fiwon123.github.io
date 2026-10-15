import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { AA_NORMAL, contrastRatio, parseHex } from './contrast'
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
