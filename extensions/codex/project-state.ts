import type { CommandCheck } from './checks'

export type ProjectCheck = { name: string; status: 'unknown' | 'running' | 'passed' | 'failed'; source?: 'codex' | 'vscode' }
export type ProjectState = { status: 'issues' | 'verified' | 'unverified'; errors: number; warnings: number; checks: ProjectCheck[]; text: string }

/** Evidence belongs to one workspace revision; editing invalidates previous check results. */
export class ProjectResults {
  private revision = 0
  private checks = new Map<string, ProjectCheck>()
  private runs = new Map<unknown, { name: string; revision: number }>()
  private outcomes = new Map<string, { revision: number; failed: boolean; unknown: boolean }>()
  private seen = new Map<string, string>()
  private latest = new Map<string, number>()
  private editedAt = 0
  errors = 0
  warnings = 0
  configure(names: string[]): void {
    const previous = this.checks
    this.checks = new Map([...new Set(names)].map(name => [name, previous.get(name) ?? { name, status: 'unknown' }]))
  }
  edit(at = Date.now()): void {
    this.revision++
    this.editedAt = Math.max(this.editedAt, at)
    for (const check of this.checks.values()) check.status = 'unknown'
  }
  start(key: unknown, name: string, knownRevision = true, source: ProjectCheck['source'] = 'vscode'): void {
    if (!this.checks.has(name) || this.runs.has(key)) return
    if (![...this.runs.values()].some(run => run.name === name)) this.outcomes.set(name, { revision: this.revision, failed: false, unknown: false })
    this.runs.set(key, { name, revision: knownRevision ? this.revision : -1 }); this.checks.get(name)!.status = 'running'
    this.checks.get(name)!.source = source
  }
  finish(key: unknown, exitCode?: number, failed = false): void {
    const run = this.runs.get(key)
    if (!run) return
    this.runs.delete(key)
    const check = this.checks.get(run.name)
    if (!check) return
    const outcome = this.outcomes.get(run.name)!
    outcome.failed ||= failed || exitCode !== undefined && exitCode !== 0
    outcome.unknown ||= exitCode === undefined && !failed || run.revision !== outcome.revision
    const other = [...this.runs.values()].some(item => item.name === run.name)
    if (other) { check.status = 'running'; return }
    check.status = outcome.revision !== this.revision || outcome.unknown ? 'unknown' : outcome.failed ? 'failed' : 'passed'
  }
  /** Consume each structured check transition once, never replay old success after an edit. */
  observe(key: string, name: string, check: CommandCheck, baseline: number): boolean {
    if (check.endedAt !== undefined && check.endedAt < baseline) return false
    if (check.endedAt === undefined && (check.startedAt ?? 0) < baseline) return false
    const stamp = JSON.stringify([check.startedAt, check.endedAt, check.exitCode, check.failed, check.cancelled])
    if (this.seen.get(key) === stamp) return false
    this.seen.set(key, stamp)
    while (this.seen.size > 512) this.seen.delete(this.seen.keys().next().value!)
    if (!this.runs.has(key) && check.endedAt !== undefined && check.endedAt < (this.latest.get(name) ?? 0)) return false
    this.start(key, name, check.startedAt !== undefined && check.startedAt >= baseline && check.startedAt >= this.editedAt, 'codex')
    if (check.endedAt !== undefined) {
      this.finish(key, check.cancelled ? undefined : check.exitCode, !check.cancelled && check.failed)
      this.latest.set(name, Math.max(this.latest.get(name) ?? 0, check.endedAt))
    }
    return true
  }
  state(): ProjectState {
    const checks = [...this.checks.values()].map(check => ({ ...check }))
    const failed = checks.filter(check => check.status === 'failed').length
    const passed = checks.filter(check => check.status === 'passed').length
    const running = checks.filter(check => check.status === 'running').length
    const status = this.errors || failed ? 'issues' : checks.length && passed === checks.length ? 'verified' : 'unverified'
    const text = [this.errors ? `${this.errors} error${this.errors === 1 ? '' : 's'}` : '', failed ? `${failed} failed check${failed === 1 ? '' : 's'}` : '',
      running ? `${running} check${running === 1 ? '' : 's'} running` : '',
      checks.length ? `${passed}/${checks.length} checks passed${status === 'unverified' && !running ? ' · code not verified' : ''}` : 'Watching project automatically', this.warnings ? `${this.warnings} warning${this.warnings === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ')
    return { status, errors: this.errors, warnings: this.warnings, checks, text }
  }
}
