import { describe, expect, it } from 'vitest'

import {
  clampIndex,
  positionLabel,
  step,
  zoomTransform,
  zoomTransformCss,
  type Rect,
} from './lightbox'

describe('step', () => {
  it('walks forward and wraps at the end', () => {
    expect(step(0, 3, 'next')).toBe(1)
    expect(step(1, 3, 'next')).toBe(2)
    expect(step(2, 3, 'next')).toBe(0)
  })

  it('walks backward and wraps at the start', () => {
    expect(step(2, 3, 'previous')).toBe(1)
    expect(step(1, 3, 'previous')).toBe(0)
    expect(step(0, 3, 'previous')).toBe(2)
  })

  it('stays put in a single-image gallery', () => {
    expect(step(0, 1, 'next')).toBe(0)
    expect(step(0, 1, 'previous')).toBe(0)
  })

  it('returns null when there is nothing to show', () => {
    expect(step(0, 0, 'next')).toBeNull()
    expect(step(0, 0, 'previous')).toBeNull()
  })

  it('recovers from an out-of-range index', () => {
    // Out of range clamps to the nearest end first, and only then steps.
    expect(step(99, 3, 'next')).toBe(0)
    expect(step(-4, 3, 'previous')).toBe(2)
  })
})

describe('clampIndex', () => {
  it('leaves an in-range index alone', () => {
    expect(clampIndex(0, 3)).toBe(0)
    expect(clampIndex(2, 3)).toBe(2)
  })

  it('clamps both ends and an empty list', () => {
    expect(clampIndex(-1, 3)).toBe(0)
    expect(clampIndex(7, 3)).toBe(2)
    expect(clampIndex(4, 0)).toBe(0)
  })

  it('never returns a fractional index', () => {
    expect(clampIndex(1.7, 3)).toBe(1)
  })

  it('treats NaN as "no direction" and infinity as "past the end"', () => {
    expect(clampIndex(Number.NaN, 3)).toBe(0)
    expect(clampIndex(Number.POSITIVE_INFINITY, 3)).toBe(2)
    expect(clampIndex(Number.NEGATIVE_INFINITY, 3)).toBe(0)
  })
})

describe('positionLabel', () => {
  it('is 1-based', () => {
    expect(positionLabel(0, 12)).toBe('1 / 12')
    expect(positionLabel(11, 12)).toBe('12 / 12')
  })

  it('is empty for an empty gallery', () => {
    expect(positionLabel(0, 0)).toBe('')
  })
})

/** A rect from its top-left corner and size, for readability. */
const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
})

describe('zoomTransform', () => {
  it('lines the target up over the origin about their centres', () => {
    // Target centred at (600, 400), 400x300; origin centred at (100, 120), 80x60.
    const z = zoomTransform(rect(60, 90, 80, 60), rect(400, 250, 400, 300))
    expect(z).not.toBeNull()
    // translate moves the target centre (600,400) onto the origin centre (100,120).
    expect(z!.translateX).toBe(100 - 600)
    expect(z!.translateY).toBe(120 - 400)
    // scale shrinks the target to the origin's size.
    expect(z!.scaleX).toBeCloseTo(80 / 400, 10)
    expect(z!.scaleY).toBeCloseTo(60 / 300, 10)
  })

  it('is identity when the origin and target are the same rect', () => {
    const z = zoomTransform(rect(10, 20, 200, 120), rect(10, 20, 200, 120))!
    expect(z.translateX).toBe(0)
    expect(z.translateY).toBe(0)
    expect(z.scaleX).toBe(1)
    expect(z.scaleY).toBe(1)
  })

  it('keeps the same aspect ratio when origin and target share one', () => {
    // The real case: the thumbnail keeps the image's aspect, so the scale is uniform.
    const z = zoomTransform(rect(0, 0, 100, 50), rect(0, 0, 800, 400))!
    expect(z.scaleX).toBe(z.scaleY)
  })

  it('returns null when the target has no size to animate from', () => {
    // jsdom reports every rect as 0x0; there is nothing to scale toward.
    expect(zoomTransform(rect(0, 0, 100, 50), rect(0, 0, 0, 0))).toBeNull()
    expect(zoomTransform(rect(0, 0, 100, 50), rect(0, 0, 100, 0))).toBeNull()
    expect(zoomTransform(rect(0, 0, 100, 50), rect(0, 0, 0, 50))).toBeNull()
  })

  it('still maps a zero-sized origin (a collapsed thumbnail) onto the target', () => {
    const z = zoomTransform(rect(50, 50, 0, 0), rect(0, 0, 200, 200))
    expect(z).not.toBeNull()
    expect(z!.scaleX).toBe(0)
    expect(z!.scaleY).toBe(0)
  })
})

describe('zoomTransformCss', () => {
  it('renders the transform as a translate and a scale', () => {
    expect(zoomTransformCss({ translateX: 4, translateY: -9.5, scaleX: 0.25, scaleY: 0.5 })).toBe(
      'translate(4px, -9.5px) scale(0.25, 0.5)',
    )
  })
})
