import {PortalParadoxLife,type EncounterKind} from './portal-paradox-life'
import {RiderLife} from './rider-life'
import {AvianLife} from './avian-life'
import {GalarLife} from './galar-life'
import {KalosLife} from './kalos-life'
import {UnovaLife} from './unova-life'
import {ultraHitTime} from './ultra-battle'
import {SunMoonLife} from './sun-moon-life'
import {NecrozmaLife} from './necrozma-life'
import { CreationLife } from './creation-life'
import { ArceusLife, judgmentHitTime } from './arceus-life'
import { DeoxysLife } from './deoxys-life'
import { RayDeoxysDuel } from './ray-deoxys-duel'
import type { MegaAction } from './mega-rayquaza'
import type { GroudonAction } from './primal-groudon'
import type { KyogreAction } from './primal-kyogre'

export type ArenaMode = 'play' | 'duel' | 'rest'
type Wanderer<A> = { x: number; y: number; targetX: number; targetY: number; right: boolean; action: A; until: number; revision: number }
/** Autonomous local life. Coordinates are sprite origins, not pet centres. */
export class ArenaLife {
  mode: ArenaMode = 'play'
  state: 'roam' | 'approach' | 'duel' | 'rest' | 'divine' | 'cosmic' = 'roam'
  clock = 0
  groundState: 'approach' | 'fight' = 'approach'
  groundTurn = 0
  groundElapsed = 0
  duelElapsed = 0
  turn = 0
  opponent: 'ray' | 'kyogre' | 'deoxys' = 'kyogre'
  kyogre: Wanderer<KyogreAction> = { x:-15,y:50,targetX:15,targetY:50,right:true,action:'swim',until:7500,revision:0 }
  ray: Wanderer<MegaAction> = { x: 104.64, y: -120, targetX: 104.64, targetY: -120, right: true, action: 'fly', until: 6500, revision: 0 }
  groudon: Wanderer<GroudonAction> = { x: 224, y: 44, targetX: 130, targetY: 44, right: false, action: 'walk', until: 9000, revision: 0 }
  private autoEpic=false
  private backgroundStarted=false
  get residentDuel(): boolean {return !this.arceus.active&&!this.ultraBoss&&(this.mode==='duel'||this.autoEpic||(this.creation.active||this.sunMoon.active||this.unova.active||this.kalos.active||this.galar.active||this.avian.active||this.rider.active||this.hoopa.active||this.paradox.active)&&this.backgroundStarted)}
  private ultraJoinChance=.3
  private ultraAfterArceus=Infinity
  private allUltraAt=Infinity
  private allArceusAt=Infinity
  get summoningAll():boolean{return Number.isFinite(this.allArceusAt)}
  private ultraArceusAt=Infinity
  private ultraCreationAt=Infinity
  get ultraBoss():boolean {return this.necrozma.battle.active&&!this.necrozma.battle.allied&&!this.necrozma.battle.waitingForArceus&&!this.arceus.active}
  get unovaTargetIndex():number {return this.celestialTargetIndex+(this.sunMoon.active?2:0)}
  get kalosTargetIndex():number {return this.unovaTargetIndex+(this.unova.active?3:0)}
  get galarTargetIndex():number {return this.kalosTargetIndex+(this.kalos.active?3:0)}
  get avianTargetIndex():number {return this.galarTargetIndex+(this.galar.active?3:0)}
  get riderTargetIndex():number {return this.avianTargetIndex+this.avian.visiblePets.length}
  get portalTargetIndex():number {return this.riderTargetIndex+(this.rider.active?4:0)}
  get paradoxTargetIndex():number {return this.portalTargetIndex+(this.hoopa.active?3:0)}
  get ultraTargetIndex():number {return this.paradoxTargetIndex+(this.paradox.active?2:0)}
  private creationAfterArceus = Infinity
  private divineRetreats: { x: number; direction: number }[] = []
  readonly hoopa=new PortalParadoxLife('hoopa')
  readonly paradox=new PortalParadoxLife('paradox')
  readonly rider:RiderLife
  readonly avian:AvianLife
  readonly galar:GalarLife
  readonly kalos:KalosLife
  readonly unova:UnovaLife
  readonly sunMoon: SunMoonLife
  readonly necrozma: NecrozmaLife
  readonly creation: CreationLife
  readonly arceus: ArceusLife
  readonly deoxys: DeoxysLife
  readonly airDuel: RayDeoxysDuel
  width = 480
  get coast(): number { return this.width * 208 / 480 }
  get groundMin(): number { return this.coast - 118 }
  get groundMax(): number { return Math.max(this.groundMin,Math.min(this.width-250,this.width*.66-154)) }
  get duelGroundX(): number { return Math.max(this.groundMin, Math.min(this.groundMax, this.width*.57-154)) }
  get swimMax(): number { return Math.max(-20,this.coast-188) }
  get duelKyogreX(): number { return Math.max(-40,Math.min(this.swimMax,this.width*.34-128,this.airDuel.rayX+96-70-128)) }
  get duelRayY(): number { return -120 }
  resize(width: number): void {
    if (!Number.isFinite(width) || width < 480 || width === this.width) return
    const remainingRetreat = (this.arceus.active||this.ultraBoss) ? this.divinePets().map((pet,index)=>(this.divineRetreats[index]?.x??pet.x)-pet.x) : []
    const ratio=(this.arceus.active||this.ultraBoss)?1:width/this.width
    for(const [pet,center] of [[this.ray,96],[this.kyogre,128],[this.groudon,154]] as const){pet.x=(pet.x+center)*ratio-center;pet.targetX=(pet.targetX+center)*ratio-center}
    this.deoxys.x=(this.deoxys.x+96)*ratio-96;this.deoxys.target=(this.deoxys.target+96)*ratio-96
    this.width = width
    this.deoxys.resize(width); this.airDuel.resize(width); this.creation.resize(width);this.sunMoon.resize(width);this.unova.resize(width);this.kalos.resize(width);this.galar.resize(width);this.rider.resize(width);this.avian.resize(width);this.necrozma.resize(width);this.hoopa.resize(width);this.paradox.resize(width)
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
    this.ray.x = clamp(this.ray.x, 4, width - 196)
    this.ray.targetX = clamp(this.ray.targetX, 4, width - 196)
    this.groudon.x = clamp(this.groudon.x, this.groundMin, this.groundMax)
    this.groudon.targetX = clamp(this.groudon.targetX, this.groundMin, this.groundMax)
    this.kyogre.x = clamp(this.kyogre.x,-40,this.swimMax)
    this.kyogre.targetX = clamp(this.kyogre.targetX,-40,this.swimMax)
    if (this.mode === 'duel') {
      this.groundState='approach'; this.groudon.targetX=this.duelGroundX; this.kyogre.targetX=this.duelKyogreX
      this.setGroudon('walk'); this.setKyogre('swim'); return
    }
    if (this.arceus.active||this.ultraBoss) {
      this.divineRetreats = this.divinePets().map((pet,index)=>{
        const [min,max]=this.divineBounds(index)
        return {x:clamp(pet.x+(remainingRetreat[index]??0),min,max),direction:this.divineRetreats[index]?.direction??1}
      })
      return
    }
    if (this.state === 'approach') { this.groudon.targetX = this.duelGroundX; this.kyogre.targetX = this.duelKyogreX }
    if (this.state === 'duel') this.prepare()
  }
  /** Camera zoom remaps sprite centres, never habitat-clamps a stationary pet sideways. */
  resizeCamera(width: number, ratio: number): void {
    if(!Number.isFinite(width)||width<480||!Number.isFinite(ratio)||ratio<=0)return
    const offsets=[96,96,128,154,96,96,96,96,96,96,96,96,96], pets=this.divinePets()
    pets.forEach((pet,index)=>{pet.x=(pet.x+(offsets[index]??96))*ratio-(offsets[index]??96)})
    for(const [pet,offset] of [[this.ray,96],[this.kyogre,128],[this.groudon,154]] as const)pet.targetX=(pet.targetX+offset)*ratio-offset
    this.deoxys.target=(this.deoxys.target+96)*ratio-96
    this.deoxys.meteorX*=ratio
    this.divineRetreats.forEach((goal,index)=>{goal.x=(goal.x+(offsets[index]??96))*ratio-(offsets[index]??96)})
    this.width=width;this.deoxys.width=width
    // Keep inactive visitor placement centred for the next summon without moving active ones.
    for(const visit of [this.hoopa,this.paradox]){const positions=visit.pets.map(p=>p.x);visit.resize(width);if(visit.active)visit.pets.forEach((p,i)=>{p.x=positions[i]})}
    const riderPositions=this.rider.pets.map(pet=>pet.x);this.rider.resize(width);if(this.rider.active)this.rider.pets.forEach((pet,i)=>{pet.x=riderPositions[i]})
    const avianPositions=this.avian.pets.map(pet=>pet.x);
    const galarPositions=this.galar.pets.map(pet=>pet.x);this.galar.resize(width);this.avian.resize(width);this.avian.pets.forEach((pet,i)=>{pet.x=avianPositions[i]});if(this.galar.active)this.galar.pets.forEach((pet,i)=>{pet.x=galarPositions[i]})
    const kalosPositions=this.kalos.pets.map(pet=>pet.x);this.kalos.resize(width);if(this.kalos.active)this.kalos.pets.forEach((pet,i)=>{pet.x=kalosPositions[i]})
    const unovaPositions=this.unova.pets.map(pet=>pet.x);this.unova.resize(width);if(this.unova.active)this.unova.pets.forEach((pet,i)=>{pet.x=unovaPositions[i]})
    const celestialPositions=[this.sunMoon.lunala.x,this.sunMoon.solgaleo.x];this.sunMoon.resize(width);if(this.sunMoon.active){this.sunMoon.lunala.x=celestialPositions[0];this.sunMoon.solgaleo.x=celestialPositions[1]}
    const positions=[this.creation.palkia.x,this.creation.dialga.x,this.creation.giratina.x]
    this.creation.resize(width)
    if(this.creation.active){this.creation.palkia.x=positions[0];this.creation.dialga.x=positions[1];this.creation.giratina.x=positions[2]}
    this.airDuel.width=width
    if(this.necrozma.active&&!this.necrozma.battle.allied)this.necrozma.actor.x=(this.necrozma.actor.x+96)*ratio-96
    else if(!this.necrozma.active)this.necrozma.resize(width)
    this.necrozma.width=width
  }
  get celestialTargetIndex():number {return 4+(this.creation.active?(this.creation.trio?3:2):0)}
  private divinePets(): { x: number; y: number }[] { return [this.ray, this.deoxys, this.kyogre, this.groudon, ...(this.creation.active ? [this.creation.palkia,this.creation.dialga,...(this.creation.trio?[this.creation.giratina]:[])] : []),...(this.sunMoon.active?[this.sunMoon.lunala,this.sunMoon.solgaleo]:[]),...(this.unova.active?this.unova.pets:[]),...(this.kalos.active?this.kalos.pets:[]),...(this.galar.active?this.galar.pets:[]),...this.avian.visiblePets,...(this.rider.active?this.rider.pets:[]),...(this.hoopa.active?this.hoopa.pets:[]),...(this.paradox.active?this.paradox.pets:[]),...(this.necrozma.battle.allied?[this.necrozma.actor]:[])] }
  judgmentShield(index:number):boolean {
    return index===0||this.rider.active&&index===this.riderTargetIndex||this.unova.active&&index===this.unovaTargetIndex+2||this.kalos.active&&index===this.kalosTargetIndex+2||this.galar.active&&index===this.galarTargetIndex+2||this.necrozma.battle.allied&&index===this.ultraTargetIndex
  }
  private divineBounds(index: number): [number, number] {
    if (index >= 4) return [-96, this.width - 96]
    return index === 0 ? [this.ultraBoss?-24:4, this.width - 196] : index === 1 ? [this.width * .42, this.width - 192] : index === 2 ? [-40, this.swimMax] : [this.groundMin, this.groundMax]
  }
  private nearbyRetreats(centerX=this.width/2,centerY=100): { x: number; direction: number }[] {
    const offsets = [96, 96, 128, 154, 96, 96,96,96,96,96], heights = [75, 75, 94, 80, 75, 75,85,75,75,81,81,81,81]
    return this.divinePets().map((pet, index) => {
      const distance = pet.x + (offsets[index]??96) - centerX
      const direction = Math.sign(distance) || (index < 2 ? -1 : 1)
      const nearby = Math.hypot(distance, pet.y + (heights[index]??81) - centerY) < 125
      const [min, max] = this.divineBounds(index)
      return { x: Math.max(min, Math.min(max, pet.x + (nearby ? direction * 16 : 0))), direction }
    })
  }
  /** User summons interrupt the current scene locally; repeated clicks cannot restart a visit. */
  summonAll(): boolean {
    if(this.arceus.active||this.summoningAll)return false
    this.select('rest')
    this.summonCreation(true)
    this.summonUnova();this.summonKalos();this.summonGalar();this.summonSunMoon()
    this.summonAvian(true);this.rider.strong=true;this.summonPortal('hoopa');this.summonPortal('paradox')
    this.kalos.fullRoster=true;this.kalos.mega=true;this.unova.fullRoster=true;this.galar.eternamax=true
    this.allUltraAt=Infinity;this.allArceusAt=this.clock+10000
    this.summonUltra()
    return true
  }
  summonArceus(): boolean {
    if (this.arceus.active) return false
    if(this.necrozma.active&&this.necrozma.form==='ultra'&&!this.necrozma.battle.active)this.necrozma.battle.begin(false)
    if(this.necrozma.battle.active)this.necrozma.battle.joinArceus();else this.necrozma.cancel(this.clock)
    this.ultraArceusAt=this.ultraCreationAt=Infinity
    this.sunMoon.holdForArceus();this.unova.hold();this.kalos.hold();this.galar.hold();this.avian.hold();this.rider.hold();this.hoopa.hold();this.paradox.hold()
    if (this.airDuel.active) this.airDuel.cancel()
    if (this.creation.active) { this.creation.holdForArceus(); this.creation.prepareShields() }
    this.creationAfterArceus = !this.creation.active && this.random() < .4 ? this.clock + 900 + this.random()*1200 : Infinity
    this.autoEpic=false
    this.mode = 'play'; this.state = 'divine'
    this.divineRetreats = this.nearbyRetreats()
    this.arceus.begin();this.arceus.targetCount=this.divinePets().length
    this.ultraAfterArceus=!this.necrozma.active&&this.random()<this.ultraJoinChance?this.clock+1200+this.random()*1800:Infinity
    this.setRay('fly'); this.setGroudon('roar'); this.setKyogre('roar'); this.deoxys.perform('float')
    return true
  }
  summonCreation(trio?: boolean): boolean {
    if (this.arceus.active || this.creation.active || this.necrozma.active&&!this.necrozma.battle.active) return false
    this.backgroundStarted=this.backgroundStarted||this.airDuel.active
    this.mode = 'play'; this.state = 'cosmic'
    const goals=new Map(this.divinePets().map((pet,index)=>[pet,this.divineRetreats[index]]))
    this.creation.begin(trio)
    if(this.ultraBoss){this.creation.joiningArceus=true;this.divineRetreats=this.nearbyRetreats(this.necrozma.actor.x+96,this.necrozma.actor.y+81).map((goal,index)=>goals.get(this.divinePets()[index])??goal)}
    return true
  }
  summonSunMoon(): boolean {
    if(this.arceus.active||this.sunMoon.active)return false
    const goals=new Map(this.divinePets().map((pet,index)=>[pet,this.divineRetreats[index]]))
    this.autoEpic=false;this.mode='play';this.state='cosmic';this.sunMoon.begin(this.creation.active);if(this.ultraBoss){this.sunMoon.holdForUltra();this.divineRetreats=this.nearbyRetreats(this.necrozma.actor.x+96,this.necrozma.actor.y+81).map((goal,index)=>goals.get(this.divinePets()[index])??goal)}if(!this.backgroundStarted&&!this.ultraBoss)this.startBackground();return true
  }
  summonAvian(forceMewtwo=false):boolean {
    if(this.avian.active||this.arceus.active||this.necrozma.active&&!this.ultraBoss)return false
    const goals=new Map(this.divinePets().map((pet,index)=>[pet,this.divineRetreats[index]]))
    this.avian.begin(forceMewtwo);if(this.avian.hasMewtwo&&!this.rider.active)this.rider.begin(this.avian.mega);this.mode='play';this.state='cosmic';this.autoEpic=false
    if(this.ultraBoss){this.avian.hold();this.rider.hold();this.hoopa.hold();this.paradox.hold();this.divineRetreats=this.nearbyRetreats(this.necrozma.actor.x+96,this.necrozma.actor.y+81).map((goal,index)=>goals.get(this.divinePets()[index])??goal)}else if(!this.backgroundStarted){if(this.airDuel.active)this.backgroundStarted=true;else this.startBackground()}
    return true
  }
  summonPortal(kind:EncounterKind):boolean {
    const visit=kind==='hoopa'?this.hoopa:this.paradox
    if(visit.active||this.arceus.active||this.necrozma.active&&!this.ultraBoss)return false
    const goals=new Map(this.divinePets().map((pet,index)=>[pet,this.divineRetreats[index]]))
    visit.begin();this.mode='play';this.state='cosmic';this.autoEpic=false
    if(this.ultraBoss){visit.hold();this.divineRetreats=this.nearbyRetreats(this.necrozma.actor.x+96,this.necrozma.actor.y+81).map((goal,index)=>goals.get(this.divinePets()[index])??goal)}
    else if(!this.backgroundStarted)this.startBackground()
    return true
  }
  summonRider():boolean {
    if(this.rider.active||this.arceus.active||this.necrozma.active&&!this.ultraBoss)return false
    this.rider.begin();this.mode='play';this.state='cosmic';if(this.ultraBoss){this.rider.hold();this.divineRetreats=this.nearbyRetreats()}else if(!this.backgroundStarted){if(this.airDuel.active)this.backgroundStarted=true;else this.startBackground()}return true
  }
  summonGalar():boolean {
    if(this.galar.active||this.arceus.active||this.necrozma.active&&!this.ultraBoss)return false
    const goals=new Map(this.divinePets().map((pet,index)=>[pet,this.divineRetreats[index]]))
    this.galar.begin();this.mode='play';this.state='cosmic';this.autoEpic=false
    if(this.ultraBoss){this.galar.hold();this.avian.hold();this.rider.hold();this.hoopa.hold();this.paradox.hold();this.divineRetreats=this.nearbyRetreats(this.necrozma.actor.x+96,this.necrozma.actor.y+81).map((goal,index)=>goals.get(this.divinePets()[index])??goal)}
    else if(!this.backgroundStarted)this.startBackground()
    return true
  }
  summonKalos():boolean {
    if(this.kalos.active||this.arceus.active||this.necrozma.active&&!this.ultraBoss)return false
    const goals=new Map(this.divinePets().map((pet,index)=>[pet,this.divineRetreats[index]]))
    this.kalos.begin();this.mode='play';this.state='cosmic';this.autoEpic=false
    if(this.ultraBoss){this.kalos.hold();this.galar.hold();this.avian.hold();this.rider.hold();this.hoopa.hold();this.paradox.hold();this.divineRetreats=this.nearbyRetreats(this.necrozma.actor.x+96,this.necrozma.actor.y+81).map((goal,index)=>goals.get(this.divinePets()[index])??goal)}
    else if(!this.backgroundStarted)this.startBackground()
    return true
  }
  summonUnova():boolean {
    if(this.unova.active||this.arceus.active||this.necrozma.active&&!this.ultraBoss)return false
    const goals=new Map(this.divinePets().map((pet,index)=>[pet,this.divineRetreats[index]]))
    this.unova.begin();this.mode='play';this.state='cosmic';this.autoEpic=false
    if(this.ultraBoss){this.unova.hold();this.kalos.hold();this.galar.hold();this.avian.hold();this.rider.hold();this.hoopa.hold();this.paradox.hold();this.divineRetreats=this.nearbyRetreats(this.necrozma.actor.x+96,this.necrozma.actor.y+81).map((goal,index)=>goals.get(this.divinePets()[index])??goal)}
    else if(!this.backgroundStarted)this.startBackground()
    return true
  }
  summonNecrozma(): boolean {
    if(this.arceus.active||this.necrozma.active)return false
    if(!this.sunMoon.active)this.summonSunMoon()
    this.sunMoon.holdForNecrozma();this.necrozma.begin();this.state='cosmic'
    return true
  }
  summonUltra():boolean {
    if(this.necrozma.active)return false
    const goals=new Map(this.divinePets().map((pet,index)=>[pet,this.divineRetreats[index]]))
    this.necrozma.beginUltra();if(this.summoningAll)this.necrozma.battle.waitForArceus();this.autoEpic=false;this.mode='play';this.state=this.arceus.active?'divine':'cosmic'
    if(this.arceus.active){this.necrozma.battle.joinArceus();this.divineRetreats=this.nearbyRetreats().map((goal,index)=>goals.get(this.divinePets()[index])??goal)}
    else this.enterUltraBattle()
    return true
  }
  private enterUltraBattle():void {
    this.stageAirPair()
    if(this.necrozma.battle.waitingForArceus)return
    if(!this.summoningAll)this.holdAllForUltra()
    if(this.airDuel.active)this.airDuel.cancel()
    this.autoEpic=false;this.backgroundStarted=false
    this.divineRetreats=this.nearbyRetreats(this.necrozma.actor.x+96,this.necrozma.actor.y+81)
    this.setRay('fly');this.setGroudon('roar');this.setKyogre('roar');this.deoxys.perform('float')
    this.ultraCreationAt=!this.creation.active&&this.random()<.65?this.clock+900:Infinity
    this.ultraArceusAt=this.random()<.35?this.clock+7000+this.random()*3000:Infinity
  }
  private holdAllForUltra():void {
    this.sunMoon.holdForUltra();this.unova.hold();this.kalos.hold();this.galar.hold();this.avian.hold();this.rider.hold();this.hoopa.hold();this.paradox.hold();this.creation.holdForUltra();this.creation.prepareShields()
  }
  private stageAirPair():void {
    this.airDuel.psychicPair=this.rider.active
    this.ray.x=this.ray.targetX=this.airDuel.rayX;this.ray.y=this.ray.targetY=-120
    this.deoxys.x=this.deoxys.target=this.airDuel.deoxysX;this.kyogre.x=this.kyogre.targetX=this.duelKyogreX;this.deoxys.y=this.deoxys.targetY=-120
  }
  private startBackground(): void {
    this.stageAirPair()
    this.backgroundStarted=true;this.airDuel.resize(this.width);this.airDuel.start()
    this.groundState='approach';this.groundElapsed=0;this.groundTurn=0
    this.groudon.targetX=this.duelGroundX;this.kyogre.targetX=this.duelKyogreX;this.kyogre.targetY=50
    this.setGroudon('walk');this.setKyogre('swim')
  }
  private nextDuel: number
  private rounds = 2
  private battle = 0
  constructor(private random: () => number = Math.random) {
    this.arceus = new ArceusLife(random)
    this.sunMoon = new SunMoonLife(random); this.creation = new CreationLife(random);this.necrozma=new NecrozmaLife(random)
    this.rider=new RiderLife(random);this.avian=new AvianLife(random);this.galar=new GalarLife(random);this.kalos=new KalosLife(random);this.unova=new UnovaLife(random)
    this.nextDuel = 24000 + this.random() * 12000
    this.deoxys = new DeoxysLife(random,true); this.airDuel = new RayDeoxysDuel(this.ray,this.deoxys);this.deoxys.x=this.deoxys.target=this.airDuel.deoxysX;this.groudon.x=this.groudon.targetX=this.duelGroundX;this.kyogre.x=this.kyogre.targetX=this.duelKyogreX
  }
  private setRay(action: MegaAction): void { this.ray.action = action; this.ray.revision++ }
  private setGroudon(action: GroudonAction): void { this.groudon.action = action; this.groudon.revision++ }
  private setKyogre(action: KyogreAction): void { this.kyogre.action = action; this.kyogre.revision++ }
  private fightActions(): void {
    const ray: MegaAction[] = ['pulse', 'roar', 'dash', 'fly']
    const ground: GroudonAction[] = ['roar', 'burst', 'blades', 'eruption', 'burst']
    const water: KyogreAction[] = ['pulse','roar','wave','rain','pulse']
    this.setRay(this.opponent === 'ray' ? ray[this.turn] : 'fly')
    this.setKyogre(this.opponent === 'kyogre' ? water[this.turn] : 'swim')
    this.setGroudon(ground[this.turn])
  }
  select(mode: ArenaMode): void {
    this.autoEpic=false
    this.backgroundStarted=false
    this.allUltraAt=this.allArceusAt=Infinity
    this.creationAfterArceus=Infinity;this.ultraAfterArceus=Infinity;this.ultraArceusAt=this.ultraCreationAt=Infinity
    this.arceus.cancel(this.clock); this.creation.cancel(this.clock);this.sunMoon.cancel(this.clock);this.unova.cancel(this.clock);this.kalos.cancel(this.clock);this.galar.cancel(this.clock);this.avian.cancel(this.clock);this.rider.cancel();this.hoopa.cancel();this.paradox.cancel();this.necrozma.cancel(this.clock)
    if (this.airDuel.active) this.airDuel.cancel()
    this.mode = mode
    this.deoxys.rest(mode==='rest')
    if (mode === 'rest') { this.state = 'rest'; this.setRay('sleep'); this.setGroudon('sleep'); this.setKyogre('sleep'); return }
    if (mode === 'duel') {
      this.opponent='deoxys'; this.state='approach'; this.duelElapsed=0
      this.groundState='approach'; this.groundTurn=0; this.groundElapsed=0
      this.groudon.targetX=this.duelGroundX; this.kyogre.targetX=this.duelKyogreX; this.kyogre.targetY=50
      this.setGroudon('walk'); this.setKyogre('swim'); this.airDuel.start(); return
    }
    this.roam()
  }
  private prepare(): void {
    this.state = 'approach'; this.duelElapsed = 0
    if(this.opponent==='ray'){this.battle++;this.autoEpic=true;this.startBackground()}
    this.ray.targetX = this.airDuel.rayX; this.ray.targetY = this.duelRayY; this.groudon.targetX = this.duelGroundX
    this.kyogre.targetX = this.duelKyogreX; this.kyogre.targetY = 50
    this.setRay('fly'); this.setGroudon('walk'); this.setKyogre('swim')
  }
  private roam(): void {
    this.autoEpic=false;if(this.airDuel.active)this.airDuel.cancel()
    this.state = 'roam'
    this.nextDuel = this.clock + 35000 + this.random() * 25000
    this.chooseRay(); this.chooseGroudon(); this.chooseKyogre()
  }
  private chooseRay(): void {
    const choices: MegaAction[] = ['fly', 'fly', 'fly', 'dash', 'roar', 'sleep']
    this.setRay(choices[Math.floor(this.random() * choices.length)])
    this.ray.until = this.clock + 5500 + this.random() * 5500
    this.ray.targetX = this.width*(.38+this.random()*.08)-96; this.ray.targetY = -130 + this.random() * 20
  }
  private chooseGroudon(): void {
    const choices: GroudonAction[] = ['walk', 'walk', 'walk', 'roar', 'sleep']
    this.setGroudon(choices[Math.floor(this.random() * choices.length)])
    this.groudon.until = this.clock + 6000 + this.random() * 6000
    this.groudon.targetX = this.groundMin + this.random() * (this.groundMax - this.groundMin)
  }
  private chooseKyogre(): void {
    const choices: KyogreAction[] = ['swim','swim','swim','dive','roar','sleep']
    this.setKyogre(choices[Math.floor(this.random()*choices.length)])
    this.kyogre.until = this.clock+6000+this.random()*6000
    this.kyogre.targetX = -40+this.random()*(this.swimMax+40)
    this.kyogre.targetY = 44+this.random()*12
  }
  private move<A>(pet: Wanderer<A>, delta: number, speed: number): void {
    const distance = pet.targetX - pet.x, step = Math.min(Math.abs(distance), speed * delta / 1000)
    if (step > .01) { pet.right = distance > 0; pet.x += Math.sign(distance) * step }
    const dy = pet.targetY - pet.y
    pet.y += Math.sign(dy) * Math.min(Math.abs(dy), speed * .4 * delta / 1000)
  }
  private groundActions(): void {
    this.setGroudon((['roar','burst','blades','eruption','burst'] as GroudonAction[])[this.groundTurn])
    this.setKyogre((['pulse','roar','wave','rain','pulse'] as KyogreAction[])[this.groundTurn])
  }
  private advanceGround(delta:number):void {
    if(this.groundState==='approach') {
      this.move(this.groudon,delta,20); this.move(this.kyogre,delta,20)
      if(Math.abs(this.groudon.x-this.duelGroundX)<.1&&Math.abs(this.kyogre.x-this.duelKyogreX)<.1&&Math.abs(this.kyogre.y-50)<.1) {
        this.groundState='fight'; this.groundElapsed=0; this.groudon.right=false; this.kyogre.right=true; this.groundActions()
      }
    } else {
      this.groundElapsed+=delta
      if(this.groundElapsed>=7000) {this.groundElapsed%=7000;this.groundTurn=(this.groundTurn+1)%5;this.groundActions()}
    }
  }
  advance(delta: number): void {
    if (!Number.isFinite(delta) || delta <= 0) return
    this.clock += delta
    if(this.clock>=this.allUltraAt){this.allUltraAt=Infinity;this.holdAllForUltra()}
    if(this.clock>=this.allArceusAt){this.allArceusAt=Infinity;this.summonArceus()}
    if (this.mode === 'play' && (!this.necrozma.active||this.ultraBoss) && !this.autoEpic && !this.arceus.active && !this.creation.active && this.clock >= this.arceus.nextVisit && !['meteor','touch','transform'].includes(this.deoxys.state)) this.summonArceus()
    if (this.mode === 'play' && (!this.necrozma.active||this.ultraBoss) && !this.autoEpic && !this.creation.active && !this.arceus.active && this.clock >= this.creation.nextVisit && !['meteor','touch','transform'].includes(this.deoxys.state)) this.summonCreation()
    if(this.mode==='play'&&!this.autoEpic&&!this.arceus.active&&!this.sunMoon.active&&this.clock>=this.sunMoon.nextVisit&&!['meteor','touch','transform'].includes(this.deoxys.state))this.summonSunMoon()
    if(this.mode==='play'&&this.sunMoon.active&&!this.arceus.active&&!this.creation.active&&!this.necrozma.active&&this.clock>=this.necrozma.nextVisit)this.summonNecrozma()
    if(this.mode==='play'&&!this.autoEpic&&!this.arceus.active&&!this.avian.active&&!this.rider.active&&!this.hoopa.active&&!this.paradox.active&&!this.necrozma.active&&this.clock>=this.avian.nextVisit)this.summonAvian()
    for(const visit of [this.hoopa,this.paradox]){
      if(visit.held&&(this.arceus.active?this.arceus.judgmentElapsed>=12000:!this.ultraBoss))visit.leave()
      if(visit.advance(delta)){
        if(this.arceus.active||this.ultraBoss)this.divineRetreats=this.nearbyRetreats()
        else if(!this.hoopa.active&&!this.paradox.active&&!this.creation.active&&!this.sunMoon.active&&!this.unova.active&&!this.kalos.active&&!this.galar.active&&!this.avian.active&&!this.rider.active&&!this.necrozma.active){this.backgroundStarted=false;this.airDuel.cancel();this.deoxys.rest(false);this.roam()}
      }
    }
    if(this.rider.held&&(this.arceus.active?this.arceus.judgmentElapsed>=12000:!this.ultraBoss))this.rider.leave()
    this.airDuel.psychicPair=this.rider.active;this.rider.setTier(this.creation.active||this.sunMoon.active||this.unova.active||this.kalos.active||this.galar.active||this.necrozma.active);
    if(this.rider.advance(delta)&&!this.creation.active&&!this.sunMoon.active&&!this.unova.active&&!this.kalos.active&&!this.galar.active&&!this.avian.active&&!this.necrozma.active&&!this.arceus.active){this.backgroundStarted=false;this.airDuel.cancel();this.deoxys.rest(false);this.roam()}
    if(this.avian.held&&(this.arceus.active?this.arceus.judgmentElapsed>=12000:!this.ultraBoss))this.avian.leave()
    if(this.avian.advance(delta,this.clock)&&!this.creation.active&&!this.sunMoon.active&&!this.unova.active&&!this.kalos.active&&!this.galar.active&&!this.necrozma.active&&!this.arceus.active){this.backgroundStarted=false;this.airDuel.cancel();this.deoxys.rest(false);this.roam()}
    if(this.mode==='play'&&!this.autoEpic&&!this.arceus.active&&!this.unova.active&&!this.kalos.active&&!this.galar.active&&!this.avian.active&&!this.rider.active&&!this.hoopa.active&&!this.paradox.active&&!this.necrozma.active&&this.clock>=this.unova.nextVisit)this.summonUnova()
    if(this.mode==='play'&&!this.autoEpic&&!this.arceus.active&&!this.galar.active&&!this.avian.active&&!this.rider.active&&!this.hoopa.active&&!this.paradox.active&&!this.necrozma.active&&this.clock>=this.galar.nextVisit)this.summonGalar()
    if(this.galar.held&&(this.arceus.active?this.arceus.judgmentElapsed>=12000:!this.ultraBoss))this.galar.leave()
    if(this.galar.advance(delta,this.clock)){if(this.arceus.active||this.ultraBoss)this.divineRetreats=this.nearbyRetreats();else if(!this.creation.active&&!this.sunMoon.active&&!this.unova.active&&!this.kalos.active&&!this.avian.active&&!this.rider.active&&!this.hoopa.active&&!this.paradox.active&&!this.necrozma.active){this.backgroundStarted=false;this.airDuel.cancel();this.deoxys.rest(false);this.roam()}}
    if(this.mode==='play'&&!this.autoEpic&&!this.arceus.active&&!this.kalos.active&&!this.galar.active&&!this.avian.active&&!this.rider.active&&!this.hoopa.active&&!this.paradox.active&&!this.necrozma.active&&this.clock>=this.kalos.nextVisit)this.summonKalos()
    if(this.kalos.held&&(this.arceus.active?this.arceus.judgmentElapsed>=12000:!this.ultraBoss))this.kalos.leave()
    if(this.kalos.advance(delta,this.clock)){if(this.arceus.active||this.ultraBoss)this.divineRetreats=this.nearbyRetreats();else if(!this.creation.active&&!this.sunMoon.active&&!this.unova.active&&!this.kalos.active&&!this.galar.active&&!this.avian.active&&!this.rider.active&&!this.hoopa.active&&!this.paradox.active&&!this.necrozma.active){this.backgroundStarted=false;this.airDuel.cancel();this.deoxys.rest(false);this.roam()}}
    if(this.unova.held&&(this.arceus.active?this.arceus.judgmentElapsed>=12000:!this.ultraBoss))this.unova.leave()
    if(this.unova.advance(delta,this.clock)){if(this.arceus.active||this.ultraBoss)this.divineRetreats=this.nearbyRetreats();else if(!this.creation.active&&!this.sunMoon.active&&!this.kalos.active&&!this.galar.active&&!this.avian.active&&!this.rider.active&&!this.hoopa.active&&!this.paradox.active&&!this.necrozma.active){this.backgroundStarted=false;this.airDuel.cancel();this.deoxys.rest(false);this.roam()}}
    const wasUltra=this.necrozma.battle.active
    const ultraBefore=this.necrozma.battle.fireElapsed
    if(this.necrozma.advance(delta,this.clock)){if(this.hoopa.held)this.hoopa.leave();if(this.paradox.held)this.paradox.leave();if(this.unova.held)this.unova.leave();if(this.kalos.held)this.kalos.leave();if(this.galar.held)this.galar.leave();if(this.avian.held)this.avian.leave();if(this.rider.held)this.rider.leave();if(this.creation.heldForUltra)this.creation.leave();if(this.sunMoon.heldForUltra)this.sunMoon.leave();this.ultraCreationAt=this.ultraArceusAt=Infinity;this.arceus.nextVisit=Math.max(this.arceus.nextVisit,this.clock+15000);this.creation.nextVisit=Math.max(this.creation.nextVisit,this.clock+15000);if(!this.creation.active&&!this.sunMoon.active&&!this.unova.active&&!this.kalos.active&&!this.galar.active&&!this.avian.active&&!this.rider.active&&!this.arceus.active){this.backgroundStarted=false;this.deoxys.rest(false);this.roam();return}}
    if(!wasUltra&&this.necrozma.battle.active&&!this.necrozma.battle.allied)this.enterUltraBattle()
    if(this.ultraBoss&&!this.creation.active&&this.clock>=this.ultraCreationAt){this.ultraCreationAt=Infinity;this.summonCreation()}
    if(this.ultraBoss&&this.clock>=this.ultraArceusAt)this.summonArceus()
    if(this.necrozma.battle.allied&&this.arceus.active&&this.arceus.judgmentElapsed>=12000){this.necrozma.battle.leave();this.necrozma.battle.elapsed=18800+Math.max(0,this.arceus.elapsed+delta-21000)}
    if(this.sunMoon.active){
      if(this.sunMoon.held&&this.arceus.active&&this.arceus.judgmentElapsed>=12000)this.sunMoon.leave()
      if(this.sunMoon.advance(delta,this.clock)){
        if(this.arceus.active)this.divineRetreats=this.nearbyRetreats()
        else if(!this.creation.active&&!this.unova.active&&!this.kalos.active&&!this.galar.active&&!this.avian.active&&!this.rider.active&&!this.hoopa.active&&!this.paradox.active&&!this.necrozma.active){this.backgroundStarted=false;this.airDuel.cancel();this.deoxys.rest(false);this.roam();return}
      }
    }
    if(this.arceus.active&&!this.necrozma.active&&this.clock>=this.ultraAfterArceus){this.ultraAfterArceus=Infinity;this.summonUltra()}
    if(this.arceus.active && !this.creation.active && this.clock>=this.creationAfterArceus){
      const goals=new Map(this.divinePets().map((pet,index)=>[pet,this.divineRetreats[index]]))
      this.creationAfterArceus=Infinity;this.creation.begin();this.creation.joiningArceus=true;this.creation.prepareShields()
      this.divineRetreats=this.nearbyRetreats().map((goal,index)=>goals.get(this.divinePets()[index])??goal)
    }
    if (this.creation.active) {
      if (this.creation.held && this.arceus.active && this.arceus.judgmentElapsed >= 12000) this.creation.leave()
      const event = this.creation.advance(delta,this.clock)
      if(this.ultraBoss&&this.creation.held&&!this.creation.heldForUltra){this.creation.holdForUltra();this.creation.prepareShields()}
      if (event === 'arceus'&&!this.ultraBoss) this.summonArceus()
      if(event==='finished'&&this.arceus.active)this.divineRetreats=this.nearbyRetreats()
      if (event === 'finished' && !this.arceus.active && !this.sunMoon.active&&!this.unova.active&&!this.kalos.active&&!this.galar.active&&!this.avian.active&&!this.rider.active&&!this.hoopa.active&&!this.paradox.active&&!this.necrozma.active) {this.backgroundStarted=false;this.airDuel.cancel(); this.deoxys.rest(false); this.roam(); return }
    }
    if (this.arceus.active) {
      this.deoxys.clock += delta; this.deoxys.elapsed += delta
      this.arceus.targetCount=this.divinePets().length
      const previous = this.arceus.elapsed, before = this.arceus.judgmentElapsed
      if (this.arceus.advance(delta, this.clock)) {
        if(this.creation.held)this.creation.leave()
        if(this.sunMoon.held)this.sunMoon.leave();if(this.unova.held)this.unova.leave()
        if(this.necrozma.battle.allied)this.necrozma.battle.leave()
        this.deoxys.rest(false)
        if(this.creation.active||this.sunMoon.active||this.unova.active||this.kalos.active||this.galar.active||this.avian.active||this.rider.active||this.hoopa.active||this.paradox.active||this.necrozma.active)this.state='cosmic';else {this.backgroundStarted=false;this.roam()}
        return
      }
      if (previous < 4200 && this.arceus.elapsed >= 4200) { this.setRay('pulse'); this.setGroudon('burst'); this.setKyogre('pulse'); this.deoxys.perform('skill') }
      if (previous < 9000 && this.arceus.elapsed >= 9000) { this.setRay('fly'); this.setGroudon('roar'); this.setKyogre('roar'); this.deoxys.perform('float') }
      this.divineRetreats.slice(0,this.divinePets().length).forEach((retreat, index) => {
        for (let wave = 0; wave < 3; wave++) {
          const at = judgmentHitTime(wave, index,this.arceus.targetCount)
          if (before < at && this.arceus.judgmentElapsed >= at) {
            const [min, max] = this.divineBounds(index)
            const protectedVisitor=this.judgmentShield(index)||this.creation.active&&(index>=4&&index<6&&this.creation.shields[index-4]||index===6&&this.creation.trio&&this.creation.shadowShield)
            retreat.x = Math.max(min, Math.min(max, retreat.x + retreat.direction * (protectedVisitor?8:24)))
          }
        }
      })
      const ease = 1 - Math.exp(-delta / 350)
      this.divinePets().forEach((pet, index) => { pet.x += (this.divineRetreats[index].x - pet.x) * ease })
      return
    }
    if(this.ultraBoss){
      const battle=this.necrozma.battle
      this.deoxys.clock+=delta;this.deoxys.elapsed+=delta
      if(battle.stage==='ultra-assault'){if(this.ray.action!=='pulse')this.setRay('pulse');if(this.kyogre.action!=='pulse')this.setKyogre('pulse');if(this.groudon.action!=='burst')this.setGroudon('burst');if(this.deoxys.action!=='skill')this.deoxys.perform('skill')}else{if(this.deoxys.action==='skill')this.deoxys.perform('float');if(this.ray.action==='pulse')this.setRay('fly');if(this.kyogre.action==='pulse')this.setKyogre('roar');if(this.groudon.action==='burst')this.setGroudon('roar')}
      const pets=this.divinePets(),ease=1-Math.exp(-delta/300)
      pets.forEach((pet,index)=>{const goal=this.divineRetreats[index];if(!goal)return;const hit=ultraHitTime(index),shield=this.creation.active&&(index===4||index===5||index===6&&this.creation.trio);if(ultraBefore<hit&&battle.fireElapsed>=hit){const [min,max]=this.divineBounds(index);goal.x=Math.max(min,Math.min(max,goal.x+goal.direction*(shield?14:40)))}pet.x+=(goal.x-pet.x)*ease})
      return
    }
    if (this.creation.active || this.sunMoon.active || this.unova.active || this.kalos.active || this.galar.active||this.avian.active||this.rider.active||this.hoopa.active||this.paradox.active) {
      if(!this.backgroundStarted&&this.creation.elapsed>=3200)this.startBackground()
      if(this.backgroundStarted){this.advanceGround(delta);this.airDuel.advance(delta);this.turn=this.airDuel.turn;this.duelElapsed=this.airDuel.elapsed}
      return
    }
    if(this.autoEpic){
      const turn=this.airDuel.turn;this.advanceGround(delta);this.airDuel.advance(delta);this.turn=this.airDuel.turn;this.duelElapsed=this.airDuel.elapsed
      this.state=this.airDuel.stage==='fight'?'duel':'approach'
      if(turn===4&&this.airDuel.turn===0)this.roam()
      return
    }
    if (this.mode === 'duel') {
      this.advanceGround(delta); this.airDuel.advance(delta); this.turn=this.airDuel.turn; this.duelElapsed=this.airDuel.elapsed
      this.state=this.airDuel.stage==='fight'?'duel':'approach'; return
    }
    this.deoxys.advance(delta)
    if (this.state === 'rest') return
    if (this.state === 'roam') {
      if (this.clock >= this.nextDuel) { this.opponent = this.battle%2 === 0 ? 'kyogre' : 'ray'; this.prepare(); return }
      if (this.clock >= this.ray.until) this.chooseRay()
      if (this.clock >= this.groudon.until) this.chooseGroudon()
      if (this.clock >= this.kyogre.until) this.chooseKyogre()
      if (this.ray.action === 'fly' || this.ray.action === 'dash') this.move(this.ray, delta, this.ray.action === 'dash' ? 28 : 12)
      if (this.groudon.action === 'walk') this.move(this.groudon, delta, 9)
      if (this.kyogre.action === 'swim') this.move(this.kyogre,delta,10)
      return
    }
    if (this.state === 'approach') {
      this.move(this.ray, delta, 28); this.move(this.groudon, delta, 20)
      this.move(this.kyogre,delta,20)
      if (Math.abs(this.ray.x - this.airDuel.rayX) < .1 && Math.abs(this.groudon.x - this.duelGroundX) < .1 && Math.abs(this.ray.y - this.duelRayY) < .1 && Math.abs(this.kyogre.x-this.duelKyogreX)<.1 && Math.abs(this.kyogre.y-50)<.1) {
        this.state = 'duel'; this.duelElapsed = 0
        this.ray.x = this.airDuel.rayX; this.ray.y = this.duelRayY; this.groudon.x = this.duelGroundX
        this.kyogre.x = this.duelKyogreX; this.kyogre.y = 50
        this.ray.right = true; this.groudon.right = false
        this.kyogre.right = true
        this.turn = this.battle++ % (this.opponent==='kyogre'?5:4)
        this.rounds = 2 + Math.floor(this.random() * 3); this.fightActions()
      }
      return
    }
    this.duelElapsed += delta
    if (this.duelElapsed >= 7000) {
      this.duelElapsed %= 7000
      if (this.mode === 'play' && --this.rounds <= 0) { this.roam(); return }
      this.turn = (this.turn + 1) % (this.opponent==='kyogre'?5:4)
      this.fightActions()
    }
  }
}
