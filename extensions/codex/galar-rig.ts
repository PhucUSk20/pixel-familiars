import type {GalarForm,GalarLife} from './galar-life'
export type GalarPose={wing:number;head:number;arm:number;leg:number;tail:number;lean:number;lift:number}
type P={x:number;y:number}
const smooth=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)}
export function galarPose(life:GalarLife,index:number,clock=life.elapsed,hit=0,assault=false):GalarPose{
 const p=life.progress,t=clock/1000,stage=life.stage,charge=stage.endsWith('charge')?smooth(p):stage.endsWith('fire')||stage==='hero-rush'||stage==='final-strike'||assault?1:0
 return{wing:Math.sin(t*2.6+index)*.065-charge*.12,head:charge*(index===2?.12:-.1),arm:charge*-.16,leg:Math.sin(t*(stage.includes('rush')||stage.includes('strike')?18:3))* .09,tail:Math.sin(t*2)*.1,lean:Math.sin(t)*.009+Math.sin(t*32)*hit*.045,lift:Math.sin(t*1.7+index)*2-hit*4}
}
/** Weighted attached joints articulate the supplied 128px bodies and preserve source colors. */
export class GalarTexture {
 private pixels:{x:number;y:number;color:number;weights:number[]}[]=[]
 private pivots:P[]
 private mouth:P
 constructor(readonly form:GalarForm,source:Uint8ClampedArray){
  if(source.length!==128*128*4)throw new Error('Galar pets require 128px RGBA')
  this.mouth=form==='zacian-crowned'?{x:98,y:60}:form==='zamazenta-crowned'?{x:34,y:61}:form==='eternatus-eternamax'?{x:91,y:41}:{x:36,y:45}
  this.pivots=[{x:72,y:55},this.mouth,{x:48,y:60},{x:61,y:86},{x:86,y:77}]
  const rgba=new Uint32Array(source.buffer,source.byteOffset,128*128)
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=y*128+x;if(!source[i*4+3])continue
   const head=form==='zacian-crowned'?smooth((x-76)/16)*smooth((80-y)/20):form==='zamazenta-crowned'?smooth((53-x)/16)*smooth((80-y)/20):smooth((60-y)/16),leg=smooth((y-82)/14),wing=smooth((x-57)/18)*smooth((65-y)/18),tail=smooth((x-78)/18)*smooth((y-57)/18)*(1-leg),arm=smooth((y-52)/15)*smooth((80-y)/12)*smooth((60-x)/16)*(1-head)
   const weights=[wing,head,arm,leg,tail],sum=Math.max(1,weights.reduce((a,b)=>a+b,0));this.pixels.push({x,y,color:rgba[i],weights:weights.map(w=>w/sum)})
  }
 }
 private point(at:P,weights:number[],pose:GalarPose):P{let x=at.x,y=at.y;const angles=[pose.wing,pose.head,pose.arm,pose.leg,pose.tail];for(let i=0;i<5;i++){const q=this.pivots[i],dx=at.x-q.x,dy=at.y-q.y,a=angles[i],w=weights[i];x+=w*(dx*Math.cos(a)-dy*Math.sin(a)-dx);y+=w*(dx*Math.sin(a)+dy*Math.cos(a)-dy)}const dx=x-64,dy=y-64;return{x:96+dx*Math.cos(pose.lean)-dy*Math.sin(pose.lean),y:88+dx*Math.sin(pose.lean)+dy*Math.cos(pose.lean)+pose.lift}}
 anchor(pose:GalarPose,kind:'mouth'|'tail'|'back'='mouth'):P{return this.point(kind==='mouth'?this.mouth:kind==='tail'?{x:91,y:74}:this.form==='zamazenta-crowned'?{x:40,y:63}:this.form==='eternatus-eternamax'?{x:91,y:41}:{x:65,y:60},kind==='mouth'?[0,1,0,0,0]:kind==='tail'?[0,0,0,0,1]:[1,0,0,0,0],pose)}
 render(pose:GalarPose):Uint8ClampedArray<ArrayBuffer>{const out=new Uint32Array(192*192);for(const px of this.pixels){const at=this.point(px,px.weights,pose),x=Math.round(at.x),y=Math.round(at.y);for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++)if(x+ox>=0&&x+ox<192&&y+oy>=0&&y+oy<192)out[(y+oy)*192+x+ox]=px.color}return new Uint8ClampedArray(out.buffer)}
}
