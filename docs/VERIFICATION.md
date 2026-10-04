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

## Codex 0.9.1 Windows hook launcher and sky summoning

- Reproduced a PowerShell ParserError from the installed hook command: a quoted Node executable was interpreted as a string instead of invoked. All 12 existing entries were trusted, but the observer events directory contained no native events. Reloading cannot fix that command. The Windows launcher now invokes Node explicitly through an encoded PowerShell script, forwards UTF-8 JSON and works with both PowerShell and cmd outer shells. Its timeout allows cold Windows shell startup. Hook definitions are backed up and merged; existing trust records are not changed. Changed definitions require a fresh native review.
- Regression subprocesses run the actual bundled observer with spaced/apostrophe/Unicode paths (including the Node executable), confirm an edit event and Unicode cwd are persisted, and exclude prompts/code. Native app-server probes started no model turn and generated no hook notifications, so these probes do not establish IDE delivery. Direct hooks remains conditional on a real event from the selected IDE conversation.
- Summoning now opens a horizontal sky sigil with rotating markers, extends a light column to a separate ground footprint, and materializes the worker there before walking. Parallel portals have separate positions. Tests verify the sky-to-ground sequence, delayed appearance, closing, independent task identities and no extra agents. The effect is local; no model calls or token use are added.
- TypeScript, 56 tests, build/package and the Chromium UI harness pass. UI screenshot: `dist/codex-summoning.png`. The actual VS Code host still needs reload after installing 0.9.1; native delivery must be checked after reviewing the changed hook definitions and running a real IDE tool.
- Installed the 0.9.1 VSIX and merged the Windows launcher with a backup of the previous hooks.json. Executing the installed command with an isolated diagnostic session successfully persisted a sanitized PreToolUse/edit event, which was then removed. Hashes of all existing hook trust-state lines match before and after installation. The IDE's bundled runtime now reports 12 enabled Pixel Pet hooks with trust status `modified` and zero configuration errors; native review is still required. No real IDE Direct hooks event has been confirmed.
- Follow-up after the user's review, 2026-10-04 at 21:22 Asia/Saigon: hooks/list reports all 12 entries enabled and trusted, with zero configuration errors. Real IDE SessionStart, UserPromptSubmit, PreToolUse and PostToolUse events are now arriving for session `01a1017c`. The complete transcript and native event stream have matching session/turn IDs and satisfy the host's Direct hooks selection condition. The user's 21:20 screenshot preceded the first native event at 21:21:57. The 41 MB transcript needs multiple bounded replay ticks after reload; a single SessionTail.poll() is not a reliable diagnostic of its latest turn. The user subsequently confirmed that the panel displays Direct hooks.

## Codex 0.2.3 PR review fixes — 2026-10-04

- Removed the VSCE packaging dependency and all ten `vsce-sign` packages that triggered Sourcery/Trivy unknown-license findings. Local VSIX packaging uses MIT-licensed `fflate` and an explicit asset list. No license metadata was falsified and no scanner exceptions were added.
- `npm audit` reports 0 vulnerabilities; the lockfile has no `vsce-sign` or `SEE LICENSE` entries.
- TypeScript, 24 tests and Chromium smoke pass. Regression tests cover VSIX metadata/contents/XML escaping, exclusion of repository secrets and incomplete archives, session rotation during discovery, failed MCP registration preserving hooks, and a second workspace clearing its own themeFile override after another window applied the same shared theme revision.
- Workspace theme application revisions are now stored in workspaceState rather than shared globalState. MCP registration completes before merged hooks are written. Removed session candidates are skipped when stat reports ENOENT.

## Codex 0.9.0 worker summoning and background processes — 2026-10-04

- Workers summon beside the current AI pet through pixel magic circles, orbiting lights and rising sparkles, then walk to nearby work spots. Stable IDs preserve position through parallel updates; the main pet no longer shifts to reserve a worker strip at the left edge. Completion has a short circle departure.
- Structured execution envelopes supply numeric background handles without retaining output or analyzing prose. Matching command exits or direct polls end each worker independently. Ordinary turn completion preserves known processes; interruption cancels the display. Quiet expired observations stay awaiting result rather than reporting confirmed live work.
- 54 tests cover actual wrapped execution outputs, independent process completion, late output, polling, hook/log deduplication, trust-independent metadata sanitization, stale results, summon pixels, placement, reordering, walking and narrow panels, alongside previous behavior. Chromium smoke additionally runs the bundled host and hook subprocesses through concurrent background launches and independent exits. Screenshots: `dist/codex-summoning.png`, `dist/codex-background-workers.png`.
- No model requests, additional AI agents, hook trust changes, installed OpenAI extension modifications or upstream sprite changes are introduced. Fallback still cannot know a nested task's start before the runtime emits an event or returns its background handle. Direct hooks remains the recommended source for timely lifecycle events.
- The installed runtime's read-only hooks/list check currently reports all 12 Pixel Pet hooks enabled and trusted with zero configuration errors. The actual observer events directory was empty during this inspection, so current IDE hook execution remains unverified. Trust configuration and adapter subprocess tests alone do not establish end-to-end IDE delivery.

## Codex 0.8.0 independent pet life and README GIFs — 2026-10-04

- Added two independent walkers with randomized solo actions and destinations. Invitations use a walking rendezvous; a scene starts on arrival, followed by a departure in opposite directions. Ordinary walking avoids clipping through the other pet. Manual Mini placement and viewport resizing stay bounded.
- Expanded the shared-theme local playlist to 20 distinct interactions, adding paper plane, fishing, magic portal, block tower, pillow fight, leaf boat and photo booth. Real AI activity and project checks retain priority; no observer, host/model requests or quota semantics changed.
- 47 tests cover separate positions and varied movement, bounded steps without teleporting, rendezvous/arrival/departure, work cancellation, placement/resizing, all 20 distinct pixel sequences and both slime/alien art, alongside the existing observer and project coverage. TypeScript, build/package and Chromium smoke check the real renderer, independent roaming, post-scene departure, work/approval/compaction/Rest/Wake, narrow panels and no extra host/model messages.
- The reproducible recorder uses the production habitat, interaction and pixel modules. The README life GIF has 400 frames at 10 fps (592×198, 40 seconds); the 20-scene gallery has 76 frames (816×654, 7.6 seconds). Both loop and are labeled Demo; no live logs, AI requests, upstream sprite changes or hook-trust changes are involved. Files: `docs/images/codex-pet-life.gif`, `docs/images/codex-pet-actions.gif`.

## Codex 0.7.0 autonomous pet interactions — 2026-10-04

- Added 13 distinct local choreographies using the existing theme sprites: picnic, catch, tag, peekaboo, seesaw, trampoline, disco, umbrella, bubbles, gift, tug of war, stargazing and high five. Feed and Play select separate scenes. A shuffled playlist covers all scenes before repeating.
- 43 tests cover idle timing, playlist diversity, immediate cancellation, explicit action replacement, distinct animated pixel sequences, bounded drawing, and both slime/alien themes, alongside existing observer and project-result coverage.
- Chromium smoke exercises the actual webview with a virtual clock: scenes start without clicks even past sleepAfter, Feed/Play paint different pixels, work/approval/compaction interrupt play, Rest pauses, Wake resumes, and a narrow panel fits. The isolated webview sends only its initial ready message; no task/model request is generated by play. The broader hook/MCP/project/worker/fallback suite remains included.
- Screenshot gallery: `dist/codex-interactions.png`; Feed: `dist/codex-feed.png`; autonomous narrow panel: `dist/codex-idle-interaction.png`. No upstream sprite files, hook trust or installed OpenAI extension code were changed.

## Codex 0.6.0 automatic project Mini — 2026-10-04

- Mini passively consumes structured Codex CommandExecution outcomes and VS Code check-task events; the Check button and task-execution handler were removed. Default checklists contain observed checks, with optional explicit required VS Code names.
- TypeScript, 40 tests and VSIX build/package pass. New regressions cover conservative single-command recognition, help/version/config/dry-run rejection, numeric exit metadata/privacy, automatic results, overlapping failure, edit invalidation, historical/untimed/cancelled results and out-of-order replay.
- Chromium smoke passes automatic Codex failure/pass/celebration, passive VS Code task results, code edits invalidating success, repeated polling not restoring stale success, and an out-of-workspace result being ignored. It verifies no Check button, zero task executions, no additional host/model requests, and unchanged quota.
- Check directories remain in the host, results reset on reload, unsupported commands remain unclassified, and successful observed checks do not imply every possible test was run. No hook trust or installed OpenAI code was changed. Screenshot: dist/codex-project-automatic.png.

## Codex 0.5.1 neutral project Mini — 2026-10-04

- Unverified project state renders no question mark or yellow status color. With no selected checks, the label is simply No checks selected. Error flags, verified check marks and evidence rules are preserved.
- TypeScript, 35 tests, build and VSIX packaging passed. Chromium smoke checks that the unverified Mini paints no question-mark pixels, alongside the existing project result and worker coverage.

## Codex 0.5.0 tool worker minis — 2026-10-04

- TypeScript and 35 tests pass. New regressions cover independent parallel IDs, stable births/departure, wrapper suppression, duplicate notifications, completed-only FileChange recovery, command argv, failure/interrupt, partial hook/log merging, stale expiration, privacy, distinct mini props and truthful overflow.
- Chromium smoke passes for three concurrent read/edit/run workers, independent completion and departure, actual hook subprocess children replacing their wrapper, explicit failed/stopped states, and a completed FileChange recovering the edit pose while the active counter stays zero. Eight simultaneous tools exercise six-worker overflow, the one-worker narrow layout, wrapping badges and showMinis without changing the active counter.
- Worker rendering sends no host/model requests and does not create subagents or change usage. The persistent project Mini and real subagent trail remain independent. Native events still require trust; no trust records or installed OpenAI code were modified. Completion-only log events cannot supply live nested start times.
- Screenshot: `dist/codex-parallel-workers.png`, visually inspected. Build/VSIX installation is local; these changes have not been committed or pushed.

## Codex 0.4.0 project Mini and meadow — 2026-10-04

- TypeScript, 29 tests, build, local VSIX packaging and Chromium host smoke passed. Project tests cover incomplete/missing/cancelled checks, code edits during/after verification, and overlapping checks preserving failures.
- Mini observes workspace Diagnostics and selected VS Code task process results. Zero diagnostics alone never means verified. No checks run automatically; Check shows a task picker and executes only the selected task. Ordinary Codex shell tools are not treated as project test results.
- UI smoke verifies reported errors, failed and successful task exits, edit invalidation, unchanged HUD/agent counts, and no task execution before the Check action. All animations/monitoring use local events; no chat client, AI/model calls or telemetry were added.
- Meadow uses an 11-row shaded sun with rays plus trees, flowers and grass. Shared upstream renderer and Alien artwork are unchanged. Exact old generated meadow upgrades; edited scenes/palettes and configured theme files are preserved.
- Screenshots: `dist/codex-project-verified.png`, `dist/codex-meadow.png`; visually inspected.

## Codex 0.3.1 shared-scene Mini companion — 2026-10-04

- Mini is composited directly into the main pixel canvas at the same ground level. Its accessible pointer/keyboard target follows the painted sprite; no separate yard or canvas remains.
- Mini represents the user; the main pet represents the observed AI session. Mini follows it, approaches it for Feed/Play, and the pair show affection while the AI pet keeps real-work priority.
- Chromium verifies dragging Mini away, moving it by keyboard, Play bringing it back beside the AI pet, rest/wake, and both in the shared scene. Privacy, HUD/counter invariants and live-tool priority checks still pass.

## Codex 0.3.0 local Mini playmate — 2026-10-04

- Dependency installation, TypeScript, all 24 existing tests, build, VSIX packaging and Chromium host smoke passed.
- Chromium exercises click-to-pet, feed, play, rest/wake, pointer dragging and keyboard movement. The idle main pet cheers; an active read tool keeps its actual pose during feeding.
- Local play sends no messages to the extension host and changes neither HUD usage nor active-agent counts. No chat client or model calls were added. The mini reuses the current theme's mini sprite/palette; subagent minis remain independent.
- Screenshot: `dist/codex-mini-playmate.png`, visually inspected. Existing narrow-panel, hook/MCP, privacy, scene and animation checks still pass.

## Codex 0.2.2 parity update

- TypeScript and 21 adapter/scene/theme tests pass. New tests verify default ground/sky/obstacles/drifting decor, actual obstacle leap/landing, palette preservation and repeated scene selection, steaming compaction bath without overwriting minis, stable fallback mini birth/departure, parallel tool mode restoration, and namespace/static-wrapper classification.
- Chromium host smoke verifies visible ground/sky/rock pixels; Pet/Scene/Reset actions; read/search/web/edit/bash motions through real hook subprocesses; obstacle jumps; compaction bath entry/exit; fallback wrapper motions and a tool that starts/ends in one append while its prop remains visible with zero active tools. Existing MCP, HUD, privacy, Demo and preview checks still pass.
- Screenshots: `dist/codex-meadow.png`, `dist/codex-alien.png`, `dist/codex-motion-{read,search,web,edit,bash}.png`, `dist/codex-compacting.png`. Screenshots for reading, web and compaction were visually inspected.
- Native trust remains unchanged. Hook subprocesses in the test harness establish adapter behavior, not execution by an actual trusted Codex session. Log fallback remains limited for nested timing, subagent completion and compaction events.

The preserved Claude plugin passes both strict validators with the VS Code bundled Claude `2.1.288`. Its existing suite has 74 passing and 1 failing test on Windows: `preview_theme writes the preview and leaves the pet on screen alone`, expecting the mock key `file:/tmp/mochi.html` but receiving `undefined`. The mod adapter/hooks were not edited. The generated HTML preview builds and executes successfully in Chrome. The standalone older `claude` executable does not accept `--strict`; use the bundled matching runtime for these checks. The original Claude-only TypeScript project requires its runtime-generated type package and was not used for the Codex build.
