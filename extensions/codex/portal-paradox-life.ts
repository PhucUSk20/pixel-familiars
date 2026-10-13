import {resizeGroup} from './arena-layout'

export const PORTAL_FORMS=['hoopa-unbound','mega-latias','mega-latios','koraidon','miraidon'] as const
export type PortalForm=typeof PORTAL_FORMS[number]
export type EncounterKind='hoopa'|'paradox'
const stages=['arrival','first-charge','first-fire','first-impact','reply-charge','reply-fire','reply-impact','ultimate-charge','ultimate-fire','ultimate-impact','final-charge','final-fire','final-impact','departure'] as const
const times=[0,2800,5000,8200,10000,12200,15400,17500,20800,24800,27500,30500,34500,39000,42000]
export type EncounterActor={x:number;y:number;right:boolean}

/** Separate clocks allow either new encounter to coexist with every existing group. */
export class PortalParadoxLife {
  active=false
  held=false
  elapsed=0
  width=480
  readonly pets:EncounterActor[]
  constructor(readonly kind:EncounterKind){this.pets=Array.from({length:kind==='hoopa'?3:2},()=>({x:0,y:0,right:false}));this.home()}
  get forms():readonly PortalForm[]{return this.kind==='hoopa'?PORTAL_FORMS.slice(0,3):PORTAL_FORMS.slice(3)}
  get stage(){return !this.active?'absent':this.held?'await-boss':stages.find((_,i)=>this.elapsed<times[i+1])??'departure'}
  get progress(){const i=stages.indexOf(this.stage as typeof stages[number]);return i<0?0:Math.max(0,Math.min(1,(this.elapsed-times[i])/(times[i+1]-times[i])))}
  get opacity(){return !this.active?0:this.stage==='arrival'?Math.min(1,this.elapsed/1000):this.stage==='departure'?1-this.progress:1}
  private home(){
    const slots=this.kind==='hoopa'?[[.5,-225],[.36,-215],[.64,-215]]:[[.4,-35],[.68,-35]]
    this.pets.forEach((pet,i)=>Object.assign(pet,{x:this.width*slots[i][0]-96,y:slots[i][1],right:this.kind==='hoopa'?i===1:i===0}))
  }
  begin(){if(this.active)return false;this.active=true;this.held=false;this.elapsed=0;this.home();return true}
  resize(width:number){if(!Number.isFinite(width)||width<480)return;resizeGroup(this.pets,this.width,width);this.width=width}
  hold(){if(this.active){this.held=true;this.elapsed=Math.max(2800,this.elapsed)}}
  leave(){if(this.active){this.held=false;this.elapsed=39000}}
  cancel(){this.active=this.held=false;this.elapsed=0}
  offset(index:number){
    const p=this.progress,sign=index===1?-1:1
    if(this.stage==='arrival')return{x:sign*35*(1-p),y:-45*(1-p)}
    if(this.stage==='departure')return{x:sign*45*p,y:-55*p}
    if(this.held)return{x:0,y:0}
    if(this.kind==='paradox'&&index===1&&this.stage==='final-fire'){
      const gap=this.pets[0].x-this.pets[1].x,travel=gap-Math.sign(gap)*32
      return{x:travel*Math.sin(Math.min(1,p/.8)*Math.PI),y:-12*Math.sin(p*Math.PI)}
    }
    return{x:Math.sin(this.elapsed*.001+index)*2,y:Math.sin(this.elapsed*.0025+index)*3}
  }
  advance(delta:number){if(!this.active||this.held||!Number.isFinite(delta)||delta<=0)return false;this.elapsed+=delta;if(this.elapsed>=42000){this.cancel();return true}return false}
}

export type EffectPoint={x:number;y:number}
/** A fist starts at its portal, extends toward the opponent, then retracts. */
export function portalPunch(target:EffectPoint,index:number,progress:number){
  const angle=index*Math.PI/3,radius=43,origin={x:target.x+Math.cos(angle)*radius,y:target.y+Math.sin(angle)*radius*.8}
  const age=progress*1.7-index*.11,reach=age<0||age>1?0:Math.sin(age*Math.PI)
  return{origin,tip:{x:origin.x+(target.x-origin.x)*reach,y:origin.y+(target.y-origin.y)*reach},reach}
}

export function encounterContact(life:PortalParadoxLife,index:number){
  const p=life.progress
  if(life.kind==='hoopa')return index===0?(life.stage==='reply-impact'||life.stage==='final-impact'?Math.sin(p*Math.PI):0):(life.stage==='first-fire'?Math.max(0,Math.sin(p*6*Math.PI))*.5:life.stage==='ultimate-impact'?Math.sin(p*Math.PI):0)
  return index===0?(life.stage==='reply-impact'||life.stage==='final-fire'&&p>.25&&p<.8?Math.sin(p*Math.PI):0):(life.stage==='first-impact'||life.stage==='ultimate-fire'&&p>.3||life.stage==='ultimate-impact'?Math.sin(p*Math.PI):0)
}
