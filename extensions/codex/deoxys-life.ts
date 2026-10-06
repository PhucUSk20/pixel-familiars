import { type DeoxysForm, type DeoxysAction } from './deoxys-rig'

/** Local flight and meteorite choreography. No timers, model calls or host messages. */
export class DeoxysLife {
  form: DeoxysForm = 'normal'
  previousForm: DeoxysForm = 'normal'
  action: DeoxysAction = 'float'
  state: 'roam' | 'meteor' | 'approach' | 'touch' | 'transform' | 'skill' | 'rest' | 'battle' = 'roam'
  clock = 0
  elapsed = 0
  x = 150
  y = 18
  target = 150
  targetY = 18
  width = 480
  revision = 0
  meteorVisible = false
  meteorX = 305
  meteorY = -32
  private next = 7000
  private bag: DeoxysForm[] = []
  private targetForm: DeoxysForm = 'normal'
  private returning = false
  private requestedForm?: DeoxysForm
  constructor(private random: () => number = Math.random, private skyLane = false) {
    this.x = this.clampX(this.x); this.target = this.x
    if (skyLane) this.y = this.targetY = -18
  }

  resize(width: number): void {
    this.width = Math.max(480, width)
    this.x = this.clampX(this.x)
    this.meteorX = Math.max(160, Math.min(this.width - 37, this.meteorX))
    this.target = this.state === 'approach' ? this.meteorX - 155 : this.clampX(this.target)
  }
  private clampX(x: number): number { return Math.max(this.skyLane ? this.width * .42 : 0, Math.min(this.width - 192, x)) }
  private enter(state: typeof this.state, action: DeoxysAction): void {
    this.state = state; this.action = action; this.elapsed = 0; this.revision++
  }
  meteor(form?: DeoxysForm): void {
    this.requestedForm = form
    // Land beside the current pet, not at a fixed destination across the panel.
    this.meteorX = Math.max(160, Math.min(this.width - 37, this.x + 155 + (this.random() - .5) * 36))
    this.meteorY = -32; this.meteorVisible = true
    this.target = this.x; this.targetY = this.y
    this.enter('meteor', 'float')
  }
  skill(): void { this.enter('skill', 'skill') }
  perform(action: DeoxysAction): void { this.meteorVisible = false; this.enter('battle', action) }
  rest(value: boolean): void {
    this.requestedForm = undefined
    // Cancel an unfinished descent without leaving a meteorite suspended in the sky.
    if (this.state === 'meteor') this.meteorVisible = false
    if (value) this.enter('rest', 'rest')
    else { this.enter('roam', 'float'); this.next = this.clock + 5000 }
  }
  private variant(): DeoxysForm {
    if (!this.bag.length) {
      this.bag = ['attack', 'defense', 'speed']
      for (let i = 2; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1))
        ;[this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]]
      }
    }
    return this.bag.pop()!
  }
  advance(delta: number): void {
    if (!Number.isFinite(delta) || delta < 0) return
    // Bounded steps preserve landing, contact and midpoint transitions after delays.
    for (let left = delta; left > 0;) { const step = Math.min(100, left); left -= step; this.step(step) }
  }
  private step(delta: number): void {
    this.clock += delta; this.elapsed += delta
    if (this.state === 'rest' || this.state === 'battle') return
    if (this.state === 'meteor') {
      const fall = Math.min(1, this.elapsed / 1500)
      this.meteorY = -32 + 216 * fall * fall
      if (this.elapsed >= 2100) {
        this.target = this.meteorX - 155; this.targetY = 52
        this.enter('approach', 'float')
      }
    } else if (this.state === 'roam' || this.state === 'approach') {
      const dx = this.target - this.x, dy = this.targetY - this.y
      const speed = delta * (this.state === 'approach' ? .035 : .022)
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), speed)
      this.y += Math.sign(dy) * Math.min(Math.abs(dy), speed * .5)
      if (this.state === 'approach' && Math.abs(dx) < .1 && Math.abs(dy) < .1) this.enter('touch', 'touch')
      else if (this.state === 'roam' && this.clock >= this.next) {
        if (this.form === 'normal' || this.returning) this.meteor()
        else this.skill()
      } else if (this.state === 'roam' && Math.abs(dx) < .1 && Math.abs(dy) < .1 && this.elapsed > 1800) {
        this.target = this.clampX(this.x + (this.random() - .5) * 230)
        this.targetY = this.skyLane ? -28 + this.random() * 20 : -22 + this.random() * 64
        this.elapsed = 0
      }
    } else if (this.state === 'touch' && this.elapsed >= 1700) {
      this.previousForm = this.form
      this.targetForm = this.requestedForm ?? (this.form === 'normal' ? this.variant() : 'normal')
      this.requestedForm = undefined
      this.enter('transform', 'transform')
    } else if (this.state === 'transform') {
      if (this.elapsed >= 1200) this.form = this.targetForm
      if (this.elapsed >= 2400) {
        this.returning = false; this.meteorVisible = false
        if (this.form === 'normal') this.skill()
        else { this.enter('roam', 'float'); this.next = this.clock + 3500; this.targetY = this.skyLane ? -18 : 12 }
      }
    } else if (this.state === 'skill' && this.elapsed >= 6500) {
      this.returning = this.form !== 'normal'
      this.enter('roam', 'float'); this.next = this.clock + 6500; this.targetY = this.skyLane ? -18 : -4
    }
  }
}
