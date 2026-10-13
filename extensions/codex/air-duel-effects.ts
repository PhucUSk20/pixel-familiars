import {drawAerialFinale} from './aerial-finale'
import {spritePoint,DEOXYS_SCALE} from './arena-scale'
import {drawPlasmaRings} from './plasma-rings'
import type { RayDeoxysDuel } from './ray-deoxys-duel'
import { deoxysPose } from './deoxys-rig'
type Point={x:number;y:number}
export function drawAirDuel(ctx:CanvasRenderingContext2D,duel:RayDeoxysDuel,mouth:Point):void {
  if(duel.stage!=='fight')return
  const p=duel.elapsed/6500,t=duel.elapsed/1000
  const pose=deoxysPose(duel.deoxys.form,'skill',duel.deoxys.elapsed)
  const core=spritePoint(duel.deoxys,{x:96+pose.x,y:72+pose.y},DEOXYS_SCALE)
  if(duel.turn===4){drawAerialFinale(ctx,duel,mouth,core);return}
  const pixel=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
  const ring=(at:Point,r:number,c:string,flat=1,angle=0)=>{for(let i=0;i<64;i++){const a=i*Math.PI/32+angle;pixel(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*flat,2,2,c)}}
  const orb=(at:Point,r:number,c:string)=>{for(let y=-r;y<=r;y++){const w=Math.floor(Math.sqrt(r*r-y*y));pixel(at.x-w,at.y+y,w*2+1,1,c)}ring(at,r+2,'#ffefcb');pixel(at.x-r/3,at.y-r/3,r/2,r/2,'#fffbe8')}
  const beam=(a:Point,b:Point,c:string,width:number)=>{const length=Math.hypot(b.x-a.x,b.y-a.y);for(let i=0;i<=length;i+=3){const f=i/Math.max(1,length);pixel(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,width,Math.max(2,width*.5),c)}}
  const burst=(at:Point,f:number,c:string)=>{ring(at,7+f*34,c);for(let i=0;i<16;i++){const a=i*Math.PI/8;pixel(at.x+Math.cos(a)*f*47,at.y+Math.sin(a)*f*32,3,3,i%3?c:'#fff8e6')}}
  if(duel.turn===2) {
    drawAerialFinale(ctx,duel,mouth,core)
    if(p>.2&&p<.9){for(let i=0;i<16;i++)pixel(core.x-70+i*5,core.y-28+i*13%48,9,1,i%2?'#baff92':'#477a8f');ring(core,20,'#baff92',.4,t*4);beam({x:duel.ray.x+75,y:duel.ray.y+90},core,'#456d74',1)}
    if(p>.82&&p<.95)burst({x:core.x-18,y:core.y+8},(p-.82)/.13,'#a6eeaa')
    return
  }
  if(duel.turn===3) {
    const mid={x:(mouth.x+core.x)/2,y:(mouth.y+core.y)/2}
    if(p<.43){orb(mouth,3+p*23,'#9bf59a');orb(core,3+p*23,'#d49cff')}
    else if(p<.85){const f=Math.min(1,(p-.43)/.14);beam(mouth,{x:mouth.x+(mid.x-mouth.x)*f,y:mouth.y+(mid.y-mouth.y)*f},'#77dfae',7);beam(core,{x:core.x+(mid.x-core.x)*f,y:core.y+(mid.y-core.y)*f},'#c78bfa',7);drawPlasmaRings(ctx,mouth,mid,duel.elapsed,f);drawPlasmaRings(ctx,core,mid,duel.elapsed,f);orb(mid,8+Math.abs(Math.sin(t*12))*10,'#fff3d3');ring(mid,22+Math.sin(t*9)*4,'#ffbd88');for(let i=0;i<12;i++){const a=t*3+i*Math.PI/6;pixel(mid.x+Math.cos(a)*29,mid.y+Math.sin(a)*29,3,3,i%2?'#9effc7':'#d6a3ff')}}
    else if(p<.97)burst(mid,(p-.85)/.12,'#ffe8b8')
    return
  }
  if(duel.turn===0){
    const center={x:core.x,y:core.y+10},r=36*Math.min(1,Math.max(0,(p-.25)/.15))
    if(p>.25&&p<.94){ring(center,r,'#7be6ff');ring(center,r+3,'#d6ffff');for(let i=0;i<6;i++){const a=i*Math.PI/3;ring({x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r},4,'#c2feff')}}
    if(p>.24&&p<.88){
      const front={x:center.x-r,y:center.y},release=Math.min(1,(p-.24)/.19),end={x:mouth.x+(front.x-mouth.x)*release,y:mouth.y+(front.y-mouth.y)*release}
      for(let layer=0;layer<3;layer++)for(let i=0;i<65;i++){const f=i/64,x=mouth.x+(end.x-mouth.x)*f,y=mouth.y+(end.y-mouth.y)*f,width=(3+f*18)*(1-layer*.32);pixel(x,y-width*.35+Math.sin(f*30-t*25)*width*.2,3,Math.max(2,width*.7),['#ac3029','#ff8139','#fffbea'][layer])}
      for(let i=0;i<20;i++){const f=(t*1.6+i*.137)%1;pixel(mouth.x+(end.x-mouth.x)*f,end.y+Math.sin(i*4+t*11)*(3+f*13),2,3,i%3?'#ffac41':'#ffeb91')}
      if(release===1){const f=(t*5)%1;ring(front,3+f*12,'#ffdd8b');for(let i=0;i<6;i++){const a=i*Math.PI/3;pixel(front.x+Math.cos(a)*f*17,front.y+Math.sin(a)*f*17,2,2,'#b4faff')}}
    }
    return
  }
  // Both projectiles share one locked collision point; neither is reflected at a pet.
  if(p<.43){orb(mouth,3+Math.min(1,p/.43)*11,'#91f6b7');orb(core,3+Math.min(1,p/.43)*15,'#ff8d9a')}
  else if(p<.7){
    const mid={x:(mouth.x+core.x)/2,y:(mouth.y+core.y)/2}
    const at=duel.shot.sample(duel.elapsed,.43*6500,.7*6500,core,mid)!,target=duel.shot.target!,f=(p-.43)/.27
    const rayAt={x:mouth.x+(target.x-mouth.x)*f,y:mouth.y+(target.y-mouth.y)*f}
    beam(duel.shot.origin!,at,'#753b78',3);beam(mouth,rayAt,'#367a66',3);orb(at,15,'#ff8d9a');orb(rayAt,11,'#91f6b7')
  }else if(p<.94){const mid=duel.shot.target??{x:(mouth.x+core.x)/2,y:(mouth.y+core.y)/2},f=(p-.7)/.24;orb(mid,18*(1-f),'#fff4df');burst(mid,f,'#e5a0fb');ring(mid,5+f*28,'#9af9d2')}
}
