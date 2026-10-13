type Point={x:number;y:number}
export function plasmaRingFrames(from:Point,to:Point,clock:number):{center:Point;radius:number;axis:Point;normal:Point}[]{
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)
 if(length<6)return []
 const axis={x:dx/length,y:dy/length},normal={x:-axis.y,y:axis.x}
 return [0,.5].map(phase=>{const age=(clock/900+phase)%1,f=.08+age*.3;return {center:{x:from.x+dx*f,y:from.y+dy*f},radius:4+age*11,axis,normal}})
}
/** Two expanding white shock rings follow the actual beam axis near its source. */
export function drawPlasmaRings(ctx:CanvasRenderingContext2D,from:Point,to:Point,clock:number,power=1):void {
 if(power<=0)return
 ctx.save();ctx.globalAlpha*=Math.min(1,power)
 ctx.fillStyle='#f5fcff'
 for(const ring of plasmaRingFrames(from,to,clock))for(let i=0;i<72;i++){
  const a=i*Math.PI/36,side=Math.sin(a)*ring.radius,depth=Math.cos(a)*ring.radius*.3
  ctx.fillRect(Math.round(ring.center.x+ring.normal.x*side+ring.axis.x*depth),Math.round(ring.center.y+ring.normal.y*side+ring.axis.y*depth),1,2)
 }
 ctx.restore()
}
