// Runs with plain Node so a fresh checkout does not need dependencies first.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { homedir } from 'node:os'

const root = fileURLToPath(new URL('../../', import.meta.url))
const windows = process.platform === 'win32'
let codeCommand = 'code'
function run(command, args, capture = false) {
  const result = spawnSync(command, args, { cwd: root, stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8', windowsHide: true })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal}). ${capture ? result.stderr : ''}`)
  return result.stdout?.trim()
}
// Only fixed commands go through cmd.exe; paths are passed directly to Node/CLI.
function cli(command, args, capture = false) {
  return windows
    ? run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `${command}.cmd ${args.join(' ')}`], capture)
    : run(command === 'code' ? codeCommand : command, args, capture)
}

try {
  const [major, minor] = process.versions.node.split('.').map(Number)
  if (major < 22 || (major === 22 && minor < 18)) throw new Error('Install Node 22.18 or later first.')
  try {
    cli('code', ['--version'], true)
  } catch (error) {
    if (process.platform !== 'darwin' || error.code !== 'ENOENT') throw error
    const application = ['/Applications', join(homedir(), 'Applications')]
      .map(directory => join(directory, 'Visual Studio Code.app', 'Contents', 'Resources', 'app', 'bin', 'code'))
      .find(path => existsSync(path))
    if (!application) throw new Error("Install Visual Studio Code in Applications, or run Shell Command: Install 'code' command in PATH from its Command Palette and restart Terminal.")
    codeCommand = application
    cli('code', ['--version'], true)
  }
  let codex
  const platform = { win32: 'windows', darwin: 'macos', linux: 'linux' }[process.platform]
  const architecture = { x64: 'x86_64', arm64: 'aarch64' }[process.arch]
  const extension = cli('code', ['--locate-extension', 'openai.chatgpt'], true)
  if (extension && platform && architecture) {
    const bundled = join(extension, 'bin', `${platform}-${architecture}`, windows ? 'codex.exe' : 'codex')
    if (existsSync(bundled)) codex = bundled
  }
  if (!codex) {
    const candidates = run(windows ? 'where.exe' : 'which', ['codex'], true).split(/\r?\n/)
    codex = candidates.find(path => !windows || /\.exe$/i.test(path))
    if (!codex) throw new Error('Install the Codex extension in VS Code first; its bundled CLI could not be found.')
  }
  run(codex, ['--version'])
  console.log('\nInstalling Pixel Familiars…')
  cli('npm', ['ci'])
  cli('npm', ['run', 'package'])
  cli('code', ['--install-extension', './dist/pixel-pet-codex.vsix', '--force'])
  run(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'tools/codex/install.ts', '--codex', codex])
  console.log('\nInstalled. Reload VS Code and open the Pixel Pet panel. Start a new Codex chat to load MCP tools.')
  if (process.argv.includes('--no-review') || !process.stdin.isTTY) {
    console.log('For native events, use Pixel Pet: Review Codex Hooks in VS Code. Log fallback works before trust.')
  } else {
    console.log('For native events, enter /hooks below and review/trust the Pixel Pet observer entries. Log fallback works before trust.')
    run(codex, ['-C', root])
  }
} catch (error) {
  console.error(`\nPixel Pet installation: ${error.message}`)
  process.exitCode = 1
}
