// Articulated from the supplied sprite; all body pixels retain their source palette.
export const KYOGRE_ACTIONS = ['swim', 'dive', 'sleep', 'roar', 'pulse', 'wave', 'rain'] as const
export type KyogreAction = typeof KYOGRE_ACTIONS[number] | 'original'
export const KYOGRE_DURATION: Record<KyogreAction, number> = { original: 8000, swim: 7000, dive: 7000, sleep: 9000, roar: 5500, pulse: 7000, wave: 7000, rain: 8000 }
export const KYOGRE_WIDTH = 256, KYOGRE_HEIGHT = 192, KYOGRE_TRANSITION = 1100
type Point = { x: number; y: number }
export type KyogrePose = { x: number; y: number; angle: number; squash: number; head: number; jaw: number; leftFin: number; rightFin: number; tail: number; eyes: number; glow: number; depth: number }
const scalarKeys = ['x','y','angle','squash','head','jaw','leftFin','rightFin','tail','eyes','glow','depth'] as const
const mix = (a: number, b: number, t: number) => a + (b-a)*t
const smooth = (t: number) => { t = Math.max(0, Math.min(1,t)); return t*t*(3-2*t) }
const envelope = (p: number, start: number, peak: number, end: number) => p < peak ? smooth((p-start)/(peak-start)) : 1-smooth((p-peak)/(end-peak))
const base = (): KyogrePose => ({ x:0,y:0,angle:0,squash:1,head:0,jaw:0,leftFin:0,rightFin:0,tail:0,eyes:0,glow:0,depth:0 })
export function kyogrePose(action: KyogreAction, ms: number): KyogrePose {
  const p = base(), t = ms/1000, phase = ms/KYOGRE_DURATION[action]
  if (action === 'original') return p
  p.squash = 1+Math.sin(t*1.7)*.006; p.tail = Math.sin(t*2-.8)*.04
  if (action === 'swim') {
    p.leftFin = Math.sin(t*3.1)*.24; p.rightFin = Math.sin(t*3.1-.65)*-.27
    p.tail = Math.sin(t*3.1-1.4)*.16; p.head = Math.sin(t*3.1-1)*.025
    p.y = Math.sin(t*1.55)*3; p.x = Math.sin(phase*Math.PI*2)*8; p.angle = Math.sin(t*1.55)*.025
  } else if (action === 'dive') {
    const sink = envelope(phase,.06,.52,.96)
    p.angle = -.38*sink; p.y = 22*sink; p.x = -10*sink; p.depth = sink
    p.leftFin = -.3*sink; p.rightFin = .34*sink; p.tail = -.26*sink+Math.sin(t*4)*.08
    p.head = -.09*sink
  } else if (action === 'sleep') {
    p.squash = .97+Math.sin(t*.95)*.012; p.y = 2; p.eyes = 1
    p.leftFin = -.1; p.rightFin = .15; p.tail = Math.sin(t*.7)*.025
  } else if (action === 'roar') {
    const call = envelope(phase,.03,.28,.9)
    p.head = .19*call; p.jaw = .3*call; p.leftFin = -.18*call; p.rightFin = .22*call
    p.y = -3*call; p.angle = .04*call; p.glow = call*.6; p.tail = .14*call
    p.x = Math.sin(t*22)*call*.5
  } else if (action === 'pulse') {
    const charge = envelope(phase,.02,.42,.94), recoil = envelope(phase,.45,.52,.75)
    p.head = .12*charge; p.jaw = .25*charge; p.leftFin = -.2*charge; p.rightFin = .25*charge
    p.tail = -.14*charge; p.glow = charge; p.x = 8*recoil; p.angle = -.04*recoil
  } else if (action === 'wave') {
    const rise = envelope(phase,.03,.32,.88), push = envelope(phase,.3,.48,.8)
    p.y = -10*rise; p.angle = .08*rise; p.head = .08*rise; p.jaw = .14*push
    p.leftFin = -.4*rise+.2*push; p.rightFin = .43*rise-.25*push
    p.tail = -.2*rise; p.glow = rise; p.x = -5*push
  } else {
    const summon = envelope(phase,.02,.3,.95)
    p.leftFin = -.33*summon; p.rightFin = .36*summon; p.head = .17*summon; p.jaw = .19*summon
    p.y = -7*summon; p.glow = summon; p.tail = Math.sin(t*2)*.07
  }
  return p
}
export class KyogreAnimator {
  action: KyogreAction = 'original'; elapsed = 0
  private from?: KyogrePose; private transition = KYOGRE_TRANSITION
  pose(): KyogrePose {
    const target = kyogrePose(this.action,this.elapsed)
    if (!this.from || !this.transitioning) return target
    const result = { ...target }, amount = smooth(this.transition/KYOGRE_TRANSITION)
    for (const key of scalarKeys) result[key] = mix(this.from[key],target[key],amount)
    return result
  }
  select(action: KyogreAction): void { this.from = this.pose(); this.action = action; this.elapsed = 0; this.transition = 0 }
  advance(delta: number, auto: boolean): void {
    if (!Number.isFinite(delta) || delta < 0) return
    this.elapsed += delta; this.transition = Math.min(KYOGRE_TRANSITION,this.transition+delta)
    if (this.action !== 'original' && this.elapsed >= KYOGRE_DURATION[this.action]) this.select(auto ? KYOGRE_ACTIONS[(KYOGRE_ACTIONS.indexOf(this.action as typeof KYOGRE_ACTIONS[number])+1)%KYOGRE_ACTIONS.length] : this.action)
  }
  get transitioning(): boolean { return this.transition < KYOGRE_TRANSITION }
}
const parts = [
  { pivot:{x:52,y:75}, polygon:[[37,64],[50,62],[62,70],[59,83],[48,89],[37,87],[32,79]] },
  { pivot:{x:46,y:84}, polygon:[[33,80],[48,80],[58,84],[52,92],[38,93],[32,87]] },
  { pivot:{x:48,y:65}, polygon:[[24,52],[35,49],[46,55],[52,65],[46,72],[30,69],[22,61]] },
  { pivot:{x:69,y:73}, polygon:[[65,67],[80,66],[93,71],[105,68],[109,80],[102,92],[83,94],[72,86]] },
  { pivot:{x:76,y:57}, polygon:[[65,53],[65,34],[77,32],[79,48],[85,52],[86,36],[98,35],[98,54],[93,64],[80,65]] },
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
function map(binding: Binding, pose: KyogrePose): Point {
  const point = binding.point, result = { ...point }
  const angles = [pose.head, -pose.jaw, pose.leftFin, pose.rightFin, pose.tail]
  for (let i = 0; i < parts.length; i++) {
    const weight = binding.weights[i]
    if (!weight) continue
    const moved = rotate(point, parts[i].pivot, angles[i])
    result.x += (moved.x - point.x) * weight
    result.y += (moved.y - point.y) * weight
  }
  result.y = 76 + (result.y - 76) * pose.squash
  const tilted = rotate(result, { x: 61, y: 73 }, pose.angle)
  return { x: tilted.x + 64 + pose.x, y: tilted.y + 32 + pose.y }
}
export function kyogreMouth(pose: KyogrePose): Point { return map(bind({ x: 38, y: 86 }), pose) }
export class KyogreTexture {
  private nodes: Binding[] = []
  constructor(private source: Uint8ClampedArray) {
    if (source.length !== 128 * 128 * 4) throw new Error('Primal Kyogre requires a 128px RGBA frame')
    for (let y = 0; y <= 128; y += 2) for (let x = 0; x <= 128; x += 2) this.nodes.push(bind({ x, y }))
  }
  render(pose: KyogrePose): Uint8ClampedArray<ArrayBuffer> {
    const output = new Uint8ClampedArray(KYOGRE_WIDTH * KYOGRE_HEIGHT * 4), mapped = this.nodes.map(node => map(node, pose))
    const triangle = (ia: number, ib: number, ic: number) => {
      const a = mapped[ia], b = mapped[ib], c = mapped[ic], sa = this.nodes[ia].point, sb = this.nodes[ib].point, sc = this.nodes[ic].point
      const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
      if (Math.abs(d) < .01) return
      for (let y = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))); y <= Math.min(KYOGRE_HEIGHT - 1, Math.ceil(Math.max(a.y, b.y, c.y))); y++) {
        for (let x = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))); x <= Math.min(KYOGRE_WIDTH - 1, Math.ceil(Math.max(a.x, b.x, c.x))); x++) {
          const u = ((b.y - c.y) * (x + .5 - c.x) + (c.x - b.x) * (y + .5 - c.y)) / d
          const v = ((c.y - a.y) * (x + .5 - c.x) + (a.x - c.x) * (y + .5 - c.y)) / d, w = 1 - u - v
          if (Math.min(u, v, w) < -.001) continue
          const sx = Math.floor(u * sa.x + v * sb.x + w * sc.x), sy = Math.floor(u * sa.y + v * sb.y + w * sc.y)
          if (sx < 0 || sy < 0 || sx >= 128 || sy >= 128) continue
          const eyelid = pose.eyes > .7 && sx >= 47 && sx <= 52 && sy >= 76 && sy <= 79
          const sourceIndex = ((eyelid ? 74 : sy) * 128 + (eyelid ? 55 : sx)) * 4, destination = (y * KYOGRE_WIDTH + x) * 4
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
