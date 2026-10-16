// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_DOCK, DOCK_KEY, LEGACY_VIEW_KEY } from './terminalDock'
import { useTerminalDock } from './useTerminalDock'

function Probe() {
  const [open, setOpen] = useTerminalDock()
  return (
    <div>
      <span data-testid="open">{String(open)}</span>
      <button type="button" onClick={() => setOpen(!open)}>
        toggle
      </button>
    </div>
  )
}

function currentDock(): string {
  return screen.getByTestId('open').textContent ?? ''
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('useTerminalDock', () => {
  it('starts from the stored value', () => {
    localStorage.setItem(DOCK_KEY, 'false')
    render(<Probe />)
    expect(currentDock()).toBe('false')
  })

  it('falls back when nothing is stored', () => {
    render(<Probe />)
    expect(currentDock()).toBe(String(DEFAULT_DOCK))
  })

  it('migrates the view mode it replaced', () => {
    localStorage.setItem(LEGACY_VIEW_KEY, 'browse')
    render(<Probe />)
    expect(currentDock()).toBe('false')
  })

  it('persists the choice under its own key', () => {
    render(<Probe />)
    act(() => screen.getByText('toggle').click())
    const expected = !DEFAULT_DOCK
    expect(currentDock()).toBe(String(expected))
    expect(localStorage.getItem(DOCK_KEY)).toBe(String(expected))
  })

  it('survives a storage write failure without losing the change', () => {
    const setItem = localStorage.setItem.bind(localStorage)
    localStorage.setItem = () => {
      throw new Error('quota exceeded')
    }
    try {
      render(<Probe />)
      act(() => screen.getByText('toggle').click())
      expect(currentDock()).toBe(String(!DEFAULT_DOCK))
    } finally {
      localStorage.setItem = setItem
    }
  })
})
