import { compose, stamp, type Body, type Canvas } from '../../plugins/pixel-pet/hooks/pixels'
import { TOOL_DEPARTURE_MS, visibleTools, type ToolState, type Snapshot } from './protocol'
import { stationAnchor } from './work-zones'
export { drawWorkZones, layoutWorkZones } from './work-zones'

const SLOT = 18
export const SUMMON_MS = 1600
export const RESULT_MS = 9000
export const PORTAL_COLORS: Record<ToolState['mode'], number> = {
  read: 0x83d98c, edit: 0xffd66b, bash: 0x78aaff,
  search: 0xffa66b, web: 0x6bdfd2, agent: 0xc39bff,
}
export const workZone = (mode: ToolState['mode']): string => mode === 'read' ? 'Library' : mode === 'edit' ? 'Writing desk' : mode === 'bash' ? 'Terminal' : mode === 'agent' ? 'Dispatch' : 'Observatory'
export const taskLabel = (mode: ToolState['mode']): string => ({ read: 'Read', search: 'Search', edit: 'Edit', bash: 'Run', web: 'Web', agent: 'Delegate' })[mode]

/** Subagents share the portal renderer; compose must not also paint an agent trail. */
export function observedMinis(data: Snapshot, now: number): ToolState[] {
  const agents: NonNullable<Snapshot['agentStates']> = data.agentStates ?? data.agents.map(id => ({ id, since: now }))
  return [...data.toolStates ?? [], ...agents.map(agent => ({
    id: `agent:${agent.id}`, mode: 'agent' as const, target: '', since: agent.since,
    doneAt: agent.doneAt, failed: agent.failed,
    source: 'item' as const,
  }))]
}

/** Only lifecycle events create workers; source-code mentions never do. */
export function taskMiniLayout(states: ToolState[], now: number, width: number, agentTrail: number) {
  const recent = states.filter(tool => tool.doneAt === undefined || now - tool.doneAt < TOOL_DEPARTURE_MS)
  // A subagent is not evidence of nested tool calls inside an exec wrapper.
  const isAgent = (tool: ToolState) => tool.id.startsWith('agent:') && tool.mode === 'agent'
  const visible = [...visibleTools(recent.filter(tool => !isAgent(tool))), ...recent.filter(isAgent)]
  const ordered = visible.sort((a, b) => Number(a.doneAt !== undefined) - Number(b.doneAt !== undefined) || a.since - b.since || a.id.localeCompare(b.id))
  // Reserve the main pet's widest prop, its agent trail, and the project mini.
  const capacity = Math.max(0, Math.min(6, Math.floor((width - 33 - agentTrail - 10) / SLOT)))
  const shown = ordered.slice(0, capacity)
  return { shown, overflow: Math.max(0, ordered.length - shown.length), width: shown.length * SLOT, all: ordered }
}

/** Half-sized shared pet poses and props: book, pencil, terminal, globe, etc. */
type Placement = { x: number; scale: number; lift: number; travelling: boolean; dir?: -1 | 1; mode?: 'run' | 'cheer' | 'error' | 'idle' }
export function drawTaskMinis(body: Body, band: Canvas, tasks: ToolState[], now: number, positions?: Placement[]): void {
  tasks.forEach((tool, index) => {
    const elapsed = Math.max(0, now - (tool.doneAt ?? tool.since))
    const placement = positions?.[index]
    const mode = placement?.mode ?? (tool.awaitingResult ? 'idle' : tool.doneAt === undefined ? placement?.travelling ? 'run' : tool.mode : tool.cancelled ? 'idle' : tool.failed ? 'error' : 'cheer')
    const picture = compose(body, mode, elapsed, placement?.dir ?? 1)
    const bounce = tool.doneAt === undefined ? Math.round(Math.abs(Math.sin(elapsed / 350)) * 1) : Math.round(Math.abs(Math.sin(elapsed / 160)) * 2)
    const y0 = 10 - bounce
    for (let y = 0; y < picture.h; y += 2) for (let x = 0; x < picture.w; x += 2) {
      // Preserve fine pixels such as eyes and the pencil when shrinking the art.
      const colors = [picture.px[y * picture.w + x], x + 1 < picture.w ? picture.px[y * picture.w + x + 1] : undefined, picture.px[(y + 1) * picture.w + x], x + 1 < picture.w ? picture.px[(y + 1) * picture.w + x + 1] : undefined]
      const color = colors.find(value => value !== undefined && value >= 0)
      const dx = Math.round(placement?.x ?? index * SLOT) + Math.floor(x / 2)
      const dy = placement ? 19 - Math.round((9 - Math.floor(y / 2)) * placement.scale) - Math.round(placement.lift) : y0 + Math.floor(y / 2)
      if (color !== undefined && dx >= 0 && dx < band.w && dy >= 0 && dy < band.h && (!placement || placement.scale > 0)) band.px[dy * band.w + dx] = color
    }
  })
}

type WorkerVisual = { id: string; x: number; goal: number; origin: number; born: number; zone: string; portalColor: number; visible: boolean; failed?: boolean; phase: 'summon' | 'travel' | 'work' | 'return' | 'handoff' | 'error' | 'depart' | 'pending' }
type Worker = WorkerVisual & { result?: ToolState; received?: number; arrived?: number }
const clamp = (value: number, high: number) => Math.max(0, Math.min(high, value))

/** A sky sigil projects a column of light; the worker materializes at its ground impact. */
function teleportCircle(band: Canvas, center: number, age: number, color: number, accent: number): void {
  const ground = Math.min(19, band.h - 2)
  const sky = Math.max(0, ground - 19)
  const beamTop = sky + 5
  const reach = Math.max(0, Math.min(1, (age - 180) / 480))
  const fade = Math.max(0, Math.min(1, (SUMMON_MS - age) / 450))
  const tint = (x: number, y: number, light: number, opacity: number) => {
    if (x < 0 || x >= band.w || y < 0 || y >= band.h) return
    const index = y * band.w + x
    const base = band.px[index] < 0 ? 0x111111 : band.px[index] & 0xffffff
    let mixed = 0
    for (const shift of [16, 8, 0]) mixed |= Math.round(((base >> shift) & 255) * (1 - opacity) + ((light >> shift) & 255) * opacity) << shift
    band.px[index] = mixed
  }
  const bottom = beamTop + Math.floor((ground - beamTop) * reach)
  if (reach > 0) {
    for (let y = beamTop; y <= bottom; y++) {
      const half = 3 + Math.floor((y - beamTop) / 6)
      for (let x = -half; x <= half; x++) tint(center + x, y, Math.abs(x) === half ? accent : color, fade * (Math.abs(x) === half ? 0.8 : 0.24))
    }
    const fall = Math.floor(age / 65) % Math.max(1, ground - beamTop)
    if (beamTop + fall <= bottom) stamp(band, center - 1, beamTop + fall, ['.C.', 'CCC', '.C.'], { C: accent })
    if (reach === 1) {
      stamp(band, center - 6, ground - 1, ['..PPPPPPPP..', 'PP...CC...PP', '..PPPPPPPP..'], { P: color, C: accent })
      if (age < 950) stamp(band, center - 2, ground - 4, ['..C..', '..C..', 'CCCCC', '..C..'], { C: 0xfff4ba })
    }
  }
  // Two elliptical rings, a center rune, and rotating markers make the source
  // visibly horizontal in the sky, separate from the smaller ground footprint.
  stamp(band, center - 7, sky, ['.....PPPPP.....', '..PPP..C..PPP..', '.PP.C.....C.PP.', 'P.C...PPP...C.P', '.PP.C.....C.PP.', '..PPP..C..PPP..', '.....PPPPP.....'], { P: color, C: accent })
  const orbit = [[-6, 3], [-3, 0], [3, 0], [6, 3], [3, 6], [-3, 6]][Math.floor(age / 100) % 6]
  stamp(band, center + orbit[0], sky + orbit[1], ['CC'], { C: accent })
}

/** Stable task identities summon, visit a work zone and deliver observed results. */
export class WorkerSprites {
  private workers = new Map<string, Worker>()
  private tick = 0
  private width = 0
  clear(): void { this.workers.clear(); this.tick = 0; this.width = 0 }
  current(): WorkerVisual[] { return [...this.workers.values()].map(({ result, received, arrived, ...worker }) => ({ ...worker })) }
  results(): ToolState[] { return [...this.workers.values()].flatMap(worker => worker.result ? [{ ...worker.result }] : []) }
  draw(body: Body, band: Canvas, tasks: ToolState[], now: number, mainLeft: number, mainWidth: number, projectLeft: number): void {
    const dt = this.tick ? Math.max(0, Math.min(150, now - this.tick)) : 0
    this.tick = now
    const resized = this.width !== band.w
    this.width = band.w
    const ids = new Set(tasks.map(tool => tool.id))
    for (const [id, worker] of this.workers) {
      if (worker.received !== undefined && now - worker.received >= RESULT_MS || !ids.has(id) && !worker.result) this.workers.delete(id)
    }
    // Visual returns outlive protocol departures without inflating active counts.
    const capacity = Math.max(0, Math.min(6, Math.floor((band.w - 43) / SLOT)))
    const shown = [...tasks, ...this.results().filter(tool => !ids.has(tool.id))].slice(0, capacity)
    for (const worker of this.workers.values()) worker.visible = false
    const occupied: number[] = []
    const deliverySpots: number[] = []
    const free = (x: number) => x >= 0 && x + SLOT <= band.w && (x + SLOT <= mainLeft - 2 || x >= mainLeft + mainWidth + 2) && (x + SLOT <= projectLeft - 2 || x >= projectLeft + 8) && occupied.every(left => Math.abs(left - x) >= SLOT)
    const placements: Placement[] = []
    for (const tool of shown) {
      const previous = this.workers.get(tool.id)
      const anchor = stationAnchor(band.w, tool.mode)
      const candidates = Array.from({ length: Math.max(0, band.w - SLOT + 1) }, (_, x) => x).filter(free).sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor))
      const goal = previous && !resized && free(previous.goal) ? previous.goal : candidates[0] ?? clamp(mainLeft - SLOT - 2, band.w - SLOT)
      const onLeft = goal < mainLeft
      const siblings = occupied.filter(left => (left < mainLeft) === onLeft).length
      occupied.push(goal)
      // Parallel workers get separate circles instead of hiding in one portal.
      const origin = clamp((onLeft ? mainLeft - SLOT - 2 : mainLeft + mainWidth + 2) + (onLeft ? -1 : 1) * siblings * SLOT, band.w - SLOT)
      const worker: Worker = previous ?? { id: tool.id, x: origin, origin, goal, born: now, zone: workZone(tool.mode), portalColor: PORTAL_COLORS[tool.mode], visible: true, phase: 'summon' }
      worker.visible = true
      worker.zone = workZone(tool.mode)
      worker.goal = goal; worker.x = clamp(worker.x, band.w - SLOT); worker.origin = clamp(worker.origin, band.w - SLOT)
      const age = now - worker.born
      if (tool.doneAt !== undefined && !worker.result) { worker.result = { ...tool }; worker.received = now; worker.failed = tool.failed }
      // A completion can arrive before the first frame (short calls / fallback).
      // Finish materializing before returning with that already-recorded result.
      if (worker.result && (age >= SUMMON_MS || worker.result.cancelled)) {
        const stopped = worker.result.cancelled
        const beside = clamp(worker.x < mainLeft ? mainLeft - 9 : mainLeft + Math.min(mainWidth, 19) + 2, band.w - SLOT)
        const meeting = Array.from({ length: Math.max(0, band.w - SLOT + 1) }, (_, x) => x)
          .filter(x => (x + 8 <= mainLeft || x >= mainLeft + Math.min(mainWidth, 19) + 2) && deliverySpots.every(other => Math.abs(other - x) >= 12))
          .sort((a, b) => Math.abs(a - beside) - Math.abs(b - beside))[0] ?? beside
        deliverySpots.push(meeting)
        const resultAge = now - worker.received!
        if (!stopped && worker.arrived === undefined) {
          const speed = Math.max(0.045, Math.abs(meeting - worker.x) / Math.max(100, 4500 - resultAge))
          worker.x += Math.sign(meeting - worker.x) * Math.min(Math.abs(meeting - worker.x), dt * speed)
          if (Math.abs(worker.x - meeting) < 0.5) worker.arrived = now
        }
        const contact = worker.arrived === undefined ? -1 : now - worker.arrived
        const departing = stopped || resultAge >= RESULT_MS - 700 || contact >= 1700
        worker.phase = departing ? 'depart' : contact >= 0 ? worker.failed ? 'error' : 'handoff' : 'return'
        const fadeAt = worker.arrived === undefined ? RESULT_MS - 700 : Math.min(RESULT_MS - 700, worker.arrived - worker.received! + 1700)
        const scale = departing ? Math.max(0, 1 - (resultAge - (stopped ? 0 : fadeAt)) / 700) * (stopped ? Math.max(0, Math.min(1, (age - 650) / 450)) : 1) : 1
        placements.push({ x: worker.x, scale, lift: worker.phase === 'handoff' ? Math.abs(Math.sin(contact / 180)) * 3 : 0, travelling: worker.phase === 'return', dir: worker.x < mainLeft ? 1 : -1, mode: worker.phase === 'return' ? 'run' : stopped ? 'idle' : worker.failed ? 'error' : 'cheer' })
        this.workers.set(tool.id, worker)
        if (scale === 0 && !ids.has(tool.id)) this.workers.delete(tool.id)
        if (!stopped && scale > 0) {
          const x = Math.round(worker.x)
          if (worker.failed) {
            stamp(band, x + 7, 7, ['RRRRRRR', 'RWWWWWR', 'RW.R.WR', 'RW.R.WR', 'RWWWWWR', 'RRRRRRR', '...D...'], { R: 0xff8585, W: 0x242837, D: 0xb7885f })
          } else {
            stamp(band, x + (worker.x < mainLeft ? 6 : -3), 13, ['BBYBBB', 'B.Y..B', 'BBYBBB', 'B.Y..B', 'BBBBBB'], { B: 0xb7885f, Y: 0xffe28a })
            if (worker.phase === 'handoff') {
              const contactX = worker.x < mainLeft ? mainLeft - 2 : mainLeft + Math.min(mainWidth, 19)
              // Two raised paws meet, with a brief impact sparkle.
              stamp(band, Math.round(contactX), 11 + Math.floor(contact / 180) % 2, ['.CC.', 'CCBB', '.CB.'], { C: 0x97f2ff, B: 0x5aa9ff })
              stamp(band, Math.round(contactX) - 1, 7, ['.Y.', 'YYY', '.Y.'], { Y: 0xffe28a })
            }
          }
        }
        continue
      }
      if (age >= SUMMON_MS && !tool.awaitingResult) {
        worker.x += Math.sign(goal - worker.x) * Math.min(Math.abs(goal - worker.x), dt * Math.max(0.016, band.w / 12000))
      }
      const travelling = age >= SUMMON_MS && Math.abs(worker.x - goal) > 0.4 && !tool.awaitingResult
      worker.phase = tool.awaitingResult ? 'pending' : age < SUMMON_MS ? 'summon' : travelling ? 'travel' : 'work'
      this.workers.set(tool.id, worker)
      const entering = Math.max(0, Math.min(1, (age - 650) / 450))
      placements.push({ x: worker.x, scale: entering, lift: age < SUMMON_MS ? 0 : Math.abs(Math.sin(now / 350)) * 1, travelling, dir: goal < worker.x ? -1 : 1 })
      if (age < SUMMON_MS) {
        const center = Math.round(worker.origin + 3)
        // Preserve the work identity throughout the entrance. Status affects
        // runes/beam edges, not the portal's main hue.
        const color = worker.portalColor
        const glow = [16, 8, 0].reduce((value, shift) => value | Math.round(((color >> shift) & 255) * 0.45 + 255 * 0.55) << shift, 0)
        const accent = tool.awaitingResult || tool.cancelled ? 0xa1afc4 : tool.failed ? 0xff96ad : glow
        teleportCircle(band, center, age, color, accent)
      }
      if (tool.awaitingResult) stamp(band, Math.round(worker.x) + 2, 8, ['PPPPP', '.PPP.', '..P..', '.PPP.', 'PPPPP'], { P: 0xa1afc4 })
    }
    drawTaskMinis(body, band, shown, now, placements)
    for (const worker of this.workers.values()) if (worker.visible && worker.failed && worker.result && worker.phase !== 'summon' && worker.phase !== 'depart') {
      stamp(band, Math.round(worker.x) + 1, 16, ['DD..D', '.D.D.'], { D: 0x66534b })
    }
  }
}
