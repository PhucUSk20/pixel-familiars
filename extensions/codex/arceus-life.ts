export type ArceusSkill = 'judgment' | 'twister' | 'recover' | 'hyper-beam'
export const ARCEUS_VISIT_MS = 23600
export const ARCEUS_CAST_MS = 12000
export const ARCEUS_COUNTER_AT = 9000
export const judgmentStagger = (count:number):number => Math.min(.008,.2/Math.max(1,count-1))
export const judgmentHitTime = (wave: number, index: number, count=25): number => (.63 + wave * .08 + index * judgmentStagger(count)) * ARCEUS_CAST_MS
const smooth = (value: number): number => { const n = Math.max(0, Math.min(1, value)); return n * n * (3 - 2 * n) }
/** Rare local visits: descent, combined attack blocked by a shield, then Judgment. */
export class ArceusLife {
  targetCount = 4
  elapsed = 0
  active = false
  skill: ArceusSkill = 'judgment'
  nextVisit: number
  constructor(private random: () => number = Math.random) { this.nextVisit = 150000 + random() * 150000 }
  get duration(): number { return ARCEUS_VISIT_MS }
  get departureAt(): number { return this.duration - 2600 }
  get stage(): 'absent' | 'arrival' | 'awe' | 'assault' | 'cast' | 'departure' {
    return !this.active ? 'absent' : this.elapsed < 2800 ? 'arrival' : this.elapsed < 4200 ? 'awe' : this.elapsed < ARCEUS_COUNTER_AT ? 'assault' : this.elapsed < this.departureAt ? 'cast' : 'departure'
  }
  /** Sprite and orbit descend together from above the viewport, then ascend on departure. */
  get heightOffset(): number {
    if (!this.active) return -210
    if (this.stage === 'arrival') return -210 * (1 - smooth(this.elapsed / 2800))
    if (this.stage === 'departure') return -210 * smooth((this.elapsed - this.departureAt) / 2600)
    return 0
  }
  get castElapsed(): number { return Math.max(0, Math.min(ARCEUS_CAST_MS, this.elapsed - ARCEUS_COUNTER_AT)) }
  get judgmentElapsed(): number { return Math.max(0, Math.min(ARCEUS_CAST_MS, this.elapsed - ARCEUS_COUNTER_AT)) }
  get opacity(): number { return !this.active ? 0 : Math.min(1, this.elapsed / 500, (this.duration - this.elapsed) / 2600) }
  begin(): void {
    this.active = true; this.elapsed = 0; this.skill = 'judgment'
  }
  cancel(clock: number): void { this.active = false; this.elapsed = 0; this.nextVisit = clock + 150000 + this.random() * 150000 }
  advance(delta: number, clock: number): boolean {
    if (!this.active || !Number.isFinite(delta) || delta <= 0) return false
    this.elapsed += delta
    if (this.elapsed < this.duration) return false
    this.cancel(clock); return true
  }
}
