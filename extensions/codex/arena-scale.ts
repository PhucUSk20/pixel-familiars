export const RAY_SCALE=1.1,DEOXYS_SCALE=.9,ULTRA_SCALE=1.1,ETERNATUS_SCALE=1.1
export function spritePoint(origin:{x:number;y:number},point:{x:number;y:number},scale:number,right=false):{x:number;y:number}{
 return {x:origin.x+96+(right?96-point.x:point.x-96)*scale,y:origin.y+96+(point.y-96)*scale}
}
