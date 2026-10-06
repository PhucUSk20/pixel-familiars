import { KYOGRE_DURATION, type KyogreAction, type KyogrePose } from './primal-kyogre'

/** Freeze the orbit at release so every jet starts where its charging orb already was. */
export function kyogreJetOrigins(mouth:{x:number;y:number},right:boolean,elapsed:number):{x:number;y:number}[] {
 const t=Math.min(elapsed,KYOGRE_DURATION.pulse*.46)/1000,dir=right?1:-1
 return Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5+t*.55;return {x:mouth.x+dir*(14+Math.cos(a)*10),y:mouth.y+Math.sin(a)*22}})
}
export function kyogreThunderActive(elapsed:number):boolean {
 const p=elapsed/KYOGRE_DURATION.rain
 return p>.25&&p<.95&&(elapsed/1000)%1.75<.16
}
/** Shared pixel water effects for the preview and arena, with an articulated origin. */
export function drawKyogreEffects(ctx: CanvasRenderingContext2D, action: KyogreAction, pose: KyogrePose, elapsed: number, mouth: { x: number; y: number }, right = false, range = 180, surface = 150,hitX?:number,thunderTarget?:{x:number;y:number},waveTarget?:{x:number;y:number}): void {
  const t = elapsed/1000, p = elapsed/KYOGRE_DURATION[action], dir = right ? 1 : -1
  const pixel = (x: number,y: number,w: number,h: number,color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)) }
  const disc = (x: number,y: number,r: number,color: string) => {
    r = Math.max(1,Math.round(r))
    for (let row = -r; row <= r; row++) { const half = Math.floor(Math.sqrt(r*r-row*row)); pixel(x-half,y+row,half*2+1,1,color) }
  }
  const ring = (x: number,y: number,r: number,flat = 1,color = '#81d5f0') => {
    for (let i = 0; i < 48; i++) { const a = i*Math.PI/24; pixel(x+Math.cos(a)*r,y+Math.sin(a)*r*flat,1,1,color) }
  }
  const orb = (x: number,y: number,r: number) => { disc(x,y,r,'#21689c'); disc(x,y,r*.75,'#69c6ec'); disc(x-1,y-1,r*.45,'#dcfbff'); ring(x,y,r+2) }
  if (action === 'pulse' && p > .02 && p < .94) {
    const origins=kyogreJetOrigins(mouth,right,elapsed)
    for(let i=0;i<5;i++) {
      const {x:ox,y:oy}=origins[i]
      if (p < .46) {
        const radius=2+Math.min(1,p/.42)*5; orb(ox,oy,radius)
        for (let j = 0; j < 3; j++) { const f = (t*.8+j/3+i*.2)%1; pixel(ox+dir*(1-f)*20,oy+(1-f)*10,1,1,'#b4efff') }
      } else {
        const f = Math.min(1,(p-.46)/.32), tip = hitX===undefined?ox+dir*range*f:ox+(hitX-ox)*f, y = oy, origin=ox
        for(let x=origin;(tip-x)*dir>=0;x+=dir*4){pixel(x,y-1,5,3,'#258bb6');pixel(x,y,5,1,'#d7ffff')}
        orb(origin,y,7-3*f)
        for(let j=1;j<7;j++)pixel(tip-dir*j*4,y,4,1,j<3?'#ffffff':'#78d5ee')
        orb(tip,y,3); ring(origin,y,5+Math.sin(t*9+i)*.5,1,'#3d95bb')
        if(hitX!==undefined&&f>=1){
          ring(tip,y,5+Math.sin(t*18+i)*2,.65,'#c5f8ff')
          for(let j=0;j<10;j++){const age=(t*2.7+j*.1+i*.13)%1,a=j*Math.PI/5;pixel(tip+Math.cos(a)*age*19,y+Math.sin(a)*age*15+age*age*10,2,2,j%3?'#75d6f4':'#ffffff')}
          for(let j=0;j<3;j++){const age=(t*.85+j/3+i*.17)%1;ring(tip-dir*age*7,y-age*27,2+age*5,.7,'#b9d6d9')}
        }
      }
    }
  } else if (action === 'wave' && p > .1 && p < .95) {
    const target=waveTarget??{x:mouth.x+dir*range,y:mouth.y}
    const merge=Math.min(1,Math.max(0,(p-.38)/.18)),growth=Math.min(1,(p-.1)/.18)
    const center=mouth.x+dir*40
    if(p<.56){
      for(let side=-1;side<=1;side+=2){
        const base=center+side*32*(1-merge),height=(92+merge*12)*growth
        ring(base,surface,24*growth,.22,'#b8f5ff')
        for(let row=0;row<height;row+=2){
          const f=row/height,r=(8+f*16)*growth,x=base+Math.sin(f*5+t*3)*5*(1-merge),y=surface-row
          pixel(x-r,y,r*2,2,'#165d8d');pixel(x-r*.65,y,r*1.3,2,'#2d9ac1')
          for(let band=0;band<2;band++){const a=f*22-t*11+band*Math.PI,edge=x+Math.cos(a)*r;pixel(edge-2,y,5,2,Math.sin(a)>0?'#e2ffff':'#74cde7')}
        }
        for(let j=0;j<24;j++){const f=(t*.65+j/24)%1,a=f*14-t*9;pixel(base+Math.cos(a)*(12+f*20),surface-f*height,2,3,'#b9f5ff')}
      }
    } else {
      const travel=Math.min(1,(p-.56)/.2),cx=center+(target.x-center)*travel,cy=mouth.y+(target.y-mouth.y)*travel
      // A horizontal, rotating water drill retains both winding streams after fusion.
      for(let back=0;back<62;back+=2){
        const f=back/62,x=cx-dir*back,r=(26-back*.22)*(1-(p>.86?(p-.86)/.09:0))
        pixel(x,cy-r,3,r*2,'#176c9e');pixel(x,cy-r*.62,3,r*1.24,'#47bddb')
        for(let band=0;band<2;band++){const a=f*13-t*15+band*Math.PI;pixel(x-1,cy+Math.sin(a)*r-2,4,4,'#e0ffff')}
      }
      ring(cx,cy,25,.95,'#c4ffff');ring(cx-dir*10,cy,31,.85,'#60cfe9')
      if(travel===1){
        for(let j=0;j<48;j++){const age=(t*1.4+j/48)%1,a=j*2.4;pixel(target.x+Math.cos(a)*age*62,target.y+Math.sin(a)*age*48+age*age*16,3,4,j%3?'#9bedff':'#f0ffff')}
        ring(target.x,target.y,28+(t*.8%1)*32,.75,'#d3fbff')
        for(let j=0;j<8;j++){const age=(t*.8+j/8)%1;ring(target.x+Math.sin(j*2)*age*23,target.y-age*54,4+age*9,.7,'#bedcde')}
      }
    }
  } else if (action === 'rain' && p > .1 && p < .95) {
    const stormMin=Math.min(mouth.x-65,(thunderTarget?.x??mouth.x)-45)
    const stormMax=Math.max(mouth.x+95,(thunderTarget?.x??mouth.x)+45),stormWidth=stormMax-stormMin
    for(let i=0;i<Math.ceil(stormWidth/24);i++){const x=stormMin+i*24,y=19+i%3*3;pixel(x,y,27,5,'#243947');pixel(x+4,y-3,18,4,'#314a5a')}
    for(let i=0;i<Math.ceil(stormWidth/5);i++){const f=(t*.75+i*.071)%1,x=stormMin+(i*31)%stormWidth-f*8,y=30+f*(surface-30);pixel(x,y,1,5,'#5d9dbb');if(f>.92)ring(x,surface+1,2+(f-.92)*30,.3,'#719caa')}
    if(kyogreThunderActive(elapsed)) {
      const target=thunderTarget??{x:mouth.x+dir*40,y:surface}
      const start={x:target.x,y:27},length=Math.max(1,Math.hypot(target.x-start.x,target.y-start.y))
      const dx=(target.x-start.x)/length,dy=(target.y-start.y)/length
      for(let distance=0;distance<=length;distance+=1){
        const f=distance/length,jag=Math.sin(f*Math.PI)*Math.asin(Math.sin(distance*.17))*4
        const x=start.x+(target.x-start.x)*f-dy*jag,y=start.y+(target.y-start.y)*f+dx*jag
        pixel(x-2,y-2,5,5,'#bdf3ff');pixel(x,y-1,2,3,'#ffffff')
      }
      ring(target.x,target.y,11+t%1.75*45,.65,'#e4ffff')
      for(let i=0;i<12;i++){const a=i*Math.PI/6,r=8+t%1.75*75;pixel(target.x+Math.cos(a)*r,target.y+Math.sin(a)*r,2,3,i%2?'#8eddff':'#ffffff')}
    }
  } else if (action === 'dive') {
    for (let i = 0; i < 12; i++) { const f = (t*.5+i/12)%1; ring(mouth.x+24+i%4*8,surface+6-f*50,1+i%3,1,'#67bbd3') }
    ring(mouth.x+20,surface-1,12+pose.depth*18,.2)
  } else if (action === 'roar' && pose.jaw > .08) {
    for (let i = 0; i < 3; i++) ring(mouth.x+dir*6,mouth.y,6+(t*23+i*13)%35,.65,'#afe9ed')
  } else if (action === 'sleep') {
    ctx.fillStyle = '#b2dce5'; ctx.font = '8px monospace'; ctx.fillText('z Z',mouth.x+8,mouth.y-18-t*2%7)
  }
}
