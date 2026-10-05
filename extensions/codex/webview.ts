import { animate, readTheme } from '../../plugins/pixel-pet/hooks/theme'
import { compose, canvas, BODY_W, HEIGHT, type Body, type Canvas } from '../../plugins/pixel-pet/hooks/pixels'
import { step, fail, leapClipMs, type Activity } from '../../plugins/pixel-pet/hooks/anim'
import { drawBand, layScene, obstacleSpans, GROUND_H } from '../../plugins/pixel-pet/hooks/scene'
import { statusLine, lineColor } from '../../plugins/pixel-pet/hooks/status'
import { readSettings } from '../../plugins/pixel-pet/hooks/settings'
import { hudRows, frameColor } from '../../plugins/pixel-pet/hooks/hud'
import type { Anim, Mode } from '../../plugins/pixel-pet/types'
import { emptySnapshot, object, TOOL_DEPARTURE_MS, type Preferences, type Snapshot } from './protocol'
import { taskMiniLayout, WorkerSprites, workerLabel, observedMinis } from './task-minis'
import { compactionBath } from './compaction'
import { MiniPet } from './mini-pet'
import { interactionMain } from './interactions'
import type { ProjectState } from './project-state'

declare function acquireVsCodeApi(): { postMessage(message: unknown): void }
const vscode = acquireVsCodeApi()
const stage = document.getElementById('stage') as HTMLCanvasElement
const context = stage.getContext('2d')!
const status = document.getElementById('status')!
const connection = document.getElementById('connection')!
const hud = document.getElementById('hud')!
let body: Body | undefined
let snapshot = emptySnapshot()
let preferences: Preferences = { speed: 'normal', sleepAfter: 60, hud: true, targets: false }
let animation: Anim = { mode: 'idle', since: Date.now(), x: 0, dir: 1, tick: 0, target: '', working: false }
let demo = false
let demoSince = Date.now()
let lastError = 0
let sessionId: string | undefined
let lastHud = ''
let compactSince = 0
let lastTasks = ''
const workerSprites = new WorkerSprites()
const miniPet = new MiniPet(() => vscode.postMessage({ type: 'projectInspect' }))
let displayedTasks: Snapshot['toolStates'] = []
const signs = new Map<string, HTMLButtonElement>()
function inspectTask(id: string): void {
  const tool = displayedTasks?.find(tool => tool.id === id)
  if (!tool) return
  const card = document.getElementById('worker-result')!
  card.hidden = false
  document.getElementById('worker-result-title')!.textContent = `${workerLabel(tool)} · ${tool.cancelled ? 'Stopped' : tool.failed ? 'Failed' : 'Finished'}`
  document.getElementById('worker-result-text')!.textContent = `${Math.max(0, Math.round(((tool.doneAt ?? Date.now()) - tool.since) / 1000))}s${preferences.targets && tool.target ? ' · ' + tool.target : ''}`
  card.scrollIntoView({ block: 'nearest' })
}
document.getElementById('worker-result-close')!.addEventListener('click', () => { document.getElementById('worker-result')!.hidden = true })
document.getElementById('worker-result-problems')!.addEventListener('click', () => vscode.postMessage({ type: 'projectInspect' }))
document.getElementById('mini-review')!.addEventListener('click', () => vscode.postMessage({ type: 'projectInspect' }))

for (const [id, type] of [['session', 'session'], ['theme', 'theme'], ['pet', 'pet'], ['scene', 'scene'], ['reset', 'reset'], ['demo', 'demo'], ['preview', 'preview']]) {
  document.getElementById(id)!.addEventListener('click', () => vscode.postMessage({ type }))
}
window.addEventListener('message', (event: MessageEvent) => {
  const message = object(event.data)
  if (message.type === 'project') miniPet.project(message.state as ProjectState)
  if (message.type === 'theme') {
    const theme = readTheme(message.theme)
    if (!theme.errors) {
      body = animate(theme.theme)
      animation = { mode: 'idle', since: Date.now(), x: 0, dir: 1, tick: 0, target: '', working: snapshot.working }
    }
  }
  if (message.type === 'activity') {
    if (object(message.snapshot).compacting && !snapshot.compacting) compactSince = Date.now()
    snapshot = message.snapshot as Snapshot
    if (snapshot.sessionId !== sessionId) {
      workerSprites.clear()
      document.getElementById('worker-result')!.hidden = true
      sessionId = snapshot.sessionId
      animation = { mode: 'idle', since: Date.now(), x: 0, dir: 1, tick: 0, target: '', working: false }
      lastError = snapshot.errorAt
    }
    if (Boolean(message.demo) !== demo) demoSince = Date.now()
    demo = Boolean(message.demo)
    connection.textContent = demo ? 'Demo · simulated activity and usage' : String(message.connection ?? '')
    connection.title = connection.textContent ?? ''
    document.getElementById('demo')!.textContent = demo ? 'Stop demo' : 'Demo'
  }
  if (message.preferences) {
    const previouslyShownTargets = preferences.targets
    preferences = message.preferences as Preferences
    if (previouslyShownTargets && !preferences.targets) document.getElementById('worker-result')!.hidden = true
    if (preferences.minis === false) workerSprites.clear()
  }
})

function sceneScale(rows: number): number {
  return Math.max(1, Math.min(4, Math.floor(stage.clientWidth / 48), Math.floor((stage.clientHeight - 8) / rows)))
}

function paint(picture: Canvas): void {
  const height = Math.max(1, Math.round(stage.clientHeight))
  const scale = sceneScale(picture.h)
  stage.width = Math.max(1, Math.floor(stage.clientWidth))
  stage.height = height
  const top = Math.max(0, stage.height - picture.h * scale - 8)
  context.clearRect(0, 0, stage.width, stage.height)
  for (let y = 0; y < picture.h; y++) {
    for (let x = 0; x < picture.w; x++) {
      const color = picture.px[y * picture.w + x]
      if (color < 0) continue
      context.fillStyle = '#' + (color & 0xffffff).toString(16).padStart(6, '0')
      context.fillRect(x * scale, top + y * scale, scale, scale)
    }
  }
  miniPet.place(scale, top)
  const failures = workerSprites.current().filter(worker => worker.visible && worker.failed && worker.phase !== 'summon' && worker.phase !== 'depart')
  const ids = new Set(failures.map(worker => worker.id))
  for (const [id, button] of signs) if (!ids.has(id)) { button.remove(); signs.delete(id) }
  for (const worker of failures) {
    let button = signs.get(worker.id)
    if (!button) {
      button = document.createElement('button'); button.className = 'worker-error'; button.title = 'Failed task: inspect observed result'; button.setAttribute('aria-label', 'Inspect failed task')
      const id = worker.id; button.addEventListener('click', () => inspectTask(id))
      document.getElementById('scene-stage')!.append(button); signs.set(id, button)
    }
    button.style.left = `${(worker.x + 7) * scale}px`; button.style.top = `${top + 7 * scale}px`
    button.style.width = `${7 * scale}px`; button.style.height = `${7 * scale}px`
  }
}

function drawHud(data: Snapshot, now: number): void {
  const look = body?.look.hud
  const key = JSON.stringify([preferences.hud, data.usage, look, Math.floor(now / 60_000)])
  if (key === lastHud) return
  lastHud = key
  hud.replaceChildren()
  hud.hidden = !preferences.hud
  document.getElementById('overview')!.classList.toggle('without-hud', !preferences.hud)
  if (!preferences.hud) return
  hud.style.borderColor = frameColor(look ?? {})
  const minutes = (reset: number | undefined) => reset === undefined ? undefined : Math.max(0, Math.round((reset * 1000 - now) / 60000))
  const rows = hudRows({ hp: data.usage.hp ?? 100, mp: data.usage.mp, st: data.usage.st, mpResetsInMin: minutes(data.usage.mpReset), stResetsInMin: minutes(data.usage.stReset) }, look).filter(row => row.key !== 'hp' || data.usage.hp !== undefined)
  for (const bar of rows) {
    const row = document.createElement('div'); row.className = 'bar'
    row.dataset.key = bar.key
    const label = document.createElement('label'); label.textContent = bar.label; label.style.color = bar.color
    label.title = bar.key === 'hp' ? 'Context space remaining in this conversation' : bar.key === 'mp' ? 'Usage quota remaining in the 5-hour window' : 'Usage quota remaining in the 7-day window'
    row.title = `${label.title}: ${bar.parts.map(part => part.text).join('').trim()}`
    row.setAttribute('role', 'group'); row.setAttribute('aria-label', `${bar.label.trim()}: ${row.title}`)
    const meter = document.createElement('canvas'); meter.width = 120; meter.height = 12
    meter.setAttribute('role', 'img'); meter.setAttribute('aria-label', `${bar.label.trim()}: ${bar.parts.map(part => part.text).join('')}`)
    const ctx = meter.getContext('2d')!
    const binary = atob(bar.cells)
    const words = new DataView(Uint8Array.from(binary, ch => ch.charCodeAt(0)).buffer)
    for (let x = 0; x < 20; x++) for (const [offset, y] of [[4, 0], [8, 6]]) {
      ctx.fillStyle = '#' + words.getUint32(x * 12 + offset, true).toString(16).padStart(6, '0')
      ctx.fillRect(x * 6, y, 6, 6)
    }
    row.append(label, meter)
    for (const part of bar.parts) {
      const reading = document.createElement('span'); reading.className = part.bold ? 'hud-value' : 'hud-detail'; reading.textContent = part.text; reading.style.color = part.color; reading.style.fontWeight = part.bold ? 'bold' : 'normal'; row.append(reading)
    }
    hud.append(row)
  }
  for (const name of ['hp', 'mp', 'st'] as const) {
    if (data.usage[name] !== undefined || look?.[name] === false) continue
    const appearance = look?.[name]
    const row = document.createElement('div'); row.className = 'bar'
    row.dataset.key = name
    const label = document.createElement('label'); label.textContent = appearance ? appearance.label ?? name.toUpperCase() : name.toUpperCase()
    const reading = document.createElement('span'); reading.className = 'hud-value'; reading.textContent = '—'; reading.setAttribute('aria-label', 'unavailable')
    row.append(label, reading); hud.append(row)
  }
  hud.hidden = hud.childElementCount === 0
  document.getElementById('overview')!.classList.toggle('without-hud', hud.hidden)
}

function simulated(now: number): Snapshot {
  const modes: Mode[] = ['think', 'read', 'search', 'edit', 'bash', 'web', 'agent', 'error', 'cheer', 'idle']
  const index = Math.floor((now - demoSince) / 3000) % modes.length
  const mode = modes[index]
  const toolMode = mode === 'error' || mode === 'cheer' || mode === 'idle' || mode === 'think' ? 'bash' : mode as Snapshot['mode']
  const tools = index > 0 && index < 7 ? 1 : 0
  return { ...emptySnapshot(), working: index < 8, tools, toolStates: tools ? [{ id: 'demo-call', mode: toolMode, target: 'demo.ts', since: demoSince + index * 3000, source: 'call' }] : [], mode: toolMode, target: 'demo.ts', lastToolAt: now - 5000, errorAt: mode === 'error' ? demoSince + index * 3000 : 0, agents: mode === 'agent' ? ['demo-mini'] : [], usage: { hp: 72, mp: 81, st: 93 } }
}

setInterval(() => {
  if (!body || document.hidden) return
  const now = Date.now()
  const data = demo ? simulated(now) : snapshot
  const settings = readSettings({ ...preferences, speed: preferences.speed, sleepAfter: preferences.sleepAfter })
  const width = Math.max(48, Math.ceil(stage.clientWidth / sceneScale(HEIGHT + (body.scene ? GROUND_H : 0))))
  const layout = body.scene ? layScene(body.scene, width) : undefined
  const newAgent = data.agentStates?.some(a => !a.doneAt && now - a.since < 1500) ?? false
  // Fast tools can start and finish between observer polls. Briefly retain the
  // last observed prop, while the counter continues to show actual active calls.
  const recentTool = data.lastToolAt > 0 && now >= data.lastToolAt && now - data.lastToolAt < TOOL_DEPARTURE_MS
  const trail = 0
  const workers = taskMiniLayout(preferences.minis === false ? [] : observedMinis(data, now), now, width, trail)
  const activity: Activity = { isWorking: data.working || recentTool, activeTools: data.tools || (recentTool || newAgent ? 1 : 0), activeMode: data.tools || recentTool ? data.mode : newAgent ? 'agent' : data.mode, activeTarget: preferences.targets ? data.target : '', lastToolAt: data.lastToolAt, room: Math.max(0, width - BODY_W - trail), obstacles: layout ? obstacleSpans(layout) : [], trail }
  if (!data.compacting) animation = step(animation, activity, now, settings)
  if (data.errorAt && data.errorAt !== lastError) { animation = fail(animation, now); lastError = data.errorAt }
  const elapsed = now - animation.since
  const naturalWidth = compose(body, animation.mode, 0, animation.dir, 'ok').w
  const naturalLeft = Math.max(0, Math.min(Math.round(animation.x), width - naturalWidth))
  const social = miniPet.prepare(width, naturalLeft, naturalWidth, now, !data.working && !data.tools && !recentTool && !data.awaitingApproval && !data.compacting && !workers.all.length && !workerSprites.current().length && animation.mode !== 'error' && !animation.leap && (animation.mode === 'idle' || animation.mode === 'sleep'))
  if (social) { animation.x = social.main.x; animation.dir = social.main.dir }
  const newestResults = new Set(workerSprites.results().filter(tool => (tool.doneAt ?? 0) >= data.lastToolAt).map(tool => tool.id))
  const delivered = workerSprites.current().some(worker => worker.visible && worker.phase === 'handoff' && (!recentTool || newestResults.has(worker.id)))
  const mode = data.compacting ? 'sleep' : social ? social.main.mode : delivered && !data.working && !data.tools && !data.awaitingApproval ? 'cheer' : animation.leap ? 'jump' : animation.mode === 'sleep' && miniPet.keepsCompany ? 'idle' : animation.mode
  const ms = animation.leap ? leapClipMs((now - animation.leap.since) * settings.pace) : elapsed * settings.pace
  const mood = data.usage.hp !== undefined && data.usage.hp <= 25 ? 'critical' : data.usage.hp !== undefined && data.usage.hp <= 50 ? 'worried' : [data.usage.mp, data.usage.st].some(v => v !== undefined && v < 20) ? 'tired' : 'ok'
  const posed = social ? interactionMain(body, social) : compose(body, mode, ms, animation.dir, mood)
  const picture = data.compacting ? compactionBath(posed, animation.dir, now - compactSince) : posed
  const left = social ? Math.round(social.main.x) : Math.max(0, Math.min(Math.round(animation.x), width - picture.w))
  let band: Canvas
  // Work buildings are temporarily disabled; retain the ordinary meadow.
  stage.dataset.workZones = '[]'
  stage.title = ''
  if (body.scene && layout) band = drawBand(body, body.scene, layout, picture, left, now)
  else {
    band = canvas(width, picture.h)
    // Copy numeric pixels without turning theme data into markup.
    for (let y = 0; y < picture.h; y++) for (let x = 0; x < picture.w; x++) if (x + left < width) band.px[y * width + x + left] = picture.px[y * picture.w + x]
  }
  workerSprites.draw(body, band, workers.shown, now, left, picture.w, miniPet.left)
  miniPet.draw(body, band, left, picture.w, now)
  paint(band)
  stage.setAttribute('aria-label', `${body.name}, ${data.compacting ? 'compacting' : mode}`)
  stage.dataset.scene = body.scene ? 'on' : 'off'
  stage.dataset.taskMinis = String(workers.shown.length)
  stage.dataset.agentTrail = '0'
  stage.dataset.taskOverflow = String(workers.overflow)
  stage.dataset.interaction = social?.kind ?? ''
  stage.dataset.habitat = social?.phase ?? 'paused'
  stage.dataset.mainX = String(left)
  stage.dataset.workers = JSON.stringify(workerSprites.current())
  const taskIds = new Set(workers.all.map(tool => tool.id))
  displayedTasks = [...workers.all, ...workerSprites.results().filter(tool => !taskIds.has(tool.id))]
  const tasksKey = JSON.stringify(displayedTasks.map(tool => [tool.id, tool.mode, tool.doneAt, tool.failed, tool.cancelled, tool.awaitingResult, preferences.targets ? tool.target : '']))
  if (tasksKey !== lastTasks) {
    lastTasks = tasksKey
    const list = document.getElementById('task-minis')!
    list.replaceChildren()
    for (const tool of displayedTasks) {
      const badge = document.createElement(tool.doneAt !== undefined ? 'button' : 'span')
      if (tool.doneAt !== undefined) badge.addEventListener('click', () => inspectTask(tool.id))
      badge.className = 'task-badge'
      badge.dataset.mode = tool.mode
      badge.dataset.state = tool.awaitingResult ? 'awaiting result' : tool.doneAt === undefined ? 'running' : tool.cancelled ? 'stopped' : tool.failed ? 'failed' : 'finished'
      badge.textContent = `${workerLabel(tool)} · ${badge.dataset.state}${preferences.targets && tool.target ? ': ' + tool.target : ''}`
      list.append(badge)
    }
  }
  document.getElementById('activity')!.textContent = `${data.tools} active tool${data.tools === 1 ? '' : 's'} · ${data.agents.length} active agent${data.agents.length === 1 ? '' : 's'}`
  const extra = workers.overflow ? ` (+${workers.overflow} worker minis)` : ''
  const pending = workers.all.filter(tool => tool.awaitingResult).length
  status.textContent = preferences.statusLine === false ? '' : data.awaitingApproval ? 'Waiting for your approval' : data.compacting ? 'Compacting context…' : pending && !data.tools ? `Awaiting result from ${pending} background process${pending === 1 ? '' : 'es'}` : social ? social.text : statusLine(mode, animation.since, elapsed, preferences.targets ? animation.target : '', body.look.lines[mode]) + extra
  status.style.color = lineColor(animation.mode, body.look.lineColors)
  status.title = status.textContent ?? ''
  drawHud(data, now)
}, 100)
vscode.postMessage({ type: 'ready' })
