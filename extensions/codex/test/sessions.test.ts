import { test, mock } from 'node:test'
import fs from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, appendFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { matchesWorkspace, discoverSessions, SessionTail } from '../sessions'
const record = (type: string, payload: Record<string, unknown>) => JSON.stringify({ type, timestamp: new Date().toISOString(), payload }) + '\n'

test('workspace boundaries distinguish siblings and Windows case; Unix remains case sensitive', () => {
  assert.equal(matchesWorkspace('D:\\RND\\repo\\src', ['d:/rnd/repo']), true)
  assert.equal(matchesWorkspace('D:/rnd/repo-other', ['D:/rnd/repo']), false)
  assert.equal(matchesWorkspace('/Repo', ['/repo']), false)
})

test('discovery excludes other workspaces and CLI unless requested', async () => {
  const home = await mkdtemp(join(tmpdir(), 'pixel-pet-discovery-'))
  try {
    const directory = join(home, 'sessions', '2026', '10', '03')
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'vscode.jsonl'), record('session_meta', { id: 'ide', cwd: 'D:/repo', source: 'vscode' }))
    await writeFile(join(directory, 'cli.jsonl'), record('session_meta', { id: 'cli', cwd: 'D:/repo', source: 'cli' }))
    await writeFile(join(directory, 'other.jsonl'), record('session_meta', { id: 'other', cwd: 'D:/repo2', source: 'vscode' }))
    assert.deepEqual((await discoverSessions(home, ['D:/repo'])).map(s => s.id), ['ide'])
    assert.equal((await discoverSessions(home, ['D:/repo'], true)).length, 2)
  } finally { await rm(home, { recursive: true, force: true }) }
})

test('a session removed between directory listing and stat does not prevent other sessions from being discovered', async () => {
  const home = await mkdtemp(join(tmpdir(), 'pixel-pet-rotation-'))
  const originalStat = fs.stat
  try {
    const directory = join(home, 'sessions', '2026', '10', '04')
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'removed.jsonl'), record('session_meta', { id: 'removed', cwd: 'D:/repo', source: 'vscode' }))
    await writeFile(join(directory, 'valid.jsonl'), record('session_meta', { id: 'valid', cwd: 'D:/repo', source: 'vscode' }))
    mock.method(fs, 'stat', async (path: string) => {
      if (path.endsWith('removed.jsonl')) throw Object.assign(new Error('session removed'), { code: 'ENOENT' })
      return originalStat(path)
    })
    syncBuiltinESMExports()
    assert.deepEqual((await discoverSessions(home, ['D:/repo'])).map(session => session.id), ['valid'])
  } finally { mock.restoreAll(); syncBuiltinESMExports(); await rm(home, { recursive: true, force: true }) }
})

test('tail handles split UTF-8, partial writes, corrupt lines, truncation and output deduplication', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixel-pet-tail-'))
  const path = join(directory, 'session.jsonl')
  try {
    await writeFile(path, record('session_meta', { id: 'test' }))
    const tail = new SessionTail(path)
    assert.equal((await tail.poll()).sessionId, 'test')
    const data = Buffer.from(record('response_item', { type: 'function_call', name: 'read_file', call_id: 'one', arguments: JSON.stringify({ path: 'mèo.ts' }) }))
    const cut = data.indexOf(Buffer.from('è')) + 1
    await appendFile(path, data.subarray(0, cut)); assert.equal((await tail.poll()).tools, 0)
    await appendFile(path, data.subarray(cut)); assert.equal((await tail.poll()).target, 'mèo.ts')
    assert.equal((await tail.poll()).tools, 1)
    await appendFile(path, 'bad json\n' + record('response_item', { type: 'function_call_output', call_id: 'one' }))
    assert.equal((await tail.poll()).tools, 0); assert.equal(tail.malformed, 1)
    await writeFile(path, record('session_meta', { id: 'replacement' }))
    assert.equal((await tail.poll()).sessionId, 'replacement')
    assert.equal((await tail.poll()).working, false)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('oversized unfinished records are skipped without corrupting following events', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pixel-pet-large-'))
  const path = join(directory, 'session.jsonl')
  try {
    await writeFile(path, 'x'.repeat(3 * 1024 * 1024))
    const tail = new SessionTail(path)
    await tail.poll()
    await appendFile(path, '\n' + record('session_meta', { id: 'after-large' }))
    assert.equal((await tail.poll()).sessionId, 'after-large')
  } finally { await rm(directory, { recursive: true, force: true }) }
})
