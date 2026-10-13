import {placeGroup,resizeGroup} from './arena-layout'
export type CreationStage = 'absent' | 'arrival' | 'ordinary-charge' | 'ordinary-fire' | 'ordinary-impact' | 'signature-charge' | 'signature-fire' | 'signature-impact' | 'aftershock' | 'await-arceus' | 'await-ultra' | 'departure'
export type CreationActor = { x: number; y: number; right: boolean }
export const CREATION_BOUNDARIES = [0, 3200, 5000, 7800, 9500, 13000, 16200, 19300, 21500, 24100] as const
const stages: CreationStage[] = ['arrival','ordinary-charge','ordinary-fire','ordinary-impact','signature-charge','signature-fire','signature-impact','aftershock','departure']
/** Temporary rivals; the probability is rolled once after their signature collision. */
export class CreationLife {
  heldForUltra=false
  shadowShield = false
  trio = false
  giratina: CreationActor = {x:144,y:-160,right:true}
  ordinary: 'mouth' | 'orb' = 'mouth'
  shields: [boolean,boolean] = [false,false]
  joiningArceus = false
  active = false
  elapsed = 0
  held = false
  nextVisit: number
  private rolled = false
  private rupture = false
  private previousTrio: boolean | undefined
  private width = 480
  palkia: CreationActor = { x: 24, y: -88, right: true }
  dialga: CreationActor = { x: 264, y: -88, right: false }
  constructor(private random: () => number = Math.random) { this.nextVisit = 45000 + random() * 60000 }
  get stage(): CreationStage {
    if (!this.active) return 'absent'
    if (this.held) return this.heldForUltra?'await-ultra':'await-arceus'
    for(let index=0;index<stages.length;index++)if(this.elapsed<CREATION_BOUNDARIES[index+1])return stages[index]
    return 'departure'
  }
  get phaseProgress(): number {
    const index = stages.indexOf(this.stage)
    if (index < 0) return 0
    return Math.max(0, Math.min(1, (this.elapsed - CREATION_BOUNDARIES[index]) / (CREATION_BOUNDARIES[index+1] - CREATION_BOUNDARIES[index])))
  }
  get opacity(): number { return !this.active ? 0 : this.stage === 'arrival' ? Math.max(0, Math.min(1, (this.elapsed - 800) / 1500)) : this.stage === 'departure' ? 1 - this.phaseProgress : 1 }
  get riftVisible(): boolean { return this.active && this.rupture }
  resize(width: number): void {
    if (!Number.isFinite(width) || width < 480) return
    resizeGroup([this.palkia,this.dialga,this.giratina],this.width,width);this.width=width
  }
  begin(trio?: boolean): boolean {
    if (this.active) return false
    this.active = true; this.elapsed = 0; this.held = false;this.heldForUltra=false; this.rolled = false
    this.trio = trio ?? (this.previousTrio === false || this.random()<.45)
    this.previousTrio = this.trio
    this.ordinary = this.random() < .5 ? 'mouth' : 'orb'
    this.shadowShield = false; this.shields = [false,false]; this.joiningArceus = false; this.rupture = false
    placeGroup([this.palkia,this.dialga,this.giratina],this.width,'creation')
    this.palkia.right = true; this.dialga.right = false
    return true
  }
  prepareShields(): void { this.shields = [true,true]; this.shadowShield = this.trio }
  holdForArceus(): void { if (this.active) { this.held = true;this.heldForUltra=false; this.joiningArceus = false; this.elapsed = Math.max(this.elapsed,19300); this.rolled = true } }
  holdForUltra():void {this.holdForArceus();if(this.active)this.heldForUltra=true}
  leave(): void { if (this.active) { this.held = false;this.heldForUltra=false; this.elapsed = 21500; this.rolled = true } }
  cancel(clock: number): void { this.active = false; this.held = false;this.heldForUltra=false; this.shadowShield = false; this.elapsed = 0; this.nextVisit = clock + 45000 + this.random() * 60000 }
  advance(delta: number, clock: number): 'arceus' | 'finished' | undefined {
    if (!this.active || this.held || !Number.isFinite(delta) || delta <= 0) return
    const before=this.elapsed
    this.elapsed += delta
    if(!this.joiningArceus && before<16200 && this.elapsed>=16200)this.rupture=true
    if(this.joiningArceus && this.elapsed >= 3200){this.holdForArceus();return}
    if (!this.rolled && this.elapsed >= 19300) {
      this.rolled = true
      if (this.random() < .35) { this.holdForArceus(); return 'arceus' }
    }
    if (this.elapsed >= 24100) { this.cancel(clock); return 'finished' }
  }
}
