import { compose, stamp, type Body, type Canvas } from '../../plugins/pixel-pet/hooks/pixels'
import { TOOL_DEPARTURE_MS, visibleTools, type ToolState } from './protocol'

const SLOT = 18
export const SUMMON_MS = 1600
export const taskLabel = (mode: ToolState['mode']): string => ({ read: 'Read', search: 'Search', edit: 'Edit', bash: 'Run', web: 'Web', agent: 'Delegate' })[mode]

/** Only lifecycle events create workers; source-code mentions never do. */
export function taskMiniLayout(states: ToolState[], now: number, width: number, agentTrail: number) {
  const visible = visibleTools(states.filter(tool => tool.doneAt === undefined || now - tool.doneAt < TOOL_DEPARTURE_MS))
  const ordered = visible.sort((a, b) => Number(a.doneAt !== undefined) - Number(b.doneAt !== undefined) || a.since - b.since || a.id.localeCompare(b.id))
  // Reserve the main pet's widest prop, its agent trail, and the project mini.
  const capacity = Math.max(0, Math.min(6, Math.floor((width - 33 - agentTrail - 10) / SLOT)))
  const shown = ordered.slice(0, capacity)
  return { shown, overflow: Math.max(0, ordered.length - shown.length), width: shown.length * SLOT, all: ordered }
}

/** Half-sized shared pet poses and props: book, pencil, terminal, globe, etc. */
export function drawTaskMinis(body: Body, band: Canvas, tasks: ToolState[], now: number, positions?: { x: number; scale: number; lift: number; travelling: boolean }[]): void {
  tasks.forEach((tool, index) => {
    const elapsed = Math.max(0, now - (tool.doneAt ?? tool.since))
    const placement = positions?.[index]
    const mode = tool.awaitingResult ? 'idle' : tool.doneAt === undefined ? placement?.travelling ? 'run' : tool.mode : tool.cancelled ? 'idle' : tool.failed ? 'error' : 'cheer'
    const picture = compose(body, mode, elapsed, 1)
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

type WorkerVisual = { id: string; x: number; goal: number; origin: number; born: number; phase: 'summon' | 'travel' | 'work' | 'depart' | 'pending' }
const clamp = (value: number, high: number) => Math.max(0, Math.min(high, value))

/** A sky sigil projects a column of light; the worker materializes at its ground impact. */
function teleportCircle(band: Canvas, center: number, age: number, color: number): void {
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
      for (let x = -half; x <= half; x++) tint(center + x, y, Math.abs(x) === half ? 0x97f2ff : color, fade * (Math.abs(x) === half ? 0.8 : 0.24))
    }
    const fall = Math.floor(age / 65) % Math.max(1, ground - beamTop)
    if (beamTop + fall <= bottom) stamp(band, center - 1, beamTop + fall, ['.C.', 'CCC', '.C.'], { C: 0xddd2ff })
    if (reach === 1) {
      stamp(band, center - 6, ground - 1, ['..PPPPPPPP..', 'PP...CC...PP', '..PPPPPPPP..'], { P: color, C: 0x97f2ff })
      if (age < 950) stamp(band, center - 2, ground - 4, ['..C..', '..C..', 'CCCCC', '..C..'], { C: 0xfff4ba })
    }
  }
  // Two elliptical rings, a center rune, and rotating markers make the source
  // visibly horizontal in the sky, separate from the smaller ground footprint.
  stamp(band, center - 7, sky, ['.....PPPPP.....', '..PPP..C..PPP..', '.PP.C.....C.PP.', 'P.C...PPP...C.P', '.PP.C.....C.PP.', '..PPP..C..PPP..', '.....PPPPP.....'], { P: color, C: 0x97f2ff })
  const orbit = [[-6, 3], [-3, 0], [3, 0], [6, 3], [3, 6], [-3, 6]][Math.floor(age / 100) % 6]
  stamp(band, center + orbit[0], sky + orbit[1], ['CC'], { C: 0x97f2ff })
}

/** Stable task identities summon beside the main pet, then walk into nearby free spots. */
export class WorkerSprites {
  private workers = new Map<string, WorkerVisual>()
  private tick = 0
  clear(): void { this.workers.clear(); this.tick = 0 }
  current(): WorkerVisual[] { return [...this.workers.values()].map(worker => ({ ...worker })) }
  draw(body: Body, band: Canvas, tasks: ToolState[], now: number, mainLeft: number, mainWidth: number, projectLeft: number): void {
    const dt = this.tick ? Math.max(0, Math.min(150, now - this.tick)) : 0
    this.tick = now
    const ids = new Set(tasks.map(tool => tool.id))
    for (const id of this.workers.keys()) if (!ids.has(id)) this.workers.delete(id)
    const occupied: number[] = []
    const free = (x: number) => x >= 0 && x + SLOT <= band.w && (x + SLOT <= mainLeft - 2 || x >= mainLeft + mainWidth + 2) && (x + SLOT <= projectLeft - 2 || x >= projectLeft + 8) && occupied.every(left => Math.abs(left - x) >= SLOT)
    const placements: { x: number; scale: number; lift: number; travelling: boolean }[] = []
    for (const tool of tasks) {
      const previous = this.workers.get(tool.id)
      const candidates = Array.from({ length: Math.max(0, band.w - SLOT + 1) }, (_, x) => x).filter(free).sort((a, b) => Math.abs(a + SLOT / 2 - mainLeft - mainWidth / 2) - Math.abs(b + SLOT / 2 - mainLeft - mainWidth / 2))
      const goal = previous && free(previous.goal) ? previous.goal : candidates[0] ?? clamp(mainLeft - SLOT - 2, band.w - SLOT)
      const onLeft = goal < mainLeft
      const siblings = occupied.filter(left => (left < mainLeft) === onLeft).length
      occupied.push(goal)
      // Parallel workers get separate circles instead of hiding in one portal.
      const origin = clamp((onLeft ? mainLeft - SLOT - 2 : mainLeft + mainWidth + 2) + (onLeft ? -1 : 1) * siblings * SLOT, band.w - SLOT)
      const worker = previous ?? { id: tool.id, x: origin, origin, goal, born: now, phase: 'summon' }
      worker.goal = goal; worker.x = clamp(worker.x, band.w - SLOT); worker.origin = clamp(worker.origin, band.w - SLOT)
      const age = now - worker.born
      const departed = tool.doneAt === undefined ? 0 : now - tool.doneAt
      if (age >= SUMMON_MS && tool.doneAt === undefined && !tool.awaitingResult) {
        worker.x += Math.sign(goal - worker.x) * Math.min(Math.abs(goal - worker.x), dt * 0.016)
      }
      const travelling = age >= SUMMON_MS && Math.abs(worker.x - goal) > 0.4 && tool.doneAt === undefined && !tool.awaitingResult
      worker.phase = tool.awaitingResult ? 'pending' : tool.doneAt !== undefined ? 'depart' : age < SUMMON_MS ? 'summon' : travelling ? 'travel' : 'work'
      this.workers.set(tool.id, worker)
      const entering = Math.max(0, Math.min(1, (age - 650) / 450))
      const leaving = tool.doneAt === undefined ? 1 : Math.max(0, Math.min(1, (TOOL_DEPARTURE_MS - departed) / 700))
      placements.push({ x: worker.x, scale: entering * leaving, lift: age < SUMMON_MS ? 0 : Math.abs(Math.sin(now / 350)) * 1, travelling })
      if (age < SUMMON_MS || tool.doneAt !== undefined && departed > TOOL_DEPARTURE_MS - 700) {
        const center = Math.round((age < SUMMON_MS ? worker.origin : worker.x) + 3)
        const color = tool.awaitingResult || tool.cancelled ? 0xa1afc4 : tool.failed ? 0xff96ad : 0xc39bff
        const portalAge = age < SUMMON_MS ? age : (TOOL_DEPARTURE_MS - departed) / 700 * SUMMON_MS
        teleportCircle(band, center, portalAge, color)
      }
      if (tool.awaitingResult) stamp(band, Math.round(worker.x) + 2, 8, ['PPPPP', '.PPP.', '..P..', '.PPP.', 'PPPPP'], { P: 0xa1afc4 })
    }
    drawTaskMinis(body, band, tasks, now, placements)
  }
}
