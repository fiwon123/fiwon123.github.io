// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTheme } from './hooks'
import { MODE_STORAGE_KEY, PRESET_STORAGE_KEY, THEME_FADE_CLASS, THEME_FADE_MS } from './presets'
import { ThemeProvider } from './ThemeProvider'

function Probe() {
  const { preset, mode, setPreset, setMode } = useTheme()
  return (
    <div>
      <span data-testid="preset">{preset}</span>
      <span data-testid="mode">{mode}</span>
      <button
        type="button"
        onClick={() => {
          setPreset('violet')
          setMode('light')
        }}
      >
        violet-light
      </button>
    </div>
  )
}

function renderProbe() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.mode
})

afterEach(cleanup)

describe('ThemeProvider', () => {
  it('defaults to the studio preset in dark mode', () => {
    renderProbe()
    expect(screen.getByTestId('preset').textContent).toBe('studio')
    expect(screen.getByTestId('mode').textContent).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('studio')
    expect(document.documentElement.dataset.mode).toBe('dark')
  })

  it('applies and persists changes to the document element', () => {
    renderProbe()

    fireEvent.click(screen.getByRole('button', { name: 'violet-light' }))

    expect(screen.getByTestId('preset').textContent).toBe('violet')
    expect(screen.getByTestId('mode').textContent).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('violet')
    expect(document.documentElement.dataset.mode).toBe('light')
    expect(localStorage.getItem(PRESET_STORAGE_KEY)).toBe('violet')
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('light')
  })

  it('restores a persisted preset and mode', () => {
    localStorage.setItem(PRESET_STORAGE_KEY, 'ember')
    localStorage.setItem(MODE_STORAGE_KEY, 'light')

    renderProbe()

    expect(screen.getByTestId('preset').textContent).toBe('ember')
    expect(screen.getByTestId('mode').textContent).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('ember')
    expect(document.documentElement.dataset.mode).toBe('light')
  })

  it('ignores the retired `system` value and falls back to dark', () => {
    localStorage.setItem(MODE_STORAGE_KEY, 'system')

    renderProbe()

    expect(screen.getByTestId('mode').textContent).toBe('dark')
    expect(document.documentElement.dataset.mode).toBe('dark')
  })

  it('does not add the fade class on mount when the stamp already matches', () => {
    document.documentElement.dataset.theme = 'studio'
    document.documentElement.dataset.mode = 'dark'
    renderProbe()
    expect(document.documentElement.classList.contains(THEME_FADE_CLASS)).toBe(false)
  })

  it('adds the fade class when preset or mode changes and removes it after the fade', () => {
    vi.useFakeTimers()
    renderProbe()
    fireEvent.click(screen.getByRole('button', { name: 'violet-light' }))
    expect(document.documentElement.classList.contains(THEME_FADE_CLASS)).toBe(true)
    vi.advanceTimersByTime(THEME_FADE_MS)
    expect(document.documentElement.classList.contains(THEME_FADE_CLASS)).toBe(false)
  })

  it('does not add the fade class under prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
    }))
    renderProbe()
    fireEvent.click(screen.getByRole('button', { name: 'violet-light' }))
    expect(document.documentElement.classList.contains(THEME_FADE_CLASS)).toBe(false)
  })
})
