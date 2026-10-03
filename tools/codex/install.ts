import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { installBridge } from '../../extensions/codex/install'
const value = (key: string) => { const index = process.argv.indexOf(key); return index >= 0 ? process.argv[index + 1] : undefined }
const result = await installBridge(value('--home') || process.env.CODEX_HOME || join(homedir(), '.codex'), resolve('.'), value('--codex') || 'codex', process.execPath)
console.log(JSON.stringify(result, null, 2))
console.log('Installed. Review and trust the Pixel Pet observer hooks using /hooks in Codex CLI, then restart the Codex session to load its MCP tools. Hook trust was not changed.')
