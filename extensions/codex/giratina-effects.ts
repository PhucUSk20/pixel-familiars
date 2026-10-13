import {giratinaAura,giratinaShieldCrown} from './giratina'
import {giratinaClashes,giratinaOrbCenters,type ShadowAnchors} from './giratina-clash'
import type {CreationLife} from './creation-life'
import type {CreationAnchors} from './creation-effects'
type Point={x:number;y:number}
export function giratinaHits(life:CreationLife):{body:number;rivals:number}{
 if(!life.active||!life.trio||life.held)return {body:0,rivals:0}
 const p=life.phaseProgress,impact=life.stage.endsWith('impact'),shock=impact?Math.max(0,1-p*2)*.5:0
 // Countering skills collide in mid-air; only the explosion shock causes recoil.
 return {body:shock,rivals:shock}
}
export function giratinaOrbs(phase:number,origins:Point[],targets:Point[]):{position:Point;target:Point;progress:number}[]{
 if(phase<.18||phase>1)return []
 const f=Math.min(1,(phase-.18)/.32)
 return targets.map((target,index)=>{const source=origins[index];return {target,progress:f,position:f===1?{...target}:{x:source.x+(target.x-source.x)*f,y:source.y+(target.y-source.y)*f-Math.sin(f*Math.PI)*18}}})
}
export function drawGiratinaEffects(ctx:CanvasRenderingContext2D,life:CreationLife,anchors:ShadowAnchors,rivals:CreationAnchors[]):void {
 if(!life.active||!life.trio)return
 const stage=life.stage,p=life.phaseProgress,t=life.elapsed/1000
 const clashes=giratinaClashes(rivals[0],rivals[1],anchors,stage.startsWith('signature'),life.ordinary==='orb')
 const px=(x:number,y:number,w:number,h:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
 const ring=(at:Point,r:number,color:string,flat=1)=>{for(let i=0;i<80;i++){const a=i*Math.PI/40;px(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*flat,2,2,color)}}
 const orb=(at:Point,r:number,color:string)=>{for(let y=-r;y<=r;y++){const w=Math.sqrt(Math.max(0,r*r-y*y));px(at.x-w,at.y+y,w*2,1,color)}ring(at,r+2,'#e3a6ff');px(at.x-r*.3,at.y-r*.3,r*.5,r*.5,'#f8dbff')}
 const line=(a:Point,b:Point,color:string,size=2)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));for(let i=0;i<=n;i++){const f=i/n;px(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,size,size,color)}}
 const burst=(at:Point,power:number)=>{ring(at,7+power*32,'#c67beb');for(let i=0;i<30;i++){const a=i*2.4,r=(t*25+i*3)%35;px(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r,2,3,i%4?'#9e58cd':'#f3dcff')}}
 ctx.save();ctx.globalAlpha=life.opacity
 if(stage==='arrival'||stage==='departure'){
  const cx=life.giratina.x+96,power=stage==='arrival'?Math.min(1,p*4):1-p
  // A dark ground rupture with a violet lip and boiling black tendrils.
  ctx.globalAlpha=power;ctx.fillStyle='#07060c'
  for(let row=-14;row<=14;row++){const w=Math.sqrt(Math.max(0,14*14-row*row))*5;px(cx-w,184+row,w*2,1,'#07060c')}
  for(let j=0;j<3;j++)ring({x:cx,y:184},68-j*8,j?'#4f2768':'#a860d4',.2)
  for(let i=0;i<16;i++){
   const x=cx+(i-7.5)*7,height=(18+Math.sin(t*6+i)*9)*power
   for(let y=0;y<height;y++)px(x+Math.sin(y*.18+t*3+i)*4,184-y,3,2,i%3?'#15101e':'#4c2861')
  }
 }
 if(stage.endsWith('charge')){
  for(const at of [anchors.left,anchors.right]){
   orb(at,2+p*(stage==='signature-charge'?22:10),'#632393');ring(at,8+p*23,'#a85be1')
   for(let j=0;j<4;j++){const r=28*(1-p)+j*3,a=t*4+j*Math.PI/2;line({x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},at,'#b966e4',1)}
  }
 }
 if(stage==='ordinary-fire'){
  const reach=Math.min(1,p/.42)
  for(const [index,target] of clashes.entries()){
   const end={x:anchors.mouth.x+(target.x-anchors.mouth.x)*reach,y:anchors.mouth.y+(target.y-anchors.mouth.y)*reach}
   let previous=anchors.mouth
   for(let i=1;i<=24;i++){const f=i/24,at={x:anchors.mouth.x+(end.x-anchors.mouth.x)*f,y:anchors.mouth.y+(end.y-anchors.mouth.y)*f+Math.sin(f*10+t*6+index)*9*Math.sin(f*Math.PI)};line(previous,at,'#31163f',6);line(previous,at,'#9251be',2);previous=at}
  }
 }
 if(stage==='signature-fire'){
  const sources=[anchors.left,anchors.right],targets=giratinaOrbCenters(clashes,sources)
  for(const [index,shot] of giratinaOrbs(p,sources,targets).entries()){
   for(let j=6;j>0;j--){const f=Math.max(0,shot.progress-j*.035),from=sources[index];ctx.globalAlpha=life.opacity*(.24-j*.025);orb({x:from.x+(shot.target.x-from.x)*f,y:from.y+(shot.target.y-from.y)*f-Math.sin(f*Math.PI)*18},9,'#6d288e')}
   ctx.globalAlpha=life.opacity
   for(let layer=4;layer>0;layer--){ctx.globalAlpha=life.opacity*.06;orb(shot.position,24+layer*3,'#8032b5')}
   ctx.globalAlpha=life.opacity;orb(shot.position,25,'#281037');orb(shot.position,20,'#672693');orb(shot.position,12,'#c063eb')
   for(let band=0;band<1;band++)ring(shot.position,25+Math.sin(t*13)*1.5,band%2?'#ad5bf3':'#e5a4ff',.75+band*.12)
   for(let i=0;i<8;i++){const a=i*.9+t*6,r=3+i*.8;px(shot.position.x+Math.cos(a)*r,shot.position.y+Math.sin(a)*r,2,2,i%3?'#df94fa':'#fff0ff')}
  }
 }
 // Two sustained pressure fronts, then two distinct radial explosions.
 const fire=stage.endsWith('fire'),impact=stage.endsWith('impact'),strong=stage.startsWith('signature'),contact=strong?.5:.42
 if((fire&&p>=contact)||impact)for(const [index,at] of clashes.entries()){
  const power=impact?1-p:1,r=strong?13:9
  ctx.globalAlpha=life.opacity*power
  for(let layer=1;layer>=0;layer--){ctx.globalAlpha=life.opacity*power*(layer?.08:1);orb(at, (impact?r*(1-p):4+Math.sin(t*24+index))+layer*5,layer?'#a149dc':'#efe1ff')}
  ctx.globalAlpha=life.opacity*power
  for(let band=0;band<1;band++)ring(at,r+((t*18)%9)+(impact?p*8:0),band%2?'#b26afa':'#faf0ff',.65+band*.18)
  for(let i=0;i<10;i++){const a=i*2.399+t*.8,d=(t*35+i*7)%(strong?22:15);line({x:at.x+Math.cos(a)*d,y:at.y+Math.sin(a)*d},{x:at.x+Math.cos(a)*(d+3),y:at.y+Math.sin(a)*(d+3)},i%3?'#c66cf0':'#ffffff',i%4?1:2)}
  for(let i=0;i<3;i++){const a=i*2.1+t*3,radius=r+5+Math.sin(t*13+i)*3;line(at,{x:at.x+Math.cos(a)*radius,y:at.y+Math.sin(a)*radius},index?'#87dcff':'#f6a4ff',2)}
 }
 const hit=giratinaHits(life).body
 if(hit){ctx.globalAlpha=hit;burst(anchors.mouth,.8);ring(anchors.mouth,24,'#89dfff')}
 ctx.restore()
}

/** A violet contour follows the sprite instead of enclosing it in a circular dome. */
export function drawGiratinaShield(ctx:CanvasRenderingContext2D,body:Uint8ClampedArray,origin:Point,hit:number,clock:number):void {
 const aura=giratinaAura(body,clock),crown=giratinaShieldCrown(body,origin)
 const alpha=ctx.globalAlpha
 ctx.save()
 for(let y=0;y<192;y++)for(let x=0;x<192;x++){
  const i=(y*192+x)*4;if(!aura[i+3])continue
  ctx.globalAlpha=alpha*aura[i+3]/255;ctx.fillStyle=aura[i]===204?'#cc6eff':'#7d30cc'
  ctx.fillRect(Math.round(origin.x+x),Math.round(origin.y+y),1,1)
 }
 if(hit){ctx.globalAlpha=alpha*hit;for(let i=0;i<12;i++){const a=i*2.399,rad=3+(clock*.035+i*3)%12;ctx.fillStyle=i%3?'#c889ff':'#fff0ff';ctx.fillRect(Math.round(crown.x+Math.cos(a)*rad),Math.round(crown.y+Math.sin(a)*rad*.5),1,2)}}
 ctx.restore()
}
