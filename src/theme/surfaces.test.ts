import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function read(relative: string): string {
  return readFileSync(path.join(repoRoot, relative), 'utf8')
}

/** The declaration body of the first rule whose selector matches `needle`. */
function ruleBody(css: string, needle: string): string {
  const index = css.indexOf(needle)
  if (index === -1) throw new Error(`no rule for ${needle}`)
  const open = css.indexOf('{', index)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

/**
 * One surface (#112): the whole page — body, header, footer and the content
 * column — flips together with the reading. The #101 chrome/reading split is
 * gone, so pin that here: a later edit cannot reintroduce a second token family
 * or repaint a frame around the page without a test noticing.
 */
describe('one token set for the page (#112)', () => {
  const index = read('src/index.css')
  const app = read('src/App.module.css')
  const header = read('src/components/Header.module.css')
  const footer = read('src/components/Footer.module.css')
  const logo = read('src/components/Logo.module.css')

  it('no longer defines or references a chrome token family', () => {
    for (const [name, css] of [
      ['tokens.css', read('src/theme/tokens.css')],
      ['index.css', index],
      ['App.module.css', app],
      ['Header.module.css', header],
      ['Footer.module.css', footer],
      ['Logo.module.css', logo],
      ['Preferences.module.css', read('src/components/Preferences.module.css')],
      ['BackToTop.module.css', read('src/components/BackToTop.module.css')],
      ['meteors.ts', read('src/lib/meteors.ts')],
    ] as const) {
      expect(css, name).not.toContain('--color-chrome-')
    }
  })

  it('paints the frame and the content column with the same reading tokens', () => {
    const body = ruleBody(index, 'body {')
    expect(body).toContain('var(--color-bg)')
    expect(body).toContain('var(--color-fg)')

    for (const [name, css, selector] of [
      ['Header', header, '.header {'],
      ['Footer', footer, '.footer {'],
    ] as const) {
      const rule = ruleBody(css, selector)
      expect(rule, name).toContain('var(--color-bg)')
      expect(rule, name).toContain('var(--color-fg)')
      expect(rule, name).toContain('var(--color-border)')
    }
  })

  it('leaves the content column transparent — no card, so no frame', () => {
    const page = ruleBody(app, '.page {')
    expect(page).not.toContain('background')
    expect(page).not.toContain('border')
  })

  it('declares no literal colour, so the tokens stay authoritative', () => {
    for (const relative of [
      'src/index.css',
      'src/App.module.css',
      'src/components/Header.module.css',
      'src/components/Footer.module.css',
      'src/components/Logo.module.css',
      'src/components/Preferences.module.css',
      'src/components/BackToTop.module.css',
    ]) {
      const css = read(relative)
      expect(css, relative).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      expect(css, relative).not.toMatch(/\brgba?\(/i)
    }
  })
})
