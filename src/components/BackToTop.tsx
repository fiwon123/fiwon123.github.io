import { useEffect, useState } from 'react'

import { useT } from '../i18n/hooks'
import { prefersReducedMotion } from '../lib/reveal'

import styles from './BackToTop.module.css'

/** Scroll distance, in pixels, before the button appears. */
export const BACK_TO_TOP_THRESHOLD = 400

export function BackToTop() {
  const t = useT()
  const [visible, setVisible] = useState(() => scrolledPastThreshold())

  useEffect(() => {
    let frame = 0

    function onScroll() {
      // Throttle to one state update per frame: a scroll listener that writes
      // state synchronously on every event forces a layout read per event.
      if (frame !== 0) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setVisible(scrolledPastThreshold())
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [])

  if (!visible) return null

  function toTop() {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    // Send focus with the scroll, or a keyboard user lands at the top with the
    // focus ring still on a button that no longer exists.
    document.getElementById('top')?.focus({ preventScroll: true })
  }

  return (
    <button type="button" className={styles.button} onClick={toTop} aria-label={t.a11y.backToTop}>
      <span aria-hidden="true">↑</span>
    </button>
  )
}

function scrolledPastThreshold(): boolean {
  if (typeof window === 'undefined') return false
  return window.scrollY > BACK_TO_TOP_THRESHOLD
}
