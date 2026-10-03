import type { ToolMode } from '../../plugins/pixel-pet/hooks/status'

export type Usage = { hp?: number; mp?: number; st?: number; mpReset?: number; stReset?: number }
export type Snapshot = {
  sessionId?: string
  turnId?: string
  activityAt?: number
  working: boolean
  tools: number
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
  let mode: ToolMode = 'bash'
  if (/read_file|Read|view_image/.test(shortName)) mode = 'read'
  else if (/search|grep|glob|find/.test(shortName)) mode = /web|browse/.test(name) ? 'web' : 'search'
  else if (/apply_patch|edit|write_file/.test(shortName)) mode = 'edit'
  else if (/web|browse|fetch/.test(name)) mode = 'web'
  else if (/agent|spawn|collaboration/.test(name)) mode = 'agent'
  const command = String(data.cmd ?? data.command ?? '')
  if (mode === 'bash' && /^(?:rg|grep|find|Get-ChildItem|Select-String)\b/i.test(command.trim())) mode = 'search'
  if (mode === 'bash' && /^(?:cat|Get-Content|sed|head|type)\b/i.test(command.trim())) mode = 'read'
  if (mode === 'bash' && /^(?:curl|wget|Invoke-WebRequest)\b/i.test(command.trim())) mode = 'web'
  // functions.exec contains orchestration code; do not expose that code as a target.
  const patchFile = mode === 'edit' ? command.match(/\*\*\* (?:Update|Add|Delete) File:\s*([^\r\n]+)/)?.[1] : undefined
  const raw = (data.path ?? data.file_path ?? data.pattern ?? data.query ?? data.url ?? patchFile ?? command) || name
  const target = String(raw).split(/[\r\n]/)[0].replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 48)
  return { mode, target }
}

/** Inspect structured output and explicit shell exit metadata, without keeping output text. */
export function toolFailed(output: unknown, depth = 0): boolean {
  if (depth > 8) return false
  if (typeof output === 'string') {
    try { return toolFailed(JSON.parse(output), depth + 1) } catch {
      const match = output.match(/(?:Process exited with code|exit_code["']?\s*[:=])\s*(-?\d+)/i)
      return Boolean(match && Number(match[1]) !== 0)
    }
  }
  const data = object(output)
  if (data.isError === true || data.is_error === true || data.success === false) return true
  if (typeof data.exit_code === 'number' && data.exit_code !== 0) return true
  if (data.structuredContent && toolFailed(data.structuredContent, depth + 1)) return true
  return Array.isArray(data.content) && data.content.some(item => {
    const content = object(item)
    return content.type === 'text' && typeof content.text === 'string' && toolFailed(content.text, depth + 1)
  })
}

/** Retains activity and numeric usage only; never messages, reasoning, or tool output. */
export class SessionReducer {
  snapshot = emptySnapshot()
  private calls = new Map<string, { mode: ToolMode; target: string }>()
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
    if (row.type === 'session_meta') this.snapshot.sessionId = String(payload.id ?? payload.session_id ?? '')
    if (row.type === 'event_msg') {
      switch (payload.type) {
        case 'task_started': case 'turn_started': case 'user_message':
          this.snapshot.working = true
          if (typeof payload.turn_id === 'string') this.snapshot.turnId = payload.turn_id
          break
        case 'task_complete': case 'task_completed': case 'turn_complete': case 'turn_aborted':
          this.snapshot.working = false
          this.calls.clear()
          this.agents.clear()
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
        this.calls.set(id, tool)
        Object.assign(this.snapshot, tool, { lastToolAt: at, working: true })
      } else if ((payload.type === 'function_call_output' || payload.type === 'custom_tool_call_output') && id) {
        const tool = this.calls.get(id)
        this.calls.delete(id)
        this.snapshot.lastToolAt = at
        if (payload.is_error === true || toolFailed(payload.output)) this.snapshot.errorAt = at
        // Spawn results contain agent IDs; only retain IDs, never messages.
        if (tool?.mode === 'agent') {
          let result = object(payload.output)
          if (typeof payload.output === 'string') { try { result = object(JSON.parse(payload.output)) } catch { /* Plain tool output has no structured agent ID. */ } }
          if (typeof result.agent_id === 'string') this.agents.add(result.agent_id)
        }
      }
    }
    this.snapshot.tools = this.calls.size
    this.snapshot.agents = [...this.agents].slice(0, 16)
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
        this.calls.set(id, { mode, target })
        Object.assign(this.snapshot, { mode, target, lastToolAt: at, working: true, awaitingApproval: false })
        break
      }
      case 'PostToolUse': {
        this.calls.delete(id)
        const active = [...this.calls.values()].at(-1)
        if (active) Object.assign(this.snapshot, active)
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
        this.snapshot.working = false; this.snapshot.compacting = false; this.snapshot.awaitingApproval = false; this.calls.clear()
        // A parent turn can finish while its subagents are still running. Their Stop events own departure.
        if (payload.event === 'SessionEnd') for (const [key, agent] of this.agentStates) if (!agent.doneAt) this.agentStates.set(key, { ...agent, doneAt: at })
        break
    }
    this.snapshot.tools = this.calls.size
    this.snapshot.agentStates = [...this.agentStates.values()].slice(-64)
    while (this.agentStates.size > 64) this.agentStates.delete(this.agentStates.keys().next().value!)
    this.snapshot.agents = this.snapshot.agentStates.filter(a => !a.doneAt).map(a => a.id)
  }

  current(now = Date.now()): Snapshot {
    // A crashed session or interrupted historical replay must not leave the pet working forever.
    const stale = now - this.lastActivityAt > 10 * 60_000
    const states = this.snapshot.agentStates?.filter(a => !a.doneAt || now - a.doneAt < 1500).map(a => ({ ...a }))
    return { ...this.snapshot, activityAt: this.lastActivityAt, working: stale ? false : this.snapshot.working, tools: stale ? 0 : this.snapshot.tools, agents: stale ? [] : [...this.snapshot.agents], agentStates: stale ? [] : states, usage: { ...this.snapshot.usage } }
  }
}
