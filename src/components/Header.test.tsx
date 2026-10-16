// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
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
  it('always shows the navigation: the page is never hidden behind the console', () => {
    renderHeader()
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
    cleanup()
    renderHeader()
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
  })

  it('offers the show control only while the console is collapsed', () => {
    // The show control has moved to the floating terminal FAB.
    renderHeader()
    expect(screen.queryByRole('button', { name: /terminal/i })).toBeNull()
    cleanup()

    renderHeader()
    expect(screen.queryByRole('button', { name: /terminal/i })).toBeNull()
  })

  it('reports the show control to its caller', () => {
    const onShow = renderHeader()
    // The show control is now provided by the floating FAB; Header no longer renders it.
    expect(onShow).not.toHaveBeenCalled()
  })

  it('keeps theme and language reachable in both dock states', () => {
    // Toggling the console must not hide the controls a visitor still needs.
    renderHeader()
    expect(screen.getByRole('combobox', { name: en.theme.label })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: en.language.label })).toBeTruthy()
  })
})
