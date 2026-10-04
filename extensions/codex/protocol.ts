import type { ToolMode } from '../../plugins/pixel-pet/hooks/status'
import { commandCheck, commandText, type CommandCheck } from './checks'
import { executionMetadata, polledProcess, processHandle } from './execution'

export type Usage = { hp?: number; mp?: number; st?: number; mpReset?: number; stReset?: number }
export type ToolState = { id: string; mode: ToolMode; target: string; since: number; doneAt?: number; failed?: boolean; cancelled?: boolean; wrapper?: boolean; awaitingResult?: boolean; source: 'call' | 'item' | 'process' }
export const TOOL_DEPARTURE_MS = 2200
export type Snapshot = {
  sessionId?: string
  turnId?: string
  activityAt?: number
  working: boolean
  tools: number
  toolStates?: ToolState[]
  toolResetAt?: number
  processResetAt?: number
  checkStates?: CommandCheck[]
  mode: ToolMode
  target: string
  lastToolAt: number
  errorAt: number
  agents: string[]
  agentStates?: { id: string; since: number; doneAt?: number; failed?: boolean }[]
  hookAt?: number
  compacting?: boolean
  awaitingApproval?: boolean
  usage: Usage
}
export type Preferences = { speed: string; sleepAfter: number; hud: boolean; targets: boolean; minis?: boolean; statusLine?: boolean }
export const emptySnapshot = (): Snapshot => ({ working: false, tools: 0, mode: 'bash', target: '', lastToolAt: 0, errorAt: 0, agents: [], usage: {} })
export const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const finite = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) ? value : undefined
const percent = (value: number) => Math.round(Math.max(0, Math.min(100, value)))

export function codexUsage(payload: Record<string, unknown>): Usage {
  const info = object(payload.info)
  const last = object(info.last_token_usage)
  const window = finite(info.model_context_window)
  const used = finite(last.total_tokens)
  const limits = object(payload.rate_limits)
  const primary = object(limits.primary)
  const secondary = object(limits.secondary)
  const mpUsed = finite(primary.used_percent)
  const stUsed = finite(secondary.used_percent)
  return {
    hp: window && used !== undefined ? percent(100 - used / window * 100) : undefined,
    mp: primary.window_minutes === 300 && mpUsed !== undefined ? percent(100 - mpUsed) : undefined,
    st: secondary.window_minutes === 10080 && stUsed !== undefined ? percent(100 - stUsed) : undefined,
    mpReset: finite(primary.resets_at), stReset: finite(secondary.resets_at),
  }
}

export function classifyTool(name: string, input: unknown): { mode: ToolMode; target: string } {
  const data = typeof input === 'string' ? (() => { try { return object(JSON.parse(input)) } catch { return { input } } })() : object(input)
  const shortName = name.split('__').pop()?.split('.').pop() ?? name
  // Log fallback may contain only the orchestration wrapper. Use static hints for
  // a single tool kind; never execute its source or claim individual nested events.
  if (shortName === 'exec') {
    const source = String(data.code ?? data.input ?? '')
    if (source.length <= 64 * 1024) {
      const calls = [...source.matchAll(/\btools\.([A-Za-z][A-Za-z0-9_]*)\s*\(/g)].map(match => match[1])
      if (calls.length && calls.every(call => call !== 'exec')) {
        const literal = source.match(/\bcmd\s*:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/)
        let command = ''
        if (literal) {
          try { command = literal[1].startsWith('"') ? JSON.parse(literal[1]) : literal[1].slice(1, -1).replace(/\\(['\\])/g, '$1') } catch { /* Nonliteral command: keep the generic tool mode. */ }
        }
        const classified = calls.map(call => classifyTool(call, call === 'exec_command' ? { cmd: command } : {}))
        if (classified.every(tool => tool.mode === classified[0].mode) && (classified[0].mode !== 'bash' || command)) {
          return { mode: classified[0].mode, target: classified[0].target }
        }
      }
    }
    return { mode: 'bash', target: name }
  }
  let mode: ToolMode = 'bash'
  if (/web|browse|fetch/.test(name)) mode = 'web'
  else if (/read_file|Read|view_image|read_resource/.test(shortName)) mode = 'read'
  else if (/search|grep|glob|find/.test(shortName)) mode = 'search'
  else if (/apply_patch|edit|write_file/.test(shortName)) mode = 'edit'
  else if (/agent|spawn|collaboration/.test(name)) mode = 'agent'
  const command = String(data.cmd ?? data.command ?? '')
  if (mode === 'bash' && /^(?:rg|grep|find|Get-ChildItem|Select-String)\b/i.test(command.trim())) mode = 'search'
  if (mode === 'bash' && /^(?:cat|Get-Content|sed|head|type)\b/i.test(command.trim())) mode = 'read'
  if (mode === 'bash' && /^(?:curl|wget|Invoke-WebRequest)\b/i.test(command.trim())) mode = 'web'
  if (mode === 'bash' && /^(?:Set-Content|Add-Content|Out-File|apply_patch)\b/i.test(command.trim())) mode = 'edit'
  // functions.exec contains orchestration code; do not expose that code as a target.
  const patchFile = mode === 'edit' ? command.match(/\*\*\* (?:Update|Add|Delete) File:\s*([^\r\n]+)/)?.[1] : undefined
  const raw = (data.path ?? data.file_path ?? data.pattern ?? data.query ?? data.url ?? patchFile ?? command) || name
  const target = String(raw).split(/[\r\n]/)[0].replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 48)
  return { mode, target }
}

/** An exec wrapper is one observable call, not proof that its source ran parallel tools. */
export const orchestrationTool = (name: string): boolean => ['exec', 'functions.exec', 'functions__exec'].includes(name)

/** Prefer actual child events to their enclosing orchestration call. */
export function visibleTools(states: ToolState[]): ToolState[] {
  const children = states.filter(tool => !tool.wrapper)
  return children.length ? children : states
}

/** Hooks add timely lifecycle events; logs still supply tools absent from that stream. */
export function combineActivity(logged: Snapshot, hooked: Snapshot): Snapshot {
  const reset = Math.max(logged.toolResetAt ?? 0, hooked.toolResetAt ?? 0)
  const processReset = Math.max(logged.processResetAt ?? 0, hooked.processResetAt ?? 0)
  const states = new Map<string, ToolState>()
  for (const tool of [...(logged.toolStates ?? []), ...(hooked.toolStates ?? [])]) {
    if (tool.doneAt === undefined && tool.since <= (tool.source === 'process' ? processReset : reset)) continue
    const previous = states.get(tool.id)
    if (!previous || (tool.doneAt ?? tool.since) >= (previous.doneAt ?? previous.since)) states.set(tool.id, { ...tool, since: Math.min(tool.since, previous?.since ?? tool.since), wrapper: tool.wrapper || previous?.wrapper })
  }
  const toolStates = [...states.values()]
  const active = visibleTools(toolStates.filter(tool => tool.doneAt === undefined && !tool.awaitingResult))
  const recent = visibleTools(toolStates.filter(tool => tool.doneAt !== undefined)).sort((a, b) => b.doneAt! - a.doneAt!)[0]
  const latest = active.at(-1) ?? recent
  const newest = (hooked.activityAt ?? 0) >= (logged.activityAt ?? 0) ? hooked : logged
  return { ...hooked, working: active.length > 0 || newest.working, toolStates, tools: active.length, toolResetAt: reset, processResetAt: processReset, ...(latest && { mode: latest.mode, target: latest.target }), lastToolAt: Math.max(logged.lastToolAt, hooked.lastToolAt), errorAt: Math.max(logged.errorAt, hooked.errorAt), usage: logged.usage }
}

/** Inspect structured output and explicit shell exit metadata, without keeping output text. */
export function toolFailed(output: unknown, depth = 0): boolean {
  if (depth > 8) return false
  if (Array.isArray(output)) return output.some(item => toolFailed(item, depth + 1))
  if (typeof output === 'string') {
    try { return toolFailed(JSON.parse(output), depth + 1) } catch {
      const match = output.match(/(?:Process exited with code|exit_code["']?\s*[:=])\s*(-?\d+)/i)
      return Boolean(match && Number(match[1]) !== 0)
    }
  }
  const data = object(output)
  if (data.type === 'text' && typeof data.text === 'string') return toolFailed(data.text, depth + 1)
  if (data.isError === true || data.is_error === true || data.success === false) return true
  if (typeof data.exit_code === 'number' && data.exit_code !== 0) return true
  if (data.structuredContent && toolFailed(data.structuredContent, depth + 1)) return true
  return Array.isArray(data.content) && data.content.some(item => {
    const content = object(item)
    return content.type === 'text' && typeof content.text === 'string' && toolFailed(content.text, depth + 1)
  })
}

/** Retains activity, structured check metadata and numeric usage; never messages, reasoning, or tool output. */
export class SessionReducer {
  snapshot = emptySnapshot()
  private calls = new Map<string, ToolState>()
  private finished = new Map<string, ToolState>()
  private yielded = new Set<string>()
  private closedProcesses = new Map<string, number>()
  private polls = new Map<string, string>()
  private executionCalls = new Set<string>()
  private checks = new Map<string, CommandCheck>()
  private cwd = ''
  private agents = new Set<string>()
  private lastActivityAt = 0
  private agentStates = new Map<string, { id: string; since: number; doneAt?: number; failed?: boolean }>()

  apply(record: unknown): void {
    const row = object(record)
    const payload = object(row.payload)
    const time = typeof row.timestamp === 'string' ? Date.parse(row.timestamp) : Date.now()
    const at = Number.isFinite(time) ? time : Date.now()
    if (row.type === 'pixel_pet_hook') { this.applyHook(payload, at); return }
    if (row.type === 'event_msg' || row.type === 'response_item') this.lastActivityAt = at
    if (row.type === 'session_meta') {
      this.snapshot.sessionId = String(payload.id ?? payload.session_id ?? '')
      if (typeof payload.cwd === 'string') this.cwd = payload.cwd
    }
    if (row.type === 'event_msg') {
      switch (payload.type) {
        case 'item_started': case 'item_completed': this.applyItem(payload, at); break
        case 'task_started': case 'turn_started': case 'user_message':
          this.snapshot.working = true
          if (typeof payload.turn_id === 'string') this.snapshot.turnId = payload.turn_id
          break
        case 'task_complete': case 'task_completed': case 'turn_complete': case 'turn_aborted':
          this.snapshot.working = false
          this.endAllTools(at, payload.type !== 'turn_aborted')
          this.agents.clear()
          for (const [id, agent] of this.agentStates) if (agent.doneAt === undefined) this.agentStates.set(id, { ...agent, doneAt: at })
          break
        case 'token_count': this.snapshot.usage = codexUsage(payload); break
        case 'error': this.snapshot.errorAt = at; break
      }
    }
    if (row.type === 'response_item') {
      const id = typeof payload.call_id === 'string' ? payload.call_id : ''
      if ((payload.type === 'function_call' || payload.type === 'custom_tool_call') && id) {
        const name = String(payload.name ?? '')
        const tool = classifyTool(name, payload.arguments ?? payload.input)
        const poll = polledProcess(name, payload.arguments ?? payload.input)
        if (poll) this.polls.set(id, poll)
        if (poll || orchestrationTool(name) || name.endsWith('exec_command')) this.executionCalls.add(id)
        this.startTool(id, tool, at, orchestrationTool(name) || Boolean(poll))
        Object.assign(this.snapshot, tool, { lastToolAt: at, working: true })
      } else if ((payload.type === 'function_call_output' || payload.type === 'custom_tool_call_output') && id) {
        const tool = this.calls.get(id)
        const execution = this.executionCalls.has(id) ? executionMetadata(payload.output) : { running: [], exits: [] }
        this.startProcesses(execution.running, at, tool?.mode ?? 'bash')
        this.executionCalls.delete(id)
        const poll = this.polls.get(id)
        if (poll && execution.exits.length === 1 && !execution.running.length) this.finishProcess(poll, at, execution.exits[0] !== 0)
        this.polls.delete(id)
        this.endTool(id, at, payload.is_error === true || toolFailed(payload.output))
        if (execution.running.length) this.finished.delete(id)
        const active = [...this.calls.values()].at(-1)
        if (active) Object.assign(this.snapshot, { mode: active.mode, target: active.target })
        this.snapshot.lastToolAt = at
        if (payload.is_error === true || toolFailed(payload.output)) this.snapshot.errorAt = at
        // Spawn results contain agent IDs; only retain IDs, never messages.
        if (tool?.mode === 'agent') {
          let result = object(payload.output)
          if (typeof payload.output === 'string') { try { result = object(JSON.parse(payload.output)) } catch { /* Plain tool output has no structured agent ID. */ } }
          if (typeof result.agent_id === 'string') {
            this.agents.add(result.agent_id)
            if (!this.agentStates.has(result.agent_id)) this.agentStates.set(result.agent_id, { id: result.agent_id, since: at })
          }
        }
      }
    }
    this.publishTools(at)
    this.snapshot.agents = [...this.agents].slice(0, 16)
    if (this.agentStates.size) this.snapshot.agentStates = [...this.agentStates.values()].slice(-64)
    while (this.agentStates.size > 64) this.agentStates.delete(this.agentStates.keys().next().value!)
  }

  private startTool(id: string, tool: { mode: ToolMode; target: string }, at: number, wrapper = false, source: ToolState['source'] = 'call'): void {
    // Repeated notifications must not restart an already completed operation.
    if (this.finished.has(id)) return
    this.calls.set(id, { ...tool, id, since: this.calls.get(id)?.since ?? at, wrapper, source })
  }

  private endTool(id: string, at: number, failed = false, observed?: ToolState): void {
    const previous = this.calls.get(id) ?? this.finished.get(id)
    const tool = observed ? { ...previous, ...observed, since: Math.min(previous?.since ?? observed.since, observed.since) } : previous
    this.calls.delete(id)
    if (tool) this.finished.set(id, { ...tool, doneAt: at, failed: failed || previous?.failed })
  }

  private endAllTools(at: number, preserveProcesses = false): void {
    for (const [id, tool] of this.calls) {
      if (preserveProcesses && tool.source === 'process') continue
      this.endTool(id, at)
      this.finished.get(id)!.cancelled = true
    }
    this.snapshot.toolResetAt = at
    if (!preserveProcesses) {
      this.snapshot.processResetAt = at
      for (const handle of this.yielded) this.closedProcesses.set(handle, at)
    }
    this.polls.clear()
    this.executionCalls.clear()
    for (const [id, check] of this.checks) if (check.endedAt === undefined) this.checks.set(id, { ...check, endedAt: at, cancelled: true })
  }

  private startProcesses(handles: string[], at: number, mode: ToolMode): void {
    for (const handle of handles.slice(0, 32)) {
      if (!processHandle(handle) || this.closedProcesses.has(handle)) continue
      this.yielded.add(handle)
      while (this.yielded.size > 1024) this.yielded.delete(this.yielded.values().next().value!)
      this.startTool(`process:${handle}`, { mode, target: '' }, at, false, 'process')
    }
  }

  private finishProcess(handle: string, at: number, failed: boolean, observed?: { mode: ToolMode; target: string }): void {
    const key = `process:${handle}`
    const tool = this.calls.get(key) ?? this.finished.get(key)
    if (tool) this.endTool(key, at, failed, observed ? { ...tool, ...observed } : undefined)
    this.closedProcesses.set(handle, at)
    while (this.closedProcesses.size > 1024) this.closedProcesses.delete(this.closedProcesses.keys().next().value!)
    while (this.yielded.size > 1024) this.yielded.delete(this.yielded.values().next().value!)
  }

  private applyItem(payload: Record<string, unknown>, at: number): void {
    const item = object(payload.item)
    const id = typeof item.id === 'string' ? item.id.slice(0, 256) : ''
    if (!id) return
    const kind = String(item.type).replace(/[_-]/g, '').toLowerCase()
    let tool: { mode: ToolMode; target: string } | undefined
    if (kind === 'filechange') tool = { mode: 'edit', target: '' }
    else if (kind === 'commandexecution') {
      tool = classifyTool('exec_command', { cmd: commandText(item.command) })
      const parsed = Array.isArray(item.parsed_cmd) ? item.parsed_cmd.map(value => object(value).type) : []
      if (parsed.length && parsed.every(type => type === 'read')) tool.mode = 'read'
      else if (parsed.length && parsed.every(type => type === 'search')) tool.mode = 'search'
    }
    else if (kind === 'websearch') tool = { mode: 'web', target: '' }
    else if (kind === 'imageview') tool = { mode: 'read', target: '' }
    else if (kind === 'mcptoolcall' || kind === 'dynamictoolcall') tool = classifyTool(String(item.tool ?? item.tool_name ?? item.name ?? 'tool'), {})
    if (!tool) return // In particular, never inspect reasoning or conversation items.
    const started = finite(payload.started_at_ms)
    const since = started !== undefined && started <= at ? started : at
    if (kind === 'commandexecution') {
      const name = commandCheck(item.command)
      const cwd = typeof item.cwd === 'string' ? item.cwd : this.cwd
      if (name && cwd && cwd.length <= 4096 && !(payload.type === 'item_started' && this.checks.get(id)?.endedAt !== undefined)) {
        const completed = payload.type === 'item_completed'
        const previous = this.checks.get(id)
        const exitCode = finite(item.exit_code)
        this.checks.set(id, { id, name, cwd, startedAt: previous?.startedAt ?? (started !== undefined && started <= at ? started : completed ? undefined : at),
          ...(completed && { endedAt: at, exitCode: exitCode !== undefined && Number.isInteger(exitCode) ? exitCode : undefined, failed: item.status === 'failed', cancelled: item.status === 'interrupted' || item.status === 'cancelled' }) })
        while (this.checks.size > 64) this.checks.delete(this.checks.keys().next().value!)
      }
    }
    if (payload.type === 'item_started') {
      this.startTool(id, tool, since, false, 'item')
      this.snapshot.working = true
    } else {
      // Some runtimes only append completed child items. Show a finished mini;
      // do not retroactively claim that the child is still running.
      const failed = item.status === 'failed' || item.status === 'declined' || toolFailed({ exit_code: item.exit_code, isError: item.isError })
      const handle = kind === 'commandexecution' ? processHandle(item.process_id) : undefined
      const wasYielded = handle && this.yielded.has(handle)
      if (handle && finite(item.exit_code) !== undefined) this.finishProcess(handle, at, failed, tool)
      if (!wasYielded) this.endTool(id, at, failed, { ...tool, id, since, source: 'item' })
      else if (this.calls.has(id)) { this.calls.delete(id); this.finished.delete(id) }
      if (failed) this.snapshot.errorAt = at
    }
    Object.assign(this.snapshot, tool, { lastToolAt: at })
  }

  private publishTools(at: number): void {
    for (const [id, tool] of this.finished) if (at - tool.doneAt! >= TOOL_DEPARTURE_MS) this.finished.delete(id)
    while (this.finished.size > 64) this.finished.delete(this.finished.keys().next().value!)
    const active = visibleTools([...this.calls.values()])
    this.snapshot.tools = active.length
    const latest = active.at(-1)
    if (latest) Object.assign(this.snapshot, { mode: latest.mode, target: latest.target })
    this.snapshot.toolStates = [...this.calls.values(), ...this.finished.values()]
    this.snapshot.checkStates = [...this.checks.values()]
  }

  private applyHook(payload: Record<string, unknown>, at: number): void {
    this.lastActivityAt = at
    this.snapshot.hookAt = at
    if (typeof payload.turnId === 'string') this.snapshot.turnId = payload.turnId
    const id = typeof payload.callId === 'string' ? payload.callId : ''
    switch (payload.event) {
      case 'SessionStart': break
      case 'UserPromptSubmit': this.snapshot.working = true; this.snapshot.awaitingApproval = false; break
      case 'PreToolUse': {
        if (!id) break
        const valid = ['read', 'search', 'edit', 'bash', 'web', 'agent']
        const mode = valid.includes(String(payload.mode)) ? payload.mode as ToolMode : 'bash'
        const target = typeof payload.target === 'string' ? payload.target.slice(0, 48) : ''
        this.startTool(id, { mode, target }, at, payload.wrapper === true)
        Object.assign(this.snapshot, { mode, target, lastToolAt: at, working: true, awaitingApproval: false })
        break
      }
      case 'PostToolUse': {
        const mode = ['read', 'search', 'edit', 'bash', 'web', 'agent'].includes(String(payload.mode)) ? payload.mode as ToolMode : 'bash'
        const observed: ToolState | undefined = id && !this.calls.has(id) && !this.finished.has(id) ? { id, mode, target: typeof payload.target === 'string' ? payload.target.slice(0, 48) : '', since: at, wrapper: payload.wrapper === true, source: 'call' } : undefined
        this.endTool(id, at, payload.failed === true, observed)
        if (Array.isArray(payload.runningProcesses)) {
          this.startProcesses(payload.runningProcesses.filter(value => typeof value === 'string'), at, mode)
          if (payload.runningProcesses.length) this.finished.delete(id)
        }
        const ended = object(payload.processEnded)
        const handle = processHandle(ended.id)
        if (handle) this.finishProcess(handle, at, ended.failed === true)
        const active = [...this.calls.values()].at(-1)
        if (active) Object.assign(this.snapshot, { mode: active.mode, target: active.target })
        this.snapshot.lastToolAt = at
        if (payload.failed === true) this.snapshot.errorAt = at
        break
      }
      case 'PermissionRequest': this.snapshot.awaitingApproval = true; break
      case 'PreCompact': this.snapshot.compacting = true; break
      case 'PostCompact': this.snapshot.compacting = false; break
      case 'SubagentStart': {
        if (typeof payload.agentId === 'string') {
          this.agentStates.set(payload.agentId, { id: payload.agentId, since: at })
          if (!this.calls.size) this.snapshot.mode = 'agent'
        }
        break
      }
      case 'SubagentStop': {
        if (typeof payload.agentId === 'string') {
          const agent = this.agentStates.get(payload.agentId)
          this.agentStates.set(payload.agentId, { id: payload.agentId, since: agent?.since ?? at, doneAt: at, failed: payload.failed === true })
        }
        break
      }
      case 'Stop': case 'Interrupt': case 'SessionEnd':
        this.snapshot.working = false; this.snapshot.compacting = false; this.snapshot.awaitingApproval = false
        this.endAllTools(at, payload.event === 'Stop')
        // A parent turn can finish while its subagents are still running. Their Stop events own departure.
        if (payload.event === 'SessionEnd') for (const [key, agent] of this.agentStates) if (!agent.doneAt) this.agentStates.set(key, { ...agent, doneAt: at })
        break
    }
    this.publishTools(at)
    this.snapshot.agentStates = [...this.agentStates.values()].slice(-64)
    while (this.agentStates.size > 64) this.agentStates.delete(this.agentStates.keys().next().value!)
    this.snapshot.agents = this.snapshot.agentStates.filter(a => !a.doneAt).map(a => a.id)
  }

  current(now = Date.now()): Snapshot {
    // A crashed session or interrupted historical replay must not leave the pet working forever.
    const stale = now - this.lastActivityAt > 10 * 60_000
    const states = this.snapshot.agentStates?.filter(a => !a.doneAt || now - a.doneAt < 1500).map(a => ({ ...a }))
    const tools = this.snapshot.toolStates?.filter(tool => (tool.doneAt === undefined || now - tool.doneAt < TOOL_DEPARTURE_MS) && (!stale || tool.source === 'process' && tool.doneAt === undefined)).map(tool => ({ ...tool, ...(stale && { awaitingResult: true }) }))
    const active = visibleTools((tools ?? []).filter(tool => tool.doneAt === undefined && !tool.awaitingResult))
    const recent = visibleTools((tools ?? []).filter(tool => tool.doneAt !== undefined)).sort((a, b) => b.doneAt! - a.doneAt!)[0]
    const latest = active.at(-1) ?? recent
    return { ...this.snapshot, ...(latest && { mode: latest.mode, target: latest.target }), activityAt: this.lastActivityAt, working: stale ? false : active.length > 0 || this.snapshot.working, tools: active.length, toolStates: tools, checkStates: this.snapshot.checkStates?.map(check => ({ ...check })), agents: stale ? [] : [...this.snapshot.agents], agentStates: stale ? [] : states, usage: { ...this.snapshot.usage } }
  }
}
