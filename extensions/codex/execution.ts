const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

export const processHandle = (value: unknown): string | undefined => {
  const text = typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? String(value) : typeof value === 'string' ? value : ''
  return /^\d{1,16}$/.test(text) ? text : undefined
}

/** Read tool-envelope metadata only. Never descend into stdout/output prose. */
export function executionMetadata(output: unknown): { running: string[]; exits: number[] } {
  const running = new Set<string>(), exits: number[] = []
  let budget = 128
  function visit(value: unknown, depth = 0): void {
    if (depth > 6 || --budget < 0) return
    if (typeof value === 'string') {
      if (value.length > 256 * 1024) return
      try { visit(JSON.parse(value), depth + 1) } catch { /* Unstructured stdout is not execution metadata. */ }
      return
    }
    if (Array.isArray(value)) { value.forEach(item => visit(item, depth + 1)); return }
    const data = object(value)
    const envelope = typeof data.chunk_id === 'string' || typeof data.wall_time_seconds === 'number'
    const exit = typeof data.exit_code === 'number' && Number.isSafeInteger(data.exit_code) ? data.exit_code : undefined
    const id = processHandle(data.session_id)
    if (envelope && id && exit === undefined) running.add(id)
    if (envelope && exit !== undefined) exits.push(exit)
    if (Array.isArray(data.content)) visit(data.content, depth + 1)
    if (data.type === 'text' && typeof data.text === 'string') visit(data.text, depth + 1)
    if (data.structuredContent) visit(data.structuredContent, depth + 1)
  }
  visit(output)
  return { running: [...running], exits }
}

/** A direct poll can close its known process even before the completed item arrives. */
export function polledProcess(name: string, input: unknown): string | undefined {
  if (!name.endsWith('write_stdin')) return undefined
  let data = input
  if (typeof data === 'string') { try { data = JSON.parse(data) } catch { return undefined } }
  return processHandle(object(data).session_id)
}
