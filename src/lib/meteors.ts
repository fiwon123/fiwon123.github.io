import { PARTICLE_ALPHA } from './particles'

/** Keep the cap small so meteors feel sparse. */
export const METEOR_MAX = 14
export const METEOR_MIN = 6
const METEOR_AREA = 20000

export const PARTICLE_AREA = 20000 // unused in effect logic for count; but keep

const TRAIL_LEN = 0.22
const HEAD_SIZE_MIN = 2
const HEAD_SIZE_MAX = 4
const SPEED_MIN = 120 // px/s approx
const SPEED_MAX = 280

const TAU = Math.PI * 2

export interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  angle: number
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

function gutterForWidth(width: number) {
  return Math.max(80, Math.min(320, width * 0.22))
}

export function createField(count: number, width: number, height: number, r: Random = Math.random): MeteorField {
  const size = Math.max(0, Math.floor(count))
  const meteors: Meteor[] = []
  const gutter = gutterForWidth(width)
  for (let i = 0; i < size; i++) {
    meteors.push(spawn(meteors, i, width, height, gutter, r))
  }
  return { meteors, count: size }
}

function spawn(meteors: Meteor[], i: number, width: number, height: number, gutter: number, r: Random): Meteor {
  const fromLeft = r() < 0.5
  const x = fromLeft ? -40 - r() * gutter : width + 40 + r() * gutter
  const y = r() * (height * 0.3)
  const speed = between(r, SPEED_MIN, SPEED_MAX)
  const angle = fromLeft ? 0.3 + r() * 0.2 : Math.PI - (0.3 + r() * 0.2) // downward diagonal
  const vx = Math.cos(angle) * speed
  const vy = Math.sin(angle) * speed
  const maxLife = between(r, 0.9, 1.6)
  return {
    x,
    y,
    vx,
    vy,
    life: between(r, 0, maxLife),
    maxLife,
    size: between(r, HEAD_SIZE_MIN, HEAD_SIZE_MAX),
    angle,
  }
}

export function step(field: MeteorField, dt: number, width: number, height: number, r: Random = Math.random): void {
  const seconds = Math.min(Math.max(dt, 0), 0.05)
  const gutter = gutterForWidth(width)
  for (let i = 0; i < field.meteors.length; i++) {
    const m = field.meteors[i]
    m.life += seconds
    m.x += m.vx * seconds
    m.y += m.vy * seconds
    if (m.life > m.maxLife || m.x < -200 || m.x > width + 200 || m.y > height + 200) {
      field.meteors[i] = spawn(field.meteors, i, width, height, gutter, r)
    }
  }
}

export function paint(ctx: CanvasRenderingContext2D, field: MeteorField, color: string): void {
  for (let i = 0; i < field.meteors.length; i++) {
    const m = field.meteors[i]
    const t = Math.max(0, 1 - m.life / m.maxLife)
    const headX = m.x
    const headY = m.y
    const tailX = headX - m.vx * TRAIL_LEN
    const tailY = headY - m.vy * TRAIL_LEN
    const grad = ctx.createLinearGradient(tailX, tailY, headX, headY)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, color)
    ctx.strokeStyle = grad
    ctx.lineWidth = m.size
    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(headX, headY)
    ctx.stroke()
    ctx.fillStyle = color
    ctx.globalAlpha = PARTICLE_ALPHA * (0.8 + t * 0.4)
    ctx.beginPath()
    ctx.arc(headX, headY, m.size * 0.6, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
