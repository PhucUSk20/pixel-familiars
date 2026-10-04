import { createHash, randomUUID } from 'node:crypto'
import { join, resolve } from 'node:path'
import { mkdir, readFile, writeFile, rename, appendFile, stat } from 'node:fs/promises'
import { readTheme } from '../../plugins/pixel-pet/hooks/theme'
import { object, classifyTool, toolFailed, orchestrationTool } from './protocol'
import { executionMetadata, polledProcess } from './execution'

export const bridgeRoot = (home: string) => join(home, 'pixel-pet')
export const eventPath = (home: string, id: string) => join(bridgeRoot(home), 'events', createHash('sha256').update(id).digest('hex') + '.jsonl')
export const HOOK_EVENTS = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'PreCompact', 'PostCompact', 'SubagentStart', 'SubagentStop', 'Stop', 'Interrupt'] as const
export type StoredTheme = { revision: string; theme: unknown; updatedAt: number }

export async function atomicJson(path: string, data: unknown): Promise<void> {
  await mkdir(resolve(path, '..'), { recursive: true })
  const temporary = `${path}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(data), { mode: 0o600 })
  await rename(temporary, path)
}
export async function readJson(path: string): Promise<unknown | undefined> {
  try {
    if ((await stat(path)).size > 1024 * 1024) throw new Error('Pixel Pet data exceeds 1 MB.')
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) { if (object(error).code === 'ENOENT') return undefined; throw error }
}
export async function storedTheme(home: string): Promise<StoredTheme | undefined> {
  const raw = await readJson(join(bridgeRoot(home), 'theme.json'))
  if (raw === undefined) return undefined
  const data = object(raw)
  if (typeof data.revision !== 'string' || !('theme' in data)) throw new Error('Invalid stored Pixel Pet theme.')
  return data as StoredTheme
}
export async function saveTheme(home: string, theme: unknown): Promise<StoredTheme> {
  let normalized: unknown = null
  if (theme !== null) {
    const result = readTheme(theme)
    if (result.errors) throw new Error(result.errors.join(' '))
    normalized = result.theme
  }
  const saved = { revision: randomUUID(), theme: normalized, updatedAt: Date.now() }
  if (JSON.stringify(saved).length > 1024 * 1024) throw new Error('Theme exceeds 1 MB.')
  await atomicJson(join(bridgeRoot(home), 'theme.json'), saved)
  return saved
}

/** Reduce a hook input to visual metadata before any disk write. */
export function sanitizeHook(input: unknown, targets = false): Record<string, unknown> | undefined {
  const data = object(input)
  if (typeof data.session_id !== 'string' || !data.session_id || data.session_id.length > 256 || typeof data.cwd !== 'string') return undefined
  if (!HOOK_EVENTS.includes(data.hook_event_name as typeof HOOK_EVENTS[number])) return undefined
  if (/^mcp__pixel[-_]pet__/.test(String(data.tool_name ?? ''))) return undefined
  const tool = classifyTool(String(data.tool_name ?? ''), data.tool_input)
  const event: Record<string, unknown> = { event: data.hook_event_name }
  if (typeof data.turn_id === 'string') event.turnId = data.turn_id.slice(0, 256)
  if (typeof data.tool_use_id === 'string') event.callId = data.tool_use_id.slice(0, 256)
  if (data.hook_event_name === 'PreToolUse' || data.hook_event_name === 'PostToolUse') {
    event.mode = tool.mode
    if (orchestrationTool(String(data.tool_name ?? '')) || polledProcess(String(data.tool_name ?? ''), data.tool_input)) event.wrapper = true
    if (targets) event.target = tool.target
  }
  if (data.hook_event_name === 'PostToolUse') {
    event.failed = toolFailed(data.tool_response)
    if (data.tool_name === 'Bash' || orchestrationTool(String(data.tool_name ?? '')) || String(data.tool_name ?? '').endsWith('exec_command') || String(data.tool_name ?? '').endsWith('write_stdin')) {
      const execution = executionMetadata(data.tool_response)
      if (execution.running.length) event.runningProcesses = execution.running.slice(0, 32)
      const poll = polledProcess(String(data.tool_name ?? ''), data.tool_input)
      if (poll && execution.exits.length === 1 && !execution.running.length) event.processEnded = { id: poll, failed: execution.exits[0] !== 0 }
    }
  }
  if (typeof data.agent_id === 'string') event.agentId = data.agent_id.slice(0, 256)
  if (data.hook_event_name === 'SubagentStop') event.failed = data.is_error === true || data.status === 'failed' || data.agent_status === 'failed'
  return { id: data.session_id, cwd: data.cwd.slice(0, 4096), payload: event }
}

export async function writeHook(home: string, input: unknown): Promise<boolean> {
  const preferences = object(await readJson(join(bridgeRoot(home), 'preferences.json')))
  const sanitized = sanitizeHook(input, preferences.targets === true)
  if (!sanitized) return false
  const path = eventPath(home, String(sanitized.id))
  await mkdir(join(bridgeRoot(home), 'events'), { recursive: true })
  const timestamp = new Date().toISOString()
  // Each append is small and contains its own metadata, even if multiple hook processes start together.
  const meta = { type: 'session_meta', timestamp, payload: { id: sanitized.id, cwd: sanitized.cwd, source: 'pixel-pet-hook' } }
  const event = { type: 'pixel_pet_hook', timestamp, payload: sanitized.payload }
  await appendFile(path, JSON.stringify(meta) + '\n' + JSON.stringify(event) + '\n', { mode: 0o600 })
  return true
}
