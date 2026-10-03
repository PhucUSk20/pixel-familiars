import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SessionReducer, codexUsage, classifyTool } from '../protocol'
const at = '2026-10-03T12:00:00Z'
const now = Date.parse(at)
const row = (type: string, payload: Record<string, unknown>) => ({ type, payload, timestamp: at })

test('parallel calls retain activity until the last output, then completion clears state', () => {
  const reducer = new SessionReducer()
  reducer.apply(row('event_msg', { type: 'task_started' }))
  assert.equal(reducer.current(now).working, true)
  reducer.apply(row('response_item', { type: 'function_call', call_id: '1', name: 'exec_command', arguments: '{"cmd":"rg hello"}' }))
  reducer.apply(row('response_item', { type: 'custom_tool_call', call_id: '2', name: 'apply_patch', input: '*** Begin Patch' }))
  assert.equal(reducer.current(now).tools, 2)
  assert.equal(reducer.current(now).mode, 'edit')
  reducer.apply(row('response_item', { type: 'function_call_output', call_id: '1', output: 'private output' }))
  assert.equal(reducer.current(now).tools, 1)
  reducer.apply(row('event_msg', { type: 'task_complete' }))
  assert.equal(reducer.current(now).working, false)
  assert.equal(reducer.current(now).tools, 0)
  assert.equal(JSON.stringify(reducer.current(now)).includes('private output'), false)
})

test('actual Codex token_count schema calculates context and known quota windows', () => {
  const usage = codexUsage({ info: { model_context_window: 100000, total_token_usage: { total_tokens: 500000 }, last_token_usage: { total_tokens: 25000 } }, rate_limits: { primary: { used_percent: 30, window_minutes: 300, resets_at: 1234 }, secondary: { used_percent: 60, window_minutes: 10080 } } })
  assert.deepEqual(usage, { hp: 75, mp: 70, st: 40, mpReset: 1234, stReset: undefined })
  assert.equal(codexUsage({}).hp, undefined)
  assert.equal(codexUsage({ rate_limits: { primary: { used_percent: 1, window_minutes: 60 } } }).mp, undefined)
})

test('unknown events, non-JSON arguments and malformed numeric usage are harmless', () => {
  const reducer = new SessionReducer()
  reducer.apply(null); reducer.apply(row('world_state', { password: 'secret' }))
  assert.equal(classifyTool('functions.exec', 'await tools.exec_command()').target, 'functions.exec')
  assert.equal(codexUsage({ info: { model_context_window: NaN }, rate_limits: { primary: { window_minutes: 300, used_percent: Infinity } } }).mp, undefined)
  assert.equal(JSON.stringify(reducer.current(now)).includes('secret'), false)
})

test('aborts and stale sessions stop working; explicit errors are preserved', () => {
  const reducer = new SessionReducer()
  reducer.apply(row('event_msg', { type: 'user_message', message: 'private prompt' }))
  assert.equal(reducer.current(now).working, true)
  assert.equal(reducer.current(now + 11 * 60000).working, false)
  reducer.apply(row('event_msg', { type: 'error' }))
  assert.equal(reducer.current(now).errorAt, now)
  reducer.apply(row('event_msg', { type: 'turn_aborted' }))
  assert.equal(reducer.current(now).working, false)
})
