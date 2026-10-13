import type { CreationLife } from './creation-life'
export type CreationSpecies = 'palkia' | 'dialga'
export type CreationPose = { head: number; jaw: number; arm: number; leg: number; tail: number; lift: number; lean: number }
type Point = { x: number; y: number }
const smooth = (n: number) => { n = Math.max(0,Math.min(1,n)); return n*n*(3-2*n) }
export function creationPose(species: CreationSpecies, life: CreationLife, fright = 0, hit = 0, assault = false): CreationPose {
  const t=life.elapsed/1000, stage=life.stage, p=life.phaseProgress
  const charge=stage==='signature-charge'?smooth(p):stage==='signature-fire'?1:0
  const firing=assault||stage==='ordinary-fire'||stage==='signature-fire'
  return { head:(species==='dialga'?.18:-.08)*charge + Math.sin(t*1.4)*.018 - fright*.08,
    jaw:firing?-.22:Math.sin(t)*.012,
    arm:species==='palkia'?(life.ordinary==='orb'&&stage==='ordinary-charge'?-.5*smooth(p):life.ordinary==='orb'&&stage==='ordinary-fire'?-.5+.8*smooth(p/.4):stage==='signature-charge'?-.85*smooth(p):stage==='signature-fire'?-.85+1.95*smooth(p/.3):Math.sin(t*1.7)*.035):Math.sin(t*1.7)*.035,
    leg:Math.sin(t*1.5)*.025,tail:Math.sin(t*1.1)*.05,
    lift:Math.sin(t*1.5)*1.7-Math.sin(Math.PI*Math.min(1,hit))*3,
    lean:(firing?Math.sin(Math.min(1,p*5)*Math.PI)*.018:0)+Math.sin(t*28)*fright*.007+Math.sin(t*41)*hit*.025 }
}
type Pixel = { x: number; y: number; color: number; weights: number[] }
/** Connected source-textured joints retain the two supplied silhouettes at native 1:1 scale. */
export class CreationTexture {
  private pixels: Pixel[]=[]
  private pivots: Point[]
  constructor(private species: CreationSpecies, source: Uint8ClampedArray) {
    if(source.length!==128*128*4)throw new Error('Creation pets require a 128px RGBA frame')
    this.pivots=species==='palkia'?[{x:44,y:40},{x:32,y:39},{x:67,y:48},{x:61,y:79},{x:88,y:77}]:[{x:42,y:45},{x:36,y:38},{x:42,y:73},{x:61,y:86},{x:83,y:76}]
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const i=(y*128+x)*4;if(!source[i+3])continue
      const head=smooth((48-y)/14)*smooth((66-x)/20)
      const jaw=head*smooth((37-x)/8)*smooth((y-33)/8)
      const arm=species==='palkia'?smooth((y-48)/9)*smooth((75-y)/8)*smooth((x-56)/9)*smooth((86-x)/8):smooth((y-70)/12)*smooth((54-x)/16)*.25
      const leg=smooth((y-80)/13),tail=smooth((x-82)/15)*smooth((y-64)/12)*(1-leg)
      const weights=[head*(1-jaw),jaw,arm*(1-leg),leg,tail]
      const total=weights.reduce((a,b)=>a+b,0)
      if(total>1)for(let j=0;j<weights.length;j++)weights[j]/=total
      this.pixels.push({x,y,weights,color:(source[i]|source[i+1]<<8|source[i+2]<<16|source[i+3]<<24)>>>0})
    }
  }
  private angles(pose: CreationPose): number[] { return [pose.head,pose.jaw,pose.arm,pose.leg,pose.tail] }
  private point(point: Point, weights: number[], pose: CreationPose): Point {
    let x=point.x,y=point.y;const angles=this.angles(pose)
    for(let j=0;j<this.pivots.length;j++){
      const pivot=this.pivots[j],dx=point.x-pivot.x,dy=point.y-pivot.y,c=Math.cos(angles[j]),s=Math.sin(angles[j])
      x+=weights[j]*(dx*c-dy*s-dx);y+=weights[j]*(dx*s+dy*c-dy)
    }
    const dx=x-64,dy=y-64,c=Math.cos(pose.lean),s=Math.sin(pose.lean)
    return {x:96+dx*c-dy*s,y:88+dx*s+dy*c+pose.lift}
  }
  anchor(kind: 'mouth' | 'gem' | 'hand', pose: CreationPose): Point {
    if(this.species==='palkia')return kind==='mouth'?this.point({x:26,y:37},[1,.2,0,0,0],pose):kind==='gem'?this.point({x:71,y:48},[0,0,0,0,0],pose):this.point({x:74,y:65},[0,0,1,0,0],pose)
    return kind==='mouth'?this.point({x:30,y:39},[1,.15,0,0,0],pose):kind==='gem'?this.point({x:35,y:32},[1,0,0,0,0],pose):this.point({x:42,y:82},[0,0,1,0,0],pose)
  }
  render(pose: CreationPose): Uint8ClampedArray<ArrayBuffer> {
    const out=new Uint32Array(192*192),angles=this.angles(pose),joints=this.pivots.map((pivot,j)=>({...pivot,c:Math.cos(angles[j]),s:Math.sin(angles[j])})),c=Math.cos(pose.lean),s=Math.sin(pose.lean)
    for(const pixel of this.pixels){
      let x=pixel.x,y=pixel.y
      for(let j=0;j<joints.length;j++){const joint=joints[j],dx=pixel.x-joint.x,dy=pixel.y-joint.y,w=pixel.weights[j];x+=w*(dx*joint.c-dy*joint.s-dx);y+=w*(dx*joint.s+dy*joint.c-dy)}
      const dx=x-64,dy=y-64,tx=Math.round(96+dx*c-dy*s),ty=Math.round(88+dx*s+dy*c+pose.lift)
      for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++)if(tx+ox>=0&&tx+ox<192&&ty+oy>=0&&ty+oy<192)out[(ty+oy)*192+tx+ox]=pixel.color
    }
    return new Uint8ClampedArray(out.buffer)
  }
}
