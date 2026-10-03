import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { discoverSessions, inspectSession } from '../../extensions/codex/sessions'

const workspace = resolve(process.argv[2] ?? '.')
const home = process.env.CODEX_HOME || join(homedir(), '.codex')
const sessions = await discoverSessions(home, [workspace])
if (!sessions.length) {
  console.log('No recent local VS Code Codex session matches this workspace. Check CODEX_HOME or pass the session workspace directory.')
  process.exitCode = 1
} else {
  const snapshot = await inspectSession(sessions[0].path)
  console.log(JSON.stringify({ matchingSessions: sessions.length, session: snapshot.sessionId?.slice(0, 8), working: snapshot.working, activeTools: snapshot.tools, mode: snapshot.mode, usage: snapshot.usage }, null, 2))
}
