import { join } from 'node:path'
import { mkdir, copyFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { bridgeRoot, HOOK_EVENTS, atomicJson, readJson } from './bridge'
import { object } from './protocol'

const execute = promisify(execFile)
const MARKER = 'Pixel Pet observer'
/** Windows hooks may run in cmd or PowerShell; a quoted executable alone fails in PowerShell. */
export function hookCommands(nodeCommand: string, runtime: string, home: string): { command: string; commandWindows: string } {
  const quote = (value: string) => { if (/["\r\n`$]/.test(value)) throw new Error('Unsupported character in runtime path.'); return `"${value}"` }
  const command = `${quote(nodeCommand)} ${quote(join(runtime, 'hook.cjs'))} --home ${quote(home)}`
  const literal = (value: string) => `'${value.replaceAll("'", "''")}'`
  // Keep the outer command free of quotes for cmd /C. Decode paths as PowerShell
  // literals, explicitly invoke Node, and forward JSON stdin using UTF-8.
  const script = `$ProgressPreference = 'SilentlyContinue'; $OutputEncoding = [System.Text.UTF8Encoding]::new($false); [Console]::InputEncoding = $OutputEncoding; [Console]::OutputEncoding = $OutputEncoding; [Console]::In.ReadToEnd() | & ${literal(nodeCommand)} ${literal(join(runtime, 'hook.cjs'))} --home ${literal(home)}; exit $LASTEXITCODE`
  return { command, commandWindows: `powershell.exe -NoLogo -NoProfile -NonInteractive -EncodedCommand ${Buffer.from(script, 'utf16le').toString('base64')}` }
}

export function mergeHooks(existing: unknown, command: string, commandWindows = command): Record<string, unknown> {
  if (existing !== undefined && (existing === null || typeof existing !== 'object' || Array.isArray(existing))) throw new Error('Existing hooks.json is not a JSON object; it was not replaced.')
  const document = object(existing)
  if (document.hooks !== undefined && (document.hooks === null || typeof document.hooks !== 'object' || Array.isArray(document.hooks))) throw new Error('Existing hooks field is malformed; it was not replaced.')
  const groups = { ...object(document.hooks) }
  for (const event of HOOK_EVENTS) {
    if (groups[event] !== undefined && !Array.isArray(groups[event])) throw new Error(`Existing ${event} hooks are malformed; they were not replaced.`)
    const original = Array.isArray(groups[event]) ? groups[event] as unknown[] : []
    const kept = original.flatMap(group => {
      const item = object(group)
      if (!Array.isArray(item.hooks)) return [group]
      const hooks = item.hooks.filter(hook => object(hook).statusMessage !== MARKER)
      return hooks.length ? [{ ...item, hooks }] : []
    })
    groups[event] = [...kept, { hooks: [{ type: 'command', command, commandWindows, timeout: 10, statusMessage: MARKER }] }]
  }
  return { ...document, hooks: groups }
}

/** Installs only this package's runtime and merges hooks; does not alter hook trust. */
export async function installBridge(home: string, packageRoot: string, codex = 'codex', nodeCommand = 'node'): Promise<{ hooks: string; runtime: string; backup?: string }> {
  const root = bridgeRoot(home)
  const runtime = join(root, 'runtime')
  const commands = hookCommands(nodeCommand, runtime, home)
  const assets = join(runtime, 'plugin')
  await mkdir(join(assets, 'assets'), { recursive: true })
  await mkdir(join(assets, 'skills', 'pixel-pet'), { recursive: true })
  await mkdir(join(root, 'events'), { recursive: true })
  await copyFile(join(packageRoot, 'dist', 'hook.cjs'), join(runtime, 'hook.cjs'))
  await copyFile(join(packageRoot, 'dist', 'mcp.mjs'), join(runtime, 'mcp.mjs'))
  for (const name of ['slime', 'duck', 'alien']) await copyFile(join(packageRoot, 'plugins', 'pixel-pet', 'assets', name + '.json'), join(assets, 'assets', name + '.json'))
  await copyFile(join(packageRoot, 'plugins', 'pixel-pet', 'skills', 'pixel-pet', 'FORMAT.md'), join(assets, 'skills', 'pixel-pet', 'FORMAT.md'))
  const path = join(home, 'hooks.json')
  const existing = await readJson(path)
  const merged = mergeHooks(existing, commands.command, commands.commandWindows)
  let backup: string | undefined
  if (existing !== undefined && JSON.stringify(merged) !== JSON.stringify(existing)) {
    backup = join(root, `hooks-backup-${Date.now()}.json`)
    await copyFile(path, backup)
  }
  // Ensure this helper uses the same home, without changing any existing MCP server.
  await execute(codex, ['mcp', 'add', 'pixel-pet', '--', nodeCommand, join(runtime, 'mcp.mjs'), '--home', home, '--assets', assets], { env: { ...process.env, CODEX_HOME: home }, windowsHide: true, timeout: 30_000 })
  await atomicJson(path, merged)
  await atomicJson(join(root, 'installation.json'), { version: '0.2.0', installedAt: Date.now() })
  return { hooks: path, runtime, backup }
}
