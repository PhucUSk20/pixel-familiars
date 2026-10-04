export type CommandCheck = { id: string; name: string; cwd: string; startedAt?: number; endedAt?: number; exitCode?: number; failed?: boolean; cancelled?: boolean }

/** Decode a shell argv without executing or retaining the command. */
export function commandText(command: unknown): string | undefined {
  if (typeof command === 'string') return command
  if (!Array.isArray(command) || !command.every(arg => typeof arg === 'string')) return undefined
  const argv = command as string[]
  const executable = argv[0]?.split(/[\\/]/).pop() ?? ''
  if (/^(?:powershell|pwsh|bash|sh|zsh|cmd)(?:\.exe)?$/i.test(executable)) {
    const index = argv.findIndex(arg => /^(?:-c|-lc|-command|\/c)$/i.test(arg))
    return index >= 0 && index + 2 === argv.length ? argv[index + 1] : undefined
  }
  return argv.join(' ')
}

/** Conservative check names only; compound shells cannot prove each command passed. */
export function commandCheck(command: unknown): string | undefined {
  const text = commandText(command)?.trim()
  if (!text || text.length > 16_384 || /[\r\n;&|<>`$]/.test(text)) return undefined
  const argv = text.match(/"[^"\r\n]*"|'[^'\r\n]*'|[^\s]+/g)?.map(arg => arg.replace(/^(["'])(.*)\1$/, '$2')) ?? []
  const informational = (arg: string) => {
    const option = arg.split('=')[0]
    return /^(?:-[hHvV?]|--(?:watch|help|version|list|collect-only|dry-run|showconfig|init|print-config|if-present|ignore-scripts|no-run))$/i.test(option) || /^--(?:watch|list)/i.test(option)
  }
  if (argv.some(informational)) return undefined
  const executable = argv.shift()?.split(/[\\/]/).pop()?.replace(/\.(?:cmd|exe)$/i, '').toLowerCase()
  const script = /^(?:build|test|typecheck|check|lint|package|verify|validate)(?::[a-z0-9_-]+)*$/i
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(executable ?? '')) {
    if (argv[0] === 'run') argv.shift()
    return argv[0] && argv[0].length <= 48 && script.test(argv[0]) ? argv[0].toLowerCase() : undefined
  }
  if (executable === 'npx') {
    if (argv[0] === '--yes') argv.shift()
    const tool = argv.shift()
    if (tool === 'tsc') return 'typecheck'
    if ((tool === 'vitest' && argv[0] === 'run') || tool === 'jest') return 'test'
    if (tool === 'eslint') return 'lint'
    if (tool === 'tsx' && argv[0] === '--test') return 'test'
  }
  if (executable === 'tsc') return 'typecheck'
  if (executable === 'pytest' || executable === 'node' && argv[0] === '--test' || /^(?:python|python3|py)$/.test(executable ?? '') && argv[0] === '-m' && argv[1] === 'pytest') return 'test'
  if (executable === 'cargo' && ['test', 'check', 'build', 'clippy'].includes(argv[0])) return argv[0]
  if (['go', 'dotnet', 'mvn', 'gradle', 'gradlew', 'make'].includes(executable ?? '') && ['test', 'build', 'check'].includes(argv[0])) return argv[0]
  return undefined
}
