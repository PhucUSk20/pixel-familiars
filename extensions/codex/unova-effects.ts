import {drawPlasmaRings} from './plasma-rings'
import type {UnovaLife} from './unova-life'
export type UnovaPoint={x:number;y:number}
export type UnovaAnchors={mouth:UnovaPoint;tail:UnovaPoint;back:UnovaPoint}
export function reshiramCharge(mouth:UnovaPoint):UnovaPoint{return{x:mouth.x,y:mouth.y-30}}
export function unovaCollision(a:UnovaPoint,b:UnovaPoint):UnovaPoint{return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
/** Outward shoulder launch curves back onto the target; trails follow the same curve. */
export function unovaMissile(origin:UnovaPoint,target:UnovaPoint,progress:number,index:number):UnovaPoint{
 const p=Math.max(0,Math.min(1,progress)),side=index%2?1:-1,spread=(26+index*8)*Math.sin(p*Math.PI),arc=Math.sin(p*Math.PI)*(90+index*12)
 return{x:origin.x+(target.x-origin.x)*p+side*spread,y:origin.y+(target.y-origin.y)*p-arc}
}
export function drawUnovaEffects(ctx:CanvasRenderingContext2D,life:UnovaLife,anchors:UnovaAnchors[],behind=false):void{
 if(!life.active)return
 const stage=life.stage,p=life.progress,t=life.elapsed/1000,[r,z,k]=anchors,front=unovaCollision(r.mouth,z.mouth),ordinaryCharge=reshiramCharge(r.mouth),ordinaryFront=unovaCollision(ordinaryCharge,z.mouth),opponent=life.white?z:r,fusion=unovaCollision(k.mouth,opponent.mouth)
 const px=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
 const line=(a:UnovaPoint,b:UnovaPoint,color:string,w=1)=>{const d=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));for(let i=0;i<=d;i+=Math.max(1,w*.5))px(a.x+(b.x-a.x)*i/d-w/2,a.y+(b.y-a.y)*i/d-w/2,w,w,color)}
 const ring=(at:UnovaPoint,radius:number,color:string,flat=1)=>{for(let i=0;i<96;i++){const a=i*Math.PI/48;px(at.x+Math.cos(a)*radius,at.y+Math.sin(a)*radius*flat,2,1,color)}}
 const orb=(at:UnovaPoint,radius:number,color:string)=>{for(let y=-Math.ceil(radius);y<=radius;y++){const half=Math.sqrt(Math.max(0,radius*radius-y*y));px(at.x-half,at.y+y,half*2,1,color)}}
 const burst=(at:UnovaPoint,strength:number,color:string)=>{if(strength<=0)return;orb(at,5+strength*15,'#f5ffff');ring(at,12+(1-strength)*24,color);for(let i=0;i<16;i++){const a=i*2.399+t*.15,r=12+(1-strength)*36;line({x:at.x+Math.cos(a)*r*.45,y:at.y+Math.sin(a)*r*.45},{x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},i%3?color:'#fffdec',i%4?1:3)}}
 const bolt=(a:UnovaPoint,b:UnovaPoint,strength:number)=>{const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),nx=-dy/d,ny=dx/d;let last=a;for(let i=1;i<=22;i++){const u=i/22,jitter=i===22?0:Math.sin(i*19+t*33)*8*strength,at={x:a.x+dx*u+nx*jitter,y:a.y+dy*u+ny*jitter};line(last,at,'#218cfa',5*strength);line(last,at,'#d5fcff',2*strength);last=at}}
 const electric=(a:UnovaPoint,b:UnovaPoint,q:number)=>{line(a,b,'#236be6',26*q);line(a,b,'#44d9ff',14*q);line(a,b,'#efffff',5*q);bolt(a,b,q);const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));for(const side of [-1,1])bolt({x:a.x-dy/d*side*10*q,y:a.y+dx/d*side*10*q},{x:b.x-dy/d*side*10*q,y:b.y+dx/d*side*10*q},q*.5)}
 const flame=(a:UnovaPoint,b:UnovaPoint,strength:number,blue=true)=>{const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),nx=-dy/d,ny=dx/d,colors=blue?['#2372e9','#32dfff','#cefff3']:['#e84e26','#ffae39','#fff4c2'];for(let j=0;j<3;j++){ctx.beginPath();for(const side of [-1,1])for(let n=0;n<=55;n++){const u=(side<0?n:55-n)/55,half=(7+u*19)*(1-j*.31)*strength,wave=Math.sin(u*34-t*17)*half*.18,x=Math.round(a.x+dx*u+nx*(side*half+wave)),y=Math.round(a.y+dy*u+ny*(side*half+wave));if(side<0&&n===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fillStyle=colors[j];ctx.fill()}for(let i=0;i<12;i++){const u=(t*.8+i/12)%1,side=i%2?1:-1,half=(8+u*22)*strength;px(a.x+dx*u+nx*side*half,a.y+dy*u+ny*side*half,2,3,colors[1])}drawPlasmaRings(ctx,a,b,t*1000,strength)}
 const tail=(at:UnovaPoint,color:string,q:number,electric=false)=>{orb(at,4+q*9,color);orb(at,2+q*5,'#e9ffff');for(let i=0;i<3;i++)ring(at,10+i*5+Math.sin(t*8+i)*2,color,.7);if(electric)for(let i=0;i<6;i++){const a=i*Math.PI/3+t;bolt(at,{x:at.x+Math.cos(a)*(18+q*12),y:at.y+Math.sin(a)*(18+q*12)},q*.45)}}
 ctx.save();ctx.globalAlpha=life.opacity
 if(behind){
  if(stage==='arrival')for(const [index,at] of [r.tail,z.tail].entries()){const radius=15+p*30;ctx.globalAlpha=(1-p)*.8;ring(at,radius,index?'#43bfff':'#ffbb57',.75);for(let i=0;i<12;i++){const a=i*Math.PI/6;line(at,{x:at.x+Math.cos(a)*radius,y:at.y+Math.sin(a)*radius},index?'#96e7ff':'#ffc88b',1)}}
  if(stage==='kyurem-arrival'){const center={x:life.kyurem.x+96,y:life.kyurem.y+88},radius=25+35*Math.sin(p*Math.PI);ctx.globalAlpha=(1-p)*.85;ring(center,radius,'#b4edff',.7);for(let i=0;i<12;i++){const a=i*2.399;line(center,{x:center.x+Math.cos(a)*radius,y:center.y+Math.sin(a)*radius},'#78bedb',2)}}
  if(stage==='ordinary-charge'||stage==='ordinary-fire'||stage==='signature-charge'||stage==='signature-fire'){const q=stage.endsWith('charge')?p:1;tail(r.tail,'#ffbd69',q);tail(z.tail,'#28bfff',q,true);if(stage.startsWith('ordinary'))flame(r.tail,{x:r.tail.x-12,y:r.tail.y+38},q*.5,false)}
  if(stage==='fusion-charge'||stage==='fusion-fire'){const q=stage.endsWith('charge')?p:1;tail(k.tail,life.white?'#ffbc6c':'#4cc9ff',q,!life.white);ring(k.back,22+q*15,'#b9f1ff')}
  ctx.restore();return
 }
 if(stage==='await-boss'){ctx.restore();return}
 if(stage==='absorb'||stage==='release'){
  const index=life.white?0:1,at=anchors[index].back,q=stage==='absorb'?p:1-p,center={x:at.x+(k.back.x-at.x)*q,y:at.y+(k.back.y-at.y)*q};line(at,k.back,'#adf1ff',2);orb(center,8+(1-Math.abs(.5-q)*2)*12,life.white?'#fff2c7':'#91e6ff');ring(center,19,'#f0ffff');for(let i=0;i<12;i++){const a=i*2.399+t*4;px(center.x+Math.cos(a)*28*(1-q),center.y+Math.sin(a)*28*(1-q),2,2,'#c7f5ff')}if(Math.abs(p-.78)<.1)burst(k.back,1-Math.abs(p-.78)/.1,'#c6f3ff')
 }
 if(stage.endsWith('charge')&&!stage.startsWith('missile')){
  const list=stage==='kyurem-charge'?[k]:stage==='fusion-charge'?[k,opponent]:stage==='ordinary-charge'?[{...r,mouth:ordinaryCharge},z]:[r,z];for(const [i,at]of list.entries()){const color=stage==='fusion-charge'?(i===0?(life.white?'#ffcb87':'#6cdfff'):(life.white?'#6cdfff':'#61eaf4')):i?'#6cdfff':stage==='signature-charge'?'#5df1f4':'#ffbb68';orb(at.mouth,3+p*10,color);ring(at.mouth,22-12*p,'#e7ffff')}
 }
 if(stage==='ordinary-fire'){const q=Math.min(1,p/.68);for(const [i,at]of [{...r,mouth:ordinaryCharge},z].entries()){const ball={x:at.mouth.x+(ordinaryFront.x-at.mouth.x)*q,y:at.mouth.y+(ordinaryFront.y-at.mouth.y)*q};if(i)bolt(at.mouth,ball,.6);else flame(at.mouth,ball,.3,false);orb(ball,10,i?'#78dbff':'#ffc466');orb(ball,5,'#fffceb')}if(q===1)burst(ordinaryFront,.55,'#9bdaff')}
 if(stage==='signature-fire'){const q=Math.min(1,p/.42),tip=(at:UnovaPoint)=>({x:at.x+(front.x-at.x)*q,y:at.y+(front.y-at.y)*q});flame(r.mouth,tip(r.mouth),q);electric(z.mouth,tip(z.mouth),q);drawPlasmaRings(ctx,z.mouth,tip(z.mouth),t*1000,q);if(q===1)burst(front,.7+Math.sin(t*12)*.1,'#70dcff')}
 if(stage==='missile-charge'){for(let i=0;i<4;i++){const at={x:k.back.x+(i%2?1:-1)*(14+i*3),y:k.back.y-6-i*5};orb(at,3+p*5,'#f18dff');ring(at,12-6*p,'#f2bdff')}}
 if(stage==='missile-fire')for(let i=0;i<4;i++){const q=Math.max(0,Math.min(1,(p-i*.07)/.68)),target=i%2?z.mouth:r.mouth,origin={x:k.back.x+(i%2?1:-1)*15,y:k.back.y-8};if(q===0)continue;for(let j=0;j<14;j++){const f=Math.max(0,q-j*.007),a=unovaMissile(origin,target,f,i),b=unovaMissile(origin,target,Math.max(0,f-.009),i);line(a,b,j<5?'#ffb1ff':'#bc61ee',j<5?3:1)}const at=unovaMissile(origin,target,q,i);orb(at,q<1?7:4,'#f688ff');orb(at,3,'#fff2ff');if(q===1)burst(target,.4,'#ed9cff')}
 if(stage==='kyurem-fire'){
  const q=Math.min(1,p/.65),target=opponent.mouth,ball={x:k.mouth.x+(target.x-k.mouth.x)*q,y:k.mouth.y+(target.y-k.mouth.y)*q};flame(k.mouth,ball,.4,false);orb(ball,20,'#ff7d32');orb(ball,14,'#ffd66e');orb(ball,8,'#fffbd8');ring(ball,23,'#bfefff');if(q===1)burst(target,.8,'#ffb96e')
 }
 if(stage==='fusion-fire'){
  const q=Math.min(1,p/.42),tip=(at:UnovaPoint)=>({x:at.x+(fusion.x-at.x)*q,y:at.y+(fusion.y-at.y)*q});flame(k.mouth,tip(k.mouth),q,life.white?false:true);if(!life.white)bolt(k.mouth,tip(k.mouth),q*.7);if(life.white)electric(opponent.mouth,tip(opponent.mouth),q);else flame(opponent.mouth,tip(opponent.mouth),q);drawPlasmaRings(ctx,k.mouth,tip(k.mouth),t*1000,q);for(let i=0;i<12;i++){const u=(i/12+t*.5)%1;px(k.mouth.x+(fusion.x-k.mouth.x)*u+Math.sin(i*7)*19,k.mouth.y+(fusion.y-k.mouth.y)*u+Math.cos(i*7)*19,2,2,'#b3eaff')}if(q===1)burst(fusion,.8,'#b7eaff')
 }
 if(stage.endsWith('impact')){const at=stage==='missile-impact'?null:stage==='fusion-impact'?fusion:stage==='kyurem-impact'?opponent.mouth:stage==='ordinary-impact'?ordinaryFront:front;if(at)burst(at,1-p,stage==='fusion-impact'?'#b3eaff':'#72ddff');else for(const target of [r.mouth,z.mouth])burst(target,(1-p)*.5,'#e4adff')}
 ctx.restore()
}
