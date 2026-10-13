import type {UnovaForm,UnovaLife} from './unova-life'
export type UnovaPose={wing:number;head:number;arm:number;leg:number;tail:number;lean:number;lift:number}
type P={x:number;y:number}
const smooth=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)}
export function unovaPose(life:UnovaLife,index:number,clock=life.elapsed,hit=0,assault=false):UnovaPose{
 const p=life.progress,t=clock/1000,stage=life.stage,charge=stage.endsWith('charge')?smooth(p):stage.endsWith('fire')||assault?1:0
 return{wing:Math.sin(t*2.6+index)*.065-charge*.16,head:charge*(index===2?.2:-.13),arm:charge*-.2+Math.sin(t*2)*.02,leg:Math.sin(t*1.8)*.03,tail:Math.sin(t*2)*.07,lean:Math.sin(t)*.009+Math.sin(t*32)*hit*.045,lift:Math.sin(t*1.7+index)*2-hit*4}
}
/** Weighted attached joints articulate the supplied 128px bodies and preserve source colors. */
export class UnovaTexture {
 private pixels:{x:number;y:number;color:number;weights:number[]}[]=[]
 private pivots:P[]
 private mouth:P
 constructor(readonly form:UnovaForm,source:Uint8ClampedArray){
  if(source.length!==128*128*4)throw new Error('Unova pets require 128px RGBA')
  const ice=form.startsWith('kyurem');this.mouth=ice?{x:29,y:72}:{x:32,y:47}
  this.pivots=[{x:70,y:47},ice?{x:48,y:61}:{x:43,y:44},{x:49,y:70},{x:60,y:84},{x:83,y:75}]
  const rgba=new Uint32Array(source.buffer,source.byteOffset,128*128)
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=y*128+x;if(!source[i*4+3])continue
   const head=smooth((52-x)/15)*smooth(((ice?81:60)-y)/15),leg=smooth((y-83)/15),wing=smooth((x-54)/18)*smooth((60-y)/18),tail=smooth((x-82)/16)*smooth((y-54)/15)*(1-leg),arm=smooth((y-58)/13)*smooth((80-y)/10)*smooth((64-x)/16)*(1-head)
   const weights=[wing,head,arm,leg,tail],sum=Math.max(1,weights.reduce((a,b)=>a+b,0));this.pixels.push({x,y,color:rgba[i],weights:weights.map(w=>w/sum)})
  }
 }
 private point(at:P,weights:number[],pose:UnovaPose):P{let x=at.x,y=at.y;const angles=[pose.wing,pose.head,pose.arm,pose.leg,pose.tail];for(let i=0;i<5;i++){const q=this.pivots[i],dx=at.x-q.x,dy=at.y-q.y,a=angles[i],w=weights[i];x+=w*(dx*Math.cos(a)-dy*Math.sin(a)-dx);y+=w*(dx*Math.sin(a)+dy*Math.cos(a)-dy)}const dx=x-64,dy=y-64;return{x:96+dx*Math.cos(pose.lean)-dy*Math.sin(pose.lean),y:88+dx*Math.sin(pose.lean)+dy*Math.cos(pose.lean)+pose.lift}}
 anchor(pose:UnovaPose,kind:'mouth'|'tail'|'back'='mouth'):P{return this.point(kind==='mouth'?this.mouth:kind==='tail'?{x:91,y:74}:{x:70,y:48},kind==='mouth'?[0,1,0,0,0]:kind==='tail'?[0,0,0,0,1]:[1,0,0,0,0],pose)}
 render(pose:UnovaPose):Uint8ClampedArray<ArrayBuffer>{const out=new Uint32Array(192*192);for(const px of this.pixels){const at=this.point(px,px.weights,pose),x=Math.round(at.x),y=Math.round(at.y);for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++)if(x+ox>=0&&x+ox<192&&y+oy>=0&&y+oy<192)out[(y+oy)*192+x+ox]=px.color}return new Uint8ClampedArray(out.buffer)}
}
