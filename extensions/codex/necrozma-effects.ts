import type {NecrozmaLife} from './necrozma-life'
type P={x:number;y:number}
/** Pixel light, native-host absorption and a restored Ultra sky burst. */
export function drawNecrozmaEffects(ctx:CanvasRenderingContext2D,life:NecrozmaLife,origin:P,hosts:P[],behind=false):void {
 if(!life.active||life.battle.active)return
 const stage=life.stage,p=life.progress,t=life.elapsed/1000,at={x:origin.x+(life.form==='dusk'?118:96),y:origin.y+(life.form==='ultra'?79.5:81)},colors=life.form==='ultra'?['#ba802c','#ffe679','#ffffef']:life.form==='dusk'?['#704cff','#ffd171','#fff6e6']:['#713fab','#94dcff','#fff1ff']
 const px=(x:number,y:number,w:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(w)))}
 const line=(a:P,b:P,w:number,c:string)=>{const n=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));for(let i=0;i<=n;i+=Math.max(1,w*.3))px(a.x+(b.x-a.x)*i/n-w/2,a.y+(b.y-a.y)*i/n-w/2,w,c)}
 const ring=(a:P,r:number,c:string,flat=1)=>{for(let i=0;i<100;i++){const v=i*Math.PI/50;px(a.x+Math.cos(v)*r,a.y+Math.sin(v)*r*flat,1.5,c)}}
 const orb=(a:P,r:number,c:string)=>{ctx.fillStyle=c;for(let y=-Math.ceil(r);y<=r;y++){const w=Math.sqrt(Math.max(0,r*r-y*y));ctx.fillRect(Math.round(a.x-w),Math.round(a.y+y),Math.ceil(w*2),1)}}
 const sparks=(a:P,r:number,c:string,n=16)=>{for(let i=0;i<n;i++){const v=i*2.399+t*2;line({x:a.x+Math.cos(v)*r,y:a.y+Math.sin(v)*r},{x:a.x+Math.cos(v)*(r+6),y:a.y+Math.sin(v)*(r+6)},1,c)}}
 const beam=(a:P,b:P,power:number,c=colors)=>{
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length
  for(const [j,w]of [18,10,3].entries()){
   ctx.beginPath()
   for(const side of [-1,1])for(let k=0;k<=70;k++){const u=(side===-1?k:70-k)/70,spread=w*power*(.55+.45*u),wave=Math.sin(u*20-t*12)*power*.8,x=Math.round(a.x+dx*u+nx*(side*spread/2+wave)),y=Math.round(a.y+dy*u+ny*(side*spread/2+wave));if(side===-1&&k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
   ctx.closePath();ctx.fillStyle=c[j];ctx.fill()
  }
  for(let i=0;i<2;i++)ring({x:a.x+dx/length*(14+i*18),y:a.y+dy/length*(14+i*18)},6+(t*14+i*6)%9,'#fff9ef',.7)
 }
 ctx.save();ctx.globalAlpha=life.opacity
 if(behind){
  if(stage==='arrival'||stage==='departure'){
   const fade=stage==='arrival'?Math.sin(p*Math.PI):1-p,r=45+Math.sin(t*7)*4
   ctx.globalAlpha=fade;orb(at,r,'#16192d');ring(at,r,'#917ed1',.7);ring(at,r+5,'#ceceff',.7)
   for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.6;line({x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r*.7},{x:at.x+Math.cos(a)*(r+15),y:at.y+Math.sin(a)*(r+15)*.7},1,'#72558f')}
  }
  if(stage==='ultra-burst'){ctx.globalAlpha=.22;orb(at,25+p*75,'#ffeaaa');sparks(at,30+p*62,'#fff4b0',24)}
  ctx.restore();return
 }
 if(stage.startsWith('absorb')){
  const victim=hosts[stage==='absorb-first'?0:1]
  for(let i=0;i<5;i++){const bend={x:(at.x+victim.x)/2+Math.sin(t*4+i)*20,y:(at.y+victim.y)/2+i*5};line(at,bend,4,'#242233');line(bend,victim,3,'#383445');line(bend,victim,1,'#b598e8')}
  for(let i=0;i<24;i++){const f=(t*.65+i*.117)%1;px(victim.x+(at.x-victim.x)*f+Math.sin(i*7+t)*8,victim.y+(at.y-victim.y)*f,2,i%3?'#b9dcff':'#fff3c3')}
  ring(victim,12+15*(1-p),'#cb9dff');orb(at,4+p*12,'#cce6ff')
 }
 if(stage.startsWith('release')){
  const host=hosts[stage==='release-first'?1:0];beam(host,at,.7,stage==='release-first'?['#e8902f','#ffe675','#fffef0']:['#7754bd','#bfe8ff','#fffaff'])
  ring(at,12+p*30,'#fff2a4');sparks(at,8+p*24,'#c4b8ff')
 }
 if(stage.startsWith('first-')||stage.startsWith('second-')){
  const target=hosts[life.opponent==='lunala'?0:1],ultimate=stage.includes('ultimate'),charge=stage.endsWith('charge')
  if(charge){orb(at,3+p*(ultimate?17:9),colors[1]);orb(at,2+p*7,colors[2]);ring(at,35*(1-p)+8,colors[0]);sparks(at,30*(1-p)+10,colors[1]);if(life.form==='dusk')for(let i=0;i<8;i++){const a=i*Math.PI/4;line(at,{x:at.x+Math.cos(a)*(20+p*30),y:at.y+Math.sin(a)*(20+p*30)},2,colors[2])}}
  else if(ultimate){const f=Math.min(1,p/.42),front={x:at.x+(target.x-at.x)*.58*f,y:at.y+(target.y-at.y)*.58*f};beam(at,front,1);beam(target,front,.75,['#604596','#ffc788','#fffbe7']);if(f===1){orb(front,7+Math.sin(t*12)*2,'#fff7ff');ring(front,14+(t*13)%10,colors[1]);sparks(front,17,colors[1],10)}}
  else if(life.form==='dawn'){for(let i=0;i<6;i++){const f=Math.max(0,Math.min(1,(p-i*.075)*1.8)),end={x:target.x+Math.sin(i*3)*16,y:target.y+Math.cos(i*2)*18},ball={x:at.x+(end.x-at.x)*f,y:at.y+(end.y-at.y)*f};line(at,ball,1,'#956ab9');orb(ball,6,'#e7c4fc');orb(ball,3,'#fffaff');if(f===1)sparks(end,8,'#b7dfff',6)}}
  else{for(let i=0;i<7;i++){const bend={x:target.x+Math.sin(i*4)*20,y:target.y+Math.cos(i*3)*22};beam(at,{x:at.x+(bend.x-at.x)*Math.min(1,p*2),y:at.y+(bend.y-at.y)*Math.min(1,p*2)},.3)}}
 }
 if(stage==='restoration-charge'||stage==='restoration-fire'){
  for(const [i,host]of hosts.entries()){const c=i?['#d17c30','#ffe680','#fffef0']:['#6547ad','#baddff','#fffaff'];if(stage==='restoration-charge'){orb(host,3+p*12,c[1]);ring(host,12+p*18,c[2]);sparks(host,30*(1-p)+10,c[1])}else beam(host,at,Math.min(1,p*4),c)}
  if(stage==='restoration-fire'){orb(at,5+p*23,'#fff5ca');sparks(at,14+p*26,'#fff1ad',20)}
 }
 if(stage==='ultra-burst'){for(let i=0;i<16;i++){const a=i*Math.PI/8+t*.2;line(at,{x:at.x+Math.cos(a)*(25+p*100),y:at.y+Math.sin(a)*(25+p*100)},i%2?1:3,i%2?'#ffe889':'#fffdec')}ring(at,10+p*65,'#ffeeb1');orb(at,Math.max(0,28*(1-Math.abs(p-.55)*2)),'#fffced')}
 if(stage==='ultra-charge'){const sky={x:at.x,y:at.y-70};orb(at,4+p*19,'#fff4ae');orb(sky,5+p*26,'#ffe68d');orb(sky,3+p*18,'#fffdf2');beam(at,sky,.3+p*.3);for(let i=0;i<28;i++){const a=i*2.399+t;const r=(1-p)*75+12;line({x:sky.x+Math.cos(a)*r,y:sky.y+Math.sin(a)*r},sky,1,i%3?'#ffe09b':'#fffcea')}}
 if(stage==='ultra-fire'){
  const sky={x:at.x,y:at.y-70},ground={x:at.x,y:184},power=Math.sin(Math.min(1,p/.16)*Math.PI/2)*(1-Math.max(0,(p-.72)/.28));orb(sky,32*power,'#fff0a5');orb(sky,22*power,'#fffff1');beam(sky,ground,power*2.3);ring(ground,20+p*86,'#ffe5a2',.25);ring(ground,10+p*60,'#fff6dd',.25);for(let i=0;i<14;i++){const a=i*Math.PI/7,r=20+p*70;line(ground,{x:ground.x+Math.cos(a)*r,y:ground.y-Math.abs(Math.sin(a))*r*.65},1,i%3?'#ffd880':'#ffffed')}if(p>.58){const blast=(p-.58)/.42;orb({x:ground.x,y:ground.y-12},(1-blast)*28,'#fff6d2');ring({x:ground.x,y:ground.y-12},12+blast*60,'#ffe9a1')}sparks(ground,15+p*32,'#ffdc84',18)
 }
 if(life.flash){ctx.globalAlpha=life.flash*.8;orb(at,38,'#fff7dd');sparks(at,48,'#fff4aa',24)}
 ctx.restore()
}
