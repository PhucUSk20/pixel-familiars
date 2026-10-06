// Continuous source-textured mesh: limbs remain attached at their shoulder/hip pivots.
export type DeoxysForm = 'normal' | 'attack' | 'defense' | 'speed'
export const DEOXYS_FORMS: DeoxysForm[] = ['normal','attack','defense','speed']
export const DEOXYS_SIZE = 192
export type DeoxysAction = 'float' | 'rest' | 'touch' | 'transform' | 'skill'
type Point = { x:number; y:number }
export type DeoxysPose = { x:number; y:number; angle:number; squash:number; head:number; leftArm:number; rightArm:number; leftLeg:number; rightLeg:number; glow:number }
const smooth = (t:number) => { t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t) }
export function deoxysPose(form:DeoxysForm, action:DeoxysAction, ms:number):DeoxysPose {
  const t=ms/1000, p=Math.min(1,ms/6500), wave=Math.sin(t*2.4)
  const pose:DeoxysPose={ x:0,y:Math.sin(t*1.8)*2,angle:0,squash:1+Math.sin(t*1.8)*.012,head:Math.sin(t)*.035,leftArm:wave*.08,rightArm:-wave*.09,leftLeg:-wave*.035,rightLeg:wave*.035,glow:0 }
  if(action==='rest') { pose.y=6; pose.leftArm=.12; pose.rightArm=-.12; pose.leftLeg=.08; pose.rightLeg=-.06; pose.squash=.96+Math.sin(t)*.015; return pose }
  if(action==='touch') { const reach=smooth(ms/1400); pose.rightArm=-.22*reach; pose.head=.12*reach; pose.angle=.09*reach; pose.glow=reach*.3 }
  if(action==='transform') {
    // Swap source anatomies under the flash with a stable torso and relaxed joints.
    pose.head=pose.leftArm=pose.rightArm=pose.leftLeg=pose.rightLeg=0
    pose.angle=0;pose.squash=1;pose.y=-5*Math.sin(Math.min(1,ms/2400)*Math.PI);pose.glow=1
  }
  if(action==='skill') {
    const charge=smooth(p/.35), release=smooth((p-.48)/.22), recover=1-smooth((p-.78)/.22), energy=charge*recover
    pose.glow=energy; pose.leftArm=.22*energy; pose.rightArm=-.22*energy; pose.head=-.1*energy; pose.y-=4*energy
    if(form==='normal') { pose.leftArm=.16*energy; pose.rightArm=-.16*energy; pose.leftLeg=.1*energy; pose.rightLeg=-.1*energy }
    if(form==='attack') { pose.leftArm=.22*energy; pose.rightArm=-.22*energy; pose.x=-6*release*recover; pose.angle=-.08*release*recover }
    if(form==='defense') { pose.leftArm=-.1*energy; pose.rightArm=.1*energy; pose.squash=1-.06*energy; pose.leftLeg=.13*energy; pose.rightLeg=-.13*energy }
    if(form==='speed') { const dash=smooth((p-.3)/.08)*(1-smooth((p-.75)/.12)); pose.x=Math.sin(t*11)*28*dash; pose.y+=Math.cos(t*11)*9*dash; pose.angle=Math.sin(t*11)*.19*dash; pose.leftArm=-.18*dash; pose.rightArm=.18*dash; pose.leftLeg=-.3*dash; pose.rightLeg=.3*dash }
  }
  return pose
}
const parts = [
 {pivot:{x:64,y:39},polygon:[[40,15],[81,15],[85,40],[66,48],[42,40]]},
 {pivot:{x:48,y:44},polygon:[[10,35],[48,35],[48,65],[58,106],[12,115],[10,64]]},
 {pivot:{x:78,y:44},polygon:[[78,35],[118,35],[118,115],[77,106],[70,65]]},
 {pivot:{x:54,y:70},polygon:[[43,70],[63,70],[62,120],[40,120]]},
 {pivot:{x:74,y:70},polygon:[[66,70],[82,70],[91,120],[66,120]]},
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
function bind(point: Point): Binding {
  const weights=parts.map((part,i)=>{
    const distance=Math.hypot(point.x-part.pivot.x,point.y-part.pivot.y)
    const attachment=i===0?1:smooth(distance/28)
    // Keep the chest rigid; broad shoulder/hip falloff prevents folding thin tentacles.
    const limb=i===1?smooth((52-point.x)/18):i===2?smooth((point.x-74)/18):i>=3?smooth((point.y-70)/24):1
    return coverage(point,part.polygon)*attachment*limb
  })
  const total=Math.max(1,weights.reduce((sum,weight)=>sum+weight,0))
  return {point,weights:weights.map(weight=>weight/total)}
}
function map(binding: Binding, pose: DeoxysPose): Point {
  const point = binding.point, result = { ...point }
  const angles = [pose.head, pose.leftArm, pose.rightArm, pose.leftLeg, pose.rightLeg]
  for (let i = 0; i < parts.length; i++) {
    const weight = binding.weights[i]
    if (!weight) continue
    const moved = rotate(point, parts[i].pivot, angles[i])
    result.x += (moved.x - point.x) * weight
    result.y += (moved.y - point.y) * weight
  }
  result.y = 64 + (result.y - 64) * pose.squash
  const tilted = rotate(result, { x: 64, y: 64 }, pose.angle)
  return { x: tilted.x + 32 + pose.x, y: tilted.y + 24 + pose.y }
}
export class DeoxysTexture {
  private nodes: Binding[] = []
  constructor(private source: Uint8ClampedArray) {
    if (source.length !== 128 * 128 * 4) throw new Error('Deoxys requires a 128px RGBA frame')
    for (let y = 0; y <= 128; y += 2) for (let x = 0; x <= 128; x += 2) this.nodes.push(bind({ x, y }))
  }
  render(pose: DeoxysPose): Uint8ClampedArray<ArrayBuffer> {
    const output = new Uint8ClampedArray(DEOXYS_SIZE * DEOXYS_SIZE * 4), mapped = this.nodes.map(node => map(node, pose))
    const triangle = (ia: number, ib: number, ic: number) => {
      const a = mapped[ia], b = mapped[ib], c = mapped[ic], sa = this.nodes[ia].point, sb = this.nodes[ib].point, sc = this.nodes[ic].point
      const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
      if (Math.abs(d) < .01) return
      for (let y = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))); y <= Math.min(DEOXYS_SIZE - 1, Math.ceil(Math.max(a.y, b.y, c.y))); y++) {
        for (let x = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))); x <= Math.min(DEOXYS_SIZE - 1, Math.ceil(Math.max(a.x, b.x, c.x))); x++) {
          const u = ((b.y - c.y) * (x + .5 - c.x) + (c.x - b.x) * (y + .5 - c.y)) / d
          const v = ((c.y - a.y) * (x + .5 - c.x) + (a.x - c.x) * (y + .5 - c.y)) / d, w = 1 - u - v
          if (Math.min(u, v, w) < -.001) continue
          const sx = Math.floor(u * sa.x + v * sb.x + w * sc.x), sy = Math.floor(u * sa.y + v * sb.y + w * sc.y)
          if (sx < 0 || sy < 0 || sx >= 128 || sy >= 128) continue
          const sourceIndex = (sy * 128 + sx) * 4, destination = (y * DEOXYS_SIZE + x) * 4
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
