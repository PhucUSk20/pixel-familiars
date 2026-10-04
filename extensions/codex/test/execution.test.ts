import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SessionReducer, combineActivity, toolFailed, TOOL_DEPARTURE_MS } from '../protocol'
import { executionMetadata } from '../execution'
import { sanitizeHook } from '../bridge'
const at = Date.now()
const row = (type: string, payload: Record<string, unknown>, time = at) => ({ type, payload, timestamp: new Date(time).toISOString() })
const output = (handles: number[]) => handles.map(session_id => ({ type: 'text', text: JSON.stringify({ chunk_id: 'safe', session_id, wall_time_seconds: 10, output: 'private stdout' }) }))
const start = (reducer: SessionReducer, id = 'outer', time = at) => reducer.apply(row('response_item', { type: 'custom_tool_call', call_id: id, name: 'exec', input: 'private source' }, time))

test('actual wrapper arrays start independent process workers, kept until matching completed items', () => {
  const reducer = new SessionReducer()
  start(reducer)
  reducer.apply(row('response_item', { type: 'custom_tool_call_output', call_id: 'outer', output: output([123, 456]) }, at + 100))
  assert.equal(reducer.current(at + 100).tools, 2)
  assert.deepEqual(reducer.current(at + 100).toolStates?.filter(tool => tool.source === 'process').map(tool => tool.id), ['process:123', 'process:456'])
  assert.equal(reducer.current(at + 5 * 60000).tools, 2, 'a quiet long-running command does not disappear when its wrapper returns')
  reducer.apply(row('event_msg', { type: 'item_completed', item: { type: 'CommandExecution', id: 'child-a', process_id: '123', command: 'npm test', exit_code: 0, status: 'completed', aggregated_output: 'private output' } }, at + 6 * 60000))
  const current = reducer.current(at + 6 * 60000)
  assert.equal(current.tools, 1)
  assert.equal(current.toolStates?.some(tool => tool.id === 'child-a'), false, 'completed item and background process are one worker')
  assert.equal(current.toolStates?.find(tool => tool.id === 'process:123')?.doneAt, at + 6 * 60000)
  assert.equal(current.toolStates?.find(tool => tool.id === 'process:456')?.since, at + 100)
  assert.equal(JSON.stringify(current).includes('private'), false)
})

test('ordinary turn completion preserves known running processes; interruption cancels and cannot resurrect them', () => {
  const reducer = new SessionReducer(), hooked = new SessionReducer()
  start(reducer)
  reducer.apply(row('response_item', { type: 'custom_tool_call_output', call_id: 'outer', output: output([777]) }, at + 100))
  reducer.apply(row('event_msg', { type: 'task_complete' }, at + 200))
  hooked.apply(row('pixel_pet_hook', { event: 'Stop' }, at + 200))
  assert.equal(reducer.current(at + 300).tools, 1)
  assert.equal(combineActivity(reducer.current(at + 300), hooked.current(at + 300)).tools, 1)
  hooked.apply(row('pixel_pet_hook', { event: 'Interrupt' }, at + 400))
  assert.equal(combineActivity(reducer.current(at + 500), hooked.current(at + 500)).tools, 0)
  reducer.apply(row('event_msg', { type: 'turn_aborted' }, at + 600))
  start(reducer, 'late', at + 700)
  reducer.apply(row('response_item', { type: 'custom_tool_call_output', call_id: 'late', output: output([777]) }, at + 800))
  assert.equal(reducer.current(at + 800).tools, 0)
})

test('late yielded output cannot resurrect an already exited process; direct polling closes the same worker', () => {
  const reducer = new SessionReducer()
  reducer.apply(row('event_msg', { type: 'item_completed', item: { type: 'CommandExecution', id: 'finished', process_id: '333', command: 'npm test', exit_code: 0, status: 'completed' } }))
  start(reducer, 'late', at + 100)
  reducer.apply(row('response_item', { type: 'custom_tool_call_output', call_id: 'late', output: output([333]) }, at + 200))
  assert.equal(reducer.current(at + 200).tools, 0)
  start(reducer, 'real', at + 300)
  reducer.apply(row('response_item', { type: 'custom_tool_call_output', call_id: 'real', output: output([444]) }, at + 400))
  reducer.apply(row('response_item', { type: 'function_call', name: 'write_stdin', call_id: 'poll', arguments: '{"session_id":444}' }, at + 500))
  assert.equal(reducer.current(at + 500).tools, 1, 'polling does not duplicate the process')
  reducer.apply(row('response_item', { type: 'function_call_output', call_id: 'poll', output: JSON.stringify({ chunk_id: 'exit', exit_code: 1, output: 'private', wall_time_seconds: 4 }) }, at + 600))
  assert.equal(reducer.current(at + 600).tools, 0)
  assert.equal(reducer.current(at + 600).toolStates?.find(tool => tool.id === 'process:444')?.failed, true)
  assert.equal(reducer.current(at + 600 + TOOL_DEPARTURE_MS).toolStates?.length, 0)
})

test('quiet expired process observations remain awaiting result rather than claiming live work or disappearing', () => {
  const reducer = new SessionReducer()
  start(reducer)
  reducer.apply(row('response_item', { type: 'custom_tool_call_output', call_id: 'outer', output: output([321]) }, at + 100))
  const current = reducer.current(at + 11 * 60000)
  assert.equal(current.tools, 0); assert.equal(current.working, false)
  assert.equal(current.toolStates?.length, 1)
  assert.equal(current.toolStates?.[0].awaitingResult, true)
})

test('metadata parsing ignores stdout/prose, bounds input and recognizes wrapped numeric failure without retaining text', () => {
  assert.deepEqual(executionMetadata({ chunk_id: 'x', exit_code: 0, output: JSON.stringify({ chunk_id: 'fake', session_id: 88 }) }).running, [])
  assert.deepEqual(executionMetadata([{ type: 'image', text: JSON.stringify({ chunk_id: 'x', session_id: 8 }) }, 'Process running with session ID 99', { session_id: 22 }]).running, [])
  assert.deepEqual(executionMetadata({ chunk_id: 'x', session_id: 'private-id' }).running, [])
  assert.equal(toolFailed([{ type: 'text', text: '{"exit_code":1,"output":"private"}' }]), true)
})

test('native process metadata is sanitized, deduplicates logs and polling does not spawn a second worker', () => {
  const hooked = new SessionReducer(), logged = new SessionReducer()
  const native = (event: string, id: string, name: string, input: unknown, response?: unknown, time = at) => {
    const clean = sanitizeHook({ session_id: 's', cwd: 'project', hook_event_name: event, tool_use_id: id, tool_name: name, tool_input: input, tool_response: response })!
    assert.equal(JSON.stringify(clean).includes('private'), false)
    hooked.apply(row('pixel_pet_hook', clean.payload as Record<string, unknown>, time))
  }
  native('PreToolUse', 'launch', 'Bash', { command: 'private command' })
  native('PostToolUse', 'launch', 'Bash', {}, output([222]), at + 100)
  start(logged, 'launch')
  logged.apply(row('response_item', { type: 'custom_tool_call_output', call_id: 'launch', output: output([222]) }, at + 100))
  assert.equal(combineActivity(logged.current(at + 100), hooked.current(at + 100)).tools, 1)
  native('PreToolUse', 'poll', 'write_stdin', { session_id: 222 }, undefined, at + 200)
  assert.equal(hooked.current(at + 200).tools, 1)
  native('PostToolUse', 'poll', 'write_stdin', { session_id: 222 }, { chunk_id: 'done', exit_code: 0, output: 'private output' }, at + 300)
  const snapshot = hooked.current(at + 300)
  assert.equal(snapshot.tools, 0)
  assert.equal(snapshot.toolStates?.find(tool => tool.id === 'process:222')?.doneAt, at + 300)
  assert.equal(combineActivity(logged.current(at + 300), snapshot).tools, 0)
})
