import { useEffect, useState } from 'react'

import { shouldTypeImmediately } from './typewriter'

export type UseTypewriterOptions = {
  /** Whether typing may begin. Before it is true, the text stays held back. */
  start?: boolean
  /** Milliseconds between characters. */
  speedMs?: number
}

export type TypewriterState = {
  /** The prefix of the text to show right now. */
  typed: string
  /** True once the whole string is shown (or skipped entirely). */
  done: boolean
}

/**
 * Reveal `text` one character at a time, beginning once `start` is true.
 *
 * Fail-open: under reduced motion (or with no browser) the whole string comes
 * back at once and no timer is scheduled. A change of `text` starts over, so
 * switching language retypes the new string instead of leaving the old
 * half-typed one behind.
 */
export function useTypewriter(
  text: string,
  { start = true, speedMs = 40 }: UseTypewriterOptions = {},
): TypewriterState {
  const immediate = shouldTypeImmediately()
  // `count` belongs to the string it was measured against.
  const [tick, setTick] = useState(() => ({ text, count: immediate ? text.length : 0 }))

  useEffect(() => {
    if (shouldTypeImmediately() || !start) return
    let shown = 0
    const timer = setInterval(() => {
      shown += 1
      setTick({ text, count: shown })
      if (shown >= text.length) clearInterval(timer)
    }, speedMs)
    return () => clearInterval(timer)
  }, [text, start, speedMs])

  // Derived during render: a changed string starts over at once, rather than
  // flashing the previous string's length on the first frame after the change.
  const count = immediate ? text.length : tick.text === text ? tick.count : 0
  return { typed: text.slice(0, count), done: count >= text.length }
}
