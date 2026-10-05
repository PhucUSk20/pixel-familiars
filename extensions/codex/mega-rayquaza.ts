// Texture-preserving articulation of the supplied Mega Rayquaza artwork.
// Coordinates are measured on the original 128px sprite. No anatomy is redrawn.
export const MEGA_ACTIONS = ['fly', 'sleep', 'roar', 'pulse', 'dash'] as const
export type MegaAction = typeof MEGA_ACTIONS[number] | 'original'
export const MEGA_DURATION: Record<MegaAction, number> = { original: 8000, fly: 8000, sleep: 10000, roar: 5500, pulse: 6500, dash: 6000 }
export const MEGA_TRANSITION = 1200
export const MEGA_SIZE = 192
type P = { x: number; y: number }
type Binding = { point: P; weights: number[]; head: number; jaw: number; fin: number; ribbon: number; upperRibbon: number; arm: number }
export type MegaPose = { body: P[]; headX: number; headY: number; headAngle: number; jaw: number; fin: number; arm: number; ribbon: number; breath: number; angle: number; eyes: number; power: number; sleep: number }
const spine: P[] = [[63, 48], [66, 64], [62, 80], [64, 94], [74, 106], [88, 103], [93, 90], [85, 77], [88, 67], [105, 73], [116, 70]].map(([x, y]) => ({ x, y }))
const headPivot = { x: 49, y: 54 }, jawPivot = { x: 42, y: 68 }, finPivot = { x: 64, y: 44 }
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t) }
function rotate(p: P, pivot: P, angle: number): P { const x = p.x - pivot.x, y = p.y - pivot.y; return { x: pivot.x + x * Math.cos(angle) - y * Math.sin(angle), y: pivot.y + x * Math.sin(angle) + y * Math.cos(angle) } }
function inside(p: P, polygon: number[][]): boolean {
  let result = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j]
    if ((a[1] > p.y) !== (b[1] > p.y) && p.x < (b[0] - a[0]) * (p.y - a[1]) / (b[1] - a[1]) + a[0]) result = !result
  }
  return result
}
const HEAD = [[22, 82], [18, 59], [23, 19], [30, 18], [34, 41], [46, 36], [57, 28], [64, 34], [61, 48], [48, 58], [42, 73], [34, 84]]
const JAW = [[30, 73], [36, 66], [43, 65], [45, 69], [39, 78], [28, 84]]
const FIN = [[45, 38], [61, 28], [83, 33], [84, 48], [69, 55], [56, 48]]
const ARM = [[49, 65], [57, 58], [65, 61], [65, 70], [58, 77], [49, 72]]
// Tendrils are masked by their spatial paths, not by hue: body gold marks stay on the body.
const ribbons: P[][] = [
  [[24, 42], [25, 22], [33, 20], [42, 28], [51, 31], [60, 21], [67, 20], [79, 20], [83, 27], [91, 36], [98, 43]],
  [[47, 55], [44, 65], [50, 79], [51, 93], [57, 96], [61, 94]],
  [[81, 54], [84, 66], [89, 70], [98, 68], [106, 72], [114, 69]],
].map(path => path.map(([x, y]) => ({ x, y })))
function distanceToPath(p: P, paths: P[][] = ribbons): number {
  let distance = Infinity
  for (const path of paths) for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], dx = b.x - a.x, dy = b.y - a.y
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
    distance = Math.min(distance, Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t))
  }
  return distance
}
function bind(point: P): Binding {
  const weights = spine.map(p => 1 / (6 + (point.x - p.x) ** 2 + (point.y - p.y) ** 2) ** 2)
  const total = weights.reduce((a, b) => a + b, 0)
  const head = inside(point, HEAD) ? 1 : 0
  return { point, weights: weights.map(w => w / total), head, jaw: inside(point, JAW) ? 1 : 0, fin: inside(point, FIN) && !head ? 1 : 0, arm: inside(point, ARM) && !head ? 1 : 0, ribbon: head ? 0 : Math.max(0, 1 - distanceToPath(point) / 4), upperRibbon: ease((10 - distanceToPath(point, [ribbons[0]])) / 6) }
}
export function megaPose(action: MegaAction, ms: number): MegaPose {
  const t = ms / 1000, phase = ms / MEGA_DURATION[action]
  const pose: MegaPose = { body: spine.map(p => ({ ...p })), headX: 0, headY: 0, headAngle: 0, jaw: 0, fin: 0, arm: 0, ribbon: 0, breath: 1, angle: 0, eyes: 0, power: 0, sleep: 0 }
  if (action === 'original') return pose
  if (action === 'fly') {
    pose.headX = Math.sin(t * 1.4) * 2; pose.headY = Math.cos(t * 1.4) * 3
    pose.headAngle = Math.sin(t * 1.4) * .07; pose.angle = Math.sin(t * .8) * .12
    pose.fin = Math.sin(t * 2.5) * .12; pose.arm = Math.sin(t * 2.5 - .5) * .1
    pose.ribbon = t
    pose.body = spine.map((p, i) => ({ x: p.x + Math.sin(t * 2 - i * .6) * (1 + i * .65), y: p.y + Math.cos(t * 2 - i * .6) * (1 + i * .5) }))
  } else if (action === 'sleep') {
    // Rest the muzzle beside the coil, instead of burying it in its center.
    pose.headX = 6; pose.headY = 8; pose.headAngle = -.1; pose.sleep = 1
    pose.fin = .25; pose.arm = -.25; pose.eyes = 1; pose.breath = 1 + Math.sin(t * 1.4) * .012; pose.ribbon = t * .18
    pose.body = spine.map((p, i) => ({ x: 78 + (p.x - 78) * (i < 2 ? .9 : .73), y: 91 + (p.y - 91) * .8 }))
  } else if (action === 'roar') {
    const open = ease(phase / .2) * (1 - ease((phase - .68) / .3))
    pose.headY = -7 * open; pose.headAngle = .25 * open; pose.jaw = .5 * open
    pose.fin = -.15 * open; pose.arm = .2 * open; pose.ribbon = t * 1.4
    pose.body = spine.map((p, i) => ({ x: p.x + Math.sin(t * 23 - i * .3) * open * .8, y: p.y - open * 3 * (1 - i / spine.length) }))
  } else if (action === 'pulse') {
    const charge = ease(phase / .4), recoil = phase > .44 ? Math.exp(-(phase - .44) * 13) : 0
    pose.headAngle = .5 * charge; pose.angle = .16 * charge; pose.headX = recoil * 6; pose.headY = -2 * charge - recoil * 3
    pose.jaw = phase < .44 ? charge * .3 : .48 * (1 - ease((phase - .7) / .3)); pose.power = phase < .44 ? charge : Math.max(0, 1 - (phase - .44) * 4)
    pose.arm = .18; pose.fin = -.12; pose.ribbon = t * 1.5
    pose.body = spine.map((p, i) => ({ x: p.x + recoil * (1 - i / spine.length) * 5, y: p.y + Math.sin(i * .7) * charge * 2 }))
  } else {
    const streamline = ease(phase / .22) * (1 - ease((phase - .73) / .27))
    const target = [[63, 48], [73, 61], [78, 77], [90, 86], [106, 88], [121, 85], [129, 78], [134, 70], [141, 62], [149, 57], [157, 52]]
    pose.body = spine.map((p, i) => ({ x: mix(p.x, target[i][0], streamline), y: mix(p.y, target[i][1] + Math.sin(t * 9 - i * .8) * 2, streamline) }))
    pose.headAngle = .3 * streamline; pose.angle = .12 * streamline; pose.fin = .22 * streamline; pose.arm = -.2 * streamline; pose.ribbon = t * 2
  }
  return pose
}
export function blendMega(from: MegaPose, to: MegaPose, progress: number): MegaPose {
  const t = ease(progress), result = { ...to, body: to.body.map((p, i) => ({ x: mix(from.body[i].x, p.x, t), y: mix(from.body[i].y, p.y, t) })) }
  for (const key of ['headX', 'headY', 'headAngle', 'jaw', 'fin', 'arm', 'ribbon', 'breath', 'angle', 'eyes', 'power', 'sleep'] as const) result[key] = mix(from[key], to[key], t)
  return result
}
export class MegaAnimator {
  action: MegaAction = 'original'; elapsed = 0
  private from?: MegaPose; private transition = MEGA_TRANSITION
  pose(): MegaPose { const to = megaPose(this.action, this.elapsed); return this.from && this.transition < MEGA_TRANSITION ? blendMega(this.from, to, this.transition / MEGA_TRANSITION) : to }
  select(action: MegaAction): void { this.from = this.pose(); this.action = action; this.elapsed = 0; this.transition = 0 }
  advance(delta: number, auto: boolean): void {
    if (!Number.isFinite(delta) || delta < 0) return
    this.elapsed += delta; this.transition = Math.min(MEGA_TRANSITION, this.transition + delta)
    if (this.action !== 'original' && this.elapsed >= MEGA_DURATION[this.action]) this.select(auto ? MEGA_ACTIONS[(MEGA_ACTIONS.indexOf(this.action as typeof MEGA_ACTIONS[number]) + 1) % MEGA_ACTIONS.length] : this.action)
  }
  get transitioning(): boolean { return this.transition < MEGA_TRANSITION }
}
function map(binding: Binding, pose: MegaPose): P {
  const p = binding.point
  let body = { x: p.x, y: p.y }
  for (let i = 0; i < spine.length; i++) { body.x += (pose.body[i].x - spine[i].x) * binding.weights[i]; body.y += (pose.body[i].y - spine[i].y) * binding.weights[i] }
  let head = rotate(p, headPivot, pose.headAngle)
  if (binding.jaw) head = rotate(rotate(p, jawPivot, -pose.jaw), headPivot, pose.headAngle)
  head.x += pose.headX; head.y += pose.headY
  let result = { x: mix(body.x, head.x, binding.head), y: mix(body.y, head.y, binding.head) }
  if (binding.fin) { const fin = rotate(p, finPivot, pose.fin); result.x += (fin.x - p.x) * binding.fin; result.y += (fin.y - p.y) * binding.fin }
  if (binding.arm) { const arm = rotate(p, { x: 60, y: 61 }, pose.arm); result.x += arm.x - p.x; result.y += arm.y - p.y }
  if (binding.ribbon) { result.x += Math.sin(pose.ribbon * 2.8 - p.y * .1) * 3 * binding.ribbon; result.y += Math.sin(pose.ribbon * 2.3 - p.x * .12) * 3 * binding.ribbon }
  if (pose.sleep && binding.upperRibbon) {
    // One continuous head-attached deformation for the entire upper tendril.
    // Its old head/body boundary gave adjacent thin segments different transforms.
    const tether = rotate(p, headPivot, pose.headAngle)
    tether.x += pose.headX + Math.sin(pose.ribbon * 2.8 - p.y * .1) * .7
    tether.y += pose.headY + Math.sin(pose.ribbon * 2.3 - p.x * .12) * .7
    const attachment = pose.sleep * binding.upperRibbon
    result = { x: mix(result.x, tether.x, attachment), y: mix(result.y, tether.y, attachment) }
  }
  result = { x: 76 + (result.x - 76) * pose.breath, y: 87 + (result.y - 87) * pose.breath }
  result = rotate(result, { x: 64, y: 72 }, pose.angle)
  return { x: result.x + 32, y: result.y + 24 }
}
export function megaMouth(pose: MegaPose): P {
  return map({ ...bind({ x: 39, y: 65 }), head: 1, jaw: 0, ribbon: 0 }, pose)
}
// 2px textured triangles preserve source colors, gold markings and contours.
// All bindings are computed once. Rasterization resamples the source by nearest neighbor.
export class MegaTexture {
  private nodes: Binding[] = []
  private foreground = new Uint8Array(128 * 128)
  constructor(private source: Uint8ClampedArray) {
    if (source.length !== 128 * 128 * 4) throw new Error('Mega Rayquaza requires a 128px RGBA frame')
    for (let y = 0; y <= 128; y += 2) for (let x = 0; x <= 128; x += 2) this.nodes.push(bind({ x, y }))
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const point = { x: x + .5, y: y + .5 }
      this.foreground[y * 128 + x] = distanceToPath(point, [ribbons[0]]) < 4 ? 2 : inside(point, HEAD) || inside(point, JAW) ? 1 : 0
    }
  }
  render(pose: MegaPose): Uint8ClampedArray<ArrayBuffer> {
    const output = new Uint8ClampedArray(MEGA_SIZE * MEGA_SIZE * 4), mapped = this.nodes.map(node => map(node, pose))
    const depth = pose.sleep > .001 ? new Uint8Array(MEGA_SIZE * MEGA_SIZE) : undefined
    const triangle = (ia: number, ib: number, ic: number) => {
      const a = mapped[ia], b = mapped[ib], c = mapped[ic], sa = this.nodes[ia].point, sb = this.nodes[ib].point, sc = this.nodes[ic].point
      const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
      if (Math.abs(denominator) < .01) return
      const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), maxX = Math.min(MEGA_SIZE - 1, Math.ceil(Math.max(a.x, b.x, c.x)))
      const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), maxY = Math.min(MEGA_SIZE - 1, Math.ceil(Math.max(a.y, b.y, c.y)))
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const u = ((b.y - c.y) * (x + .5 - c.x) + (c.x - b.x) * (y + .5 - c.y)) / denominator
        const v = ((c.y - a.y) * (x + .5 - c.x) + (a.x - c.x) * (y + .5 - c.y)) / denominator, w = 1 - u - v
        if (u < -.001 || v < -.001 || w < -.001) continue
        const sx = Math.floor(u * sa.x + v * sb.x + w * sc.x), sy = Math.floor(u * sa.y + v * sb.y + w * sc.y)
        if (sx < 0 || sy < 0 || sx >= 128 || sy >= 128) continue
        // Close the existing eye with adjacent source scales, rather than drawing a new face.
        const eyelid = pose.eyes > .7 && sx >= 35 && sx <= 40 && sy >= 60 && sy <= 62
        const sourceIndex = eyelid ? (58 * 128 + 37) * 4 : (sy * 128 + sx) * 4, destination = (y * MEGA_SIZE + x) * 4
        if (!this.source[sourceIndex + 3]) continue
        if (depth) {
          // Foreground head/jaw and upper tendril survive overlap with the coil.
          const layer = this.foreground[sy * 128 + sx], pixel = destination / 4
          if (depth[pixel] > layer) continue
          depth[pixel] = layer
        }
        output[destination] = this.source[sourceIndex]; output[destination + 1] = this.source[sourceIndex + 1]; output[destination + 2] = this.source[sourceIndex + 2]; output[destination + 3] = this.source[sourceIndex + 3]
      }
    }
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const a = y * 65 + x, b = a + 1, c = a + 65, d = c + 1
      triangle(a, b, c); triangle(b, d, c)
    }
    return output
  }
}
