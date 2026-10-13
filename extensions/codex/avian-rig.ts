import type {AvianForm,AvianLife} from './avian-life'
export type AvianPose={wing:number;head:number;arm:number;leg:number;tail:number;lean:number;lift:number}
type P={x:number;y:number}
const smooth=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)}
export function avianPose(life:AvianLife,index:number,clock=life.elapsed,hit=0,assault=false):AvianPose{
 const t=clock/1000,charge=life.stage.endsWith('charge')?smooth(life.progress):life.stage.endsWith('fire')||assault?1:0
 return{wing:Math.sin(t*4.6+index)*.58-charge*.22,head:-charge*.12,arm:index===2?-charge*.7:0,leg:Math.sin(t*2)*.04,tail:Math.sin(t*2.4)*.12,lean:Math.sin(t)*.02+hit*Math.sin(t*30)*.04,lift:Math.sin(t*2.3)*4-hit*4}
}
export class AvianTexture {
 private pixels:{x:number;y:number;color:number;weights:number[]}[]=[]
 private mouth:P;private pivots:P[]
 constructor(readonly form:AvianForm|string,source:Uint8ClampedArray){
  if(source.length!==128*128*4)throw new Error('Avian pets require 128px RGBA')
  this.mouth=form==='ho-oh'?{x:49,y:58}:form==='lugia'?{x:43,y:64}:form.startsWith('calyrex')?{x:43,y:54}:form==='mega-heatran'?{x:53,y:60}:form==='terapagos-stellar'?{x:64,y:48}:{x:61,y:40};this.pivots=[{x:64,y:58},this.mouth,{x:57,y:57},{x:65,y:87},{x:88,y:70}]
  const rgba=new Uint32Array(source.buffer,source.byteOffset,128*128)
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=y*128+x;if(!source[i*4+3])continue;const bird=form==='ho-oh'||form==='lugia',wing=bird?smooth((Math.abs(x-64)-15)/15)*smooth((75-y)/18):0,head=smooth((54-y)/13)*(1-wing),leg=smooth((y-83)/15),tail=smooth((x-78)/15)*smooth((y-47)/20)*(1-wing),arm=bird?0:smooth((Math.abs(x-64)-8)/18)*smooth((y-45)/12)*smooth((79-y)/12)*(1-tail);const weights=[wing,head,arm,leg,tail],sum=Math.max(1,weights.reduce((a,b)=>a+b,0));this.pixels.push({x,y,color:rgba[i],weights:weights.map(w=>w/sum)})}
 }
 private point(at:P,weights:number[],pose:AvianPose):P{let x=at.x,y=at.y;const angles=[pose.wing*(at.x<64?-1:1),pose.head,pose.arm*(at.x<64?-1:1),pose.leg,pose.tail];for(let i=0;i<5;i++){const q=i===0?{x:at.x<64?48:80,y:64}:this.pivots[i],dx=at.x-q.x,dy=at.y-q.y,a=angles[i],w=weights[i];x+=w*(dx*Math.cos(a)-dy*Math.sin(a)-dx);y+=w*(dx*Math.sin(a)+dy*Math.cos(a)-dy)}const dx=x-64,dy=y-64;return{x:96+dx*Math.cos(pose.lean)-dy*Math.sin(pose.lean),y:88+dx*Math.sin(pose.lean)+dy*Math.cos(pose.lean)+pose.lift}}
 anchor(pose:AvianPose,kind:'mouth'|'hand'='mouth'){return this.point(kind==='mouth'?this.mouth:this.form.startsWith('calyrex')?{x:73,y:34}:{x:46,y:57},kind==='mouth'?[0,1,0,0,0]:[0,0,1,0,0],pose)}
 render(pose:AvianPose):Uint8ClampedArray<ArrayBuffer>{const out=new Uint32Array(192*192);for(const px of this.pixels){const at=this.point(px,px.weights,pose),x=Math.round(at.x),y=Math.round(at.y);for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++)if(x+ox>=0&&x+ox<192&&y+oy>=0&&y+oy<192)out[(y+oy)*192+x+ox]=px.color}return new Uint8ClampedArray(out.buffer)}
}
