export type UltraStage='ultra-arrival'|'ultra-awe'|'ultra-assault'|'ultra-charge'|'ultra-fire'|'ultra-alliance'|'departure'
const stages:UltraStage[]=['ultra-arrival','ultra-awe','ultra-assault','ultra-charge','ultra-fire','departure']
const bounds=[0,2200,4000,9000,12600,18800,21400]
export const ultraHitTime=(index:number)=>1800+index*80
/** The restored Ultra becomes a boss; Arceus takes priority and recruits it as an ally. */
export class UltraBattle {
 active=false;allied=false;waitingForArceus=false;elapsed=0
 get stage():UltraStage {return this.allied||this.waitingForArceus&&this.elapsed>=2200?'ultra-alliance':stages.find((_,i)=>this.elapsed<bounds[i+1])??'departure'}
 get progress():number {const i=stages.indexOf(this.stage);return i<0?0:Math.max(0,Math.min(1,(this.elapsed-bounds[i])/(bounds[i+1]-bounds[i])))}
 get fireElapsed():number {return this.stage==='ultra-fire'?this.elapsed-12600:0}
 get opacity():number {return this.stage==='ultra-arrival'?Math.min(1,this.elapsed/700):this.stage==='departure'?1-this.progress:1}
 get assaultPower():number {return this.stage==='ultra-assault'?Math.min(1,this.progress/.16,(1-this.progress)/.1):0}
 contact(index:number,shield=false):number {const age=this.fireElapsed-ultraHitTime(index);return this.stage==='ultra-fire'&&age>=0&&age<1800?Math.min(1,age/90)*(1-age/1800)*(shield?.55:1):0}
 begin(arrival=true):void {this.active=true;this.allied=false;this.waitingForArceus=false;this.elapsed=arrival?0:2200}
 waitForArceus():void {if(this.active)this.waitingForArceus=true}
 joinArceus():void {if(this.active){this.allied=true;this.waitingForArceus=false}}
 leave():void {if(this.active){this.allied=false;this.waitingForArceus=false;this.elapsed=18800}}
 cancel():void {this.active=false;this.allied=false;this.waitingForArceus=false;this.elapsed=0}
 advance(delta:number):boolean {if(!this.active||this.allied||!Number.isFinite(delta)||delta<=0)return false;this.elapsed+=delta;if(this.waitingForArceus){this.elapsed=Math.min(this.elapsed,2200);return false}if(this.elapsed>=21400){this.cancel();return true}return false}
}
