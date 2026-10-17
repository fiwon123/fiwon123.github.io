// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { cleanup, act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { METEOR_MAX, METEOR_MIN, countFor } from '../lib/meteors'
import { REDUCED_MOTION_QUERY } from '../lib/reveal'
import { useTheme } from '../theme/hooks'
import { ThemeProvider } from '../theme/ThemeProvider'
import { ParticleBackground } from './ParticleBackground'

import styles from './ParticleBackground.module.css'

// Comments are stripped before asserting: the prose at the top of the file
// names the very properties these tests pin, so a rule could be deleted while a
// comment kept the pattern matching.
const css = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'ParticleBackground.module.css'),
  'utf8',
).replaceAll(/\/\*[\s\S]*?\*\//g, '')

/**
 * What `paint` did this frame, in order. One `fillStyle` write opens a frame
 * (paint sets it once, before the loop), so the test can reset the log, flush a
 * frame, and read exactly that frame back.
 */
type DrawEvent =
  | { kind: 'fillStyle'; value: string }
  | { kind: 'clear'; w: number; h: number }
  | { kind: 'arc' }
  | { kind: 'fill'; alpha: number; fillStyle: string }
  | { kind: 'transform'; dpr: number }

const log: DrawEvent[] = []
const rafQueue = new Map<number, FrameRequestCallback>()
let nextRafId = 1
let now = 0

function installFrameLoop() {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextRafId++
    rafQueue.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafQueue.delete(id)
  })
}

/** Run `count` frames: each takes the pending callbacks, then they re-arm. */
function flushFrames(count = 1) {
  for (let i = 0; i < count; i++) {
    const batch = [...rafQueue.values()]
    rafQueue.clear()
    now += 16
    for (const callback of batch) callback(now)
  }
}

function takeLog(): DrawEvent[] {
  return log.splice(0, log.length)
}

function installContext() {
  const ctx = {
    _fs: '' as string | CanvasGradient | CanvasPattern,
    get fillStyle() {
      return this._fs
    },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      this._fs = value
      log.push({ kind: 'fillStyle', value: String(value) })
    },
    globalAlpha: 1,
    setTransform: (...args: number[]) => log.push({ kind: 'transform', dpr: args[0] }),
    clearRect: (_x: number, _y: number, w: number, h: number) => log.push({ kind: 'clear', w, h }),
    beginPath: () => {},
    arc: () => {
      log.push({ kind: 'arc' })
    },
    createLinearGradient: () => ({ addColorStop: () => {} }) as any,
    strokeStyle: '' as any,
    lineWidth: 0,
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    stroke: () => {},
    fill: () => {
      log.push({ kind: 'fill', alpha: ctx.globalAlpha, fillStyle: String(ctx.fillStyle) })
    },
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
  return ctx
}

function setViewport(width: number, height: number, devicePixelRatio = 1) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true })
  Object.defineProperty(window, 'devicePixelRatio', { value: devicePixelRatio, configurable: true })
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

function stubMatchMedia(reduce: { matches: boolean }) {
  const listeners = new Map<string, Set<(event: { matches: boolean }) => void>>()
  const matchMedia = (query: string) => ({
    get matches() {
      return query.includes('prefers-reduced-motion') ? reduce.matches : false
    },
    media: query,
    addEventListener: (_type: string, callback: (event: { matches: boolean }) => void) => {
      const set = listeners.get(query) ?? new Set()
      set.add(callback)
      listeners.set(query, set)
    },
    removeEventListener: (_type: string, callback: (event: { matches: boolean }) => void) => {
      listeners.get(query)?.delete(callback)
    },
  })
  vi.stubGlobal('matchMedia', matchMedia)
  return {
    emit(query: string, matches: boolean) {
      reduce.matches = matches
      for (const callback of listeners.get(query) ?? []) callback({ matches })
    },
    listening(query: string) {
      return listeners.get(query)?.size ?? 0
    },
  }
}

/**
 * Page accents keyed by the `data-theme`-`data-mode` the ThemeProvider stamps on
 * <html>. The accent is the reading one, so it changes with the preset *and* the
 * mode.
 */
const ACCENTS: Record<string, string> = {
  'studio-dark': 'rgb(110 168 254)',
  'paper-dark': 'rgb(227 163 85)',
  'paper-light': 'rgb(138 75 18)',
}

const realGetComputedStyle = window.getComputedStyle.bind(window)

function stubAccents() {
  window.getComputedStyle = ((element: Element) => ({
    getPropertyValue: (name: string) => {
      if (element !== document.documentElement || name !== '--color-accent') return ''
      const { theme, mode } = document.documentElement.dataset
      return ACCENTS[`${theme}-${mode}`] ?? ''
    },
  })) as unknown as typeof window.getComputedStyle
}

function PresetButton() {
  const { preset, setPreset } = useTheme()
  return (
    <button type="button" onClick={() => setPreset(preset === 'studio' ? 'paper' : 'studio')}>
      {preset}
    </button>
  )
}

function ModeButton() {
  const { mode, setMode } = useTheme()
  return (
    <button type="button" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
      {mode}
    </button>
  )
}

beforeEach(() => {
  setViewport(1280, 800, 1)
  installFrameLoop()
  installContext()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-mode')
})

afterEach(() => {
  cleanup()
  setHidden(false)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.getComputedStyle = realGetComputedStyle
  log.length = 0
  rafQueue.clear()
  now = 0
})

describe('ParticleBackground', () => {
  it('renders one canvas behind the page, hidden from assistive tech', () => {
    const { container } = render(<ParticleBackground />)
    const canvases = container.querySelectorAll('canvas')
    expect(canvases).toHaveLength(1)
    const canvas = canvases[0]
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(canvas.className).toBe(styles.layer)
    // The layer must not eat clicks aimed at the content above it.
    expect(css).toMatch(/pointer-events:\s*none/)
    expect(css).toMatch(/z-index:\s*-1/)
    // Absolutely positioned *replaced* elements resolve width:auto to the
    // intrinsic 300x150, so the box must be sized explicitly.
    expect(css).toMatch(/width:\s*100%/)
    expect(css).toMatch(/height:\s*100%/)
    expect(css).toMatch(/@media print[\s\S]*display:\s*none/)
  })

  it('fades a radial hole over the reading column and keeps the edges visible (#96)', () => {
    // Particles are born on every edge and cross the whole frame, so the cleared
    // area is a soft disc around the text — a radial core, not two fixed gutters.
    const mask = /mask-image:\s*([\s\S]*?);/.exec(css)?.[1] ?? ''
    expect(mask, 'no mask-image declaration').not.toBe('')
    expect(mask).toMatch(/radial-gradient/)
    expect(mask, 'a banded linear gradient is the old shape').not.toMatch(/linear-gradient/)
    expect(mask).toMatch(/at\s+50%\s+50%/)
    const stops = [...mask.matchAll(/(black|transparent)\s+(\d+)%/g)].map(
      (match) => [match[1], Number(match[2])] as const,
    )
    expect(stops.length, 'the mask has no stops').toBeGreaterThanOrEqual(2)
    const colorAt = (position: number) => stops.find(([, at]) => at === position)?.[0]
    // Centre: fully transparent, so the middle of the viewport is masked away.
    expect(colorAt(0), 'centre of the mask').toBe('transparent')
    // Edge: fully opaque, so the field is visible around the column.
    expect(colorAt(100), 'edge of the mask').toBe('black')
  })

  it('clears the canvas every frame so the trails do not accumulate (#88)', () => {
    setViewport(1280, 800, 1)
    render(<ParticleBackground />)
    flushFrames(1)
    const first = takeLog()
    const clears = first.filter((event) => event.kind === 'clear')
    expect(clears).toHaveLength(1)
    // Cleared in logical CSS pixels, like every other draw (the dpr transform
    // maps them onto the backing store).
    expect(clears[0]).toEqual({ kind: 'clear', w: 1280, h: 800 })
    // Cleared before anything is drawn, not after.
    expect(first.findIndex((event) => event.kind === 'clear')).toBeLessThan(
      first.findIndex((event) => event.kind === 'fill'),
    )

    // And once per frame, not once ever.
    flushFrames(2)
    expect(takeLog().filter((event) => event.kind === 'clear')).toHaveLength(2)
  })

  it('never draws the number of particles past the cap on a big screen', () => {
    setViewport(3840, 2160, 2)
    render(<ParticleBackground />)
    flushFrames(1)
    const events = takeLog()
    const fills = events.filter((event) => event.kind === 'fill')
    expect(fills.length).toBe(countFor(3840, 2160))
    expect(fills.length).toBeLessThanOrEqual(METEOR_MAX)
    // meteors paint uses strokes/gradients and arcs; just ensure something was drawn
    expect(fills.length).toBeGreaterThan(0)
  })

  it('keeps drawing meteors across several frames', () => {
    setViewport(1280, 800, 2)
    render(<ParticleBackground />)
    flushFrames(3)
    // Every frame paints each meteor's head; draws keep happening after the first.
    const fills = takeLog().filter((event) => event.kind === 'fill')
    expect(fills.length).toBeGreaterThan(0)
  })

  it('caps the backing store at DPR 2 even on a 3x display', () => {
    setViewport(800, 600, 3)
    render(<ParticleBackground />)
    flushFrames(1)
    const canvas = document.querySelector('canvas')
    expect(canvas?.width).toBe(800 * 2)
    expect(canvas?.height).toBe(600 * 2)
    expect(takeLog()).toContainEqual({ kind: 'transform', dpr: 2 })
  })

  it('scales the count with viewport area', () => {
    setViewport(400, 400, 1)
    render(<ParticleBackground />)
    flushFrames(1)
    const fills = takeLog().filter((event) => event.kind === 'fill')
    // A 400x400 phone-size window: countFor clamps into [METEOR_MIN, METEOR_MAX].
    const expected = countFor(400, 400)
    expect(expected).toBeGreaterThanOrEqual(METEOR_MIN)
    expect(expected).toBeLessThanOrEqual(METEOR_MAX)
    const small = document.querySelectorAll('canvas').length
    expect(small).toBe(1)
    expect(fills.length).toBe(expected)
  })

  it('pauses the loop while the tab is hidden and resumes where it left off', () => {
    render(<ParticleBackground />)
    flushFrames(2)
    takeLog()
    expect(rafQueue.size).toBe(1)

    // The event path: stop now and cancel the frame that was already armed.
    setHidden(true)
    expect(rafQueue.size).toBe(0)
    flushFrames(2)
    expect(takeLog()).toHaveLength(0)

    // The belt to that brace: if a frame runs after the tab hid without the
    // event (a missed notification), it must still not re-arm itself.
    setHidden(false)
    flushFrames(1) // arm a fresh frame
    takeLog()
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    flushFrames(1) // …which now runs while hidden
    expect(rafQueue.size).toBe(0)
    expect(takeLog().filter((event) => event.kind === 'fill').length).toBeGreaterThan(0)

    setHidden(false)
    expect(rafQueue.size).toBe(1)
    flushFrames(1)
    expect(takeLog().filter((event) => event.kind === 'fill').length).toBeGreaterThan(0)
  })

  it('keeps running across a resize without a stale field', () => {
    setViewport(400, 400, 1)
    render(<ParticleBackground />)
    flushFrames(1)
    const before = takeLog().filter((event) => event.kind === 'fill').length
    expect(before).toBe(countFor(400, 400))

    setViewport(1600, 900, 1)
    window.dispatchEvent(new Event('resize'))
    flushFrames(1)
    const after = takeLog().filter((event) => event.kind === 'fill').length
    expect(after).toBe(countFor(1600, 900))
    expect(after).toBeLessThanOrEqual(METEOR_MAX)
    // A large window typically has more particles; floor cases are impossible
    // to hit here, but the count must be consistent with countFor.
    expect(after).toBeGreaterThanOrEqual(METEOR_MIN)
    expect(after).toBeLessThanOrEqual(METEOR_MAX)
  })

  it('re-reads the page accent when the theme or mode changes', () => {
    stubAccents()
    render(
      <ThemeProvider>
        <ParticleBackground />
        <PresetButton />
        <ModeButton />
      </ThemeProvider>,
    )
    flushFrames(1)
    const first = takeLog()
    // Frame 1 runs resize() first (it logs the transform), so find the write.
    expect(first.find((event) => event.kind === 'fillStyle')).toEqual({
      kind: 'fillStyle',
      value: ACCENTS['studio-dark'],
    })

    fireEvent.click(screen.getByRole('button', { name: 'studio' }))
    flushFrames(1)
    const second = takeLog()
    expect(second.find((event) => event.kind === 'fillStyle')).toEqual({
      kind: 'fillStyle',
      value: ACCENTS['paper-dark'],
    })
    expect(second.filter((event) => event.kind === 'fill')[0]).toMatchObject({
      fillStyle: ACCENTS['paper-dark'],
    })

    // The accent is the page accent, so toggling the reading changes the particle
    // colour too (the dark reading accent is a different value).
    fireEvent.click(screen.getByRole('button', { name: 'dark' }))
    flushFrames(1)
    expect(takeLog().find((event) => event.kind === 'fillStyle')).toEqual({
      kind: 'fillStyle',
      value: ACCENTS['paper-light'],
    })

    fireEvent.click(screen.getByRole('button', { name: 'light' }))
    flushFrames(1)
    expect(takeLog().find((event) => event.kind === 'fillStyle')).toEqual({
      kind: 'fillStyle',
      value: ACCENTS['paper-dark'],
    })
  })

  it('draws nothing at all when reduced motion is already on', () => {
    const media = stubMatchMedia({ matches: true })
    const { container } = render(<ParticleBackground />)
    expect(container.querySelector('canvas')).toBeNull()
    expect(rafQueue.size).toBe(0)
    expect(takeLog()).toHaveLength(0)
    expect(media.listening(REDUCED_MOTION_QUERY)).toBe(1)
  })

  it('stops the loop live when the visitor turns reduced motion on', () => {
    const media = stubMatchMedia({ matches: false })
    const { container } = render(<ParticleBackground />)
    expect(container.querySelector('canvas')).not.toBeNull()
    flushFrames(1)
    expect(rafQueue.size).toBe(1)
    takeLog()

    act(() => {
      media.emit(REDUCED_MOTION_QUERY, true)
    })
    expect(container.querySelector('canvas')).toBeNull()
    expect(rafQueue.size).toBe(0)
    expect(takeLog()).toHaveLength(0)

    // And back again, without a reload.
    act(() => {
      media.emit(REDUCED_MOTION_QUERY, false)
    })
    expect(container.querySelector('canvas')).not.toBeNull()
    expect(rafQueue.size).toBe(1)
    flushFrames(1)
    expect(takeLog().filter((event) => event.kind === 'fill').length).toBeGreaterThan(0)
  })

  it('adds and removes its reduced-motion listener exactly once', () => {
    const media = stubMatchMedia({ matches: false })
    const { unmount } = render(<ParticleBackground />)
    expect(media.listening(REDUCED_MOTION_QUERY)).toBe(1)
    unmount()
    expect(media.listening(REDUCED_MOTION_QUERY)).toBe(0)
    expect(media.listening(DARK_QUERY)).toBe(0)
    expect(rafQueue.size).toBe(0)

    // The window/document listeners go with the loop, not with the component.
    flushFrames(1)
    window.dispatchEvent(new Event('resize'))
    document.dispatchEvent(new Event('visibilitychange'))
    expect(rafQueue.size).toBe(0)
  })

  it('paints the fallback colour when no token can be read', () => {
    render(<ParticleBackground />)
    flushFrames(1)
    expect(takeLog().find((event) => event.kind === 'fillStyle')).toEqual({
      kind: 'fillStyle',
      value: 'rgb(128 128 128)',
    })
  })
})
