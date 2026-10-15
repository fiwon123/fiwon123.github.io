// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useViewMode } from './useViewMode'
import { DEFAULT_VIEW, LEGACY_TERMINAL_KEY, VIEW_KEY } from './viewMode'

function Probe() {
  const [mode, setMode] = useViewMode()
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button type="button" onClick={() => setMode(mode === 'terminal' ? 'browse' : 'terminal')}>
        switch
      </button>
    </div>
  )
}

function currentMode(): string {
  return screen.getByTestId('mode').textContent ?? ''
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('useViewMode', () => {
  it('starts from the stored mode', () => {
    localStorage.setItem(VIEW_KEY, 'browse')
    render(<Probe />)
    expect(currentMode()).toBe('browse')
  })

  it('falls back when nothing is stored', () => {
    render(<Probe />)
    expect(currentMode()).toBe(DEFAULT_VIEW)
  })

  it('migrates the flag it replaced', () => {
    localStorage.setItem(LEGACY_TERMINAL_KEY, 'false')
    render(<Probe />)
    expect(currentMode()).toBe('browse')
  })

  it('persists the choice under its own key', () => {
    render(<Probe />)
    act(() => screen.getByText('switch').click())
    const expected = DEFAULT_VIEW === 'terminal' ? 'browse' : 'terminal'
    expect(currentMode()).toBe(expected)
    expect(localStorage.getItem(VIEW_KEY)).toBe(expected)
  })

  it('survives a storage write failure without losing the change', () => {
    const setItem = localStorage.setItem.bind(localStorage)
    localStorage.setItem = () => {
      throw new Error('quota exceeded')
    }
    try {
      render(<Probe />)
      act(() => screen.getByText('switch').click())
      expect(currentMode()).toBe(DEFAULT_VIEW === 'terminal' ? 'browse' : 'terminal')
    } finally {
      localStorage.setItem = setItem
    }
  })
})
