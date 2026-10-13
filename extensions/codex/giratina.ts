import type {CreationLife} from './creation-life'
type Point={x:number;y:number}
export type GiratinaPose={head:number;jaw:number;leftWing:number;rightWing:number;legs:number;tail:number;lift:number}
const smooth=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)}
export function giratinaHeight(life:CreationLife):number {
 return life.stage==='arrival'?224*(1-smooth(Math.max(0,(life.phaseProgress-.15)/.85))):life.stage==='departure'?224*smooth(life.phaseProgress):0
}
export function giratinaPose(life:CreationLife,hit=0,assault=false):GiratinaPose {
 const t=life.elapsed/1000,charge=life.stage.endsWith('charge')?smooth(life.phaseProgress):0,firing=assault||life.stage.endsWith('fire')
 return {head:Math.sin(t*1.4)*.025-charge*.1-hit*.12,jaw:firing?.2:0,
  leftWing:-.06-Math.sin(t*2.2)*.08-charge*.2,rightWing:.06+Math.sin(t*2.2)*.08+charge*.2,
  legs:Math.sin(t*1.7)*.025,tail:Math.sin(t*1.5)*.06,lift:Math.sin(t*1.4)*2-hit*4}
}
/** Native source colors and connected joints retain the supplied Altered Forme silhouette. */
export class GiratinaTexture {
 private pixels:{x:number;y:number;color:number;weights:number[]}[]=[]
 private pivots=[{x:64,y:37},{x:64,y:44},{x:45,y:46},{x:83,y:46},{x:64,y:82},{x:88,y:73}]
 constructor(source:Uint8ClampedArray){
  if(source.length!==128*128*4)throw new Error('Giratina requires a 128px source')
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const i=(y*128+x)*4;if(!source[i+3])continue
   const center=smooth((x-43)/10)*smooth((85-x)/10),head=center*smooth((48-y)/13),jaw=head*smooth((y-39)/7)
   const left=smooth((48-x)/14)*smooth((69-y)/15),right=smooth((x-81)/14)*smooth((69-y)/15)
   const legs=smooth((y-81)/14),tail=smooth((x-86)/13)*smooth((y-59)/12)*(1-legs)
   const weights=[head*(1-jaw),jaw,left,right,legs,tail],total=weights.reduce((a,b)=>a+b,0)
   if(total>1)for(let j=0;j<weights.length;j++)weights[j]/=total
   this.pixels.push({x,y,color:(source[i]|source[i+1]<<8|source[i+2]<<16|source[i+3]<<24)>>>0,weights})
  }
 }
 private angles(pose:GiratinaPose):number[]{return [pose.head,pose.jaw,pose.leftWing,pose.rightWing,pose.legs,pose.tail]}
 anchor(kind:'mouth'|'left'|'right',pose:GiratinaPose):Point {
  const x=kind==='mouth'?64:kind==='left'?53:75,y=kind==='mouth'?45:62
  return {x:x+32,y:y+24+pose.lift}
 }
 render(pose:GiratinaPose,shadow=0):Uint8ClampedArray<ArrayBuffer>{
  const out=new Uint32Array(192*192),angles=this.angles(pose),joints=this.pivots.map((pivot,i)=>({...pivot,c:Math.cos(angles[i]),s:Math.sin(angles[i])}))
  for(const pixel of this.pixels){
   let x=pixel.x,y=pixel.y
   for(let j=0;j<joints.length;j++){const v=joints[j],dx=pixel.x-v.x,dy=pixel.y-v.y,w=pixel.weights[j];x+=w*(dx*v.c-dy*v.s-dx);y+=w*(dx*v.s+dy*v.c-dy)}
   const tx=Math.round(x+32),ty=Math.round(y+24+pose.lift),color=shadow?((Math.round((pixel.color&255)*(1-shadow)+27*shadow)|Math.round((pixel.color>>>8&255)*(1-shadow)+21*shadow)<<8|Math.round((pixel.color>>>16&255)*(1-shadow)+35*shadow)<<16|255<<24)>>>0):pixel.color
   for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++)if(tx+ox>=0&&tx+ox<192&&ty+oy>=0&&ty+oy<192)out[(ty+oy)*192+tx+ox]=color
  }
  return new Uint8ClampedArray(out.buffer)
 }
}

export function giratinaShieldActive(life:CreationLife,judgment=false):boolean {
 return life.active&&life.trio&&(life.stage==='arrival'||judgment&&life.shadowShield)
}
/** Exterior dilation follows every articulated limb, leaving source body colors untouched. */
export function giratinaAura(body:Uint8ClampedArray,clock:number):Uint8ClampedArray<ArrayBuffer> {
 if(body.length!==192*192*4)throw new Error('Giratina aura requires a 192px articulated sprite')
 const out=new Uint8ClampedArray(body.length),pulse=.85+.15*Math.sin(clock*.006)
 const opaque=(x:number,y:number)=>x>=0&&y>=0&&x<192&&y<192&&body[(y*192+x)*4+3]>0
 for(let y=1;y<191;y++)for(let x=1;x<191;x++){
  if(!opaque(x,y)||opaque(x-1,y)&&opaque(x+1,y)&&opaque(x,y-1)&&opaque(x,y+1))continue
  for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){
   const d=Math.hypot(dx,dy),tx=x+dx,ty=y+dy
   if(d>6||tx<0||ty<0||tx>=192||ty>=192||opaque(tx,ty))continue
   const i=(ty*192+tx)*4,alpha=Math.round((d<=2?215:(6-d)*25)*pulse)
   if(alpha<=out[i+3])continue
   out.set(d<=2?[204,110,255,alpha]:[125,48,204,alpha],i)
  }
 }
 return out
}
export function giratinaShieldCrown(body:Uint8ClampedArray,origin:Point):Point {
 for(let y=0;y<192;y++)for(let x=90;x<=102;x++)if(body[(y*192+x)*4+3])return {x:origin.x+x,y:origin.y+y-2}
 return {x:origin.x+96,y:origin.y+24}
}
