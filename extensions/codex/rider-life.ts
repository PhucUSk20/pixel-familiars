import {resizeGroup} from './arena-layout'
export const RIDER_FORMS=['calyrex-ice-rider','calyrex-shadow-rider','mega-heatran','terapagos-stellar'] as const
export type RiderForm=typeof RIDER_FORMS[number]
const stages=['arrival','ordinary-charge','ordinary-fire','ordinary-impact','ice-charge','freeze','lance-charge','lance-fire','lance-impact','mega-transform','rider-transform','astral-charge','astral-fire','astral-impact','mega-charge','mega-fire','mega-impact','rider-return','departure'] as const
const times=[0,2800,4300,6500,8000,10300,12100,14300,16500,18500,21000,23300,26000,30000,32000,35000,39000,42000,44000,47000]
export class RiderLife {
 active=false;held=false;elapsed=0;width=480;mega:'x'|'y'='x';strong=false
 mewtwo={x:0,y:-120,right:false};terapagos={x:0,y:-120,right:true};calyrex={x:0,y:16,right:true};heatran={x:0,y:55,right:false}
 constructor(private random:()=>number=Math.random){}
 get pets(){return[this.mewtwo,this.terapagos,this.calyrex,this.heatran]}
 get stage():typeof stages[number]|'absent'|'await-boss'{return !this.active?'absent':this.held?'await-boss':stages.find((_,i)=>this.elapsed<times[i+1])??'departure'}
 get progress(){const i=stages.indexOf(this.stage as typeof stages[number]);return i<0?0:Math.max(0,Math.min(1,(this.elapsed-times[i])/(times[i+1]-times[i])))}
 get form():RiderForm{return this.elapsed>=22150&&this.elapsed<43000?'calyrex-shadow-rider':'calyrex-ice-rider'}
 get mewtwoForm():'mewtwo'|'mega-mewtwo-x'|'mega-mewtwo-y'{return this.strong||this.elapsed>=19750?this.mega==='x'?'mega-mewtwo-x':'mega-mewtwo-y':'mewtwo'}
 get opacity(){return !this.active?0:this.stage==='arrival'?Math.min(1,this.elapsed/1200):this.stage==='departure'?1-this.progress:1}
 get frozen(){return ['freeze','lance-charge','lance-fire'].includes(this.stage)}
 get flash(){return ['mega-transform','rider-transform','rider-return'].includes(this.stage)?Math.max(0,1-Math.abs(this.progress-.5)/.18):0}
 begin(mega?:'x'|'y',strong=false){if(this.active)return false;this.active=true;this.held=false;this.elapsed=0;this.strong=strong;this.mega=mega??(this.random()<.5?'x':'y');this.home();return true}
 private home(){this.mewtwo.x=this.width*.44-96;this.terapagos.x=this.width*.34-96;this.calyrex.x=this.width*.77-96;this.heatran.x=this.width*.92-96}
 setTier(_upper:boolean){this.mewtwo.y=this.terapagos.y=-120}
 resize(width:number){if(!Number.isFinite(width)||width<480)return;resizeGroup(this.pets,this.width,width);this.width=width}
 hold(){if(this.active){this.held=true;this.elapsed=Math.max(2800,this.elapsed)}}
 leave(){if(this.active){this.held=false;this.elapsed=44000}}
 cancel(){this.active=this.held=this.strong=false;this.elapsed=0}
 offset(index:number){if(this.held)return{x:0,y:0};const p=this.progress,t=this.elapsed/1000;if(this.stage==='arrival')return{x:(index?50:-30)*(1-p),y:-20*(1-p)};if(this.stage==='departure')return{x:(index?60:-45)*p,y:-50*p};if(index===0&&this.mega==='x'&&this.stage==='mega-fire'&&p<.3)return{x:(this.terapagos.x-this.mewtwo.x-Math.sign(this.terapagos.x-this.mewtwo.x)*55)*Math.sin(p/.3*Math.PI),y:-12*Math.sin(p/.3*Math.PI)};return{x:Math.sin(t*.8+index)*3,y:index===0?Math.sin(t*1.3)*3:0}}
 advance(delta:number){if(!this.active||this.held||!Number.isFinite(delta)||delta<=0)return false;this.elapsed+=delta;if(this.elapsed>=47000){this.cancel();return true}return false}
}
