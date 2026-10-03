import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { sanitizeHook, writeHook, eventPath, atomicJson, bridgeRoot } from '../bridge'
import { SessionTail } from '../sessions'
import { SessionReducer, toolFailed } from '../protocol'
import { mergeHooks, installBridge } from '../install'

const now = Date.now()
const event = (event: string, extra: Record<string, unknown> = {}, time = now) => ({ type: 'pixel_pet_hook', timestamp: new Date(time).toISOString(), payload: { event, ...extra } })

test('hooks balance nested parallel tools and restore the remaining tool mode', () => {
  const reducer = new SessionReducer()
  reducer.apply(event('UserPromptSubmit', { turnId: 'turn' }))
  reducer.apply(event('PreToolUse', { callId: 'outer', mode: 'bash' }))
  reducer.apply(event('PreToolUse', { callId: 'read', mode: 'read', target: 'a.ts' }))
  reducer.apply(event('PreToolUse', { callId: 'edit', mode: 'edit' }))
  assert.equal(reducer.current(now).tools, 3)
  reducer.apply(event('PostToolUse', { callId: 'edit' }))
  assert.equal(reducer.current(now).mode, 'read')
  reducer.apply(event('PostToolUse', { callId: 'read', failed: true }))
  assert.equal(reducer.current(now).mode, 'bash')
  assert.equal(reducer.current(now).errorAt, now)
  reducer.apply(event('PostToolUse', { callId: 'outer' }))
  assert.equal(reducer.current(now).tools, 0)
  reducer.apply(event('Stop'))
  assert.equal(reducer.current(now).working, false)
})

test('subagent minis have stable birth times, completion/failure and a 1.5 second departure', () => {
  const reducer = new SessionReducer()
  reducer.apply(event('UserPromptSubmit'))
  reducer.apply(event('SubagentStart', { agentId: 'mini' }))
  assert.equal(reducer.current(now).agentStates?.[0].since, now)
  reducer.apply(event('Stop'))
  assert.deepEqual(reducer.current(now).agents, ['mini'])
  reducer.apply(event('SubagentStop', { agentId: 'mini', failed: true }, now + 1000))
  assert.deepEqual(reducer.current(now + 1200).agents, [])
  assert.equal(reducer.current(now + 1200).agentStates?.[0].failed, true)
  assert.equal(reducer.current(now + 2600).agentStates?.length, 0)
})

test('compaction and approval are represented; interrupt clears pending tool state', () => {
  const reducer = new SessionReducer()
  reducer.apply(event('PreToolUse', { callId: 'a', mode: 'bash' }))
  reducer.apply(event('PermissionRequest'))
  assert.equal(reducer.current(now).awaitingApproval, true)
  reducer.apply(event('PreCompact'))
  assert.equal(reducer.current(now).compacting, true)
  reducer.apply(event('PostCompact'))
  assert.equal(reducer.current(now).compacting, false)
  reducer.apply(event('Interrupt'))
  assert.equal(reducer.current(now).tools, 0)
  assert.equal(reducer.current(now).awaitingApproval, false)
})

test('shell and MCP errors are recognized from structured and model-facing exit metadata', () => {
  assert.equal(toolFailed({ exit_code: 2 }), true)
  assert.equal(toolFailed('Process exited with code 1\nOutput: secret'), true)
  assert.equal(toolFailed({ content: [{ type: 'text', text: '{"exit_code":3}' }] }), true)
  assert.equal(toolFailed({ isError: true }), true)
  assert.equal(toolFailed({ exit_code: 0, output: 'user said error' }), false)
  assert.equal(toolFailed('error is a word in this file'), false)
})

test('hook persistence never retains raw prompts, code, reasoning, transcripts or output', async () => {
  const home = await mkdtemp(join(tmpdir(), 'pixel-pet-hook-'))
  try {
    const input = { hook_event_name: 'PostToolUse', session_id: '../../hostile', cwd: 'D:/workspace', tool_use_id: 'call', tool_name: 'exec_command', tool_input: { cmd: 'cat secret-file' }, tool_response: { exit_code: 1, output: 'private secret' }, prompt: 'private prompt', transcript_path: 'private-path' }
    assert.equal(sanitizeHook(input)?.payload && JSON.stringify(sanitizeHook(input)).includes('secret'), false)
    await writeHook(home, input)
    const path = eventPath(home, input.session_id)
    assert.ok(path.startsWith(join(home, 'pixel-pet', 'events')))
    const raw = await readFile(path, 'utf8')
    assert.equal(/private|secret|transcript/.test(raw), false)
    assert.equal((await new SessionTail(path).poll()).errorAt! > 0, true)
    await atomicJson(join(bridgeRoot(home), 'preferences.json'), { targets: true })
    await writeHook(home, { ...input, hook_event_name: 'PreToolUse' })
    assert.equal((await new SessionTail(path).poll()).target, 'cat secret-file')
  } finally { await rm(home, { recursive: true, force: true }) }
})

test('install merge is idempotent and preserves unrelated hooks and metadata', () => {
  const other = { matcher: 'Bash', hooks: [{ type: 'command', command: 'other-hook' }] }
  const original = { description: 'existing', hooks: { PreToolUse: [other] } }
  const once = mergeHooks(original, 'node pixel-pet')
  const twice = mergeHooks(once, 'node pixel-pet')
  assert.deepEqual(once, twice)
  assert.equal(once.description, 'existing')
  assert.deepEqual((once.hooks as Record<string, unknown[]>).PreToolUse[0], other)
  assert.throws(() => mergeHooks([], 'node pixel-pet'), /not replaced/)
  assert.throws(() => mergeHooks({ hooks: { PreToolUse: 'malformed' } }, 'node pixel-pet'), /not replaced/)
})

test('failed MCP registration does not change existing hooks or report a completed installation', async () => {
  const home = await mkdtemp(join(tmpdir(), 'pixel-pet-install-'))
  try {
    const path = join(home, 'hooks.json')
    const original = '{"hooks":{"Stop":[{"hooks":[{"type":"command","command":"existing"}]}]}}\n'
    await atomicJson(path, JSON.parse(original))
    const before = await readFile(path, 'utf8')
    const packageRoot = join(home, 'package')
    for (const file of ['dist/hook.cjs', 'dist/mcp.mjs', 'plugins/pixel-pet/assets/slime.json', 'plugins/pixel-pet/assets/duck.json', 'plugins/pixel-pet/assets/alien.json', 'plugins/pixel-pet/skills/pixel-pet/FORMAT.md']) {
      await mkdir(dirname(join(packageRoot, file)), { recursive: true })
      await writeFile(join(packageRoot, file), 'fixture')
    }
    await assert.rejects(() => installBridge(home, packageRoot, join(home, 'missing-codex'), process.execPath), { code: 'ENOENT' })
    assert.equal(await readFile(path, 'utf8'), before)
    await assert.rejects(() => readFile(join(bridgeRoot(home), 'installation.json')), { code: 'ENOENT' })
  } finally { await rm(home, { recursive: true, force: true }) }
})
