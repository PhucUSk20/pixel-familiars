import {resizeGroup} from './arena-layout'
export const AVIAN_FORMS=['ho-oh','lugia','mewtwo','mega-mewtwo-x','mega-mewtwo-y'] as const
export type AvianForm=typeof AVIAN_FORMS[number]
const stages=['arrival','ordinary-charge','ordinary-fire','ordinary-impact','signature-charge','signature-fire','signature-impact','mega-transform','mega-charge','mega-fire','mega-impact','departure'] as const
const times=[0,3600,5600,8500,9800,12800,16000,17500,20300,23600,27300,29000,32000]
export class AvianLife {
 active=false;held=false;elapsed=0;width=480;nextVisit=12000;mega:'x'|'y'='x';hasMewtwo=false;mewtwoChance=.25
 hooh={x:0,y:0,right:true};lugia={x:0,y:20,right:false};mewtwo={x:0,y:-120,right:false}
 constructor(private random:()=>number=Math.random){this.home()}
 private home(){this.pets.forEach((p,i)=>Object.assign(p,{x:this.width*[.07,.16,.27][i]-96,y:i===1?20:0}));this.lugia.right=false}
 get pets(){return[this.hooh,this.lugia,this.mewtwo]}
 get visiblePets(){return !this.active?[]:this.pets.slice(0,2)}
 get stage():typeof stages[number]|'idle'|'soar'|'await-boss'{return !this.active?'idle':this.held?'await-boss':this.elapsed>=17500?(this.elapsed<35000?'soar':'departure'):stages.find((_,i)=>this.elapsed<times[i+1])??'departure'}
 get progress(){if(this.stage==='departure')return Math.max(0,Math.min(1,(this.elapsed-35000)/3000));const i=stages.indexOf(this.stage as typeof stages[number]);return i<0?0:Math.max(0,Math.min(1,(this.elapsed-times[i])/(times[i+1]-times[i])))}
 get form():AvianForm{return this.hasMewtwo&&this.elapsed>=18900?this.mega==='x'?'mega-mewtwo-x':'mega-mewtwo-y':'mewtwo'}
 get opacity(){return !this.active?0:this.stage==='arrival'?Math.min(1,this.elapsed/900):this.stage==='departure'?1-this.progress:1}
 opacityFor(index:number){return index===2&&!this.hasMewtwo?0:this.opacity*(index===2&&this.stage==='arrival'?Math.max(0,Math.min(1,(this.elapsed-1800)/1200)):1)}
 offset(index:number){
  if(this.held)return{x:0,y:0}
  const t=this.elapsed/1000,p=this.progress
  if(this.stage==='arrival')return{x:index===0?-55*(1-p):index===2?25*(1-p):0,y:index===1?100*(1-p):index===0?-25*(1-p):0}
  if(this.stage==='departure')return{x:(index===0?-70:70)*p,y:index===1?100*p:index===0?35*p:-60*p}
  return{x:Math.sin(t*(index===0?.48:.4)+index)*16,y:Math.sin(t*.9+index)*7+(index===1?-Math.sin(Math.min(1,(this.elapsed-3600)/3500)*Math.PI/2)*24:0)}
 }
 begin(forceMewtwo=false){if(this.active)return false;this.active=true;this.held=false;this.elapsed=0;this.hasMewtwo=forceMewtwo||this.random()<this.mewtwoChance;this.mega=this.random()<.5?'x':'y';this.home();return true}
 resize(width:number){if(!Number.isFinite(width)||width<480)return;resizeGroup(this.pets,this.width,width);this.width=width}
 hold(){if(this.active){this.held=true;this.elapsed=Math.max(3600,this.elapsed)}}
 leave(){this.held=false;if(this.active)this.elapsed=35000}
 cancel(clock:number){const was=this.active;this.active=this.held=this.hasMewtwo=false;this.elapsed=0;this.home();this.nextVisit=was?clock+45000+this.random()*30000:Math.max(this.nextVisit,clock+45000)}
 advance(delta:number,clock:number){if(!this.active||this.held||!Number.isFinite(delta)||delta<=0)return false;this.elapsed+=delta;if(this.elapsed>=38000){this.cancel(clock);return true}return false}
}
