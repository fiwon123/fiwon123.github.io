// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { ThemeProvider } from '../theme/ThemeProvider'
import { Header } from './Header'

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
})
