// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { ThemeProvider } from '../theme/ThemeProvider'
import { Header } from './Header'

function renderHeader(dockOpen: boolean, onToggleDock = vi.fn()) {
  render(
    <ThemeProvider>
      <LanguageProvider>
        <Header dockOpen={dockOpen} onToggleDock={onToggleDock} />
      </LanguageProvider>
    </ThemeProvider>,
  )
  return onToggleDock
}

afterEach(cleanup)

describe('Header', () => {
  it('always shows the navigation: the page is never hidden behind the console', () => {
    renderHeader(true)
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
    cleanup()
    renderHeader(false)
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
  })

  it('labels the toggle for what clicking it does, and exposes the state', () => {
    renderHeader(true)
    const hide = screen.getByRole('button', { name: en.terminal.hide })
    expect(hide.getAttribute('aria-expanded')).toBe('true')
    expect(hide.getAttribute('aria-controls')).toBe('terminal-dock')
    cleanup()

    renderHeader(false)
    const show = screen.getByRole('button', { name: en.terminal.show })
    expect(show.getAttribute('aria-expanded')).toBe('false')
  })

  it('reports the toggle to its caller', () => {
    const onToggle = renderHeader(true)
    act(() => screen.getByRole('button', { name: en.terminal.hide }).click())
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('keeps theme and language reachable in both dock states', () => {
    // Toggling the console must not hide the controls a visitor still needs.
    renderHeader(true)
    expect(screen.getByRole('combobox', { name: en.theme.label })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: en.language.label })).toBeTruthy()
  })
})
