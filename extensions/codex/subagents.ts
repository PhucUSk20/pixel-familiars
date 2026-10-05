import { discoverSessions, SessionTail, type Session } from './sessions'
import { object, type Snapshot } from './protocol'

/** Child turn events repair missing parent hooks without retaining child messages. */
export function reconcileSubagents(parent: Snapshot, children: Snapshot[], now = Date.now()): Snapshot {
  const states = new Map<string, NonNullable<Snapshot['agentStates']>[number]>((parent.agentStates ?? parent.agents.map(id => ({ id, since: now }))).map(agent => [agent.id, { ...agent }]))
  for (const child of children) {
    if (!child.sessionId || child.turnStartedAt === undefined) continue
    const previous = states.get(child.sessionId)
    const ended = child.turnEndedAt !== undefined && child.turnEndedAt >= child.turnStartedAt
    if (ended) {
      if (!previous || child.turnEndedAt! < previous.since) continue
      states.set(child.sessionId, { ...previous, doneAt: Math.max(previous.doneAt ?? 0, child.turnEndedAt!), cancelled: child.turnCancelled, failed: previous.failed })
    } else {
      if (previous?.doneAt !== undefined && previous.doneAt >= child.turnStartedAt) continue
      states.set(child.sessionId, { id: child.sessionId, since: previous?.doneAt === undefined ? previous?.since ?? child.turnStartedAt : child.turnStartedAt, mode: child.tools ? child.mode : 'agent' })
    }
  }
  const agentStates = [...states.values()].slice(-64).filter(agent => agent.doneAt === undefined || now - agent.doneAt < 1500)
  return { ...parent, agentStates, agents: agentStates.filter(agent => agent.doneAt === undefined).map(agent => agent.id) }
}

/** Read only workspace-scoped child sessions whose metadata names this parent. */
export class SubagentObserver {
  private key = ''
  private nextScan = 0
  private sessions: Session[] = []
  private tails = new Map<string, SessionTail>()
  private children = new Map<string, Snapshot>()
  private cursor = 0

  async poll(home: string, roots: string[], parent: Snapshot): Promise<Snapshot> {
    if (!parent.sessionId) return parent
    const key = JSON.stringify([home, roots, parent.sessionId])
    if (key !== this.key) { this.key = key; this.nextScan = 0; this.tails.clear(); this.children.clear(); this.cursor = 0 }
    if (Date.now() >= this.nextScan) {
      this.sessions = (await discoverSessions(home, roots, false, parent.sessionId)).slice(0, 16)
      this.nextScan = Date.now() + 2000
      const ids = new Set(this.sessions.map(session => session.id))
      for (const id of this.tails.keys()) if (!ids.has(id)) { this.tails.delete(id); this.children.delete(id) }
    }
    // At most four bounded readers per tick; incomplete historical replay cannot
    // falsely end a worker before its newest turn has been read.
    const selected = Array.from({ length: Math.min(4, this.sessions.length) }, () => this.sessions[this.cursor++ % this.sessions.length])
    for (const session of selected) {
      const tail = this.tails.get(session.id) ?? new SessionTail(session.path)
      this.tails.set(session.id, tail)
      try {
        const child = await tail.poll()
        // Forked histories can contain a copied parent session_meta after the
        // child's own header. Use the scoped header identity from discovery.
        if (tail.caughtUp) this.children.set(session.id, { ...child, sessionId: session.id })
      } catch (error) {
        if (object(error).code !== 'ENOENT') throw error
        this.tails.delete(session.id); this.children.delete(session.id)
      }
    }
    return reconcileSubagents(parent, [...this.children.values()])
  }
}
