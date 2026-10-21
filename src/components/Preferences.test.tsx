// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { enUS } from '../i18n/en'
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
    const theme = screen.getByRole('combobox', { name: enUS.theme.label })
    expect(
      within(theme)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(PRESETS.map((preset) => enUS.theme.presets[preset]))
  })

  it('names the appearance button after the current mode', () => {
    renderPreferences()
    // Nothing stored, so the default mode is `dark`.
    expect(
      screen.getByRole('button', { name: `${enUS.theme.modeLabel}: ${enUS.theme.modes.dark}` }),
    ).toBeTruthy()
  })

  it('cycles light → dark and persists each choice', () => {
    renderPreferences()
    const name = (mode: keyof typeof enUS.theme.modes) =>
      `${enUS.theme.modeLabel}: ${enUS.theme.modes[mode]}`

    // dark (default) → light → dark
    fireEvent.click(screen.getByRole('button', { name: name('dark') }))
    expect(screen.getByRole('button', { name: name('light') })).toBeTruthy()
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('light')

    fireEvent.click(screen.getByRole('button', { name: name('light') }))
    expect(screen.getByRole('button', { name: name('dark') })).toBeTruthy()
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('dark')
  })

  it('shows the language as a short code, with an accessible name', () => {
    renderPreferences()
    const language = screen.getByRole('combobox', { name: enUS.language.label })
    expect(
      within(language)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['EN-US', 'PT-BR'])
  })

  it('carries no flag — the code alone names the language', () => {
    // A flag is artwork, not text: every new language would mean drawing and
    // maintaining a new national mark (#182). The emoji flag was worse — it
    // fell back to the letters "US"/"BR" on Windows, which has no flag-emoji
    // font (#179). The code comes from the locale string, so it scales.
    const { container } = renderPreferences()
    // No flag emoji...
    expect(container.textContent).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u)
    // ...and no drawn flag either.
    expect(container.querySelector('[data-flag]')).toBeNull()
    const language = screen.getByRole('combobox', { name: enUS.language.label })
    expect(language.querySelector('svg')).toBeNull()
  })

  it('updates the document language when the language changes', () => {
    renderPreferences()
    fireEvent.change(screen.getByRole('combobox', { name: enUS.language.label }), {
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

  it('paints no chip on the mode button — only the circle shows', () => {
    // The square chip was retired; the glyph alone is the control, so neither
    // a background nor a border (or a radius) may creep back in.
    const css = readFileSync(cssPath, 'utf8')
    const modeRule = /\.mode\s*\{[^}]*\}/.exec(css)?.[0]
    expect(modeRule).toBeTruthy()
    expect(modeRule).toMatch(/background:\s*none/)
    const borders = [...(modeRule ?? '').matchAll(/border(?:-radius)?:\s*([^;]+)/g)].map((match) =>
      match[1].trim(),
    )
    expect(borders.filter((value) => value !== 'none' && value !== '0')).toEqual([])
    expect(css).not.toMatch(/var\(--color-mode-btn-bg\)/)
    expect(css).not.toMatch(/var\(--color-mode-icon\)/)
  })

  it('keeps both glyphs mounted and cross-fades them with the reading', () => {
    const { container } = renderPreferences()
    // Sun + moon, both always present — neither is ever unmounted (#167/#172).
    const glyphs = () => container.querySelectorAll('svg [opacity]')
    expect(glyphs()).toHaveLength(2)
    const [sun, moon] = glyphs()
    // Default mode is dark, so the sun is hidden and the moon shown.
    expect(sun.getAttribute('opacity')).toBe('0')
    expect(moon.getAttribute('opacity')).toBe('1')

    fireEvent.click(
      screen.getByRole('button', { name: `${enUS.theme.modeLabel}: ${enUS.theme.modes.dark}` }),
    )
    expect(glyphs()).toHaveLength(2)
    expect(sun.getAttribute('opacity')).toBe('1')
    expect(moon.getAttribute('opacity')).toBe('0')

    fireEvent.click(
      screen.getByRole('button', { name: `${enUS.theme.modeLabel}: ${enUS.theme.modes.light}` }),
    )
    expect(glyphs()).toHaveLength(2)
    expect(sun.getAttribute('opacity')).toBe('0')
    expect(moon.getAttribute('opacity')).toBe('1')
  })

  it('cross-fades the glyphs at the theme-fade duration, off under reduced motion', () => {
    const css = readFileSync(cssPath, 'utf8')
    expect(css).toMatch(new RegExp(`transition:[\\s\\S]*?opacity\\s+${THEME_FADE_MS}ms`))
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
    expect(css).toMatch(/\.glyph\s*\{[\s\S]*?transition:\s*none/)
  })
})
