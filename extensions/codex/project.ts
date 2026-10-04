import * as vscode from 'vscode'
import { resolve } from 'node:path'
import { ProjectResults, type ProjectState } from './project-state'
import { matchesWorkspace } from './sessions'
import type { Snapshot } from './protocol'

/** Passive editor and Codex results only; never starts a task or a model turn. */
export class ProjectMonitor implements vscode.Disposable {
  private results = new ProjectResults()
  private subscriptions: vscode.Disposable[] = []
  private tasks: vscode.Task[] = []
  private generation = 0
  private disposed = false
  private baseline = Date.now()
  private configured: string[] = []
  private observed = new Set<string>()
  private scopeIds = new Map<string, number>()
  constructor(private changed: (state: ProjectState) => void, private report: (error: unknown) => void) {
    const watcher = vscode.workspace.createFileSystemWatcher('**/*')
    this.subscriptions.push(watcher,
      watcher.onDidChange(uri => this.edit(uri)), watcher.onDidCreate(uri => this.edit(uri)), watcher.onDidDelete(uri => this.edit(uri)),
      vscode.workspace.onDidChangeTextDocument(event => { if (event.contentChanges.length) this.edit(event.document.uri) }),
      vscode.languages.onDidChangeDiagnostics(() => this.diagnostics()),
      vscode.tasks.onDidStartTask(event => { if (this.follows(event.execution.task)) { const name = this.name(event.execution.task); this.include(name); this.results.start(event.execution, name); this.emit() } }),
      vscode.tasks.onDidEndTaskProcess(event => { this.results.finish(event.execution, event.exitCode); this.emit() }),
      // Custom/cancelled tasks may have no process exit event. Keep those unverified.
      vscode.tasks.onDidEndTask(event => { this.results.finish(event.execution); this.emit() }),
    )
    void this.refresh()
  }
  private relevant(uri: vscode.Uri): boolean {
    return Boolean(vscode.workspace.getWorkspaceFolder(uri)) && !/(?:^|\/)(?:node_modules|\.git|dist|build|coverage|\.codex|\.next)(?:\/|$)/.test(uri.path)
  }
  private owns(task: vscode.Task): boolean {
    const scope = task.scope
    return scope === vscode.TaskScope.Workspace || typeof scope === 'object' && scope !== null && Boolean(vscode.workspace.getWorkspaceFolder(scope.uri))
  }
  private follows(task: vscode.Task): boolean {
    return this.owns(task) && (this.configured.length ? this.configured.includes(this.name(task)) : task.group?.id === vscode.TaskGroup.Build.id || task.group?.id === vscode.TaskGroup.Test.id || /^(?:build|test|typecheck|check|lint|package|verify|validate)(?::[a-z0-9_-]+)*$/i.test(String(task.definition.script ?? task.name)))
  }
  private include(name: string): void {
    this.observed.add(name)
    this.results.configure([...new Set([...this.configured, ...this.observed])])
  }
  observe(snapshot: Snapshot): void {
    const roots = (vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath)
    let changed = false
    for (const check of snapshot.checkStates ?? []) {
      if (!matchesWorkspace(check.cwd, roots) || (check.endedAt ?? check.startedAt ?? 0) < this.baseline) continue
      const task = this.tasks.find(task => {
        if (task.definition.script !== check.name || typeof task.scope !== 'object' || !task.scope) return false
        const cwd = resolve(task.scope.uri.fsPath, typeof task.definition.path === 'string' ? task.definition.path : '')
        return matchesWorkspace(check.cwd, [cwd]) && matchesWorkspace(cwd, [check.cwd])
      })
      const cwd = /^[a-z]:[\\/]/i.test(check.cwd) ? check.cwd.replace(/\\/g, '/').toLowerCase() : check.cwd
      if (!this.scopeIds.has(cwd)) this.scopeIds.set(cwd, this.scopeIds.size + 1)
      const scope = this.scopeIds.get(cwd)!
      const name = task ? this.name(task) : `Codex · ${check.name}${scope > 1 ? ` [${scope}]` : ''}`
      this.include(name)
      changed = this.results.observe(`${snapshot.sessionId ?? ''}:${check.id}`, name, check, this.baseline) || changed
    }
    if (changed) this.emit()
  }
  private name(task: vscode.Task): string {
    const folders = vscode.workspace.workspaceFolders ?? []
    const scope = task.scope
    if (folders.length > 1 && typeof scope === 'object' && scope !== null) {
      const index = folders.findIndex(folder => folder.uri.toString() === scope.uri.toString())
      return `${scope.name} [${index + 1}]: ${task.name}`
    }
    return task.name
  }
  private edit(uri: vscode.Uri): void { if (this.relevant(uri)) { this.results.edit(); this.emit() } }
  private diagnostics(): void {
    let errors = 0, warnings = 0
    for (const [uri, values] of vscode.languages.getDiagnostics()) if (this.relevant(uri)) for (const value of values) {
      if (value.severity === vscode.DiagnosticSeverity.Error) errors++
      if (value.severity === vscode.DiagnosticSeverity.Warning) warnings++
    }
    this.results.errors = errors; this.results.warnings = warnings; this.emit()
  }
  private emit(): void { if (!this.disposed) this.changed(this.results.state()) }
  state(): ProjectState { return this.results.state() }
  async refresh(reset = false): Promise<void> {
    const generation = ++this.generation
    if (reset) { this.results = new ProjectResults(); this.observed.clear(); this.scopeIds.clear(); this.baseline = Date.now() }
    try {
      const available = await vscode.tasks.fetchTasks()
      if (this.disposed || generation !== this.generation) return
      const configured = vscode.workspace.getConfiguration('pixelPet').get<string[]>('projectChecks', [])
      this.configured = configured
      this.tasks = available.filter(task => this.follows(task))
      // Explicitly configured but missing tasks stay unknown, never silently green.
      this.results.configure([...new Set([...configured, ...this.observed])])
      for (const execution of vscode.tasks.taskExecutions) if (this.follows(execution.task)) { const name = this.name(execution.task); this.include(name); this.results.start(execution, name) }
      this.diagnostics()
    } catch (error) { this.results.edit(); this.report(error); this.emit() }
  }
  async inspect(): Promise<void> {
    const state = this.state()
    if (state.errors) { await vscode.commands.executeCommand('workbench.actions.view.problems'); return }
    const items = state.checks.map(check => ({ label: `${check.name}: ${check.status}`, description: check.source === 'codex' ? 'Recorded Codex result' : 'Open task output', name: check.name, source: check.source }))
    if (!items.length) { await vscode.window.showInformationMessage('Mini watches project problems and picks up build/test results automatically as you or Codex run checks.'); return }
    const picked = await vscode.window.showQuickPick(items, { title: state.text })
    if (picked) {
      if (picked.source === 'codex') { await vscode.window.showInformationMessage(`${picked.label}. Reported by Codex.`); return }
      const terminal = vscode.window.terminals.find(terminal => terminal.name === picked.name || terminal.name.includes(picked.name))
      if (terminal) terminal.show()
      else await vscode.window.showInformationMessage(`${picked.label}. Task output is no longer open.`)
    }
  }
  dispose(): void { this.disposed = true; for (const subscription of this.subscriptions) subscription.dispose() }
}
