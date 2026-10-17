// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { en } from '../i18n/en'
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
})
