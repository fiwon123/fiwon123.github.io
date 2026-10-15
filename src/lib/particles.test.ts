import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  countFor,
  createField,
  dprFor,
  FALLBACK_COLOR,
  MAX_DPR,
  PARTICLE_ALPHA,
  PARTICLE_AREA,
  PARTICLE_MAX,
  PARTICLE_MIN,
  paint,
  readAccent,
  step,
} from './particles'

/** Deterministic rng so a failure reproduces (mulberry32). */
function seeded(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function fieldOf(width = 1280, height = 800) {
  return createField(countFor(width, height), width, height, seeded(7))
}

/** A canvas context that records what paint asked for, without a canvas. */
function recordingContext() {
  const calls: { method: string; args: number[] }[] = []
  const values: Record<string, unknown> = {}
  const ctx = {
    fillStyle: '',
    globalAlpha: 1,
    clearRect: (...args: number[]) => calls.push({ method: 'clearRect', args }),
    beginPath: () => calls.push({ method: 'beginPath', args: [] }),
    arc: (...args: number[]) => calls.push({ method: 'arc', args }),
    fill: () => calls.push({ method: 'fill', args: [] }),
  } as unknown as CanvasRenderingContext2D
  return {
    ctx,
    calls,
    values,
    clearRects: () => calls.filter((call) => call.method === 'clearRect'),
    fills: () => calls.filter((call) => call.method === 'fill'),
  }
}

describe('countFor', () => {
  it('scales with viewport area', () => {
    const small = countFor(480, 640)
    const large = countFor(1920, 1080)
    expect(large).toBeGreaterThan(small)
  })

  it('never exceeds the hard cap, however large the screen', () => {
    expect(countFor(10000, 10000)).toBe(PARTICLE_MAX)
    expect(PARTICLE_MAX).toBe(90)
    // The point of the cap: area stops mattering past it, so a large screen is
    // not slower than a small one.
    expect(countFor(2000, 2000) - countFor(4000, 4000)).toBe(0)
  })

  it('never drops below the floor, so a phone still gets a background', () => {
    expect(countFor(1, 1)).toBe(PARTICLE_MIN)
    expect(countFor(0, 0)).toBe(PARTICLE_MIN)
    expect(countFor(-5, 10)).toBe(PARTICLE_MIN)
    // Area scaling takes over just above the floor: a 390x844 phone asks for 18.
    const phone = countFor(390, 844)
    expect(phone).toBeGreaterThanOrEqual(PARTICLE_MIN)
    expect(phone).toBeLessThan(PARTICLE_MAX)
    expect(phone).toBe(Math.floor((390 * 844) / PARTICLE_AREA))
  })

  it('is monotone in size', () => {
    let previous = 0
    for (let width = 320; width <= 3840; width += 160) {
      const count = countFor(width, 900)
      expect(count).toBeGreaterThanOrEqual(previous)
      previous = count
    }
  })

  it('lands mid-scale on a typical laptop', () => {
    expect(countFor(1280, 800)).toBe(Math.floor((1280 * 800) / PARTICLE_AREA))
    expect(countFor(1280, 800)).toBeGreaterThan(PARTICLE_MIN)
    expect(countFor(1280, 800)).toBeLessThan(PARTICLE_MAX)
  })
})

describe('dprFor', () => {
  it('caps the backing store at 2', () => {
    expect(dprFor(3)).toBe(MAX_DPR)
    expect(dprFor(4)).toBe(MAX_DPR)
    expect(MAX_DPR).toBe(2)
  })

  it('passes a sensible ratio through, and never returns less than 1', () => {
    expect(dprFor(1)).toBe(1)
    expect(dprFor(1.5)).toBe(1.5)
    expect(dprFor(2)).toBe(2)
    expect(dprFor(0)).toBe(1)
    expect(dprFor(-1)).toBe(1)
    expect(dprFor(undefined)).toBe(1)
  })
})

describe('createField', () => {
  it('creates exactly the requested number of particles', () => {
    expect(fieldOf().count).toBe(countFor(1280, 800))
    expect(createField(0, 100, 100, seeded(1)).count).toBe(0)
    expect(createField(2.7, 100, 100, seeded(1)).count).toBe(2)
    expect(createField(-3, 100, 100, seeded(1)).count).toBe(0)
  })

  it('starts every particle inside the viewport, with its paint box on it', () => {
    const width = 640
    const height = 480
    const field = createField(40, width, height, seeded(3))
    for (let i = 0; i < field.count; i++) {
      expect(field.x[i]).toBeGreaterThanOrEqual(0)
      expect(field.x[i]).toBeLessThanOrEqual(width)
      expect(field.y[i]).toBeGreaterThanOrEqual(0)
      expect(field.y[i]).toBeLessThanOrEqual(height)
      // Painting before anything moves must not smear the previous frame.
      expect(field.px[i]).toBe(field.x[i])
      expect(field.py[i]).toBe(field.y[i])
    }
  })

  it('gives every particle a speed, a size and an alpha factor in range', () => {
    // MIN_SPEED/MAX_SPEED are deliberately not exported: these bounds are the
    // spec (nothing frozen, nothing racing) rather than a call to a constant.
    const field = createField(60, 800, 600, seeded(11))
    for (let i = 0; i < field.count; i++) {
      expect(Math.abs(field.vx[i])).toBeGreaterThanOrEqual(3)
      expect(Math.abs(field.vx[i])).toBeLessThanOrEqual(12)
      expect(Math.abs(field.vy[i])).toBeGreaterThanOrEqual(3)
      expect(Math.abs(field.vy[i])).toBeLessThanOrEqual(12)
      expect(field.size[i]).toBeGreaterThanOrEqual(1.5)
      expect(field.size[i]).toBeLessThanOrEqual(3.5)
      expect(field.factor[i]).toBeGreaterThan(0)
      expect(field.factor[i]).toBeLessThanOrEqual(1)
    }
  })
})

describe('step', () => {
  it('moves every particle', () => {
    const field = fieldOf(800, 600)
    const before = Float32Array.from(field.x)
    step(field, 0.016, 800, 600)
    let moved = 0
    for (let i = 0; i < field.count; i++) if (field.x[i] !== before[i]) moved++
    expect(moved).toBe(field.count)
  })

  it('does nothing at dt 0', () => {
    const field = fieldOf()
    const before = Float32Array.from(field.x)
    step(field, 0, 1280, 800)
    expect(Array.from(field.x)).toEqual(Array.from(before))
  })

  it('clamps a stalled frame so a particle cannot teleport across the screen', () => {
    const field = createField(1, 1000, 1000, seeded(5))
    field.x[0] = 500
    step(field, 30, 1000, 1000)
    const distance = Math.abs(field.x[0] - 500)
    expect(distance).toBeLessThanOrEqual(12 * 0.05 + 0.001)
  })

  it('wraps at the edges instead of dying or accumulating off-screen', () => {
    const field = createField(2, 100, 100, seeded(9))
    field.vx[0] = 12
    field.x[0] = 100 + field.size[0] // exactly at the far bound
    step(field, 0.05, 100, 100)
    expect(field.x[0]).toBeLessThan(0)

    field.vy[1] = -12
    field.y[1] = 0 - field.size[1]
    step(field, 0.05, 100, 100)
    expect(field.y[1]).toBeGreaterThan(100)
  })
})

describe('paint', () => {
  it('clears only the small box each particle occupied, never the viewport', () => {
    const recorder = recordingContext()
    const field = fieldOf(1280, 800)
    paint(recorder.ctx, field, 'rgb(0 0 255)')

    const rects = recorder.clearRects()
    expect(rects).toHaveLength(field.count)
    for (const { args } of rects) {
      expect(args[2]).toBeLessThanOrEqual(5.5)
      expect(args[3]).toBeLessThanOrEqual(5.5)
      // A whole-viewport clear at DPR 2 is the cost this design avoids.
      expect(args[2] * args[3]).toBeLessThan(100)
    }
  })

  it('fills one circle per particle, with the accent colour', () => {
    const recorder = recordingContext()
    const field = fieldOf(640, 480)
    paint(recorder.ctx, field, 'rgb(29 78 216)')
    expect(recorder.ctx.fillStyle).toBe('rgb(29 78 216)')
    expect(recorder.fills()).toHaveLength(field.count)
  })

  it('applies the alpha budget per particle and restores globalAlpha', () => {
    const recorder = recordingContext()
    const field = fieldOf()
    paint(recorder.ctx, field, 'rgb(29 78 216)')
    expect(recorder.ctx.globalAlpha).toBe(1)
    for (let i = 0; i < field.count; i++) {
      const expected = PARTICLE_ALPHA * field.factor[i]
      expect(expected).toBeGreaterThan(0)
      expect(expected).toBeLessThanOrEqual(PARTICLE_ALPHA)
    }
    expect(PARTICLE_ALPHA).toBeLessThan(0.23)
  })

  it('clears the box the particle came from, then moves its paint box', () => {
    const recorder = recordingContext()
    const field = createField(1, 100, 100, seeded(4))
    const startX = field.px[0]
    const startY = field.py[0]
    field.x[0] = 40
    field.y[0] = 50
    paint(recorder.ctx, field, 'rgb(29 78 216)')
    // The clear targets where it *was*, or the frame before smears away.
    const [first] = recorder.clearRects()
    expect(first?.args[0]).toBe(startX - 1)
    expect(first?.args[1]).toBe(startY - 1)
    // And the box advances, so the next frame clears the right place.
    expect(field.px[0]).toBe(40)
    expect(field.py[0]).toBe(50)
  })

  it('allocates nothing in the frame path', () => {
    // The criterion is about the loop, so the guard reads the two functions it
    // runs in. A source-shape check is the only way to assert this without a
    // profiler: jsdom has no canvas, and object counts are not observable.
    const source = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), 'particles.ts'),
      'utf8',
    )
    for (const name of ['step', 'paint']) {
      const body = functionBody(source, name)
      for (const forbidden of [
        'new ',
        'Array.',
        'Object.',
        'JSON.',
        '.map(',
        '.filter(',
        '.reduce(',
        '.concat(',
        '.slice(',
        '.push(',
        '.flatMap(',
        'Math.random(',
      ]) {
        expect(
          body.includes(forbidden),
          `${name}() contains \`${forbidden}\` — it runs once per frame`,
        ).toBe(false)
      }
    }
  })
})

/** The statement body of `function <name>(`, matched by braces. */
function functionBody(source: string, name: string): string {
  const at = source.indexOf(`function ${name}(`)
  if (at < 0) throw new Error(`no function ${name}`)
  const open = source.indexOf('{', at)
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  throw new Error(`unbalanced braces in ${name}`)
}

describe('readAccent', () => {
  it('returns the trimmed token', () => {
    expect(readAccent({ getPropertyValue: () => '  #1d4ed8 \n' })).toBe('#1d4ed8')
  })

  it('falls back when the stylesheet did not apply', () => {
    expect(readAccent({ getPropertyValue: () => '' })).toBe(FALLBACK_COLOR)
    expect(readAccent({ getPropertyValue: () => '   ' })).toBe(FALLBACK_COLOR)
  })
})
