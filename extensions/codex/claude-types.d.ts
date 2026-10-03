// Only the erased usage type is needed by the shared HUD engine. No Claude runtime is bundled.
declare module 'claude-code' {
  export interface AgentInfo { id: string; status: string }
  export interface SessionUsage {
    context: { percent: number }
    rateLimits: { kind: string; percentUsed: number; resetsAt?: string }[]
  }
}
