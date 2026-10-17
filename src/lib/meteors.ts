/** Fallback when the accent token cannot be read (e.g. no stylesheet applied). */
export const FALLBACK_COLOR = 'rgb(128 128 128)'

/** A canvas backing store at DPR 4 is fill cost, not crispness. */
export const MAX_DPR = 2

/** Strongest a particle may draw: the accent at this alpha (tokens.test.ts caps it). */
export const PARTICLE_ALPHA = 0.2

/** Hard cap: a large screen must not cost more than a small one. */
export const METEOR_MAX = 80

/** Floor, so a small window still shows a field rather than a handful. */
export const METEOR_MIN = 24

/** One particle per this many CSS pixels of area, before the cap. */
export const METEOR_AREA = 12000

/** Fraction of a life spent fading in at birth, and fading out to zero at death. */
export const FADE_IN = 0.15
export const FADE_OUT = 0.4

/** How far outside the viewport a particle is born (px). */
export const SPAWN_MARGIN = 48

/** How far past the viewport a traveller may drift before it is recycled (px). */
export const DESPAWN_MARGIN = 160

/** Speed range (px/s). */
export const SPEED_MIN = 30
export const SPEED_MAX = 130

/** Head radius range (px). */
export const HEAD_SIZE_MIN = 1.5
export const HEAD_SIZE_MAX = 4.5

/** Trail length as a fraction of the distance covered in a second. */
export const TRAIL_MIN = 0.3
export const TRAIL_MAX = 0.9

/** Heading drift (rad/s): the gentle curve, signed per particle. */
export const TURN_MIN = 0.1
export const TURN_MAX = 0.5

/** Lifetime range (s): long enough to cross the viewport and fade out naturally. */
export const LIFE_MIN = 4
export const LIFE_MAX = 9

/** Spread around the inward heading a particle takes off the edge (rad). */
export const SPREAD = 0.7

/** Edges a particle can be born from: left, top, right, bottom. */
export const EDGES = ['left', 'top', 'right', 'bottom'] as const
export type Edge = (typeof EDGES)[number]

const TAU = Math.PI * 2

/** The device pixel ratio, capped at `MAX_DPR` (never 0/NaN, at least 1). */
export function dprFor(d: number | undefined): number {
  const dpr = typeof d === 'number' && d > 0 ? d : 1
  return Math.min(MAX_DPR, dpr)
}

/**
 * Read the page accent, falling back when the token is absent or blank. The
 * particles now sit on the page itself (the #101 chrome frame is gone), so they
 * take the same accent the rest of the page uses.
 */
export function readAccent(style: CSSStyleDeclaration): string {
  const raw = style.getPropertyValue('--color-accent').trim()
  return raw.length > 0 ? raw : FALLBACK_COLOR
}

/**
 * The lifecycle alpha, as a fraction of `PARTICLE_ALPHA`: ramps up over the first
 * `FADE_IN` of the life (so a birth is a fade, not a pop), holds at 1, then falls
 * to 0 over the last `FADE_OUT` (so a death follows the path to its end). The peak
 * is exactly 1, which is why `PARTICLE_ALPHA` is the true drawn maximum the
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
  /** Heading in radians; advanced by `turn` every step, so the path curves. */
  angle: number
  speed: number
  /** Signed heading drift (rad/s). */
  turn: number
  /** Trail length as a fraction of a second's travel. */
  trail: number
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
 * Birth a particle just outside a random edge, aimed into the viewport. Picking
 * the edge first (rather than the old left/right gutter) is what fills the field
 * from every direction.
 */
export function spawn(width: number, height: number, r: Random): Meteor {
  const edge = EDGES[Math.min(EDGES.length - 1, Math.floor(r() * EDGES.length))]
  const speed = between(r, SPEED_MIN, SPEED_MAX)
  const maxLife = between(r, LIFE_MIN, LIFE_MAX)
  const size = between(r, HEAD_SIZE_MIN, HEAD_SIZE_MAX)
  const trail = between(r, TRAIL_MIN, TRAIL_MAX)
  const turn = between(r, TURN_MIN, TURN_MAX) * (r() < 0.5 ? -1 : 1)

  let x: number
  let y: number
  let inward: number
  if (edge === 'left') {
    x = -SPAWN_MARGIN
    y = r() * height
    inward = 0 // heading right
  } else if (edge === 'top') {
    x = r() * width
    y = -SPAWN_MARGIN
    inward = Math.PI / 2 // heading down
  } else if (edge === 'right') {
    x = width + SPAWN_MARGIN
    y = r() * height
    inward = Math.PI // heading left
  } else {
    x = r() * width
    y = height + SPAWN_MARGIN
    inward = -Math.PI / 2 // heading up
  }

  const angle = inward + between(r, -SPREAD, SPREAD)
  return {
    x,
    y,
    angle,
    speed,
    turn,
    trail,
    size,
    // Start part-way through the life so the first frame is already a field,
    // not a synchronised fade-in of every particle at once.
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
    m.angle += m.turn * seconds
    m.x += Math.cos(m.angle) * m.speed * seconds
    m.y += Math.sin(m.angle) * m.speed * seconds
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
  // Clear the previous frame before drawing this one. Without it every particle
  // leaves a permanent streak.
  ctx.clearRect(0, 0, width, height)
  for (let i = 0; i < field.meteors.length; i++) {
    const m = field.meteors[i]
    const ux = Math.cos(m.angle)
    const uy = Math.sin(m.angle)
    const len = m.speed * m.trail
    const headX = m.x
    const headY = m.y
    const tailX = headX - ux * len
    const tailY = headY - uy * len
    // Bend the trail with the heading: a shallow quadratic whose control point
    // sits on the normal, offset by the arc the turn would sweep. Keeps the path
    // curved without storing a position history per particle.
    const theta = m.turn * m.trail
    const off = (len / 2) * Math.tan(theta / 4)
    const midX = (headX + tailX) / 2 - uy * off
    const midY = (headY + tailY) / 2 + ux * off

    const grad = ctx.createLinearGradient(tailX, tailY, headX, headY)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, color)
    ctx.globalAlpha = PARTICLE_ALPHA * alphaAt(m.life, m.maxLife)
    ctx.strokeStyle = grad
    ctx.lineWidth = m.size
    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.quadraticCurveTo(midX, midY, headX, headY)
    ctx.stroke()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(headX, headY, m.size * 0.6, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
