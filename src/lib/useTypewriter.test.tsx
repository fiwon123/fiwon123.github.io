// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useTypewriter } from './useTypewriter'

/** A `matchMedia` stub whose reduced-motion answer is fixed. */
function motionAllowed() {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }))
}

function reducedMotion() {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query }))
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useTypewriter', () => {
  it('reveals one character per tick and ends on the whole string', () => {
    vi.useFakeTimers()
    motionAllowed()
    const { result } = renderHook(() => useTypewriter('abc', { speedMs: 10 }))

    expect(result.current.typed).toBe('')
    expect(result.current.done).toBe(false)

    act(() => void vi.advanceTimersByTime(10))
    expect(result.current.typed).toBe('a')

    act(() => void vi.advanceTimersByTime(20))
    expect(result.current.typed).toBe('abc')
    expect(result.current.done).toBe(true)
  })

  it('holds the text back until start is true', () => {
    vi.useFakeTimers()
    motionAllowed()
    const { result, rerender } = renderHook(
      ({ start }: { start: boolean }) => useTypewriter('abc', { start, speedMs: 10 }),
      { initialProps: { start: false } },
    )

    act(() => void vi.advanceTimersByTime(100))
    expect(result.current.typed).toBe('')

    rerender({ start: true })
    act(() => void vi.advanceTimersByTime(30))
    expect(result.current.typed).toBe('abc')
  })

  it('shows the whole string at once under reduced motion, with no timer', () => {
    vi.useFakeTimers()
    reducedMotion()
    const { result } = renderHook(() => useTypewriter('abc', { speedMs: 10 }))

    expect(result.current.typed).toBe('abc')
    expect(result.current.done).toBe(true)
    // Nothing is pending: the text is not a step toward the real content.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('retypes when the text changes, rather than leaving a half string', () => {
    vi.useFakeTimers()
    motionAllowed()
    const { result, rerender } = renderHook(
      ({ text }: { text: string }) => useTypewriter(text, { speedMs: 10 }),
      { initialProps: { text: 'ab' } },
    )

    act(() => void vi.advanceTimersByTime(20))
    expect(result.current.typed).toBe('ab')

    rerender({ text: 'xyz' })
    expect(result.current.typed).toBe('')
    act(() => void vi.advanceTimersByTime(30))
    expect(result.current.typed).toBe('xyz')
  })
})
