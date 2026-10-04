import { compose, crop, stamp, trailWidth, type Body, type Canvas } from '../../plugins/pixel-pet/hooks/pixels'
import type { ProjectState } from './project-state'
import { drawInteraction, type Interaction } from './interactions'
import { PetHabitat, type HabitatFrame } from './habitat'

/** Local project results in the shared scene, independent of agent minis and usage. */
export class MiniPet {
  private handle = document.getElementById('mini-stage')!
  private stage = document.getElementById('stage') as HTMLCanvasElement
  private bubble = document.getElementById('mini-bubble')!
  private x?: number
  private manual = false
  private manualUntil = 0
  private width = 48
  private drag?: { id: number; start: number; moved: boolean }
  private since = Date.now()
  private until = 0
  private action = 'idle'
  private asleep = false
  private approaching = false
  private mainLeft = 0
  private mainWidth = 19
  private dir: 1 | -1 = 1
  private habitat = new PetHabitat()
  private pending?: Interaction
  private frame?: HabitatFrame
  private result: ProjectState = { status: 'unverified', errors: 0, warnings: 0, checks: [], text: 'Project not checked yet' }
  constructor(private inspect: () => void) {
    this.handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || this.drag) return
      this.drag = { id: event.pointerId, start: event.clientX, moved: false }
      this.handle.setPointerCapture(event.pointerId)
    })
    this.handle.addEventListener('pointermove', event => {
      if (!this.drag || this.drag.id !== event.pointerId) return
      this.drag.moved ||= Math.abs(event.clientX - this.drag.start) > 5
      if (this.drag.moved) {
        const rect = this.stage.getBoundingClientRect()
        const scale = Number(this.handle.dataset.scale) || 1
        this.move((event.clientX - rect.left) / scale - 3)
      }
    })
    this.handle.addEventListener('pointerup', event => {
      if (!this.drag || this.drag.id !== event.pointerId) return
      const moved = this.drag.moved
      this.drag = undefined
      if (this.handle.hasPointerCapture(event.pointerId)) this.handle.releasePointerCapture(event.pointerId)
      if (!moved) { this.act('pet'); this.inspect() }
      else if (this.near()) this.act('pet')
    })
    this.handle.addEventListener('pointercancel', () => { this.drag = undefined })
    this.handle.addEventListener('lostpointercapture', () => { this.drag = undefined })
    this.handle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.act('pet'); this.inspect() }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); this.move((this.x ?? 0) + (event.key === 'ArrowLeft' ? -3 : 3))
      }
    })
    for (const action of ['feed', 'play', 'sleep']) document.getElementById(`mini-${action}`)!.addEventListener('click', () => this.act(action))
  }
  project(state: ProjectState): void {
    const recovered = this.result.status !== 'verified' && state.status === 'verified'
    this.result = state
    this.handle.dataset.project = state.status
    const reading = document.getElementById('mini-project')!
    reading.textContent = state.text
    reading.style.color = state.status === 'issues' ? '#ff8585' : state.status === 'verified' ? '#8add97' : state.checks.some(check => check.status === 'running') ? '#9dcaff' : 'inherit'
    this.handle.title = `Project: ${state.text}. Click to inspect.`
    if (recovered) this.act('celebrate')
  }
  private beside(): number {
    const right = this.mainLeft + this.mainWidth + 3
    return right + 6 <= this.width ? right : Math.max(0, this.mainLeft - 9)
  }
  private near(): boolean { return this.x !== undefined && Math.abs(this.x - this.beside()) < 2 }
  private move(x: number): void {
    this.x = Math.max(0, Math.min(this.width - 6, x))
    this.manual = true; this.approaching = false
    this.manualUntil = Date.now() + 12000
    this.pending = undefined; this.habitat.placeMini(this.x)
    this.handle.dataset.x = String(this.x)
  }
  private text(): string {
    return this.action === 'celebrate' ? 'Checks passed! Mini celebrates the result.' : this.action === 'feed' ? 'Mini shares a snack with the AI pet.' : this.action === 'play' ? 'Mini and the AI pet play together!' : this.action === 'wake' ? 'Mini wakes up beside the AI pet.' : '♥ Mini greets the AI pet.'
  }
  private act(action: string): void {
    const now = Date.now()
    this.since = now; this.until = now + 2400; this.action = action
    this.pending = action === 'feed' || action === 'play' ? action : action === 'celebrate' || action === 'pet' ? 'highfive' : undefined
    if (action === 'sleep') this.asleep = !this.asleep
    else this.asleep = false
    if (action === 'sleep' && !this.asleep) this.action = 'wake'
    this.handle.dataset.action = this.asleep ? 'sleep' : this.action
    document.getElementById('mini-sleep')!.textContent = this.asleep ? 'Wake' : 'Rest'
    if (this.asleep) {
      this.approaching = false
      this.bubble.textContent = 'Mini rests while the AI pet keeps watch.'
      return
    }
    this.manual = false; this.approaching = Boolean(this.pending)
    this.bubble.textContent = this.near() ? this.text() : 'Mini is coming over to the AI pet…'
  }
  /** Prepare both actors before the main sprite is painted. Real activity always wins. */
  prepare(width: number, mainLeft: number, mainWidth: number, now: number, available: boolean): HabitatFrame | undefined {
    if (this.manual && !this.drag && now >= this.manualUntil) this.manual = false
    this.width = width; this.mainLeft = mainLeft; this.mainWidth = mainWidth
    this.x ??= mainLeft < width / 2 ? width - 8 : 2
    this.x = Math.max(0, Math.min(width - 6, this.x))
    const canPlay = available && !this.drag && !this.manual && !this.asleep && !this.result.checks.some(check => check.status === 'running')
    if (canPlay && this.pending) {
      this.habitat.request(this.pending); this.pending = undefined
    }
    this.frame = this.habitat.update(now, width, mainLeft, this.x, canPlay)
    this.approaching = this.frame?.phase === 'meet'
    if (this.frame?.phase === 'apart') this.action = 'idle'
    if (this.frame) {
      this.x = this.frame.mini.x
      const special = this.frame.kind === 'highfive' && (this.action === 'celebrate' || this.action === 'pet')
      this.handle.dataset.action = special ? this.action : this.frame.kind ?? (this.approaching && this.action !== 'idle' ? this.action : this.frame.phase)
      this.bubble.textContent = special ? this.text() : this.frame.text
    }
    this.handle.dataset.interaction = this.frame?.kind ?? ''
    this.handle.dataset.phase = this.frame?.phase ?? 'paused'
    return this.frame
  }
  get keepsCompany(): boolean { return !this.asleep }
  get left(): number { return this.x ?? 0 }
  /** Adds the mini to the same pixel canvas and ground as the main pet. */
  draw(body: Body, band: Canvas, mainLeft: number, mainWidth: number, now: number): void {
    this.width = band.w; this.mainLeft = mainLeft; this.mainWidth = mainWidth
    this.x ??= this.beside()
    this.x = Math.max(0, Math.min(band.w - 6, this.x))
    this.dir = this.x > mainLeft + mainWidth / 2 ? -1 : 1
    const active = now < this.until
    const picture = crop(compose(body, 'idle', 0, 1, 'ok', [{ age: this.asleep ? 816 : now - this.since + 500 }]), 0, 0, trailWidth(1), 20)
    const jump = active && (this.action === 'play' || this.action === 'celebrate') ? Math.round(Math.abs(Math.sin((now - this.since) / 130)) * 3) : 0
    const left = Math.round(this.x)
    if (this.frame) drawInteraction(body, band, this.frame)
    else for (let y = 0; y < picture.h; y++) for (let x = 0; x < picture.w; x++) {
      const color = picture.px[y * picture.w + x], yy = y - jump
      if (color < 0 || yy < 0) continue
      const xx = left + (this.dir === 1 ? x : picture.w - 1 - x)
      if (xx >= 0 && xx < band.w) band.px[yy * band.w + xx] = color
    }
    if (this.asleep) stamp(band, left + 1, 9, ['ZZZ', '..Z', '.Z.', 'ZZZ'], { Z: 0x9dcaff })
    else if (this.result.checks.some(check => check.status === 'running')) {
      const positions = [[0, 0], [2, 0], [2, 2], [0, 2]]
      const [x, y] = positions[Math.floor(now / 150) % positions.length]
      stamp(band, left + 1 + x, 8 + y, ['CC', 'CC'], { C: 0x9dcaff })
    }
    else if (active && !this.approaching && !this.frame) {
      const heart = ['.H.H.', 'HHHHH', '.HHH.', '..H..']
      stamp(band, left, 5, heart, { H: 0xffb1ca })
      if (this.near()) stamp(band, Math.min(band.w - 5, mainLeft + Math.floor(mainWidth / 2)), 0, heart, { H: 0xffb1ca })
    }
    this.handle.dataset.x = String(this.x)
    this.handle.dataset.near = String(this.frame?.phase === 'play' || this.near())
    const flags = { issues: { rows: ['F....', 'FFFF.', 'FFFF.', 'F....', 'F....'], color: 0xff6d78 }, verified: { rows: ['....F', '...F.', 'F.F..', '.F...', '.....'], color: 0x80db91 }, unverified: undefined }
    const flag = flags[this.result.status]
    if (flag) stamp(band, left + 1, 7, flag.rows, { F: flag.color })
    this.handle.setAttribute('aria-label', `Mini project, ${this.result.text}, ${this.asleep ? 'resting' : active && this.action === 'wake' ? 'wake' : this.frame ? this.frame.kind ?? this.frame.phase : this.approaching ? 'approaching the AI pet' : active ? this.action : 'idle'}. Click to inspect; drag or use arrow keys to move.`)
    if (!this.frame && !active && !this.asleep && !this.approaching) { this.handle.dataset.action = 'idle'; this.bubble.textContent = 'Mini watches project results. The pets play together automatically when the AI is idle.' }
  }
  /** Keep the accessible hit target aligned with the sprite at the stage's current scale. */
  place(scale: number, top: number): void {
    this.handle.dataset.scale = String(scale)
    this.handle.style.left = `${Math.max(0, (this.x ?? 0) * scale - 4)}px`
    this.handle.style.top = `${top + (8 - (this.frame?.mini.lift ?? 0)) * scale}px`
    this.handle.style.width = `${6 * scale + 8}px`
    this.handle.style.height = `${12 * scale}px`
  }
}
