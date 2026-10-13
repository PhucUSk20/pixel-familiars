import type {SunMoonLife} from './sun-moon-life'
export type CelestialSpecies='lunala'|'solgaleo'
export type CelestialPose={wing:number;fold:number;mane:number;head:number;leg:number;tail:number;lean:number;lift:number}
type P={x:number;y:number}
const smooth=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)}
export function celestialPose(species:CelestialSpecies,life:SunMoonLife):CelestialPose {
 const t=life.elapsed/1000,p=life.progress,stage=life.stage,charge=stage==='signature-charge'?smooth(p):stage==='signature-fire'?1:0
 const fold=species==='lunala'?(stage==='ordinary-charge'?smooth(p)*.85:stage==='ordinary-fire'?.85*(1-smooth(p/.28)):0):0
 const mane=species==='solgaleo'?(stage==='signature-impact'?1-smooth(p):charge):0
 return {wing:Math.sin(t*2.8)*.075-charge*.13,fold,mane,head:charge*(species==='solgaleo'?.32:.12)+(stage==='ordinary-fire'?-.12:0),leg:species==='solgaleo'?(stage==='signature-charge'||stage==='signature-fire'?-.27*Math.max(charge,.4):Math.sin(t*2.5)*.035):Math.sin(t*2)*.02,tail:Math.sin(t*2.1)*.12,lift:Math.sin(t*1.6)*2,lean:Math.sin(t)*.008}
}
/** Connected weighted joints move the supplied body pixels; no replacement anatomy. */
export class CelestialTexture {
 private pixels:{x:number;y:number;color:number;weights:number[];maneWeight:number}[]=[]
 private pivots:P[]
 constructor(readonly species:CelestialSpecies,source:Uint8ClampedArray){
  if(source.length!==128*128*4)throw new Error('Celestial pets require 128px RGBA')
  this.pivots=species==='lunala'?[{x:51,y:64},{x:79,y:64},{x:67,y:52},{x:68,y:89},{x:67,y:89}]:[{x:40,y:57},{x:76,y:58},{x:40,y:50},{x:59,y:83},{x:88,y:75}]
  const rgba=new Uint32Array(source.buffer,source.byteOffset,128*128)
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=y*128+x;if(!source[i*4+3])continue
   const weights=species==='lunala'?[smooth((53-x)/15),smooth((x-78)/15),smooth((56-y)/12)*smooth((x-48)/14)*smooth((86-x)/14),smooth((y-84)/20)*.2,0]:[0,0,smooth((61-y)/16)*smooth((61-x)/15),smooth((y-81)/15),smooth((x-86)/12)*smooth((86-y)/12)]
   const color=source.slice(i*4,i*4+3),maneColor=color[0]>150&&color[1]>100&&(color[2]>110||color[2]<100)
   const maneWeight=species==='solgaleo'&&maneColor?smooth((Math.hypot(x-43,y-50)-10)/15)*smooth((80-y)/10)*smooth((83-x)/12):0
   const sum=Math.max(1,weights.reduce((a,b)=>a+b,0));this.pixels.push({x,y,color:rgba[i],weights:weights.map(w=>w/sum),maneWeight})
  }
 }
 private point(point:P,weights:number[],pose:CelestialPose,maneWeight=0):P {
  const angles=[pose.wing,-pose.wing,pose.head,pose.leg,pose.tail];let x=point.x,y=point.y
  for(let j=0;j<5;j++){const pivot=this.pivots[j],dx=point.x-pivot.x,dy=point.y-pivot.y,a=angles[j],w=weights[j];x+=w*(dx*Math.cos(a)-dy*Math.sin(a)-dx);y+=w*(dx*Math.sin(a)+dy*Math.cos(a)-dy)}
  if(this.species==='lunala'){const weight=weights[0]+weights[1];x+=(67-x)*pose.fold*.42*weight;y-=pose.fold*6*weight}
  if(this.species==='solgaleo'){const cx=40+3*Math.cos(pose.head),cy=50+3*Math.sin(pose.head);x+=(x-cx)*pose.mane*.32*maneWeight;y+=(y-cy)*pose.mane*.36*maneWeight}
  const dx=x-64,dy=y-64;return{x:96+dx*Math.cos(pose.lean)-dy*Math.sin(pose.lean),y:88+dx*Math.sin(pose.lean)+dy*Math.cos(pose.lean)+pose.lift}
 }
 anchor(pose:CelestialPose,kind:'mouth'|'forehead'='mouth'):P {return this.point(this.species==='lunala'?{x:67,y:57}:kind==='forehead'?{x:42,y:46}:{x:42,y:58},[0,0,1,0,0],pose)}
 render(pose:CelestialPose):Uint8ClampedArray<ArrayBuffer> {
  const out=new Uint32Array(192*192)
  for(const pixel of this.pixels){const p=this.point(pixel,pixel.weights,pose,pixel.maneWeight),x=Math.round(p.x),y=Math.round(p.y);for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++)if(x+ox>=0&&x+ox<192&&y+oy>=0&&y+oy<192)out[(y+oy)*192+x+ox]=pixel.color}
  return new Uint8ClampedArray(out.buffer)
 }
}
