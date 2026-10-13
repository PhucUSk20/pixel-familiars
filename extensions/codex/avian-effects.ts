import type {AvianLife} from './avian-life'
type P={x:number;y:number}
/** Scenery anchored to the arena floor, independent of flight, recoil and facing. */
export const hoohRainbow=(width:number)=>({x:width*.095,y:158,rx:80,ry:65,top:93})
export type AvianAnchors={mouth:P;hand:P}
export function drawAvianEffects(ctx:CanvasRenderingContext2D,life:AvianLife,a:AvianAnchors[],behind=false):void{
 if(!life.active||a.length<2)return
 const p=life.progress,t=life.elapsed/1000,stage=life.stage,ultimate=stage.startsWith('signature')||stage.startsWith('mega'),color=['#ffc34c',ultimate?'#a6ffef':'#ffe77d','#bc72ff']
 const line=(f:P,to:P,width:number,c:string)=>{ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(to.x,to.y);ctx.stroke()}
 const ring=(at:P,r:number,c:string)=>{ctx.strokeStyle=c;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(at.x,at.y,Math.max(1,r),Math.max(1,r*.4),t*.3,0,Math.PI*2);ctx.stroke()}
 const orb=(at:P,r:number,c:string)=>{const g=ctx.createRadialGradient(at.x,at.y,1,at.x,at.y,Math.max(2,r));g.addColorStop(0,'#ffffff');g.addColorStop(.25,c);g.addColorStop(1,'#24133600');ctx.fillStyle=g;ctx.beginPath();ctx.arc(at.x,at.y,Math.max(1,r),0,Math.PI*2);ctx.fill()}
 const sparks=(at:P,r:number,c:string,n=12)=>{for(let i=0;i<n;i++){const angle=i*Math.PI*2/n+t*2,rr=r*(.3+(i%5)/7);ctx.fillStyle=c;ctx.fillRect(at.x+Math.cos(angle)*rr,at.y+Math.sin(angle)*rr,2,2)}}
 const front=(i:number)=>{const source=a[i].mouth,enemy=a.length===3?a[2].hand:a[1-i].mouth;return{x:source.x+(enemy.x-source.x)*(a.length===3?.52:.5),y:source.y+(enemy.y-source.y)*(a.length===3?.52:.5)}}
 ctx.save();ctx.globalAlpha=life.opacity
 if(behind){
  if(stage!=='departure'&&(stage==='arrival'||t%12<7)){
   const {x,y,rx,ry}=hoohRainbow(life.width),colors=['#ff697a','#ffa64a','#ffec6b','#86e795','#65d9f4','#8585ef','#c383ee'];ctx.globalAlpha*=stage==='arrival'?Math.min(1,p*3):.7
   colors.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,rx-i*2,ry-i*2,0,Math.PI,Math.PI*2);ctx.stroke()});sparks({x:x-15,y:y-35},20,'#fff0c3',7);ctx.globalAlpha=life.opacity
  }
  if(stage==='arrival'){const sea={x:life.lugia.x+96,y:184};ring(sea,12+p*40,'#b4efff');for(let i=0;i<18;i++){const angle=i*.7;line(sea,{x:sea.x+Math.cos(angle)*(20+p*40),y:sea.y-Math.sin(p*Math.PI)*(35+i%5*9)},2,'#70dafa')}orb({x:sea.x,y:sea.y-15},30*Math.sin(p*Math.PI),'#c4f5ff')}
  if(ultimate&&(stage.endsWith('charge')||stage.endsWith('fire'))){const offset=life.offset(0),body={x:life.hooh.x+offset.x+96,y:life.hooh.y+offset.y+86},power=stage.endsWith('fire')?1:p;for(let i=0;i<16;i++){const angle=i*.4+t,rr=40+Math.sin(t*9+i)*12;orb({x:body.x+Math.cos(angle)*rr,y:body.y+Math.sin(angle)*rr-8},(11+i%3*3)*power,i%3?'#ffae26':'#f96837')}sparks(body,46,'#ffcf58',14)}
  if(stage==='mega-transform'&&a.length===3){ring(a[2].mouth,14+p*48,'#f4b8ff');sparks(a[2].mouth,52,'#edc1ff',20);orb(a[2].mouth,32*Math.sin(p*Math.PI),'#bd7bff')}
  ctx.restore();return
 }
 if(stage.endsWith('charge'))a.forEach((at,i)=>{const point=i===2?at.hand:at.mouth;orb(point,4+p*(ultimate?22:13),i===2&&!ultimate?'#293147':color[i]);ring(point,28*(1-p)+7,color[i]);sparks(point,24*(1-p)+8,color[i]);if(i===1){for(let j=0;j<7;j++){const angle=j*Math.PI*2/7+t;line(point,{x:point.x+Math.cos(angle)*(42*(1-p)+16),y:point.y+Math.sin(angle)*(42*(1-p)+16)},1,'#fff0af')}}})
 if(stage.endsWith('fire')){
  for(let i=0;i<2;i++){
   const source=a[i].mouth,f=front(i),q=Math.min(1,p/.42),tip={x:source.x+(f.x-source.x)*q,y:source.y+(f.y-source.y)*q},radius=ultimate?11:6
   if(i===1&&!ultimate){const dx=tip.x-source.x,dy=tip.y-source.y,d=Math.max(1,Math.hypot(dx,dy)),nx=-dy/d*11,ny=dx/d*11;ctx.fillStyle='#ffd557';ctx.beginPath();ctx.moveTo(source.x,source.y);ctx.lineTo(tip.x+nx,tip.y+ny);ctx.lineTo(tip.x-nx,tip.y-ny);ctx.closePath();ctx.fill();line(source,tip,5,'#fff8cf')}
   else{line(source,tip,radius*2,i===0?'#ef7a30':'#69bfae');line(source,tip,radius,color[i]);line(source,tip,2,'#fff9dc')}
   for(let j=0;j<9;j++){const fraction=(t*1.8+j/9)%Math.max(.02,q),at={x:source.x+(f.x-source.x)*fraction,y:source.y+(f.y-source.y)*fraction};if(i===0){orb({x:at.x+Math.sin(t*10+j)*7,y:at.y+Math.cos(t*9+j)*7},5+fraction*(ultimate?12:7),'#ffbd42')}else ring(at,5+fraction*10,ultimate?'#d8fff5':'#fff1b2')}
   if(a.length===3){const enemy=a[2].hand,shot={x:enemy.x+(f.x-enemy.x)*q,y:enemy.y+(f.y-enemy.y)*q};orb(shot,ultimate?30:13,ultimate?'#a958f7':'#142a41');if(!ultimate){ctx.fillStyle='#0b1529';ctx.beginPath();ctx.arc(shot.x,shot.y,7,0,Math.PI*2);ctx.fill()}ring(shot,ultimate?26:12,'#7ddaff');sparks(shot,20,'#c596ff',8)}
   if(p>=.42&&(a.length===3||i===0)){orb(f,ultimate?17:10,'#efd0ff');sparks(f,ultimate?27:17,'#beefff',10);ring(f,12+Math.sin(t*9)*3,'#efc1ff')}
  }
 }
 if(stage.endsWith('impact'))for(let i=0;i<(a.length===3?2:1);i++){const f=front(i);orb(f,24*(1-p),'#d3b2ff');sparks(f,15+p*24,'#cfedff');ring(f,8+p*24,'#e8caff')}
 ctx.restore()
}
