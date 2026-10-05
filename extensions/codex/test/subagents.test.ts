import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, appendFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { emptySnapshot, type Snapshot } from '../protocol'
import { reconcileSubagents, SubagentObserver } from '../subagents'
import { discoverSessions } from '../sessions'
import { observedMinis, workerLabel } from '../task-minis'

const now = Date.now()
const parent: Snapshot = { ...emptySnapshot(), sessionId: 'parent', agents: ['a', 'b'], agentStates: [{ id: 'a', since: now - 20000 }, { id: 'b', since: now - 15000 }] }

test('child completion repairs missing parent Stop without ending a different active agent', () => {
  const ended = { ...emptySnapshot(), sessionId: 'a', turnStartedAt: now - 18000, turnEndedAt: now - 1000 }
  const running = { ...emptySnapshot(), sessionId: 'b', turnStartedAt: now - 14000, tools: 1, mode: 'edit' as const }
  const result = reconcileSubagents(parent, [ended, running], now)
  assert.deepEqual(result.agents, ['b'])
  assert.equal(result.agentStates?.find(agent => agent.id === 'a')?.doneAt, ended.turnEndedAt)
  assert.equal(result.agentStates?.find(agent => agent.id === 'b')?.mode, 'edit')
  const mini = observedMinis(result, now).find(tool => tool.id === 'agent:b')!
  assert.equal(mini.mode, 'edit')
  assert.equal(workerLabel(mini), 'Agent · Edit')
  assert.equal(parent.agents.length, 2, 'reconciliation never mutates source snapshots')
  assert.deepEqual(reconcileSubagents(parent, [ended], now + 1000).agents, ['b'])
})

test('old copied turns and stale working=false are not evidence of a child completion', () => {
  const unknown = { ...emptySnapshot(), sessionId: 'a', activityAt: now - 600000 }
  const old = { ...emptySnapshot(), sessionId: 'b', turnStartedAt: now - 40000, turnEndedAt: now - 30000 }
  assert.deepEqual(reconcileSubagents(parent, [unknown, old], now).agents, ['a', 'b'])
})

test('an actually resumed child becomes active again, while older child activity cannot undo a newer Stop', () => {
  const stopped = { ...parent, agents: [], agentStates: [{ id: 'a', since: now - 20000, doneAt: now - 3000 }] }
  const resumed = { ...emptySnapshot(), sessionId: 'a', turnStartedAt: now - 2000 }
  const result = reconcileSubagents(stopped, [resumed], now)
  assert.deepEqual(result.agents, ['a'])
  assert.equal(result.agentStates?.[0].since, now - 2000)
  const old = { ...resumed, turnStartedAt: now - 4000 }
  assert.deepEqual(reconcileSubagents(stopped, [old], now).agents, [])
})

test('historical finished children do not create workers; interruptions remain neutral', () => {
  const ended = { ...emptySnapshot(), sessionId: 'a', turnStartedAt: now - 18000, turnEndedAt: now - 1000, turnCancelled: true }
  assert.deepEqual(reconcileSubagents({ ...emptySnapshot(), sessionId: 'parent' }, [ended], now).agentStates, [])
  const result = reconcileSubagents(parent, [ended], now)
  assert.equal(observedMinis(result, now).find(tool => tool.id === 'agent:a')?.cancelled, true)
})

test('workspace/parent-scoped child logs repair lost hooks and discover later resume turns', async () => {
  const home = await mkdtemp(join(tmpdir(), 'pixel-pet-subagents-'))
  try {
    const directory = join(home, 'sessions', '2026', '10', '05')
    await mkdir(directory, { recursive: true })
    const record = (type: string, payload: unknown, at: number) => JSON.stringify({ type, payload, timestamp: new Date(at).toISOString() }) + '\n'
    const childMeta = (id: string, parentId: string, cwd: string) => record('session_meta', { id, cwd, source: { subagent: { thread_spawn: { parent_thread_id: parentId } } } }, now - 20000)
    const done = record('event_msg', { type: 'task_started' }, now - 18000) + record('response_item', { type: 'message', content: 'private child result' }, now - 15000) + record('event_msg', { type: 'task_complete' }, now - 2000)
    const child = join(directory, 'child.jsonl')
    await writeFile(child, childMeta('a', 'parent', 'D:/workspace') + record('session_meta', { id: 'parent', cwd: 'D:/workspace', source: 'vscode' }, now - 19000) + done)
    await writeFile(join(directory, 'other-parent.jsonl'), childMeta('foreign', 'other', 'D:/workspace') + done)
    await writeFile(join(directory, 'other-workspace.jsonl'), childMeta('foreign-workspace', 'parent', 'D:/elsewhere') + done)
    assert.deepEqual(await discoverSessions(home, ['D:/workspace']), [], 'children never replace the selected main session')
    assert.deepEqual((await discoverSessions(home, ['D:/workspace'], false, 'parent')).map(session => session.id), ['a'])
    const observer = new SubagentObserver()
    const first = await observer.poll(home, ['D:/workspace'], parent)
    assert.deepEqual(first.agents, ['b'])
    assert.equal(JSON.stringify(first).includes('private'), false)
    await appendFile(child, record('event_msg', { type: 'task_started' }, now - 1000) + record('response_item', { type: 'function_call', call_id: 'read', name: 'read_file', arguments: '{}' }, now - 900))
    const resumed = await observer.poll(home, ['D:/workspace'], first)
    assert.ok(resumed.agents.includes('a'))
    assert.equal(resumed.agentStates?.find(agent => agent.id === 'a')?.mode, 'read')
    assert.deepEqual((await observer.poll(home, ['D:/workspace'], { ...emptySnapshot(), sessionId: 'other' })).agents, [], 'changing parent clears child caches')
  } finally { await rm(home, { recursive: true, force: true }) }
})
