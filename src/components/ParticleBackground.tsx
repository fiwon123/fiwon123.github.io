import { useEffect, useRef, useState } from 'react'

import {
  countFor,
  createField,
  dprFor,
  paint,
  readAccent,
  step,
  type ParticleField,
} from '../lib/particles'
import { prefersReducedMotion, REDUCED_MOTION_QUERY } from '../lib/reveal'

import styles from './ParticleBackground.module.css'

/**
 * Ambient particles behind the page: decorative, capped, pausable, and absent
 * under reduced motion.
 *
 * All the rules that can be checked without a browser live in
 * `lib/particles.ts`; this is only the plumbing — rAF, tab visibility, resize,
 * and keeping up with the accent token when the theme changes.
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [enabled, setEnabled] = useState(() => !prefersReducedMotion())

  // Follow the OS setting mid-session: motion the visitor turned off must stop
  // without a reload, and there is no CSS here that hides a running loop.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(REDUCED_MOTION_QUERY)
    const onChange = () => setEnabled(!query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let field: ParticleField | null = null
    let width = 0
    let height = 0
    let dirty = true
    let frame: number | null = null
    let last = 0

    // The accent is re-read when the theme stamps it onto <html>, not from a
    // useEffect: a parent effect runs *after* its children's, so an effect that
    // read the token here would race the ThemeProvider's data-theme write and
    // latch the previous theme's colour. Keying off the DOM itself, once per
    // frame, cannot be ordered wrongly — two string reads, and a getComputedStyle
    // only on the frame the theme actually changes.
    let accent = ''
    let accentStamp = ''

    const accentFor = (): string => {
      const root = document.documentElement
      const stamp = `${root.dataset.theme ?? ''}|${root.dataset.mode ?? ''}`
      if (stamp !== accentStamp) {
        accentStamp = stamp
        accent = readAccent(getComputedStyle(root))
      }
      return accent
    }

    const resize = () => {
      const nextWidth = window.innerWidth
      const nextHeight = window.innerHeight
      // `field &&` so a degenerate 0x0 first read still creates the field.
      if (field && nextWidth === width && nextHeight === height) return
      width = nextWidth
      height = nextHeight
      const dpr = dprFor(window.devicePixelRatio)
      // The backing store carries the DPR; the CSS box stays in viewport pixels.
      // Assigning canvas.width resets the bitmap — the paint in this same frame
      // draws it straight back, so a resize never exposes a blank layer.
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      field = createField(countFor(width, height), width, height)
    }

    const onFrame = (time: number) => {
      frame = null
      // Resuming sets `last` to 0, so the first frame back has dt 0 and cannot
      // teleport a particle across the screen after a long pause.
      const dt = last === 0 ? 0 : (time - last) / 1000
      last = time
      if (dirty) {
        dirty = false
        resize()
      }
      if (field) {
        step(field, dt, width, height)
        paint(ctx, field, accentFor())
      }
      if (!document.hidden) frame = requestAnimationFrame(onFrame)
    }

    const start = () => {
      if (frame !== null) return
      last = 0
      frame = requestAnimationFrame(onFrame)
    }

    const stop = () => {
      if (frame === null) return
      cancelAnimationFrame(frame)
      frame = null
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    const onResize = () => {
      dirty = true
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stop()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <canvas ref={canvasRef} className={styles.layer} aria-hidden="true" data-testid="particles" />
  )
}
