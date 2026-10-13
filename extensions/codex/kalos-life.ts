import {placeGroup,resizeGroup} from './arena-layout'
export const KALOS_FORMS=['xerneas','yveltal','zygarde-complete','mega-zygarde-complete'] as const
export type KalosForm=typeof KALOS_FORMS[number]
const stages=['arrival','ordinary-charge','ordinary-fire','ordinary-impact','signature-charge','signature-fire','signature-impact','guardian-arrival','extreme-speed','core-charge','core-fire','core-impact','mega-evolution','mega-charge','mega-fire','aftermath','departure'] as const
export type KalosStage=typeof stages[number]|'absent'|'await-boss'
const times=[0,3000,4500,6700,8000,11000,14500,16000,18500,20500,23500,27000,28500,31500,35500,39500,42000,44600]
type P={x:number;y:number;right:boolean}
/** Life/destruction duel followed by the guardian's intervention and Mega cannon. */
export class KalosLife {
 fullRoster=false
 active=false;held=false;mega=false;elapsed=0;width=480;nextVisit=240000;private countered=false
 xerneas:P={x:0,y:-165,right:true};yveltal:P={x:288,y:-180,right:false};zygarde:P={x:144,y:-100,right:false}
 constructor(private random:()=>number=Math.random){}
 get pets():P[]{return[this.xerneas,this.yveltal,this.zygarde]}
 get stage():KalosStage{return !this.active?'absent':this.held?'await-boss':stages.find((_,i)=>this.elapsed<times[i+1])??'departure'}
 get progress():number{const i=stages.indexOf(this.stage as typeof stages[number]);return i<0?0:Math.max(0,Math.min(1,(this.elapsed-times[i])/(times[i+1]-times[i])))}
 get form():KalosForm{return this.mega?'mega-zygarde-complete':'zygarde-complete'}
 get opacity():number{return !this.active?0:this.stage==='arrival'?Math.min(1,this.progress*2):this.stage==='departure'?1-this.progress:1}
 opacityFor(index:number):number{return index===2&&!this.held&&!this.fullRoster?(this.elapsed<16000?0:this.stage==='guardian-arrival'?Math.min(1,this.progress*2):this.opacity):this.opacity}
 get pairHit():number{return this.stage==='core-fire'&&this.progress>.5?Math.max(0,1-(this.progress-.5)*2):this.stage==='mega-fire'&&this.progress>.35?Math.max(0,1-(this.progress-.35)*1.3):0}
 offset(index:number):{x:number;y:number}{if(index!==2)return{x:0,y:this.stage==='arrival'&&index===1?35*(1-this.progress):0};if(this.stage==='extreme-speed'){const p=this.progress,side=p<.5?-1:1,q=Math.sin((p% .5)*Math.PI*2),target=side<0?this.xerneas:this.yveltal;return{x:(target.x-this.zygarde.x)*q,y:(target.y-this.zygarde.y)*q}}return{x:0,y:this.stage==='guardian-arrival'?40*(1-this.progress):0}}
 begin():boolean{if(this.active)return false;this.active=true;this.held=this.mega=this.countered=false;this.elapsed=0;placeGroup(this.pets,this.width,'kalos');return true}
 resize(width:number):void{if(!Number.isFinite(width)||width<480)return;resizeGroup(this.pets,this.width,width);this.width=width}
 hold():void{if(this.active){this.held=true;this.elapsed=Math.max(18500,this.elapsed)}}
 leave():void{if(this.active){this.held=false;this.elapsed=42000}}
 cancel(clock:number):void{const active=this.active;this.fullRoster=false;this.active=this.held=this.mega=false;this.elapsed=0;this.nextVisit=active?clock+150000+this.random()*120000:Math.max(this.nextVisit,clock+240000)}
 advance(delta:number,clock:number):boolean{if(!this.active||this.held||!Number.isFinite(delta)||delta<=0)return false;this.elapsed+=delta;if(this.elapsed>=30500&&this.elapsed<42000)this.mega=true;if(this.elapsed>=37000&&!this.countered){this.countered=true;this.xerneas.x-=28;this.yveltal.x+=28}if(this.elapsed>=44600){this.cancel(clock);return true}return false}
}
