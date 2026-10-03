// Exercises the bundled host and real Chromium webview using a minimal VS Code API harness.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { readFile, mkdir, mkdtemp, writeFile, appendFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const root = resolve('.')
const directory = await mkdtemp(join(tmpdir(), 'pixel-pet-smoke-'))
const sessions = join(directory, 'sessions', '2026', '10', '03')
await mkdir(sessions, { recursive: true })
const log = join(sessions, 'fixture.jsonl')
const record = (type, payload) => JSON.stringify({ type, timestamp: new Date().toISOString(), payload }) + '\n'
await writeFile(log, record('session_meta', { id: 'smoke-session', cwd: root, source: 'vscode' }))
const subscriptions = []
const commands = new Map()
const terminalCommands = []
const state = new Map()
const options = { codexHome: directory }
let provider, receive, html = '', page
const disposable = () => ({ dispose() {} })
const vscode = {
  extensions: { getExtension: () => undefined },
  Uri: { joinPath: (uri, ...parts) => ({ fsPath: join(uri.fsPath, ...parts) }) },
  workspace: {
    isTrusted: true, workspaceFolders: [{ uri: { fsPath: root } }],
    getConfiguration: () => ({ get: (key, fallback) => options[key] ?? fallback, update: async (key, value) => { options[key] = value } }),
    onDidChangeConfiguration: disposable, onDidChangeWorkspaceFolders: disposable, onDidSaveTextDocument: disposable,
  },
  commands: { registerCommand: (name, handler) => { commands.set(name, handler); return disposable() }, executeCommand: async name => { await commands.get(name)?.() } },
  window: {
    createTerminal: () => ({ show() {}, sendText: command => terminalCommands.push(command) }),
    showInformationMessage: async () => undefined,
    createOutputChannel: () => ({ appendLine: console.log, dispose() {} }),
    registerWebviewViewProvider: (_id, value) => { provider = value; return disposable() },
    showQuickPick: async items => items[0], showErrorMessage: async message => { throw new Error(message) },
  },
  ConfigurationTarget: { Workspace: 2 },
}
const context = { extensionUri: { fsPath: root }, subscriptions, globalState: { get: key => state.get(key), update: async (key, value) => { state.set(key, value) } } }
const host = { exports: {} }
const require = createRequire(import.meta.url)
runInNewContext(await readFile('dist/extension.cjs', 'utf8'), { module: host, exports: host.exports, require: name => name === 'vscode' ? vscode : require(name), process, Buffer, console, setInterval, clearInterval, setTimeout, clearTimeout })
host.exports.activate(context)
const server = createServer(async (request, response) => {
  if (request.url === '/webview.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile('dist/webview.js')) }
  else { response.setHeader('Content-Type', 'text/html'); response.end(html) }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}`
provider.resolveWebviewView({ visible: true, onDidDispose: disposable, webview: {
  set html(value) { html = value },
  asWebviewUri: () => `${url}/webview.js`,
  onDidReceiveMessage: handler => { receive = handler; return disposable() },
  postMessage: async data => { if (page) await page.evaluate(data => window.dispatchEvent(new MessageEvent('message', { data })), data); return true },
} })
let browser, client
try {
  await commands.get('pixelPet.reviewHooks')()
  assert.equal(terminalCommands.length, 1)
  assert.ok(terminalCommands[0].includes("'codex' --no-daemon -C "), 'hook review must work without a packaged daemon')
  assert.ok(terminalCommands[0].includes(root), 'hook review must open the workspace')
  const executablePath = process.env.PIXEL_PET_BROWSER || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
  browser = await chromium.launch({ executablePath, headless: true })
  page = await browser.newPage({ viewport: { width: 640, height: 460 } })
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.exposeFunction('pixelPetBridge', data => receive(data))
  await page.addInitScript(() => { window.acquireVsCodeApi = () => ({ postMessage: data => window.pixelPetBridge(data) }) })
  await page.goto(url)
  await page.waitForFunction(() => document.querySelector('#connection').textContent.includes('smoke-se'))
  await page.waitForFunction(() => document.querySelector('#status').textContent.length > 0)
  await appendFile(log, record('event_msg', { type: 'task_started' }) + record('response_item', { type: 'function_call', call_id: 'test-call', name: 'read_file', arguments: '{"path":"private-name.ts"}' }) + record('event_msg', { type: 'token_count', info: { model_context_window: 100000, last_token_usage: { total_tokens: 25000 } }, rate_limits: { primary: { window_minutes: 300, used_percent: 20 } } }))
  await page.waitForFunction(() => document.querySelector('#hud').textContent.includes('75%'))
  await page.waitForFunction(() => /reading|turning|skimming/.test(document.querySelector('#status').textContent))
  assert.equal((await page.locator('#status').textContent()).includes('private-name'), false)
  const pixels = await page.locator('#stage').evaluate(canvas => [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].filter((v, i) => i % 4 === 3 && v).length)
  assert.ok(pixels > 0, 'pet must paint nontransparent pixels')
  await page.screenshot({ path: 'dist/codex-companion.png' })
  const hook = (hook_event_name, extra = {}) => {
    const output = execFileSync(process.execPath, ['dist/hook.cjs', '--home', directory], { cwd: root, input: JSON.stringify({ hook_event_name, session_id: 'smoke-session', cwd: root, turn_id: 'native-turn', ...extra }), encoding: 'utf8', windowsHide: true })
    assert.deepEqual(JSON.parse(output), {})
  }
  hook('UserPromptSubmit', { prompt: 'private prompt must not persist' })
  hook('PreToolUse', { tool_name: 'apply_patch', tool_use_id: 'nested', tool_input: { command: '*** Update File: private-file.ts' } })
  await page.waitForFunction(() => document.querySelector('#connection').textContent.includes('Direct hooks'))
  await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').endsWith(', edit'))
  assert.equal((await page.locator('#status').textContent()).includes('private-file'), false)
  hook('SubagentStart', { agent_id: 'subagent' })
  await page.waitForFunction(() => document.querySelector('#activity').textContent.includes('1 agent'))
  await page.screenshot({ path: 'dist/codex-direct-hooks.png' })
  hook('SubagentStop', { agent_id: 'subagent', status: 'failed' })
  await page.waitForFunction(() => document.querySelector('#activity').textContent.includes('0 agents'))
  hook('PostToolUse', { tool_name: 'apply_patch', tool_use_id: 'nested', tool_response: { exit_code: 1, output: 'private output' } })
  await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').endsWith(', error'))
  hook('Stop')
  client = new Client({ name: 'pixel-pet-smoke', version: '1.0.0' })
  await client.connect(new StdioClientTransport({ command: process.execPath, args: ['dist/mcp.mjs', '--home', directory, '--assets', join(root, 'plugins/pixel-pet')], cwd: root, stderr: 'pipe' }))
  const names = (await client.listTools()).tools.map(tool => tool.name)
  assert.deepEqual(names, ['get_theme', 'get_theme_format', 'preview_theme', 'set_theme'])
  const duck = JSON.parse(await readFile('plugins/pixel-pet/assets/duck.json', 'utf8'))
  duck.hud = { hp: { label: 'FUEL' }, st: false }
  const preview = await client.callTool({ name: 'preview_theme', arguments: { theme: duck } })
  const previewPath = JSON.parse(preview.content[0].text).path
  assert.ok((await readFile(previewPath, 'utf8')).includes('Codex'))
  const applied = await client.callTool({ name: 'set_theme', arguments: {} })
  assert.equal(applied.isError, undefined)
  await page.waitForFunction(() => document.querySelector('#hud').textContent.includes('FUEL'))
  const readResource = await client.readResource({ uri: 'pixel-pet://theme-format' })
  assert.ok(readResource.contents[0].text.includes('sprite'))
  const reset = await client.callTool({ name: 'set_theme', arguments: { theme: null } })
  assert.equal(reset.isError, undefined)
  await page.waitForFunction(() => !document.querySelector('#hud').textContent.includes('FUEL'))
  await page.click('#demo')
  await page.waitForFunction(() => document.querySelector('#connection').textContent.includes('simulated'))
  await page.click('#demo')
  await page.waitForFunction(() => document.querySelector('#connection').textContent.includes('Following latest'))
  await commands.get('pixelPet.selectSession')()
  const theme = JSON.parse(await readFile('plugins/pixel-pet/assets/alien.json', 'utf8'))
  theme.name = '<script>throw new Error("injected")</script>'
  await page.evaluate(theme => window.dispatchEvent(new MessageEvent('message', { data: { type: 'theme', theme } })), theme)
  await page.waitForTimeout(250)
  assert.deepEqual(errors, [])
  // Closing the companion stops its observer before this browser opens the standalone preview.
  provider.dispose()
  await page.waitForTimeout(300)
  await page.goto('file:///' + join(root, 'tools/preview/preview.html').replaceAll('\\', '/'))
  await page.waitForTimeout(400)
  assert.deepEqual(errors, [], 'upstream preview must run without JS errors')
  console.log('PASS: Chromium + bundled host, JSONL fallback, hook subprocess/nested tools, subagent lifecycle/error, MCP stdio theme preview/apply/reset/resources, HUD/privacy/demo and upstream preview. Screenshot: dist/codex-companion.png')
} finally {
  for (const subscription of subscriptions) subscription.dispose()
  await client?.close()
  await browser?.close()
  await new Promise(done => server.close(done))
  await rm(directory, { recursive: true, force: true })
}
