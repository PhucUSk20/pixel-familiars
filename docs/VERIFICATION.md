# Verification — 2026-10-03

Upstream base: `02eb10a`, branch `codex-vscode`. Local VS Code Codex version: `26.5928.31416`. Node: `24.11.1`.

- Codex TypeScript check, bundle and VSIX packaging passed.
- 16 adapter/observer/hook/theme tests passed.
- Chrome smoke passed using the bundled host in a VS Code API harness: real JSONL fallback; hook subprocess into Direct hooks, nested calls, subagent start/stop and shell error; actual stdio MCP list/resources/preview/apply/reset reflected in the panel; original pixel HUD, hidden targets, Demo and upstream preview without JavaScript errors. Screenshot: `dist/codex-companion.png`.
- Diagnostic observer matched the actual local IDE session and read numeric context/quota. Raw conversation content was not printed.
- `npm audit`: 0 vulnerabilities after upgrading the packaging tool to VSCE 4.
- Native Codex 0.159.2 read-only app-server hooks/list recognizes all 12 installed Pixel Pet hooks with 0 configuration errors. Their trust status is currently untrusted; actual native event execution is pending user /hooks review. No trust records or bypass flags were changed.
- `codex mcp get pixel-pet --json` confirms the enabled installed stdio server. Setup backs up and preserves existing hooks.
- Version 0.2.1 VSIX installed successfully through `npm.cmd run install:codex -- --no-review`: dependency installation, packaging, VS Code installation, automatic bundled CLI discovery and hooks/MCP registration passed together.
- Bundled Codex starts its interactive interface with `--no-daemon` and reaches folder trust review. The review command includes this flag; the Chromium host harness checks the generated command. No folder/hook trust was granted by this check.

The actual VS Code extension-host UI was not automated. After reloading the window, use **Pixel Pet: Open Companion** to check it beside Codex.

## Codex 0.2.2 parity update

- TypeScript and 21 adapter/scene/theme tests pass. New tests verify default ground/sky/obstacles/drifting decor, actual obstacle leap/landing, palette preservation and repeated scene selection, steaming compaction bath without overwriting minis, stable fallback mini birth/departure, parallel tool mode restoration, and namespace/static-wrapper classification.
- Chromium host smoke verifies visible ground/sky/rock pixels; Pet/Scene/Reset actions; read/search/web/edit/bash motions through real hook subprocesses; obstacle jumps; compaction bath entry/exit; fallback wrapper motions and a tool that starts/ends in one append while its prop remains visible with zero active tools. Existing MCP, HUD, privacy, Demo and preview checks still pass.
- Screenshots: `dist/codex-meadow.png`, `dist/codex-alien.png`, `dist/codex-motion-{read,search,web,edit,bash}.png`, `dist/codex-compacting.png`. Screenshots for reading, web and compaction were visually inspected.
- Native trust remains unchanged. Hook subprocesses in the test harness establish adapter behavior, not execution by an actual trusted Codex session. Log fallback remains limited for nested timing, subagent completion and compaction events.

The preserved Claude plugin passes both strict validators with the VS Code bundled Claude `2.1.288`. Its existing suite has 74 passing and 1 failing test on Windows: `preview_theme writes the preview and leaves the pet on screen alone`, expecting the mock key `file:/tmp/mochi.html` but receiving `undefined`. The mod adapter/hooks were not edited. The generated HTML preview builds and executes successfully in Chrome. The standalone older `claude` executable does not accept `--strict`; use the bundled matching runtime for these checks. The original Claude-only TypeScript project requires its runtime-generated type package and was not used for the Codex build.
