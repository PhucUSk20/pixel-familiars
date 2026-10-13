import {placeGroup,resizeGroup} from './arena-layout'
export const UNOVA_FORMS=['reshiram','zekrom','kyurem','kyurem-white','kyurem-black'] as const
export type UnovaForm=typeof UNOVA_FORMS[number]
export type UnovaStage='absent'|'arrival'|'ordinary-charge'|'ordinary-fire'|'ordinary-impact'|'signature-charge'|'signature-fire'|'signature-impact'|'kyurem-arrival'|'missile-charge'|'missile-fire'|'missile-impact'|'kyurem-charge'|'kyurem-fire'|'kyurem-impact'|'absorb'|'fusion-charge'|'fusion-fire'|'fusion-impact'|'release'|'departure'|'await-boss'
const stages:UnovaStage[]=['arrival','ordinary-charge','ordinary-fire','ordinary-impact','signature-charge','signature-fire','signature-impact','kyurem-arrival','missile-charge','missile-fire','missile-impact','kyurem-charge','kyurem-fire','kyurem-impact','absorb','fusion-charge','fusion-fire','fusion-impact','release','departure']
const times=[0,3200,5000,7300,8500,11300,14600,16500,19500,21400,24400,25600,27800,30800,32000,35000,37400,40900,42400,44900,47500]
type Pet={x:number;y:number;right:boolean}
/** One randomly chosen Absorb Union per visit; the absorbed dragon returns before departure. */
export class UnovaLife {
 fullRoster=false
 active=false;held=false;elapsed=0;width=480;nextVisit:number;white=true
 reshiram:Pet={x:0,y:-100,right:true};zekrom:Pet={x:288,y:-100,right:false};kyurem:Pet={x:144,y:-220,right:false}
 constructor(private random:()=>number=Math.random){this.nextVisit=180000}
 get stage():UnovaStage{return !this.active?'absent':this.held?'await-boss':stages.find((_,i)=>this.elapsed<times[i+1])??'departure'}
 get progress():number{const i=stages.indexOf(this.stage);return i<0?0:Math.max(0,Math.min(1,(this.elapsed-times[i])/(times[i+1]-times[i])))}
 get host():Pet{return this.white?this.reshiram:this.zekrom}
 get opponent():Pet{return this.white?this.zekrom:this.reshiram}
 get form():UnovaForm{return this.stage.startsWith('fusion')||this.stage==='absorb'&&this.progress>=.8||this.stage==='release'&&this.progress<.5?(this.white?'kyurem-white':'kyurem-black'):'kyurem'}
 get opacity():number{return !this.active?0:this.stage==='arrival'?Math.min(1,this.progress*2):this.stage==='departure'?1-this.progress:1}
 opacityFor(index:number):number{
  if(!this.active)return 0
  if(index===2)return this.fullRoster?this.opacity:this.held?1:this.elapsed<16500?0:this.stage==='kyurem-arrival'?Math.min(1,this.progress*2):this.opacity
  if(index===(this.white?0:1)&&!this.held){if(this.stage==='absorb')return 1-this.progress;if(this.stage.startsWith('fusion'))return 0;if(this.stage==='release')return this.progress}
  return this.opacity
 }
 begin():boolean{if(this.active)return false;this.active=true;this.held=false;this.elapsed=0;this.white=this.random()<.5;placeGroup(this.pets,this.width,'unova');this.kyurem.right=this.white;return true}
 resize(width:number):void{if(!Number.isFinite(width)||width<480)return;resizeGroup(this.pets,this.width,width);this.width=width}
 get pets():Pet[]{return[this.reshiram,this.zekrom,this.kyurem]}

 hold():void{if(this.active){this.held=true;this.elapsed=19500}}
 leave():void{if(this.active){this.held=false;this.elapsed=times[times.length-2]}}
 cancel(clock:number):void{const active=this.active;this.fullRoster=false;this.active=false;this.held=false;this.elapsed=0;this.nextVisit=active?clock+120000+this.random()*120000:Math.max(this.nextVisit,clock+180000)}
 advance(delta:number,clock:number):boolean{if(!this.active||this.held||!Number.isFinite(delta)||delta<=0)return false;this.elapsed+=delta;if(this.elapsed>=times[times.length-1]){this.cancel(clock);return true}return false}
}
