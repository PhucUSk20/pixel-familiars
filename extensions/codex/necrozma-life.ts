import {groupPositions,resizeGroup} from './arena-layout'
import {UltraBattle,type UltraStage} from './ultra-battle'
export type NecrozmaForm='normal'|'dawn'|'dusk'|'ultra'
export type LightHost='lunala'|'solgaleo'
export const NECROZMA_STAGES=['arrival','absorb-first','first-charge','first-fire','first-ultimate-charge','first-ultimate-fire','release-first','absorb-second','second-charge','second-fire','second-ultimate-charge','second-ultimate-fire','release-host','restoration-charge','restoration-fire','ultra-burst','ultra-charge','ultra-fire','departure'] as const
export type NecrozmaStage=typeof NECROZMA_STAGES[number]|'absent'|UltraStage
const boundaries=[0,2800,5600,7600,10200,12700,15900,18100,20900,22900,25500,28000,31200,33700,36200,38900,42400,45400,49400,52200]
type P={x:number;y:number}
/** Anime-inspired sequence: Lunala is freed by Solgaleo, then light restores the Blinding One. */
export class NecrozmaLife {
 active=false;elapsed=0;first:LightHost='lunala';nextVisit:number;width=480
 readonly battle=new UltraBattle()
 actor={x:144,y:-236,right:false}
 constructor(private random:()=>number=Math.random){this.nextVisit=210000+random()*150000}
 get stage():NecrozmaStage {return !this.active?'absent':this.battle.active?this.battle.stage:NECROZMA_STAGES.find((_,i)=>this.elapsed<boundaries[i+1])??'departure'}
 get progress():number {if(this.battle.active)return this.battle.progress;const i=NECROZMA_STAGES.indexOf(this.stage as typeof NECROZMA_STAGES[number]);return i<0?0:Math.max(0,Math.min(1,(this.elapsed-boundaries[i])/(boundaries[i+1]-boundaries[i])))}
 get second():LightHost {return this.first==='lunala'?'solgaleo':'lunala'}
 get form():NecrozmaForm {
  if(this.battle.active)return 'ultra'
  if(this.elapsed<4900||this.elapsed>=17000&&this.elapsed<20200||this.elapsed>=32500&&this.elapsed<40825)return 'normal'
  if(this.elapsed>=40825)return 'ultra'
  const host=this.elapsed<20200?this.first:this.second;return host==='lunala'?'dawn':'dusk'
 }
 get opacity():number {return !this.active?0:this.battle.active?this.battle.opacity:this.stage==='arrival'?Math.min(1,Math.max(0,(this.elapsed-400)/1000)):this.stage==='departure'?1-this.progress:1}
 get flash():number {const center=this.stage==='ultra-burst'?.55:this.stage.startsWith('absorb')?.75:this.stage.startsWith('release')?.5:-1;return center<0?0:Math.max(0,1-Math.abs(this.progress-center)/.14)}
 get heightOffset():number {if(this.battle.active)return this.stage==='ultra-arrival'?-100*(1-this.progress):this.stage==='departure'?-100*this.progress:0;return this.stage==='arrival'?-100*(1-this.progress):this.stage==='departure'?-100*this.progress:0}
 get opponent():LightHost {return this.elapsed<18100?this.second:this.first}
 begin():boolean {if(this.active)return false;this.active=true;this.elapsed=0;this.first='lunala';Object.assign(this.actor,groupPositions(this.width,'celestial')[2]);return true}
 resize(width:number):void {if(!Number.isFinite(width)||width<480)return;resizeGroup([this.actor],this.width,width);this.width=width}
 beginUltra():boolean {if(this.active)return false;this.active=true;this.elapsed=42400;Object.assign(this.actor,groupPositions(this.width,'celestial')[2]);this.battle.begin();return true}
 cancel(clock:number):void {this.battle.cancel();this.active=false;this.elapsed=0;this.nextVisit=clock+210000+this.random()*150000}
 advance(delta:number,clock:number):boolean {
  if(!this.active||!Number.isFinite(delta)||delta<=0)return false
  if(this.battle.active){if(this.battle.advance(delta)){this.cancel(clock);return true}return false}
  this.elapsed+=delta
  if(this.elapsed>=42400)this.battle.begin(false)
  return false
 }
 host(host:LightHost,origin:P):P&{opacity:number} {
  if(this.battle.active)return {...origin,opacity:1}
  let opacity=1,travel=0
  if(host===this.first){
   if(this.elapsed>=2800&&this.elapsed<5600){travel=this.progress;opacity=1-travel}
   else if(this.elapsed>=5600&&this.elapsed<15900)opacity=0
   else if(this.elapsed>=15900&&this.elapsed<18100){travel=1-this.progress;opacity=this.progress}
  }else{
   if(this.elapsed>=18100&&this.elapsed<20900){travel=this.progress;opacity=1-travel}
   else if(this.elapsed>=20900&&this.elapsed<31200)opacity=0
   else if(this.elapsed>=31200&&this.elapsed<33700){travel=1-this.progress;opacity=this.progress}
  }
  return{x:origin.x+(this.actor.x-origin.x)*travel,y:origin.y+(this.actor.y-origin.y)*travel,opacity}
 }
}
