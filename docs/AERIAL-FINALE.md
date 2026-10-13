# Rayquaza and Deoxys aerial finale

Version 0.23.1 refines the five aerial rounds in Legendary Arena. Use **Duel**, or wait for an Auto aerial encounter. Rayquaza breathes fire against Defense Forme, exchanges energy orbs with Attack Forme, pursues Speed Forme through a slash frenzy, then trades beams with Normal Forme before the finale. Kyogre and Groudon continue their ground battle independently.

![Rayquaza and Deoxys finale](images/aerial-finale.gif)

Rayquaza uses **1.1x** body scale and Deoxys **0.9x** in Arena. Scaling is centered on the existing sprite center and also applies to attack anchors. Their original source sprites and individual panels keep native scale. Rayquaza's starting attack lane is horizontally offset ahead of Kyogre instead of directly above its head.

1. **Speed and tentacle frenzy:** Speed Forme swings its connected arms rapidly, emits layered violet slash arcs and sends repeated crescent strikes toward Rayquaza. The slashes follow Deoxys while it darts through the existing third-round pursuit; Rayquaza flashes on contact. There is no separate Attack frenzy round. Form changes still require touching a meteorite. In Arena the rock stops at chest height; contact and transformation take 1.9 seconds without a trip down to the ground.
2. **Ultimate charge:** Mega Rayquaza rises and illuminates its source-textured body in gold, drawing turquoise flight streams around itself. Normal Deoxys gathers a red-purple orb with a dark center, rotating plasma bands and sparks.
3. **Clash and breakthrough:** Rayquaza launches Dragon Ascent while the orb flies toward the meeting point. The orb shatters into a white-hot impact core, pink shards and expanding gold/cyan shock rings; Rayquaza continues forward.
4. **Meteor shield:** As soon as the ultimate orb launches, Deoxys surrounds itself with hovering, irregular meteorites and a cyan psychic shield; protection is already visible while the orb and Rayquaza approach their clash. Rayquaza presses into the barrier, then breaks the shield and scatters the rocks.
5. **Defeat and return:** Deoxys dissolves, remains absent briefly, then a falling crystalline meteor with nested red/purple triangular rims and a white star core enters its area. The meteor bursts on contact with the ground; Deoxys materializes and rises back into the aerial lane. The loop resumes. Rest, mode changes and Arceus interruption clear the cinematic and restore visibility.

The finale lasts 23 seconds; the preceding Speed frenzy runs inside the existing 6.5-second pursuit. This is local animation with no model calls or extra tokens. The GIF forces these rounds for a short **Demo** preview; production enters them through the full choreography.

Visual references: [Mega Rayquaza attack](https://gifdb.com/gif/mega-rayquaza-space-f6jhkx0r01bx8xbq.html), [Deoxys frenzy](https://tenor.com/view/deoxys-pokemon-deoxys-gif-26250051), [ultimate clash](https://gifdb.com/gif/intense-battle-of-rayquaza-and-deoxys-y4j5hjht0cqkofvz.html), [meteor shield](https://tenor.com/view/pokemon-destiny-deoxys-pokemon-movie-rekkuuza-vs-deokishisu-fighting-fight-gif-27382546). Reference GIFs are not packaged.

Additional references: [triangular rebirth core](https://derivative.ca/sites/default/files/styles/project_teaser/public/field/body-images/SmartSelect_20200427-183529_Instagram.gif), [Rayquaza fire attack](https://www.reddit.com/r/pokemon/comments/9eyzl9/he_was_always_a_good_match_for_rayquaza/).
