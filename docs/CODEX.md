# Pixel Familiars for Codex 0.19.7

Maintained by [PhucUSk20](https://github.com/PhucUSk20) in [pixel-familiars](https://github.com/PhucUSk20/pixel-familiars). Existing `Pixel Pet:` command names remain available for compatibility. See [DEVELOPMENT.md](DEVELOPMENT.md) for repository ownership, attribution and the separate upstream contribution workflow.

Version 0.14.0 adds **Pixel Pet: Open Primal Groudon**, an independent panel with six articulated motions and three attacks. See [the Groudon guide](PRIMAL-GROUDON.md). Version 0.15.0 also adds **Pixel Familiars: Open Legendary Arena** where Mega Rayquaza and Groudon coexist, play, spar and rest; individual panels remain available.

This independent project keeps the upstream pixel engine and adds a VS Code companion, native Codex lifecycle hooks and a real MCP theme server. The pet uses its own **Pixel Pet** panel. It does not inject into OpenAI's chat UI or modify OpenAI's installed extension.

## Use the installed version

1. Run **Pixel Pet: Review Codex Hooks** to open the bundled Codex CLI. Enter `/hooks`, review and trust the entries labeled **Pixel Pet observer**. Unrelated hooks are not part of this package.
2. Exit the review CLI, reload VS Code and run **Pixel Pet: Open Companion**.
3. Start a new Codex conversation so MCP tools load, and run a tool. Keep the companion visible and check its source label shows **Direct hooks**. The review CLI does not need to stay open.

This is the recommended flow for detailed tool/subagent events and compaction animations. If review is skipped or native events are unavailable, the companion uses **Log fallback** with reduced coverage.

Codex skips non-managed hooks until the exact definition is trusted. The installer does not modify trust or bypass review. See [official hook trust guidance](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks).

**Upgrading Windows installations from 0.9.0 or earlier:** run the installer again before review. The old hook command quoted the Node executable without PowerShell's invocation operator, so a trusted hook could fail before the observer ran. Version 0.9.1 provides a Windows launcher that works from PowerShell and cmd, invokes Node explicitly and forwards UTF-8 JSON. The command definition changes, so review the new **Pixel Pet observer** entries again. Reload alone cannot repair the old command. **Direct hooks** appears only after a real event for the selected conversation arrives; installation, trust and subprocess tests do not prove IDE delivery.

Worker summoning in 0.9.1 opens an elliptical sigil with orbiting runes in the sky. Its light column extends downward, reaches a smaller ground footprint, and materializes the worker there before it walks to its work spot. Each concurrent task keeps its own portal and identity. The 1.6-second effect observes existing lifecycle events and never launches commands, agents or model requests.

The README includes an [18-second worker demo](images/codex-pet-summoning.gif), recorded with the production worker renderer and simulated Read/Edit/Run events. It shows sky summoning, parallel task workers, parcels brought back on success and a sooty worker raising an error sign on failure. Generate only this demo with `npm.cmd run record:codex-pets -- --only summon`; the default recording command generates all three README GIFs.

MCP tools: `get_theme`, `get_theme_format`, `preview_theme`, `set_theme`. Format resource: `pixel-pet://theme-format`. Example request: “Make my pet a purple slime. Preview every motion first, then apply when I ask.” **Preview** opens the latest generated page. `set_theme` applies/persists the full object or the last preview in this MCP connection. `theme: null` restores the slime.

## Install from source

Requires Node 22.18+, VS Code 1.96+ and a local Codex runtime supporting lifecycle hooks:

```powershell
npm.cmd run install:codex
```

Run this inside the cloned repo (use `npm run install:codex` on macOS/Linux). It installs dependencies, typechecks/builds/packages, installs the VSIX, finds the Codex extension's bundled CLI, and installs hooks/MCP. Node, the VS Code `code` command and the Codex extension must already be installed. The installer opens Codex with `--no-daemon`; enter `/hooks` and review/trust the **Pixel Pet observer** entries to enable **Direct hooks**. The script does not grant trust on your behalf. Exit the review CLI, reload VS Code, open the Pixel Pet panel and start a new Codex chat. Check **Direct hooks** appears after tool activity.

Alternative: `npm.cmd run install:codex -- --no-review` skips opening the review interface. Use it only when you want noninteractive installation or plan to review later; activity uses less complete **Log fallback** until trusted native hook events arrive.

The installer copies bundled hook/MCP code and assets into `<CODEX_HOME>/pixel-pet/runtime`, backs up and merges its entries into `<CODEX_HOME>/hooks.json`, and registers the `pixel-pet` stdio MCP server. Other hooks/servers are preserved. No added model calls or API key are required. **Pixel Pet: Set Up Codex Hooks and MCP** remains available for reinstallation from an installed extension.

Local VSIX packaging uses `tools/codex/package.mjs` with the MIT-licensed `fflate` ZIP library and an explicit list of runtime assets. The package command typechecks and builds first; it does not include dependencies, sign extensions or publish to the Marketplace. The Microsoft `vsce-sign` dependency is not required or installed. MCP registration must succeed before the installer commits the merged hook configuration.

CLI setup: `npm.cmd run setup -- --codex <codex-path>`; optional `--home` selects Codex home. The extension setup locates bundled Codex automatically. Pixel Familiars develops on its own `main` branch at `PhucUSk20/pixel-familiars`, with the original repository retained as `upstream`. The separate `pixel-pet` fork and its existing contribution PR remain independent. This repository setup does not publish the extension to the Marketplace.

## Behavior and remaining differences

| Behavior | Native hook adapter | Log fallback |
| --- | --- | --- |
| Turn start/end/interrupt | UserPromptSubmit, Stop, Interrupt | Recorded turn events |
| Tools including nested code-mode calls | PreToolUse/PostToolUse; independent worker per parallel ID | Recorded calls and structured item events; completed-only children are labeled finished |
| Errors | MCP error flags and shell exit metadata | Recorded output if available |
| Subagents | SubagentStart/SubagentStop; stable birth, 1.5s departure | Best-effort spawn results |
| Approval/compaction | PermissionRequest, PreCompact/PostCompact | Incomplete coverage |
| Context/quota | Session usage records | Same |
| Custom themes | Real MCP tools, preview/apply/reset | File import also works |

The shared engine supplies original motions, faces, props, scenes, minis and pixel HUD gradients/warning colors. HP estimates context remaining from last-request tokens and the model window, never cumulative session usage. MP/ST show only reported 300/10080-minute windows. Missing readings stay `—`.

Bundled Slime and Duck now include a Codex meadow: ground, a round shaded sun with rays, rocks to leap, flowers, trees, grass tufts and drifting clouds. Alien keeps its original full scene and custom props/HUD. The upstream default slime asset itself has no scene; the scene commit adds optional theme support, not a background to every pet. **Pet** chooses a bundled theme (replacing the current theme), **Scene** chooses Meadow or No scene while preserving the pet/props/HUD, and **Reset** restores the default slime and meadow. Custom/imported/MCP themes render exactly their own scene; none is added automatically. Preset scenes are part of the active theme returned by MCP and displayed in previews.

Read, search, web, edit and terminal props are rendered by the same `compose` function as Claude. Each observed tool and subagent has an independent worker mini using half-sized shared poses/props in the main scene. Both enter through sky portals; the main pet does not also draw subagents as an unsummoned trail. Completed-only observations finish their portal entrance before delivering their recorded results, while their badges remain finished. Running, finished, failed and stopped badges explain the state. Workplace buildings remain temporarily disabled; workers continue to move and animate in the ordinary meadow. Free slots avoid the main pet and project Mini where space permits. Up to six fit, depending on panel width, with a count for overflow. `showMinis` controls both worker and subagent minis; the persistent project Mini remains available.

Workers emerge from a sky magic circle beside the AI pet, then walk to their work zones. Their positions follow stable task IDs, so parallel tasks can remain visible together. New workers do not push the AI pet across the canvas. Successful workers run back carrying a parcel, celebrate beside the AI pet and fade away; failed workers return with soot and a red error sign. Click the sign or a completed badge to see the observed task type, duration and optional target, with a button to open VS Code Problems. Raw error output is not retained. The return animation lasts at most nine seconds without extending actual active-tool counts. Interrupted tasks depart neutrally. Real AI activity takes priority over the main pet's celebration.

Structured execution responses with a numeric background `session_id` create process workers even when the enclosing call has returned. They stay until a matching CommandExecution `process_id` exit or direct polling result is observed. Ordinary turn completion keeps them; interruption cancels the display. Hook and log observations of the same handle share one worker. Output prose is never searched for process IDs. When a quiet session has no activity for ten minutes, known unfinished processes remain visible as **awaiting result**, with a gray hourglass and no active count, rather than claiming they are still running.

Tool namespaces such as `web__run` select the corresponding prop. For an unambiguous recorded `functions.exec` wrapper, fallback uses static tool-name/command hints to select its motion; it never executes source code or treats nested source mentions as proof of separate running tools. Structured `item_started`/`item_completed` events additionally identify FileChange, CommandExecution, WebSearch and other supported tool items. When only completion is logged, the child mini is labeled finished and does not increase the active counter. This recovers edits inside mixed wrappers without inventing their start times. Observed children replace their orchestration wrapper in the worker display, and matching IDs deduplicate hook/log events. Partial hooks no longer hide tools available only in fallback.

The main pet keeps the latest tool pose briefly after completion, then returns to thinking when the AI continues with no observed tools. A question mark during that interval is expected: the IDE's Thinking section groups reasoning and tools, but it is not itself a tool lifecycle event. Only reported events drive workers; reasoning text is never analyzed. **Active tools/agents** counts observed activity, not cumulative operations, logical plan steps, or every background OS process. The observer never launches extra AI agents or model requests.

On a real PreCompact event, the pet rests in a steaming bath until PostCompact arrives. HP continues to use reported context usage and is not artificially refilled. This requires compaction events, normally provided by trusted Direct hooks; fallback does not invent a bath from a completed compaction log. Log-spawned minis now have stable birth/departure times, but their individual lifecycles remain best effort; native SubagentStart/Stop events provide full coverage.

SubagentStop without an explicit failure flag/status counts as ordinary completion; failure is not inferred from prose. Unsupported error response formats may need adapters. Native events are sanitized into a small local stream, watched with a 25ms debounce and 250ms recovery polling. Advisory hook commands run synchronously with a 3s timeout to preserve order; they do not approve/deny/rewrite tools and add local process startup overhead. Lifecycle state from the matching session/turn is combined with usage from logs. Historical active counts expire after 10 minutes without updates; known unfinished background processes remain awaiting result.

The companion cannot identify the currently selected Codex chat through a documented API used here. **Session** pins a session or follows the latest matching local IDE session. The pet stays in a separate panel. This release improves behavioral coverage; it does not claim complete parity with the Claude mod's UI/runtime.

Mini automatically watches project results beside the AI pet. It picks up supported build/test/check commands reported by Codex and build/test task results from VS Code, plus editor errors. While a recorded check runs it shows a small busy effect; success makes it celebrate and show a green check, and errors or failed checks produce a red flag. Without evidence it stays neutral. Click to inspect the recorded result; no separate job or Check action is needed. Relevant file edits invalidate old results, and results reset on reload. By default only observed checks enter the checklist; pixelPet.projectChecks can additionally require specific VS Code task names. All observation and animation run locally without model calls, extra commands or tokens. Feed/Play/Rest remain optional local interactions.

### Idle interactions

The AI pet and project Mini explore independently when no real work is observed. Both choose their own destinations, pauses, flower sniffing, butterfly watching, pebble hops and stretches. Ordinary wandering avoids walking through the other pet. Mini no longer follows a fixed position beside the AI pet.

The first invitation appears after 8–16 seconds of idle. Both walk toward a meeting point, and the scene starts only after they arrive. Each scene lasts about 7 seconds, followed by a 6.5-second departure in opposite directions and a random 10–24 second break before the next invitation. The pets continue exploring between encounters. A shuffled playlist covers all 20 scenes before repeating, avoiding an immediate repeat at playlist boundaries. No model call, command, agent or quota change is involved.

| Scene | Movement and props |
| --- | --- |
| Feed / picnic | Pass a cookie, chew with alternating squashes, drop crumbs onto a picnic cloth |
| Play / catch | A ball arcs back and forth; each pet hops when it reaches them |
| Tag | Both run across the ground, reverse direction and leave little dust trails |
| Peekaboo | Mini disappears behind the big pet and peeks out as it looks around |
| Seesaw | A wooden board tilts on a pivot, lifting the two pets in opposite directions |
| Trampoline | The big pet squashes into a spring; Mini bounces above its head |
| Disco | Both lean and wiggle in opposite rhythms under floating music notes |
| Umbrella | The big pet shelters Mini while a tiny cloud drops rain beside them |
| Bubbles | Mini uses a bubble wand; outlined bubbles drift toward the big pet's nose |
| Gift | A box lid lifts and Mini pops out, with a heart above the surprise |
| Tug of war | The rope sways as both pull; Mini wins and the pair tumble sideways |
| Stargazing | Both settle low to the ground under twinkling stars and a moving shooting star |
| High five | Mini jumps up to the cheering big pet, with a flash at contact |
| Paper plane | Mini rides a gliding paper plane while the big pet waves beside its trail |
| Fishing | The big pet holds a fishing rod; a boot lifts out of a puddle and Mini hops at the catch |
| Magic portal | Mini vanishes through an outlined portal and reappears beside the big pet's wand |
| Block tower | Mini balances and leans on a swaying stack of four colorful blocks |
| Pillow fight | Pillows move between the pets as feathers scatter and both wobble |
| Leaf boat | Both bob together on a green leaf while blue ripples flow underneath |
| Photo booth | Both pose beside a camera, then squash in surprise at its bright flash |

**Feed** and **Play** explicitly invite the pets to their respective scenes. **Rest** pauses automatic exploration/play; **Wake** resumes it. While Mini is awake, the big pet explores between games instead of sleeping. `sleepAfter` still controls the big pet's sleep when Mini rests. Dragging or keyboard placement pauses automatic movement for 12 seconds. Real tools, thinking, worker/subagent departures, approval, compaction, error animations and running project checks take priority and cancel an encounter; the AI pet keeps its real activity pose and Mini stays where it was to watch project results. Idle behavior resumes fresh after a break. Hidden webviews do not render frames. Project result flags remain visible and do not change during play. Custom pet sprites and colors are retained.

The README includes two local demos recorded with the same production modules: [independent pet life](images/codex-pet-life.gif) (40 seconds) and [all 20 interactions](images/codex-pet-actions.gif) (7.6 seconds). Recreate both with `npm.cmd run record:codex-pets`. The recorder needs Chrome/Edge (or `PIXEL_PET_BROWSER`) and ffmpeg; it never reads conversation logs or calls an AI model.

Automatic Codex checks use structured CommandExecution lifecycle records, command names and numeric exit status, never output prose. The current adapter recognizes single npm/pnpm/yarn/bun build/test/typecheck/check/lint/package/verify/validate scripts (including colon suffixes), tsc, pytest, node --test, selected npx test/lint tools and cargo/go/dotnet/maven/gradle/make checks. Compound shell scripts, watch/help/dry-run commands, unknown wrappers and arbitrary external terminals are not classified. Results from before the observer started are ignored; missing start metadata or edits during a check cannot verify the current revision. A green mark reflects the observed/required checklist, not every possible test. Native task and Codex command results are scoped to the current workspace; hook trust remains unchanged.
The upstream renderer is shared, but the meadow artwork is a Codex preset; the upstream default slime has no scene and Alien uses its original planet scene. Version 0.4.0 expands the former three-row sun into an 11-row sun with highlights, shading and rays. The exact old generated meadow is upgraded when rendered; modified/custom scenes and configured theme files are preserved. **Scene > Meadow** selects the new preset explicitly.

## Panel placement

Version 0.11.1 adapts to short panels automatically. At a webview height of 420 px or less, the HUD moves into a small column at the upper right beside the scene. Bar widths, typography and scene height shrink together; HP/MP/ST percentages remain visible and reset details are available by hovering each row or through its accessible label. Panels 180 px or shorter omit the connection line to preserve room. Taller panels restore the full HUD below the scene, including visible reset countdowns. A hidden HUD returns its column to the scene. Controls and project details remain available by scrolling; the HUD does not cover the pets. No model calls are involved.

The scene fills the available panel width, with a compact HUD beside it in short panels. Workplace buildings are temporarily disabled in 0.11.1. The meadow, task worker props, summoning, result delivery and idle pet interactions remain active; no model calls or additional tokens are involved.

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

## Independent Legendary Pet

Run **Pixel Pet: Open Legendary Pet** after reloading VS Code. The separate panel shares no sessions, quotas, workers or themes with the Codex Companion. **Hình gốc** plays the original 128px animation; Auto cycles flight, sleep, roar, Pulse and dash. Individual buttons select an action and Pause freezes it. No AI calls or tokens are used.

Version 0.13.0 uses the original first 128px frame as a textured mesh for the five new actions. Measured source bindings articulate the head, jaw, fins, arm, body and tail; spatial tendril masks keep body markings attached to the body. Nearest-neighbor texture sampling retains source colors. The mouth origin follows the articulated face for roar/Pulse effects. Sleep contracts the coil and folds the head/fins; dash opens the coil into a longer spine and returns to it while braking. Head/body movement follows the delayed flow seen in the user's animation reference. These are procedural poses from one view, not newly painted multi-view artwork.

New actions blend for 1.2 seconds from the currently displayed pose, including an interrupted transition. Playback and mesh rasterization are capped at 20fps, and hidden or paused views stop advancement. Responsive scaling uses nearest-neighbor filtering. Original mode preserves all 160 GIF frames without mesh deformation. Only the exact solid background color was made transparent in the extracted atlas.

Version 0.13.1 keeps the sleeping muzzle in front of the coil. The upper tendril follows one continuous head attachment, including transitions and breathing, so its curved arc stays connected. The other four action poses are unchanged.

The supplied GIFs, JSON and reduction script remain unchanged. The rejected generic rig remains inactive. Runtime animation uses mega-rayquaza.ts, legendary-webview.ts and legendary-128px-atlas.png. Recreate docs/images/legendary-source-actions.gif with `npm.cmd run record:legendary`; append `-- --original` to record the source loop or `-- --action sleep` for an isolated sleep preview (Chrome/Edge and ffmpeg required).

Appearance reference: [official Pokémon Mega Rayquaza artwork](https://www.pokemon.co.jp/ex/usum/common/images/legacy/171102_03/poke_03.jpg), from the [Ultra Sun / Ultra Moon website](https://www.pokemon.co.jp/ex/usum/legacy/171102_03.html). Preserve the elongated pointed head, long paired horns, broad fins, green serpentine body with a black underside, gold/orange markings and long flowing tendrils. Use the user's 128px sprite as the pixel-art reference. Original artwork is used for visual comparison only, not bundled in the extension.

## Shared legendary panel (0.15.0)

Run **Pixel Familiars: Open Legendary Arena**. Free flight, roaming, sparring and rest put Rayquaza, Groudon, Kyogre and Deoxys in the same scene. Attacks are cosmetic local animation, independent of Codex activity and usage. Individual panels still provide all manual poses. No additional hook approval is needed for this panel.

Version 0.15.1 redesigns the arena as a black starry volcanic landscape. Basalt fissures, crater lava, falling cinders, smoke and embers animate locally and freeze with the pause control.

## Autonomous legendary life (0.16.0)

The default free mode automatically chooses independent destinations and activities for both pets. Rayquaza flies over the ocean; Groudon walks along the flat volcanic coast. Every roughly 35-60 seconds after a battle, pets travel to sparring positions, exchange 2-4 attacks, then return to their own activities. The first encounter starts after 24-36 seconds plus travel time. No user tasks or AI calls are involved. Manual Duel keeps cycling attacks; Rest stops travel while breathing continues. Pause and hiding the view suspend the entire local simulation.

Recreate the README's autonomous-life GIF with `npm run record:arena -- --auto` (Chrome/Edge or Playwright Chromium and ffmpeg required).

## Primal Kyogre (0.17.0)

Open **Pixel Familiars: Open Primal Kyogre** for seven articulated actions and original source playback. Kyogre shares the Arena with Rayquaza, Groudon and Deoxys; Kyogre stays in the ocean and alternates with Rayquaza as Groudon's sparring partner. See [the Kyogre guide](PRIMAL-KYOGRE.md). No new hook approval is required for local animation.

## Deoxys (0.18.0)

Open **Pixel Familiars: Open Deoxys** for all four supplied forms, free flight and autonomous meteorite transformations. Deoxys also shares Legendary Arena. A meteorite falls nearby before the pet flies down to touch it. Attack, Defense and Speed are selected in randomized cycles and each has its own skill. [Controls and GIF](DEOXYS.md). Animation is local; no additional AI tokens or hook approval. Reload VS Code after installing to register the new panel.

## Rayquaza vs Deoxys (0.19.0)

The Arena **Đấu chiêu** control now starts a Rayquaza/Deoxys aerial match. Defense shield/reflection, Attack projectile/air dodge, Speed pursuit and a Normal psychic/Dragon Pulse clash cycle through meteorite form changes. See [Deoxys controls](DEOXYS.md#rayquaza-duel-0190) and the [production GIF](images/legendary-duel.gif). Cosmetic local animation, no AI requests or tokens.

In 0.19.1, Kyogre and Groudon fight simultaneously below the aerial match, with independent movement into position and attack timing. Pause and Rest stop both pairs.

In 0.19.2, Deoxys transformations keep a neutral source silhouette under the flash. Chest-preserving joint weights and bounded tentacle articulation prevent mesh stretching. Both autonomous and manual energy shots lock the real articulated Rayquaza head at release, then follow that ballistic direction while Rayquaza may dodge.

In 0.19.3, the ground pair has five attack turns. Water cannon release is horizontal; Eruption launches diagonally from the mouth then rains over Kyogre. The added water/fire clash joins two mouth-origin beams at a central energy core. This runs alongside the aerial match and in autonomous ground sparring.

In 0.19.4, Kyogre releases five separate water jets from the original circular charging positions from five circularly arranged charging orbs. The charging orbit freezes at release, and each jet starts at its orb's existing location; the standalone panel and Arena use the same renderer.

In 0.19.5, fire meteors ascend and descend diagonally with matching trails. All five Kyogre jets terminate on Groudon's armor, producing distinct spray, steam and a local recoil reaction after arrival.

In 0.19.6, Kyogre's storm clouds and rain extend across both pets, while jagged lightning descends from above Groudon into its articulated armor position. Impact adds sparks, a local glow and recoil. Pause freezes the storm and all four pets.
