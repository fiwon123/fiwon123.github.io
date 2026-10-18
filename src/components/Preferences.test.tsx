// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { en } from '../i18n/en'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { MODE_STORAGE_KEY, PRESETS, THEME_FADE_MS } from '../theme/presets'
import { ThemeProvider } from '../theme/ThemeProvider'
import { Preferences } from './Preferences'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const cssPath = path.resolve(__dirname, './Preferences.module.css')

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

  it('uses the mode icon token in the mode icon styles', () => {
    const css = readFileSync(cssPath, 'utf8')
    expect(css).toMatch(/\.icon\s*\{[\s\S]*?color:\s*var\(--color-mode-icon\)/)
  })

  it('paints the button with the chip token, not a reading surface', () => {
    const css = readFileSync(cssPath, 'utf8')
    expect(css).toMatch(/\.mode\s*\{[\s\S]*?background:\s*var\(--color-mode-btn-bg\)/)
    expect(css).not.toMatch(/\.mode\s*\{[\s\S]*?background:\s*var\(--color-surface\)/)
  })

  it('keeps the disc mounted and fades its fill with the reading', () => {
    const { container } = renderPreferences()
    const discs = () => container.querySelectorAll('circle')
    // Ring + disc, always — the disc is never unmounted (#167).
    expect(discs()).toHaveLength(2)
    const disc = discs()[1]
    // Default mode is dark, so the disc starts filled.
    expect(disc.getAttribute('fill-opacity')).toBe('1')

    fireEvent.click(
      screen.getByRole('button', { name: `${en.theme.modeLabel}: ${en.theme.modes.dark}` }),
    )
    expect(discs()).toHaveLength(2)
    expect(disc.getAttribute('fill-opacity')).toBe('0')

    fireEvent.click(
      screen.getByRole('button', { name: `${en.theme.modeLabel}: ${en.theme.modes.light}` }),
    )
    expect(discs()).toHaveLength(2)
    expect(disc.getAttribute('fill-opacity')).toBe('1')
  })

  it('cross-fades the disc fill at the theme-fade duration, off under reduced motion', () => {
    const css = readFileSync(cssPath, 'utf8')
    expect(css).toMatch(new RegExp(`transition:[\\s\\S]*?fill-opacity\\s+${THEME_FADE_MS}ms`))
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
    expect(css).toMatch(/\.disc\s*\{[\s\S]*?transition:\s*none/)
  })
})
