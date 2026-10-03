# Pixel Pet for Codex 0.2

This local fork keeps the upstream pixel engine and adds a VS Code companion, native Codex lifecycle hooks and a real MCP theme server. The pet uses its own **Pixel Pet** panel. It does not inject into OpenAI's chat UI or modify OpenAI's installed extension.

## Use the installed version

1. Reload VS Code and run **Pixel Pet: Open Companion**.
2. Start a new Codex conversation so MCP tools load, and keep the companion visible. **Log fallback** works without reviewing hooks.

Optional: run **Pixel Pet: Review Codex Hooks** to open the bundled Codex CLI, enter `/hooks`, and review/trust the entries labeled **Pixel Pet observer** to enable **Direct hooks**. Then reload VS Code and start a new Codex conversation. Unrelated hooks are not part of this package.

Codex skips non-managed hooks until the exact definition is trusted. The installer does not modify trust or bypass review. See [official hook trust guidance](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks).

MCP tools: `get_theme`, `get_theme_format`, `preview_theme`, `set_theme`. Format resource: `pixel-pet://theme-format`. Example request: “Make my pet a purple slime. Preview every motion first, then apply when I ask.” **Preview** opens the latest generated page. `set_theme` applies/persists the full object or the last preview in this MCP connection. `theme: null` restores the slime.

## Install from source

Requires Node 22.18+, VS Code 1.96+ and a local Codex runtime supporting lifecycle hooks:

```powershell
npm.cmd run install:codex -- --no-review
```

Run this inside the cloned repo (use `npm run install:codex -- --no-review` on macOS/Linux). This single command installs dependencies, typechecks/builds/packages, installs the VSIX, finds the Codex extension's bundled CLI for setup, and installs hooks/MCP. Node, the VS Code `code` command and the Codex extension must already be installed. `--no-review` skips opening the interactive Codex CLI; the companion uses **Log fallback** without requiring hook trust. After installation, reload VS Code, open the Pixel Pet panel and start a new Codex chat.

For optional hook review during installation, omit `-- --no-review`. The installer then opens Codex with `--no-daemon`; enter `/hooks` and review/trust the **Pixel Pet observer** entries to enable **Direct hooks**. The script does not grant trust on your behalf.

The installer copies bundled hook/MCP code and assets into `<CODEX_HOME>/pixel-pet/runtime`, backs up and merges its entries into `<CODEX_HOME>/hooks.json`, and registers the `pixel-pet` stdio MCP server. Other hooks/servers are preserved. No added model calls or API key are required. **Pixel Pet: Set Up Codex Hooks and MCP** remains available for reinstallation from an installed extension.

CLI setup: `npm.cmd run setup -- --codex <codex-path>`; optional `--home` selects Codex home. The extension setup locates bundled Codex automatically. This is a local fork on `codex-vscode`, with remote `upstream`; no GitHub account fork or Marketplace publication is implied.

## Behavior and remaining differences

| Behavior | Native hook adapter | Log fallback |
| --- | --- | --- |
| Turn start/end/interrupt | UserPromptSubmit, Stop, Interrupt | Recorded turn events |
| Tools including nested code-mode calls | PreToolUse/PostToolUse; balances parallel IDs | Visible top-level calls |
| Errors | MCP error flags and shell exit metadata | Recorded output if available |
| Subagents | SubagentStart/SubagentStop; stable birth, 1.5s departure | Best-effort spawn results |
| Approval/compaction | PermissionRequest, PreCompact/PostCompact | Incomplete coverage |
| Context/quota | Session usage records | Same |
| Custom themes | Real MCP tools, preview/apply/reset | File import also works |

The shared engine supplies original motions, faces, props, scenes, minis and pixel HUD gradients/warning colors. HP estimates context remaining from last-request tokens and the model window, never cumulative session usage. MP/ST show only reported 300/10080-minute windows. Missing readings stay `—`.

SubagentStop without an explicit failure flag/status counts as ordinary completion; failure is not inferred from prose. Unsupported error response formats may need adapters. Native events are sanitized into a small local stream, watched with a 25ms debounce and 250ms recovery polling. Advisory hook commands run synchronously with a 3s timeout to preserve order; they do not approve/deny/rewrite tools and add local process startup overhead. Lifecycle state from the matching session/turn is combined with usage from logs. Historical activity expires after 10 minutes without updates.

The companion cannot identify the currently selected Codex chat through a documented API used here. **Session** pins a session or follows the latest matching local IDE session. The pet stays in a separate panel. This release improves behavioral coverage; it does not claim complete parity with the Claude mod's UI/runtime.

## Settings and theme workflow

`codexHome` uses `CODEX_HOME`, then `~/.codex`, on the extension host. `includeCli` and `showTargets` default to false. `speed`, `sleepAfter`, `showHud`, `showMinis`, `showStatusLine` control rendering. **Demo** is explicitly simulated. All setting names have prefix `pixelPet.`.

`themeFile` can be workspace-relative or absolute and refreshes on save:

```json
{ "pixelPet.themeFile": "themes/my-pet.json", "pixelPet.showTargets": false }
```

Import/reset/MCP application clears the active workspace's `themeFile` override so the applied theme appears. Shared themes are user-wide for the same Codex home; multiple windows share the theme, and MCP get_theme reflects the most recently published active companion theme. The skill is `.agents/skills/pixel-pet-codex/SKILL.md`; the original schema remains `plugins/pixel-pet/skills/pixel-pet/FORMAT.md`.

## Privacy and environment limits

No added telemetry, network service or model requests. MCP uses stdio. Previews are generated inside `<CODEX_HOME>/pixel-pet/previews`; agents cannot choose arbitrary write paths. Theme input is capped at 1 MB.

Global hook commands observe local sessions and discard prompts, reasoning, transcript paths and raw output before persistence. Events retain session/cwd/turn/call/agent identifiers, timestamps, modes and error flags. Targets are retained only with `showTargets`; disabling it stops future capture but does not erase old files. Theme/previews/sanitized events remain under `<CODEX_HOME>/pixel-pet` until removed by the user.

The host also streams the selected transcript for fallback/usage and discards raw records. Only optional short targets, identifiers, visual state and numeric usage go to the webview. It reads themes and CODEX_HOME, stores local files and updates theme settings on apply. Original README privacy promises concern only the preserved Claude mod. Workspace Trust is required. CSP blocks webview networking; data is drawn through canvas/textContent.

Sessions must have `cwd` equal to a workspace or a descendant. Discovery covers the 14 latest date folders/200 latest files; pins remain selected. Archived/cloud sessions are excluded. Rollout JSONL is internal and may change. For WSL/SSH/containers, install in Codex's extension host and set codexHome. Cross-host observation and Windows/WSL path translation are not implemented.

## Verification

`npm run test:ui` uses actual hook and MCP subprocesses plus headless Chromium against the bundled host in a minimal VS Code API harness. It checks source selection, nested tools, subagent lifecycle/error, MCP preview/apply/reset/resources, HUD, privacy, Demo and upstream preview. Screenshot: `dist/codex-companion.png`. Set `PIXEL_PET_BROWSER` to Chrome/Edge or install Chromium with `npx playwright install chromium`. This is not an automated test inside an actual VS Code extension host.

`npm run diagnose -- <workspace>` prints only real session activity/numeric usage. `node tools/codex/check-hooks.mjs <codex-path>` reads the native app-server hooks/list endpoint without model turns, hook execution or trust mutation.

References: [upstream](https://github.com/Namenomeaning/pixel-pet), [VS Code webviews](https://code.visualstudio.com/api/extension-guides/webview), [Codex hooks including nested tools](https://learn.chatgpt.com/docs/hooks), [Codex IDE](https://learn.chatgpt.com/docs/codex/ide).
