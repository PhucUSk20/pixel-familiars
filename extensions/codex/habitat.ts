import { InteractionClock, interactionFrame, type Interaction, type Pose, type Prop } from './interactions'

export type SoloAction = 'walk' | 'look' | 'sniff' | 'butterfly' | 'hop' | 'stretch'
type Walker = { x: number; target: number; dir: 1 | -1; until: number; since: number; action: SoloAction }
export type HabitatFrame = { main: Pose; mini: Pose; props: Prop[]; elapsed: number; text: string; phase: 'roam' | 'meet' | 'play' | 'apart'; kind?: Interaction }
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))
const walker = (x: number): Walker => ({ x, target: x, dir: 1, until: 0, since: 0, action: 'look' })

/** Two independent local actors. A scheduled invitation gathers them before playing. */
export class PetHabitat {
  private main?: Walker
  private mini?: Walker
  private clock: InteractionClock
  private tick = 0
  private phase: HabitatFrame['phase'] = 'roam'
  private invite?: { kind: Interaction; anchor: number }
  private last?: HabitatFrame
  private apartUntil = 0
  private requested?: Interaction
  constructor(private random = Math.random) { this.clock = new InteractionClock(random) }
  request(kind: Interaction): void { this.requested = kind }
  placeMini(x: number): void { if (this.mini) { this.mini.x = x; this.mini.target = x } }

  update(now: number, width: number, mainLeft: number, miniLeft: number, available: boolean): HabitatFrame | undefined {
    this.main ??= walker(mainLeft)
    this.mini ??= walker(miniLeft)
    const main = this.main, mini = this.mini
    main.x = clamp(main.x, 0, width - 19); mini.x = clamp(mini.x, 0, width - 6)
    main.target = clamp(main.target, 0, width - 19); mini.target = clamp(mini.target, 0, width - 6)
    if (this.invite) {
      this.invite.anchor = clamp(this.invite.anchor, 2, width - 40)
      if (this.phase === 'meet') {
        const start = interactionFrame(this.invite.kind, 0, width, this.invite.anchor)
        main.target = start.main.x; mini.target = start.mini.x
      }
    }
    const dt = this.tick ? clamp(now - this.tick, 0, 150) / 1000 : 0
    this.tick = now
    if (!available) {
      this.clock.cancel(now); this.invite = undefined; this.phase = 'roam'; this.last = undefined
      main.x = mainLeft; main.target = mainLeft; main.until = 0
      mini.x = miniLeft; mini.target = miniLeft; mini.until = 0
      // A pending user action may wait for real work to finish, but an interrupted
      // automatic scene is never resumed or used as evidence of AI activity.
      return undefined
    }
    if (this.requested) {
      this.meet(this.requested, now, width); this.requested = undefined
    }
    if (this.phase === 'play') {
      const frame = this.clock.update(now, true, width, this.invite!.anchor)
      if (frame && frame.kind === this.invite!.kind && (!this.last || frame.elapsed >= this.last.elapsed)) {
        main.x = frame.main.x; mini.x = frame.mini.x
        return this.last = { ...frame, phase: 'play' }
      }
      this.separate(now, width)
      if (frame) this.meet(frame.kind, now, width)
    } else if (this.phase !== 'meet') {
      const due = this.clock.update(now, true, width, main.x)
      if (due) this.meet(due.kind, now, width)
    }
    if (this.phase === 'meet') {
      this.travel(main, dt, 8); this.travel(mini, dt, 12)
      if (Math.abs(main.x - main.target) < 0.2 && Math.abs(mini.x - mini.target) < 0.2) {
        this.clock.request(this.invite!.kind, now); this.phase = 'play'
        const frame = this.clock.update(now, true, width, this.invite!.anchor)!
        main.x = frame.main.x; mini.x = frame.mini.x
        return this.last = { ...frame, phase: 'play' }
      }
    } else {
      if (this.phase === 'apart' && now >= this.apartUntil) this.phase = 'roam'
      this.roam(main, mini, now, dt, width, 19, 6, 6)
      this.roam(mini, main, now, dt, width, 6, 19, 10)
    }
    const props: Prop[] = []
    const mainPose = this.pose(main, now, 19, props), miniPose = this.pose(mini, now, 6, props)
    const text = this.phase === 'meet' ? 'An invitation! The pets walk over to meet each other.' : this.phase === 'apart' ? 'See you later! The pets head off in different directions.' : this.soloText(main, mini)
    return this.last = { main: mainPose, mini: miniPose, props, elapsed: now - main.since, text, phase: this.phase }
  }
  private meet(kind: Interaction, now: number, width: number): void {
    const main = this.main!, mini = this.mini!
    const anchor = clamp((main.x + mini.x - 29) / 2, 2, width - 40)
    const start = interactionFrame(kind, 0, width, anchor)
    this.clock.cancel(now); this.invite = { kind, anchor }; this.phase = 'meet'
    for (const [actor, target] of [[main, start.main.x], [mini, start.mini.x]] as const) {
      actor.target = target; actor.action = 'walk'; actor.since = now
    }
  }
  private separate(now: number, width: number): void {
    const main = this.main!, mini = this.mini!
    const mainOnLeft = main.x + 9.5 < mini.x + 3
    main.target = mainOnLeft ? 1 : width - 20
    mini.target = mainOnLeft ? width - 7 : 1
    for (const actor of [main, mini]) { actor.action = 'walk'; actor.since = now; actor.until = now + 6500 }
    this.phase = 'apart'; this.apartUntil = now + 6500; this.invite = undefined
  }
  private travel(actor: Walker, dt: number, speed: number): void {
    const distance = actor.target - actor.x
    if (Math.abs(distance) > 0.05) actor.dir = distance > 0 ? 1 : -1
    actor.x += Math.sign(distance) * Math.min(Math.abs(distance), dt * speed)
  }
  private overlaps(x: number, size: number, other: Walker, otherSize: number): boolean {
    return x < other.x + otherSize + 3 && x + size + 3 > other.x
  }
  private roam(actor: Walker, other: Walker, now: number, dt: number, width: number, size: number, otherSize: number, speed: number): void {
    if (now >= actor.until && this.phase !== 'apart') {
      actor.since = now; actor.until = now + 2200 + this.random() * 4000
      const pick = this.random()
      actor.action = pick < 0.55 ? 'walk' : (['look', 'sniff', 'butterfly', 'hop', 'stretch'] as const)[Math.min(4, Math.floor((pick - 0.55) / 0.09))]
      actor.target = actor.x
      if (actor.action === 'walk') {
        for (let attempt = 0; attempt < 8; attempt++) {
          const target = 1 + this.random() * Math.max(0, width - size - 2)
          if (!this.overlaps(target, size, other, otherSize)) { actor.target = target; break }
        }
      }
    }
    if (actor.action === 'walk') {
      const before = actor.x
      this.travel(actor, dt, speed)
      // No clipping through the other pet during ordinary wandering. If an
      // encounter ended with an overlap, allow movement that separates them.
      const separating = Math.abs(actor.x + size / 2 - other.x - otherSize / 2) > Math.abs(before + size / 2 - other.x - otherSize / 2)
      if (this.overlaps(actor.x, size, other, otherSize) && !separating) {
        actor.x = before; actor.target = before; actor.until = now + 800; actor.action = 'look'
      }
    }
  }
  private pose(actor: Walker, now: number, size: number, props: Prop[]): Pose {
    const elapsed = now - actor.since
    const phase = elapsed / 1000
    const pose: Pose = { x: actor.x, dir: actor.dir, mode: actor.action === 'walk' && Math.abs(actor.target - actor.x) > 0.1 ? 'run' : 'idle', lift: 0, squash: 1, tilt: 0 }
    const center = Math.round(actor.x + size / 2)
    const prop = (x: number, y: number, rows: string[], color: number) => props.push({ x: Math.round(x), y: Math.round(y), rows, color })
    if (actor.action === 'sniff') {
      pose.squash = 0.8; pose.tilt = actor.dir * 0.12
      prop(center + size / 2, 15, ['.P.', 'PPP', '.P.', '.P.', '.P.'], 0xffb6d3)
    } else if (actor.action === 'butterfly') {
      pose.tilt = Math.sin(phase * 2) * 0.09
      prop(center + Math.sin(phase * 2) * 5, 7 + Math.cos(phase * 3) * 2, Math.floor(phase * 8) % 2 ? ['P.P', '.P.'] : ['PPP', '.P.'], 0xffe39b)
    } else if (actor.action === 'hop') {
      pose.lift = Math.abs(Math.sin(phase * 2.5)) * (size === 19 ? 4 : 5)
      prop(center + size / 2 + 1, 18, ['.PP.', 'PPPP'], 0x9ba9b0)
    } else if (actor.action === 'stretch') {
      pose.squash = 0.72 + Math.abs(Math.sin(phase * 2)) * 0.28; pose.tilt = Math.sin(phase * 2) * 0.15
    } else if (size === 6 && pose.mode === 'run') pose.lift = Math.abs(Math.sin(phase * 8)) * 1.5
    return pose
  }
  private soloText(main: Walker, mini: Walker): string {
    const labels: Record<SoloAction, string> = { walk: 'explores', look: 'looks around', sniff: 'sniffs a flower', butterfly: 'watches a butterfly', hop: 'hops by a pebble', stretch: 'stretches' }
    return `The AI pet ${labels[main.action]}; Mini ${labels[mini.action]} on its own.`
  }
}
