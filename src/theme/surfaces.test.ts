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
 * The two-surface split (#101): the page frame is chrome, the centred reading
 * column carries the reading palette. A colour-test cannot see which surface a
 * selector painted, so pin the wiring here — otherwise a later edit could put
 * the reading pair back on `body` and quietly delete the whole effect.
 */
describe('chrome vs reading surfaces (#101)', () => {
  const index = read('src/index.css')
  const app = read('src/App.module.css')
  const header = read('src/components/Header.module.css')
  const footer = read('src/components/Footer.module.css')
  const logo = read('src/components/Logo.module.css')

  it('paints the page frame (body, header, footer) with the chrome pair', () => {
    const body = ruleBody(index, 'body {')
    expect(body).toContain('var(--color-chrome-bg)')
    expect(body).toContain('var(--color-chrome-fg)')

    for (const [name, css, selector] of [
      ['Header', header, '.header {'],
      ['Footer', footer, '.footer {'],
    ] as const) {
      const rule = ruleBody(css, selector)
      expect(rule, name).toContain('var(--color-chrome-bg)')
      expect(rule, name).toContain('var(--color-chrome-fg)')
      expect(rule, name).toContain('var(--color-chrome-border)')
    }
  })

  it('paints the header logo with the chrome pair, since it sits on the frame', () => {
    expect(ruleBody(logo, '.box {')).toContain('var(--color-chrome-')
    expect(ruleBody(logo, '.caret {')).toContain('var(--color-chrome-')
  })

  it('paints the reading column with the reading pair', () => {
    const page = ruleBody(app, '.page {')
    expect(page).toContain('background: var(--color-bg)')
    expect(page).toContain('color: var(--color-fg)')
    expect(page).not.toContain('--color-chrome-')
  })

  it('declares no literal colour on either surface, so the tokens stay authoritative', () => {
    for (const relative of [
      'src/index.css',
      'src/App.module.css',
      'src/components/Header.module.css',
      'src/components/Footer.module.css',
      'src/components/Logo.module.css',
      'src/components/Preferences.module.css',
      'src/components/TerminalFab.module.css',
      'src/components/BackToTop.module.css',
    ]) {
      const css = read(relative)
      expect(css, relative).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      expect(css, relative).not.toMatch(/\brgba?\(/i)
    }
  })
})
