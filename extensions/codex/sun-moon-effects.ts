import type {SunMoonLife} from './sun-moon-life'
type P={x:number;y:number}
type SkyViewport={width:number;top:number}
/** Both mouth-rooted beams meet at one shared contact front. */
export function celestialCollision(a:P,b:P):P {return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
/** Anchor the outer glow near the sky corners, independently of pet movement. */
export function celestialBackdrops(life:SunMoonLife,viewport:SkyViewport={width:life.width,top:-280}):{moon:P;sun:P} {return{moon:{x:viewport.width-70,y:viewport.top+70},sun:{x:88,y:viewport.top+88}}}
export function drawCelestialEffects(ctx:CanvasRenderingContext2D,life:SunMoonLife,moon:P,sun:P,collision:P,portals=false,forehead:P=sun,viewport:SkyViewport={width:life.width,top:-280}):void {
 if(!life.active)return
 const p=life.progress,t=life.elapsed/1000,stage=life.stage
 const px=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
 const line=(a:P,b:P,c:string,w=1)=>{const n=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));for(let i=0;i<=n;i+=1){const f=i/n;px(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,w,w,c)}}
 const ring=(at:P,r:number,c:string,flat=1)=>{for(let i=0;i<100;i++){const a=i*Math.PI/50;px(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*flat,1,2,c)}}
 const orb=(at:P,r:number,c:string)=>{for(let y=-r;y<=r;y++){const w=Math.sqrt(Math.max(0,r*r-y*y));px(at.x-w,at.y+y,w*2,1,c)}}
 const sparks=(at:P,r:number,c:string)=>{for(let i=0;i<18;i++){const a=i*2.399+t*2;line({x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},{x:at.x+Math.cos(a)*(r+5),y:at.y+Math.sin(a)*(r+5)},i%3?c:'#fffbe8',2)}}
 const flame=(at:P,charge:number)=>{
  const radius=36+charge*18
  ctx.beginPath()
  for(let i=0;i<=96;i++){const a=i*Math.PI/48,r=radius+charge*(9+Math.sin(i*1.9+t*9)*7+Math.sin(i*.7-t*5)*5),x=Math.round(at.x+Math.cos(a)*r),y=Math.round(at.y+Math.sin(a)*r);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
  ctx.closePath();ctx.fillStyle='#ff8b24';ctx.fill();orb(at,radius,'#ffc52d');orb(at,radius*.76,'#fff276')
  for(let i=0;i<14;i++){const a=i*Math.PI/7+t*.12,r=radius-4,tip=r+9+charge*(12+Math.sin(t*8+i)*8),bend=a+.16*Math.sin(t*6+i),root={x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},mid={x:at.x+Math.cos(bend)*tip,y:at.y+Math.sin(bend)*tip};line(root,mid,'#ffdf42',4);line(mid,{x:at.x+Math.cos(bend+.12)*(tip+7),y:at.y+Math.sin(bend+.12)*(tip+7)},'#fff4a9',2)}
 }
 const beam=(origin:P,front:P,colors:readonly string[])=>{
  const dx=front.x-origin.x,dy=front.y-origin.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length
  for(const [j,w] of [20,12,5].entries())for(let i=0;i<90;i++){const u=i/89,thickness=w*(.65+.75*u),wave=Math.sin(u*22-t*14)*w*.07;line({x:origin.x+dx*u+nx*(-thickness/2+wave),y:origin.y+dy*u+ny*(-thickness/2+wave)},{x:origin.x+dx*u+nx*(thickness/2+wave),y:origin.y+dy*u+ny*(thickness/2+wave)},colors[j],2)}
  for(let j=0;j<2;j++){const d=13+j*18;ring({x:origin.x+dx/length*d,y:origin.y+dy/length*d},8+(t*15+j*8)%12,'#fff9e4',.75)}
 }
 ctx.save();ctx.globalAlpha=life.opacity
 if(portals){
  if(stage==='arrival'||stage==='departure'){
   const strength=stage==='arrival'?Math.sin(Math.min(1,p/.65)*Math.PI/2)*(1-Math.max(0,(p-.65)/.35)):1-p
   for(const [at,color] of [[{x:life.lunala.x+96,y:life.lunala.y+83},'#bc79fc'],[{x:life.solgaleo.x+96,y:life.solgaleo.y+83},'#ffc469']] as const){
    const half=55*Math.min(1,p*4),opening=stage==='arrival'?Math.sin(p*Math.PI)*22:(1-p)*18,top={x:at.x-25,y:at.y-half},bottom={x:at.x+25,y:at.y+half}
    ctx.globalAlpha=strength*.8;ctx.beginPath();ctx.moveTo(top.x,top.y);ctx.lineTo(at.x+opening,at.y);ctx.lineTo(bottom.x,bottom.y);ctx.lineTo(at.x-opening,at.y);ctx.closePath();ctx.fillStyle='#191030';ctx.fill()
    ctx.globalAlpha=strength;line(top,{x:at.x-opening,y:at.y},color,2);line({x:at.x-opening,y:at.y},bottom,color,2);line(top,{x:at.x+opening,y:at.y},'#fff1ff',1);line({x:at.x+opening,y:at.y},bottom,'#fff1ff',1)
    for(let i=0;i<12;i++){const f=i/11;px(top.x+(bottom.x-top.x)*f+Math.sin(i*7+t*5)*8,top.y+(bottom.y-top.y)*f,2,2,color)}
   }
  }
  if(stage==='signature-charge'||stage==='signature-fire'||stage==='signature-impact'){
   const charge=stage==='signature-charge'?p:stage==='signature-impact'?1-p:1,{moon:moonBack,sun:sunBack}=celestialBackdrops(life,viewport)
   ctx.globalAlpha=life.opacity*charge*.85;orb(moonBack,60,'#627ab6');orb(moonBack,56,'#dbe9ff');ring(moonBack,62,'#9fbdff')
   for(let i=0;i<9;i++){const a=i*2.399,r=20+i%3*10;orb({x:moonBack.x+Math.cos(a)*r,y:moonBack.y+Math.sin(a)*r},3+i%3,'#adbedb')}
   flame(sunBack,charge);ring(sunBack,64,'#ffdc63')
  }
  ctx.restore();return
 }
 if(stage==='ordinary-charge'){
  for(const [at,color] of [[moon,'#df9fff'],[sun,'#ffdc9b']] as const){orb(at,3+p*11,color);ring(at,28-16*p,color);for(let i=0;i<8;i++){const a=i*Math.PI/4+t*3;px(at.x+Math.cos(a)*23*(1-p),at.y+Math.sin(a)*23*(1-p),2,2,'#fff1ff')}}
 }
 if(stage==='ordinary-fire'){
  const f=Math.min(1,p/.7)
  for(const [at,color] of [[moon,'#e09bff'],[sun,'#ffe3a7']] as const){const ball={x:at.x+(collision.x-at.x)*f,y:at.y+(collision.y-at.y)*f};line(at,ball,color,2);orb(ball,11,color);orb(ball,5,'#fff7ff');ring(ball,15,color)}
 }
 if(stage==='signature-charge'||stage==='signature-fire'){
  const charge=stage==='signature-charge'?p:1
  // Lunala draws moonlight into a circular, star-filled wing halo.
  ring(moon,23+charge*33,'#b6cfff');ring(moon,26+charge*33,'#6b80e2')
  for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.2,at={x:moon.x+Math.cos(a)*(23+charge*33),y:moon.y+Math.sin(a)*(23+charge*33)};orb(at,2+charge*2,'#ecffff');if(charge>.4)line(at,moon,'#8dcae9',1)}
  if(stage==='signature-charge'){
   orb(moon,4+p*15,'#d9ffff');sparks(moon,35*(1-p)+8,'#91d9ff')
   orb(forehead,3+p*7,'#56cfff');orb(forehead,2+p*3,'#e1fcff');ring(forehead,14+p*5,'#6cd9ff')
   for(let i=0;i<8;i++){const a=i*Math.PI/4+t*1.5,r=32*(1-p)+10;line({x:forehead.x+Math.cos(a)*r,y:forehead.y+Math.sin(a)*r},forehead,i%2?'#ffd465':'#97e9ff',1)}
   if(p>.65){const transfer=(p-.65)/.35,at={x:forehead.x+(sun.x-forehead.x)*transfer,y:forehead.y+(sun.y-forehead.y)*transfer};line(forehead,at,'#fff0a9',3);orb(at,3+transfer*8,'#fff3b0')}
  }
  // Solgaleo's mane becomes a blazing sun, with radial flames and charge rings.
  sparks({x:life.solgaleo.x+96,y:life.solgaleo.y+83},42+charge*14,'#ffd65c')
  if(stage==='signature-fire'){
   const f=Math.min(1,p/.55)
   beam(moon,{x:moon.x+(collision.x-moon.x)*f,y:moon.y+(collision.y-moon.y)*f},['#7252c4','#68e7ef','#efffff'])
   beam(sun,{x:sun.x+(collision.x-sun.x)*f,y:sun.y+(collision.y-sun.y)*f},['#f17f27','#ffd04b','#fffbe1'])
   if(f===1){orb(collision,10+Math.sin(t*15)*3,'#fffce3');sparks(collision,22,'#baf9ff')}
  }
 }
 if(stage==='ordinary-impact'||stage==='signature-impact'){
  const strong=stage==='signature-impact',r=8+p*(strong?45:26);orb(collision,Math.max(1,(1-p)*(strong?18:12)),'#fff9eb');ring(collision,r,'#c6ecff');ring(collision,r*.7,'#ffdda1');sparks(collision,r,strong?'#b99bff':'#e7baff')
 }
 ctx.restore()
}
