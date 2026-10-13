import type {RayDeoxysDuel} from './ray-deoxys-duel'
type P={x:number;y:number}
export function frenzyContact(elapsed:number):number {return elapsed<1300||elapsed>5700?0:Math.max(0,Math.sin((elapsed-1300)/480*Math.PI*2))*.55}
export function drawAerialFinale(ctx:CanvasRenderingContext2D,duel:RayDeoxysDuel,mouth:P,core:P):void {
 if(duel.stage!=='fight'||![2,4].includes(duel.turn))return
 const t=duel.elapsed/1000,ms=duel.elapsed,phase=duel.finale
 const px=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
 const line=(a:P,b:P,c:string,w=1)=>{const n=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));for(let i=0;i<=n;i+=2){const f=i/n;px(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,w,w,c)}}
 const ring=(at:P,r:number,c:string,flat=1)=>{for(let i=0;i<80;i++){const a=i*Math.PI/40;px(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*flat,1,2,c)}}
 const orb=(at:P,r:number,c:string)=>{for(let y=-r;y<=r;y++){const w=Math.sqrt(Math.max(0,r*r-y*y));px(at.x-w,at.y+y,w*2,1,c)}}
 const shards=(at:P,p:number,color:string,count=18)=>{for(let i=0;i<count;i++){const a=i*2.399,r=8+p*(20+i%6*6);line({x:at.x+Math.cos(a)*r,y:at.y+Math.sin(a)*r},{x:at.x+Math.cos(a)*(r+5),y:at.y+Math.sin(a)*(r+5)},i%3?color:'#fff7dd',2)}}
 const rock=(at:P,size:number)=>{
  for(let row=-size;row<=size;row++){const w=Math.sqrt(Math.max(0,size*size-row*row))*(.85+.1*Math.sin(row*2+size));px(at.x-w,at.y+row,w*2,1,row<-size*.2?'#857986':row>size*.4?'#2f293b':'#544c61')}
  px(at.x-size*.4,at.y-size*.5,size*.5,size*.35,'#a99aab');px(at.x+size*.1,at.y,size*.45,size*.3,'#322a42');line({x:at.x-size*.3,y:at.y-size*.2},{x:at.x+size*.2,y:at.y+size*.4},'#bf87c5',1)
 }
 ctx.save()
 if(duel.turn===2){
  if(ms<1300){const p=ms/1300;orb(core,3+p*10,'#d473fb');ring(core,20*(1-p)+10,'#f0b9ff');}
  else if(ms<5700){
   for(let slash=0;slash<5;slash++){
    const p=((ms-1300)/520+slash*.19)%1,a=slash*1.35+t*3,r=18+p*26
    const center={x:core.x+Math.cos(a)*r*.6,y:core.y+Math.sin(a)*r*.6}
    let previous={x:center.x+Math.cos(a-1.3)*r,y:center.y+Math.sin(a-1.3)*r}
    for(let i=1;i<=36;i++){const u=i/36,ang=a-1.3+u*2.6,at={x:center.x+Math.cos(ang)*r,y:center.y+Math.sin(ang)*r};line(previous,at,'#7437ac',4);line(previous,at,'#c778f8',2);if(u>.25&&u<.8)line(previous,at,'#ffdcff',1);previous=at}
   }
   const attack=((ms-1300)%480)/480,f=Math.min(1,attack/.72),at={x:core.x+(mouth.x-core.x)*f,y:core.y+(mouth.y-core.y)*f}
   line(core,at,'#693590',2);for(let i=0;i<24;i++){const a=-1.3+i/23*2.6;px(at.x-Math.cos(a)*13,at.y+Math.sin(a)*18,2,2,i%3?'#d883fc':'#fff2ff')}
   if(attack>.72)shards(mouth,(attack-.72)/.28,'#bf80f5',8)
  }
  ctx.restore();return
 }
 const target={...core},mid={x:duel.rayX+(duel.deoxysX-duel.rayX)*.55+118,y:core.y-6}
 if(ms<14500){
  const charge=Math.min(1,ms/2800),attack=ms>=5000
  ctx.globalAlpha=attack?.38:.12+charge*.15
  // A tapered turquoise flight sheath surrounds the actual advancing dragon.
  for(let strand=0;strand<5;strand++){
   const side=(strand-2)*8
   for(let i=0;i<45;i++){const f=i/44,x=mouth.x-105*f,y=mouth.y+side*Math.sin(f*Math.PI)+Math.sin(f*8-t*12+strand)*3;px(x,y,4,2,strand%2?'#67f3df':'#2aaeb9')}
  }
  ctx.globalAlpha=1
  for(let j=0;j<3;j++)for(let i=0;i<30;i++){const f=i/29,x=mouth.x-90*f,y=mouth.y+Math.sin(f*5+t*10+j*2.1)*(4+f*13);px(x,y,3,2,j?'#6effdf':'#fff7ac')}
  if(!attack)for(let i=0;i<15;i++){const a=i*2.399+t*3,r=30*(1-charge)+8;px(mouth.x+Math.cos(a)*r,mouth.y+Math.sin(a)*r,2,2,'#ffe98b')}
  else {ring({x:mouth.x-12,y:mouth.y},17+Math.sin(t*14)*3,'#ceffff',.65);for(let i=0;i<12;i++)px(mouth.x-50-i*5,mouth.y-22+(i*17)%44,8,1,i%2?'#408ba6':'#d6ffce')}
 }
 if(ms>=2800&&ms<7800){
  const p=Math.min(1,(ms-2800)/2200),f=Math.max(0,Math.min(1,(ms-5000)/2800)),at={x:core.x+(mid.x-core.x)*f,y:core.y+(mid.y-core.y)*f},r=6+p*25
  orb(at,r,'#8b164d');orb(at,r*.76,'#ed3f9b');orb(at,r*.42,'#170e35');orb(at,r*.22,'#ffcbe9')
  for(let band=0;band<3;band++)for(let i=0;i<70;i++){const a=i*Math.PI/35+t*(band%2?-4:4),rad=r+5+band*3;px(at.x+Math.cos(a)*rad,at.y+Math.sin(a)*rad*(.45+band*.2),1,2,band?'#ef8ad9':'#fff3ff')}
  for(let i=0;i<20;i++){const a=i*2.399+t*6,rad=r+(i%4)*4;px(at.x+Math.cos(a)*rad,at.y+Math.sin(a)*rad,2,2,'#ff6dc4')}
 }
 if(phase==='orb-break'){const p=(ms-7800)/1200;ctx.globalAlpha=(1-p)*.3;orb(mid,35+p*30,'#fff4ef');ctx.globalAlpha=1;orb(mid,Math.max(1,22*(1-p)),'#fff3d7');ring(mid,12+p*48,'#ffeec3');ring(mid,6+p*32,'#9cfff2');shards(mid,p,'#fa78c2',32);for(let i=0;i<6;i++){const a=i*Math.PI/3+p*2;line({x:mid.x+Math.cos(a)*10,y:mid.y+Math.sin(a)*10},{x:mid.x+Math.cos(a)*(20+p*35),y:mid.y+Math.sin(a)*(20+p*35)},'#ffdbfa',3)}}
 if(duel.shieldActive||phase==='shield-break'){
  const breaking=phase==='shield-break',p=breaking?(ms-12500)/2000:Math.min(1,(ms-5000)/500)
  // Many fragments accelerate inward when the raised hand pulls them into a rocky shell.
  for(let i=0;i<38;i++){const a=i*2.399+t*.22,settle=Math.min(1,Math.max(0,(ms-5000)/900)),r=breaking?48+p*(70+i%5*10):48+(1-settle)*(65+i%4*14)+(i%3-1)*8,at={x:target.x+Math.cos(a)*r,y:target.y+Math.sin(a)*r*.8};if(!breaking&&settle<1){ctx.globalAlpha=.3;line({x:at.x+Math.cos(a)*13,y:at.y+Math.sin(a)*13},at,'#a3acc0',1);ctx.globalAlpha=1}rock(at,i%7===0?9:3+i%4)}
  if(!breaking){ctx.globalAlpha=.09;orb(target,43,'#6fc9ed');ctx.globalAlpha=1;ring(target,43*p,'#b5f7ff');ring(target,46*p,'#6ba3e5');for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.2;ring({x:target.x+Math.cos(a)*43,y:target.y+Math.sin(a)*43},4,'#dbffff')}
   for(let i=0;i<7;i++){const a=i*.9+t*8;line({x:target.x-43,y:target.y},{x:target.x-43+Math.cos(a)*15,y:target.y+Math.sin(a)*20},'#fffbd6',1)}
  }else {shards(target,p,'#92efff',24);for(let i=0;i<6;i++){const a=i*1.05,r=43+p*60;line({x:target.x+Math.cos(a)*r,y:target.y+Math.sin(a)*r},{x:target.x+Math.cos(a+.2)*r,y:target.y+Math.sin(a+.2)*r},'#befaff',3)}}
 }
 if(phase==='destroyed'){const p=(ms-14500)/3000;shards(target,p,'#e58edb',28);ring(target,10+p*38,'#eab5fa');for(let i=0;i<12;i++)px(target.x+Math.sin(i*2.4)*28,target.y-i*3-p*36,2,2,'#a2e1ff')}
 if(phase==='rebirth-impact'||phase==='rebirth'){
  const p=Math.min(1,(ms-19800)/1500),x=target.x+35*(1-p),y=-160+342*p*p
  if(p<1){for(let i=9;i>0;i--){ctx.globalAlpha=(10-i)/14;px(x+i*3,y-i*8,5,9,i>5?'#603c85':'#e6b0e9')}ctx.globalAlpha=1;orb({x,y},18,'#2b1746');for(let layer=0;layer<3;layer++){const r=19-layer*5+Math.sin(t*8+layer)*2,angle=-Math.PI/2+t*.25;const vertices=Array.from({length:3},(_,i)=>({x:x+Math.cos(angle+i*Math.PI*2/3)*r,y:y+Math.sin(angle+i*Math.PI*2/3)*r}));for(let i=0;i<3;i++){line(vertices[i],vertices[(i+1)%3],'#6c264f',5-layer);line(vertices[i],vertices[(i+1)%3],layer?'#efa0ff':'#ff655d',2)}}orb({x,y},4,'#fff4ff');line({x:x-8,y},{x:x+8,y},'#c5c3ff');line({x,y:y-8},{x,y:y+8},'#c5c3ff')}
  else {const burst=Math.min(1,(ms-21300)/1700);ring({x:target.x,y:184},12+burst*48,'#b788ed',.25);for(let i=0;i<14;i++){const a=i*2.4,r=burst*(20+i%5*8);rock({x:target.x+Math.cos(a)*r,y:184-Math.sin(burst*Math.PI)*20-Math.abs(Math.sin(a))*r*.4},3)}
   const r=30*(1-burst);ring(core,r,'#c6b0ff');for(let i=0;i<18;i++){const a=t*5+i*.8;px(core.x+Math.cos(a)*r,core.y-38+i*4,1,2,i%3?'#b889e4':'#eeedff')}
  }
 }
 ctx.restore()
}
