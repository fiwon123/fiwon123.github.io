import { describe, expect, it } from 'vitest'

import { clampIndex, positionLabel, step } from './lightbox'

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
