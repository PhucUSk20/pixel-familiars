import {placeGroup,resizeGroup} from './arena-layout'
export type CelestialStage='absent'|'arrival'|'ordinary-charge'|'ordinary-fire'|'ordinary-impact'|'signature-charge'|'signature-fire'|'signature-impact'|'await-arceus'|'await-necrozma'|'await-ultra'|'departure'
const boundaries=[0,3000,4800,7100,8600,12100,15600,18000,20700]
const stages:CelestialStage[]=['arrival','ordinary-charge','ordinary-fire','ordinary-impact','signature-charge','signature-fire','signature-impact','departure']
/** Temporary friendly visitors; no host messages or model requests. */
export class SunMoonLife {
 active=false;held=false;heldForNecrozma=false;heldForUltra=false;elapsed=0;nextVisit:number;width=480
 lunala={x:264,y:-116,right:false};solgaleo={x:24,y:-106,right:true}
 constructor(private random:()=>number=Math.random){this.nextVisit=90000+random()*90000}
 get stage():CelestialStage {if(!this.active)return 'absent';if(this.held)return this.heldForUltra?'await-ultra':this.heldForNecrozma?'await-necrozma':'await-arceus';return stages.find((_,i)=>this.elapsed<boundaries[i+1])??'departure'}
 get progress():number {const i=stages.indexOf(this.stage);return i<0?0:Math.max(0,Math.min(1,(this.elapsed-boundaries[i])/(boundaries[i+1]-boundaries[i])))}
 get opacity():number {return !this.active?0:this.stage==='arrival'?Math.min(1,Math.max(0,(this.elapsed-500)/1500)):this.stage==='departure'?1-this.progress:1}
 resize(width:number):void {if(!Number.isFinite(width)||width<480)return;resizeGroup([this.solgaleo,this.lunala],this.width,width);this.width=width}
 begin(elevated=false):boolean {if(this.active)return false;this.active=true;this.held=false;this.elapsed=0;placeGroup([this.solgaleo,this.lunala],this.width,'celestial');this.solgaleo.right=true;this.lunala.right=false;return true}
 holdForArceus():void {if(this.active){this.held=true;this.heldForNecrozma=false;this.heldForUltra=false}}
 holdForUltra():void {if(this.active){this.held=true;this.heldForUltra=true;this.heldForNecrozma=false}}
 holdForNecrozma():void {if(this.active){this.held=true;this.heldForNecrozma=true}}
 leave():void {if(this.active){this.held=false;this.heldForNecrozma=false;this.heldForUltra=false;this.elapsed=18000}}

 cancel(clock:number):void {this.active=false;this.held=false;this.heldForNecrozma=false;this.heldForUltra=false;this.elapsed=0;this.nextVisit=clock+90000+this.random()*90000}
 advance(delta:number,clock:number):boolean {if(!this.active||this.held||!Number.isFinite(delta)||delta<=0)return false;this.elapsed+=delta;if(this.elapsed>=20700){this.cancel(clock);return true}return false}
}
