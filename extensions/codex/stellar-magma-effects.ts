import type {RiderLife} from './rider-life'
import type {AvianAnchors} from './avian-effects'
type Point={x:number;y:number}
const colors=['#ff7fae','#ffa856','#fff69b','#a8ffba','#a3ffff','#9faaff','#dc9fff']
export function teraStars(elapsed:number,source:Point,target:Point){
 return Array.from({length:12},(_,i)=>{
  const age=elapsed-i*240,flight=750,fall=650
  const peakX=target.x+Math.sin(i*2.4)*20,peakY=target.y-120
  const rising=age<flight,q=Math.max(0,Math.min(1,rising?age/flight:(age-flight)/fall))
  return {age,rising,q,x:rising?source.x+(peakX-source.x)*q:peakX,y:rising?source.y+(peakY-source.y)*q:peakY+q*q*120,color:colors[i%7],impact:age>=flight+fall&&age<flight+fall+500}
 })
}
export function drawStellarMagma(ctx:CanvasRenderingContext2D,life:RiderLife,a:AvianAnchors[],behind=false){
 if(!life.active||a.length!==4)return
 const p=life.progress,t=life.elapsed/1000,stage=life.stage
 const body=(i:number)=>({x:life.pets[i].x+96+life.offset(i).x,y:life.pets[i].y+86+life.offset(i).y})
 const mewtwo=body(0),stellar=body(1),horse=body(2),floor={x:horse.x,y:189}
 const line=(from:Point,to:Point,color:string,w=1)=>{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke()}
 const ring=(at:Point,r:number,color:string,flat=1)=>{ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(at.x,at.y,Math.max(1,r),Math.max(1,r*flat),0,0,Math.PI*2);ctx.stroke()}
 const star=(at:Point,size:number,color:string)=>{ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<8;i++){const angle=i*Math.PI/4-Math.PI/2,r=i%2?size*.25:size;const x=at.x+Math.cos(angle)*r,y=at.y+Math.sin(angle)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill()}
 const explosion=(at:Point,q:number,color:string,size=35)=>{if(q<0||q>1)return;ctx.save();ctx.globalAlpha*=1-q;ring(at,8+q*size*2,color);for(let i=0;i<20;i++){const angle=i*2.399,rr=8+q*(size+i%4*8);star({x:at.x+Math.cos(angle)*rr,y:at.y+Math.sin(angle)*rr},3+i%3,color)}ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(at.x,at.y,Math.max(1,(1-q)*size*.5),0,Math.PI*2);ctx.fill();ctx.restore()}
 const crystal=(at:Point,h:number,color:string)=>{ctx.fillStyle=color;ctx.strokeStyle='#efffff';ctx.beginPath();ctx.moveTo(at.x-10,at.y);ctx.lineTo(at.x-10,at.y-h);ctx.lineTo(at.x+2,at.y-h-12);ctx.lineTo(at.x+12,at.y-h+3);ctx.lineTo(at.x+12,at.y);ctx.closePath();ctx.fill();ctx.stroke();line({x:at.x+2,y:at.y-h-12},{x:at.x+2,y:at.y},'#ffffff')}
 ctx.save();ctx.globalAlpha=life.opacity
 if(behind){
  // Glass facets dissolve into the native sprite during its entrance.
  if(stage==='arrival'){ctx.save();ctx.globalAlpha*=1-p;for(let i=0;i<7;i++)crystal({x:stellar.x+(i-3)*13,y:stellar.y+35},35+(i%3)*16,colors[i]);ctx.restore()}
  for(let i=0;i<7;i++){const angle=t*.7+i*Math.PI*2/7;star({x:stellar.x+Math.cos(angle)*38,y:stellar.y+Math.sin(angle)*15},2,colors[i])}
  if(['ordinary-charge','ice-charge','astral-charge','mega-charge'].includes(stage))for(let i=0;i<3;i++)ring(stellar,22+i*10+p*12,colors[(i+Math.floor(t))%7],.45)
  if(['ordinary-fire','ordinary-impact'].includes(stage))for(let i=0;i<9;i++){const x=floor.x-40+i*10,y=floor.y+Math.sin(i*3+t)*4;line({x,y},{x:x+8,y:y+4},'#542820',4);line({x,y},{x:x+8,y:y+4},'#ffae48',1);if(i%2===0)line({x,y},{x:x+4,y:y+10},'#ff7c32',2)}
  ctx.restore();return
 }
 if(stage==='ordinary-fire'||stage==='ordinary-impact'){
  const q=stage==='ordinary-impact'?p:Math.max(0,(p-.4)/.6)
  for(let i=0;i<3;i++)explosion({x:floor.x+(i-1)*25,y:floor.y-8},q,'#ffb342',25)
  for(let i=0;i<28;i++){const lift=q*(30+i%5*16);star({x:floor.x+Math.sin(i*2.4)*32,y:floor.y-lift},3+i%3,i%3?'#ff9c36':'#fff1a3')}
  if(q>0)line(floor,{x:horse.x,y:horse.y+10},'#ffad47',4*(1-q))
 }
 if(stage==='ice-charge')for(let i=0;i<10;i++)star({x:stellar.x+Math.sin(i*2.399+t)*45,y:stellar.y-20-i%4*9},3+p*3,colors[i%7])
 // Heatran's Magma Storm runs while Calyrex releases its shadow barrage.
 if(stage==='astral-charge'){ring(a[3].mouth,8+p*17,'#ff9d32');for(let i=0;i<12;i++)star({x:a[3].mouth.x+Math.cos(i*2.399+t)*25*(1-p),y:a[3].mouth.y+Math.sin(i*2.399+t)*25*(1-p)},3,'#ffbe56')}
 if(stage==='astral-fire'||stage==='astral-impact'){
  const q=stage==='astral-fire'?Math.min(1,p/.28):1
  line(a[3].mouth,{x:a[3].mouth.x+(horse.x-a[3].mouth.x)*q,y:a[3].mouth.y+(horse.y-a[3].mouth.y)*q},'#ed4927',10)
  line(a[3].mouth,{x:a[3].mouth.x+(horse.x-a[3].mouth.x)*q,y:a[3].mouth.y+(horse.y-a[3].mouth.y)*q},'#ffe891',4)
  if(q===1){for(let band=0;band<3;band++){let previous:Point|undefined;for(let i=0;i<=80;i++){const height=i/80*110,angle=t*8+i*.32+band*2.1,r=26+height*.18,at={x:horse.x+Math.cos(angle)*r,y:floor.y-height};if(previous){line(previous,at,band%2?'#ff672a':'#ffbb37',4);line(previous,at,'#ffe899',1)}previous=at}}}
  if(q===1)for(let i=0;i<110;i++){const height=i/110*95,angle=t*8+i*.5,r=28+(height/95)*15;star({x:horse.x+Math.cos(angle)*r,y:floor.y-height},2+i%3,i%3?'#ffb137':'#fff0a3')}
  if(stage==='astral-impact'){explosion(horse,p,'#ffc452',65);for(let i=0;i<7;i++){const rise=Math.sin(Math.min(1,p*2)*Math.PI/2),x=floor.x+(i-3)*15;crystal({x,y:floor.y+8},(20+i%3*15)*rise,'#693b2b');line({x,y:floor.y},{x:x+2,y:floor.y-(15+i%3*12)*rise},'#ff9b31',3)}}
 }
 // Tera Starstorm launches upward first, then sends staggered impacts onto Mewtwo.
 if(['lance-charge','mega-charge'].includes(stage)){
  for(let i=0;i<24;i++){const angle=t*2+i*2.399,r=15+(1-p)*35;star({x:stellar.x+Math.cos(angle)*r,y:stellar.y+Math.sin(angle)*r*.6},3+i%3,colors[i%7])}
  for(let i=0;i<4;i++)ring(stellar,15+i*7,colors[i],.7)
 }
 if(['lance-fire','lance-impact','mega-fire','mega-impact'].includes(stage)){
  const start=stage.startsWith('lance')?14300:35000
  for(const shot of teraStars(life.elapsed-start,a[1].mouth,mewtwo)){
   if(shot.age<0)continue
   if(shot.age<1400){line({x:shot.x,y:shot.y+15},{x:shot.x,y:shot.y},shot.color,3);star(shot,6,shot.color);ring(shot,10,'#ffffff',.5)}
   if(shot.impact){line({x:shot.x,y:mewtwo.y-65},{x:shot.x,y:mewtwo.y+12},shot.color,4);line({x:shot.x,y:mewtwo.y-65},{x:shot.x,y:mewtwo.y+12},'#ffffff',1);explosion({x:shot.x,y:mewtwo.y},(shot.age-1400)/500,shot.color,36)}
  }
 }
 ctx.restore()
}
