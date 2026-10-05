// Articulated, hand-authored 64px dragon. Every primitive writes exact pixels.
// Inspired by the supplied green/gold serpentine dragon, rather than deforming
// a flattened GIF (which has no recoverable jaw/limb layers).
export const LEGENDARY_ACTIONS = ['fly', 'sleep', 'roar', 'pulse', 'dash'] as const
export type LegendaryAction = typeof LEGENDARY_ACTIONS[number]
export const LEGENDARY_DURATION: Record<LegendaryAction, number> = { fly: 9000, sleep: 11000, roar: 5500, pulse: 6500, dash: 5500 }
export const TRANSITION_MS = 1100
type Point = { x: number; y: number }
export type DragonPose = {
  spine: Point[]; aim: number; jaw: number; eyes: number; fins: number;
  ribbon: number; glow: number; lean: number
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t) }
function rotate(p: Point, angle: number, center: Point = { x: 32, y: 32 }): Point {
  const x = p.x - center.x, y = p.y - center.y
  return { x: center.x + x * Math.cos(angle) - y * Math.sin(angle), y: center.y + x * Math.sin(angle) + y * Math.cos(angle) }
}
export function dragonPose(action: LegendaryAction, elapsed: number): DragonPose {
  const t = elapsed / 1000, phase = elapsed / LEGENDARY_DURATION[action]
  const spine: Point[] = []
  let aim = 0, jaw = 0, eyes = 0, fins = 1, glow = 0, lean = 0
  for (let i = 0; i < 29; i++) {
    const u = i / 28
    let p: Point
    if (action === 'fly') {
      // A travelling wave: head leads, neck/body/tail follow with a phase lag.
      p = { x: 47 - u * 37 + Math.sin(t * 1.7 - u * 5) * 2 * u,
        y: 28 + Math.sin(t * 2.3 - u * 7) * (3 + 8 * u) + Math.sin(u * Math.PI) * 5 }
      // Continuous banking turn: foreshorten the body while it turns, then
      // face the return leg. Unlike a binary flip, intermediate poses survive.
      const yaw = Math.tanh(Math.cos(t * Math.PI * 2 / 9) * 4)
      p.x = 32 + (p.x - 32) * yaw
      lean = Math.sin(t * Math.PI * 2 / 9) * .32
      p = rotate(p, lean)
      aim = Math.atan2(-Math.sin(t * Math.PI * 2 / 9) * .22, yaw) + lean + Math.cos(t * 2.3) * .12
      fins = .8 + Math.sin(t * 3.1) * .35
    } else if (action === 'sleep') {
      const a = -.5 + u * Math.PI * 3.55, r = 4 + u * 16
      const breath = 1 + Math.sin(t * 1.6) * .018
      p = { x: 32 + Math.cos(a) * r * breath, y: 34 + Math.sin(a) * r * .72 * breath }
      aim = .2; eyes = 1; fins = .18
    } else if (action === 'roar') {
      jaw = smooth(phase / .22) * (1 - smooth((phase - .68) / .28))
      const shake = phase > .22 && phase < .68 ? Math.sin(t * 34) * .7 : 0
      p = { x: 43 - u * 32 + Math.sin(u * 6) * 5 + shake * (1 - u),
        y: 19 + u * 29 + Math.sin(u * 8 - t * 1.3) * 5 * u - jaw * 3 * (1 - u) }
      aim = -.55 - jaw * .2; fins = 1.3 + jaw * .3
    } else if (action === 'pulse') {
      const charge = smooth(phase / .4), recoil = phase >= .45 ? Math.exp(-(phase - .45) * 14) * 5 : 0
      p = { x: 46 - u * 32 + Math.sin(u * 7) * 6 - recoil * (1 - u),
        y: 28 + Math.sin(u * 5.5) * 12 + u * 8 + charge * 2 * (1 - u) }
      aim = -.06; jaw = phase < .42 ? charge * .45 : Math.max(.1, 1 - (phase - .42)); fins = 1.1
      glow = phase < .45 ? charge : Math.max(0, 1 - (phase - .45) * 4)
    } else {
      // Streamline the spine, tuck the limbs and stretch the tail behind the head.
      const brake = smooth((phase - .7) / .3)
      p = { x: 51 - u * (44 - brake * 7), y: 30 + Math.sin(t * 7 - u * 9) * (1 + 2 * u) + Math.sin(u * Math.PI * 2) * brake * 8 - brake * 3 * (1 - u) }
      aim = -.1 - brake * .4; fins = .12 + brake * .95
    }
    spine.push(p)
  }
  return { spine, aim, jaw, eyes, fins, glow, lean, ribbon: t }
}
export function blendPose(from: DragonPose, to: DragonPose, progress: number): DragonPose {
  const t = smooth(progress)
  const angleDelta = Math.atan2(Math.sin(to.aim - from.aim), Math.cos(to.aim - from.aim))
  return {
    spine: to.spine.map((p, i) => ({ x: mix(from.spine[i].x, p.x, t), y: mix(from.spine[i].y, p.y, t) })),
    aim: from.aim + angleDelta * t, jaw: mix(from.jaw, to.jaw, t), eyes: mix(from.eyes, to.eyes, t),
    fins: mix(from.fins, to.fins, t), glow: mix(from.glow, to.glow, t), lean: mix(from.lean, to.lean, t), ribbon: mix(from.ribbon, to.ribbon, t),
  }
}
export class DragonAnimator {
  action: LegendaryAction = 'fly'
  elapsed = 0
  private from?: DragonPose
  private transition = TRANSITION_MS
  pose(): DragonPose {
    const target = dragonPose(this.action, this.elapsed)
    return this.from && this.transition < TRANSITION_MS ? blendPose(this.from, target, this.transition / TRANSITION_MS) : target
  }
  select(action: LegendaryAction): void {
    // Snapshot the current *blended* pose; repeated clicks never snap to an old action.
    this.from = this.pose(); this.action = action; this.elapsed = 0; this.transition = 0
  }
  advance(delta: number, auto: boolean): void {
    if (!Number.isFinite(delta) || delta < 0) return
    this.elapsed += delta; this.transition = Math.min(TRANSITION_MS, this.transition + delta)
    if (this.elapsed >= LEGENDARY_DURATION[this.action]) {
      const next = auto ? LEGENDARY_ACTIONS[(LEGENDARY_ACTIONS.indexOf(this.action) + 1) % LEGENDARY_ACTIONS.length] : this.action
      this.select(next)
    }
  }
  get transitioning(): boolean { return this.transition < TRANSITION_MS }
  get progress(): number { return this.transition / TRANSITION_MS }
}

const C = { outline: 0x092d30, dark: 0x135143, green: 0x258b59, light: 0x58c478, gold: 0xe7c965, pale: 0xffedab, red: 0xbf604b, teal: 0x59b4a7, mouth: 0x141e28, eye: 0xff895e }
export function rasterDragon(pose: DragonPose): Uint32Array {
  const px = new Uint32Array(64 * 64)
  function dot(x: number, y: number, color: number): void { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < 64 && y < 64) px[y * 64 + x] = color + 0xff000000 }
  function disc(p: Point, r: number, color: number): void {
    for (let y = Math.floor(p.y - r); y <= Math.ceil(p.y + r); y++) for (let x = Math.floor(p.x - r); x <= Math.ceil(p.x + r); x++) if ((x - p.x) ** 2 + (y - p.y) ** 2 <= r * r + .5) dot(x, y, color)
  }
  function line(a: Point, b: Point, r: number, color: number): void {
    const n = Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 2)
    for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; disc({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) }, r, color) }
  }
  function polygon(points: Point[], color: number): void {
    const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p.y)))), maxY = Math.min(63, Math.ceil(Math.max(...points.map(p => p.y))))
    const minX = Math.max(0, Math.floor(Math.min(...points.map(p => p.x)))), maxX = Math.min(63, Math.ceil(Math.max(...points.map(p => p.x))))
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      let inside = false
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i], b = points[j]
        if ((a.y > y + .5) !== (b.y > y + .5) && x + .5 < (b.x - a.x) * (y + .5 - a.y) / (b.y - a.y) + a.x) inside = !inside
      }
      if (inside) dot(x, y, color)
    }
  }
  const spine = pose.spine
  function tangent(i: number): number { const a = spine[Math.max(0, i - 1)], b = spine[Math.min(spine.length - 1, i + 1)]; return Math.atan2(a.y - b.y, a.x - b.x) }
  // Tail first, head last: overlapping coils have a deliberate depth order.
  for (let i = spine.length - 2; i >= 0; i--) {
    const u = i / (spine.length - 1), r = 2.8 * (1 - u * .75)
    line(spine[i + 1], spine[i], r + 1, C.outline)
    line(spine[i + 1], spine[i], r, C.green)
    const angle = tangent(i), nx = -Math.sin(angle), ny = Math.cos(angle)
    line({ x: spine[i].x + nx, y: spine[i].y + ny }, { x: spine[i + 1].x + nx, y: spine[i + 1].y + ny }, Math.max(.4, r * .38), C.dark)
    line({ x: spine[i].x - nx, y: spine[i].y - ny }, { x: spine[i + 1].x - nx, y: spine[i + 1].y - ny }, .45, pose.glow > .7 ? C.pale : C.light)
    if (i % 4 === 2) {
      line({ x: spine[i].x - nx * r, y: spine[i].y - ny * r }, { x: spine[i].x + nx * r, y: spine[i].y + ny * r }, .55, C.gold)
      dot(spine[i].x, spine[i].y, C.pale)
    }
    if (i % 6 === 4 && i < 24) for (const side of [-1, 1]) {
      const at = spine[i], length = 2 + pose.fins * 3
      polygon([{ x: at.x + nx * side * r, y: at.y + ny * side * r }, { x: at.x + nx * side * (r + length) - Math.cos(angle) * 3, y: at.y + ny * side * (r + length) - Math.sin(angle) * 3 }, { x: at.x - Math.cos(angle) * 4, y: at.y - Math.sin(angle) * 4 }], C.outline)
      line({ x: at.x + nx * side * r, y: at.y + ny * side * r }, { x: at.x + nx * side * (r + length - 1) - Math.cos(angle) * 3, y: at.y + ny * side * (r + length - 1) - Math.sin(angle) * 3 }, .7, C.red)
    }
  }
  // Jointed arms open during a roar and fold against the body during sleep/dash.
  const shoulder = spine[5], armAngle = tangent(5)
  for (const side of [-1, 1]) {
    const local = (x: number, y: number) => ({ x: shoulder.x + Math.cos(armAngle) * x - Math.sin(armAngle) * y * side, y: shoulder.y + Math.sin(armAngle) * x + Math.cos(armAngle) * y * side })
    const elbow = local(-3, 3 + pose.fins * 2), hand = local(-5 + pose.fins * 2, 4 + pose.fins * 4)
    line(shoulder, elbow, 1.5, C.outline); line(elbow, hand, 1.5, C.outline)
    line(shoulder, elbow, .8, C.green); line(elbow, hand, .8, C.light)
    for (let i = -1; i <= 1; i++) { const tip = { x: hand.x + 2, y: hand.y + i * 2 }; line(hand, tip, .5, C.pale) }
  }
  const head = spine[0]
  const H = (x: number, y: number, extra = 0): Point => {
    const facing = Math.cos(pose.aim) >= 0 ? 1 : -1
    const a = pose.aim + extra * facing
    return { x: head.x + Math.cos(a) * x - Math.sin(a) * y * facing, y: head.y + Math.sin(a) * x + Math.abs(Math.cos(a)) * y }
  }
  // Two long, independently flowing gold antenna ribbons with pale arrow tips.
  for (const side of [-1, 1]) {
    let prev = H(-3, side * 3)
    for (let i = 1; i <= 18; i++) {
      const u = i / 18, flow = .3 + Math.min(1, pose.fins) * 2.7
      const p = H(-3 - u * 19, side * (3 + Math.sin(u * Math.PI) * 12) + Math.sin(pose.ribbon * (pose.eyes > .75 ? .8 : 3) - u * 6) * flow * u)
      line(prev, p, 1.1, C.outline); line(prev, p, .6, i > 15 ? C.pale : C.gold); prev = p
    }
    disc(prev, 1, C.teal)
  }
  // Hinged mandible is a separate polygon, not a rectangle on the chest.
  const J = (x: number, y: number) => H(x - 2, y, pose.jaw * .95)
  polygon([H(-2, 1), H(7, 1), J(10, 4), J(2, 5)], C.mouth)
  polygon([J(1, 1), J(11, 1), J(9, 4), J(2, 4)], C.outline)
  polygon([J(2, 1), J(10, 1), J(8, 3), J(2, 3)], C.green)
  line(J(3, 3), J(8, 3), .6, C.gold)
  polygon([H(-5, -4), H(-2, -6), H(3, -4), H(8, -2), H(9, 1), H(3, 2), H(-3, 1)], C.outline)
  polygon([H(-4, -3), H(-1, -5), H(3, -3), H(7, -2), H(8, 0), H(2, 1), H(-3, 0)], C.green)
  line(H(-2, -4), H(4, -2), .6, C.light)
  // Horns and brow retain the dragon's angular green/gold silhouette.
  polygon([H(-4, -3), H(-8, -9), H(-2, -7), H(0, -4)], C.gold)
  polygon([H(-3, -4), H(-6, -8), H(-1, -6)], C.pale)
  line(H(0, -3), H(3, -2), .5, C.red)
  if (pose.eyes > .75) line(H(1, -2), H(3, -2), .5, C.outline)
  else { disc(H(2, -2), 1, C.eye); dot(H(3, -2).x, H(3, -2).y, C.outline); dot(H(1, -3).x, H(1, -3).y, C.pale) }
  dot(H(7, -1).x, H(7, -1).y, C.outline)
  for (const x of [4, 7]) { const tooth = H(x, 1); dot(tooth.x, tooth.y, C.pale); const lower = J(x + 2, 1); dot(lower.x, lower.y, C.pale) }
  return px
}
export function rgbaDragon(pose: DragonPose): Uint8ClampedArray<ArrayBuffer> {
  const pixels = rasterDragon(pose), bytes = new Uint8ClampedArray(pixels.length * 4)
  pixels.forEach((p, i) => { bytes[i * 4] = (p >>> 16) & 255; bytes[i * 4 + 1] = (p >>> 8) & 255; bytes[i * 4 + 2] = p & 255; bytes[i * 4 + 3] = p >>> 24 })
  return bytes
}
