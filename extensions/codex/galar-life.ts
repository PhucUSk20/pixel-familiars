import {placeGroup,resizeGroup} from './arena-layout'
export const GALAR_FORMS=['zacian-crowned','zamazenta-crowned','eternatus','eternatus-eternamax'] as const
export type GalarForm=typeof GALAR_FORMS[number]
const stages=['arrival','ordinary-charge','ordinary-fire','ordinary-impact','cannon-charge','cannon-fire','cannon-impact','eternamax','storm-charge','storm-fire','storm-impact','hero-charge','hero-rush','eternabeam-charge','eternabeam-fire','final-charge','final-strike','defeat','departure'] as const
const times=[0,3000,4500,7000,8000,11000,14000,15000,18000,20000,23000,24000,27000,30000,33000,36000,38000,41000,43000,46000]
export type GalarStage=typeof stages[number]|'absent'|'await-boss'
type Pet={x:number;y:number;right:boolean}
/** The crowned heroes cooperate against Eternatus and its Eternamax form. */
export class GalarLife {
 active=false;held=false;eternamax=false;elapsed=0;width=480;nextVisit=300000
 zacian:Pet={x:0,y:-65,right:false};zamazenta:Pet={x:64,y:-145,right:true};eternatus:Pet={x:288,y:-215,right:false}
 constructor(private random:()=>number=Math.random){}
 get pets():Pet[]{return[this.zacian,this.zamazenta,this.eternatus]}
 get stage():GalarStage{return !this.active?'absent':this.held?'await-boss':stages.find((_,i)=>this.elapsed<times[i+1])??'departure'}
 get progress():number{const i=stages.indexOf(this.stage as typeof stages[number]);return i<0?0:Math.max(0,Math.min(1,(this.elapsed-times[i])/(times[i+1]-times[i])))}
 get form():GalarForm{return this.eternamax?'eternatus-eternamax':'eternatus'}
 get opacity():number{return !this.active?0:this.stage==='arrival'?Math.min(1,this.progress*2):this.stage==='departure'?1-this.progress:1}
 opacityFor(index:number):number{return index===2&&!this.held?(this.stage==='defeat'?1-this.progress:this.stage==='departure'?0:this.opacity):this.opacity}
 get hit():number{return this.stage==='ordinary-impact'||this.stage==='cannon-impact'||this.stage==='storm-impact'?1-this.progress:0}
 offset(index:number):{x:number;y:number}{
  if(index===2)return{x:0,y:this.stage==='arrival'?-50*(1-this.progress):0}
  if(this.stage!=='hero-rush'&&this.stage!=='eternabeam-fire'&&this.stage!=='final-strike')return{x:0,y:0}
  const pet=this.pets[index],q=this.stage==='final-strike'?Math.sin(this.progress*Math.PI)*.93:this.stage==='hero-rush'?Math.sin(this.progress*Math.PI)*.72:Math.sin(this.progress*Math.PI)*.28
  return{x:(this.eternatus.x-pet.x-(index===0?20:85))*q,y:(this.eternatus.y-pet.y+(index===0?5:65))*q}
 }
 begin():boolean{if(this.active)return false;this.active=true;this.held=this.eternamax=false;this.elapsed=0;placeGroup(this.pets,this.width,'galar');this.zamazenta.right=false;return true}
 resize(width:number):void{if(!Number.isFinite(width)||width<480)return;resizeGroup(this.pets,this.width,width);this.width=width}
 hold():void{if(this.active){this.held=true;this.elapsed=Math.max(3000,this.elapsed)}}
 leave():void{if(this.active){this.held=false;this.elapsed=43000}}
 cancel(clock:number):void{const active=this.active;this.active=this.held=this.eternamax=false;this.elapsed=0;this.nextVisit=active?clock+180000+this.random()*120000:Math.max(this.nextVisit,clock+300000)}
 advance(delta:number,clock:number):boolean{if(!this.active||this.held||!Number.isFinite(delta)||delta<=0)return false;this.elapsed+=delta;if(this.elapsed>=16500&&this.elapsed<43000)this.eternamax=true;if(this.elapsed>=46000){this.cancel(clock);return true}return false}
}
