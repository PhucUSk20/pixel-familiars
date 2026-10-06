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
  state: 'roam' | 'approach' | 'duel' | 'rest' = 'roam'
  clock = 0
  groundState: 'approach' | 'fight' = 'approach'
  groundTurn = 0
  groundElapsed = 0
  duelElapsed = 0
  turn = 0
  opponent: 'ray' | 'kyogre' | 'deoxys' = 'kyogre'
  kyogre: Wanderer<KyogreAction> = { x:-15,y:50,targetX:15,targetY:50,right:true,action:'swim',until:7500,revision:0 }
  ray: Wanderer<MegaAction> = { x: 16, y: 10, targetX: 80, targetY: 28, right: true, action: 'fly', until: 6500, revision: 0 }
  groudon: Wanderer<GroudonAction> = { x: 224, y: 44, targetX: 130, targetY: 44, right: false, action: 'walk', until: 9000, revision: 0 }
  readonly deoxys: DeoxysLife
  readonly airDuel: RayDeoxysDuel
  width = 480
  get coast(): number { return this.width * 208 / 480 }
  get groundMin(): number { return this.coast - 118 }
  get groundMax(): number { return this.width - 250 }
  get duelGroundX(): number { return Math.max(this.groundMin, Math.min(this.groundMax, this.width * 224 / 480)) }
  get swimMax(): number { return Math.max(-20,this.coast-188) }
  get duelKyogreX(): number { return Math.max(-40,Math.min(this.swimMax,this.coast*.45-128)) }
  get duelRayY(): number { return this.opponent === 'kyogre' ? -32 : 10 }
  resize(width: number): void {
    if (!Number.isFinite(width) || width < 480 || width === this.width) return
    this.width = width
    this.deoxys.resize(width); this.airDuel.resize(width)
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
    if (this.state === 'approach') { this.groudon.targetX = this.duelGroundX; this.kyogre.targetX = this.duelKyogreX }
    if (this.state === 'duel') this.prepare()
  }
  private nextDuel: number
  private rounds = 2
  private battle = 0
  constructor(private random: () => number = Math.random) {
    this.nextDuel = 24000 + this.random() * 12000
    this.deoxys = new DeoxysLife(random,true); this.airDuel = new RayDeoxysDuel(this.ray,this.deoxys)
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
    this.ray.targetX = 16; this.ray.targetY = this.duelRayY; this.groudon.targetX = this.duelGroundX
    this.kyogre.targetX = this.duelKyogreX; this.kyogre.targetY = 50
    this.setRay('fly'); this.setGroudon('walk'); this.setKyogre('swim')
  }
  private roam(): void {
    this.state = 'roam'
    this.nextDuel = this.clock + 35000 + this.random() * 25000
    this.chooseRay(); this.chooseGroudon(); this.chooseKyogre()
  }
  private chooseRay(): void {
    const choices: MegaAction[] = ['fly', 'fly', 'fly', 'dash', 'roar', 'sleep']
    this.setRay(choices[Math.floor(this.random() * choices.length)])
    this.ray.until = this.clock + 5500 + this.random() * 5500
    this.ray.targetX = 4 + this.random() * (this.width - 200); this.ray.targetY = -24 + this.random() * 76
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
      if (Math.abs(this.ray.x - 16) < .1 && Math.abs(this.groudon.x - this.duelGroundX) < .1 && Math.abs(this.ray.y - this.duelRayY) < .1 && Math.abs(this.kyogre.x-this.duelKyogreX)<.1 && Math.abs(this.kyogre.y-50)<.1) {
        this.state = 'duel'; this.duelElapsed = 0
        this.ray.x = 16; this.ray.y = this.duelRayY; this.groudon.x = this.duelGroundX
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
