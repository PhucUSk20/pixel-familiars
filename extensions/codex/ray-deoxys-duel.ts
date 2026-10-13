import { AimedShot } from './aimed-shot'
import { DeoxysLife } from './deoxys-life'
import type { MegaAction } from './mega-rayquaza'
import type { DeoxysForm } from './deoxys-rig'
type Ray = { x:number; y:number; right:boolean; action:MegaAction; revision:number }
const forms:DeoxysForm[] = ['defense','attack','speed','normal','normal']
const envelope=(p:number,a:number,b:number)=>p<a||p>b?0:Math.sin((p-a)/(b-a)*Math.PI)
/** Manual aerial choreography. Forms still change exclusively through meteorite contact. */
export class RayDeoxysDuel {
  readonly shot=new AimedShot()
  active=false
  stage:'approach'|'meteor'|'return'|'fight'='approach'
  turn=0
  elapsed=0
  width=480
  constructor(readonly ray:Ray,readonly deoxys:DeoxysLife){}
  psychicPair=false
  get rayX():number {return Math.max(4,this.width*(this.psychicPair?.56:.418)-96)}
  get deoxysX():number {return Math.min(this.width-192,this.width*(this.psychicPair?.66:.582)-96)}
  get duration():number {return this.turn===4?23000:6500}
  get finale():string {
    if(!this.active||this.stage!=='fight'||this.turn!==4)return 'none'
    const t=this.elapsed
    return t<2800?'ascent-charge':t<5000?'orb-charge':t<7800?'ultimate-clash':t<9000?'orb-break':t<12500?'meteor-shield':t<14500?'shield-break':t<17500?'destroyed':t<19800?'waiting':t<21300?'rebirth-impact':'rebirth'
  }
  get shieldActive():boolean {return this.active&&this.stage==='fight'&&this.turn===4&&this.elapsed>=5000&&this.elapsed<12500}
  get deoxysOpacity():number {
    if(this.finale==='destroyed')return Math.max(0,1-(this.elapsed-14500)/700)
    if(['waiting','rebirth-impact'].includes(this.finale))return 0
    if(this.finale==='rebirth')return Math.min(1,(this.elapsed-21300)/1000)
    return 1
  }
  get phase():string {
    if(this.stage!=='fight')return this.stage
    if(this.turn===4)return this.finale
    const p=this.elapsed/6500
    if(this.turn===2)return p<.25?'ready':p<.83?'chase':'recover'
    if(p<.43)return 'charge'
    if(p<.7)return this.turn===3?'clash':'projectile'
    if(p<.88)return this.turn===0?'shield':'impact'
    return 'recover'
  }
  private action(action:MegaAction):void {if(this.ray.action!==action){this.ray.action=action;this.ray.revision++}}
  start():void {this.active=true;this.turn=0;this.elapsed=0;this.stage='approach';this.ray.right=true;this.action('fly');this.deoxys.perform('float')}
  cancel():void {this.active=false;this.deoxys.rest(false)}
  resize(width:number):void {
    this.width=width
    if(this.active&&this.stage==='fight'){this.stage='return';this.action('fly');this.deoxys.perform('float')}
  }
  private move(pet:{x:number;y:number},x:number,y:number,delta:number):boolean {
    pet.x+=Math.sign(x-pet.x)*Math.min(Math.abs(x-pet.x),delta*.07)
    pet.y+=Math.sign(y-pet.y)*Math.min(Math.abs(y-pet.y),delta*.045)
    return Math.abs(x-pet.x)<.1&&Math.abs(y-pet.y)<.1
  }
  private engage():void {
    this.stage='fight';this.elapsed=0;this.shot.reset()
    this.action((['roar','pulse','dash','pulse','dash'] as MegaAction[])[this.turn])
    this.ray.revision++ // Restart repeated pulse even when the last action matches.
    this.deoxys.perform('skill')
  }
  advance(delta:number):void {
    if(!this.active||!Number.isFinite(delta)||delta<=0)return
    this.deoxys.advance(delta)
    if(this.stage==='meteor') {
      if(['roam','skill'].includes(this.deoxys.state)) {this.deoxys.perform('float');this.stage='return'}
      return
    }
    if(this.stage==='approach'||this.stage==='return') {
      const rayReady=this.move(this.ray,this.rayX,-120,delta)
      const deoxysReady=this.move(this.deoxys,this.deoxysX,-120,delta)
      if(rayReady&&deoxysReady) {
        if(this.deoxys.form!==forms[this.turn]) {this.deoxys.meteor(forms[this.turn]);this.stage='meteor'}
        else this.engage()
      }
      return
    }
    this.elapsed+=delta
    const p=Math.min(1,this.elapsed/this.duration), gap=this.deoxysX-this.rayX
    this.ray.x=this.rayX;this.ray.y=-120;this.deoxys.x=this.deoxysX;this.deoxys.y=-120
    if(this.turn===2) {
      const sweep=envelope(p,.18,.92)
      this.deoxys.x+=Math.sin(p*Math.PI*8)*26*sweep;this.deoxys.y+=Math.sin(p*Math.PI*6)*22*sweep
      this.deoxys.x=Math.max(this.width*.42,Math.min(this.width-192,this.deoxys.x))
      this.ray.x+=gap*.5*sweep;this.ray.y+=Math.sin(p*Math.PI*6-.8)*20*sweep
    }
    if(this.turn===4){
      const t=this.elapsed,lerp=(a:number,b:number,f:number)=>a+(b-a)*Math.max(0,Math.min(1,f))
      if(t<5000){this.ray.y=-120-32*Math.sin(Math.min(1,t/2800)*Math.PI/2)}
      else if(t<7800){this.ray.x=lerp(this.rayX,this.rayX+gap*.55,(t-5000)/2800);this.ray.y=lerp(-152,-127,(t-5000)/2800)}
      else if(t<12500){this.ray.x=lerp(this.rayX+gap*.55,this.deoxysX-72,(t-7800)/1200);this.ray.y=-127+Math.sin(t*.013)*2}
      else if(t<14500){this.ray.x=lerp(this.deoxysX-72,Math.min(this.width-196,this.deoxysX+46),(t-12500)/1200);this.ray.y=-127}
      else {this.ray.x=lerp(Math.min(this.width-196,this.deoxysX+46),this.rayX,(t-14500)/2800)}
      if(t>=21300)this.deoxys.y=lerp(94,-120,(t-21300)/1700)
    }
    if(this.elapsed>=this.duration) {this.turn=(this.turn+1)%5;this.stage='return';this.action('fly');this.deoxys.perform('float')}
  }
}
