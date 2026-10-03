# Pixel Pet for Codex

This local fork adds a VS Code companion to the upstream Claude mod. Preserve the MIT license and attribution. Original plugin: `plugins/pixel-pet`. Codex adapter: `extensions/codex`.

- `protocol.ts` translates untrusted Codex JSONL records into activity and usage. Retain no prompts, reasoning, conversation or tool output.
- `sessions.ts` discovers workspace-scoped sessions and tails the selected file. JSONL is an implementation detail, not a public OpenAI extension API.
- `extension.ts` provides VS Code commands, settings, theme storage and the webview host. Never modify OpenAI's installed extension.
- `webview.ts` renders the shared animation/theme/scene engine. Never insert theme/log strings as HTML.
- `.agents/skills/pixel-pet-codex` describes custom theme workflows.
- `bridge.ts` sanitizes native hook inputs before persistence. `hook-entry.ts` observes only; never approve/deny/rewrite tools. `install.ts` backs up/merges owned hooks and installs MCP without modifying hook trust.
- `theme-tools.ts` and `mcp-entry.ts` provide real stdio MCP theme tools. Preview paths are generated inside the owned previews directory; no agent-provided arbitrary write paths.

Verify: `npm.cmd ci`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run package` (use `npm` on Unix). No API key required. See `docs/CODEX.md`.

Also run `npm.cmd run test:ui` after host/renderer/bridge changes. It runs actual hook and MCP subprocesses against the bundled host and headless Chromium. Keep Direct hooks / Log fallback visible and test both paths. Do not bypass the runtime's hook trust mechanism.

For changes to the upstream plugin also follow `CLAUDE.md`. Generated Claude types are not needed by the Codex build. Preserve shared sprite poses and verify upstream pixel tests when changing them.

Keep simulated activity labeled Demo. Unknown context/quota stays unknown. This extension observes activity; it does not grant Codex additional permissions or control agent orchestration.
