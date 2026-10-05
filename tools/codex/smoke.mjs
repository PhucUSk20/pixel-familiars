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
import { build } from 'esbuild'

const root = resolve('.')
// Fresh clones do not contain the ignored upstream preview artifact.
execFileSync(process.execPath, [join(root, 'tools/preview/build.mjs')], { cwd: root, stdio: 'pipe', windowsHide: true })
const directory = await mkdtemp(join(tmpdir(), 'pixel-pet-smoke-'))
const gallery = await build({ tsconfig: 'tsconfig.codex.json', bundle: true, write: false, format: 'esm', platform: 'browser', stdin: { resolveDir: root, contents: `
  import { INTERACTIONS, interactionFrame, interactionMain, drawInteraction } from './extensions/codex/interactions';
  import { animate, readTheme } from './plugins/pixel-pet/hooks/theme';
  import { drawBand, layScene } from './plugins/pixel-pet/hooks/scene';
  import { bundledTheme } from './extensions/codex/scene-theme';
  const body = animate(readTheme(bundledTheme(${await readFile('plugins/pixel-pet/assets/slime.json', 'utf8')})).theme);
  const started = Date.now();
  for (const kind of INTERACTIONS) {
    const cell = document.createElement('div');
    const label = document.createElement('p'); label.textContent = kind;
    const canvas = document.createElement('canvas'); canvas.width = 48 * 6; canvas.height = 22 * 6;
    cell.append(label, canvas); document.body.append(cell);
    function paint() {
      const elapsed = window.galleryAt ?? (Date.now() - started) % 7000;
      const frame = interactionFrame(kind, elapsed, 48, 5);
      const band = drawBand(body, body.scene, layScene(body.scene, 48), interactionMain(body, frame), Math.round(frame.main.x), elapsed);
      drawInteraction(body, band, frame);
      const context = canvas.getContext('2d'); context.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < band.h; y++) for (let x = 0; x < band.w; x++) {
        const pixel = band.px[y * band.w + x];
        if (pixel < 0) continue;
        context.fillStyle = '#' + (pixel & 0xffffff).toString(16).padStart(6, '0'); context.fillRect(x * 6, y * 6, 6, 6);
      }
    }
    paint(); setInterval(paint, 100);
  }
  document.body.dataset.ready = 'true';
` } })
const sessions = join(directory, 'sessions', '2026', '10', '03')
await mkdir(sessions, { recursive: true })
const log = join(sessions, 'fixture.jsonl')
const record = (type, payload) => JSON.stringify({ type, timestamp: new Date().toISOString(), payload }) + '\n'
await writeFile(log, record('session_meta', { id: 'smoke-session', cwd: root, source: 'vscode' }))
const subscriptions = []
const commands = new Map()
const terminalCommands = []
const webviewMessages = []
const editorEvents = new Map()
const event = name => handler => { const handlers = editorEvents.get(name) ?? new Set(); handlers.add(handler); editorEvents.set(name, handlers); return { dispose: () => handlers.delete(handler) } }
const emit = (name, value) => { for (const handler of editorEvents.get(name) ?? []) handler(value) }
const folder = { name: 'fixture', uri: { fsPath: root, path: root.replaceAll('\\', '/') } }
const fileUri = { fsPath: join(root, 'fixture.ts'), path: root.replaceAll('\\', '/') + '/fixture.ts' }
const checkTask = { name: 'test', source: 'npm', definition: { script: 'test' }, scope: folder }
let diagnostics = []
const executedTasks = []
const state = new Map()
const workspaceState = new Map()
const options = { codexHome: directory }
let pickLabel
let provider, legendaryProvider, receive, html = '', legendaryMarkup = '', page
const disposable = () => ({ dispose() {} })
const vscode = {
  extensions: { getExtension: () => undefined },
  Uri: { joinPath: (uri, ...parts) => ({ fsPath: join(uri.fsPath, ...parts) }) },
  workspace: {
    isTrusted: true, workspaceFolders: [folder],
    getWorkspaceFolder: uri => uri.fsPath?.startsWith(root) ? folder : undefined,
    createFileSystemWatcher: () => ({ dispose() {}, onDidChange: event('fileChange'), onDidCreate: event('fileCreate'), onDidDelete: event('fileDelete') }),
    onDidChangeTextDocument: event('textChange'),
    getConfiguration: () => ({ get: (key, fallback) => options[key] ?? fallback, update: async (key, value) => { options[key] = value } }),
    onDidChangeConfiguration: disposable, onDidChangeWorkspaceFolders: disposable, onDidSaveTextDocument: disposable,
  },
  languages: { getDiagnostics: () => diagnostics, onDidChangeDiagnostics: event('diagnostics') },
  DiagnosticSeverity: { Error: 0, Warning: 1 },
  TaskScope: { Workspace: 2 }, TaskGroup: { Build: { id: 'build' }, Test: { id: 'test' } },
  ShellExecution: class {}, ProcessExecution: class {},
  tasks: { taskExecutions: [], fetchTasks: async () => [checkTask], onDidStartTask: event('taskStart'), onDidEndTaskProcess: event('taskProcessEnd'), onDidEndTask: event('taskEnd'), executeTask: async task => { const execution = { task }; executedTasks.push(execution); emit('taskStart', { execution }); return execution } },
  commands: { registerCommand: (name, handler) => { commands.set(name, handler); return disposable() }, executeCommand: async name => { await commands.get(name)?.() } },
  window: {
    terminals: [],
    createTerminal: () => ({ show() {}, sendText: command => terminalCommands.push(command) }),
    showInformationMessage: async () => undefined,
    createOutputChannel: () => ({ appendLine: console.log, dispose() {} }),
    registerWebviewViewProvider: (id, value) => { if (id === 'pixelPet.companion') provider = value; if (id === 'pixelPet.legendary') legendaryProvider = value; return disposable() },
    showQuickPick: async items => pickLabel ? items.find(item => item.label === pickLabel) : items[0], showErrorMessage: async message => { throw new Error(message) },
  },
  ConfigurationTarget: { Workspace: 2 },
}
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
const context = { extension: { packageJSON: manifest }, extensionUri: { fsPath: root }, subscriptions, globalState: { get: key => state.get(key), update: async (key, value) => { state.set(key, value) } }, workspaceState: { get: key => workspaceState.get(key), update: async (key, value) => { workspaceState.set(key, value) } } }
const host = { exports: {} }
const require = createRequire(import.meta.url)
runInNewContext(await readFile('dist/extension.cjs', 'utf8'), { module: host, exports: host.exports, require: name => name === 'vscode' ? vscode : require(name), process, Buffer, console, setInterval, clearInterval, setTimeout, clearTimeout })
host.exports.activate(context)
const server = createServer(async (request, response) => {
  if (request.url === '/gallery.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(gallery.outputFiles[0].text) }
  else if (request.url === '/gallery') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><style>body{background:#14171f;color:#ddd;display:grid;grid-template-columns:repeat(4,288px);gap:12px;font:16px monospace}p{text-align:center}canvas{background:#191c24}</style><script type="module" src="/gallery.js"></script>') }
  else if (request.url === '/webview.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile('dist/webview.js')) }
  else if (request.url === '/legendary.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile('dist/legendary.js')) }
  else if (request.url === '/legendary.png') { response.setHeader('Content-Type', 'image/png'); response.end(await readFile('extensions/codex/legendary-128px-atlas.png')) }
  else if (request.url === '/legendary') { response.setHeader('Content-Type', 'text/html'); response.end(legendaryMarkup) }
  else { response.setHeader('Content-Type', 'text/html'); response.end(html) }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}`
legendaryProvider.resolveWebviewView({ webview: {
  cspSource: url,
  set options(value) {},
  set html(value) { legendaryMarkup = value },
  asWebviewUri: uri => `${url}/${uri.fsPath.endsWith('.png') ? 'legendary.png' : 'legendary.js'}`,
} })
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
  assert.ok(terminalCommands[0].includes("'codex' -C "), 'hook review must open interactive CLI')
  assert.ok(terminalCommands[0].includes(root), 'hook review must open the workspace')
  const executablePath = process.env.PIXEL_PET_BROWSER || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
  browser = await chromium.launch({ executablePath, headless: true })
  const legendaryPage = await browser.newPage({ viewport: { width: 700, height: 320 } })
  const legendaryErrors = []
  legendaryPage.on('pageerror', error => legendaryErrors.push(String(error)))
  await legendaryPage.goto(`${url}/legendary`)
  await legendaryPage.waitForFunction(() => document.querySelector('#legendary').dataset.ready === 'true')
  assert.equal(await legendaryPage.locator('#legendary').getAttribute('data-action'), 'fly')
  await legendaryPage.locator('button[data-action="original"]').click()
  await legendaryPage.waitForFunction(() => document.querySelector('#legendary').dataset.transition === 'false')
  assert.equal(await legendaryPage.locator('#legendary').getAttribute('data-action'), 'original')
  const firstOriginal = await legendaryPage.locator('#legendary').getAttribute('data-frame')
  await legendaryPage.waitForFunction(frame => document.querySelector('#legendary').dataset.frame !== frame, firstOriginal)
  await legendaryPage.locator('#pause').click()
  const frozen = await legendaryPage.locator('#legendary').getAttribute('data-elapsed')
  await legendaryPage.waitForTimeout(200)
  assert.equal(await legendaryPage.locator('#legendary').getAttribute('data-elapsed'), frozen)
  for (const viewport of [{ width: 240, height: 360 }, { width: 1600, height: 230 }]) {
    await legendaryPage.setViewportSize(viewport)
    await legendaryPage.waitForTimeout(100)
    assert.equal(await legendaryPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'legendary toolbar must wrap without horizontal overflow')
    assert.equal(await legendaryPage.locator('#legendary').evaluate(canvas => canvas.width > 0 && canvas.height > 0), true)
    assert.equal(await legendaryPage.locator('#legendary').evaluate(canvas => [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].some((value, index) => index % 4 === 3 && value > 0)), true, 'resizing a paused legendary must redraw rather than blank the canvas')
  }
  assert.deepEqual(legendaryErrors, [])
  await legendaryPage.setViewportSize({ width: 700, height: 320 })
  await legendaryPage.waitForTimeout(100)
  assert.equal(await legendaryPage.locator('#legendary').evaluate(canvas => {
    const expected = document.createElement('canvas'); expected.width = canvas.width; expected.height = canvas.height
    const context = expected.getContext('2d'); context.imageSmoothingEnabled = false
    const frame = Number(canvas.dataset.frame), available = Math.max(1, Math.min(canvas.width - 8, canvas.height - 6))
    const scale = Math.min(3, available / 192), size = 192 * scale
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 192
    sprite.getContext('2d').drawImage(document.querySelector('#atlas'), (frame % 16) * 128, Math.floor(frame / 16) * 128, 128, 128, 32, 24, 128, 128)
    context.drawImage(sprite, Math.round((canvas.width - size) / 2), Math.round((canvas.height - size) / 2), size, size)
    return expected.toDataURL() === canvas.toDataURL()
  }), true, 'display must match the original 128px frame exactly, with no redrawn anatomy')
  await legendaryPage.locator('#pause').click()
  const actionFrames = new Set()
  for (const action of ['fly', 'sleep', 'roar', 'pulse', 'dash']) {
    await legendaryPage.locator(`button[data-action="${action}"]`).click()
    await legendaryPage.waitForFunction(() => document.querySelector('#legendary').dataset.transition === 'false')
    assert.equal(await legendaryPage.locator('#legendary').getAttribute('data-action'), action)
    actionFrames.add(await legendaryPage.locator('#legendary').evaluate(canvas => canvas.toDataURL()))
  }
  assert.equal(actionFrames.size, 5)
  await legendaryPage.locator('#pause').click()
  await legendaryPage.locator('button[data-action="sleep"]').click()
  const still = await legendaryPage.locator('#legendary').evaluate(canvas => canvas.toDataURL())
  assert.equal(await legendaryPage.locator('#legendary').getAttribute('data-transition'), 'true')
  await legendaryPage.waitForTimeout(150)
  assert.equal(await legendaryPage.locator('#legendary').evaluate(canvas => canvas.toDataURL()), still, 'a paused transition must not advance')
  await legendaryPage.locator('#pause').click()
  await legendaryPage.waitForFunction(() => document.querySelector('#legendary').dataset.transition === 'false')
  assert.deepEqual(legendaryErrors, [])
  await legendaryPage.screenshot({ path: 'dist/legendary-preview.png' })
  await legendaryPage.close()
  console.log('PASS: original 128px fidelity, five source-textured actions, continuous transitions, pause and responsive layouts')
  page = await browser.newPage({ viewport: { width: 640, height: 460 } })
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.exposeFunction('pixelPetBridge', data => { webviewMessages.push(data); return receive(data) })
  await page.addInitScript(() => { window.acquireVsCodeApi = () => ({ postMessage: data => window.pixelPetBridge(data) }) })
  await page.goto(url)
  assert.equal(await page.locator('#extension-version').textContent(), `Pixel Pet · Extension v${manifest.version}`)
  await page.waitForFunction(() => document.querySelector('#connection').textContent.includes('smoke-se'))
  await page.waitForFunction(() => document.querySelector('#status').textContent.length > 0)
  await page.waitForFunction(() => document.querySelector('#stage').dataset.scene === 'on')
  const beforeMini = webviewMessages.length
  const initialHud = await page.locator('#hud').textContent()
  await page.click('#mini-stage')
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.action === 'pet')
  await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').endsWith(', cheer'))
  await page.click('#mini-feed')
  await page.waitForFunction(() => document.querySelector('#stage').dataset.interaction === 'feed' && document.querySelector('#mini-bubble').textContent.includes('shares a snack'))
  await page.screenshot({ path: 'dist/codex-feed.png' })
  await page.click('#mini-play')
  await page.waitForFunction(() => document.querySelector('#stage').dataset.interaction === 'play')
  assert.ok((await page.locator('#activity').textContent()).includes('0 active agents'), 'local playmate must not count as a subagent')
  assert.equal(await page.locator('#hud').textContent(), initialHud, 'local play cannot change context or quota')
  const miniBox = await page.locator('#mini-stage').boundingBox()
  const startMiniX = await page.locator('#mini-stage').evaluate(element => Number(element.dataset.x))
  assert.equal(await page.locator('#mini-yard').count(), 0, 'mini must not have a separate scene')
  assert.ok(await page.locator('#mini-stage').evaluate(element => element.parentElement.id === 'scene-stage'), 'mini controls must overlay the shared stage')
  await page.mouse.move(miniBox.x + miniBox.width / 2, miniBox.y + miniBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(miniBox.x + miniBox.width / 2 + 70, miniBox.y + miniBox.height / 2, { steps: 5 })
  await page.mouse.up()
  assert.ok(await page.locator('#mini-stage').evaluate(element => Number(element.dataset.x)) > startMiniX, 'mini must move when dragged')
  await page.locator('#mini-stage').focus()
  const draggedLeft = await page.locator('#mini-stage').evaluate(element => Number(element.dataset.x))
  await page.keyboard.press('ArrowLeft')
  assert.ok(await page.locator('#mini-stage').evaluate(element => Number(element.dataset.x)) < draggedLeft, 'mini movement must support the keyboard')
  await page.click('#mini-play')
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.near === 'true' && document.querySelector('#mini-bubble').textContent.includes('play together'))
  await page.click('#mini-sleep')
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.action === 'sleep')
  assert.equal(await page.locator('#mini-sleep').textContent(), 'Wake')
  await page.click('#mini-sleep')
  await page.waitForFunction(() => document.querySelector('#mini-sleep').textContent === 'Rest')
  await page.waitForFunction(() => document.querySelector('#mini-stage').getAttribute('aria-label').includes('wake'))
  await page.click('#mini-play')
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.near === 'true' && document.querySelector('#status').textContent.includes('play together'))
  await page.waitForTimeout(150)
  assert.deepEqual(webviewMessages.slice(beforeMini).map(message => message.type), ['projectInspect'], 'mini click opens local results; play/feed/drag/rest never request a model or host action')
  await page.screenshot({ path: 'dist/codex-mini-playmate.png' })
  assert.equal(executedTasks.length, 0, 'project observer must never launch tasks')
  assert.equal(await page.locator('#mini-check').count(), 0, 'automatic Mini must not require a Check button')
  await page.waitForFunction(() => document.querySelector('#mini-project').textContent.includes('Watching project automatically'))
  diagnostics = [[fileUri, [{ severity: 0 }, { severity: 1 }]]]; emit('diagnostics')
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.project === 'issues' && document.querySelector('#mini-project').textContent.includes('1 error'))
  await page.click('#mini-review')
  assert.ok(webviewMessages.some(message => message.type === 'projectInspect'))
  diagnostics = []; emit('diagnostics')
  const failing = { task: checkTask }; emit('taskStart', { execution: failing })
  await page.waitForFunction(() => document.querySelector('#mini-project').textContent.includes('check running'))
  emit('taskProcessEnd', { execution: failing, exitCode: 1 }); emit('taskEnd', { execution: failing })
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.project === 'issues' && document.querySelector('#mini-project').textContent.includes('failed check'))
  const passing = { task: checkTask }; emit('taskStart', { execution: passing }); emit('taskProcessEnd', { execution: passing, exitCode: 0 }); emit('taskEnd', { execution: passing })
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.project === 'verified')
  await page.screenshot({ path: 'dist/codex-project-verified.png' })
  emit('textChange', { document: { uri: fileUri }, contentChanges: [{ text: 'modified' }] })
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.project === 'unverified')
  const commandItem = (id, started, exit_code, cwd = root) => record('event_msg', { type: 'item_completed', started_at_ms: started, item: { type: 'CommandExecution', id, cwd, command: ['powershell.exe', '-Command', 'npm.cmd test'], exit_code, status: exit_code ? 'failed' : 'completed', stdout: 'private output must not be retained' } })
  const beforeAutomatic = webviewMessages.length
  await appendFile(log, commandItem('auto-fail', Date.now(), 1))
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.project === 'issues' && document.querySelector('#mini-project').textContent.includes('failed check'))
  await appendFile(log, commandItem('auto-pass', Date.now(), 0))
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.project === 'verified')
  await page.waitForFunction(() => document.querySelector('#mini-bubble').textContent.includes('celebrates'))
  await page.waitForTimeout(2300)
  await page.screenshot({ path: 'dist/codex-project-automatic.png' })
  emit('textChange', { document: { uri: fileUri }, contentChanges: [{ text: 'modified again' }] })
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.project === 'unverified')
  await page.waitForTimeout(350)
  assert.equal(await page.locator('#mini-stage').getAttribute('data-project'), 'unverified', 'polling an old success cannot verify edited code')
  await appendFile(log, commandItem('unrelated-workspace', Date.now(), 0, 'D:/other-project'))
  await page.waitForTimeout(350)
  assert.equal(await page.locator('#mini-stage').getAttribute('data-project'), 'unverified', 'checks outside this workspace cannot verify its project')
  assert.equal(executedTasks.length, 0, 'automatic check observation must never launch a task')
  assert.equal(webviewMessages.length, beforeAutomatic, 'automatic results cannot request a host action or model turn')
  emit('diagnostics')
  await page.waitForTimeout(150)
  const questionPixels = await page.locator('#stage').evaluate(canvas => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    let count = 0
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] === 232 && pixels[i + 1] === 199 && pixels[i + 2] === 121 && pixels[i + 3]) count++
    return count
  })
  assert.equal(questionPixels, 0, 'an unverified project mini must stay neutral without a question mark')
  assert.equal(await page.locator('#hud').textContent(), initialHud, 'project state must never change quota')
  const scenePixels = await page.locator('#stage').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    const count = color => { let n = 0; for (let i = 0; i < data.length; i += 4) if (data[i] === color[0] && data[i + 1] === color[1] && data[i + 2] === color[2] && data[i + 3]) n++; return n }
    return { ground: count([49, 91, 53]), sky: count([255, 226, 138]), rock: count([120, 131, 140]), sunHighlight: count([255, 244, 186]), tree: count([141, 98, 61]) }
  })
  assert.ok(scenePixels.ground > 0 && scenePixels.sky > 0 && scenePixels.rock > 0, 'default meadow must visibly paint ground, sky and obstacles')
  assert.ok(scenePixels.sunHighlight > 0 && scenePixels.tree > 0, 'round shaded sun and trees must be visible in the shared stage')
  const idleZones = await page.locator('#stage').evaluate(stage => JSON.parse(stage.dataset.workZones))
  assert.deepEqual(idleZones, [], 'work buildings are temporarily disabled')
  assert.ok((await page.locator('#activity').textContent()).startsWith('0 active tools'), 'idle work buildings cannot create artificial activity')
  await page.screenshot({ path: 'dist/codex-meadow.png' })
  pickLabel = 'No scene'
  await page.click('#scene')
  await page.waitForFunction(() => document.querySelector('#stage').dataset.scene === 'off')
  assert.equal(await page.locator('#stage').getAttribute('data-work-zones'), '[]', 'No scene hides permanent buildings')
  pickLabel = 'Meadow'
  await page.click('#scene')
  await page.waitForFunction(() => document.querySelector('#stage').dataset.scene === 'on')
  pickLabel = 'Alien'
  await page.click('#pet')
  await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').startsWith('alien,'))
  await page.screenshot({ path: 'dist/codex-alien.png' })
  pickLabel = undefined
  await page.click('#reset')
  await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').startsWith('slime,'))
  await appendFile(log, record('event_msg', { type: 'task_started' }) + record('response_item', { type: 'function_call', call_id: 'test-call', name: 'read_file', arguments: '{"path":"private-name.ts"}' }) + record('event_msg', { type: 'token_count', info: { model_context_window: 100000, last_token_usage: { total_tokens: 25000 } }, rate_limits: { primary: { window_minutes: 300, used_percent: 20 } } }))
  await page.waitForFunction(() => document.querySelector('#hud').textContent.includes('75%'))
  await page.waitForFunction(() => /reading|turning|skimming/.test(document.querySelector('#status').textContent))
  await page.click('#mini-feed')
  await page.waitForFunction(() => document.querySelector('#mini-stage').dataset.action === 'feed')
  assert.ok((await page.locator('#stage').getAttribute('aria-label')).endsWith(', read'), 'local play must not hide a live Codex tool')
  assert.equal((await page.locator('#status').textContent()).includes('private-name'), false)
  const pixels = await page.locator('#stage').evaluate(canvas => [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].filter((v, i) => i % 4 === 3 && v).length)
  assert.ok(pixels > 0, 'pet must paint nontransparent pixels')
  await page.screenshot({ path: 'dist/codex-companion.png' })
  await appendFile(log, record('response_item', { type: 'function_call_output', call_id: 'test-call', output: '{}' }))
  for (const [mode, source] of [['read', 'await tools.exec_command({cmd: "Get-Content app.ts"})'], ['search', 'await tools.exec_command({cmd: "rg theme"})'], ['web', 'await tools.web__run({})'], ['edit', 'await tools.apply_patch("patch")']]) {
    await appendFile(log, record('response_item', { type: 'custom_tool_call', call_id: `fallback-${mode}`, name: 'functions.exec', input: source }))
    await page.waitForFunction(mode => document.querySelector('#stage').getAttribute('aria-label').endsWith(`, ${mode}`), mode)
    assert.ok((await page.locator('#connection').textContent()).includes('Log fallback'))
    await appendFile(log, record('response_item', { type: 'custom_tool_call_output', call_id: `fallback-${mode}`, output: '{}' }))
  }
  await appendFile(log, record('response_item', { type: 'function_call', call_id: 'fast-tool', name: 'read_file', arguments: '{}' }) + record('response_item', { type: 'function_call_output', call_id: 'fast-tool', output: '{}' }))
  await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').endsWith(', read') && document.querySelector('#activity').textContent.startsWith('0 active tools'))
  const beforeWorkers = webviewMessages.length
  for (const [id, name, args] of [['worker-read', 'read_file', '{}'], ['worker-edit', 'apply_patch', '{}'], ['worker-run', 'exec_command', '{"cmd":"npm test"}']]) {
    await appendFile(log, record('response_item', { type: 'function_call', call_id: id, name, arguments: args }))
  }
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('3 active tools') && document.querySelector('#stage').dataset.taskMinis === '3')
  assert.deepEqual(await page.locator('#task-minis [data-state=running]').evaluateAll(elements => elements.map(element => element.dataset.mode).sort()), ['bash', 'edit', 'read'])
  assert.ok((await page.locator('#activity').textContent()).includes('0 active agents'), 'workers must not invent subagents')
  await page.waitForFunction(() => JSON.parse(document.querySelector('#stage').dataset.workers).filter(worker => worker.visible).length === 3 && JSON.parse(document.querySelector('#stage').dataset.workers).every(worker => worker.phase === 'work'))
  const workplaces = await page.locator('#stage').evaluate(stage => JSON.parse(stage.dataset.workers))
  assert.deepEqual(workplaces.map(worker => worker.zone).sort(), ['Library', 'Terminal', 'Writing desk'])
  const byZone = new Map(workplaces.map(worker => [worker.zone, worker.goal]))
  assert.ok(byZone.get('Library') < byZone.get('Writing desk') && byZone.get('Writing desk') < byZone.get('Terminal'))
  await page.screenshot({ path: 'dist/codex-parallel-workers.png' })
  await appendFile(log, record('response_item', { type: 'function_call_output', call_id: 'worker-read', output: '{}' }))
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('2 active tools') && document.querySelector('#task-minis [data-mode=read][data-state=finished]'))
  for (const id of ['worker-edit', 'worker-run']) await appendFile(log, record('response_item', { type: 'function_call_output', call_id: id, output: '{}' }))
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('0 active tools'))
  await appendFile(log, record('event_msg', { type: 'task_complete' }))
  await page.waitForFunction(() => JSON.parse(document.querySelector('#stage').dataset.workers).some(worker => worker.phase === 'handoff') && document.querySelector('#stage').getAttribute('aria-label').endsWith(', cheer'))
  await page.screenshot({ path: 'dist/codex-worker-delivery.png' })
  await page.waitForFunction(() => document.querySelector('#stage').dataset.taskMinis === '0')
  await appendFile(log, record('event_msg', { type: 'item_completed', item: { type: 'FileChange', id: 'precise-edit', status: 'completed', changes: { 'private-file.ts': { diff: 'private patch' } } } }))
  await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').endsWith(', edit') && document.querySelector('#task-minis [data-mode=edit][data-state=finished]'))
  assert.ok((await page.locator('#activity').textContent()).startsWith('0 active tools'), 'a completed item must not become a running task')
  assert.equal((await page.locator('#task-minis').textContent()).includes('private'), false)
  await page.waitForFunction(() => document.querySelector('#stage').dataset.taskMinis === '0')
  assert.equal(webviewMessages.length, beforeWorkers, 'worker animation cannot request host actions or a model')
  await page.waitForFunction(() => JSON.parse(document.querySelector('#stage').dataset.workers).length === 0)
  // The actual exec response wraps execution envelopes in text blocks. A returned
  // wrapper is not a completed OS process; its numeric handle owns the lifecycle.
  const processes = [8123, 8456].map(session_id => ({ type: 'text', text: JSON.stringify({ chunk_id: 'yield', session_id, wall_time_seconds: 10, output: 'private process output' }) }))
  await appendFile(log, record('response_item', { type: 'custom_tool_call', call_id: 'background-wrapper', name: 'functions.exec', input: 'private source' }) + record('response_item', { type: 'custom_tool_call_output', call_id: 'background-wrapper', output: processes }))
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('2 active tools') && JSON.parse(document.querySelector('#stage').dataset.workers).some(worker => worker.phase === 'summon'))
  const portals = await page.locator('#stage').evaluate(stage => ({ main: Number(stage.dataset.mainX), workers: JSON.parse(stage.dataset.workers) }))
  assert.deepEqual(portals.workers.map(worker => worker.id), ['process:8123', 'process:8456'])
  assert.ok(portals.workers.every(worker => Math.abs(worker.origin - portals.main) <= 60), 'workers summon beside the AI pet instead of a fixed canvas edge')
  assert.equal(new Set(portals.workers.map(worker => worker.origin)).size, 2, 'parallel workers have separate circles')
  await page.waitForFunction(() => JSON.parse(document.querySelector('#stage').dataset.workers).every(worker => worker.phase === 'summon' && Date.now() - worker.born >= 700))
  await page.screenshot({ path: 'dist/codex-summoning.png' })
  await page.waitForFunction(() => JSON.parse(document.querySelector('#stage').dataset.workers).every(worker => worker.phase === 'work' || worker.phase === 'travel'))
  await appendFile(log, record('event_msg', { type: 'task_complete' }))
  await page.waitForTimeout(500)
  assert.ok((await page.locator('#activity').textContent()).startsWith('2 active tools'), 'background processes survive ordinary turn completion')
  await page.screenshot({ path: 'dist/codex-background-workers.png' })
  await appendFile(log, record('event_msg', { type: 'item_completed', item: { id: 'background-first', type: 'CommandExecution', process_id: '8123', command: 'npm test', exit_code: 0, status: 'completed' } }))
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('1 active tool') && document.querySelector('#task-minis [data-state=finished]'))
  await appendFile(log, record('event_msg', { type: 'item_completed', item: { id: 'background-second', type: 'CommandExecution', process_id: '8456', command: 'npm test', exit_code: 0, status: 'completed' } }))
  await page.waitForFunction(() => document.querySelector('#stage').dataset.taskMinis === '0')
  assert.equal(webviewMessages.length, beforeWorkers, 'summoning and process tracking stay local')
  await page.waitForFunction(() => JSON.parse(document.querySelector('#stage').dataset.workers).length === 0)
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
  await page.waitForFunction(() => document.querySelector('#activity').textContent.includes('1 active agent'))
  await page.screenshot({ path: 'dist/codex-direct-hooks.png' })
  hook('SubagentStop', { agent_id: 'subagent', status: 'failed' })
  await page.waitForFunction(() => document.querySelector('#activity').textContent.includes('0 active agents'))
  hook('PostToolUse', { tool_name: 'apply_patch', tool_use_id: 'nested', tool_response: { exit_code: 1, output: 'private output' } })
  await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').endsWith(', error'))
  hook('Stop')
  hook('UserPromptSubmit')
  hook('PreToolUse', { tool_name: 'functions.exec', tool_use_id: 'orchestrator', tool_input: 'private code' })
  for (const [id, name] of [['native-read', 'read_file'], ['native-edit', 'apply_patch'], ['native-run', 'exec_command']]) hook('PreToolUse', { tool_name: name, tool_use_id: id })
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('3 active tools') && document.querySelector('#stage').dataset.taskMinis === '3')
  assert.equal(await page.locator('#task-minis [data-state=running]').count(), 3, 'native children suppress their wrapper')
  hook('PostToolUse', { tool_name: 'apply_patch', tool_use_id: 'native-edit', tool_response: { exit_code: 1 } })
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('2 active tools') && document.querySelector('#task-minis [data-mode=edit][data-state=failed]'))
  await page.locator('#task-minis [data-mode=edit][data-state=failed]').last().click()
  assert.ok((await page.locator('#worker-result-title').textContent()).includes('Failed'))
  assert.ok(/\d+s/.test(await page.locator('#worker-result-text').textContent()))
  assert.equal((await page.locator('#worker-result').textContent()).includes('private'), false)
  await page.locator('#worker-result-close').click()
  await page.waitForFunction(() => document.querySelector('.worker-error'))
  await page.locator('.worker-error').first().click()
  assert.equal(await page.locator('#worker-result').isVisible(), true)
  await page.screenshot({ path: 'dist/codex-worker-error.png' })
  await page.locator('#worker-result-close').click()
  hook('Interrupt')
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('0 active tools') && document.querySelector('#task-minis [data-state=stopped]'))
  await page.waitForFunction(() => document.querySelector('#stage').dataset.taskMinis === '0')
  hook('UserPromptSubmit')
  hook('PreToolUse', { tool_name: 'exec_command', tool_use_id: 'native-background' })
  hook('PostToolUse', { tool_name: 'exec_command', tool_use_id: 'native-background', tool_response: processes.slice(0, 1).map(item => ({ ...item, text: JSON.stringify({ chunk_id: 'yield', session_id: 9876, output: 'private output' }) })) })
  await appendFile(log, record('response_item', { type: 'function_call', call_id: 'native-background', name: 'exec_command', arguments: '{}' }) + record('response_item', { type: 'function_call_output', call_id: 'native-background', output: JSON.stringify({ chunk_id: 'yield', session_id: 9876 }) }))
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('1 active tool') && document.querySelector('#stage').dataset.taskMinis === '1')
  hook('PreToolUse', { tool_name: 'write_stdin', tool_use_id: 'native-poll', tool_input: { session_id: 9876 } })
  await page.waitForTimeout(350)
  assert.ok((await page.locator('#activity').textContent()).startsWith('1 active tool'), 'native polling cannot duplicate a background worker')
  hook('PostToolUse', { tool_name: 'write_stdin', tool_use_id: 'native-poll', tool_input: { session_id: 9876 }, tool_response: { chunk_id: 'exit', exit_code: 0 } })
  await appendFile(log, record('event_msg', { type: 'item_completed', item: { id: 'native-background-item', type: 'CommandExecution', process_id: '9876', command: 'npm test', exit_code: 0, status: 'completed' } }))
  await page.waitForFunction(() => document.querySelector('#stage').dataset.taskMinis === '0' && document.querySelector('#activity').textContent.startsWith('0 active tools'))
  for (const [name, input, mode] of [['read_file', {}, 'read'], ['exec_command', { cmd: 'rg theme' }, 'search'], ['web__run', {}, 'web'], ['apply_patch', {}, 'edit'], ['exec_command', { cmd: 'npm test' }, 'bash']]) {
    hook('UserPromptSubmit')
    hook('PreToolUse', { tool_name: name, tool_use_id: `motion-${mode}`, tool_input: input })
    await page.waitForFunction(mode => document.querySelector('#stage').getAttribute('aria-label').endsWith(`, ${mode}`), mode)
    if (mode === 'bash') {
      // Reset while work holds the habitat paused; idle walkers otherwise restore
      // their independent position before the obstacle traversal is exercised.
      await page.click('#reset')
      await page.waitForFunction(() => Number(document.querySelector('#stage').dataset.mainX) === 0 && document.querySelector('#stage').getAttribute('aria-label').endsWith(', bash'))
    }
    await page.screenshot({ path: `dist/codex-motion-${mode}.png` })
    hook('PostToolUse', { tool_use_id: `motion-${mode}`, tool_name: name, tool_response: {} })
    await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').endsWith(', run'))
    if (mode === 'bash') await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').endsWith(', jump'))
    hook('Stop')
  }
  hook('UserPromptSubmit')
  hook('PreCompact')
  await page.waitForFunction(() => document.querySelector('#stage').getAttribute('aria-label').endsWith(', compacting'))
  await page.screenshot({ path: 'dist/codex-compacting.png' })
  const bathPosition = () => page.locator('#stage').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    for (let i = 0; i < data.length; i += 4) if (data[i] === 80 && data[i + 1] === 142 && data[i + 2] === 180 && data[i + 3]) return (i / 4) % canvas.width
    return -1
  })
  const restingAt = await bathPosition()
  assert.ok(restingAt >= 0, 'compaction must paint the bath')
  await page.waitForTimeout(650)
  assert.equal(await bathPosition(), restingAt, 'the pet must rest in place during compaction')
  hook('PostCompact')
  await page.waitForFunction(() => !document.querySelector('#stage').getAttribute('aria-label').endsWith(', compacting'))
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
  // A second workspace shares the global store but owns its themeFile setting.
  state.set('appliedRevision', workspaceState.get('appliedRevision'))
  const secondOptions = { codexHome: directory, themeFile: 'plugins/pixel-pet/assets/slime.json' }
  const secondState = new Map()
  const secondSubscriptions = []
  let secondProvider
  const secondVscode = { ...vscode,
    workspace: { ...vscode.workspace, getConfiguration: () => ({ get: (key, fallback) => secondOptions[key] ?? fallback, update: async (key, value) => { secondOptions[key] = value } }) },
    window: { ...vscode.window, registerWebviewViewProvider: (id, value) => { if (id === 'pixelPet.companion') secondProvider = value; return disposable() } },
    commands: { ...vscode.commands, registerCommand: () => disposable() },
  }
  const secondHost = { exports: {} }
  runInNewContext(await readFile('dist/extension.cjs', 'utf8'), { module: secondHost, exports: secondHost.exports, require: name => name === 'vscode' ? secondVscode : require(name), process, Buffer, console, setInterval, clearInterval, setTimeout, clearTimeout })
  try {
    secondHost.exports.activate({ ...context, subscriptions: secondSubscriptions, workspaceState: { get: key => secondState.get(key), update: async (key, value) => { secondState.set(key, value) } } })
    await secondProvider.syncSavedTheme()
    await page.waitForTimeout(100)
    assert.equal(secondOptions.themeFile, '', 'a new workspace must clear its override even after another window applied the same revision')
    assert.equal(secondState.get('appliedRevision'), workspaceState.get('appliedRevision'))
  } finally { for (const subscription of secondSubscriptions) subscription.dispose() }
  const readResource = await client.readResource({ uri: 'pixel-pet://theme-format' })
  assert.ok(readResource.contents[0].text.includes('sprite'))
  const reset = await client.callTool({ name: 'set_theme', arguments: { theme: null } })
  assert.equal(reset.isError, undefined)
  await page.waitForFunction(() => !document.querySelector('#hud').textContent.includes('FUEL'))
  hook('UserPromptSubmit')
  for (let index = 0; index < 8; index++) hook('PreToolUse', { tool_name: 'read_file', tool_use_id: `overflow-${index}` })
  await page.waitForFunction(() => document.querySelector('#activity').textContent.startsWith('8 active tools') && document.querySelector('#stage').dataset.taskMinis === '6' && document.querySelector('#stage').dataset.taskOverflow === '2')
  assert.equal(await page.locator('#task-minis [data-state=running]').count(), 8, 'all workers remain represented in the accessible badges')
  await page.setViewportSize({ width: 320, height: 560 })
  await page.waitForFunction(() => document.querySelector('#stage').dataset.taskMinis === '1' && document.querySelector('#stage').dataset.taskOverflow === '7')
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'concurrent worker badges must wrap inside a narrow panel')
  options.showMinis = false
  await page.waitForFunction(() => document.querySelector('#stage').dataset.taskMinis === '0' && document.querySelector('#task-minis').childElementCount === 0)
  assert.ok((await page.locator('#activity').textContent()).startsWith('8 active tools'), 'hiding minis cannot hide real tool activity')
  options.showMinis = true
  hook('Interrupt')
  await page.waitForFunction(() => document.querySelector('#stage').dataset.taskMinis === '0' && document.querySelector('#activity').textContent.startsWith('0 active tools'))
  await page.setViewportSize({ width: 640, height: 460 })
  const childLog = join(sessions, 'lost-hook-child.jsonl')
  hook('UserPromptSubmit')
  hook('SubagentStart', { agent_id: 'lost-hook-child' })
  await writeFile(childLog, record('session_meta', { id: 'lost-hook-child', cwd: root, source: { subagent: { thread_spawn: { parent_thread_id: 'smoke-session' } } } }) + record('event_msg', { type: 'task_started' }) + record('response_item', { type: 'function_call', call_id: 'child-edit', name: 'apply_patch', arguments: '{}' }))
  await page.waitForFunction(() => document.querySelector('#activity').textContent.includes('1 active agent') && document.querySelector('#task-minis').textContent.includes('Agent · Edit'))
  assert.ok((await page.locator('#activity').textContent()).startsWith('0 active tools'), 'child work does not inflate parent tool counts')
  hook('Stop')
  await appendFile(childLog, record('response_item', { type: 'function_call_output', call_id: 'child-edit', output: '{}' }) + record('event_msg', { type: 'task_complete' }))
  await page.waitForFunction(() => document.querySelector('#activity').textContent.includes('0 active agents') && JSON.parse(document.querySelector('#stage').dataset.workers).every(worker => worker.id !== 'agent:lost-hook-child'))
  await page.waitForFunction(() => document.querySelector('#stage').dataset.habitat !== 'paused')
  hook('UserPromptSubmit')
  hook('SubagentStart', { agent_id: 'portal-subagent' })
  await page.waitForFunction(() => document.querySelector('#activity').textContent.includes('1 active agent') && JSON.parse(document.querySelector('#stage').dataset.workers).some(worker => worker.id === 'agent:portal-subagent' && worker.phase === 'summon'))
  assert.equal(await page.locator('#stage').getAttribute('data-agent-trail'), '0', 'subagents never also appear as unsummoned dots behind the main pet')
  await page.waitForFunction(() => JSON.parse(document.querySelector('#stage').dataset.workers).some(worker => worker.id === 'agent:portal-subagent' && worker.phase !== 'summon'))
  assert.equal(await page.locator('#stage').evaluate(stage => JSON.parse(stage.dataset.workers).filter(worker => worker.id === 'agent:portal-subagent').length), 1)
  hook('SubagentStop', { agent_id: 'portal-subagent' })
  hook('Stop')
  await page.waitForFunction(() => JSON.parse(document.querySelector('#stage').dataset.workers).every(worker => worker.id !== 'agent:portal-subagent'))
  await page.click('#demo')
  await page.waitForFunction(() => document.querySelector('#connection').textContent.includes('simulated'))
  await page.click('#demo')
  await page.waitForFunction(() => document.querySelector('#connection').textContent.includes('Following latest'))
  await page.setViewportSize({ width: 320, height: 560 })
  await page.waitForTimeout(250)
  await page.evaluate(() => window.scrollTo(0, 0))
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'panel controls and HUD must fit a narrow sidebar')
  await page.screenshot({ path: 'dist/codex-sidebar.png' })
  const responsiveMessages = webviewMessages.length
  for (const [width, height] of [[440, 360], [320, 220], [260, 160], [640, 400], [1600, 300], [2560, 220], [3840, 160]]) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(250)
    await page.evaluate(() => window.scrollTo(0, 0))
    const fit = await page.evaluate(() => {
      const hud = document.querySelector('#hud'), stage = document.querySelector('#stage')
      const sceneBox = stage.getBoundingClientRect(), hudBox = hud.getBoundingClientRect()
      const pixels = stage.getContext('2d').getImageData(0, 0, stage.width, stage.height).data
      let paintedRight = 0
      for (let y = 0; y < stage.height; y++) for (let x = 0; x < stage.width; x++) if (pixels[(y * stage.width + x) * 4 + 3]) paintedRight = Math.max(paintedRight, x)
      return { zones: JSON.parse(stage.dataset.workZones), paintedRight, canvasWidth: stage.width, right: hudBox.right, bottom: hudBox.bottom, top: hudBox.top, sceneRight: sceneBox.right, sceneHeight: sceneBox.height, pixelsHeight: stage.height, pageWidth: document.documentElement.scrollWidth,
        rows: [...hud.querySelectorAll('.bar')].map(row => ({ bottom: row.getBoundingClientRect().bottom, valueRight: row.querySelector('.hud-value').getBoundingClientRect().right, value: row.querySelector('.hud-value').textContent, details: row.title })) }
    })
    assert.ok(fit.top >= 0 && fit.bottom <= height && fit.right <= width, `compact HUD must fit ${width}x${height} without scrolling`)
    assert.ok(fit.sceneRight < fit.right - 100, 'HUD uses a separate corner beside the scene, not over the pets')
    assert.equal(fit.pixelsHeight, Math.round(fit.sceneHeight), 'canvas resolution follows the reduced scene height')
    assert.ok(fit.rows.length === 3 && fit.rows.every(row => row.bottom <= height && row.valueRight <= width && row.value.trim()), 'all metric values, including unavailable ones, remain visible')
    assert.ok(fit.rows.find(row => row.details)?.details.includes('%'), 'full readings remain available as tooltips')
    assert.ok(fit.pageWidth <= width, 'compact metrics cannot introduce horizontal scrolling')
    assert.ok(fit.paintedRight >= fit.canvasWidth - 4, 'scene reaches the entire available width, including short and ultrawide panels')
    const structures = [...new Map(fit.zones.map(zone => [zone.group, zone])).values()]
    assert.ok(structures.every((zone, index) => index === 0 || structures[index - 1].x + structures[index - 1].width < zone.x), 'separate workplaces never overlap when the panel shrinks')
    if (width === 320) await page.screenshot({ path: 'dist/codex-short-panel.png' })
    if (width === 440) await page.screenshot({ path: 'dist/codex-compact-workplaces.png' })
    if (width === 1600) await page.screenshot({ path: 'dist/codex-wide-panel.png' })
  }
  const compactWidth = await page.locator('#stage').evaluate(stage => stage.clientWidth)
  options.showHud = false
  await page.waitForFunction(() => document.querySelector('#hud').hidden && document.querySelector('#overview').classList.contains('without-hud'))
  assert.ok(await page.locator('#stage').evaluate(stage => stage.clientWidth) > compactWidth + 100, 'hiding HUD returns the reserved width to the scene')
  options.showHud = true
  await page.waitForFunction(() => !document.querySelector('#hud').hidden)
  await page.setViewportSize({ width: 320, height: 560 })
  await page.waitForTimeout(250)
  const restored = await page.evaluate(() => ({ scene:document.querySelector('#stage').getBoundingClientRect().bottom, hud:document.querySelector('#hud').getBoundingClientRect().top }))
  assert.ok(restored.hud > restored.scene, 'tall panels restore the full HUD below the scene')
  assert.equal(webviewMessages.length, responsiveMessages, 'resizing the layout sends no new host/model requests')
  await commands.get('pixelPet.selectSession')()
  const theme = JSON.parse(await readFile('plugins/pixel-pet/assets/alien.json', 'utf8'))
  theme.name = '<script>throw new Error("injected")</script>'
  await page.evaluate(theme => window.dispatchEvent(new MessageEvent('message', { data: { type: 'theme', theme } })), theme)
  await page.waitForTimeout(250)
  assert.deepEqual(errors, [])
  // Closing the companion stops its observer before this browser opens the standalone preview.
  provider.dispose()
  await page.waitForTimeout(300)
  // An isolated real webview with a virtual clock exercises autonomous idle scenes.
  // No host observer or test-only activity hook is added to production code.
  const idlePage = await browser.newPage({ viewport: { width: 320, height: 560 } })
  await idlePage.clock.install({ time: new Date() })
  await idlePage.addInitScript(() => {
    let seed = 42
    Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
    window.localMessages = []
    window.acquireVsCodeApi = () => ({ postMessage: message => window.localMessages.push(message) })
  })
  idlePage.on('pageerror', error => errors.push(String(error)))
  await idlePage.goto(url)
  const sendIdle = data => idlePage.evaluate(data => window.dispatchEvent(new MessageEvent('message', { data })), data)
  const idleTheme = JSON.parse(await readFile('plugins/pixel-pet/assets/slime.json', 'utf8'))
  await sendIdle({ type: 'theme', theme: idleTheme })
  await sendIdle({ type: 'activity', snapshot: { working: false, tools: 0, agents: [], errorAt: 0, lastToolAt: 0, mode: 'bash', target: '', usage: {} }, preferences: { speed: 'normal', sleepAfter: 1, hud: true } })
  const waitIdleScene = async expected => {
    for (let attempt = 0; attempt < 90; attempt++) {
      const kind = await idlePage.locator('#stage').getAttribute('data-interaction')
      if (kind && (!expected || kind === expected)) return kind
      await idlePage.clock.runFor(500)
    }
    throw new Error(`Idle pets never met for ${expected ?? 'an automatic interaction'}`)
  }
  await idlePage.clock.runFor(5000)
  const roamStart = await idlePage.locator('#stage').getAttribute('data-main-x')
  await idlePage.clock.runFor(3000)
  assert.equal(await idlePage.locator('#stage').getAttribute('data-habitat'), 'roam')
  const roamMain = Number(await idlePage.locator('#stage').getAttribute('data-main-x'))
  const roamMini = Number(await idlePage.locator('#mini-stage').getAttribute('data-x'))
  assert.ok(Math.abs(roamMini - (roamMain + 22)) > 5, 'Mini must not follow a fixed slot beside the main pet')
  assert.ok(roamStart)
  await waitIdleScene()
  const firstIdle = await idlePage.locator('#stage').getAttribute('data-interaction')
  assert.ok(firstIdle, 'pets must initiate an interaction without clicks, even beyond sleepAfter')
  assert.notEqual(await idlePage.locator('#stage').getAttribute('data-main-x'), '0', 'the big pet must walk over from its original position to meet Mini')
  assert.equal(await idlePage.locator('#mini-stage').getAttribute('data-interaction'), firstIdle)
  await idlePage.clock.runFor(8000)
  assert.equal(await idlePage.locator('#stage').getAttribute('data-habitat'), 'apart', 'the pets must leave each other after their scene')
  await idlePage.clock.runFor(3000)
  assert.ok(Math.abs(Number(await idlePage.locator('#stage').getAttribute('data-main-x')) - Number(await idlePage.locator('#mini-stage').getAttribute('data-x'))) > 25, 'the pets must visibly spread out after playing')
  await idlePage.click('#mini-feed'); await waitIdleScene('feed'); await idlePage.clock.runFor(900)
  assert.equal(await idlePage.locator('#stage').getAttribute('data-interaction'), 'feed')
  const feedPixels = await idlePage.locator('#stage').evaluate(canvas => canvas.toDataURL())
  await idlePage.click('#mini-play'); await waitIdleScene('play'); await idlePage.clock.runFor(900)
  assert.equal(await idlePage.locator('#stage').getAttribute('data-interaction'), 'play')
  assert.notEqual(await idlePage.locator('#stage').evaluate(canvas => canvas.toDataURL()), feedPixels, 'Feed and Play must paint distinct scenes')
  await sendIdle({ type: 'activity', snapshot: { working: true, tools: 1, agents: [], errorAt: 0, lastToolAt: 0, mode: 'edit', target: '', usage: {} } })
  await idlePage.clock.runFor(600)
  assert.equal(await idlePage.locator('#stage').getAttribute('data-interaction'), '')
  assert.ok((await idlePage.locator('#stage').getAttribute('aria-label')).endsWith(', edit'), 'real work must interrupt social scenes')
  await sendIdle({ type: 'activity', snapshot: { working: false, tools: 0, agents: [], errorAt: 0, lastToolAt: 0, mode: 'bash', target: '', usage: {}, awaitingApproval: true } })
  await idlePage.clock.runFor(30000)
  assert.equal(await idlePage.locator('#stage').getAttribute('data-interaction'), '', 'approval must not look like free play')
  await sendIdle({ type: 'activity', snapshot: { working: false, tools: 0, agents: [], errorAt: 0, lastToolAt: 0, mode: 'bash', target: '', usage: {}, compacting: true } })
  await idlePage.clock.runFor(300)
  assert.ok((await idlePage.locator('#stage').getAttribute('aria-label')).endsWith(', compacting'))
  assert.equal(await idlePage.locator('#stage').getAttribute('data-interaction'), '')
  await sendIdle({ type: 'activity', snapshot: { working: false, tools: 0, agents: [], errorAt: 0, lastToolAt: 0, mode: 'bash', target: '', usage: {} } })
  await idlePage.click('#mini-sleep'); await idlePage.clock.runFor(60000)
  assert.equal(await idlePage.locator('#stage').getAttribute('data-interaction'), '', 'Rest must pause autonomous play')
  await idlePage.click('#mini-sleep'); await waitIdleScene()
  assert.ok(await idlePage.locator('#stage').getAttribute('data-interaction'), 'Wake resumes autonomous play')
  assert.deepEqual(await idlePage.evaluate(() => window.localMessages), [{ type: 'ready' }], 'autonomous scenes cannot send host/model requests')
  assert.ok(await idlePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
  await idlePage.screenshot({ path: 'dist/codex-idle-interaction.png' })
  await idlePage.close()
  const galleryPage = await browser.newPage({ viewport: { width: 1220, height: 830 } })
  galleryPage.on('pageerror', error => errors.push(String(error)))
  await galleryPage.goto(url + '/gallery')
  await galleryPage.waitForFunction(() => document.body.dataset.ready === 'true')
  assert.equal(await galleryPage.locator('canvas').count(), 20)
  await galleryPage.evaluate(() => { window.galleryAt = 3600 })
  await galleryPage.waitForTimeout(150)
  await galleryPage.screenshot({ path: 'dist/codex-interactions.png', fullPage: true })
  await galleryPage.close()
  assert.deepEqual(errors, [])
  await page.goto('file:///' + join(root, 'tools/preview/preview.html').replaceAll('\\', '/'))
  await page.waitForTimeout(400)
  assert.deepEqual(errors, [], 'upstream preview must run without JS errors')
  console.log('PASS: independent roaming, rendezvous and 20 distinct idle interactions, automatic playlist, Feed/Play, work/approval/compaction/Rest priority, Wake, narrow layout and no host/model requests; automatic project results, concurrent workers, scene, props, hook/MCP, fallback/privacy/demo and upstream preview. Screenshots: dist/codex-*.png')
} finally {
  for (const subscription of subscriptions) subscription.dispose()
  await client?.close()
  await browser?.close()
  await new Promise(done => server.close(done))
  await rm(directory, { recursive: true, force: true })
}
