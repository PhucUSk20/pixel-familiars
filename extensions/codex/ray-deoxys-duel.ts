import { AimedShot } from './aimed-shot'
import { DeoxysLife } from './deoxys-life'
import type { MegaAction } from './mega-rayquaza'
import type { DeoxysForm } from './deoxys-rig'
type Ray = { x:number; y:number; right:boolean; action:MegaAction; revision:number }
const forms:DeoxysForm[] = ['defense','attack','speed','normal']
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
  get rayX():number {return Math.max(4,this.width*.2-96)}
  get deoxysX():number {return Math.min(this.width-192,this.width*.73-96)}
  get phase():string {
    if(this.stage!=='fight')return this.stage
    const p=this.elapsed/6500
    if(this.turn===2)return p<.25?'ready':p<.83?'chase':'recover'
    if(p<.43)return 'charge'
    if(p<.7)return this.turn===3?'clash':'projectile'
    if(p<.88)return this.turn===0?'shield':this.turn===1?'dodge':'impact'
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
    this.action((['pulse','fly','dash','pulse'] as MegaAction[])[this.turn])
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
      const rayReady=this.move(this.ray,this.rayX,-18,delta)
      const deoxysReady=this.move(this.deoxys,this.deoxysX,-20,delta)
      if(rayReady&&deoxysReady) {
        if(this.deoxys.form!==forms[this.turn]) {this.deoxys.meteor(forms[this.turn]);this.stage='meteor'}
        else this.engage()
      }
      return
    }
    this.elapsed+=delta
    const p=Math.min(1,this.elapsed/6500), gap=this.deoxysX-this.rayX
    this.ray.x=this.rayX;this.ray.y=-18;this.deoxys.x=this.deoxysX;this.deoxys.y=-20
    if(this.turn===1) {this.ray.y+=38*envelope(p,.43,.94);this.ray.x-=Math.min(14,this.rayX-4)*envelope(p,.43,.94)}
    if(this.turn===2) {
      const sweep=envelope(p,.18,.92)
      this.deoxys.x+=Math.sin(p*Math.PI*8)*26*sweep;this.deoxys.y+=Math.sin(p*Math.PI*6)*22*sweep
      this.deoxys.x=Math.max(this.width*.42,Math.min(this.width-192,this.deoxys.x))
      this.ray.x+=gap*.5*sweep;this.ray.y+=Math.sin(p*Math.PI*6-.8)*20*sweep
    }
    if(this.elapsed>=6500) {this.turn=(this.turn+1)%4;this.stage='return';this.action('fly');this.deoxys.perform('float')}
  }
}
