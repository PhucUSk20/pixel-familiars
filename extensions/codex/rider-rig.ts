import type {RiderLife} from './rider-life'
import type {AvianPose} from './avian-rig'
export function riderPose(life:RiderLife,index:number,clock:number,hit=0):AvianPose{
 const t=clock/1000,charging=life.stage.endsWith('charge')||life.stage==='freeze',power=charging?life.progress:life.stage.endsWith('fire')?1:0
 return {wing:0,head:-power*.12,arm:index===0?-power*.75:Math.sin(t*2)*.06,leg:index===1?Math.sin(t*4)*.12:Math.sin(t*2)*.04,tail:Math.sin(t*2)*.13,lean:index===1&&life.stage==='ice-charge'?-power*.18:hit*Math.sin(t*30)*.04,lift:index===0?Math.sin(t*1.8)*2:life.stage==='ice-charge'?-power*5:Math.sin(t*2)*1.5}
}
