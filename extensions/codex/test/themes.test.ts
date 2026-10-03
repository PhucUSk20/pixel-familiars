import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { ThemeTools } from '../theme-tools'
import { storedTheme, atomicJson, bridgeRoot } from '../bridge'

test('theme tools preview without applying, apply last preview, survive reconnect and reset', async () => {
  const home = await mkdtemp(join(tmpdir(), 'pixel-pet-theme-'))
  const assets = resolve('plugins/pixel-pet')
  try {
    const tools = new ThemeTools(home, assets)
    await assert.rejects(() => tools.call('set_theme', {}), /preview_theme first/)
    const duck = JSON.parse(await readFile(join(assets, 'assets', 'duck.json'), 'utf8'))
    duck.name = 'Claude duck'
    const preview = await tools.call('preview_theme', { theme: duck, path: '../ignored.html' })
    assert.ok(String(preview.path).startsWith(join(home, 'pixel-pet', 'previews')))
    assert.ok((await readFile(String(preview.path), 'utf8')).includes('Motions'))
    assert.ok((await readFile(String(preview.path), 'utf8')).includes('<title>Claude duck: preview</title>'))
    assert.equal(await storedTheme(home), undefined)
    await tools.call('set_theme', {})
    assert.equal((await storedTheme(home))?.theme !== undefined, true)
    const connected = new ThemeTools(home, assets)
    assert.deepEqual(await connected.current(), (await storedTheme(home))?.theme)
    const before = await storedTheme(home)
    await assert.rejects(() => tools.call('set_theme', { theme: { name: 'missing sprite' } }))
    assert.deepEqual(await storedTheme(home), before)
    await tools.call('set_theme', { theme: null })
    assert.equal((await storedTheme(home))?.theme, null)
    const slime = JSON.parse(await readFile(join(assets, 'assets', 'slime.json'), 'utf8'))
    assert.deepEqual(await connected.current(), slime)
    assert.ok((await connected.format()).includes('sprite'))
  } finally { await rm(home, { recursive: true, force: true }) }
})

test('new MCP theme beats stale active view while get_theme reflects configured file once synchronized', async () => {
  const home = await mkdtemp(join(tmpdir(), 'pixel-pet-active-'))
  try {
    const tools = new ThemeTools(home, resolve('plugins/pixel-pet'))
    const duck = JSON.parse(await readFile('plugins/pixel-pet/assets/duck.json', 'utf8'))
    await atomicJson(join(bridgeRoot(home), 'active-theme.json'), { theme: { name: 'stale' }, revision: 'old', updatedAt: Date.now() + 60000 })
    await tools.call('set_theme', { theme: duck })
    const saved = (await storedTheme(home))!
    assert.deepEqual(await tools.current(), saved.theme)
    await atomicJson(join(bridgeRoot(home), 'active-theme.json'), { theme: duck, revision: saved.revision, updatedAt: Date.now() })
    assert.deepEqual(await tools.current(), duck)
  } finally { await rm(home, { recursive: true, force: true }) }
})
