// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { MODE_STORAGE_KEY, PRESETS } from '../theme/presets'
import { ThemeProvider } from '../theme/ThemeProvider'
import { Preferences } from './Preferences'

function renderPreferences() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <Preferences />
      </LanguageProvider>
    </ThemeProvider>,
  )
}

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('Preferences', () => {
  it('keeps the theme select with its label and every preset', () => {
    renderPreferences()
    const theme = screen.getByRole('combobox', { name: en.theme.label })
    expect(
      within(theme)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(PRESETS.map((preset) => en.theme.presets[preset]))
  })

  it('names the appearance button after the current mode', () => {
    renderPreferences()
    // Nothing stored, so the default mode is `dark`.
    expect(
      screen.getByRole('button', { name: `${en.theme.modeLabel}: ${en.theme.modes.dark}` }),
    ).toBeTruthy()
  })

  it('cycles light → dark and persists each choice', () => {
    renderPreferences()
    const name = (mode: keyof typeof en.theme.modes) =>
      `${en.theme.modeLabel}: ${en.theme.modes[mode]}`

    // dark (default) → light → dark
    fireEvent.click(screen.getByRole('button', { name: name('dark') }))
    expect(screen.getByRole('button', { name: name('light') })).toBeTruthy()
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('light')

    fireEvent.click(screen.getByRole('button', { name: name('light') }))
    expect(screen.getByRole('button', { name: name('dark') })).toBeTruthy()
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('dark')
  })

  it('shows the language as a flag and short code, with an accessible name', () => {
    renderPreferences()
    const language = screen.getByRole('combobox', { name: en.language.label })
    expect(
      within(language)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['🇺🇸 EN', '🇧🇷 PT-BR'])
  })

  it('updates the document language when the language changes', () => {
    renderPreferences()
    fireEvent.change(screen.getByRole('combobox', { name: en.language.label }), {
      target: { value: 'pt-BR' },
    })
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('leaves no control without an accessible name', () => {
    renderPreferences()
    const controls = [...screen.getAllByRole('combobox'), ...screen.getAllByRole('button')]
    expect(controls.length).toBeGreaterThan(0)
    for (const control of controls) {
      expect(control.getAttribute('aria-label') ?? control.textContent).toBeTruthy()
    }
  })
})
