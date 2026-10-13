import {giratinaClashes,type ShadowAnchors} from './giratina-clash'
import type { CreationLife } from './creation-life'
export type CreationAnchors = { mouth: {x:number;y:number}; gem: {x:number;y:number}; hand: {x:number;y:number} }
type Point = {x:number;y:number}
export function creationCollision(palkia: CreationAnchors, dialga: CreationAnchors, signature: boolean): Point {
  const start=signature?palkia.hand:palkia.mouth
  return {x:(start.x+dialga.mouth.x)/2,y:(start.y+dialga.mouth.y)/2}
}
/** Jagged branching cracks, not a static straight line across the sky. */
export function drawSpaceCrack(ctx:CanvasRenderingContext2D,center:Point,radius:number,t:number,alpha:number):void {
  ctx.save();ctx.globalAlpha=alpha
  const line=(a:Point,b:Point,color:string,size:number)=>{ctx.fillStyle=color;const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));for(let i=0;i<=n;i++){const f=i/n;ctx.fillRect(Math.round(a.x+(b.x-a.x)*f),Math.round(a.y+(b.y-a.y)*f),size,size)}}
  for(let i=0;i<7;i++){
    const angle=i*2.399+.3,points:Point[]=[center]
    for(let j=1;j<=5;j++){const r=radius*j/5,a=angle+Math.sin(i*13+j*5)*.28;points.push({x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r*.8})}
    for(let j=1;j<points.length;j++){line(points[j-1],points[j],'#633572',3);line(points[j-1],points[j],i%2?'#e6b4ff':'#ffdbf8',1);if(j===3){const a=angle+.7;line(points[j],{x:points[j].x+Math.cos(a)*radius*.25,y:points[j].y+Math.sin(a)*radius*.25},'#ad82d2',1)}}
  }
  ctx.fillStyle='#fff0fc';for(let i=0;i<12;i++){const a=i*2.4,r=radius*(.2+(t*.11+i*.13)%1);ctx.fillRect(Math.round(center.x+Math.cos(a)*r),Math.round(center.y+Math.sin(a)*r*.8),1,2)}
  ctx.restore()
}
export function drawCreationPortals(ctx:CanvasRenderingContext2D,life:CreationLife):void {
  if(!life.active)return
  const opening=life.stage==='arrival',closing=life.stage==='departure'
  if(!opening&&!closing)return
  const t=life.elapsed/1000,p=life.phaseProgress,power=opening?Math.min(1,p*3):1-p
  const center={x:life.palkia.x+96,y:life.palkia.y+88}
  ctx.save();ctx.globalAlpha=power
  // Palkia steps through a luminous violet oval: layered rim, white tear and orbiting shards.
  const radius=opening?18+58*Math.min(1,p*2.3):76*power
  for(let layer=5;layer>=0;layer--){
    ctx.globalAlpha=power*(layer===0?.95:.12)
    ctx.fillStyle=layer===0?'#f8ceff':layer<3?'#dc72fa':'#6d2b96'
    for(let i=0;i<128;i++){
      const a=i*Math.PI/64,x=Math.cos(a)*(radius+layer*3)*.58,y=Math.sin(a)*(radius+layer*3)
      ctx.fillRect(Math.round(center.x+x+y*.15),Math.round(center.y+y),layer===0?2:5,layer===0?2:5)
    }
  }
  ctx.globalAlpha=power*.5;ctx.fillStyle='#300a45'
  for(let row=-radius;row<radius;row++){const w=Math.sqrt(Math.max(0,radius*radius-row*row))*.55;ctx.fillRect(Math.round(center.x-w+row*.15),Math.round(center.y+row),Math.round(w*2),1)}
  ctx.globalAlpha=power
  for(let i=0;i<40;i++){const a=i*2.399+t*1.7,r=radius*(.65+(i%6)*.09);ctx.fillStyle=i%3?'#f5a9ff':'#fff1ff';ctx.fillRect(Math.round(center.x+Math.cos(a)*r*.58),Math.round(center.y+Math.sin(a)*r),1+i%3,2+i%4)}
  drawSpaceCrack(ctx,center,88*power,t,power*.65)
  const clock={x:life.dialga.x+96,y:life.dialga.y+88}
  ctx.globalAlpha=power*.25
  for(let row=-72;row<=72;row++){const w=Math.sqrt(Math.max(0,72*72-row*row));ctx.fillStyle=row%8<4?'#919397':'#62666c';ctx.fillRect(Math.round(clock.x-w),clock.y+row,Math.round(w*2),1)}
  ctx.globalAlpha=power
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8-t*.25,x=clock.x+Math.cos(a)*64,y=clock.y+Math.sin(a)*64
    ctx.fillStyle=i%2?'#929fa9':'#e5e9ed';ctx.fillRect(Math.round(x),Math.round(y),i%2?3:5,2)
    const dx=Math.cos(a)*12,dy=Math.sin(a)*8
    ctx.strokeStyle='#7e8b98';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.round(x),Math.round(y));ctx.lineTo(Math.round(x+dx),Math.round(y+dy));ctx.lineTo(Math.round(x+dx-7),Math.round(y+dy+5));ctx.stroke()
  }
  for(let i=0;i<22;i++){const a=i*2.4-t*.5,r=32+i%6*7,x=clock.x+Math.cos(a)*r,y=clock.y+Math.sin(a)*r;ctx.fillStyle=i%3?'#89919a':'#d7e0e7';ctx.fillRect(Math.round(x),Math.round(y),3+i%4,2+i%3)}
  ctx.restore()
}
export function drawCreationBattle(ctx:CanvasRenderingContext2D,life:CreationLife,palkia:CreationAnchors,dialga:CreationAnchors,rift?:Point[],giratina?:ShadowAnchors):void {
  if(!life.active)return
  const t=life.elapsed/1000,p=life.phaseProgress,stage=life.stage
  const pixel=(x:number,y:number,w:number,h:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
  const line=(a:Point,b:Point,color:string,size=2)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2));for(let i=0;i<=n;i++){const f=i/n;pixel(a.x+(b.x-a.x)*f-size/2,a.y+(b.y-a.y)*f-size/2,size,size,color)}}
  const orb=(at:Point,r:number,color:string)=>{for(let y=-r;y<=r;y++){const w=Math.sqrt(Math.max(0,r*r-y*y));pixel(at.x-w,at.y+y,w*2,1,color)}pixel(at.x-r*.35,at.y-r*.35,r*.7,r*.7,'#fff9fa')}
  const ring=(at:Point,r:number,color:string,flat=1)=>{for(let i=0;i<64;i++){const a=i*Math.PI/32;pixel(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*flat,2,1,color)}}
  const sparks=(at:Point,r:number,color:string)=>{for(let i=0;i<28;i++){const a=i*2.399,f=(t*.7+i/28)%1;pixel(at.x+Math.cos(a)*r*f,at.y+Math.sin(a)*r*f,1+i%2,2,i%4?color:'#fff8e4')}}
  const signature=stage.startsWith('signature')||life.riftVisible,orbAttack=life.ordinary==='orb',origin=orbAttack?palkia.hand:palkia.mouth,clashes=giratina?giratinaClashes(palkia,dialga,giratina,signature,orbAttack):undefined,collision=clashes?clashes[0]:life.riftVisible&&rift?.length?rift[0]:creationCollision(orbAttack?{...palkia,mouth:origin}:palkia,dialga,signature),dialgaCollision=clashes?clashes[1]:collision
  ctx.save();ctx.globalAlpha=life.opacity
  if(stage==='ordinary-charge')for(const [i,at] of [origin,dialga.mouth].entries()){const color=i?'#ffb452':'#d9a3ff';orb(at,2+p*7,color);ring(at,6+p*11,color);sparks(at,25*(1-p),color)}
  if(stage==='ordinary-charge'&&orbAttack){
    line(palkia.gem,palkia.hand,'#f2a0ff',2);orb(origin,4+p*12,'#e986f8')
    for(let j=0;j<4;j++)for(let i=0;i<30;i++){const a=i*.13+t*(j%2?-3:3)+j*1.57,r=(3+i*.48)*(1-p*.25);pixel(origin.x+Math.cos(a)*r,origin.y+Math.sin(a)*r,2,2,i%4?'#f5a9ff':'#fff0ff')}
  }
  if(stage==='signature-charge'){
    orb(palkia.gem,3+p*9,'#f59cff');ring(palkia.gem,8+p*16,'#eaa4fa');sparks(palkia.gem,30,'#e284f7')
    line(palkia.gem,palkia.hand,'#e29afb',1);orb(palkia.hand,2+p*8,'#f8b6ff')
    orb(dialga.gem,3+p*8,'#6adaff');ring(dialga.gem,9+p*18,'#73cfff');sparks(dialga.gem,31,'#78d9ff')
    line(dialga.gem,dialga.mouth,'#a9e6ff',1);orb(dialga.mouth,2+p*10,'#9bdcff')
    // Blue-white filaments spiral inward around Dialga's head and mouth orb.
    for(let strand=0;strand<6;strand++)for(let i=0;i<28;i++){
      const f=i/27,r=42*(1-f)*(1-.3*p)+4,a=strand*Math.PI/3+t*5+f*4
      pixel(dialga.mouth.x+Math.cos(a)*r,dialga.mouth.y+Math.sin(a)*r*.8,2,2,i%5?'#a3eaff':'#f5feff')
    }
    orb(dialga.mouth,5+p*10,'#343370');ring(dialga.mouth,7+p*11,'#f1f7ff')
    for(let i=0;i<3;i++){ring(palkia.gem,12+i*6+p*8,i%2?'#fff4ff':'#da8deb',.6);ring(dialga.gem,12+i*6+p*8,i%2?'#defaff':'#688ce0',.65)}
  }
  if(stage==='ordinary-fire'){
    const travel=Math.min(1,p/.42),tip={x:origin.x+(collision.x-origin.x)*travel,y:origin.y+(collision.y-origin.y)*travel}
    if(orbAttack){
      for(let j=5;j>0;j--){const f=Math.max(0,travel-j*.04);ctx.globalAlpha=life.opacity*(.18-j*.023);orb({x:origin.x+(collision.x-origin.x)*f,y:origin.y+(collision.y-origin.y)*f},10+j,'#b549dd')}
      ctx.globalAlpha=life.opacity;orb(tip,16,'#9238c1');orb(tip,12,'#ec88fa')
      for(let strand=0;strand<4;strand++)for(let i=0;i<36;i++){const a=i*.18+t*5+strand*Math.PI/2,r=2+i*.35;pixel(tip.x+Math.cos(a)*r,tip.y+Math.sin(a)*r,2,2,i%3?'#ffdbff':'#ffffff')}
      sparks(tip,23,'#f2a4ff')
    }else{
      line(origin,tip,'#a970d7',8);line(origin,tip,'#e6b7ff',5);line(origin,tip,'#fff1ff',2)
      for(let j=0;j<8;j++){const f=(t*1.8+j/8)%1*travel;ring({x:origin.x+(collision.x-origin.x)*f,y:origin.y+(collision.y-origin.y)*f},4+f*3,'#eecaff',.8)}
    }
    const dx=dialgaCollision.x-dialga.mouth.x,dy=dialgaCollision.y-dialga.mouth.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length
    for(let d=0;d<length*travel;d+=2){const f=d/length,x=dialga.mouth.x+dx*f,y=dialga.mouth.y+dy*f,r=3+f*10+Math.sin(d*.23-t*16)*2;line({x:x+nx*r,y:y+ny*r},{x:x-nx*r,y:y-ny*r},'#b94b31',3);line({x:x+nx*r*.7,y:y+ny*r*.7},{x:x-nx*r*.7,y:y-ny*r*.7},'#ff9b38',2);pixel(x,y,3,3,'#ffeb91')}
    if(travel===1&&!giratina){orb(collision,8+Math.sin(t*13)*3,'#f8c7c5');sparks(collision,30,'#ffbc7a')}
  }
  if(stage==='signature-fire'){
    const travel=Math.min(1,p/.5),at={x:palkia.hand.x+(collision.x-palkia.hand.x)*travel,y:palkia.hand.y+(collision.y-palkia.hand.y)*travel},radius=25+travel*18
    const sx=collision.x-palkia.hand.x,sy=collision.y-palkia.hand.y,sl=Math.max(1,Math.hypot(sx,sy)),ux=sx/sl,uy=sy/sl
    const bladePixel=(x:number,y:number,w:number,h:number,color:string)=>pixel(at.x+x*ux-y*uy,at.y+x*uy+y*ux,w,h,color)
    // A tapered blade of plasma with a bright cutting edge and shredded curved wake.
    // The reference has a crescent wake, not concentric rings behind the slash.
    for(let layer=4;layer>=0;layer--){
      ctx.globalAlpha=life.opacity*(layer===0?1:.10+(.04*(4-layer)))
      for(let i=0;i<120;i++){
        const a=-Math.PI*.54+i/119*Math.PI*1.08,r=radius+layer*3,thickness=Math.max(1,(18+travel*9)*Math.pow(Math.max(0,Math.cos(a)),.7))
        for(let depth=0;depth<thickness;depth+=2){
          const x=-radius+Math.cos(a)*(r-depth),y=Math.sin(a)*(r-depth)
          bladePixel(x+y*.22,y,3,3,layer?'#ad32da':depth<3?'#ffedff':depth<7?'#fbd0ff':depth<13?'#e278fc':'#9a31c9')
        }
      }
    }
    for(let j=1;j<5;j++){
      ctx.globalAlpha=life.opacity*(.22-j*.035)
      for(let i=0;i<70;i++){const a=-1.5+i/69*3,r=radius-j*2;bladePixel(-radius-j*6+Math.cos(a)*r+Math.sin(a)*r*.22,Math.sin(a)*r,2,3,'#e276ff')}
    }
    ctx.globalAlpha=life.opacity
    for(let i=0;i<30;i++){const a=-1.5+i/29*3,r=radius+(i%3)*3,f=(t*2+i*.13)%1;bladePixel(-radius+Math.cos(a)*r-f*22+Math.sin(a)*r*.22,Math.sin(a)*r,1,2,i%3?'#ee97ff':'#fff1ff')}
    const dx=dialgaCollision.x-dialga.mouth.x,dy=dialgaCollision.y-dialga.mouth.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length
    for(let d=0;d<length*travel;d+=2){const f=d/length,r=5+f*13,x=dialga.mouth.x+dx*f,y=dialga.mouth.y+dy*f;line({x:x+nx*r,y:y+ny*r},{x:x-nx*r,y:y-ny*r},'#5975d7',3);line({x:x+nx*r*.65,y:y+ny*r*.65},{x:x-nx*r*.65,y:y-ny*r*.65},'#88d8fb',3);line({x:x+nx*r*.2,y:y+ny*r*.2},{x:x-nx*r*.2,y:y-ny*r*.2},'#e6fcff',2)}
    // Perspective shock rings expand as they leave the mouth, perpendicular to the beam.
    for(let j=0;j<5;j++){
      const f=(t*1.3+j/5)%1*.65*travel,r=9+f*43,at={x:dialga.mouth.x+dx*f,y:dialga.mouth.y+dy*f}
      for(let i=0;i<96;i++){const a=i*Math.PI/48,side=Math.sin(a)*r,depth=Math.cos(a)*r*.25;pixel(at.x+nx*side+dx/length*depth,at.y+ny*side+dy/length*depth,2,2,'#f4fbff')}
    }
    if(travel===1&&!giratina){orb(collision,13+Math.sin(t*19)*3,'#f0d2ff');sparks(collision,48,'#c2aafa')}
  }
  if(!giratina&&(stage==='ordinary-impact'||stage==='signature-impact')){
    const strong=stage==='signature-impact',r=(strong?60:38)*Math.sin(Math.min(1,p)*Math.PI/2)
    ctx.globalAlpha=life.opacity*(1-p*.8)
    for(let i=0;i<4;i++)ring(collision,r-i*5,i%2?'#acdafa':'#efb4fa',.8)
    orb(collision,Math.max(1,(strong?21:14)*(1-p)),strong?'#e9d9ff':'#ffd9a0');sparks(collision,r+15,strong?'#dab2fa':'#ffc684')
    for(let i=0;i<22;i++){const a=i*2.4;line({x:collision.x+Math.cos(a)*r*.55,y:collision.y+Math.sin(a)*r*.55},{x:collision.x+Math.cos(a)*r,y:collision.y+Math.sin(a)*r},i%2?'#8b91de':'#cf8cd5',2)}
    ctx.globalAlpha=life.opacity
  }
  if(life.riftVisible)for(const point of rift??(clashes??[collision]))drawSpaceCrack(ctx,point,53+Math.sin(t*1.4)*3,t,life.stage==='departure'?1-p:.75)
  ctx.restore()
}

/** Optional barriers absorb Judgment at their surface; contacts still push shielded visitors. */
export function drawCreationShields(ctx:CanvasRenderingContext2D,life:CreationLife,hits:number[],clock:number):void {
  if(!life.active)return
  ctx.save()
  for(const [index,pet] of [life.palkia,life.dialga].entries()){
    if(!life.shields[index])continue
    const cx=pet.x+96,cy=pet.y+85,r=65,color=index?'#98d9ff':'#eaa3ff',hit=hits[index]??0
    ctx.globalAlpha=.07+hit*.13;ctx.fillStyle=color
    for(let y=-r;y<=r;y++){const w=Math.sqrt(Math.max(0,r*r-y*y));ctx.fillRect(Math.round(cx-w),Math.round(cy+y),Math.round(w*2),1)}
    ctx.globalAlpha=.7+hit*.3
    for(let layer=0;layer<2;layer++)for(let i=0;i<128;i++){const a=i*Math.PI/64,rad=r-layer*4;ctx.fillStyle=layer?color:'#f1eaff';ctx.fillRect(Math.round(cx+Math.cos(a)*rad),Math.round(cy+Math.sin(a)*rad),1+hit,2)}
    ctx.globalAlpha=.22+hit*.3
    for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++){
      const x=cx+col*23+(row%2)*11,y=cy+row*20
      if(Math.hypot(x-cx,y-cy)>43)continue
      for(let j=0;j<6;j++){const a=j*Math.PI/3+clock*.0001;ctx.fillStyle=color;ctx.fillRect(Math.round(x+Math.cos(a)*11),Math.round(y+Math.sin(a)*11),2,2)}
    }
    if(hit){ctx.globalAlpha=hit;for(let i=0;i<24;i++){const a=i*2.4,rad=8+(clock*.025+i*3)%23;ctx.fillStyle=i%3?color:'#ffffff';ctx.fillRect(Math.round(cx+Math.cos(a)*rad),Math.round(cy-r+Math.sin(a)*rad*.6),2,3)}}
  }
  ctx.restore()
}
