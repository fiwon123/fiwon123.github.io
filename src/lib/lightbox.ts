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

/**
 * The subset of a DOM rect the shared-element zoom needs. Kept structural (not
 * `DOMRect`) so the maths is testable with plain objects — jsdom has no layout,
 * so `getBoundingClientRect()` is all zeros and can never exercise this.
 */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** The transform that places a target element over an origin rect. */
export interface ZoomTransform {
  translateX: number
  translateY: number
  scaleX: number
  scaleY: number
}

/** How long the close fade lasts (ms); the component's unmount timer matches it. */
export const CLOSE_MS = 180

/**
 * The FLIP transform that draws `target` where `origin` is, about their centres:
 * a translate of the centre delta plus a non-uniform scale. Applying it as the
 * element's opening transform makes the image grow out of the thumbnail, then
 * clearing it settles the image into place.
 *
 * Returns `null` when the target has no size to scale from (jsdom, or a hidden
 * element) — there is nothing to animate, so the caller should just show it.
 */
export function zoomTransform(origin: Rect, target: Rect): ZoomTransform | null {
  if (!(target.width > 0) || !(target.height > 0)) return null
  return {
    translateX: origin.x + origin.width / 2 - (target.x + target.width / 2),
    translateY: origin.y + origin.height / 2 - (target.y + target.height / 2),
    scaleX: origin.width / target.width,
    scaleY: origin.height / target.height,
  }
}

/** The `transform` value for a zoom transform, e.g. `translate(4px, 9px) scale(0.2, 0.2)`. */
export function zoomTransformCss(transform: ZoomTransform): string {
  const { translateX, translateY, scaleX, scaleY } = transform
  return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`
}
