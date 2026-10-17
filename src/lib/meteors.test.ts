import { describe, expect, it } from 'vitest'

import {
  alphaAt,
  countFor,
  createField,
  dprFor,
  FALLBACK_COLOR,
  FADE_IN,
  FADE_OUT,
  GUTTER_MAX,
  GUTTER_MIN,
  gutterForWidth,
  HEAD_SIZE_MAX,
  HEAD_SIZE_MIN,
  METEOR_MAX,
  METEOR_MIN,
  PARTICLE_ALPHA,
  paint,
  readAccent,
  spawn,
  SPAWN_BAND,
  SPEED_MAX,
  SPEED_MIN,
  step,
  TRAIL_LEN,
  type Random,
} from './meteors'

/** Mulberry32: a small deterministic PRNG so a spawn can be replayed exactly. */
function seeded(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Event = {
  op: string
  args: number[]
  style?: string
  alpha?: number
}

/** A canvas context that records every draw, so `paint` is testable with no DOM. */
function recordingContext() {
  const events: Event[] = []
  const ctx = {
    globalAlpha: 1,
    strokeStyle: '' as unknown,
    fillStyle: '' as unknown,
    lineWidth: 0,
    clearRect: (x: number, y: number, w: number, h: number) =>
      events.push({ op: 'clear', args: [x, y, w, h] }),
    beginPath: () => events.push({ op: 'begin', args: [] }),
    moveTo: (x: number, y: number) => events.push({ op: 'moveTo', args: [x, y] }),
    lineTo: (x: number, y: number) => events.push({ op: 'lineTo', args: [x, y] }),
    quadraticCurveTo: (cx: number, cy: number, x: number, y: number) =>
      events.push({ op: 'curveTo', args: [cx, cy, x, y] }),
    arc: (x: number, y: number, r: number) => events.push({ op: 'arc', args: [x, y, r] }),
    stroke: () =>
      events.push({
        op: 'stroke',
        args: [],
        style: String(ctx.strokeStyle),
        alpha: ctx.globalAlpha,
      }),
    fill: () =>
      events.push({ op: 'fill', args: [], style: String(ctx.fillStyle), alpha: ctx.globalAlpha }),
    createLinearGradient: (x0: number, y0: number, x1: number, y1: number) => {
      events.push({ op: 'gradient', args: [x0, y0, x1, y1] })
      return {
        addColorStop: (offset: number, color: string) =>
          events.push({ op: 'stop', args: [offset], style: color }),
      }
    },
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, events, raw: ctx }
}

const WIDTH = 1280
const HEIGHT = 800

describe('countFor', () => {
  it('clamps to [METEOR_MIN, METEOR_MAX]', () => {
    expect(countFor(0, 0)).toBe(METEOR_MIN)
    expect(countFor(3840, 2160)).toBe(METEOR_MAX)
    expect(countFor(-10, 400)).toBe(METEOR_MIN)
  })

  it('scales with area between the floor and the cap', () => {
    const tiny = countFor(300, 300) // 90k px -> below the floor
    const medium = countFor(500, 500) // 250k px -> ~12
    const large = countFor(1920, 1080) // ~2M px -> capped
    expect(tiny).toBe(METEOR_MIN)
    expect(medium).toBeGreaterThan(tiny)
    expect(medium).toBeLessThan(METEOR_MAX)
    expect(large).toBe(METEOR_MAX)
  })
})

describe('gutterForWidth', () => {
  it('clamps the gutter band to [GUTTER_MIN, GUTTER_MAX]', () => {
    expect(gutterForWidth(100)).toBe(GUTTER_MIN)
    expect(gutterForWidth(1000)).toBeCloseTo(220, 6)
    expect(gutterForWidth(2000)).toBe(GUTTER_MAX)
  })
})

describe('dprFor', () => {
  it('caps the device pixel ratio at 2 and never returns 0/NaN', () => {
    expect(dprFor(undefined)).toBe(1)
    expect(dprFor(0)).toBe(1)
    expect(dprFor(Number.NaN)).toBe(1)
    expect(dprFor(1.5)).toBe(1.5)
    expect(dprFor(3)).toBe(2)
  })
})

describe('readAccent', () => {
  it('prefers the page accent and falls back when it is blank', () => {
    const style = { getPropertyValue: () => ' rgb(110 168 254) ' } as unknown as CSSStyleDeclaration
    expect(readAccent(style)).toBe('rgb(110 168 254)')
    const blank = { getPropertyValue: () => '   ' } as unknown as CSSStyleDeclaration
    expect(readAccent(blank)).toBe(FALLBACK_COLOR)
  })
})

describe('spawn', () => {
  it('births every trail in the left or right gutter, within the top band', () => {
    const r = seeded(7)
    const sides = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const m = spawn(WIDTH, HEIGHT, r)
      const left = m.x < 0
      const right = m.x > WIDTH
      // Left/right only: never born on the top or bottom edge.
      expect(left || right, 'born in a gutter, outside the viewport').toBe(true)
      expect(m.y, 'born within the top band').toBeGreaterThanOrEqual(0)
      expect(m.y, 'born within the top band').toBeLessThan(HEIGHT * SPAWN_BAND)
      if (left) sides.add('left')
      if (right) sides.add('right')
    }
    expect([...sides].sort()).toEqual(['left', 'right'])
  })

  it('aims inward and downward, so a gutter trail crosses the frame', () => {
    const r = seeded(11)
    for (let i = 0; i < 200; i++) {
      const m = spawn(WIDTH, HEIGHT, r)
      if (m.x < 0) expect(m.vx, 'left gutter -> heading right').toBeGreaterThan(0)
      else expect(m.vx, 'right gutter -> heading left').toBeLessThan(0)
      expect(m.vy, 'always drifting down').toBeGreaterThan(0)
    }
  })

  it('is straight and sparse: no turn/spread, size and speed within range', () => {
    const r = seeded(23)
    for (let i = 0; i < 200; i++) {
      const m = spawn(WIDTH, HEIGHT, r)
      const speed = Math.hypot(m.vx, m.vy)
      expect(speed).toBeGreaterThanOrEqual(SPEED_MIN - 1e-9)
      expect(speed).toBeLessThanOrEqual(SPEED_MAX + 1e-9)
      expect(m.size).toBeGreaterThanOrEqual(HEAD_SIZE_MIN)
      expect(m.size).toBeLessThanOrEqual(HEAD_SIZE_MAX)
      // No curve state survives the rebuild.
      expect('turn' in m).toBe(false)
      expect('spread' in m).toBe(false)
      expect('trail' in m).toBe(false)
      expect(m.life).toBeGreaterThanOrEqual(0)
      expect(m.life).toBeLessThan(m.maxLife)
    }
  })
})

describe('createField', () => {
  it('creates exactly `count` trails and is deterministic for a seed', () => {
    const a = createField(5, WIDTH, HEIGHT, seeded(1))
    const b = createField(5, WIDTH, HEIGHT, seeded(1))
    expect(a.count).toBe(5)
    expect(a.meteors).toHaveLength(5)
    expect(a.meteors.map((m) => [m.x, m.y, m.angle])).toEqual(
      b.meteors.map((m) => [m.x, m.y, m.angle]),
    )
  })

  it('treats a negative or fractional count as a floor', () => {
    expect(createField(-3, WIDTH, HEIGHT, seeded(1)).count).toBe(0)
    expect(createField(3.9, WIDTH, HEIGHT, seeded(1)).count).toBe(3)
  })
})

describe('step', () => {
  it('advances life and moves in a straight line at constant velocity', () => {
    const field = createField(1, WIDTH, HEIGHT, seeded(3))
    const m = field.meteors[0]
    const { x, y, vx, vy, angle } = m
    const life = m.life
    step(field, 0.02, WIDTH, HEIGHT, seeded(3))
    const after = field.meteors[0]
    expect(after.life).toBeCloseTo(life + 0.02, 10)
    // Straight: the heading never turns and the velocity never changes.
    expect(after.angle).toBe(angle)
    expect(after.vx).toBe(vx)
    expect(after.vy).toBe(vy)
    expect(after.x).toBeCloseTo(x + vx * 0.02, 10)
    expect(after.y).toBeCloseTo(y + vy * 0.02, 10)
  })

  it('clamps the frame delta so a stall does not teleport the field', () => {
    const field = createField(1, WIDTH, HEIGHT, seeded(5))
    const m = field.meteors[0]
    m.life = 0
    m.maxLife = 100
    m.x = 0
    m.y = 0
    m.vx = 100
    m.vy = 0
    step(field, 5, WIDTH, HEIGHT, seeded(5))
    expect(field.meteors[0].life).toBeCloseTo(0.05, 10)
    expect(field.meteors[0].x).toBeCloseTo(5, 10)
  })

  it('recycles a trail that outlives its lifetime', () => {
    const field = createField(1, WIDTH, HEIGHT, seeded(9))
    const m = field.meteors[0]
    m.life = m.maxLife - 0.001
    const beforeLife = m.life
    step(field, 0.05, WIDTH, HEIGHT, seeded(9))
    const after = field.meteors[0]
    // Replaced by a fresh spawn (a new object), not carried on existing.
    expect(after).not.toBe(m)
    expect(after.life).toBeLessThan(beforeLife + 0.05)
    expect(after.life).toBeLessThan(after.maxLife)
    expect(after.life).toBeGreaterThanOrEqual(0)
  })

  it('recycles a trail that drifts out of the despawn margin', () => {
    const field = createField(1, WIDTH, HEIGHT, seeded(13))
    const m = field.meteors[0]
    m.x = WIDTH + 10_000
    step(field, 0.05, WIDTH, HEIGHT, seeded(13))
    const after = field.meteors[0]
    // Respawned in a gutter, so it is back inside the despawn margin.
    expect(after).not.toBe(m)
    expect(Math.abs(after.x - (WIDTH + 10_000))).toBeGreaterThan(1000)
  })
})

describe('alphaAt', () => {
  it('fades in from zero at birth and out to zero at death', () => {
    expect(alphaAt(0, 10)).toBe(0)
    expect(alphaAt(10, 10)).toBe(0)
    expect(alphaAt(0.5 * 10, 10)).toBe(1)
  })

  it('never leaves [0, 1] and its peak is exactly 1 (so PARTICLE_ALPHA is the cap)', () => {
    let peak = 0
    for (let i = 0; i <= 1000; i++) {
      const a = alphaAt((i / 1000) * 10, 10)
      expect(a, `alphaAt at ${i}`).toBeGreaterThanOrEqual(0)
      expect(a, `alphaAt at ${i}`).toBeLessThanOrEqual(1)
      peak = Math.max(peak, a)
    }
    expect(peak).toBe(1)
  })

  it('rises over the fade-in window and falls over the fade-out window', () => {
    expect(alphaAt(FADE_IN * 10 * 0.5, 10)).toBeLessThan(1)
    expect(alphaAt(FADE_IN * 10, 10)).toBe(1)
    expect(alphaAt(10 - FADE_OUT * 10 * 0.5, 10)).toBeGreaterThan(0)
    expect(alphaAt(10 - FADE_OUT * 10, 10)).toBe(1)
  })

  it('is zero for a non-positive lifetime', () => {
    expect(alphaAt(5, 0)).toBe(0)
    expect(alphaAt(5, -1)).toBe(0)
  })
})

describe('paint', () => {
  it('clears the frame, then draws one straight trail and one head per particle', () => {
    const { ctx, events } = recordingContext()
    const field = createField(6, WIDTH, HEIGHT, seeded(2))
    paint(ctx, field, 'rgb(110 168 254)', WIDTH, HEIGHT)
    const ops = events.map((e) => e.op)
    expect(events[0]).toMatchObject({ op: 'clear', args: [0, 0, WIDTH, HEIGHT] })
    expect(ops.filter((op) => op === 'stroke')).toHaveLength(6)
    expect(ops.filter((op) => op === 'fill')).toHaveLength(6)
    expect(ops.filter((op) => op === 'arc')).toHaveLength(6)
    // Straight, never curved: a lineTo trail, no quadraticCurveTo.
    expect(ops.filter((op) => op === 'lineTo')).toHaveLength(6)
    expect(ops).not.toContain('curveTo')
    // Gradient runs from the tail toward the head (transparent -> accent).
    expect(ops.filter((op) => op === 'gradient')).toHaveLength(6)
    const stops = events.filter((e) => e.op === 'stop')
    expect(stops.some((s) => s.style === 'rgba(0,0,0,0)')).toBe(true)
    expect(stops.some((s) => s.style === 'rgb(110 168 254)')).toBe(true)
    expect(events.some((e) => e.op === 'fill' && e.style === 'rgb(110 168 254)')).toBe(true)
  })

  it('draws the tail behind the head along the velocity', () => {
    const { ctx, events } = recordingContext()
    const field = createField(1, WIDTH, HEIGHT, seeded(2))
    const m = field.meteors[0]
    paint(ctx, field, 'rgb(110 168 254)', WIDTH, HEIGHT)
    const from = events.find((e) => e.op === 'moveTo')!
    const to = events.find((e) => e.op === 'lineTo')!
    expect(from.args[0]).toBeCloseTo(m.x - m.vx * TRAIL_LEN, 6)
    expect(from.args[1]).toBeCloseTo(m.y - m.vy * TRAIL_LEN, 6)
    expect(to.args[0]).toBeCloseTo(m.x, 6)
    expect(to.args[1]).toBeCloseTo(m.y, 6)
  })

  it('never draws a particle stronger than PARTICLE_ALPHA', () => {
    const { ctx, events } = recordingContext()
    const field = createField(20, WIDTH, HEIGHT, seeded(4))
    paint(ctx, field, 'rgb(110 168 254)', WIDTH, HEIGHT)
    const draws = events.filter((e) => e.op === 'stroke' || e.op === 'fill')
    expect(draws.length).toBeGreaterThan(0)
    for (const d of draws) {
      expect(d.alpha).toBeLessThanOrEqual(PARTICLE_ALPHA + 1e-9)
      expect(d.alpha).toBeGreaterThanOrEqual(0)
    }
  })

  it('restores the global alpha after painting', () => {
    const { ctx, events, raw } = recordingContext()
    const field = createField(3, WIDTH, HEIGHT, seeded(6))
    paint(ctx, field, 'rgb(110 168 254)', WIDTH, HEIGHT)
    expect(raw.globalAlpha).toBe(1)
    expect(events.length).toBeGreaterThan(0)
  })
})
