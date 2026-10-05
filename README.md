<p align="center">
  <img src="docs/images/slime.gif" width="160" alt="The slime breathes, blinks, jumps, and cheers">
</p>

<h1 align="center">pixel-pet</h1>

> **Codex VS Code fork:** this working copy adds **Pixel Pet for Codex**, a companion panel using the original pixel engine. See [docs/CODEX.md](docs/CODEX.md) for installation, settings, privacy and limitations. The Claude instructions below describe the preserved upstream plugin.

## Codex VS Code — this fork

Observed tools summon worker minis beside the AI pet through animated magic circles. Parallel background processes keep separate workers until their recorded exits; pet observation and animations run locally without added AI calls or tokens.

<p align="center">
  <img src="docs/images/codex-pet-summoning.gif" width="816" alt="Demo: sky portals summon task workers; they return with parcels on success or error signs on failure">
</p>

The demo shows sky summoning and parallel Read, Edit and Run workers. Workplace buildings are temporarily disabled. Successful workers bring parcels back and celebrate with the AI pet; a failed worker returns with soot and a clickable error sign. Three workers start at different times and finish independently. It is recorded from the production renderer with simulated task events. Recreate this GIF with `npm.cmd run record:codex-pets -- --only summon`.

For the most complete activity tracking, install from this cloned repo (Node 22.18+, VS Code `code` command and the Codex extension required):

```powershell
npm.cmd run install:codex
```

Version **0.11.3** installs dependencies, builds/packages the companion, installs the VS Code extension, and configures hooks and MCP theme tools, including the corrected Windows hook launcher. Run the command inside the cloned `pixel-pet` folder. It then opens the bundled Codex CLI for hook review:

1. If Codex asks for folder trust, approve this cloned repo. Then enter `/hooks`, review and trust all 12 **Pixel Pet observer** entries.
2. Exit the review CLI. In VS Code, press **Ctrl+Shift+P**, run **Developer: Reload Window**, then **Pixel Pet: Open Companion**, and start a new Codex conversation.
3. Ask Codex to perform a task that uses a tool, such as listing project files, and check that the companion shows **Direct hooks**. The label changes after a real event arrives for the selected conversation; it can still show **Log fallback** immediately after installation or reload. This enables more detailed tool/subagent events and compaction animations; the review CLI does not need to stay open.

The default Codex slime has a meadow with grass, a round shaded sun with rays, rocks, flowers, trees and drifting clouds. **Pet** selects Slime, Duck or Alien; **Scene** changes the background while keeping the pet; **Reset** restores the default. Existing custom themes keep their own scene (or no scene). Reading, searching, web, editing and terminal props use the same pixel engine as Claude. Short tool actions remain visible briefly even when the active-tool counter has already returned to zero.

The main pet represents the AI session. Each observed tool call gets a worker mini in the same scene: reading with a book, editing with a pencil, running a command with a terminal, and searching/browsing with the matching prop. Concurrent calls get separate workers; completion, failure or interruption ends each one independently. Workers leave after a brief result animation. Up to six fit on screen, with an overflow count and text badges for the rest; narrow panels show fewer. Worker minis, actual subagents, and the persistent project Mini are separate. All their rendering is local and adds no AI calls or tokens. Trusted hooks supply the fullest timing; when fallback only records a completed child item, its worker is labeled finished, never running.

The scene fills the available panel width without a fixed horizontal limit. Short panels keep the compact HUD in its own corner. Workplace buildings are temporarily disabled: the ordinary meadow stays visible, while task minis, summoning, result delivery and pet interactions continue.

Tool workers and subagent minis now share the sky-portal entrance. The main pet no longer draws a second, unsummoned subagent trail. A short task first observed after completion also materializes through its portal before carrying the already-recorded result back; its badge stays finished throughout the animation.

Portal colors identify the work: Read green, Edit gold, Run blue, Search orange, Web turquoise and Delegate/subagent purple. The main hue stays fixed throughout the entrance; failures use pink-red runes and pending results use gray runes.

Mini automatically watches project results beside the AI pet. It picks up supported build/test/check commands reported by Codex and build/test task results from VS Code, plus editor errors. While a recorded check runs it shows a small busy effect; success makes it celebrate and show a green check, and errors or failed checks produce a red flag. Without evidence it stays neutral. Click to inspect the recorded result; no separate job or Check action is needed. Relevant file edits invalidate old results, and results reset on reload. By default only observed checks enter the checklist; pixelPet.projectChecks can additionally require specific VS Code task names. All observation and animation run locally without model calls, extra commands or tokens. Feed/Play/Rest remain optional local interactions.
When the AI is idle, the pets explore independently instead of sticking together. Each chooses its own walk, pause, flower, butterfly, pebble hop or stretch. Occasionally they walk over to meet, play a scene together, then head off in different directions. The shuffled playlist now has **20 scenes**, including a paper-plane ride, fishing for a boot, a magic portal, a block tower, a pillow fight, a leaf boat and a photo booth. Each has its own movement and pixel props. Feed invites Mini for a picnic; Play starts catch. Real work, approval, compaction and running project checks interrupt idle behavior; **Rest** pauses it and **Wake** resumes it. Everything is local animation, with no model calls or extra AI tokens.

<p align="center">
  <img src="docs/images/codex-pet-life.gif" width="592" alt="Demo: the two Codex pets explore independently, walk over to meet, play, then separate">
</p>

<p align="center">
  <img src="docs/images/codex-pet-actions.gif" width="816" alt="Demo gallery of all 20 distinct Codex pet interactions">
</p>

These GIFs are recorded directly from the companion's habitat and pixel modules, using simulated local animation rather than a live AI session. Recreate them with `npm.cmd run record:codex-pets` (Chrome/Edge and ffmpeg required). See [the interaction guide](docs/CODEX.md#idle-interactions) for all 20 scenes.

Already installed? For updates, rerun `npm.cmd run install:codex` to install the latest code and hook definitions, then follow the same review/reload steps. Windows installations from 0.9.0 or earlier need this reinstall to repair the old hook launcher; reload alone is insufficient. If the current version is already installed, **Pixel Pet: Review Codex Hooks** opens the review interface directly. Changed definitions must be reviewed again. The installer does not grant hook trust automatically. `npm.cmd run install:codex -- --no-review` remains an alternative for installing without interactive review, with less complete **Log fallback** tracking until hooks are trusted.

Pixel Pet is a separate VS Code view. You can move it into the same sidebar area as Codex, but it cannot currently be embedded inside Codex's conversation or prompt using a documented integration API. See [panel placement and limitations](docs/CODEX.md#panel-placement).

Ask Codex to customize the pet through `get_theme`, `get_theme_format`, `preview_theme`, and `set_theme`. The **Preview** button opens the generated page. For installation/build commands and remaining differences, read [the Codex guide](docs/CODEX.md).

## Original Claude Code plugin

<p align="center">
  A pixel pet for the Claude Code terminal. It acts out what Claude is doing,<br>
  and a game-style HUD below the prompt keeps your context and rate limits in view.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-5aa9ff"></a>
  <img alt="Claude Code 2.1.287 or later" src="https://img.shields.io/badge/Claude_Code-2.1.287+-ffe25a">
</p>

<p align="center">
  <img src="docs/images/demo.gif" width="806" alt="A session in the terminal: the slime reads, searches, sends out a mini for a subagent, fetches a page, edits, fails a test and fixes it, and cheers when the turn ends">
</p>

## Install

You need Claude Code v2.1.287 or later (`claude --version`).

```bash
claude plugin marketplace add Namenomeaning/pixel-pet
claude plugin install pixel-pet@pixel-pet
```

Start a new session, or run `/reload-plugins` in an open one. The slime appears above the prompt.

To uninstall, run `claude plugin uninstall pixel-pet@pixel-pet`.

## What the pet does

| When | The pet |
| --- | --- |
| Claude is idle | Breathes, blinks, and looks around. Falls asleep after the **Sleep after** time, a minute by default. |
| A turn starts | Jumps |
| A tool call ends | Runs back and forth for 4 seconds |
| Claude thinks longer | Looks around, with `?` and dots |
| `Read` | Reads a book: `reading app.ts` |
| `Grep`, `Glob` | Sweeps a magnifier: `hunting for "useState"` |
| `Edit`, `MultiEdit`, `Write`, `NotebookEdit`, `TodoWrite` | Writes with a pen: `editing app.ts` |
| `Bash`, and any tool not listed | Types in a small terminal: `$ npm test` |
| `WebFetch`, `WebSearch` | Spins a globe: `fetching docs.anthropic.com` |
| A subagent starts | Smiles. A mini joins the trail behind the pet and stays until that subagent finishes. It leaves with a sparkle, or grey if the subagent failed. |
| A tool call fails | `x x` eyes and a sweat drop |
| A turn ends | Cheers |

## The HUD

A pixel window below the prompt holds up to three bars:

- **♥ HP** is the context window left. It turns yellow at 50 % or less, red at 25 % or less, and shows `/compact` under 10 %.
- **✦ MP** is the 5-hour rate limit left, with the time to its reset, such as `reset in 4h26m`.
- **◆ ST** is the 7-day rate limit left, with the time to its reset, such as `reset in 3d4h`.

MP and ST turn red under 15 %. Each shows on Pro and Max plans once a response has reported its limit.

While the pet idles or thinks, its face follows the HUD: it sweats at 50 % HP or less, gets `x x` eyes at 25 % HP or less, and looks tired under 20 % MP or ST.

## Make it yours

<p align="center">
  <img src="docs/images/pets.gif" width="440" alt="The default slime beside a rubber duck made with the pixel-pet skill">
</p>

Ask Claude in any session, or run `/pixel-pet:pixel-pet`. You can change:

- **the pet**: "set up my pet as a rubber duck", "make the slime purple";
- **its props and effects**: "a UFO tablet when it reads", "a radar dish for web searches", "no question mark when it thinks";
- **its minis**: "a tiny saucer for each subagent";
- **the text**: "alien status lines", "make the bash line red";
- **the HUD**: "a green frame", "rename HP to FUEL", "hide ST";
- **the scene**: "a moon surface with rocks to jump over", "grass and flowers behind the pet";
- **the settings** below, such as speed and sleep.

Claude opens a preview in your browser first: every motion, face, status line, and HUD look, and the pet running through its scene, on a dark or a light background. Say what to change, and Claude redraws it. When you approve, the change shows above the prompt at once and stays for later sessions. To undo, ask for the slime back.

All of it lives in one theme, a JSON file documented in [`FORMAT.md`](plugins/pixel-pet/skills/pixel-pet/FORMAT.md). [`alien.json`](plugins/pixel-pet/assets/alien.json) uses every field. To share a theme, ask Claude to save it as a file. To use someone else's, ask Claude to load their file.

## Settings

In a session, run `/plugin configure pixel-pet@pixel-pet`.

| Setting | Default | What it does |
| --- | --- | --- |
| Speed | `normal` | How quickly the pet runs and animates: `slow`, `normal`, or `fast`. |
| Sleep after (seconds) | `60` | Idle time before the pet falls asleep. `0` keeps it awake. |
| HUD | on | The HP, MP, and ST bars below the prompt. |
| Status line | on | The text beside the pet. |
| Name files and commands | on | The status line names the file, pattern, command, host, or search query a tool works on. Turn it off to share your screen. |
| Subagent minis | on | A mini behind the pet for each running subagent. |

From a shell, pipe the values as JSON, then restart Claude Code:

```bash
echo '{"speed": "fast", "sleepAfter": "300"}' | claude plugin configure pixel-pet@pixel-pet --values-stdin
```

`claude plugin configure pixel-pet@pixel-pet` with no input lists the settings and which you have set. The install's "6 userConfig options not yet set" needs nothing from you: each setting has a default.

## Update

```bash
claude plugin marketplace update pixel-pet
claude plugin update pixel-pet@pixel-pet
```

Then start a new session. Your pet and your settings carry over. A setting the new version doesn't know takes its default, and a pet drawn for an older version still draws.

## Where it shows

The pet draws with colored text cells, so it works in any terminal with 24-bit color, without kitty graphics. The Desktop app's Code tab shows it as SVG. The VS Code chat panel, `claude -p`, and cloud sessions don't show it. The HUD shows only in the terminal.

## Privacy and security

A mod runs inside Claude Code with your permissions. pixel-pet:

- reads only its own theme files, polls session usage and the list of subagents, and draws;
- registers three tools for changing the theme: `get_theme` returns the theme on screen, `preview_theme` writes a preview page to the path Claude gives it, and `set_theme` changes the theme and keeps it in the mod's own store;
- makes no network requests, starts no processes, and reads no environment variables.

Its `tool.call` hook sees each tool's input and keeps only a short target for the status line. The status line shows the first line of a `Bash` command, cut to 24 characters; the **Name files and commands** setting turns that off.

To check this yourself, clone the repo and run `claude plugin validate plugins/pixel-pet`. Its `calls:` line lists everything the mod asks Claude Code to do.

To report a vulnerability, open a [private security advisory](https://github.com/Namenomeaning/pixel-pet/security/advisories/new).

## Develop

```text
.claude-plugin/marketplace.json   the repo is a marketplace with one plugin
plugins/pixel-pet/                the plugin: a Claude Code mod
  .claude-plugin/plugin.json      the plugin's name, version, and settings
  hooks/hooks.json                points Claude Code at register.tsx
  hooks/register.tsx              wires Claude Code's events to the modules below, and serves the tools
  hooks/anim.ts                   decides what the pet does on each tick, and when it leaps an obstacle
  hooks/pixels.ts                 draws a frame: body, eyes, props, effects, and minis
  hooks/theme.ts                  reads a theme and makes its pet's frames for every motion
  hooks/scene.ts                  lays out a theme's scene and draws the band with it
  hooks/preview.ts                writes the preview: every motion, face, scene, and frame of a pet
  hooks/status.ts                 the status line beside the pet
  hooks/hud.ts                    the HP, MP, and ST bars in their window
  hooks/minis.ts                  tracks a mini per subagent
  hooks/settings.ts               reads the settings
  hooks/*.test.ts                 the tests, one file per module
  types/index.d.ts                the mod's state, as Claude Code keeps it
  tsconfig.json                   type-checks the mod
  assets/slime.json               the default pet
  assets/duck.json                an example pet that faces to one side
  assets/alien.json               an example pet that uses every field
  skills/pixel-pet/               the skill that draws a pet with you, and the pet format
tools/preview/build.mjs           writes the preview of a theme file
tools/demo/record.mjs             records docs/images/demo.gif
docs/images/                      the images in this README
```

Load your working copy for one session with `claude --plugin-dir ./plugins/pixel-pet`. Saving a file reloads the mod. Before you open a pull request, run:

```bash
claude plugin validate . --strict
claude plugin validate plugins/pixel-pet --strict
claude plugin test plugins/pixel-pet
```

`plugins/pixel-pet/tsconfig.json` extends `plugins/pixel-pet/.claude-plugin/types/tsconfig.json`, which Claude Code writes the first time it loads the mod. After one `--plugin-dir` session, `tsc -p plugins/pixel-pet` type-checks the mod. The tests don't need it.

To see every motion, face, status line, HUD look, and frame of a pet, run `node tools/preview/build.mjs [theme file]` (Node 22.18 or later) and open `tools/preview/preview.html`. It writes the same preview `preview_theme` does, for the slime when you give no file, and prints the pet's resting frame and notes on anything it repaired.

To record `docs/images/demo.gif` again after a change to the band or the HUD, run `node tools/demo/record.mjs` (Node 22.18 or later). It plays a scripted session through the mod's modules and needs Google Chrome (or its path in `CHROME`) and `ffmpeg`.

Installed copies update only when `version` in `plugins/pixel-pet/.claude-plugin/plugin.json` changes, so bump it in every release. Contributor rules are in [`CLAUDE.md`](CLAUDE.md).

## License

[MIT](LICENSE)

## Author

Made by **halluqinate**. Say hi on [X](https://x.com/QuillPhan), [Instagram](https://www.instagram.com/hallu.qinate/), [TikTok](https://www.tiktok.com/@halluqinate), or [LinkedIn](https://www.linkedin.com/in/phan-vu-anh-quang-3b57b1177/).
