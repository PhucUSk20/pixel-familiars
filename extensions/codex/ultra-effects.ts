import {drawPlasmaRings} from './plasma-rings'
import type {UltraBattle} from './ultra-battle'
type P={x:number;y:number;color?:string;surface?:number}
/** Reference choreography: chest convergence, a colossal light sphere, sky pillar and expanding detonation. */
export function drawUltraBattle(ctx:CanvasRenderingContext2D,battle:UltraBattle,at:P,targets:P[],width:number,alliance?:{target:P;power:number;charge:number;elapsed?:number}):void {
 if(!battle.active)return
 const p=battle.progress,t=(alliance?.elapsed??battle.elapsed)/1000,stage=battle.stage
 const px=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
 const line=(a:P,b:P,c:string,w=1)=>{const n=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));for(let i=0;i<=n;i+=Math.max(1,w*.4))px(a.x+(b.x-a.x)*i/n-w/2,a.y+(b.y-a.y)*i/n-w/2,w,w,c)}
 const ring=(a:P,r:number,c:string,flat=1)=>{for(let i=0;i<160;i++){const v=i*Math.PI/80;px(a.x+Math.cos(v)*r,a.y+Math.sin(v)*r*flat,2,1,c)}}
 const orb=(a:P,r:number,c:string)=>{ctx.fillStyle=c;for(let y=-Math.ceil(r);y<=r;y++){const w=Math.sqrt(Math.max(0,r*r-y*y));ctx.fillRect(Math.round(a.x-w),Math.round(a.y+y),Math.ceil(w*2),1)}}
 const rays=(a:P,r:number,c:string,count=24)=>{for(let i=0;i<count;i++){const v=i*2.399+t*.23,inner=r*.5,outer=r*(.85+.15*Math.sin(i*7+t*9));line({x:a.x+Math.cos(v)*inner,y:a.y+Math.sin(v)*inner},{x:a.x+Math.cos(v)*outer,y:a.y+Math.sin(v)*outer},i%3?c:'#fffef0',i%4?1:3)}}
 const beam=(a:P,b:P,r:number)=>{const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),nx=-dy/d,ny=dx/d;for(const [j,color]of ['#dba529','#ffe980','#ffffeb'].entries()){ctx.beginPath();for(const side of [-1,1])for(let k=0;k<=80;k++){const u=(side<0?k:80-k)/80,half=r*(1-j*.32)*(.5+u*.5),wave=Math.sin(u*28-t*18)*half*.07,x=Math.round(a.x+dx*u+nx*(side*half+wave)),y=Math.round(a.y+dy*u+ny*(side*half+wave));if(side<0&&k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fillStyle=color;ctx.fill()}}
 ctx.save();ctx.globalAlpha=battle.opacity
 if(alliance){
  const q=alliance.charge,power=alliance.power,end=alliance.target
  if(q>0){orb(at,4+q*16,'#fff9d0');ring(at,15+q*15,'#ffe788');rays(at,28+q*15,'#ffd775')}
  if(power>0){const tip={x:at.x+(end.x-at.x)*power,y:at.y+(end.y-at.y)*power};beam(at,tip,16*power);drawPlasmaRings(ctx,at,tip,t*1000,power);if(power>.95){orb(end,9,'#ffffe9');rays(end,26,'#ffe3a2',12)}}
  ctx.restore();return
 }
 if(stage==='ultra-arrival'||stage==='ultra-awe'){ring(at,48,'#ffe9a2');rays(at,70,'#fff2be');ctx.globalAlpha=.08;orb(at,64,'#ffe79d')}
 if(stage==='ultra-assault'){
  const power=battle.assaultPower,radius=58
  ctx.globalAlpha=.12;orb(at,radius,'#fff1a7');ctx.globalAlpha=1;ring(at,radius,'#ffed9f');ring(at,radius-4,'#d7fcff')
  targets.forEach((origin,i)=>{const dx=origin.x-at.x,dy=origin.y-at.y,d=Math.max(1,Math.hypot(dx,dy)),end={x:at.x+dx/d*radius,y:at.y+dy/d*radius},tip={x:origin.x+(end.x-origin.x)*power,y:origin.y+(end.y-origin.y)*power},color=origin.color??['#6ef0ae','#f8a9ef','#94e7ff','#ffc368','#ed9cfa','#a2d8ff','#c191ff'][i%7];line(origin,tip,color,5);line(origin,tip,'#fffce5',2);drawPlasmaRings(ctx,origin,tip,t*1000,power);if(power>.96){ring(end,8+Math.sin(t*16)*2,color);rays(end,23,color,10)}})
 }
 const sphere={x:at.x,y:at.y-75}
 if(stage==='ultra-charge'){
  const grow=p*p,r=9+grow*55
  ctx.globalAlpha=.09+p*.15;orb(at,35+p*50,'#ffe997');ctx.globalAlpha=1
  for(let i=0;i<40;i++){const a=i*2.399+t*.7,dist=(1-(t*.8+i*.073)%1)*(85+50*p)+10;line({x:at.x+Math.cos(a)*dist,y:at.y+Math.sin(a)*dist},at,i%3?'#d1ecff':'#fff2a3',1)}
  orb(at,4+p*22,'#fff9d9');rays(at,35+p*65,'#ffeabc',32)
  const moving={x:at.x,y:at.y-75*Math.max(0,(p-.35)/.65)};orb(moving,r,'#f2d149');orb(moving,r*.88,'#fff29b');orb(moving,r*.63,'#ffffef');ring(moving,r+5,'#fffbd3');rays(moving,r+24,'#ffe583')
 }
 if(stage==='ultra-fire'){
  const release=Math.min(1,p/.22),impact=Math.max(0,(p-.29)/.71),ground={x:at.x,y:184},r=64+Math.sin(t*11)*3
  ctx.globalAlpha=.12;orb(sphere,r+18,'#fff0a1');ctx.globalAlpha=1;orb(sphere,r,'#ffe871');orb(sphere,r*.82,'#fff8c9');orb(sphere,r*.58,'#fffff4');rays(sphere,r+45,'#fff1ad',36)
  const tip={x:at.x,y:sphere.y+(ground.y-sphere.y)*release};beam(sphere,tip,32+release*16)
  if(release===1){const radius=Math.min(width*.65,35+impact*width*.65);ctx.globalAlpha=.13*(1-impact);orb({x:ground.x,y:165},radius,'#fff3a0');ctx.globalAlpha=1-impact*.65;ring(ground,radius,'#fffbd3',.27);ring(ground,radius*.78,'#ffd667',.27);orb({x:ground.x,y:166},Math.max(0,55*(1-impact)),'#fffde2');rays({x:ground.x,y:166},70+impact*125,'#ffeeb1',32)
   targets.forEach((target,i)=>{const hit=battle.contact(i);if(!hit)return;ctx.globalAlpha=hit;line(sphere,target,'#ffec92',5);line(sphere,target,'#ffffee',2);ring(target,12+(1-hit)*36,'#fff0a9');rays(target,24+(1-hit)*35,'#ffdc8b',12);ring({x:target.x,y:target.surface??target.y+30},20+(1-hit)*35,'#ffdf88',.25)})
   ctx.globalAlpha=Math.max(0,1-Math.abs(p-.36)/.09)*.24;ctx.fillStyle='#fff8bd';ctx.fillRect(0,sphere.y-80,width,290-sphere.y)
  }
 }
 ctx.restore()
}
