import { open, readdir, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { join, resolve } from 'node:path'
import { SessionReducer, object, type Snapshot } from './protocol'

export type Session = { path: string; id: string; cwd: string; modified: number }
const normalize = (path: string) => {
  const windows = /^[a-z]:[\\/]/i.test(path)
  const normal = path.replace(/\\/g, '/').replace(/\/+$/, '')
  return windows ? normal.toLowerCase() : normal
}
export function matchesWorkspace(cwd: string, roots: string[]): boolean {
  const folder = normalize(cwd)
  return roots.some(root => {
    const workspace = normalize(root)
    return folder === workspace || folder.startsWith(workspace + '/')
  })
}

async function metadata(path: string): Promise<Record<string, unknown>> {
  const handle = await open(path, 'r')
  try {
    const buffer = Buffer.alloc(256 * 1024)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    const first = buffer.subarray(0, bytesRead).toString('utf8').split('\n')[0]
    const row = object(JSON.parse(first))
    return row.type === 'session_meta' ? object(row.payload) : {}
  } finally { await handle.close() }
}

/** Scan recent date folders, rather than repeatedly walking every historical transcript. */
export async function discoverSessions(home: string, roots: string[], includeCli = false): Promise<Session[]> {
  const base = join(home, 'sessions')
  const directories: string[] = []
  const years = (await readdir(base, { withFileTypes: true })).filter(d => d.isDirectory() && /^\d{4}$/.test(d.name)).sort((a, b) => b.name.localeCompare(a.name))
  outer: for (const year of years) {
    const yearPath = join(base, year.name)
    const months = (await readdir(yearPath, { withFileTypes: true })).filter(d => d.isDirectory()).sort((a, b) => b.name.localeCompare(a.name))
    for (const month of months) {
      const monthPath = join(yearPath, month.name)
      const days = (await readdir(monthPath, { withFileTypes: true })).filter(d => d.isDirectory()).sort((a, b) => b.name.localeCompare(a.name))
      for (const day of days) {
        directories.push(join(monthPath, day.name))
        if (directories.length >= 14) break outer
      }
    }
  }
  const candidates: { path: string; modified: number }[] = []
  for (const directory of directories) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue
      const path = join(directory, entry.name)
      try { candidates.push({ path, modified: (await stat(path)).mtimeMs }) }
      catch (error) { if (object(error).code !== 'ENOENT') throw error }
    }
  }
  const sessions: Session[] = []
  for (const candidate of candidates.sort((a, b) => b.modified - a.modified).slice(0, 200)) {
    try {
      const meta = await metadata(candidate.path)
      const source = meta.source
      const vscode = source === 'vscode' || meta.originator === 'codex_vscode'
      if (!vscode && !(includeCli && source === 'cli')) continue
      if (typeof meta.cwd !== 'string' || !matchesWorkspace(meta.cwd, roots)) continue
      sessions.push({ ...candidate, id: String(meta.id ?? meta.session_id ?? ''), cwd: meta.cwd })
    } catch (error) {
      if (object(error).code === 'ENOENT' || error instanceof SyntaxError) continue
      throw error
    }
  }
  return sessions
}

/** Incremental, bounded JSONL reader. A split UTF-8 sequence stays buffered until its newline. */
export class SessionTail {
  private position = 0
  private pending = Buffer.alloc(0)
  private discarding = false
  private reducer = new SessionReducer()
  private lastSize = -1
  private lastModified = -1
  malformed = 0
  constructor(readonly path: string) {}

  async poll(): Promise<Snapshot> {
    const handle = await open(this.path, 'r')
    try {
      const info = await handle.stat()
      if (info.size < this.position || (info.size === this.lastSize && info.mtimeMs !== this.lastModified)) {
        this.position = 0; this.pending = Buffer.alloc(0); this.discarding = false; this.reducer = new SessionReducer()
      }
      this.lastSize = info.size; this.lastModified = info.mtimeMs
      // Replay at most 4 MB per tick so a large history never blocks the extension host.
      const end = Math.min(info.size, this.position + 4 * 1024 * 1024)
      while (this.position < end) {
        const buffer = Buffer.alloc(Math.min(64 * 1024, end - this.position))
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, this.position)
        if (!bytesRead) break
        this.position += bytesRead
        this.consume(buffer.subarray(0, bytesRead))
      }
      return this.reducer.current()
    } finally { await handle.close() }
  }

  private consume(chunk: Buffer): void {
    let buffer = Buffer.concat([this.pending, chunk])
    this.pending = Buffer.alloc(0)
    let newline: number
    while ((newline = buffer.indexOf(10)) >= 0) {
      const line = buffer.subarray(0, newline)
      buffer = buffer.subarray(newline + 1)
      if (this.discarding) { this.discarding = false; continue }
      if (!line.length) continue
      try { this.reducer.apply(JSON.parse(line.toString('utf8'))) } catch { this.malformed++ }
    }
    // Prompts may be huge. Skip oversized records, including their remainder, without retaining them.
    if (buffer.length > 2 * 1024 * 1024) { this.discarding = true; this.malformed++ }
    else if (!this.discarding) this.pending = Buffer.from(buffer)
  }
}

/** Read-only diagnostic used in development, returning aggregates only. */
export async function inspectSession(path: string): Promise<Snapshot> {
  const reader = createInterface({ input: createReadStream(resolve(path)), crlfDelay: Infinity })
  const reducer = new SessionReducer()
  for await (const line of reader) {
    try { reducer.apply(JSON.parse(line)) } catch { /* Ignore an incomplete final write. */ }
  }
  return reducer.current()
}
