import { test } from 'node:test'
import assert from 'node:assert/strict'
import { commandCheck, type CommandCheck } from '../checks'
import { SessionReducer } from '../protocol'
import { ProjectResults } from '../project-state'

const now = Date.now()
const item = (type: string, value: Record<string, unknown>, at = now, started = now) => ({ type: 'event_msg', timestamp: new Date(at).toISOString(), payload: { type, started_at_ms: started, item: value } })
const check = (id: string, start: number, end?: number, exitCode?: number): CommandCheck => ({ id, name: 'test', cwd: 'D:/project', startedAt: start, endedAt: end, exitCode })

test('single check commands are recognized without executing source or accepting compound shells', () => {
  for (const [command, name] of [['npm.cmd test', 'test'], ['npm run test:ui', 'test:ui'], ['pnpm run typecheck', 'typecheck'], ['npx vitest run', 'test'], ['python -m pytest', 'test'], ['cargo clippy', 'clippy'], ['go test ./...', 'test'], ['node --test test.js', 'test']]) assert.equal(commandCheck(command), name)
  assert.equal(commandCheck(['powershell.exe', '-Command', 'npm.cmd run build']), 'build')
  assert.equal(commandCheck(['bash', '-lc', 'npm test']), 'test')
  assert.equal(commandCheck('npm test --dry-run=true'), undefined)
  for (const command of ['npm ci', 'npm run install:codex', 'echo npm test', 'npm test; npm run build', 'npm test\nnpm run build', 'npm test && true', 'npm test || true', 'npm test -- --help', 'npx tsc -v', 'npx tsc --showConfig', 'npx eslint --print-config app.js', 'npm run test --if-present', 'cargo test --no-run', 'npx vitest --watch', 'node -e "npm test"', 'npm test > output.txt']) assert.equal(commandCheck(command), undefined)
})

test('structured command records retain check metadata and numeric exit only, and interrupt ends pending checks', () => {
  const reducer = new SessionReducer()
  reducer.apply({ type: 'session_meta', payload: { id: 'session', cwd: 'D:/project' } })
  reducer.apply(item('item_started', { type: 'CommandExecution', id: 'run', command: ['powershell.exe', '-Command', 'npm.cmd test'] }))
  assert.equal(reducer.current(now).checkStates?.[0].name, 'test')
  reducer.apply(item('item_completed', { type: 'CommandExecution', id: 'run', command: 'npm.cmd test', exit_code: 1, status: 'failed', stdout: 'private output', stderr: 'private stack', aggregated_output: 'private text' }, now + 100))
  assert.equal(reducer.current(now + 100).checkStates?.[0].exitCode, 1)
  assert.equal(JSON.stringify(reducer.current(now + 100)).includes('private'), false)
  reducer.apply(item('item_started', { type: 'CommandExecution', id: 'next', command: 'npm test' }, now + 150))
  reducer.apply({ type: 'event_msg', timestamp: new Date(now + 200).toISOString(), payload: { type: 'turn_aborted' } })
  assert.equal(reducer.current(now + 200).checkStates?.find(check => check.id === 'next')?.cancelled, true)
})

test('automatic results need no manual run, retain failures, and do not replay success after code edits', () => {
  const results = new ProjectResults(); results.configure(['test'])
  assert.equal(results.observe('run', 'test', check('run', now, now + 100, 1), now), true)
  assert.equal(results.state().status, 'issues')
  assert.equal(results.observe('pass', 'test', check('pass', now + 200, now + 300, 0), now), true)
  assert.equal(results.state().status, 'verified')
  results.edit(now + 400)
  assert.equal(results.observe('pass', 'test', check('pass', now + 200, now + 300, 0), now), false)
  assert.equal(results.state().status, 'unverified')
  results.observe('fresh', 'test', check('fresh', now + 500, now + 600, 0), now)
  assert.equal(results.state().status, 'verified')
  assert.equal(results.state().checks[0].source, 'codex')
})

test('historical, untimed, interrupted or stale-revision check outcomes cannot verify current code', () => {
  const results = new ProjectResults(); results.configure(['test'])
  assert.equal(results.observe('history', 'test', check('history', now - 300, now - 200, 0), now), false)
  results.observe('untimed', 'test', { ...check('untimed', now, now + 100, 0), startedAt: undefined }, now)
  assert.equal(results.state().status, 'unverified')
  results.observe('running', 'test', check('running', now + 150), now)
  assert.match(results.state().text, /1 check running/)
  results.edit(now + 200)
  results.observe('running', 'test', check('running', now + 150, now + 300, 0), now)
  assert.equal(results.state().status, 'unverified')
  results.observe('cancelled', 'test', { ...check('cancelled', now + 400, now + 500, 0), cancelled: true }, now)
  assert.equal(results.state().status, 'unverified')
})

test('automatic parallel checks preserve failure, and out-of-order historical completion cannot replace newer results', () => {
  const results = new ProjectResults(); results.configure(['test'])
  results.observe('a', 'test', check('a', now), now)
  results.observe('b', 'test', check('b', now + 10), now)
  results.observe('a', 'test', check('a', now, now + 100, 1), now)
  assert.equal(results.state().checks[0].status, 'running')
  results.observe('b', 'test', check('b', now + 10, now + 200, 0), now)
  assert.equal(results.state().status, 'issues')
  results.observe('new', 'test', check('new', now + 300, now + 400, 0), now)
  assert.equal(results.state().status, 'verified')
  assert.equal(results.observe('older', 'test', check('older', now + 20, now + 30, 1), now), false)
  assert.equal(results.state().status, 'verified')
})
