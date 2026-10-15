// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { ThemeProvider } from '../theme/ThemeProvider'
import { Header } from './Header'

function renderHeader(view: 'terminal' | 'browse', onToggleView = vi.fn()) {
  render(
    <ThemeProvider>
      <LanguageProvider>
        <Header view={view} onToggleView={onToggleView} />
      </LanguageProvider>
    </ThemeProvider>,
  )
  return onToggleView
}

afterEach(cleanup)

describe('Header', () => {
  it('hides the navigation in terminal mode, where the terminal navigates', () => {
    renderHeader('terminal')
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('shows the navigation in browse mode', () => {
    renderHeader('browse')
    expect(screen.getByRole('navigation', { name: en.a11y.mainNav })).toBeTruthy()
  })

  it('keeps the switch visible in both modes, labelled for where it goes', () => {
    renderHeader('terminal')
    const toBrowse = screen.getByRole('button', { name: en.view.toBrowse })
    // Label and state together would contradict: the label names the destination.
    expect(toBrowse.getAttribute('aria-pressed')).toBeNull()
    cleanup()

    renderHeader('browse')
    expect(screen.getByRole('button', { name: en.view.toTerminal })).toBeTruthy()
  })

  it('reports the toggle to its caller', () => {
    const onToggle = renderHeader('browse')
    act(() => screen.getByRole('button', { name: en.view.toTerminal }).click())
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('keeps theme and language reachable in terminal mode', () => {
    // Hiding the nav must not hide the controls a visitor still needs.
    renderHeader('terminal')
    expect(screen.getByRole('combobox', { name: en.theme.label })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: en.language.label })).toBeTruthy()
  })
})
