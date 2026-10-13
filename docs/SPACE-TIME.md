# Palkia and Dialga

Current positions use the [three-tier group layout introduced in 0.30.0](ARENA-LAYOUT.md). Earlier Demo GIFs below illustrate the skill choreography.

Open **Pixel Familiars: Open Legendary Arena** after installing extension 0.22.0 and reloading VS Code. Click **Space / Time** to summon the rival visitors. Auto can also summon them after roughly 180–270 seconds of activity. They are temporary visitors, while Rayquaza, Groudon, Kyogre and Deoxys remain the four residents.

![Palkia and Dialga rival encounter](images/creation-rivals.gif)

Both supplied 128×128 source sprites use native 1:1 scene scale. Their head, jaw, arm, legs and tail articulate continuously without replacing their source colors or silhouettes. The camera opens an extra 144 pixels of starry sky for the pair, using the same panel scale for all pets, and eases back afterwards. The camera preserves each resident?s horizontal screen centre during opening and closing instead of clamping it into resized terrain bounds.

The encounter follows this sequence:

1. **Arrival:** Palkia emerges through a glowing violet oval with a white-pink rim, rotating fragments and branching spatial cracks. Dialga appears in a fractured gray time field with reverse-moving fragments and clock marks.
2. **Ordinary clash:** Palkia makes one 50/50 choice per encounter: a violet-white mouth pulse, or a pink spinning energy sphere gathered in its hands and released toward Dialga. Dialga opens its jaw and breathes an orange-gold flame stream. Both streams meet between their actual mouths and explode.
3. **Signature charge:** Palkia's pink shoulder pearl glows, energy feeds into its cocked arm, and it swings the arm to cast **Spacial Rend**, a tapered, luminous crescent of purple plasma with a shredded curved wake and no circular trail. Dialga raises its head, illuminates its blue head point and charges its mouth before emitting **Roar of Time**, a broad blue-white plasma beam. Inward spiraling white-blue filaments feed its charge; white shock rings grow as they travel away from its mouth.
4. **Signature collision:** the crescent and beam meet and burst into rings, shards and sparks. Branching space cracks remain at that fixed collision point, independent of later recoil or hand movement.
5. **Departure or intervention:** the pair normally reopens its portals and leaves. A single **35%** roll after the signature explosion can instead bring Arceus down. Both rivals stay for the six-pet combined assault against Arceus' invulnerable shield and its Judgment counter. Both visitors always raise spherical violet/blue barriers for Judgment. Shots stop at its upper surface and flare across the shield. Unshielded pets move up to 24 scene pixels per volley; shielded visitors move up to 8, within visible bounds. The visitors depart after Judgment finishes; Arceus departs at the same time, without follow-up skills.

Arceus?s standalone automatic interval is randomized over 150?300 seconds, so the rivals visit more frequently. Arceus also has a 40% chance to call the rivals in 0.9?2.1 seconds after its arrival; they join its six-pet assault without first dueling or creating a false collision rift.

A normal encounter lasts about 24 seconds. Arceus intervention extends the scene to roughly 44 seconds. **Rest** cancels both visitors and Arceus, and mode changes clear unfinished effects. **Summon Arceus** can also interrupt an active rival encounter. All animation runs locally, without model requests or extra AI tokens; real quota readings remain unchanged.

The recording is labeled **Demo** and forces the hand-orb and intervention branches for visibility. Production uses the single 35% roll; it has no hidden preview controls.

## Giratina scenario

The first encounter, and encounters following a Giratina visit, choose once: 55% Palkia versus Dialga, or 45% both allied against Giratina. If the previous Space/Time appearance omitted Giratina, the next appearance guarantees it. This history survives Rest and cancellation during the current Arena session and applies to manual summons, Auto visits and arrivals after Arceus. Giratina rises from a dark ground rupture, returns shadow lashes and fires two violet orbs at the rivals. The four residents continue their own aerial and ground battles during either encounter. Arceus pauses these battles; all present pets fire together at its shield, with two white shock rings per plasma stream. All temporary visitors depart after Judgment. [Giratina GIF and details](GIRATINA.md).

## References

- [Palkia's Spacial Rend animation](https://pokemondb.net/pokebase/9663/what-is-a-good-moveset-for-palkia)
- [Palkia mouth pulse](https://tenor.com/view/palkia-pokemon-pokemon-palkia-god-warp-gif-14087346899225075660)
- [Palkia versus Dialga](https://gifdb.com/gif/legendary-pokemon-palkia-vs-dialga-o3l07cb83x6vrtap.html)
- [Dialga charge reference](https://www.smogon.com/forums/threads/blue-squad-mark-iii-dialga-kyogre-done-the-japanese-way.3568626/)

- [Palkia luminous arrival](https://makeagif.com/gif/pokemon-amv-arceus-vs-palkia-vs-dialga-vs-giratina-17srQ8)
- [Palkia hand-charged sphere](https://64.media.tumblr.com/1056cc78322b16aa47ff89772a8451d1/tumblr_mlw0moqBLP1s5h198o1_r1_500.gif)
- [Dialga spiraling charge and white rings](https://www.pinterest.com/pin/3af7f486b0157d0eb970cfe78ae3ca512566df27_hqgif-500257--522136150566506827/)

Reference GIFs are used for visual comparison only; the runtime atlases come from the supplied local sprites.
