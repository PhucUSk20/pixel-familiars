import { join } from 'node:path'
import { homedir } from 'node:os'
import { writeHook } from './bridge'

const homeIndex = process.argv.indexOf('--home')
const home = (homeIndex >= 0 ? process.argv[homeIndex + 1] : undefined) || process.env.CODEX_HOME || join(homedir(), '.codex')
async function main(): Promise<void> { try {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of process.stdin) {
    const buffer = Buffer.from(chunk)
    size += buffer.length
    if (size > 8 * 1024 * 1024) throw new Error('Hook input exceeds 8 MB.')
    chunks.push(buffer)
  }
  await writeHook(home, JSON.parse(Buffer.concat(chunks).toString('utf8')))
  process.stdout.write('{}\n')
} catch (error) {
  // Advisory only: never approve, deny, rewrite, or prevent a Codex tool from running.
  process.stderr.write(`Pixel Pet observer: ${error instanceof Error ? error.message : 'hook failed'}\n`)
  process.stdout.write('{}\n')
} }
void main()
