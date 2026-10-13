import {drawPlasmaRings} from './plasma-rings'
import type {GalarLife} from './galar-life'
type P={x:number;y:number}
export type GalarAnchors={mouth:P;tail:P;back:P}
export function galarBeamTargets(a:GalarAnchors[]):P[]{return[a[0].mouth,a[1].back]}
export function drawGalarEffects(ctx:CanvasRenderingContext2D,life:GalarLife,anchors:GalarAnchors[],behind=false):void{
 if(!life.active||life.stage==='await-boss')return
 const [s,h,e]=anchors,stage=life.stage,p=life.progress,t=life.elapsed/1000,heroes=galarBeamTargets(anchors)
 const px=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
 const line=(a:P,b:P,c:string,w=1)=>{const d=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));for(let i=0;i<=d;i+=Math.max(1,w*.4))px(a.x+(b.x-a.x)*i/d-w/2,a.y+(b.y-a.y)*i/d-w/2,w,w,c)}
 const ring=(at:P,r:number,c:string,flat=1)=>{for(let i=0;i<96;i++){const a=i*Math.PI/48;px(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*flat,2,1,c)}}
 const orb=(at:P,r:number,c:string)=>{for(let yy=-Math.ceil(r);yy<=r;yy++){const w=Math.sqrt(Math.max(0,r*r-yy*yy));px(at.x-w,at.y+yy,w*2,1,c)}}
 const burst=(at:P,q:number,c:string)=>{if(q<=0)return;orb(at,4+q*11,'#fff5ff');ring(at,11+(1-q)*29,c);for(let i=0;i<12;i++){const a=i*2.399,r=12+(1-q)*32;line({x:at.x+Math.cos(a)*r*.4,y:at.y+Math.sin(a)*r*.4},{x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},i%3?c:'#ffffff',i%4?1:3)}}
 const bolt=(a:P,b:P,c:string)=>{let prev=a;for(let i=1;i<=14;i++){const u=i/14,at={x:a.x+(b.x-a.x)*u+(i===14?0:Math.sin(i*19+t*30)*6),y:a.y+(b.y-a.y)*u};line(prev,at,c,2);prev=at}}
 const beam=(a:P,b:P,q:number,r=16)=>{const end={x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q},dx=end.x-a.x,dy=end.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),nx=-dy/d,ny=dx/d;for(const [j,c]of ['#873058','#e952b6','#ffa9e7','#fff8ff'].entries()){const half=r*(1-j*.23);ctx.beginPath();ctx.moveTo(a.x+nx*half*.5,a.y+ny*half*.5);ctx.lineTo(end.x+nx*half,end.y+ny*half);ctx.lineTo(end.x-nx*half,end.y-ny*half);ctx.lineTo(a.x-nx*half*.5,a.y-ny*half*.5);ctx.closePath();ctx.fillStyle=c;ctx.fill()}drawPlasmaRings(ctx,a,end,t*1000,q)}
 const shield=(at:P,q:number)=>{ctx.save();ctx.globalAlpha*=q;const points=[{x:at.x-16,y:at.y-24},{x:at.x+19,y:at.y-18},{x:at.x+28,y:at.y},{x:at.x+14,y:at.y+22},{x:at.x-14,y:at.y+28},{x:at.x-24,y:at.y}];ctx.beginPath();points.forEach((a,i)=>i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y));ctx.closePath();ctx.fillStyle='rgba(157,52,95,.28)';ctx.fill();points.forEach((a,i)=>line(a,points[(i+1)%6],'#ffdb8f',3));for(let i=0;i<14;i++){const a=i*2.399,r=28+Math.sin(t*12+i)*5;line({x:at.x+Math.cos(a)*22,y:at.y+Math.sin(a)*22},{x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},i%2?'#ff7a9f':'#ffefb1',2)}ctx.restore()}
 const blade=(at:P,q:number)=>{const aim=e.back,dx=aim.x-at.x,dy=aim.y-at.y,d=Math.max(1,Math.hypot(dx,dy)),length=20+q*76,tip={x:at.x+dx/d*length,y:at.y+dy/d*length};line(at,tip,'#2c94e9',12);line(at,tip,'#8be9ff',7);line(at,tip,'#ffffff',2);ring(at,14+q*8,'#c0f5ff',.5)}
 ctx.save();ctx.globalAlpha=life.opacity
 if(behind){
  if(stage==='arrival'||life.eternamax){const q=stage==='arrival'?p:1,at={x:e.back.x,y:e.back.y-20};ctx.globalAlpha*=stage==='arrival'?1-p*.6:.35;for(let i=0;i<4;i++)ring(at,28+i*11+Math.sin(t*2+i)*3,i%2?'#f677ce':'#9a335b',.4);for(let i=0;i<16;i++){const a=i*2.399+t*.6,r=45+i%3*12;px(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*.5,3,2,'#e25fac')}if(q<.8)bolt(at,{x:at.x-28,y:at.y-70},'#ffb6e3')}
  if(stage==='eternamax'){const q=Math.sin(p*Math.PI);for(let i=0;i<24;i++){const a=i*2.399+t,r=65*(1-p);line(e.back,{x:e.back.x+Math.cos(a)*r,y:e.back.y+Math.sin(a)*r},'#e574c9',2)}ctx.globalAlpha=q*.5;orb(e.back,26+q*24,'#ffb8ef')}
  ctx.restore();return
 }
 if(stage.endsWith('charge')){const at=e.mouth;if(!stage.startsWith('hero')&&!stage.startsWith('final')){orb(at,6+p*18,'#df5ea9');orb(at,2+p*10,'#fff2ff');for(let i=0;i<3;i++)ring(at,20+i*7-p*8,i%2?'#ffe3fa':'#ee71c4',.7);for(let i=0;i<12;i++){const a=i*2.399+t*3,r=42*(1-p*.8);line({x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},at,'#fda7e5',1)}}}
 if(stage==='ordinary-fire'){const q=Math.min(1,p/.65);heroes.forEach(at=>{beam(e.mouth,at,q,8);if(q===1)burst(at,.5,'#efa1db')});shield(h.back,.9);blade(s.mouth,.3)}
 if(stage==='cannon-fire'){const q=Math.min(1,p/.45);beam(e.mouth,h.back,q,20);shield(h.back,1);blade(s.mouth,.4);if(q===1){burst(h.back,.7,'#ffc0e3');line(s.mouth,{x:h.back.x+15,y:h.back.y-20},'#abf3ff',4)}}
 if(stage==='storm-fire'){const q=Math.min(1,p/.4);for(let i=0;i<5;i++){const at={x:heroes[i%2].x+(i-2)*20,y:heroes[i%2].y+25};beam(e.mouth,at,q,6);if(q===1)burst(at,.3,'#e9a0d6')}shield(h.back,1)}
 if(stage==='hero-charge'||stage==='hero-rush'||stage==='eternabeam-fire'||stage==='final-charge'||stage==='final-strike'){const q=stage.endsWith('charge')?p:1;blade(s.mouth,q);shield(h.back,.35+q*.65);for(const [j,at]of [s.back,h.back].entries())for(let i=0;i<9;i++){const a=i*2.399+t*2,r=35*(1-q*.5);px(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r,2,2,j?'#ffd4a0':'#97edff')}if(stage==='hero-rush'||stage==='final-strike'){for(let i=0;i<7;i++){line({x:s.back.x-12-i*6,y:s.back.y+i*3-10},s.back,'#86dcff',2);line({x:h.back.x-12-i*6,y:h.back.y+i*3-10},h.back,'#ffad99',2)}if(p>.32&&p<.8){burst(e.back,Math.sin((p-.32)/.48*Math.PI),stage==='final-strike'?'#c7efff':'#fac1e0');bolt(s.mouth,e.back,'#bcf4ff');bolt(h.back,e.back,'#ffe4aa')}}}
 if(stage==='eternabeam-fire'){const q=Math.min(1,p/.25);for(const at of heroes)beam(e.mouth,at,q,23);shield(h.back,1);if(q===1)heroes.forEach(at=>burst(at,.65,'#ffc1e5'))}
 if(stage.endsWith('impact'))heroes.forEach(at=>burst(at,1-p,'#f5bce5'))
 if(stage==='defeat'){burst(e.back,1-p,'#ffa9dc');for(let i=0;i<20;i++){const a=i*2.399,r=15+p*70;px(e.back.x+Math.cos(a)*r,e.back.y+Math.sin(a)*r,3,2,i%2?'#e781ba':'#b78be8')}}
 ctx.restore()
}
