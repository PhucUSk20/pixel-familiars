import type { ArceusSkill } from './arceus-life'
// Match the other 128px pets: one source pixel per Arena scene pixel.
export const ARCEUS_SOURCE_SCALE = 1
// Effect coordinates were authored for the former 1.25x body; keep them aligned to native size.
export const ARCEUS_EFFECT_SCALE = ARCEUS_SOURCE_SCALE / 1.25
export type ArceusPose = { head: number; front: number; back: number; lift: number; angle: number; glow: number }
const smooth = (n: number) => { n = Math.max(0, Math.min(1, n)); return n * n * (3 - 2 * n) }
export function arceusPose(skill: ArceusSkill, elapsed: number, casting: boolean): ArceusPose {
  const t = elapsed / 1000, p = elapsed / 12000
  const power = casting ? smooth(p / .2) * (1 - smooth((p - .88) / .12)) : 0
  return { head: -.16 * power + Math.sin(t * 1.2) * .018, front: .14 * power + Math.sin(t * 1.8) * .035,
    back: -.09 * power - Math.sin(t * 1.8) * .028, lift: Math.sin(t * 1.3) * 2 - power * (skill === 'twister' ? 7 : 3),
    angle: skill === 'hyper-beam' ? Math.sin(p * Math.PI) * .04 : 0, glow: power }
}
type BoundPixel = { x: number; y: number; color: number; head: number; front: number; back: number }
/** Continuous source-textured joints; the gold torso ring remains rigid and attached. */
export class ArceusTexture {
  private pixels: BoundPixel[] = []
  constructor(source: Uint8ClampedArray) {
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4
      if (!source[i + 3]) continue
      const ring = x >= 58 && x <= 110 && y >= 42 ? 1 - smooth((y - 88) / 12) : 0
      const head = smooth((55 - y) / 16) * smooth((85 - x) / 24) * (1-ring), legs = smooth((y - 74) / 20) * (1-ring)
      const front = legs * smooth((76 - x) / 24), back = legs * (1 - smooth((76 - x) / 24))
      this.pixels.push({ x, y, head, front, back, color: (source[i] | source[i + 1] << 8 | source[i + 2] << 16 | source[i + 3] << 24) >>> 0 })
    }
  }
  render(pose: ArceusPose): Uint8ClampedArray<ArrayBuffer> {
    const pixels = new Uint32Array(192 * 192)
    const joints = [{ x: 49, y: 51, angle: pose.head }, { x: 47, y: 76, angle: pose.front }, { x: 85, y: 76, angle: pose.back }].map(joint=>({...joint,cos:Math.cos(joint.angle),sin:Math.sin(joint.angle)}))
    const cos=Math.cos(pose.angle),sin=Math.sin(pose.angle)
    for (const pixel of this.pixels) {
      let x = pixel.x, y = pixel.y
      for (let j = 0; j < joints.length; j++) {
        const joint = joints[j], weight = j===0?pixel.head:j===1?pixel.front:pixel.back, dx = pixel.x - joint.x, dy = pixel.y - joint.y
        x += weight * (dx * joint.cos - dy * joint.sin - dx)
        y += weight * (dx * joint.sin + dy * joint.cos - dy)
      }
      const dx = x - 64, dy = y - 64
      const tx = Math.round(96 + (dx * cos - dy * sin) * ARCEUS_SOURCE_SCALE)
      const ty = Math.round(88 + (dx * sin + dy * cos) * ARCEUS_SOURCE_SCALE + pose.lift)
      // Slightly overlapping texels close sampling gaps without detached cutout limbs.
      for (let oy = 0; oy < 2; oy++) for (let ox = 0; ox < 2; ox++) if (tx + ox >= 0 && tx + ox < 192 && ty + oy >= 0 && ty + oy < 192) pixels[(ty + oy) * 192 + tx + ox] = pixel.color
    }
    return new Uint8ClampedArray(pixels.buffer)
  }
}
