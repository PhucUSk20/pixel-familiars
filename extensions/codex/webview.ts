import { animate, readTheme } from '../../plugins/pixel-pet/hooks/theme'
import { compose, canvas, trailWidth, MAX_MINIS, type Body, type Canvas } from '../../plugins/pixel-pet/hooks/pixels'
import { step, fail, leapClipMs, type Activity } from '../../plugins/pixel-pet/hooks/anim'
import { drawBand, layScene, obstacleSpans } from '../../plugins/pixel-pet/hooks/scene'
import { statusLine, lineColor } from '../../plugins/pixel-pet/hooks/status'
import { readSettings } from '../../plugins/pixel-pet/hooks/settings'
import { minisOnScreen } from '../../plugins/pixel-pet/hooks/minis'
import { hudRows, frameColor } from '../../plugins/pixel-pet/hooks/hud'
import type { Anim, Mode } from '../../plugins/pixel-pet/types'
import { emptySnapshot, object, type Preferences, type Snapshot } from './protocol'

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

for (const [id, type] of [['session', 'session'], ['theme', 'theme'], ['demo', 'demo'], ['preview', 'preview']]) {
  document.getElementById(id)!.addEventListener('click', () => vscode.postMessage({ type }))
}
window.addEventListener('message', (event: MessageEvent) => {
  const message = object(event.data)
  if (message.type === 'theme') {
    const theme = readTheme(message.theme)
    if (!theme.errors) body = animate(theme.theme)
  }
  if (message.type === 'activity') {
    snapshot = message.snapshot as Snapshot
    if (snapshot.sessionId !== sessionId) {
      sessionId = snapshot.sessionId
      animation = { mode: 'idle', since: Date.now(), x: 0, dir: 1, tick: 0, target: '', working: false }
      lastError = snapshot.errorAt
    }
    if (Boolean(message.demo) !== demo) demoSince = Date.now()
    demo = Boolean(message.demo)
    connection.textContent = demo ? 'Demo · simulated activity and usage' : String(message.connection ?? '')
    document.getElementById('demo')!.textContent = demo ? 'Stop demo' : 'Demo'
  }
  if (message.preferences) preferences = message.preferences as Preferences
})

function paint(picture: Canvas): void {
  const scale = Math.max(1, Math.min(5, Math.floor(stage.clientWidth / picture.w), Math.floor(120 / picture.h)))
  stage.width = Math.max(1, Math.floor(stage.clientWidth))
  stage.height = 130
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
}

function drawHud(data: Snapshot, now: number): void {
  const look = body?.look.hud
  const key = JSON.stringify([preferences.hud, data.usage, look, Math.floor(now / 60_000)])
  if (key === lastHud) return
  lastHud = key
  hud.replaceChildren()
  if (!preferences.hud) return
  hud.style.borderColor = frameColor(look ?? {})
  const minutes = (reset: number | undefined) => reset === undefined ? undefined : Math.max(0, Math.round((reset * 1000 - now) / 60000))
  const rows = hudRows({ hp: data.usage.hp ?? 100, mp: data.usage.mp, st: data.usage.st, mpResetsInMin: minutes(data.usage.mpReset), stResetsInMin: minutes(data.usage.stReset) }, look).filter(row => row.key !== 'hp' || data.usage.hp !== undefined)
  for (const bar of rows) {
    const row = document.createElement('div'); row.className = 'bar'
    const label = document.createElement('label'); label.textContent = bar.label; label.style.color = bar.color
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
      const reading = document.createElement('span'); reading.textContent = part.text; reading.style.color = part.color; reading.style.fontWeight = part.bold ? 'bold' : 'normal'; row.append(reading)
    }
    hud.append(row)
  }
  for (const name of ['hp', 'mp', 'st'] as const) {
    if (data.usage[name] !== undefined || look?.[name] === false) continue
    const appearance = look?.[name]
    const row = document.createElement('div'); row.className = 'bar'
    const label = document.createElement('label'); label.textContent = appearance ? appearance.label ?? name.toUpperCase() : name.toUpperCase()
    const reading = document.createElement('span'); reading.textContent = '—'; reading.setAttribute('aria-label', 'unavailable')
    row.append(label, reading); hud.append(row)
  }
}

function simulated(now: number): Snapshot {
  const modes: Mode[] = ['think', 'read', 'search', 'edit', 'bash', 'web', 'agent', 'error', 'cheer', 'idle']
  const index = Math.floor((now - demoSince) / 3000) % modes.length
  const mode = modes[index]
  return { ...emptySnapshot(), working: index < 8, tools: index > 0 && index < 7 ? 1 : 0, mode: mode === 'error' || mode === 'cheer' || mode === 'idle' || mode === 'think' ? 'bash' : mode as Snapshot['mode'], target: 'demo.ts', lastToolAt: now - 5000, errorAt: mode === 'error' ? demoSince + index * 3000 : 0, agents: mode === 'agent' ? ['demo-mini'] : [], usage: { hp: 72, mp: 81, st: 93 } }
}

setInterval(() => {
  if (!body || document.hidden) return
  const now = Date.now()
  const data = demo ? simulated(now) : snapshot
  const settings = readSettings({ ...preferences, speed: preferences.speed, sleepAfter: preferences.sleepAfter })
  const width = Math.max(48, Math.min(200, Math.floor(stage.clientWidth / 4)))
  const layout = body.scene ? layScene(body.scene, width) : undefined
  const minis = preferences.minis === false ? [] : data.agentStates ? minisOnScreen(data.agentStates, now) : data.agents.map(() => ({ age: now - animation.since }))
  const newAgent = data.agentStates?.some(a => !a.doneAt && now - a.since < 1500) ?? false
  const trail = trailWidth(minis.length)
  const activity: Activity = { isWorking: data.working, activeTools: data.tools || (newAgent ? 1 : 0), activeMode: data.tools ? data.mode : newAgent ? 'agent' : data.mode, activeTarget: preferences.targets ? data.target : '', lastToolAt: data.lastToolAt, room: Math.max(0, width - 40 - trail), obstacles: layout ? obstacleSpans(layout) : [], trail }
  animation = step(animation, activity, now, settings)
  if (data.errorAt && data.errorAt !== lastError) { animation = fail(animation, now); lastError = data.errorAt }
  const elapsed = now - animation.since
  const mode = animation.leap ? 'jump' : animation.mode
  const ms = animation.leap ? leapClipMs((now - animation.leap.since) * settings.pace) : elapsed * settings.pace
  const mood = data.usage.hp !== undefined && data.usage.hp <= 25 ? 'critical' : data.usage.hp !== undefined && data.usage.hp <= 50 ? 'worried' : [data.usage.mp, data.usage.st].some(v => v !== undefined && v < 20) ? 'tired' : 'ok'
  const picture = compose(body, mode, ms, animation.dir, mood, minis)
  let band: Canvas
  if (body.scene && layout) band = drawBand(body, body.scene, layout, picture, Math.round(animation.x), now)
  else {
    band = canvas(width, picture.h)
    // Copy numeric pixels without turning theme data into markup.
    const left = Math.min(Math.round(animation.x), Math.max(0, width - picture.w))
    for (let y = 0; y < picture.h; y++) for (let x = 0; x < picture.w; x++) if (x + left < width) band.px[y * width + x + left] = picture.px[y * picture.w + x]
  }
  paint(band)
  stage.setAttribute('aria-label', `${body.name}, ${animation.mode}`)
  document.getElementById('activity')!.textContent = `${data.tools} tool${data.tools === 1 ? '' : 's'} · ${data.agents.length} agent${data.agents.length === 1 ? '' : 's'}`
  const extra = minis.length > MAX_MINIS ? ` (+${minis.length - MAX_MINIS} minis)` : ''
  status.textContent = preferences.statusLine === false ? '' : data.awaitingApproval ? 'Waiting for your approval' : data.compacting ? 'Compacting context…' : statusLine(animation.mode, animation.since, elapsed, preferences.targets ? animation.target : '', body.look.lines[animation.mode]) + extra
  status.style.color = lineColor(animation.mode, body.look.lineColors)
  drawHud(data, now)
}, 100)
vscode.postMessage({ type: 'ready' })
