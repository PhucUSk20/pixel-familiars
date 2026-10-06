// Articulation is measured on the user's 128px sprite; source colors are preserved.
export const GROUDON_ACTIONS = ['walk', 'sleep', 'roar', 'blades', 'burst', 'eruption'] as const
export type GroudonAction = typeof GROUDON_ACTIONS[number] | 'original'
export const GROUDON_DURATION: Record<GroudonAction, number> = { original: 8000, walk: 6500, sleep: 8500, roar: 5000, blades: 7000, burst: 6500, eruption: 6500 }
export const GROUDON_WIDTH = 256, GROUDON_HEIGHT = 192, GROUDON_TRANSITION = 1100
type Point = { x: number; y: number }
export type GroudonPose = { x: number; y: number; angle: number; squash: number; head: number; jaw: number; leftArm: number; rightArm: number; leftLeg: number; rightLeg: number; leftLift: number; rightLift: number; tail: number; eyes: number; glow: number }
const scalarKeys = ['x', 'y', 'angle', 'squash', 'head', 'jaw', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'leftLift', 'rightLift', 'tail', 'eyes', 'glow'] as const
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t) }
const envelope = (p: number, start: number, peak: number, end: number) => p < peak ? smooth((p - start) / (peak - start)) : 1 - smooth((p - peak) / (end - peak))
const base = (): GroudonPose => ({ x: 0, y: 0, angle: 0, squash: 1, head: 0, jaw: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0, leftLift: 0, rightLift: 0, tail: 0, eyes: 0, glow: 0 })
export function groudonPose(action: GroudonAction, ms: number): GroudonPose {
  const p = base(), t = ms / 1000, phase = ms / GROUDON_DURATION[action]
  if (action === 'original') return p
  const breath = Math.sin(t * 1.8)
  p.squash = 1 + breath * .008; p.tail = Math.sin(t * 1.25 - .6) * .035
  if (action === 'walk') {
    const gait = t * 4.2, stride = Math.sin(gait)
    p.x = Math.sin(phase * Math.PI * 2) * 15
    p.leftLeg = stride * .15; p.rightLeg = -stride * .15
    p.leftLift = Math.max(0, stride) * 5; p.rightLift = Math.max(0, -stride) * 5
    p.leftArm = -stride * .13; p.rightArm = stride * .13
    p.y = -Math.abs(Math.cos(gait)) * 1.6; p.angle = stride * .014
    p.head = Math.sin(gait - .5) * .035; p.tail = Math.sin(gait - 1.3) * .13
  } else if (action === 'sleep') {
    p.squash = .85 + breath * .01; p.y = 3; p.head = -.15; p.eyes = 1
    p.leftArm = -.25; p.rightArm = .21; p.leftLeg = -.08; p.rightLeg = .08
    p.tail = -.16 + Math.sin(t * .8) * .015
  } else if (action === 'roar') {
    const lift = envelope(phase, .04, .25, .86)
    p.head = .24 * lift; p.jaw = .43 * lift; p.angle = .045 * lift
    p.leftArm = .18 * lift; p.rightArm = -.22 * lift
    p.tail = -.1 * lift; p.glow = lift * .6
    p.x = Math.sin(t * 24) * lift * .8; p.squash = 1 + lift * .025
  } else if (action === 'blades') {
    const gather = envelope(phase, .02, .22, .39), slam = envelope(phase, .28, .37, .65)
    p.leftArm = .38 * gather - .22 * slam; p.rightArm = -.32 * gather + .2 * slam
    p.head = -.1 * gather + .12 * slam; p.y = -2 * gather + 3 * slam
    p.squash = 1 - .035 * gather - .065 * slam; p.tail = .12 * gather - .09 * slam
    p.glow = Math.max(gather, slam); p.x = phase > .35 && phase < .8 ? Math.sin(t * 32) * .8 : 0
  } else if (action === 'burst') {
    const charge = envelope(phase, .03, .4, .9), recoil = envelope(phase, .44, .49, .67)
    p.head = .13 * charge; p.jaw = .32 * charge; p.angle = .025 * charge
    p.leftArm = .12 * charge; p.rightArm = -.17 * charge
    p.x = 7 * recoil; p.head -= .1 * recoil; p.tail = -.14 * recoil
    p.glow = charge; p.squash = 1 + .015 * charge
  } else {
    const build = envelope(phase, .03, .27, .87), release = envelope(phase, .28, .43, .81)
    p.head = .3 * build; p.jaw = .44 * build; p.angle = .06 * build
    p.leftArm = .25 * build; p.rightArm = -.28 * build; p.tail = -.16 * build
    p.squash = 1 + .035 * build; p.y = -2 * build
    p.x = Math.sin(t * 28) * release * .8; p.glow = build
  }
  return p
}
export class GroudonAnimator {
  action: GroudonAction = 'original'; elapsed = 0
  private from?: GroudonPose; private transition = GROUDON_TRANSITION
  pose(): GroudonPose {
    const target = groudonPose(this.action, this.elapsed)
    if (!this.from || !this.transitioning) return target
    const result = { ...target }, amount = smooth(this.transition / GROUDON_TRANSITION)
    for (const key of scalarKeys) result[key] = mix(this.from[key], target[key], amount)
    return result
  }
  select(action: GroudonAction): void { this.from = this.pose(); this.action = action; this.elapsed = 0; this.transition = 0 }
  advance(delta: number, auto: boolean): void {
    if (!Number.isFinite(delta) || delta < 0) return
    this.elapsed += delta; this.transition = Math.min(GROUDON_TRANSITION, this.transition + delta)
    if (this.action !== 'original' && this.elapsed >= GROUDON_DURATION[this.action]) this.select(auto ? GROUDON_ACTIONS[(GROUDON_ACTIONS.indexOf(this.action as typeof GROUDON_ACTIONS[number]) + 1) % GROUDON_ACTIONS.length] : this.action)
  }
  get transitioning(): boolean { return this.transition < GROUDON_TRANSITION }
}
const parts = [
  { pivot: { x: 51, y: 45 }, polygon: [[24, 25], [44, 23], [59, 39], [55, 45], [40, 54], [23, 49]] },
  { pivot: { x: 44, y: 46 }, polygon: [[25, 43], [37, 43], [46, 51], [37, 58], [25, 52]] },
  { pivot: { x: 46, y: 64 }, polygon: [[27, 62], [44, 59], [54, 70], [43, 80], [25, 77]] },
  { pivot: { x: 75, y: 64 }, polygon: [[67, 61], [81, 61], [85, 74], [72, 85], [59, 80]] },
  { pivot: { x: 46, y: 83 }, polygon: [[34, 82], [50, 80], [55, 91], [48, 103], [33, 101]] },
  { pivot: { x: 78, y: 84 }, polygon: [[68, 80], [83, 78], [91, 93], [88, 106], [72, 104]] },
  { pivot: { x: 83, y: 76 }, polygon: [[83, 49], [106, 45], [109, 64], [97, 86], [86, 92], [81, 76]] },
]
function coverage(p: Point, polygon: number[][]): number {
  let inside = false, distance = Infinity
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j], b = polygon[i], dx = b[0] - a[0], dy = b[1] - a[1]
    if ((a[1] > p.y) !== (b[1] > p.y) && p.x < dx * (p.y - a[1]) / dy + a[0]) inside = !inside
    const t = Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / (dx * dx + dy * dy)))
    distance = Math.min(distance, Math.hypot(p.x - a[0] - dx * t, p.y - a[1] - dy * t))
  }
  return smooth(.5 + (inside ? distance : -distance) / 4)
}
function rotate(p: Point, pivot: Point, angle: number): Point {
  const x = p.x - pivot.x, y = p.y - pivot.y
  return { x: pivot.x + x * Math.cos(angle) - y * Math.sin(angle), y: pivot.y + x * Math.sin(angle) + y * Math.cos(angle) }
}
type Binding = { point: Point; weights: number[] }
function bind(point: Point): Binding { return { point, weights: parts.map(part => coverage(point, part.polygon)) } }
function map(binding: Binding, pose: GroudonPose): Point {
  const point = binding.point, result = { ...point }
  const angles = [pose.head, -pose.jaw, pose.leftArm, pose.rightArm, pose.leftLeg, pose.rightLeg, pose.tail]
  for (let i = 0; i < parts.length; i++) {
    const weight = binding.weights[i]
    if (!weight) continue
    const moved = rotate(point, parts[i].pivot, angles[i])
    result.x += (moved.x - point.x) * weight
    result.y += (moved.y - point.y - (i === 4 ? pose.leftLift : i === 5 ? pose.rightLift : 0)) * weight
  }
  result.y = 102 + (result.y - 102) * pose.squash
  const tilted = rotate(result, { x: 66, y: 98 }, pose.angle)
  return { x: tilted.x + 100 + pose.x, y: tilted.y + 40 + pose.y }
}
export function groudonMouth(pose: GroudonPose): Point { return map(bind({ x: 31, y: 47 }), pose) }
export class GroudonTexture {
  private nodes: Binding[] = []
  constructor(private source: Uint8ClampedArray) {
    if (source.length !== 128 * 128 * 4) throw new Error('Primal Groudon requires a 128px RGBA frame')
    for (let y = 0; y <= 128; y += 2) for (let x = 0; x <= 128; x += 2) this.nodes.push(bind({ x, y }))
  }
  render(pose: GroudonPose): Uint8ClampedArray<ArrayBuffer> {
    const output = new Uint8ClampedArray(GROUDON_WIDTH * GROUDON_HEIGHT * 4), mapped = this.nodes.map(node => map(node, pose))
    const triangle = (ia: number, ib: number, ic: number) => {
      const a = mapped[ia], b = mapped[ib], c = mapped[ic], sa = this.nodes[ia].point, sb = this.nodes[ib].point, sc = this.nodes[ic].point
      const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
      if (Math.abs(d) < .01) return
      for (let y = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))); y <= Math.min(GROUDON_HEIGHT - 1, Math.ceil(Math.max(a.y, b.y, c.y))); y++) {
        for (let x = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))); x <= Math.min(GROUDON_WIDTH - 1, Math.ceil(Math.max(a.x, b.x, c.x))); x++) {
          const u = ((b.y - c.y) * (x + .5 - c.x) + (c.x - b.x) * (y + .5 - c.y)) / d
          const v = ((c.y - a.y) * (x + .5 - c.x) + (a.x - c.x) * (y + .5 - c.y)) / d, w = 1 - u - v
          if (Math.min(u, v, w) < -.001) continue
          const sx = Math.floor(u * sa.x + v * sb.x + w * sc.x), sy = Math.floor(u * sa.y + v * sb.y + w * sc.y)
          if (sx < 0 || sy < 0 || sx >= 128 || sy >= 128) continue
          const eyelid = pose.eyes > .7 && sx >= 34 && sx <= 39 && sy >= 37 && sy <= 40
          const sourceIndex = ((eyelid ? 41 : sy) * 128 + (eyelid ? 40 : sx)) * 4, destination = (y * GROUDON_WIDTH + x) * 4
          if (!this.source[sourceIndex + 3]) continue
          output[destination] = this.source[sourceIndex]; output[destination + 1] = this.source[sourceIndex + 1]
          output[destination + 2] = this.source[sourceIndex + 2]; output[destination + 3] = this.source[sourceIndex + 3]
        }
      }
    }
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const a = y * 65 + x; triangle(a, a + 1, a + 65); triangle(a + 1, a + 66, a + 65) }
    return output
  }
}
