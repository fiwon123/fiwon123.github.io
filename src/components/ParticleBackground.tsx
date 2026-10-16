import { useEffect, useRef, useState } from 'react'

import { createField, dprFor, paint, readAccent, step, countFor } from '../lib/meteors'
import { prefersReducedMotion, REDUCED_MOTION_QUERY } from '../lib/reveal'

import styles from './ParticleBackground.module.css'

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [enabled, setEnabled] = useState(() => !prefersReducedMotion())

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

    let field: ReturnType<typeof createField> | null = null
    let width = 0
    let height = 0
    let dirty = true
    let frame: number | null = null
    let last = 0

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
      if (field && nextWidth === width && nextHeight === height) return
      width = nextWidth
      height = nextHeight
      const dpr = dprFor(window.devicePixelRatio)
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      field = createField(countFor(width, height), width, height)
    }

    const onFrame = (time: number) => {
      frame = null
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

    start()
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled])

  if (!enabled) return null

  return <canvas ref={canvasRef} className={styles.layer} aria-hidden="true" role="presentation" />
}
