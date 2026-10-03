# Pixel Pet for Codex 0.2.2

This local fork keeps the upstream pixel engine and adds a VS Code companion, native Codex lifecycle hooks and a real MCP theme server. The pet uses its own **Pixel Pet** panel. It does not inject into OpenAI's chat UI or modify OpenAI's installed extension.

## Use the installed version

1. Run **Pixel Pet: Review Codex Hooks** to open the bundled Codex CLI. Enter `/hooks`, review and trust the entries labeled **Pixel Pet observer**. Unrelated hooks are not part of this package.
2. Exit the review CLI, reload VS Code and run **Pixel Pet: Open Companion**.
3. Start a new Codex conversation so MCP tools load, and run a tool. Keep the companion visible and check its source label shows **Direct hooks**. The review CLI does not need to stay open.

This is the recommended flow for detailed tool/subagent events and compaction animations. If review is skipped or native events are unavailable, the companion uses **Log fallback** with reduced coverage.

Codex skips non-managed hooks until the exact definition is trusted. The installer does not modify trust or bypass review. See [official hook trust guidance](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks).

MCP tools: `get_theme`, `get_theme_format`, `preview_theme`, `set_theme`. Format resource: `pixel-pet://theme-format`. Example request: “Make my pet a purple slime. Preview every motion first, then apply when I ask.” **Preview** opens the latest generated page. `set_theme` applies/persists the full object or the last preview in this MCP connection. `theme: null` restores the slime.

## Install from source

Requires Node 22.18+, VS Code 1.96+ and a local Codex runtime supporting lifecycle hooks:

```powershell
npm.cmd run install:codex
```

Run this inside the cloned repo (use `npm run install:codex` on macOS/Linux). It installs dependencies, typechecks/builds/packages, installs the VSIX, finds the Codex extension's bundled CLI, and installs hooks/MCP. Node, the VS Code `code` command and the Codex extension must already be installed. The installer opens Codex with `--no-daemon`; enter `/hooks` and review/trust the **Pixel Pet observer** entries to enable **Direct hooks**. The script does not grant trust on your behalf. Exit the review CLI, reload VS Code, open the Pixel Pet panel and start a new Codex chat. Check **Direct hooks** appears after tool activity.

Alternative: `npm.cmd run install:codex -- --no-review` skips opening the review interface. Use it only when you want noninteractive installation or plan to review later; activity uses less complete **Log fallback** until trusted native hook events arrive.

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

Bundled Slime and Duck now include a Codex meadow: ground, sun, rocks to leap, flowers and drifting clouds. Alien keeps its original full scene and custom props/HUD. The upstream default slime asset itself has no scene; the scene commit adds optional theme support, not a background to every pet. **Pet** chooses a bundled theme (replacing the current theme), **Scene** chooses Meadow or No scene while preserving the pet/props/HUD, and **Reset** restores the default slime and meadow. Custom/imported/MCP themes render exactly their own scene; none is added automatically. Preset scenes are part of the active theme returned by MCP and displayed in previews.

Read, search, web, edit and terminal props are rendered by the same `compose` function as Claude. Tool namespaces such as `web__run` now select the correct prop. For an unambiguous recorded `functions.exec` wrapper, fallback uses static tool-name/command hints to select its motion; it never executes source code. Wrappers mixing different kinds of tools remain generic terminal activity. Fallback cannot reconstruct the timing of each nested call. A completed tool's pose is held for up to 1.2 seconds so fast calls remain visible; **active tools/agents** still counts actual observed activity, not a cumulative total.

On a real PreCompact event, the pet rests in a steaming bath until PostCompact arrives. HP continues to use reported context usage and is not artificially refilled. This requires compaction events, normally provided by trusted Direct hooks; fallback does not invent a bath from a completed compaction log. Log-spawned minis now have stable birth/departure times, but their individual lifecycles remain best effort; native SubagentStart/Stop events provide full coverage.

SubagentStop without an explicit failure flag/status counts as ordinary completion; failure is not inferred from prose. Unsupported error response formats may need adapters. Native events are sanitized into a small local stream, watched with a 25ms debounce and 250ms recovery polling. Advisory hook commands run synchronously with a 3s timeout to preserve order; they do not approve/deny/rewrite tools and add local process startup overhead. Lifecycle state from the matching session/turn is combined with usage from logs. Historical activity expires after 10 minutes without updates.

The companion cannot identify the currently selected Codex chat through a documented API used here. **Session** pins a session or follows the latest matching local IDE session. The pet stays in a separate panel. This release improves behavioral coverage; it does not claim complete parity with the Claude mod's UI/runtime.

## Panel placement

The installed Codex extension exposes its conversation as its own VS Code webview. No documented integration point was found for embedding another extension's live companion inside that conversation or above its prompt. Pixel Pet therefore owns a separate webview; it does not modify the installed Codex extension.

For a closer layout, open Codex and Pixel Pet, then drag the **Pixel Pet: Codex Companion** view header into the same sidebar/view container as Codex, below the chat. You can also use the view header's **Move View** action or the Command Palette's **View: Move View** command to select a destination. Resize the split so the pet sits below the conversation. It remains a separate view, but both can be visible in one sidebar. See [VS Code custom layout](https://code.visualstudio.com/docs/configure/custom-layout) and [webview isolation](https://code.visualstudio.com/api/extension-guides/webview).

MCP tools for theme changes do not themselves provide a persistent pet overlay inside the Codex IDE chat. An embedded UI would require a supported Codex UI integration point; this fork does not currently have one.

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
