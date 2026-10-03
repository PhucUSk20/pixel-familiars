// Read-only app-server check: no model turn, hook execution, or trust mutation.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
const executable = process.argv[2] || 'codex'
const child = spawn(executable, ['app-server', '--stdio'], { cwd: resolve('.'), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
const pending = new Map()
let sequence = 0
child.stderr.resume()
const lines = createInterface({ input: child.stdout })
lines.on('line', line => {
  let message
  try { message = JSON.parse(line) } catch { return }
  const entry = pending.get(message.id)
  if (!entry) return
  pending.delete(message.id)
  message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result)
})
const request = (method, params) => new Promise((resolve, reject) => {
  const id = ++sequence
  pending.set(id, { resolve, reject })
  child.stdin.write(JSON.stringify({ id, method, params }) + '\n')
})
const timer = setTimeout(() => { for (const entry of pending.values()) entry.reject(new Error('App-server check timed out.')); child.kill() }, 15000)
try {
  await request('initialize', { clientInfo: { name: 'pixel_pet_diagnostic', title: 'Pixel Pet diagnostics', version: '0.2.0' }, capabilities: { experimentalApi: true, requestAttestation: false } })
  child.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n')
  const result = await request('hooks/list', { cwds: [resolve('.')] })
  const owned = result.data.flatMap(entry => entry.hooks).filter(hook => hook.statusMessage === 'Pixel Pet observer')
  console.log(JSON.stringify({ pixelPetHooks: owned.length, hooks: owned.map(hook => ({ event: hook.eventName, enabled: hook.enabled, trust: hook.trustStatus })), configErrors: result.data.flatMap(entry => entry.errors).length }, null, 2))
  if (owned.length !== 12) process.exitCode = 1
} finally { clearTimeout(timer); lines.close(); child.kill() }
