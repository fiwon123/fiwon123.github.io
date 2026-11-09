// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { enUS as en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { ThemeProvider } from '../theme/ThemeProvider'
import { Header } from './Header'

const dir = path.dirname(fileURLToPath(import.meta.url))
const css = readFileSync(path.join(dir, 'Header.module.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)

/** The declarations of the first top-level rule whose selector contains `needle`. */
function ruleBody(needle: string): string {
  const match = new RegExp(`[^{}]*\\${needle}\\s*\\{([^}]*)\\}`).exec(css)
  if (!match) throw new Error(`no rule found for ${needle}`)
  return match[1]
}

/** A whole `@media (...) { … }` block whose condition starts with `needle`. */
function mediaBlock(needle: string): { index: number; body: string } {
  const start = css.indexOf(`@media ${needle}`)
  if (start === -1) throw new Error(`no media query starting with ${needle}`)
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return { index: start, body: css.slice(start, i + 1) }
    }
  }
  throw new Error(`unclosed media query starting with ${needle}`)
}

function renderHeader() {
  render(
    <ThemeProvider>
      <LanguageProvider>
        <Header />
      </LanguageProvider>
    </ThemeProvider>,
  )
}

afterEach(cleanup)

describe('Header', () => {
  it('always shows the navigation', () => {
    renderHeader()
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
  })

  it('links the page sections', () => {
    // Contact is one scroll away in the hero, so it carries no nav entry.
    renderHeader()
    const nav = screen.getByRole('navigation', { name: en.a11y.mainNav })
    const labels = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(labels).toEqual([en.nav.about, en.nav.experience, en.nav.projects])
  })

  it('keeps theme and language reachable', () => {
    renderHeader()
    expect(screen.getByRole('combobox', { name: en.theme.label })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: en.language.label })).toBeTruthy()
  })

  it('shrinks the brand anchor to its content, so the gap is not clickable', () => {
    // A grid item is blockified and fills its `1fr` track by default. Without
    // this, the anchor's box spans the empty space between the logo and the nav,
    // making that gap an invisible link target. jsdom has no grid layout, so the
    // rule text is the only testable surface.
    expect(ruleBody('.brand')).toContain('justify-self: start')
  })

  it('keeps one horizontal row on a landscape phone, overriding the portrait stack', () => {
    // jsdom has no layout and no orientation, so the rules themselves are the
    // testable surface (#196): the landscape block must come after the portrait
    // stacking block (equal specificity — source order decides) and restore the
    // three-column frame with no wrapping, or the nav and the preference
    // dropdowns pile up vertically on a short viewport.
    const portrait = mediaBlock('(max-width: 48rem)')
    const landscape = mediaBlock('(orientation: landscape)')

    expect(portrait.body).toContain("'actions'")
    expect(landscape.index).toBeGreaterThan(portrait.index)
    expect(landscape.body).toContain("grid-template-areas: 'brand nav actions'")
    expect(landscape.body).toContain('flex-wrap: nowrap')
    // The stacked block centres the brand and the actions; the row restores them
    // at the two ends.
    expect(landscape.body).toContain('justify-self: start')
    expect(landscape.body).toContain('justify-self: end')
  })

  it('drops the wordmark, not the nav, when a landscape phone is very narrow', () => {
    const narrow = mediaBlock(
      '(orientation: landscape) and (max-height: 33rem) and (max-width: 40rem)',
    )
    expect(narrow.body).toContain('.brand span')
    expect(narrow.body).toContain('display: none')
  })
})
