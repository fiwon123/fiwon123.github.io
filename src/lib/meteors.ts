/** Fallback when the accent token cannot be read (e.g. no stylesheet applied). */
export const FALLBACK_COLOR = 'rgb(128 128 128)'

/** A canvas backing store at DPR 4 is fill cost, not crispness. */
export const MAX_DPR = 2

/** Strongest a trail may draw: the accent at this alpha (tokens.test.ts caps it). */
export const PARTICLE_ALPHA = 0.2

/** Hard cap: a large screen must not cost more than a small one. */
export const METEOR_MAX = 14

/** Floor, so a small window still shows a few trails rather than none. */
export const METEOR_MIN = 6

/** One trail per this many CSS pixels of area, before the cap. */
export const METEOR_AREA = 20000

/** Fraction of a life spent fading in at birth, and fading out to zero at death. */
export const FADE_IN = 0.15
export const FADE_OUT = 0.4

/** How far outside the viewport a trail is born (px), before the gutter offset. */
export const SPAWN_MARGIN = 40

/** How far past the viewport a trail may drift before it is recycled (px). */
export const DESPAWN_MARGIN = 200

/** The gutter band a trail's outside offset is drawn from, clamped (px). */
export const GUTTER_MIN = 80
export const GUTTER_MAX = 320
export const GUTTER_RATIO = 0.22

/** Fraction of the height a trail is born within, so trails lean in from the top. */
export const SPAWN_BAND = 0.3

/** Angle range (rad) off the horizontal, so a sideways trail still drifts inward. */
export const TILT_MIN = 0.3
export const TILT_MAX = 0.5

/** Speed range (px/s). */
export const SPEED_MIN = 120
export const SPEED_MAX = 280

/** Stroke width range (px). */
export const LINE_WIDTH_MIN = 2
export const LINE_WIDTH_MAX = 4

/** Trail length as a fraction of the distance covered in a second. */
export const TRAIL_LEN = 0.22

/** Lifetime range (s): long enough to cross the gutter and fade out on its own. */
export const LIFE_MIN = 1.2
export const LIFE_MAX = 2.6

/** The device pixel ratio, capped at `MAX_DPR` (never 0/NaN, at least 1). */
export function dprFor(d: number | undefined): number {
  const dpr = typeof d === 'number' && d > 0 ? d : 1
  return Math.min(MAX_DPR, dpr)
}

/**
 * Read the page accent, falling back when the token is absent or blank. The
 * trails sit on the page itself, so they take the same accent as the rest of the
 * page and change with the reading.
 */
export function readAccent(style: CSSStyleDeclaration): string {
  const raw = style.getPropertyValue('--color-accent').trim()
  return raw.length > 0 ? raw : FALLBACK_COLOR
}

/**
 * The lifecycle alpha, as a fraction of `PARTICLE_ALPHA`: ramps up over the first
 * `FADE_IN` of the life (so a birth is a fade, not a pop), holds at 1, then falls
 * to 0 over the last `FADE_OUT` (so a death follows the streak to its end). The
 * peak is exactly 1, which is why `PARTICLE_ALPHA` is the true drawn maximum the
 * contrast gate caps.
 */
export function alphaAt(life: number, maxLife: number): number {
  if (!(maxLife > 0)) return 0
  const t = Math.min(1, Math.max(0, life / maxLife))
  const rise = Math.min(1, t / FADE_IN)
  const fall = Math.min(1, (1 - t) / FADE_OUT)
  return Math.max(0, Math.min(rise, fall))
}

export interface Meteor {
  x: number
  y: number
  /** Constant velocity (px/s); the tail trails the point straight back along it. */
  vx: number
  vy: number
  /** Constant heading (rad). Present so a test can reason about the direction. */
  angle: number
  /** Stroke width (px). */
  size: number
  life: number
  maxLife: number
}

export interface MeteorField {
  readonly meteors: Meteor[]
  readonly count: number
}

export type Random = () => number

function between(r: Random, lo: number, hi: number) {
  return lo + r() * (hi - lo)
}

export function countFor(width: number, height: number): number {
  const area = Math.max(0, width) * Math.max(0, height)
  const c = Math.floor(area / METEOR_AREA)
  return Math.min(METEOR_MAX, Math.max(METEOR_MIN, c))
}

/** The gutter band width for a viewport: where a trail's outside offset is drawn. */
export function gutterForWidth(width: number): number {
  return Math.max(GUTTER_MIN, Math.min(GUTTER_MAX, width * GUTTER_RATIO))
}

export function createField(
  count: number,
  width: number,
  height: number,
  r: Random = Math.random,
): MeteorField {
  const size = Math.max(0, Math.floor(count))
  const meteors: Meteor[] = []
  for (let i = 0; i < size; i++) {
    meteors.push(spawn(width, height, r))
  }
  return { meteors, count: size }
}

/**
 * Birth a trail in the left or right gutter, aimed inward and downward so it
 * drifts across the frame. Straight and sparse — the path is a constant-velocity
 * line, so there is no `turn` and no `SPREAD`.
 */
export function spawn(width: number, height: number, r: Random): Meteor {
  const fromLeft = r() < 0.5
  const gutter = gutterForWidth(width)
  const offset = SPAWN_MARGIN + r() * gutter
  const x = fromLeft ? -offset : width + offset
  const y = r() * (height * SPAWN_BAND)
  const speed = between(r, SPEED_MIN, SPEED_MAX)
  const tilt = between(r, TILT_MIN, TILT_MAX)
  const angle = fromLeft ? tilt : Math.PI - tilt
  const vx = Math.cos(angle) * speed
  const vy = Math.sin(angle) * speed
  const maxLife = between(r, LIFE_MIN, LIFE_MAX)
  return {
    x,
    y,
    vx,
    vy,
    angle,
    size: between(r, LINE_WIDTH_MIN, LINE_WIDTH_MAX),
    // Start part-way through the life so the first frame is already a field,
    // not a synchronised fade-in of every trail at once.
    life: between(r, 0, maxLife * 0.9),
    maxLife,
  }
}

export function step(
  field: MeteorField,
  dt: number,
  width: number,
  height: number,
  r: Random = Math.random,
): void {
  const seconds = Math.min(Math.max(dt, 0), 0.05)
  for (let i = 0; i < field.meteors.length; i++) {
    const m = field.meteors[i]
    m.life += seconds
    m.x += m.vx * seconds
    m.y += m.vy * seconds
    const gone =
      m.x < -DESPAWN_MARGIN ||
      m.x > width + DESPAWN_MARGIN ||
      m.y < -DESPAWN_MARGIN ||
      m.y > height + DESPAWN_MARGIN
    if (m.life > m.maxLife || gone) {
      field.meteors[i] = spawn(width, height, r)
    }
  }
}

export function paint(
  ctx: CanvasRenderingContext2D,
  field: MeteorField,
  color: string,
  width: number,
  height: number,
): void {
  // Clear the previous frame before drawing this one. Without it every trail
  // leaves a permanent streak.
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = color
  for (let i = 0; i < field.meteors.length; i++) {
    const m = field.meteors[i]
    const tailX = m.x - m.vx * TRAIL_LEN
    const tailY = m.y - m.vy * TRAIL_LEN

    // One clean straight streak: a uniform stroke from tail to head, with no
    // round head and no gradient bulge — a line, not a tadpole.
    ctx.globalAlpha = PARTICLE_ALPHA * alphaAt(m.life, m.maxLife)
    ctx.lineWidth = m.size
    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(m.x, m.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
