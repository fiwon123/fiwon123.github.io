import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react'

import { shouldRevealImmediately } from './reveal'

type Observer = { observe: (node: Element) => void; disconnect: () => void }

/**
 * Reveal an element once, when it scrolls into view.
 *
 * Returns `[ref, revealed]`: attach the ref to the element and add the visible
 * class when `revealed` is true. The element is revealed at most once — the
 * observer disconnects on first intersection, so scrolling back up does not
 * re-hide it.
 *
 * Fails open: with no `IntersectionObserver`, or under reduced motion, the
 * element starts revealed and nothing is observed.
 */
export function useReveal<T extends Element>(): readonly [RefCallback<T>, boolean] {
  const [revealed, setRevealed] = useState<boolean>(() => shouldRevealImmediately())
  const observer = useRef<Observer | null>(null)

  const ref = useCallback<RefCallback<T>>((node) => {
    observer.current?.disconnect()
    observer.current = null
    if (!node) return

    if (shouldRevealImmediately()) {
      setRevealed(true)
      return
    }

    const Observer = (
      window as unknown as {
        IntersectionObserver?: new (
          cb: (entries: { isIntersecting: boolean }[]) => void,
          options?: unknown,
        ) => Observer
      }
    ).IntersectionObserver

    if (typeof Observer !== 'function') {
      setRevealed(true)
      return
    }

    const instance = new Observer(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setRevealed(true)
        instance.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    )

    instance.observe(node)
    observer.current = instance
  }, [])

  useEffect(() => () => observer.current?.disconnect(), [])

  return [ref, revealed] as const
}
