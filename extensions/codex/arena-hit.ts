import { meteorFlight } from './ground-duel-effects'
/** A short recoil envelope returns the sprite to its pose after contact. */
export function contactStrength(phase:number,start:number,end:number):number {
 if(phase<start||phase>=end)return 0
 const f=(phase-start)/(end-start)
 return Math.min(1,f/.08)*(1-f)
}
export function groundFireHit(turn:number,phase:number):number {
 if(turn===1)return contactStrength(phase,.7,.88)
 if(turn===2)return contactStrength(phase,.58,.85)
 if(turn!==3)return 0
 let strength=0
 for(let i=0;i<8;i++){
  const frame=meteorFlight(i,phase,{x:0,y:0},{x:1,y:1})
  if(frame?.stage==='impact')strength=Math.max(strength,contactStrength(frame.progress,0,1))
 }
 return strength
}
