/**
 * The particle field: pure, canvas-free, and allocation-free once created.
 *
 * Every rule in #18 that can be checked without a browser lives here, so the
 * component above it is only plumbing (rAF, visibility, theme, sizing):
 *
 * - count scales with viewport area under `PARTICLE_MAX`;
 * - the device pixel ratio is capped at `MAX_DPR`;
 * - `step` and `paint` allocate nothing: the field is typed arrays created once,
 *   and paint clears only the small box each particle occupied instead of the
 *   whole viewport (clearing a 4K surface at DPR 2 is ~33M pixels per frame).
 */

/** Hard cap: a large screen must not cost more than a small one. */
export const PARTICLE_MAX = 90

/** Floor, so a phone still shows a background rather than one stray dot. */
export const PARTICLE_MIN = 16

/** One particle per this many CSS pixels of area, before the cap. */
export const PARTICLE_AREA = 18000

/** A canvas backing store at DPR 4 on a laptop is fill cost, not crispness. */
export const MAX_DPR = 2

/**
 * The strongest a particle may draw: the accent at this alpha over `--color-bg`.
 *
 * Measured across the six palettes, AA (4.5:1 for `--color-fg` *and*
 * `--color-fg-muted` against the blended background) survives up to alpha 0.230
 * — the worst case, paper/light; the others allow 0.288–0.402. 0.16 leaves
 * headroom for a future palette, and `tokens.test.ts` recomputes the worst case
 * per preset, so this constant cannot be raised in isolation.
 */
export const PARTICLE_ALPHA = 0.16

/** Used only when the tokens are unreadable (no stylesheet applied). */
export const FALLBACK_COLOR = 'rgb(128 128 128)'

/** Brightest speed component, px/s: ambient drift, not a starfield. */
const MAX_SPEED = 12
/** Slowest speed component, px/s: nothing may appear frozen. */
const MIN_SPEED = 3

const SIZE_MIN = 1.5
const SIZE_MAX = 3.5

/** Alpha variation per particle, as a fraction of PARTICLE_ALPHA. */
const FACTOR_MIN = 0.45
const FACTOR_MAX = 1

const TAU = Math.PI * 2

export interface ParticleField {
  readonly x: Float32Array
  readonly y: Float32Array
  readonly vx: Float32Array
  readonly vy: Float32Array
  readonly size: Float32Array
  readonly factor: Float32Array
  /** Where paint put the particle last frame; paint clears this box first. */
  readonly px: Float32Array
  readonly py: Float32Array
  readonly count: number
}

export type Random = () => number

/** Particles per viewport, scaling with area and never exceeding the cap. */
export function countFor(width: number, height: number): number {
  const area = Math.max(0, width) * Math.max(0, height)
  const count = Math.floor(area / PARTICLE_AREA)
  return Math.min(PARTICLE_MAX, Math.max(PARTICLE_MIN, count))
}

/** The canvas scale: capped, and never less than 1. */
export function dprFor(devicePixelRatio: number | undefined): number {
  const dpr = typeof devicePixelRatio === 'number' && devicePixelRatio > 0 ? devicePixelRatio : 1
  return Math.min(MAX_DPR, dpr)
}

function between(random: Random, low: number, high: number): number {
  return low + random() * (high - low)
}

/** A speed component with magnitude in [MIN_SPEED, MAX_SPEED]. */
function speed(random: Random): number {
  const sign = random() < 0.5 ? -1 : 1
  return sign * between(random, MIN_SPEED, MAX_SPEED)
}

/** Allocate the field. Called on mount and on resize — never per frame. */
export function createField(
  count: number,
  width: number,
  height: number,
  random: Random = Math.random,
): ParticleField {
  const size = Math.max(0, Math.floor(count))
  const field: ParticleField = {
    x: new Float32Array(size),
    y: new Float32Array(size),
    vx: new Float32Array(size),
    vy: new Float32Array(size),
    size: new Float32Array(size),
    factor: new Float32Array(size),
    px: new Float32Array(size),
    py: new Float32Array(size),
    count: size,
  }

  for (let i = 0; i < size; i++) {
    const x = between(random, 0, width)
    const y = between(random, 0, height)
    field.x[i] = x
    field.y[i] = y
    // Painted at the same spot on the first frame, so nothing is left behind
    // from a previous size.
    field.px[i] = x
    field.py[i] = y
    field.vx[i] = speed(random)
    field.vy[i] = speed(random)
    field.size[i] = between(random, SIZE_MIN, SIZE_MAX)
    field.factor[i] = between(random, FACTOR_MIN, FACTOR_MAX)
  }
  return field
}

/**
 * Advance the field in place. `dt` is seconds and is clamped, so a stall
 * (throttled tab, long task) cannot teleport a particle across the screen.
 * Particles wrap at the edges: no respawn, no allocation, no state beyond the
 * arrays.
 */
export function step(field: ParticleField, dt: number, width: number, height: number): void {
  const seconds = Math.min(Math.max(dt, 0), 0.05)
  for (let i = 0; i < field.count; i++) {
    const size = field.size[i]
    let x = field.x[i] + field.vx[i] * seconds
    let y = field.y[i] + field.vy[i] * seconds
    if (x < -size) x = width + size
    else if (x > width + size) x = -size
    if (y < -size) y = height + size
    else if (y > height + size) y = -size
    field.x[i] = x
    field.y[i] = y
  }
}

/**
 * Draw the frame. Clears only the box the particle occupied last frame —
 * `clearRect` over the whole viewport would dominate the cost at high DPR —
 * then fills the circle. No allocation in the loop: `fillStyle` is set once,
 * `globalAlpha` is written, and the previous position is copied over.
 */
export function paint(ctx: CanvasRenderingContext2D, field: ParticleField, color: string): void {
  ctx.fillStyle = color
  for (let i = 0; i < field.count; i++) {
    const size = field.size[i]
    const clear = size + 2
    ctx.clearRect(field.px[i] - 1, field.py[i] - 1, clear, clear)
    ctx.globalAlpha = PARTICLE_ALPHA * field.factor[i]
    ctx.beginPath()
    ctx.arc(field.x[i], field.y[i], size / 2, 0, TAU)
    ctx.fill()
    field.px[i] = field.x[i]
    field.py[i] = field.y[i]
  }
  ctx.globalAlpha = 1
}

export interface ColorSource {
  getPropertyValue: (name: string) => string
}

/**
 * The accent token, trimmed and validated — an unreadable value falls back
 * rather than silently producing an invisible or malformed fillStyle.
 */
export function readAccent(source: ColorSource): string {
  const raw = source.getPropertyValue('--color-accent').trim()
  return raw.length > 0 ? raw : FALLBACK_COLOR
}
