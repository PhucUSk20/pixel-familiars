## Compact one-line English Arena HUD 0.19.9 — 2026-10-06

- CTX, 5h and Week remaining percentages, miniature pixel bars and compact reset countdowns stay on one line. Detailed English tooltips retain full countdown meaning. Unknown values remain unknown.
- Restored visible Auto, Duel and Rest buttons directly below the meters. Removed the header menu and Pause button/handler. Arena text, loading/error messages and accessible labels are English.
- Responsive browser assertions check a single meter row, no horizontal overflow and visible actions underneath on narrow and shallow panels. Shared real session usage still updates with the Pixel Pet view hidden.
- `npm ci`, typecheck, build, all 107 sequential tests and the complete Chromium UI suite pass. Re-recorded both Arena GIFs, packaged and installed extension 0.19.9.

## Shared Legendary Arena usage HUD 0.19.8 — 2026-10-06

- Replaced the action-button footer with remaining context, 5-hour quota and weekly quota plus reset countdowns. Unknown values remain unknown. Moved animation controls to the header menu, retaining automatic play by default.
- Arena subscribes to the companion's existing workspace/session observer. Arena visibility keeps that observer active independently of the Pixel Pet view. The webview receives only bounded numeric usage/reset fields; no transcript or tool contents. Disposal removes its subscription.
- Coverage checks three metrics, metadata sanitization, countdown boundaries, missing values, live updates with the companion hidden, controls, pause and responsive layout.
- `npm ci`, typecheck, build, all 107 sequential tests and the complete Chromium UI suite pass. Recorded both Arena GIFs with the new footer, packaged and installed extension 0.19.8.

## Magma blades and twin waterspouts 0.19.7 — 2026-10-06

- Groudon sends a glowing ground fracture towards Kyogre. Six successive jagged magma columns grow taller along the path, erupt beneath Kyogre and throw fragments, spray and steam. Kyogre recoils on contact. The standalone panel uses the same blade renderer.
- Kyogre raises two independently spiraling waterspouts, draws them together, and launches a fused rotating water drill into Groudon's articulated armor position. Contact creates a broad splash, steam, armor flash and recoil. The standalone panel shares the choreography.
- Regression covers column advance and target reach, separate funnels, convergence before launch, both facing directions, target-centered contact and absence of premature impact effects.
- `npm ci`, typecheck, build, all 104 sequential tests, the full Chromium UI suite and standalone recording checks pass. Re-recorded both Arena GIFs and both individual pet GIFs. Packaged and installed extension 0.19.7.

## Kyogre storm targets Groudon 0.19.6 — 2026-10-06

- Kyogre extends its cloud bank and rainfall across both pets; jagged lightning descends from directly above Groudon's articulated armor rather than striking near Kyogre. Contact adds sparks, a localized glow and recoil, synchronized with the same lightning clock.
- Shared storm rendering accepts an explicit target for Arena while the individual preview keeps its demonstration target. No new AI/host calls or timers are added.
- `npm ci`, typecheck, build, all 102 sequential tests and the complete Chromium UI suite pass. Targeted effect tests also pass after refining the continuous stepped lightning path.
- Regression verifies cloud/rain coverage of both pets, overhead bolt origin, armor endpoint and intervals without lightning. Arena captures the strike and asserts the hit reaction at its actual time.
- Re-recorded the duel, autonomous Arena and standalone Kyogre GIFs with the overhead storm. Packaged and installed extension 0.19.6; the complete UI suite and all 102 tests pass.

## Diagonal meteor rain and five water impacts 0.19.5 — 2026-10-06

- Fireballs leave the articulated mouth diagonally toward the opponent, cross above view, and descend diagonally into the target area. Trails follow both ascent and descent directions in Arena and the standalone Groudon panel.
- Five circular water emitters remain separate. Jets terminate at Groudon's armor; each impact produces water fragments, a pulsing splash and rising steam. Groudon recoils and shakes only after the jets arrive; effects stop during recovery.
- `npm ci`, typecheck, build, all 101 sequential tests and the complete Chromium UI suite pass.
- Re-recorded the standalone Groudon GIF and both Arena GIFs; final Chromium Arena checks pass after placing water contact on the armor.
- Regression coverage verifies ascent/descent direction, target landing, all five water lanes, impact timing, spray/steam and jet termination. Arena captures the actual impact and tests the recoil phase.

## Five circular Kyogre emitters 0.19.4 — 2026-10-06

- The five charging orbs retain their original circular perspective arrangement. At release the orbit stops at its existing phase; each jet originates at that exact orb position, with its own sheath, core and leading pulse. The orbs never transition into five rows.
- Updated the regression to require five distinct jets, original emitter positions on the ring, frozen release coordinates and both facing directions. The separate water/fire clash keeps its collision choreography.
- `npm ci`, typecheck, build, all 100 sequential tests and the complete Chromium UI suite pass. Production Arena frames visually confirm the circular emitter positions and five separate jets.
- Re-recorded the individual Kyogre GIF and both Arena GIFs with the corrected circular emitters.
- The Pinterest page could not be retrieved; implementation follows the user's attached image and explicit clarification that the five jets must launch from the existing circular orb positions.


## Water cannon, meteor shower and ground beam clash 0.19.3 — 2026-10-06

- Water cannon release now forms a continuous horizontal column from Kyogre's articulated mouth in Arena and the individual preview. The released stream no longer changes altitude or begins as a detached tail near the target.
- Groudon's Eruption launches eight staggered fireballs vertically from its articulated mouth. They travel above view then descend over the Kyogre area with hot cores, vertical trails and impact rings. The standalone volcanic panel uses the same meteor choreography.
- Added a fifth ground-pair turn: water and fire beams charge at both mouths, grow toward a common collision core, pulse and disperse in a shockwave. Manual ground sparring retains its independent clock alongside the aerial duel; autonomous Kyogre/Groudon rounds can also include this turn.
- Three regression tests cover horizontal release in both facing directions, mouth-origin ascent/target-area descent for all eight meteors, and beam endpoints/collision geometry. Updated controller and Chromium Arena checks exercise all five ground turns and capture the corrected effects.
- `npm ci`, typecheck, build, all 100 sequential tests and the complete Chromium UI suite pass.
- Re-recorded both production Arena GIFs (Duel and Auto) and individual Groudon/Kyogre GIFs. Final Arena Chromium checks also pass against the rebuilt runtime. No source sprites, AI calls or observer permissions were changed.

## Deoxys anatomy and ballistic aiming 0.19.2 — 2026-10-06

- Transformation now uses relaxed neutral joints, an unsquashed torso and the original source silhouette under the flash. Form changes discard the previous anatomy's joint pose. Skin weights protect the chest, normalize overlaps and taper shoulder/hip attachment; tentacle rotation is bounded to prevent mesh folding and stretching.
- A shared local ballistic shot locks actual origin and target at release. Manual Attack and autonomous Normal/Attack shots aim at Rayquaza's articulated head, rather than a fixed altitude or panel edge. Tails and overshoot follow the same two-dimensional direction, allowing subsequent dodges.
- Two regression tests cover stable transformation anatomy and target locking/overshoot/reset. `npm ci`, typecheck, build and all 97 sequential tests pass.
- The complete Chromium UI suite passes, including companion, hook/MCP, fallback/privacy and all individual legendary panels.
- Chromium source silhouette checks cover all four forms in idle, charge, release and transformation poses. Arena checks verify manual launch aim, a moving Rayquaza after launch, autonomous aiming, simultaneous ground battles, pause/rest and responsive layouts.
- Re-recorded the production duel GIF after the anatomy and aim corrections. Original source GIFs remain unchanged; no AI calls or host messages were introduced.

## Simultaneous legendary duels 0.19.1 — 2026-10-06

- Manual Duel now runs Rayquaza/Deoxys in the sky and Kyogre/Groudon below at the same time. The ground pair travels into its sea/land positions, faces its opponent and cycles four attack turns on an independent clock, including aerial meteorite interludes.
- Ground sprites and water/energy/blade/eruption effects reuse the existing production animations. Pause, Rest, Auto and responsive resize affect both pairs; no AI calls or host messages are introduced.
- `npm ci`, typecheck, build, all 95 sequential tests and the complete Chromium UI suite pass.
- Controller and Chromium Arena checks verify simultaneous non-sleeping actions, all four independent ground turns, the four aerial rounds, cancellation, pause and responsive layouts. Re-recorded the production duel GIF with all four pets fighting.

## Rayquaza vs Deoxys 0.19.0 — 2026-10-06

- Manual Duel now pairs Rayquaza with Deoxys, with smooth travel into an aerial lane. Groudon and Kyogre rest as spectators; autonomous play remains available.
- Four rounds cover Defense interception/reflection, Attack projectile and Rayquaza dodge, Speed pursuit, and opposing energy streams. Form changes still require a descending meteorite, landing, approach and physical contact before transformation.
- Added two deterministic controller tests covering all four rounds, contact-before-transformation, movement, spectators, resize and cancellation. `npm ci`, typecheck, build and all 95 tests pass sequentially.
- Targeted Chromium Arena checks pass for the four rounds, transformations, independent auto movement, pause, rest, narrow/wide resize and zero host/model messages.
- The full Chromium UI suite passes, including companion interactions, hooks/MCP subprocesses, fallback/privacy, compaction and all individual legendary panels.
- Recorded the complete 85-second production choreography in `docs/images/legendary-duel.gif`; the autonomous Arena GIF is retained separately. Reference artwork is not packaged.

## Deoxys 0.18.0 — 2026-10-06

- Preserved all four supplied source GIFs. Chromium compares all 640 atlas frames against independently decoded originals over their exact background.
- Added source-textured limb articulation, distinct Normal/Attack/Defense/Speed skills, continuous pose blending, altitude-changing flight and a meteorite that falls beside the current pet before approach/contact. Randomized variants switch only at the transformation midpoint; meteorite fades afterward.
- Autonomous cycles, form-specific skills, landing-before-contact, movement bounds after resize, rest cancellation and malformed time deltas are covered by six new tests. All 93 tests pass when run sequentially; the existing Windows nested-shell test can exceed its 10-second deadline under parallel load.
- Dedicated Deoxys Chromium checks pass: all four autonomous skills, descending meteorite, pause equality, rest, original playback, narrow/wide panels and zero host/model messages.
- Deoxys is registered in its own panel and in Legendary Arena. Production recordings: docs/images/deoxys-actions.gif, the short docs/images/deoxys-meteor.gif and the updated four-pet docs/images/legendary-arena.gif. Reference limitations and controls are documented in DEOXYS.md.
- The complete companion/legendary UI suite passes, including hook/MCP subprocesses, fallback, privacy, idle interactions and compaction. The new Arena flight lane also passes the targeted Arena checks.
- The companion compaction smoke check now waits for two stable responsive layout frames before comparing bath position. It retains the original pixel-position assertion.

## Primal Kyogre 0.17.0

- Preserved the supplied 128px GIF; generated an atlas verified against all 160 original frames in Chromium.
- Added seven source-textured articulated actions, interrupted-pose blending, water orbs/rays, wave foam, dive bubbles and storm rain/lightning. Original playback, auto, pause, hidden-time freeze and narrow/wide layouts are verified.
- Arena includes all three rigs. Kyogre stays within ocean bounds, chooses independent activities and alternates with Rayquaza as Groudon's sparring partner; rest covers all three. Long seeded simulations include ocean-bound movement across resizes and finite automatic battles.
- `npm ci`, all 87 tests, typecheck and build passed. Browser checks passed for Kyogre, arena, Groudon and Rayquaza; renderer sends no host/model requests.
- Recorded `docs/images/kyogre-actions.gif` and updated `docs/images/legendary-arena.gif` using the actual production renderers. Visual references and detailed controls are in PRIMAL-KYOGRE.md.

## Autonomous coastal arena 0.16.0

- Added independent local destinations and activity schedules, travel before battles, finite automatic sparring and return to roaming. Manual modes retain smooth action transitions; idle/sleep motion continues looping.
- Five-minute seeded simulation verifies bounded movement, activity variety, multiple automatic battles and return without input. Rest/mode switching tests verify no teleport and no movement while resting.
- All 82 tests passed. Arena Chromium checks cover independent movement, automatic battle/return, all manual attacks, pause equality, responsive layout and zero host/model messages.
- Replaced rounded tiled ground with a flat basalt shelf and angular lava cracks. Added ocean waves, reflection, shoreline foam and steam on the left.

## Volcanic arena 0.15.1

Replaced the blue backdrop and flat floor with an opaque black star field, layered basalt ridges, glowing fissures, flowing crater lava, ballistic cinders, stepped smoke and rising embers. Scenery uses integer pixel rendering and local animation time; pause freezes both pets and scenery. Chromium checked opaque black canvas corners, exact paused-frame equality, shared actions and narrow/wide layout. `npm ci`, all 80 tests, typecheck and build passed. The arena GIF is recorded from the actual bundled renderer.

Visual references: [Steam volcanic landscape](https://steamcommunity.com/sharedfiles/filedetails/?id=900902359), [Groudon lava GIF](https://media2.giphy.com/media/PxMLQ3ro9Tcmdqv0Wv/giphy.gif), [Primal encounter](https://www.tumblr.com/toasty-coconut/96592695985/encounter-with-primal-groudon-and-kyogre). Reference downloads stay in ignored dist; artwork is procedural and references are not shipped.

## Legendary Arena 0.15.0

- Typecheck, build and all 80 tests passed; VSIX packaging test includes arena runtime and GIF.
- Full Chromium UI suite passed for the arena, both individual legendary panels and the existing companion/hooks/MCP workflows.
- Final arena recording reran the UI checks after visual refinements: both source rigs, four attack turns, projectiles/shields, shared rest, pause, narrow/wide resize, no host/model messages.
- Recorded `docs/images/legendary-arena.gif` from the production renderer with deterministic local time. No AI calls.
- Linux installer work was cancelled at the user's request; no installer changes were made for this task.

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
- Bundled Codex starts its interactive interface and reaches folder trust review. The review command targets the workspace; the Chromium host harness checks the generated command. No folder/hook trust was granted by this check.

The actual VS Code extension-host UI was not automated. After reloading the window, use **Pixel Pet: Open Companion** to check it beside Codex.

## Codex 0.11.4 child lifecycle recovery and installed version — 2026-10-05

- Confirmed two lingering agents in the user's other workspace had completed child turns but no corresponding parent SubagentStop. Replaying the parent hooks and reconciling workspace/parent-scoped child logs reduced active agents from 2 to 0 without changing parent tool counts.
- Child discovery validates the first session header and explicit parent-thread metadata. Forked logs may later contain copied parent session_meta records; child identity stays anchored to the validated header. Incremental readers must finish historical replay before their state is used. Scans and cached readers are bounded; no AI calls, transcript output or extra commands are introduced.
- Observed child tool modes now animate the corresponding agent mini near the main pet. Without observed tool details, it patrols neutrally. Labels distinguish Agent from individual tool workers. Real resumed child turns restart their worker lifecycle; terminal/aborted turns clear stale active counts so the idle habitat can resume.
- The bottom of each panel displays the version from the loaded VS Code ExtensionContext manifest. Each window must reload after installing an update.
- TypeScript, all 70 tests, build and VSIX packaging passed. Chromium host smoke passed, including a lost-Stop fixture repaired from a child log, resumed idle habitat, separate child/parent tool counts, and the exact version footer. VSIX 0.11.4 installed and confirmed in the extension inventory.

## Codex 0.11.3 portal colors by work type — 2026-10-05

- Read/Edit/Run/Search/Web/Delegate portals use green/gold/blue/orange/turquoise/purple respectively. Each worker keeps its entrance hue; normal runes and beam edges use a lighter shade of that hue. Failed observations use pink-red accents and pending results gray accents without replacing the work color.
- TypeScript, all 65 tests, build, packaging and Chromium host smoke passed. Re-recorded and visually inspected the README summoning GIF; installed VSIX 0.11.3. Animations remain local and hook trust is unchanged.

## Codex 0.11.2 unified mini summoning — 2026-10-05

- Removed the Codex webview's implicit `compose` subagent trail. Actual subagent lifecycle records now enter the same stable-ID sky-portal worker renderer as tools, preserving active-agent counts and the persistent local project Mini. Subagents do not suppress unrelated fallback wrapper workers.
- Completion-only observations and tools that finish during their entrance now finish materializing before result delivery. Failed-result soot and clickable signs stay hidden during summoning; cancellation cannot reveal an unmaterialized sprite.
- All 65 tests, TypeScript, build, VSIX packaging and Chromium host smoke passed. New regression cases cover stable subagent identities, portals before the first mini pixels, already-completed tools/agents, retained result delivery, and no legacy trail. The UI harness exercises native SubagentStart/Stop through one portal worker and checks the absence of a duplicate trail.
- Installed VSIX 0.11.2 and confirmed it with the VS Code extension inventory. Hook definitions and trust were not changed. Reload Window is required to apply the renderer in the existing VS Code window.

## Codex 0.11.1 buildings temporarily disabled — 2026-10-04

- Disabled workplace rendering and restored the ordinary shared meadow layout. The dormant artwork module remains available for future redesign. Task minis, summoning, result delivery, error inspection, pet interactions and full-width/compact-HUD behavior remain active. Chromium host smoke passed, including the disabled-building assertion.
- Removed building names from visible task badges/result cards and re-recorded the README worker GIF without buildings. Dependency installation, all 63 tests, TypeScript, build and packaging passed; the meadow screenshot was visually inspected. Hook definitions and trust remain unchanged.
- The UI harness now treats the order of concurrent Read/Edit/Run calls with identical timestamps as unspecified, while still checking all three modes and their independent lifecycles.

## Codex 0.11.0 responsive workshop village — 2026-10-04

- Replaced the small nine-pixel props with cohesive pixel architecture: a terracotta library with book windows and a door, a teal maker studio with an awning and workbench, a blue terminal pavilion with screen/server details, and a domed observatory. Signs and shared trim/shadow/path colors give each place a recognizable role.
- Scene widths 240+ show four buildings; 144–239 show three; 70–143 use compact stations; below 70 use one WORK lodge with three colored bays. Separate structures have non-overlapping bounds. Resizing updates live worker destinations while retaining their IDs and birth times.
- Landscaping moves the theme's static plants into available gaps and reserves the full layout's right skyline for the sun/moon. Original rocks remain in the foreground with unchanged obstacle coordinates, preserving leap behavior. Layout caching is bounded to eight widths per scene.
- Dependency installation, TypeScript, all 63 tests, build, packaging and Chromium host smoke passed. Added regressions cover all reflow boundaries, live worker resize, non-overlapping buildings, retained trees and unchanged obstacle navigation. Existing Direct hooks/fallback, privacy, quota, task-result delivery and local-only animation checks still pass.
- Visually inspected `dist/codex-wide-panel.png`, `dist/codex-sidebar.png`, `dist/codex-compact-workplaces.png`, `dist/codex-short-panel.png` and the production-module worker GIF. Hook definitions and trust records remain unchanged.

## Codex 0.10.1 permanent work buildings — 2026-10-04

- The library, writing desk and terminal now render as fixed background landmarks even with zero active tools. Wider scenes include the observatory. Buildings are painted before the main pet, so pets remain in front; No scene hides the landmarks. Worker completion no longer removes the buildings.
- Dependency installation, TypeScript, all 60 tests, build, VSIX packaging and Chromium host smoke passed. The UI checks idle buildings with a zero active-tool count, hides them with No scene, and retains existing task/result, privacy and narrow/ultrawide layout checks.
- Re-recorded the production-module worker GIF with permanent landmarks. `dist/codex-wide-panel.png` and the GIF cover image were visually inspected. Hook definitions and trust records remain unchanged.

## Codex 0.10.0 work zones, result delivery and full-width scenes — 2026-10-04

- Dependency installation, TypeScript, all 59 tests, build, VSIX packaging and Chromium host smoke passed. Added lifecycle regressions cover work-zone positions, independent return/handoff/error/fade states, neutral interruption, cached-result clearing and successful delivery from a 2,000-pixel logical scene.
- Chromium observes three parallel tools walking to Library, Writing desk and Terminal, successful parcel delivery with the idle main pet cheering, and a failed worker's clickable sign opening a local metadata card. No animation or result-card inspection sends host/model requests; Problems remains an explicit local action. Counts continue to represent observed active tools rather than workers carrying completed results.
- Removed the 200-pixel logical width limit. Ground reaches the canvas's far edge on 1,600x300, 2,560x220 and 3,840x160 panels, as well as the existing narrow/short cases; all compact HUD readings fit without horizontal scrolling. Pixels shrink with vertical space, and long-distance workers accelerate their return.
- Updated the README's 18-second GIF from production modules with simulated events, covering sky summoning, work zones, success parcels and failed returns. Screenshots `dist/codex-parallel-workers.png`, `dist/codex-worker-delivery.png`, `dist/codex-worker-error.png` and `dist/codex-wide-panel.png` were visually inspected.
- Shared Claude modules, hook definitions and trust records were not changed. The new local VSIX requires a window reload; no additional hook review is needed for this update.

## Codex 0.9.2 short-panel HUD

- Panels up to 420 px tall use a compact HUD beside the scene. Percentages remain visible, bar widths shrink and reset details remain in native tooltips and accessible row labels. Panels at most 180 px tall omit the connection line. Taller panels restore the normal full HUD; hiding HUD returns its column to the scene. Canvas height follows its CSS height so the scene and Mini hit target stay aligned.
- Chromium checks 440x360, 320x220, 260x160 and 640x400: all three readings remain inside the viewport, the HUD does not cover the scene, no horizontal overflow occurs, hidden HUD releases its width, and growing the panel restores the full layout. Resizing sends no new host/model requests. Screenshot: `dist/codex-short-panel.png`.
- npm ci reports zero vulnerabilities; typecheck, 56 tests, build/package and the full Chromium harness pass. The 0.9.2 VSIX is installed locally. Hook definitions and runtime were not changed, so this UI update does not require another hook review.

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

## Primal Groudon 0.14.0 - 2026-10-05

- Independent Primal Groudon view and command added without changing Mega Rayquaza or the regular pet engine. Uses the supplied native 128px sprite with head/jaw, opposing arms/legs and tail articulation, six motions and 1.1-second interrupted transitions.
- Precipice Blades uses windup/slam, sequential faceted molten rock emergence and debris. Energy Burst follows the purple mouth-charge reference, with a dense luminous orb, mouth-bound release and recoil. Eruption uses staggered molten projectiles along arcs. All animation is local, with no host/model requests.
- npm ci, typecheck, all 80 tests, build and packaging passed. Full companion/Mega Rayquaza/Groudon Chromium regression passed; final Groudon rendering was checked again after visual refinements. Atlas fidelity matches all 160 original GIF frames; browser checks cover six actions, attack states, original playback, pause, transition freeze and responsive layout.
- Recorded docs/images/groudon-actions.gif with the production renderer, updated README/design guide, packaged assets and installed local extension 0.14.0. The source GIF remains untouched. External reference downloads are ignored and are not packaged.

## Pixel Familiars independent repository - 2026-10-05

- Created an independent working directory and Git database from the complete contribution-branch history, including the current 0.13.1 sleep correction. The sibling pixel-pet working files, branch and remotes were left unchanged.
- Main development targets PhucUSk20/pixel-familiars through origin; Namenomeaning/pixel-pet remains upstream for optional synchronization. README, extension display metadata, attribution and development instructions now describe Pixel Familiars and its maintainer. Existing extension identifiers remain compatible.
- npm ci, typecheck, all 77 tests, build and VSIX packaging passed in this directory. The full Chromium suite passed. The UI test now generates its ignored upstream preview automatically, removing reliance on artifacts from an older working directory.

## Mega Rayquaza 0.13.1 sleep correction - 2026-10-05

- Sleeping head/jaw are drawn in front of the coil, with the muzzle resting beside it. The upper curved tendril uses a continuous head-attached deformation through sleep transitions and breathing. Flight, roar, Pulse and dash poses remain unchanged.
- Added a regression fixture where head/jaw and body overlap; it confirms the head remains visible instead of being overwritten by later body triangles. npm ci, typecheck and all 77 tests passed. Full Chromium Legendary and companion checks passed.
- Re-recorded the five-action README GIF and an isolated preview at docs/images/legendary-sleep.gif with the production renderer. Source artwork is unchanged.

## Mega Rayquaza 0.13.0 source-textured actions - 2026-10-05

- Uses the supplied 128px artwork as a nearest-neighbor textured mesh; the rejected generic redraw is not imported by the runtime. Original mode still plays the unchanged 160 source frames. Source files remain unchanged.
- Measured bindings articulate head/jaw, fins/arm, eleven body/tail controls and spatially masked tendrils. Five poses cover flight follow-through, tighter sleeping coil, raised-head/open-jaw roar, charge/recoil and streamline/braking. Effects attach to the articulated mouth. The user's linked 20-frame, 2.6-second GIF was inspected as a motion reference; it is not packaged.
- Default Auto cycles all five actions. Manual selection blends for 1.2 seconds from the current pose, including rapid interrupted selections. Original comparison and Pause remain available. Mesh painting runs at 20fps and stops while hidden/paused, with no host/model requests.
- npm ci, typecheck and all 76 tests passed. New tests verify source-palette fidelity, body deformation rather than translation, independent anatomy, face-bound effect origins, recoil/braking and continuous transitions. Chromium checks original-frame fidelity, distinct action frames, paused transitions and responsive layout; full companion regression also runs.
- Recorded all five actions and transitions in docs/images/legendary-source-actions.gif using the production renderer with a deterministic local clock; README updated.

## Legendary Pet 0.12.2 restore original appearance - 2026-10-05

- Rejected the previous redraw after comparing the supplied 128px GIF with official Pokémon Mega Rayquaza artwork. The independent panel now plays the actual original 160 frames, with no anatomical redraw or mesh deformation. The incorrect five-action controls are removed; new faithful poses remain unfinished.
- Reconstructed a native 128px atlas using nearest-neighbor sampling of the 384px display GIF and transparency only for its exact background color. Pixel comparison of every frame composited over the original background matches the source exactly.
- Chromium verifies frame-for-frame rendering against the atlas, advancement, pause and narrow/wide layout. The complete companion UI suite passed. Typecheck, all 73 tests, build and packaging passed; three rig tests only concern the inactive experiment.
- New README demo: docs/images/legendary-original.gif. Official appearance references and anatomy requirements are recorded in docs/MEGA-RAYQUAZA-DESIGN.md. External artwork is not packaged.

## Legendary Pet 0.12.1 articulated motion - 2026-10-05

- Replaced the flattened GIF runtime with a hand-authored 64px articulated green/gold dragon inspired by the source. Original GIF, manifest, atlas and reduction script remain unchanged; the new silhouette differs.
- Spine travelling waves, banking return turns, delayed tail/ribbon movement, independently folding arms/fins, closed-eye coiled sleep, raised-head hinged-jaw roar, mouth-attached charge/recoil and streamlined dash/braking are drawn in native pixels.
- A 1.1-second smooth pose blend begins from the current displayed pose, including rapid repeated selections. Head rotation uses the shortest angular path. Manual repeats and the automatic cycle transition instead of snapping.
- npm ci, typecheck and 73 tests passed; targeted rig tests also passed after final pose refinements. Tests verify local body deformation rather than translation, coiling/streamlining, jaw opening/closing, braking, continuous interrupted transitions and bounded visible native sprites.
- Recorded 445 frames at 10fps from the production renderer, covering all five actions and transitions: docs/images/legendary-actions.gif. Recorder uses only a deterministic local animation clock. README links the new demo.
- Chromium Legendary checks passed: five action renderings, paused transitions, responsive layout and retained drawing after paused resize. The first full companion run encountered the existing compaction-position assertion; the full suite passed on rerun, including compaction, hooks/MCP, fallback and idle interactions.

## Legendary Pet 0.12.0 - 2026-10-05

- Added a separate Legendary Pet panel and command; no session, bridge or model requests in its renderer. Original companion and upstream art are untouched.
- Recovered 160 transparent 64px atlas frames from the provided 384px display GIF, using nearest-neighbor downsampling and the exact background color. Original source files remain unchanged.
- Five procedural choreographies over the original loop: flight, curled sleep, opening-jaw roar, Dragon Pulse and dash. These are not separately authored anatomical sprite sets. Auto, manual selection, pause and visibility suspension are local.
- npm ci, typecheck, all 70 tests, build and VSIX package passed. Chromium verifies all five distinct rendered sequences, pause, narrow/wide layout and retained drawing after resizing while paused; the existing companion smoke suite also passes. Preview: dist/legendary-preview.png.
- Native VS Code window must reload to load the new panel registration.
