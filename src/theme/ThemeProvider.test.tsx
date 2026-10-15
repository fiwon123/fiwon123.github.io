// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useTheme } from './hooks'
import { MODE_STORAGE_KEY, PRESET_STORAGE_KEY } from './presets'
import { ThemeProvider } from './ThemeProvider'

function Probe() {
  const { preset, mode, resolvedMode, setPreset, setMode } = useTheme()
  return (
    <div>
      <span data-testid="preset">{preset}</span>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolvedMode}</span>
      <button
        type="button"
        onClick={() => {
          setPreset('terminal')
          setMode('dark')
        }}
      >
        terminal-dark
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
  it('defaults to the studio preset in system mode', () => {
    renderProbe()
    expect(screen.getByTestId('preset').textContent).toBe('studio')
    expect(screen.getByTestId('mode').textContent).toBe('system')
    // jsdom has no matchMedia, so system resolves to light.
    expect(screen.getByTestId('resolved').textContent).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('studio')
    expect(document.documentElement.dataset.mode).toBe('light')
  })

  it('applies and persists changes to the document element', () => {
    renderProbe()

    fireEvent.click(screen.getByRole('button', { name: 'terminal-dark' }))

    expect(screen.getByTestId('preset').textContent).toBe('terminal')
    expect(screen.getByTestId('mode').textContent).toBe('dark')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('terminal')
    expect(document.documentElement.dataset.mode).toBe('dark')
    expect(localStorage.getItem(PRESET_STORAGE_KEY)).toBe('terminal')
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('dark')
  })

  it('restores a persisted preset and mode', () => {
    localStorage.setItem(PRESET_STORAGE_KEY, 'paper')
    localStorage.setItem(MODE_STORAGE_KEY, 'dark')

    renderProbe()

    expect(screen.getByTestId('preset').textContent).toBe('paper')
    expect(screen.getByTestId('mode').textContent).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('paper')
  })
})
