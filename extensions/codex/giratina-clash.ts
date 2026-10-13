import type {CreationAnchors} from './creation-effects'
export type ClashPoint={x:number;y:number}
export type ShadowAnchors={mouth:ClashPoint;left:ClashPoint;right:ClashPoint}
/** Each enemy attack meets a separate shadow attack between the two actual origins. */
export function giratinaClashes(palkia:CreationAnchors,dialga:CreationAnchors,giratina:ShadowAnchors,signature:boolean,orb=false):ClashPoint[]{
 const enemies=[signature||orb?palkia.hand:palkia.mouth,dialga.mouth]
 const sources=signature?[giratina.left,giratina.right]:[giratina.mouth,giratina.mouth]
 return enemies.map((enemy,index)=>({x:enemy.x+(sources[index].x-enemy.x)*.55,y:enemy.y+(sources[index].y-enemy.y)*.55}))
}

/** The orb stays behind the pressure front so its leading edge meets the incoming skill. */
export function giratinaOrbCenters(fronts:ClashPoint[],sources:ClashPoint[]):ClashPoint[]{
 return fronts.map((front,index)=>{const source=sources[index],dx=source.x-front.x,dy=source.y-front.y,length=Math.max(1,Math.hypot(dx,dy));return {x:front.x+dx/length*22,y:front.y+dy/length*22}})
}
