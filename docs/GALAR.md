# Galar Heroes

Current positions use the [three-tier group layout introduced in 0.30.0](ARENA-LAYOUT.md). Earlier Demo GIFs below illustrate the skill choreography.

**Galar Heroes** summons Crowned Sword Zacian and Crowned Shield Zamazenta against Eternatus. Auto also schedules occasional visits. Rest cancels the encounter and returns the Arena to rest.

The 46-second cinematic has two phases:

1. Eternatus emerges through crimson energy, charges a narrow pink blast and then Dynamax Cannon. Zamazenta shields the pair while Zacian prepares its sword counter.
2. Eternatus transforms into Eternamax within a red-violet spiral. It unleashes scattered storm beams, faces the first Behemoth Blade/Behemoth Bash rush, then charges a stronger dual Eternabeam. The heroes withstand it, recharge and strike from separate angles: Zacian extends a cyan-white blade, Zamazenta envelops its shield in red-gold energy. Eternamax dissolves into pink fragments; the two heroes depart.

The supplied four 128px sprites retain their original colors and use the Arena's established native scale. Attached articulation moves head, legs, armor and tail. Effect origins track the actual animated sword, shield front and Eternatus core. The scene is a local cinematic adaptation inspired by the references; Eternamax is the form name used in the reference episode.

Resident duels continue in the background. Galar can coexist with the existing visitors within their shared 280px extra-sky cap. Arceus/Ultra interruption cancels the lunges, holds the current Eternatus form and recruits all three actors. The maximum combined encounter now has eighteen Ultra opponents or nineteen Arceus attackers. These animations are labeled Demo and do not represent measured activity.

![Demo: crowned heroes defeat Eternamax](images/galar-heroes.gif)

References: [chronological Journeys episode 45 GIF set](https://www.tumblr.com/pokemoninaction/635461467021393920/pokemon-journeys-ep-45-this-gifset-doesnt), [Behemoth Blade](https://tenor.com/view/zacian-gif-19228328), [Behemoth Bash](https://tenor.com/view/zama-gif-19228347), [Dynamax Cannon](https://pokemoninaction.tumblr.com/post/635323951820718080/eternatus-used-dynamax-cannon-pokemon-journeys), [ordinary energy blast](https://makeagif.com/gif/eternatus-escapes-lab-vDw6Ed).

Run `node tools/codex/record-arena.mjs --galar --check --check-only` for browser checks and `node tools/codex/record-arena.mjs --galar` to record the preview.
