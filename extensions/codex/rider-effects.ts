import type {RiderLife} from './rider-life'
import type {AvianAnchors} from './avian-effects'
type P={x:number;y:number}
export function riderBomb(life:RiderLife,source:P,target:P):P {
 const p=life.progress,above={x:target.x,y:target.y-90}
 if(p<.45){const q=p/.45;return{x:source.x+(above.x-source.x)*q,y:source.y+(above.y-source.y)*q-Math.sin(q*Math.PI)*32}}
 const q=Math.min(1,(p-.45)/.3);return{x:target.x,y:above.y+(target.y-above.y)*q*q}
}
export function drawRiderEffects(ctx:CanvasRenderingContext2D,life:RiderLife,a:AvianAnchors[],behind=false,pair:'psychic'|'rider'='psychic'):void {
 if(!life.active||a.length!==2)return
 const stage=life.stage
 if(pair==='psychic'&&['ice-charge','freeze','lance-charge','lance-fire','lance-impact','astral-charge','astral-fire','astral-impact'].includes(stage))return
 if(pair==='rider'&&['ordinary-charge','ordinary-fire','ordinary-impact','mega-transform','mega-charge','mega-fire','mega-impact'].includes(stage))return
 const p=life.progress,t=life.elapsed/1000,enemy={x:life.mewtwo.x+96+life.offset(0).x,y:life.mewtwo.y+82+life.offset(0).y},horse={x:life.calyrex.x+96+life.offset(1).x,y:life.calyrex.y+127+life.offset(1).y},target={x:life.calyrex.x+96+life.offset(1).x,y:life.calyrex.y+82+life.offset(1).y}
 const line=(from:P,to:P,c:string,w=1)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke()}
 const ring=(at:P,r:number,c:string,flat=1)=>{ctx.strokeStyle=c;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(at.x,at.y,Math.max(1,r),Math.max(1,r*flat),0,0,Math.PI*2);ctx.stroke()}
 const orb=(at:P,r:number,c:string,dark=false)=>{r=Math.max(1,r);const g=ctx.createRadialGradient(at.x-r*.2,at.y-r*.2,1,at.x,at.y,r);g.addColorStop(0,dark?'#180e32':'#ffffff');g.addColorStop(.65,c);g.addColorStop(1,dark?'#1e092d':'#24133600');ctx.fillStyle=g;ctx.beginPath();ctx.arc(at.x,at.y,r,0,Math.PI*2);ctx.fill();if(dark)ring(at,r,'#db79ff')}
 const bolt=(from:P,to:P,c:string)=>{let previous=from;for(let i=1;i<=12;i++){const q=i/12,at={x:from.x+(to.x-from.x)*q+Math.sin(t*20+i*17)*5*Math.sin(q*Math.PI),y:from.y+(to.y-from.y)*q};line(previous,at,c,1);previous=at}}
 const burst=(at:P,q:number,c:string,r=35)=>{q=Math.max(0,Math.min(1,q));if(q>=1)return;orb(at,5+(1-q)*r,c);ring(at,8+q*r*1.8,c);for(let i=0;i<16;i++){const angle=i*2.399+t,rr=10+q*(r+i%4*7),point={x:at.x+Math.cos(angle)*rr,y:at.y+Math.sin(angle)*rr};line(point,{x:point.x+Math.cos(angle)*6,y:point.y+Math.sin(angle)*6},i%3?c:'#ffffff',i%4?1:3)}}
 const lance=(at:P,angle:number,size:number)=>{ctx.save();ctx.translate(at.x,at.y);ctx.rotate(angle);ctx.fillStyle='#bdf7ff';ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(-size*.2,-9);ctx.lineTo(-size*.55,0);ctx.lineTo(-size*.2,9);ctx.closePath();ctx.fill();ctx.stroke();line({x:-size*.5,y:0},{x:size,y:0},'#ffffff',2);for(let i=0;i<3;i++){const x=-size*.4+i*10;line({x,y:0},{x:x-4,y:i%2?15:-15},'#7addff',3)}ctx.restore()}
 const ghost=(at:P,r:number)=>{ctx.fillStyle='#210d38';ctx.strokeStyle='#b85fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(at.x,at.y,r,Math.PI,0);ctx.bezierCurveTo(at.x+r,at.y+r,at.x-r*.6,at.y+r*.7,at.x,at.y+r*2);ctx.bezierCurveTo(at.x-r*.6,at.y+r,at.x-r,at.y+r,at.x-r,at.y);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#f5c9ff';ctx.fillRect(at.x-5,at.y-2,3,2);ctx.fillRect(at.x+3,at.y-2,3,2)}
 ctx.save();ctx.globalAlpha=life.opacity
 if(behind){
  if(stage==='arrival'||life.flash>0){const power=stage==='arrival'?1-p:life.flash;for(const at of [enemy,target]){ring(at,20+power*30,'#c08bff',.7);orb(at,power*30,'#b788ff')}}
  if(stage.startsWith('astral')){ctx.globalAlpha*=.4;ctx.fillStyle='#432079';ctx.beginPath();ctx.ellipse(horse.x,horse.y,62,16,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=life.opacity;for(let i=0;i<3;i++)ring(horse,24+i*14+Math.sin(t*4+i)*4,'#9b47d2',.24);for(let i=0;i<5;i++){const angle=i*1.26+t*.3;ghost({x:horse.x+Math.cos(angle)*40,y:horse.y-18-Math.sin(t*2+i)*9},7+i%2*3)}}
  if(stage==='ice-charge'||stage==='lance-charge'){ring(horse,28+p*20,'#a2f5ff',.25);for(let i=0;i<16;i++){const angle=i*2.399+t;line({x:horse.x+Math.cos(angle)*36,y:horse.y-Math.sin(p*Math.PI)*60-i%4*6},{x:horse.x+Math.cos(angle)*36+3,y:horse.y-Math.sin(p*Math.PI)*60-i%4*6+7},'#97ecff',1)}}
  ctx.restore();return
 }
 if(stage==='ordinary-charge'){orb(a[0].hand,4+p*12,'#b482fa');orb(a[1].mouth,4+p*12,'#bbf5ff')}
 if(stage==='ordinary-fire'){const q=Math.min(1,p/.5),mid={x:(a[0].hand.x+a[1].mouth.x)/2,y:(a[0].hand.y+a[1].mouth.y)/2};for(let i=0;i<2;i++){const source=i?a[1].mouth:a[0].hand;orb({x:source.x+(mid.x-source.x)*q,y:source.y+(mid.y-source.y)*q},13,i?'#99ecff':'#9e64ee')}if(p>.5)burst(mid,(p-.5)*2,'#dad7ff',19)}
 if(life.frozen){ctx.globalAlpha*=.38;ctx.fillStyle='#b6efff';ctx.beginPath();ctx.moveTo(enemy.x,enemy.y-54);ctx.lineTo(enemy.x+30,enemy.y+28);ctx.lineTo(enemy.x+14,enemy.y+50);ctx.lineTo(enemy.x-32,enemy.y+45);ctx.lineTo(enemy.x-26,enemy.y-20);ctx.closePath();ctx.fill();ctx.globalAlpha=life.opacity;line({x:enemy.x,y:enemy.y-54},{x:enemy.x+8,y:enemy.y+45},'#d2fbff',1);ring({x:enemy.x,y:enemy.y+44},30,'#a6efff',.3)}
 if(stage==='lance-charge'){const at={x:a[1].hand.x,y:a[1].hand.y-40};lance(at,-Math.PI/2,25+p*26);orb({x:at.x,y:at.y-28-p*23},7+p*7,'#9ae9ff')}
 if(stage==='lance-fire'){const q=Math.min(1,p/.65),source={x:a[1].hand.x,y:a[1].hand.y-40},at={x:source.x+(enemy.x-source.x)*q,y:source.y+(enemy.y-source.y)*q};line(source,at,'#8bdfff',7);lance(at,Math.atan2(enemy.y-source.y,enemy.x-source.x),45);if(p>=.65)burst(enemy,(p-.65)/.35,'#b6f2ff',38)}
 if(stage==='lance-impact'){burst(enemy,p,'#b8f2ff',42);for(let i=0;i<18;i++){const angle=i*2.399,at={x:enemy.x+Math.cos(angle)*(12+p*65),y:enemy.y+Math.sin(angle)*(10+p*50)};lance(at,angle,5+i%3)}}
 if(stage==='astral-charge'){for(let i=0;i<6;i++){const angle=i*1.05+t;orb({x:a[1].hand.x+Math.cos(angle)*35*(1-p),y:a[1].hand.y+Math.sin(angle)*28*(1-p)},5+p*6,'#9943f1',true)}}
 if(stage==='astral-fire'||stage==='astral-impact'){const ms=life.elapsed-26000;for(let i=0;i<7;i++){const age=ms-i*430;if(age<0)continue;const q=Math.min(1,age/750),source={x:a[1].hand.x,y:a[1].hand.y},at={x:source.x+(enemy.x-source.x)*q,y:source.y+(enemy.y-source.y)*q-Math.sin(q*Math.PI)*(18+i%3*8)};if(age<750){orb(at,10+i%3*3,'#62259c',true);ring(at,15,'#d973ff',.7);bolt(source,at,'#7b36bc')}else if(age<1500)burst({x:enemy.x+Math.sin(i*2.4)*17,y:enemy.y+Math.cos(i*2.4)*20},(age-750)/750,'#b147f2',25)}}
 if(stage==='mega-charge'){orb(a[0].hand,8+p*26,'#db6fff',true);for(let i=0;i<8;i++){const angle=i*.79+t;bolt(a[0].hand,{x:a[0].hand.x+Math.cos(angle)*(45-20*p),y:a[0].hand.y+Math.sin(angle)*(45-20*p)},'#e7a8ff')}if(life.mega==='y')ring(enemy,24+p*24,'#ea97ff')}
 if(stage==='mega-fire'){
  if(life.mega==='x'&&p<.3){for(let i=0;i<4;i++)bolt({x:enemy.x-35-i*8,y:enemy.y+Math.sin(t*12+i)*12},a[0].hand,'#c480ff');if(p>.12)burst(target,p/.3,'#99efff',28)}
  const at=riderBomb(life,a[0].hand,target);if(p<.75){orb(at,24+(life.mega==='x'?12:8)*Math.sin(p*Math.PI),'#542051',true);for(let i=0;i<3;i++)ring(at,31+i*4,'#e883ee',.4+i*.2);for(let i=0;i<6;i++){const angle=i*1.05+t*3;bolt(at,{x:at.x+Math.cos(angle)*42,y:at.y+Math.sin(angle)*42},'#e7a9ff')}}else burst(target,(p-.75)/.25,life.mega==='x'?'#8aefff':'#e290ff',55)
 }
 if(stage==='mega-impact'){const c=life.mega==='x'?'#9bffff':'#efa4ff',power=Math.sin(p*Math.PI);ctx.globalAlpha*=power;line({x:target.x,y:target.y-105},{x:target.x,y:target.y+40},'#8c3cc6',46);line({x:target.x,y:target.y-105},{x:target.x,y:target.y+40},c,24);line({x:target.x,y:target.y-105},{x:target.x,y:target.y+40},'#ffffff',10);ctx.globalAlpha=life.opacity;ring({x:target.x,y:target.y+35},18+p*65,c,.3);for(let i=0;i<22;i++){const angle=i*2.399,rr=10+p*(40+i%4*10),at={x:target.x+Math.cos(angle)*rr,y:target.y+Math.sin(angle)*rr-p*30};ctx.fillStyle='#21162d';ctx.fillRect(at.x,at.y,3+i%3,3+i%3);if(i%4===0)bolt(target,at,c)}}
 ctx.restore()
}
