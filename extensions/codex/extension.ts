import * as vscode from 'vscode'
import { readFile, stat } from 'node:fs/promises'
import { watch, type FSWatcher } from 'node:fs'
import { homedir } from 'node:os'
import { join, isAbsolute, resolve, relative } from 'node:path'
import { randomBytes } from 'node:crypto'
import { readTheme } from '../../plugins/pixel-pet/hooks/theme'
import { discoverSessions, SessionTail, type Session } from './sessions'
import { emptySnapshot, object, combineActivity, type Preferences } from './protocol'
import { bridgeRoot, eventPath, atomicJson, storedTheme, saveTheme, readJson } from './bridge'
import { installBridge } from './install'
import { bundledTheme, meadowTheme, upgradeMeadow } from './scene-theme'
import { ProjectMonitor } from './project'

const config = () => vscode.workspace.getConfiguration('pixelPet')
const home = () => config().get<string>('codexHome') || process.env.CODEX_HOME || join(homedir(), '.codex')
const codexExecutable = () => {
  const extension = vscode.extensions.getExtension('openai.chatgpt')
  const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux'
  const architecture = process.arch === 'arm64' ? 'aarch64' : 'x86_64'
  return extension ? join(extension.extensionPath, 'bin', `${platform}-${architecture}`, process.platform === 'win32' ? 'codex.exe' : 'codex') : 'codex'
}
const preferences = (): Preferences => ({ speed: config().get('speed', 'normal'), sleepAfter: config().get('sleepAfter', 60), hud: config().get('showHud', true), targets: config().get('showTargets', false), minis: config().get('showMinis', true), statusLine: config().get('showStatusLine', true) })

class Companion implements vscode.WebviewViewProvider, vscode.Disposable {
  private view?: vscode.WebviewView
  private sessions: Session[] = []
  private tail?: SessionTail
  private hookTail?: SessionTail
  private bridgeWatcher?: FSWatcher
  private eventsWatcher?: FSWatcher
  private wakeTimer?: ReturnType<typeof setTimeout>
  private observedHome = ''
  private savedRevision = ''
  private lastActiveTheme = ''
  private pinned?: string
  private theme: unknown
  private busy = false
  private disposed = false
  private nextScan = 0
  private demo = false
  private error = ''
  private themeError = ''
  private timer: ReturnType<typeof setInterval>
  private project: ProjectMonitor
  constructor(private context: vscode.ExtensionContext, private output: vscode.OutputChannel) {
    this.project = new ProjectMonitor(state => { void this.view?.webview.postMessage({ type: 'project', state }) }, error => this.report(error))
    this.timer = setInterval(() => { void this.poll() }, 250)
    void this.prepareBridge().catch(e => this.report(e))
  }

  private async prepareBridge(): Promise<void> {
    const directory = bridgeRoot(home())
    await atomicJson(join(directory, 'preferences.json'), { targets: preferences().targets })
    if (this.disposed) return
    this.bridgeWatcher?.close(); this.eventsWatcher?.close()
    this.observedHome = home()
    const wake = () => {
      clearTimeout(this.wakeTimer)
      this.wakeTimer = setTimeout(() => { void this.syncSavedTheme().then(() => this.poll()).catch(e => this.report(e)) }, 25)
    }
    this.bridgeWatcher = watch(directory, (_event, name) => { if (name === 'theme.json') wake() })
    // The events directory is created once; no transcript or recursive filesystem watch is needed.
    await atomicJson(join(directory, 'events', '.ready.json'), {})
    if (!this.disposed) this.eventsWatcher = watch(join(directory, 'events'), (_event, name) => { if (name?.endsWith('.jsonl')) wake() })
    this.bridgeWatcher.on('error', e => this.report(e)); this.eventsWatcher?.on('error', e => this.report(e))
    await this.syncSavedTheme()
  }

  private async syncSavedTheme(): Promise<void> {
    const saved = await storedTheme(home())
    if (!saved || saved.revision === this.savedRevision) return
    this.savedRevision = saved.revision
    await this.context.globalState.update('theme', saved.theme === null ? undefined : saved.theme)
    const applied = this.context.workspaceState.get<string>('appliedRevision')
    if (applied !== saved.revision) {
      if (config().get<string>('themeFile', '')) await config().update('themeFile', '', vscode.ConfigurationTarget.Workspace)
      await this.context.workspaceState.update('appliedRevision', saved.revision)
    }
    await this.reloadTheme()
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view
    view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')] }
    const script = view.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js'))
    const nonce = randomBytes(16).toString('hex')
    view.webview.html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}';"><style nonce="${nonce}">
      body{font-family:var(--vscode-font-family,system-ui,sans-serif);color:var(--vscode-foreground,#ddd);background:var(--vscode-editor-background,#1e1e1e);padding:16px;margin:0}header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}h2{font-size:14px;margin:0;flex:1}button{background:var(--vscode-button-secondaryBackground,#333);color:var(--vscode-button-secondaryForeground,#eee);border:0;padding:6px 10px;cursor:pointer;border-radius:4px}button:focus-visible{outline:2px solid var(--vscode-focusBorder,#5aa9ff)}#stage{width:100%;height:130px;image-rendering:pixelated}#status{font-size:13px;min-height:20px}#connection,#activity{font-size:11px;opacity:.7;margin:8px 0;overflow-wrap:anywhere}#hud{border:2px solid #5aa9ff;padding:4px 10px;max-width:520px}.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:7px 0}.bar label{min-width:48px;white-space:pre;font-family:monospace}.bar canvas{image-rendering:pixelated}.bar span{font-size:12px}footer{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      #task-minis{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0;font-size:11px}.task-badge{border:1px solid #555;border-radius:4px;padding:3px 6px;overflow-wrap:anywhere}.task-badge[data-state=running]{color:#9fd7ff}.task-badge[data-state=finished]{color:#8add97}.task-badge[data-state=failed]{color:#ff8585}#scene-stage{position:relative;overflow:hidden}#stage{display:block}#mini-stage{position:absolute;touch-action:none;cursor:grab;border-radius:4px}#mini-stage:active{cursor:grabbing}#mini-stage:focus-visible{outline:2px solid var(--vscode-focusBorder,#5aa9ff);background:#5aa9ff18}#mini-pet{margin-top:12px;border-top:1px solid var(--vscode-panel-border,#444);padding-top:10px}#mini-pet summary{cursor:pointer;font-size:12px}#mini-bubble{font-size:12px;min-height:32px;margin:8px 0;overflow-wrap:anywhere}#mini-review{max-width:100%;text-align:left;overflow-wrap:anywhere}.mini-actions{display:flex;gap:8px;flex-wrap:wrap}</style></head><body><header><h2>Pixel Pet · Codex</h2><button id="session">Session</button></header><div id="connection" role="status">Connecting…</div><div id="scene-stage"><canvas id="stage" aria-label="AI pixel pet with your Mini companion"></canvas><div id="mini-stage" tabindex="0" role="button" title="Mini project: click or drag" aria-label="Mini project: click to inspect results, drag or use arrow keys to move"></div></div><div id="status"></div><div id="activity" role="status"></div><div id="task-minis" aria-label="Observed tool minis"></div><div id="hud"></div><details id="mini-pet" open><summary>Mini project · Local</summary><button id="mini-review" title="Inspect project problems or checks"><span id="mini-project">Watching project automatically</span></button><div id="mini-bubble" role="status">Mini watches project results automatically. Click to inspect.</div><div class="mini-actions"><button id="mini-feed">Feed</button><button id="mini-play">Play</button><button id="mini-sleep">Rest</button></div></details><footer><button id="pet">Pet</button><button id="scene">Scene</button><button id="theme">Import theme</button><button id="preview">Preview</button><button id="reset">Reset</button><button id="demo">Demo</button></footer><script nonce="${nonce}" src="${script}"></script></body></html>`
    this.context.subscriptions.push(view.webview.onDidReceiveMessage((message: unknown) => {
      const action = object(message).type
      if (action === 'ready') {
        void view.webview.postMessage({ type: 'project', state: this.project.state() })
        void this.reloadTheme().then(() => this.poll(true)).catch(e => this.report(e))
      }
      if (action === 'projectInspect') void this.project.inspect().catch(e => this.report(e))
      if (action === 'session') void vscode.commands.executeCommand('pixelPet.selectSession')
      if (action === 'theme') void vscode.commands.executeCommand('pixelPet.importTheme')
      if (action === 'pet') void this.selectPet()
      if (action === 'scene') void this.selectScene()
      if (action === 'reset') void this.resetTheme().catch(e => this.report(e))
      if (action === 'demo') this.toggleDemo()
      if (action === 'preview') void this.openPreview()
    }))
    this.context.subscriptions.push(view.onDidDispose(() => { if (this.view === view) this.view = undefined }))
  }

  async reloadTheme(): Promise<void> {
    try {
      const configured = config().get<string>('themeFile', '')
      const imported = this.context.globalState.get<unknown>('theme')
      const path = configured ? isAbsolute(configured) ? configured : join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '', configured) : undefined
      if (path && (await stat(path)).size > 1024 * 1024) throw new Error('Theme exceeds 1 MB.')
      const data = path ? JSON.parse(await readFile(path, 'utf8')) : upgradeMeadow(imported ?? bundledTheme(JSON.parse(await readFile(vscode.Uri.joinPath(this.context.extensionUri, 'plugins/pixel-pet/assets/slime.json').fsPath, 'utf8'))))
      const result = readTheme(data)
      if (result.errors) throw new Error(result.errors.join(' '))
      this.theme = result.theme
      this.themeError = ''
      const signature = JSON.stringify([this.savedRevision, this.theme])
      if (signature !== this.lastActiveTheme) {
        this.lastActiveTheme = signature
        await atomicJson(join(bridgeRoot(home()), 'active-theme.json'), { theme: this.theme, revision: this.savedRevision, updatedAt: Date.now() })
      }
      if (result.notes.length) this.output.appendLine(`Theme repairs: ${result.notes.join('; ')}`)
      await this.view?.webview.postMessage({ type: 'theme', theme: this.theme, preferences: preferences() })
    } catch (error) {
      this.themeError = `Theme could not load: ${error instanceof Error ? error.message : String(error)}`
      this.report(error)
      // Keep the last valid theme, or use the bundled slime on first load.
      if (!this.theme) {
        this.theme = bundledTheme(JSON.parse(await readFile(vscode.Uri.joinPath(this.context.extensionUri, 'plugins/pixel-pet/assets/slime.json').fsPath, 'utf8')))
      }
      await this.view?.webview.postMessage({ type: 'theme', theme: this.theme, preferences: preferences() })
    }
  }

  private async scan(): Promise<void> {
    const roots = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? []
    this.sessions = roots.length ? await discoverSessions(home(), roots, config().get('includeCli', false)) : []
    const selected = this.pinned ? this.sessions.find(s => s.path === this.pinned) : this.sessions[0]
    // A pinned older session remains selected even if it falls outside the discovery window.
    if (selected && this.tail?.path !== selected.path) { this.tail = new SessionTail(selected.path); this.hookTail = new SessionTail(eventPath(home(), selected.id)) }
    if (!selected && !this.pinned) { this.tail = undefined; this.hookTail = undefined }
  }

  async poll(force = false): Promise<void> {
    if (this.busy || this.disposed || !vscode.workspace.isTrusted) return
    if (!force && !this.view?.visible) return
    this.busy = true
    try {
      if (Date.now() >= this.nextScan || force) { await this.scan(); this.nextScan = Date.now() + 2000 }
      const logged = this.tail ? await this.tail.poll() : emptySnapshot()
      this.project.observe(logged)
      let snapshot = logged
      let source = 'Log fallback'
      if (this.hookTail) {
        try {
          const hooked = await this.hookTail.poll()
          const sameTurn = !logged.turnId || !hooked.turnId || logged.turnId === hooked.turnId
          const explicitTurn = Boolean(logged.turnId && hooked.turnId && logged.turnId === hooked.turnId)
          if (hooked.hookAt && hooked.sessionId === logged.sessionId && sameTurn && (explicitTurn || hooked.hookAt >= (logged.activityAt ?? 0) - 15000)) {
            snapshot = combineActivity(logged, hooked); source = 'Direct hooks'
          }
        } catch (error) { if (object(error).code !== 'ENOENT') this.report(error) }
      }
      this.error = ''
      if (!preferences().targets) snapshot.target = ''
      if (!preferences().targets) snapshot.toolStates = snapshot.toolStates?.map(tool => ({ ...tool, target: '' }))
      // Command directories stay in the host; the UI receives only project outcomes.
      snapshot.checkStates = undefined
      await this.view?.webview.postMessage({ type: 'activity', snapshot, demo: this.demo, preferences: preferences(), connection: this.themeError || (this.tail ? `${this.pinned ? 'Pinned' : 'Following latest'} local session · ${snapshot.sessionId?.slice(0, 8) ?? ''} · ${source}` : 'No local Codex session in this workspace. Start a Codex turn, or select Demo.') })
    } catch (error) {
      const code = object(error).code
      const message = code === 'ENOENT' ? 'Codex sessions not found. Check Pixel Pet: Codex Home in Settings.' : `Session observer: ${error instanceof Error ? error.message : String(error)}`
      if (message !== this.error) { this.output.appendLine(message); this.error = message }
      await this.view?.webview.postMessage({ type: 'activity', snapshot: emptySnapshot(), demo: this.demo, preferences: preferences(), connection: message })
    } finally { this.busy = false }
  }

  async selectSession(): Promise<void> {
    try {
      await this.scan()
      const picked = await vscode.window.showQuickPick([{ label: 'Auto: latest session in this workspace', path: undefined }, ...this.sessions.map(s => ({ label: s.id.slice(0, 8), description: new Date(s.modified).toLocaleString(), detail: s.cwd, path: s.path }))], { title: 'Pixel Pet: Codex session' })
      if (!picked) return
      this.pinned = picked.path
      this.tail = this.pinned ? new SessionTail(this.pinned) : undefined
      const selected = this.sessions.find(s => s.path === this.pinned)
      this.hookTail = selected ? new SessionTail(eventPath(home(), selected.id)) : undefined
      await this.poll(true)
    } catch (error) { this.report(error); await vscode.window.showErrorMessage('Could not list Codex sessions. See the Pixel Pet output channel.') }
  }

  async importTheme(): Promise<void> {
    const files = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { 'Pixel Pet theme': ['json'] } })
    if (!files?.[0]) return
    try {
      const raw = await vscode.workspace.fs.readFile(files[0])
      if (raw.length > 1024 * 1024) throw new Error('Theme exceeds 1 MB.')
      const result = readTheme(JSON.parse(Buffer.from(raw).toString('utf8')))
      if (result.errors) throw new Error(result.errors.join(' '))
      await saveTheme(home(), result.theme)
      await this.syncSavedTheme()
    } catch (error) { await vscode.window.showErrorMessage(`Pixel Pet: ${error instanceof Error ? error.message : String(error)}`) }
  }
  async resetTheme(): Promise<void> {
    await saveTheme(home(), null)
    await this.syncSavedTheme()
  }
  async selectPet(): Promise<void> {
    const picked = await vscode.window.showQuickPick([
      { label: 'Slime', description: 'Blue slime in a meadow', asset: 'slime' },
      { label: 'Duck', description: 'Rubber duck in a meadow', asset: 'duck' },
      { label: 'Alien', description: 'Alien with its original space scene, props and HUD', asset: 'alien' },
    ], { title: 'Pixel Pet: Choose a bundled theme (replaces the current theme)' })
    if (!picked) return
    try {
      const value = JSON.parse(await readFile(vscode.Uri.joinPath(this.context.extensionUri, 'plugins/pixel-pet/assets', `${picked.asset}.json`).fsPath, 'utf8'))
      await saveTheme(home(), bundledTheme(value))
      await this.syncSavedTheme()
    } catch (error) { this.report(error); await vscode.window.showErrorMessage('Could not select the pet theme. See the Pixel Pet output channel.') }
  }
  async selectScene(): Promise<void> {
    const picked = await vscode.window.showQuickPick([
      { label: 'Meadow', description: 'Grass, sun, rocks, flowers and drifting clouds', scene: 'meadow' },
      { label: 'No scene', description: 'Keep the pet, props and HUD; remove the background', scene: 'none' },
    ], { title: 'Pixel Pet: Choose a scene' })
    if (!picked) return
    try {
      if (!this.theme) await this.reloadTheme()
      const value = picked.scene === 'meadow' ? meadowTheme(this.theme) : { ...object(this.theme), scene: null }
      await saveTheme(home(), value)
      await this.syncSavedTheme()
    } catch (error) { this.report(error); await vscode.window.showErrorMessage('Could not select the scene. See the Pixel Pet output channel.') }
  }
  async openPreview(): Promise<void> {
    try {
      const data = object(await readJson(join(bridgeRoot(home()), 'latest-preview.json')))
      if (typeof data.path !== 'string') { await vscode.window.showInformationMessage('Ask Codex to preview your theme using pixel-pet preview_theme first.'); return }
      const base = resolve(bridgeRoot(home()), 'previews')
      const target = resolve(data.path)
      const path = relative(base, target)
      if (path.startsWith('..') || isAbsolute(path) || !target.endsWith('.html')) throw new Error('Preview path is outside Pixel Pet previews.')
      await vscode.env.openExternal(vscode.Uri.file(target))
    } catch (error) { this.report(error); await vscode.window.showErrorMessage('Could not open the Pixel Pet preview. See the output channel.') }
  }
  toggleDemo(): void { this.demo = !this.demo; void this.poll(true) }
  settingsChanged(resetProject = false): void {
    void this.project.refresh(resetProject)
    this.nextScan = 0
    if (this.observedHome !== home()) { this.tail = undefined; this.hookTail = undefined; this.pinned = undefined; this.savedRevision = ''; void this.prepareBridge().catch(e => this.report(e)) }
    else void atomicJson(join(bridgeRoot(home()), 'preferences.json'), { targets: preferences().targets }).catch(e => this.report(e))
    void this.reloadTheme().then(() => this.poll(true)).catch(e => this.report(e))
  }
  async setup(): Promise<void> {
    try {
      const result = await installBridge(home(), this.context.extensionUri.fsPath, codexExecutable())
      this.output.appendLine(`Installed hook bridge and MCP. Hooks: ${result.hooks}${result.backup ? `; backup: ${result.backup}` : ''}`)
      await this.prepareBridge()
      await vscode.window.showInformationMessage('Pixel Pet hooks + MCP installed. Review the Pixel Pet observer entries with /hooks in Codex CLI, then start a new Codex session. Hook trust was not changed.')
    } catch (error) { this.report(error); await vscode.window.showErrorMessage('Pixel Pet setup failed. See the Pixel Pet output channel.') }
  }
  reviewHooks(): void {
    const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? this.context.extensionUri.fsPath
    const terminal = vscode.window.createTerminal({ name: 'Pixel Pet · hook review', cwd, env: { CODEX_HOME: home() }, ...(process.platform === 'win32' ? { shellPath: 'powershell.exe' } : {}) })
    const quote = (value: string) => process.platform === 'win32' ? `'${value.replaceAll("'", "''")}'` : `'${value.replaceAll("'", "'\\''")}'`
    terminal.show()
    terminal.sendText(`${process.platform === 'win32' ? '& ' : ''}${quote(codexExecutable())} --no-daemon -C ${quote(cwd)}`)
    void vscode.window.showInformationMessage('In the Codex terminal, enter /hooks and review/trust only the Pixel Pet observer entries. Then reload VS Code and start a new Codex session.')
  }
  report(error: unknown): void { this.output.appendLine(error instanceof Error ? error.message : String(error)) }
  dispose(): void { this.disposed = true; this.project.dispose(); clearInterval(this.timer); clearTimeout(this.wakeTimer); this.bridgeWatcher?.close(); this.eventsWatcher?.close() }
}

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Pixel Pet')
  const companion = new Companion(context, output)
  context.subscriptions.push(output, companion,
    vscode.window.registerWebviewViewProvider('pixelPet.companion', companion),
    vscode.commands.registerCommand('pixelPet.open', () => vscode.commands.executeCommand('pixelPet.companion.focus')),
    vscode.commands.registerCommand('pixelPet.selectSession', () => companion.selectSession()),
    vscode.commands.registerCommand('pixelPet.importTheme', () => companion.importTheme()),
    vscode.commands.registerCommand('pixelPet.selectPet', () => companion.selectPet()),
    vscode.commands.registerCommand('pixelPet.selectScene', () => companion.selectScene()),
    vscode.commands.registerCommand('pixelPet.resetTheme', () => companion.resetTheme()),
    vscode.commands.registerCommand('pixelPet.setup', () => companion.setup()),
    vscode.commands.registerCommand('pixelPet.preview', () => companion.openPreview()),
    vscode.commands.registerCommand('pixelPet.reviewHooks', () => companion.reviewHooks()),
    vscode.commands.registerCommand('pixelPet.demo', async () => { await vscode.commands.executeCommand('pixelPet.companion.focus'); companion.toggleDemo() }),
    vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('pixelPet')) companion.settingsChanged() }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => companion.settingsChanged(true)),
    vscode.workspace.onDidSaveTextDocument(doc => {
      const themeFile = config().get<string>('themeFile', '')
      if (themeFile && doc.uri.fsPath === (isAbsolute(themeFile) ? themeFile : join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '', themeFile))) void companion.reloadTheme().catch(e => companion.report(e))
    }),
  )
}
