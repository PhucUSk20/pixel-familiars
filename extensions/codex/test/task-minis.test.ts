import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { animate, readTheme } from '../../../plugins/pixel-pet/hooks/theme'
import { canvas } from '../../../plugins/pixel-pet/hooks/pixels'
import { SessionReducer, emptySnapshot, combineActivity, TOOL_DEPARTURE_MS, type ToolState } from '../protocol'
import { sanitizeHook } from '../bridge'
import { taskMiniLayout, drawTaskMinis, WorkerSprites, SUMMON_MS, RESULT_MS, drawWorkZones, layoutWorkZones, observedMinis, PORTAL_COLORS } from '../task-minis'
import { layWorkScene } from '../work-zones'
import { bundledTheme } from '../scene-theme'
import { layScene } from '../../../plugins/pixel-pet/hooks/scene'

const now = Date.now()

test('subagents use stable portal workers alongside tools without an implicit agent trail', () => {
  const data = { ...emptySnapshot(), agents: ['sub'], agentStates: [{ id: 'sub', since: now }], toolStates: [{ id: 'read', mode: 'read' as const, target: '', since: now, source: 'call' as const }] }
  const parsed = readTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8')))
  assert.equal(parsed.errors, undefined)
  const body = animate(parsed.theme)
  const sprites = new WorkerSprites()
  const first = canvas(200, 22)
  sprites.draw(body, first, observedMinis(data, now), now, 100, 19, 0)
  assert.deepEqual(sprites.current().map(worker => worker.id).sort(), ['agent:sub', 'read'])
  assert.ok(sprites.current().every(worker => worker.phase === 'summon'))
  assert.ok(first.px.slice(0, 7 * first.w).includes(0xc39bff))
  assert.ok(first.px.slice(8 * first.w).every(pixel => pixel < 0), 'neither kind of mini appears before the light lands')
  sprites.draw(body, canvas(200, 22), observedMinis(data, now + 100), now + 100, 100, 19, 0)
  assert.equal(sprites.current().length, 2, 'repeated snapshots never create a second subagent mini')
  assert.deepEqual(observedMinis({ ...emptySnapshot(), agents: ['legacy'] }, now).map(tool => tool.id), ['agent:legacy'])
  assert.equal(observedMinis({ ...emptySnapshot(), agents: ['old'], agentStates: [] }, now).length, 0, 'lifecycle records take precedence over stale agent names')
  const wrapped = { ...data, toolStates: [{ ...data.toolStates[0], wrapper: true }] }
  assert.equal(taskMiniLayout(observedMinis(wrapped, now), now, 200, 0).all.length, 2, 'a subagent cannot suppress an unrelated fallback wrapper worker')
})

test('completion-only tools and agents materialize through a portal before delivering results', () => {
  const parsed = readTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8')))
  assert.equal(parsed.errors, undefined)
  const body = animate(parsed.theme)
  const sprites = new WorkerSprites()
  const data = { ...emptySnapshot(), agentStates: [{ id: 'ended', since: now - 1000, doneAt: now, failed: true }], toolStates: [{ id: 'fast', mode: 'edit' as const, target: '', since: now, doneAt: now, source: 'item' as const }] }
  const opening = canvas(200, 22)
  sprites.draw(body, opening, observedMinis(data, now), now, 100, 19, 0)
  assert.ok(sprites.current().every(worker => worker.phase === 'summon'))
  assert.ok(opening.px.slice(0, 7 * opening.w).includes(0xc39bff))
  assert.ok(opening.px.slice(8 * opening.w).every(pixel => pixel < 0), 'already-completed workers cannot pop directly into view')
  assert.equal(sprites.results().length, 2, 'completion is retained during the entrance')
  for (let age = 100; age < SUMMON_MS; age += 100) {
    sprites.draw(body, canvas(200, 22), [], now + age, 100, 19, 0)
    assert.ok(sprites.current().every(worker => worker.phase === 'summon'))
  }
  sprites.draw(body, canvas(200, 22), [], now + SUMMON_MS, 100, 19, 0)
  assert.ok(sprites.current().every(worker => worker.phase !== 'summon'))
  for (let age = SUMMON_MS + 100; age <= RESULT_MS; age += 100) sprites.draw(body, canvas(200, 22), [], now + age, 100, 19, 0)
  assert.equal(sprites.current().length, 0)
})

test('work buildings remain visible without any task and fit narrow and wide scenes', () => {
  for (const width of [48, 72, 200, 2000]) {
    const band = canvas(width, 22)
    const zones = drawWorkZones(band, now)
    assert.ok(['Library', 'Writing desk', 'Terminal'].every(name => zones.some(zone => zone.name === name)))
    assert.ok(zones.every(zone => zone.x >= 0 && zone.x + zone.width <= width))
    for (const zone of zones) {
      assert.ok(Array.from({ length: 20 - zone.top }, (_, row) => band.px.slice((zone.top + row) * width + zone.x, (zone.top + row) * width + zone.x + zone.width)).flat().some(pixel => pixel >= 0))
    }
    assert.equal(new WorkerSprites().current().length, 0, 'idle buildings never create tasks or agents')
  }
})

test('workplaces reflow into distinct buildings, stations or a shared lodge without overlapping separate structures', () => {
  for (const width of [48, 69, 70, 143, 144, 239, 240, 500]) {
    const zones = layoutWorkZones(width)
    assert.equal(new Set(zones.map(zone => zone.kind)).size, 1)
    assert.equal(zones[0].kind, width < 70 ? 'lodge' : width < 144 ? 'station' : 'building')
    const structures = [...new Map(zones.map(zone => [zone.group, zone])).values()]
    assert.ok(structures.every(zone => zone.x >= 0 && zone.x + zone.width <= width))
    assert.ok(structures.every((zone, index) => index === 0 || structures[index - 1].x + structures[index - 1].width < zone.x))
    assert.equal(zones.some(zone => zone.mode === 'web'), width >= 240)
  }
})

test('resizing reassigns an active worker to its new workplace without summoning it again', () => {
  const parsed = readTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8')))
  assert.equal(parsed.errors, undefined)
  const body = animate(parsed.theme), sprites = new WorkerSprites()
  const tool: ToolState = { id: 'resize', mode: 'bash', target: '', since: now, source: 'process' }
  sprites.draw(body, canvas(200, 22), [tool], now, 0, 19, 10)
  const first = sprites.current()[0]
  sprites.draw(body, canvas(2000, 22), [tool], now + 100, 0, 19, 10)
  assert.ok(sprites.current()[0].goal > 1500, 'expanding moves the terminal destination into the new layout')
  sprites.draw(body, canvas(72, 22), [tool], now + 200, 0, 19, 10)
  const last = sprites.current()[0]
  assert.equal(last.born, first.born)
  assert.equal(last.id, first.id)
  assert.ok(last.x >= 0 && last.x + 18 <= 72 && last.goal + 18 <= 72, 'shrinking keeps the existing worker and destination inside the panel')
})

test('village scenery keeps original obstacle navigation and places trees outside building footprints', () => {
  const parsed = readTheme(bundledTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8'))))
  assert.equal(parsed.errors, undefined)
  const scene = animate(parsed.theme).scene!
  const original = layScene(scene, 152), village = layWorkScene(scene, 152)
  assert.deepEqual(village.obstacles, original.obstacles, 'new buildings cannot silently change the original leap behavior')
  assert.ok(village.decor.some(item => item.drift === undefined && item.rows.length >= 8), 'trees remain visible in a medium panel')
  const sites = layoutWorkZones(152)
  for (const plant of village.decor.filter(item => item.drift === undefined)) {
    const size = Math.max(...plant.rows.map(row => row.length))
    assert.ok(sites.every(site => plant.x + size <= site.x || plant.x >= site.x + site.width))
  }
  assert.equal(layWorkScene(scene, 152), village, 'repeated frames reuse the same bounded scene layout')
})
const row = (type: string, payload: Record<string, unknown>, at = now) => ({ type, timestamp: new Date(at).toISOString(), payload })
const hook = (event: string, extra: Record<string, unknown> = {}, at = now) => row('pixel_pet_hook', { event, ...extra }, at)

test('each parallel tool has its own stable worker and independent completion/departure', () => {
  const reducer = new SessionReducer()
  reducer.apply(row('response_item', { type: 'function_call', call_id: 'read', name: 'read_file', arguments: '{}' }))
  reducer.apply(row('response_item', { type: 'custom_tool_call', call_id: 'edit', name: 'apply_patch', input: 'private patch' }, now + 10))
  reducer.apply(row('response_item', { type: 'function_call', call_id: 'run', name: 'exec_command', arguments: '{"cmd":"npm test"}' }, now + 20))
  assert.deepEqual(reducer.current(now + 20).toolStates?.map(tool => tool.mode), ['read', 'edit', 'bash'])
  reducer.apply(row('response_item', { type: 'function_call_output', call_id: 'read', output: '{}' }, now + 30))
  const snapshot = reducer.current(now + 30)
  assert.equal(snapshot.tools, 2)
  assert.equal(snapshot.toolStates?.find(tool => tool.id === 'edit')?.since, now + 10)
  assert.equal(snapshot.toolStates?.find(tool => tool.id === 'read')?.doneAt, now + 30)
  assert.equal(reducer.current(now + 30 + TOOL_DEPARTURE_MS).toolStates?.length, 2)
  assert.equal(JSON.stringify(snapshot).includes('private patch'), false)
})

test('native children suppress the exec wrapper, and duplicate notifications cannot create workers', () => {
  const reducer = new SessionReducer()
  reducer.apply(hook('PreToolUse', { callId: 'wrapper', mode: 'bash', wrapper: true }))
  reducer.apply(hook('PreToolUse', { callId: 'edit', mode: 'edit' }, now + 10))
  reducer.apply(hook('PreToolUse', { callId: 'read', mode: 'read' }, now + 20))
  reducer.apply(hook('PreToolUse', { callId: 'edit', mode: 'edit' }, now + 30))
  assert.equal(reducer.current(now + 30).tools, 2)
  assert.equal(reducer.current(now + 30).toolStates?.find(tool => tool.id === 'edit')?.since, now + 10)
  assert.equal(taskMiniLayout(reducer.current(now + 30).toolStates!, now + 30, 200, 0).all.length, 2)
  const sanitized = sanitizeHook({ session_id: 's', cwd: 'project', hook_event_name: 'PreToolUse', tool_name: 'functions.exec', tool_input: 'private code' })
  assert.equal((sanitized?.payload as Record<string, unknown>).wrapper, true)
  reducer.apply(hook('PostToolUse', { callId: 'edit' }, now + 40))
  reducer.apply(hook('PreToolUse', { callId: 'edit', mode: 'edit' }, now + 50))
  assert.equal(reducer.current(now + 50).tools, 1)
  reducer.apply(hook('PostToolUse', { callId: 'post-only', mode: 'edit' }, now + 60))
  assert.equal(reducer.current(now + 60).tools, 1, 'completion without a start cannot inflate running tools')
  assert.equal(reducer.current(now + 60).toolStates?.find(tool => tool.id === 'post-only')?.doneAt, now + 60)
})

test('completed FileChange records recover edits inside mixed wrappers without claiming active children', () => {
  const reducer = new SessionReducer()
  reducer.apply(row('response_item', { type: 'custom_tool_call', call_id: 'wrapper', name: 'exec', input: 'await tools.apply_patch("private patch"); await tools.exec_command({cmd:"npm test"})' }))
  assert.equal(reducer.current(now).tools, 1, 'source mentions are not separate lifecycle events')
  reducer.apply(row('event_msg', { type: 'item_completed', item: { type: 'FileChange', id: 'child', changes: { 'private.ts': { diff: 'private diff' } }, status: 'completed' } }, now + 100))
  reducer.apply(row('response_item', { type: 'custom_tool_call_output', call_id: 'wrapper', output: '{}' }, now + 110))
  const snapshot = reducer.current(now + 120)
  assert.equal(snapshot.tools, 0)
  assert.equal(snapshot.mode, 'edit')
  assert.equal(taskMiniLayout(snapshot.toolStates!, now + 120, 200, 0).all.length, 1)
  assert.equal(JSON.stringify(snapshot).includes('private'), false)
  assert.equal(reducer.current(now + 100 + TOOL_DEPARTURE_MS).toolStates?.some(tool => tool.id === 'child'), false)
})

test('structured item starts track real concurrency and shell argv selects the correct action', () => {
  const reducer = new SessionReducer()
  reducer.apply(row('event_msg', { type: 'item_started', item: { id: 'cmd', type: 'CommandExecution', command: ['powershell.exe', '-Command', 'Get-Content app.ts'] }, started_at_ms: now }))
  reducer.apply(row('event_msg', { type: 'item_started', item: { id: 'edit', type: 'FileChange' } }, now + 20))
  assert.equal(reducer.current(now + 20).tools, 2)
  reducer.apply(row('event_msg', { type: 'item_completed', item: { id: 'cmd', type: 'CommandExecution', command: ['powershell.exe', '-Command', 'Get-Content app.ts'], exit_code: 1, stdout: 'private output', status: 'failed' } }, now + 100))
  assert.equal(reducer.current(now + 100).tools, 1)
  assert.equal(reducer.current(now + 100).toolStates?.find(tool => tool.id === 'cmd')?.failed, true)
  assert.equal(reducer.current(now + 100).toolStates?.find(tool => tool.id === 'cmd')?.mode, 'read')
  reducer.apply(row('event_msg', { type: 'turn_aborted' }, now + 110))
  assert.equal(reducer.current(now + 110).tools, 0)
  assert.equal(reducer.current(now + 110).toolStates?.find(tool => tool.id === 'edit')?.cancelled, true)
  reducer.apply(row('event_msg', { type: 'item_completed', item: { type: 'Reasoning', id: 'thought', raw_content: 'private reasoning' } }, now + 120))
  assert.equal(reducer.current(now + 120).toolStates?.length, 2)
  assert.equal(JSON.stringify(reducer.current(now + 120)).includes('private'), false)
  assert.deepEqual(reducer.current(now + 11 * 60_000).toolStates, [])
})

test('partial hooks do not hide fallback calls, matching IDs deduplicate and stop cannot resurrect tools', () => {
  const logged = new SessionReducer(), hooked = new SessionReducer()
  logged.apply(row('response_item', { type: 'function_call', call_id: 'edit', name: 'apply_patch', arguments: '{}' }))
  hooked.apply(hook('UserPromptSubmit'))
  assert.equal(combineActivity(logged.current(now), hooked.current(now)).tools, 1)
  hooked.apply(hook('PreToolUse', { callId: 'edit', mode: 'edit' }))
  assert.equal(combineActivity(logged.current(now), hooked.current(now)).tools, 1)
  hooked.apply(hook('PostToolUse', { callId: 'edit' }, now + 50))
  assert.equal(combineActivity(logged.current(now + 50), hooked.current(now + 50)).tools, 0)
  hooked.apply(hook('Stop', {}, now + 100))
  assert.equal(combineActivity(logged.current(now + 3000), hooked.current(now + 3000)).tools, 0)
  assert.equal(combineActivity(emptySnapshot(), hooked.current(now + 3000)).working, false)
})

test('worker poses have distinct props, bounded layout and truthful overflow', () => {
  const parsed = readTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8')))
  assert.equal(parsed.errors, undefined)
  const body = animate(parsed.theme)
  const states: ToolState[] = ['read', 'edit', 'bash', 'web', 'search', 'agent', 'read'].map((mode, index) => ({ id: String(index), mode: mode as ToolState['mode'], target: '', since: now, source: 'call' }))
  const layout = taskMiniLayout(states, now + 500, 200, 0)
  assert.equal(layout.shown.length, 6)
  assert.equal(layout.overflow, 1)
  const narrow = taskMiniLayout(states, now + 500, 72, 0)
  assert.equal(narrow.shown.length, 1)
  assert.equal(narrow.overflow, 6)
  const poses = states.slice(0, 5).map(tool => {
    const band = canvas(18, 22)
    drawTaskMinis(body, band, [tool], now + 500)
    assert.ok(band.px.some(color => color >= 0))
    return JSON.stringify(band.px)
  })
  assert.equal(new Set(poses).size, 5)
})

test('workers summon beside the main pet, walk independently and retain identity through reordering and completion', () => {
  const parsed = readTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8')))
  assert.equal(parsed.errors, undefined)
  const body = animate(parsed.theme)
  const tasks: ToolState[] = ['one', 'two', 'three'].map(id => ({ id, mode: 'bash', target: '', since: now, source: 'process' }))
  const sprites = new WorkerSprites()
  const draw = (time: number, list = tasks, width = 200, left = 130) => {
    const band = canvas(width, 22)
    sprites.draw(body, band, list, time, left, 33, 10)
    return band
  }
  const band = draw(now)
  assert.ok(band.px.includes(PORTAL_COLORS.bash), 'blue Run circle is visible before the worker emerges')
  assert.ok(band.px.includes(0xc2d9ff), 'orbiting magic light uses the lighter Run hue')
  const born = sprites.current()
  assert.ok(born.every(worker => Math.abs(worker.origin - 130) <= 60 && worker.origin > 0))
  assert.equal(new Set(born.map(worker => worker.origin)).size, 3, 'simultaneous workers have separate summoning circles')
  assert.equal(new Set(born.map(worker => worker.goal)).size, 3)
  for (let time = now + 100; time <= now + SUMMON_MS + 6000; time += 100) draw(time)
  const settled = sprites.current()
  assert.ok(settled.every(worker => worker.phase === 'work' && worker.x === worker.goal))
  draw(now + 7400, [...tasks].reverse())
  assert.deepEqual(sprites.current().map(worker => [worker.id, worker.born, worker.x]), settled.map(worker => [worker.id, worker.born, worker.x]))
  draw(now + 7500, tasks.map(tool => tool.id === 'one' ? { ...tool, doneAt: now + 7500 } : tool))
  assert.equal(sprites.current().find(worker => worker.id === 'one')?.phase, 'return')
  draw(now + 7600, tasks.slice(1))
  assert.deepEqual(sprites.current().map(worker => worker.id), ['one', 'two', 'three'], 'result journey persists after the tool leaves the protocol snapshot')
  sprites.clear()
  draw(now + 8000, tasks.slice(0, 1), 72, 0)
  assert.ok(sprites.current().every(worker => worker.x >= 0 && worker.x + 18 <= 72 && worker.origin >= 33))
  draw(now + 8100, [{ ...tasks[0], awaitingResult: true }], 72, 0)
  assert.equal(sprites.current()[0].phase, 'pending')
})

test('read, edit and run workers choose distinct zones and carry independent results back without extending real work', () => {
  const parsed = readTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8')))
  assert.equal(parsed.errors, undefined)
  const body = animate(parsed.theme)
  const sprites = new WorkerSprites()
  const tasks: ToolState[] = ['read', 'edit', 'bash'].map(mode => ({ id: mode, mode: mode as ToolState['mode'], target: '', since: now, source: 'call' }))
  const draw = (time: number, list: ToolState[]) => { const band = canvas(200, 22); sprites.draw(body, band, list, time, 130, 33, 0); return band }
  draw(now, tasks)
  for (let time = now + 100; time <= now + 10000; time += 100) draw(time, tasks)
  const workers = sprites.current()
  assert.deepEqual(workers.map(worker => worker.zone), ['Library', 'Writing desk', 'Terminal'])
  assert.ok(workers[0].goal < workers[1].goal && workers[1].goal < workers[2].goal)
  assert.ok(workers.every(worker => worker.phase === 'work'))
  const completed = tasks.map(tool => ({ ...tool, doneAt: now + 10100, failed: tool.id === 'bash' }))
  draw(now + 10100, completed)
  const phases = new Set<string>()
  let failurePixels = false
  for (let time = now + 10200; time <= now + 10100 + RESULT_MS; time += 100) {
    const band = draw(time, [])
    for (const worker of sprites.current()) phases.add(worker.phase)
    if (sprites.current().some(worker => worker.phase === 'error')) failurePixels ||= band.px.includes(0xff8585) && band.px.includes(0x66534b)
  }
  assert.ok(['return', 'handoff', 'error', 'depart'].every(phase => phases.has(phase)))
  assert.ok(failurePixels, 'failure has a red sign and soot marks instead of success parcel')
  assert.equal(sprites.current().length, 0)
  assert.equal(sprites.results().length, 0)
  assert.equal(tasks.some(tool => tool.doneAt !== undefined), false, 'animation never mutates observed lifecycle records')
})

test('summoning starts in the sky, projects light downward and reveals the worker on the ground', () => {
  const parsed = readTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8')))
  assert.equal(parsed.errors, undefined)
  const body = animate(parsed.theme)
  const sprites = new WorkerSprites()
  const tasks: ToolState[] = [{ id: 'worker', mode: 'edit', target: '', since: now, source: 'call' }]
  const draw = (age: number) => {
    const band = canvas(100, 22)
    sprites.draw(body, band, tasks, now + age, 45, 33, 0)
    return band
  }
  const opening = draw(0)
  const origin = sprites.current()[0].origin
  const center = Math.round(origin + 3)
  assert.ok(opening.px.slice(0, 7 * opening.w).includes(PORTAL_COLORS.edit), 'source circle is in the sky with the edit color')
  assert.ok(opening.px.slice(8 * opening.w).every(pixel => pixel < 0), 'no ground circle or worker before the light arrives')
  const reaching = draw(500)
  assert.ok(reaching.px[10 * reaching.w + center] >= 0, 'beam extends down from the sky')
  assert.ok(reaching.px.slice(17 * reaching.w).every(pixel => pixel < 0), 'light has not reached the ground yet')
  const landing = draw(700)
  assert.ok(landing.px[19 * landing.w + center] >= 0, 'beam reaches the ground before the worker appears')
  const materialized = draw(1150)
  assert.ok(materialized.px.some(pixel => pixel === body.palette.f), 'the pet materializes inside the light')
  draw(SUMMON_MS + 200)
  assert.notEqual(sprites.current()[0].phase, 'summon')
  const finished = draw(SUMMON_MS + 400)
  assert.ok(finished.px.slice(0, 7 * finished.w).every(pixel => pixel < 0), 'sky sigil closes after summoning')
  assert.equal(tasks[0].id, 'worker', 'effects do not create extra tasks or agents')
})

test('interrupted workers depart neutrally and hiding minis clears cached deliveries', () => {
  const parsed = readTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8')))
  assert.equal(parsed.errors, undefined)
  const body = animate(parsed.theme)
  const sprites = new WorkerSprites()
  const stopped: ToolState = { id: 'stopped', mode: 'edit', target: '', since: now, doneAt: now + 100, cancelled: true, source: 'call' }
  const band = canvas(72, 22)
  sprites.draw(body, band, [stopped], now + 100, 0, 33, 64)
  assert.equal(sprites.current()[0].phase, 'depart')
  assert.equal(band.px.includes(0xffe28a), false, 'interrupt must not create a parcel or high-five sparkle')
  sprites.draw(body, canvas(72, 22), [], now + 900, 0, 33, 64)
  assert.equal(sprites.current().length, 0)
  sprites.draw(body, canvas(72, 22), [{ ...stopped, id: 'finished', cancelled: false }], now + 1000, 0, 33, 64)
  assert.equal(sprites.results().length, 1)
  sprites.clear()
  sprites.draw(body, canvas(48, 22), [], now + 1100, 0, 33, 40)
  assert.equal(sprites.results().length, 0)
  assert.equal(sprites.current().length, 0)
})

test('workers reach distant work zones and deliver results within the animation window on ultrawide scenes', () => {
  const parsed = readTheme(JSON.parse(readFileSync('plugins/pixel-pet/assets/slime.json', 'utf8')))
  assert.equal(parsed.errors, undefined)
  const body = animate(parsed.theme)
  const sprites = new WorkerSprites()
  const tool: ToolState = { id: 'wide', mode: 'bash', target: '', since: now, source: 'process' }
  const draw = (time: number, list: ToolState[]) => sprites.draw(body, canvas(2000, 22), list, time, 20, 19, 10)
  for (let time = now; time <= now + 16000; time += 100) draw(time, [tool])
  assert.ok(sprites.current()[0].x > 1500, 'terminal zone follows the full scene width')
  assert.equal(sprites.current()[0].phase, 'work')
  draw(now + 16100, [{ ...tool, doneAt: now + 16100 }])
  let delivered = false
  for (let time = now + 16200; time <= now + 16100 + RESULT_MS; time += 100) {
    draw(time, [])
    delivered ||= sprites.current().some(worker => worker.phase === 'handoff')
  }
  assert.ok(delivered, 'a distant worker must reach the AI pet before fading away')
  assert.equal(sprites.current().length, 0)
})
