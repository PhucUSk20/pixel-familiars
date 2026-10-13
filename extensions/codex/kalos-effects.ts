import {drawPlasmaRings} from './plasma-rings'
import type {KalosLife} from './kalos-life'
type P={x:number;y:number}
export type KalosAnchors={mouth:P;tail:P;back:P}
export const RAINBOW=['#ff729a','#ffa64c','#fff297','#7cef9d','#67eaff','#849cff','#da89ff'] as const
export function coreGlyph(center:P,radius:number):P[]{return[{x:center.x-radius,y:center.y-radius*.55},{x:center.x+radius,y:center.y-radius*.55},{x:center.x-radius,y:center.y+radius*.55},{x:center.x+radius,y:center.y+radius*.55}]}
export function drawKalosEffects(ctx:CanvasRenderingContext2D,life:KalosLife,anchors:KalosAnchors[],behind=false):void{
 if(!life.active)return
 const [x,y,z]=anchors,stage=life.stage,p=life.progress,t=life.elapsed/1000,front={x:(x.mouth.x+y.mouth.x)/2,y:(x.mouth.y+y.mouth.y)/2},cannon=z.mouth
 const px=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
 const line=(a:P,b:P,c:string,w=1)=>{const d=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));for(let i=0;i<=d;i+=Math.max(1,w*.4))px(a.x+(b.x-a.x)*i/d-w/2,a.y+(b.y-a.y)*i/d-w/2,w,w,c)}
 const ring=(at:P,r:number,c:string,flat=1)=>{for(let i=0;i<96;i++){const a=i*Math.PI/48;px(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*flat,2,1,c)}}
 const orb=(at:P,r:number,c:string)=>{for(let yy=-Math.ceil(r);yy<=r;yy++){const w=Math.sqrt(Math.max(0,r*r-yy*yy));px(at.x-w,at.y+yy,w*2,1,c)}}
 const burst=(at:P,q:number,c:string)=>{if(q<=0)return;orb(at,5+q*14,'#f5ffff');ring(at,12+(1-q)*30,c);for(let i=0;i<14;i++){const a=i*2.399,r=14+(1-q)*36;line({x:at.x+Math.cos(a)*r*.4,y:at.y+Math.sin(a)*r*.4},{x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},i%3?c:'#ffffff',i%4?1:3)}}
 const bolt=(a:P,b:P,c:string)=>{let prev=a;for(let i=1;i<=14;i++){const u=i/14,at={x:a.x+(b.x-a.x)*u+(i===14?0:Math.sin(i*19+t*30)*5),y:a.y+(b.y-a.y)*u};line(prev,at,c,2);prev=at}}
 const beam=(a:P,b:P,q:number,colors:readonly string[],radius=18)=>{const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),nx=-dy/d,ny=dx/d;for(let j=0;j<colors.length;j++){const half=radius*q*(1-j/colors.length*.82);ctx.beginPath();for(const side of [-1,1])for(let i=0;i<=45;i++){const u=(side<0?i:45-i)/45,h=half*(.55+.6*u),wave=Math.sin(u*28-t*15)*h*.08,xx=Math.round(a.x+dx*u+nx*(side*h+wave)),yy=Math.round(a.y+dy*u+ny*(side*h+wave));if(side<0&&i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.closePath();ctx.fillStyle=colors[j];ctx.fill()}drawPlasmaRings(ctx,a,b,t*1000,q)}
 const hex=(at:P,r:number,c:string,flat=.8)=>{const points=Array.from({length:6},(_,i)=>{const a=i*Math.PI/3+Math.PI/6;return{x:at.x+Math.cos(a)*r*flat,y:at.y+Math.sin(a)*r}});points.forEach((a,i)=>line(a,points[(i+1)%6],c,2))}
 ctx.save();ctx.globalAlpha=life.opacity
 if(behind){
  if(stage==='arrival'&&life.fullRoster){hex(cannon,28+p*22,'#d99cff');orb(cannon,18*(1-p),'#ead7ff')} 
  if(stage==='arrival'){
   ctx.globalAlpha=(1-p)*.85;const at={x:life.yveltal.x+96,y:life.yveltal.y+98};orb(at,24*(1-p*.7),'#241124');ring(at,29+p*18,'#ed506f',.7);for(let i=0;i<12;i++){const a=i*Math.PI/6;line(at,{x:at.x+Math.cos(a)*(30+p*22),y:at.y+Math.sin(a)*(30+p*22)},'#ab385f',2)}
  }
  if(stage.includes('charge')||stage==='signature-fire'){
   const q=stage==='signature-fire'?1:p
   if(stage.startsWith('ordinary')||stage.startsWith('signature')){
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7+t*.7,at={x:x.back.x+Math.cos(a)*33,y:x.back.y+Math.sin(a)*23};orb(at,2+q*3,RAINBOW[i]);line(at,x.back,RAINBOW[i],1)}ring(x.back,30+q*10,'#e9ffff',.45);ring(x.back,38+q*9,'#9cfff7',1);orb(x.back,4+q*9,'#d0f9ff')
   }
   if(stage==='core-charge'){for(let i=0;i<12;i++){const a=i*2.399+t*2,r=34*(1-p);orb({x:z.back.x+Math.cos(a)*r,y:z.back.y+Math.sin(a)*r},2,'#8aff87')}hex(z.back,24-p*12,'#93ffa2')}
  }
  if(stage==='guardian-arrival'||stage==='mega-evolution'){const at=z.back,q=Math.sin(p*Math.PI);for(let i=0;i<22;i++){const a=i*2.399+t,r=58*(1-p);hex({x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},2+i%3,stage==='mega-evolution'?'#d79bff':'#81ff9a')}if(q>.7){ctx.globalAlpha=(q-.7)*1.5;orb(at,32,stage==='mega-evolution'?'#e6b4ff':'#abffd0')}}
  ctx.restore();return
 }
 if(stage==='await-boss'){ctx.restore();return}
 if(stage==='ordinary-charge'||stage==='signature-charge'){const q=p;orb(y.mouth,5+q*15,'#d375e7');orb(y.mouth,2+q*7,'#fff0ff');ring(y.mouth,17+q*8,'#e5b6ff');for(let i=0;i<5;i++){const a=i*Math.PI*2/5+t;bolt(y.mouth,{x:y.mouth.x+Math.cos(a)*(15+q*12),y:y.mouth.y+Math.sin(a)*(15+q*12)},'#ffe8ff')}}
 if(stage==='ordinary-fire'){const q=Math.min(1,p/.65);for(const [i,at]of [x.mouth,y.mouth].entries()){const ball={x:at.x+(front.x-at.x)*q,y:at.y+(front.y-at.y)*q};line(at,ball,i?'#cf78da':'#bafcff',3);orb(ball,10,i?'#c47ce3':'#bdf9ff');orb(ball,4,'#ffffff')}if(q===1)burst(front,.5,'#dac8ff')}
 if(stage==='signature-fire'){const q=Math.min(1,p/.35),tip=(at:P)=>({x:at.x+(front.x-at.x)*q,y:at.y+(front.y-at.y)*q});beam(x.mouth,tip(x.mouth),q,[...RAINBOW,'#ffffff'],24);beam(y.mouth,tip(y.mouth),q,['#ad3d66','#ee76af','#ffe1ef'],22);bolt(y.mouth,tip(y.mouth),'#ffffff');if(q===1)burst(front,.7,'#d4b9ff')}
 if(stage==='extreme-speed'){for(let i=0;i<10;i++){const a=i*2.399;line(z.back,{x:z.back.x+Math.cos(a)*42,y:z.back.y+Math.sin(a)*28},'#bdffd8',2)}burst(life.progress<.5?x.mouth:y.mouth,.45,'#9dffc0')}
 if(stage==='core-fire'){const q=Math.min(1,p/.45),points=coreGlyph(front,38);for(const at of [x.mouth,y.mouth]){const tip={x:z.back.x+(at.x-z.back.x)*q,y:z.back.y+(at.y-z.back.y)*q};beam(z.back,tip,q,['#2cbb63','#89ff83','#f6fff1'],15)}if(q===1){points.slice(0,-1).forEach((at,i)=>{line(at,points[i+1],'#4bcc65',8);line(at,points[i+1],'#d1ff90',3)});for(const at of [x.mouth,y.mouth])burst(at,.5,'#9dff93')}}
 if(stage==='mega-charge'||stage==='mega-fire'){
  const q=stage==='mega-charge'?p:1;for(let i=0;i<3;i++)hex({x:cannon.x-8*i,y:cannon.y},22+q*18+i*5,i%2?'#f9caff':'#c577f0');orb(cannon,5+q*17,'#d795ff');orb(cannon,3+q*11,'#fff0ff');for(let i=0;i<14;i++){const a=i*2.399+t*3,r=45*(1-q*.8);px(cannon.x+Math.cos(a)*r,cannon.y+Math.sin(a)*r,2,2,'#e9bfff')}
  if(stage==='mega-fire'){const f=Math.min(1,p/.3),tip={x:cannon.x+(front.x-cannon.x)*f,y:cannon.y+(front.y-cannon.y)*f};beam(cannon,tip,f,['#6a30a6','#ad67ee','#edb6ff','#ffffff'],40);for(let i=0;i<16;i++){const u=(t*.8+i/16)%1;px(cannon.x+(tip.x-cannon.x)*u+Math.sin(i*7)*24,cannon.y+(tip.y-cannon.y)*u+Math.cos(i*7)*24,3,2,'#eab1ff')}if(f===1){burst(front,.85,'#e4b5ff');for(const at of [x.mouth,y.mouth]){line(front,at,'#d297f6',6);burst(at,.55,'#e4b5ff')}}}
 }
 if(stage.endsWith('impact')||stage==='aftermath')burst(front,1-p,stage==='core-impact'?'#98ff9c':'#d8b6ff')
 ctx.restore()
}
