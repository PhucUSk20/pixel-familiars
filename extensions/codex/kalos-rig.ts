import type {KalosForm,KalosLife} from './kalos-life'
export type KalosPose={wing:number;head:number;arm:number;leg:number;tail:number;lean:number;lift:number}
type P={x:number;y:number}
const smooth=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)}
export function kalosPose(life:KalosLife,index:number,clock=life.elapsed,hit=0,assault=false):KalosPose{
 const p=life.progress,t=clock/1000,stage=life.stage,charge=stage.endsWith('charge')?smooth(p):stage.endsWith('fire')||assault?1:0
 return{wing:Math.sin(t*2.6+index)*.065-charge*.16,head:charge*(index===2?.2:-.13),arm:index===1&&stage==='arrival'?.8*(1-smooth(p)):charge*-.2+Math.sin(t*2)*.02,leg:Math.sin(t*1.8)*.03,tail:Math.sin(t*2)*.07,lean:Math.sin(t)*.009+Math.sin(t*32)*hit*.045,lift:Math.sin(t*1.7+index)*2-hit*4}
}
/** Weighted attached joints articulate the supplied 128px bodies and preserve source colors. */
export class KalosTexture {
 private pixels:{x:number;y:number;color:number;weights:number[]}[]=[]
 private pivots:P[]
 private mouth:P
 constructor(readonly form:KalosForm,source:Uint8ClampedArray){
  if(source.length!==128*128*4)throw new Error('Kalos pets require 128px RGBA')
  const ice=form.includes('zygarde');this.mouth=form==='xerneas'?{x:54,y:48}:form==='yveltal'?{x:60,y:53}:form.startsWith('mega')?{x:36,y:31}:{x:64,y:56}
  this.pivots=[{x:68,y:46},this.mouth,{x:45,y:64},{x:61,y:83},{x:82,y:73}]
  if(form==='yveltal')this.pivots=[{x:51,y:54},{x:79,y:54},{x:64,y:48},{x:64,y:75},{x:64,y:87}]
  const rgba=new Uint32Array(source.buffer,source.byteOffset,128*128)
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=y*128+x;if(!source[i*4+3])continue
   const head=form==='xerneas'?smooth((55-y)/15)*smooth((80-x)/20):smooth((52-x)/15)*smooth(((ice?81:60)-y)/15),leg=smooth((y-83)/15),wing=smooth((x-54)/18)*smooth((60-y)/18),tail=smooth((x-82)/16)*smooth((y-54)/15)*(1-leg),arm=smooth((y-58)/13)*smooth((80-y)/10)*smooth((64-x)/16)*(1-head)
   const weights=form==='yveltal'?[smooth((54-x)/20),smooth((x-77)/20),smooth((53-y)/12)*smooth((x-49)/12)*smooth((80-x)/12),smooth((y-76)/20),0]:[wing,head,arm,leg,tail],sum=Math.max(1,weights.reduce((a,b)=>a+b,0));this.pixels.push({x,y,color:rgba[i],weights:weights.map(w=>w/sum)})
  }
 }
 private point(at:P,weights:number[],pose:KalosPose):P{let x=at.x,y=at.y;const angles=this.form==='yveltal'?[pose.wing,-pose.wing,pose.head,pose.tail,pose.leg]:[pose.wing,pose.head,pose.arm,pose.leg,pose.tail];for(let i=0;i<5;i++){const q=this.pivots[i],dx=at.x-q.x,dy=at.y-q.y,a=angles[i],w=weights[i];x+=w*(dx*Math.cos(a)-dy*Math.sin(a)-dx);y+=w*(dx*Math.sin(a)+dy*Math.cos(a)-dy)}if(this.form==='yveltal'&&pose.arm>0)x=64+(x-64)*(1-pose.arm*.65);const dx=x-64,dy=y-64;return{x:96+dx*Math.cos(pose.lean)-dy*Math.sin(pose.lean),y:88+dx*Math.sin(pose.lean)+dy*Math.cos(pose.lean)+pose.lift}}
 anchor(pose:KalosPose,kind:'mouth'|'tail'|'back'='mouth'):P{return this.point(kind==='mouth'?this.mouth:kind==='tail'?{x:91,y:74}:this.form==='xerneas'?{x:64,y:30}:this.form==='yveltal'?{x:64,y:57}:{x:64,y:58},kind==='mouth'?[0,1,0,0,0]:kind==='tail'?[0,0,0,0,1]:[1,0,0,0,0],pose)}
 render(pose:KalosPose):Uint8ClampedArray<ArrayBuffer>{const out=new Uint32Array(192*192);for(const px of this.pixels){const at=this.point(px,px.weights,pose),x=Math.round(at.x),y=Math.round(at.y);for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++)if(x+ox>=0&&x+ox<192&&y+oy>=0&&y+oy<192)out[(y+oy)*192+x+ox]=px.color}return new Uint8ClampedArray(out.buffer)}
}
