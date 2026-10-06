import type { RayDeoxysDuel } from './ray-deoxys-duel'
import { deoxysPose } from './deoxys-rig'
type Point={x:number;y:number}
export function drawAirDuel(ctx:CanvasRenderingContext2D,duel:RayDeoxysDuel,mouth:Point):void {
  if(duel.stage!=='fight')return
  const p=duel.elapsed/6500,t=duel.elapsed/1000
  const pose=deoxysPose(duel.deoxys.form,'skill',duel.deoxys.elapsed)
  const core={x:duel.deoxys.x+96+pose.x,y:duel.deoxys.y+72+pose.y}
  const pixel=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
  const ring=(at:Point,r:number,c:string,flat=1,angle=0)=>{for(let i=0;i<64;i++){const a=i*Math.PI/32+angle;pixel(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*flat,2,2,c)}}
  const orb=(at:Point,r:number,c:string)=>{for(let y=-r;y<=r;y++){const w=Math.floor(Math.sqrt(r*r-y*y));pixel(at.x-w,at.y+y,w*2+1,1,c)}ring(at,r+2,'#ffefcb');pixel(at.x-r/3,at.y-r/3,r/2,r/2,'#fffbe8')}
  const beam=(a:Point,b:Point,c:string,width:number)=>{const length=Math.hypot(b.x-a.x,b.y-a.y);for(let i=0;i<=length;i+=3){const f=i/Math.max(1,length);pixel(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,width,Math.max(2,width*.5),c)}}
  const burst=(at:Point,f:number,c:string)=>{ring(at,7+f*34,c);for(let i=0;i<16;i++){const a=i*Math.PI/8;pixel(at.x+Math.cos(a)*f*47,at.y+Math.sin(a)*f*32,3,3,i%3?c:'#fff8e6')}}
  if(duel.turn===2) {
    if(p>.2&&p<.9){for(let i=0;i<16;i++)pixel(core.x-70+i*5,core.y-28+i*13%48,9,1,i%2?'#baff92':'#477a8f');ring(core,20,'#baff92',.4,t*4);beam({x:duel.ray.x+75,y:duel.ray.y+90},core,'#456d74',1)}
    if(p>.82&&p<.95)burst({x:core.x-18,y:core.y+8},(p-.82)/.13,'#a6eeaa')
    return
  }
  if(duel.turn===3) {
    const mid={x:(mouth.x+core.x)/2,y:(mouth.y+core.y)/2}
    if(p<.43){orb(mouth,3+p*23,'#9bf59a');orb(core,3+p*23,'#d49cff')}
    else if(p<.85){const f=Math.min(1,(p-.43)/.14);beam(mouth,{x:mouth.x+(mid.x-mouth.x)*f,y:mouth.y+(mid.y-mouth.y)*f},'#77dfae',7);beam(core,{x:core.x+(mid.x-core.x)*f,y:core.y+(mid.y-core.y)*f},'#c78bfa',7);orb(mid,8+Math.abs(Math.sin(t*12))*10,'#fff3d3');ring(mid,22+Math.sin(t*9)*4,'#ffbd88');for(let i=0;i<12;i++){const a=t*3+i*Math.PI/6;pixel(mid.x+Math.cos(a)*29,mid.y+Math.sin(a)*29,3,3,i%2?'#9effc7':'#d6a3ff')}}
    else if(p<.97)burst(mid,(p-.85)/.12,'#ffe8b8')
    return
  }
  const attack=duel.turn===1,source=attack?core:mouth
  const target=attack?mouth:{x:core.x-32,y:core.y+10}
  const color=attack?'#ff8d9a':'#91f6b7'
  if(!attack&&p>.25&&p<.94){const r=36*Math.min(1,(p-.25)/.15);ring({x:core.x,y:core.y+10},r,'#7be6ff');ring({x:core.x,y:core.y+10},r+3,'#d6ffff');for(let i=0;i<6;i++){const a=i*Math.PI/3;ring({x:core.x+Math.cos(a)*r,y:core.y+10+Math.sin(a)*r},4,'#c2feff')}}
  if(p<.43){orb(source,3+Math.min(1,p/.43)*(attack?15:11),color);if(attack)for(let j=0;j<3;j++)ring(source,26,color,.3,t*3+j*Math.PI/3)}
  else if(p<.7){const f=(p-.43)/.27,at=attack?duel.shot.sample(duel.elapsed,.43*6500,.7*6500,source,target)!:{x:source.x+(target.x-source.x)*f,y:source.y+(target.y-source.y)*f};beam(attack?duel.shot.origin!:source,at,attack?'#753b78':'#367a66',4);orb(at,attack?15:9,color)}
  else if(p<.9) {
    const f=(p-.7)/.2
    if(attack){orb(duel.shot.sample(duel.elapsed,.43*6500,.7*6500,source,target)!,11,color);ring({x:duel.ray.x+96,y:duel.ray.y+90},20,'#9cd5ff',.35,t*3)}
    else {burst(target,f,'#91eaff');orb({x:target.x+(mouth.x-target.x)*f,y:target.y-12*Math.sin(f*Math.PI)},6,'#b8f5ff')}
  }
}
