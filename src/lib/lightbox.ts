/**
 * Pure navigation helpers for the image lightbox.
 *
 * Deliberately free of DOM access: the wrap-around behaviour is the part that is
 * easy to get wrong and impossible to eyeball, so it lives here where it can be
 * tested directly.
 */

export type StepDirection = 'next' | 'previous'

const OFFSET: Record<StepDirection, number> = { next: 1, previous: -1 }

/**
 * The index `direction` steps away, wrapping at both ends.
 *
 * Wrapping is intentional: the lightbox replaces a gallery of thumbnails, where
 * the alternative — a dead arrow button at each end — reads as a broken control.
 * Returns `null` when there is nothing to show.
 */
export function step(index: number, length: number, direction: StepDirection): number | null {
  if (length <= 0) return null
  return (clampIndex(index, length) + OFFSET[direction] + length) % length
}

/** Clamp an index into `[0, length)`, or `0` when the list is empty. */
export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  // NaN has no direction to clamp towards, so it takes the first image.
  if (Number.isNaN(index)) return 0
  if (index < 0) return 0
  if (index >= length) return length - 1
  return Math.trunc(index)
}

/** The 1-based position of `index`, e.g. `3 / 12`. Empty when the list is empty. */
export function positionLabel(index: number, length: number): string {
  if (length <= 0) return ''
  return `${clampIndex(index, length) + 1} / ${length}`
}
