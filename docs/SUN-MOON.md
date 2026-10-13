# Lunala and Solgaleo

Current positions use the [three-tier group layout introduced in 0.30.0](ARENA-LAYOUT.md). Earlier Demo GIFs below illustrate the skill choreography.

Version 0.26.1 updates two temporary visitors to Legendary Arena. Use **Sun / Moon** to summon them together, or wait for an Auto visit. They demonstrate two friendly rounds, then leave after 20.7 seconds. All motion runs locally; no model requests or tokens are used.

![Lunala and Solgaleo friendly encounter](images/sun-moon-encounter.gif)

| Pet | Appearance | Ordinary skill | Signature skill |
| --- | --- | --- | --- |
| Lunala | Violet diagonal spatial cut opens, reveals the pet and closes | Wings fold inward around a pink-violet charge, then open to fire plasma | Moongeist Beam: cratered full moon near the top-right sky corner, luminous wing nodes and layered violet/turquoise beam |
| Solgaleo | Golden diagonal spatial cut opens, reveals the pet and closes | Mouth-origin white/gold plasma orb | Stationary solar beam: blazing sun near the top-left sky corner, curling flame tongues, a raised head with blue forehead charge, a fully spread star-shaped native mane and mouth-origin gold/white energy |

Solgaleo stands on the left, facing right; Lunala stands on the right, facing left. The sun stays near the top-left sky corner and the moon near the top-right corner, behind the sprites. Space/Time and Sun/Moon share a maximum of 280 extra sky pixels rather than adding a larger expansion; the celestial pair uses a compact upper lane when both groups are present.

The ordinary orbs meet and burst at one shared midpoint. The two signature beams meet at a fixed front with a bright contact core and shock rings; Solgaleo stays in position. Both pets recover and depart through their colored spatial cuts. Connected head/wing/leg/tail joints retain the supplied 128px sprite colors and anatomy. The starry sky opens while existing resident screen X positions stay stable. Rayquaza/Deoxys and Kyogre/Groudon continue independently below.

Auto intervals are 90-180 seconds, deferred while Arceus or a full automatic aerial duel is active. Space/Time/Giratina and Sun/Moon can appear in either order and run their battles concurrently on separate sky layers. Finishing either encounter leaves the other running. Rest and mode changes cancel both; repeated clicks cannot restart a visit.

When Arceus appears, Lunala and Solgaleo remain, pause their friendly battle and join the shared assault. Their violet and gold plasma streams launch with all other pets, hit Arceus's barrier and fail. Judgment targets all present pets (up to nine), with visible flashes and knockback for Lunala and Solgaleo. Both visitor groups leave immediately after the counterattack.

![Lunala](images/lunala-128px.gif) ![Solgaleo](images/solgaleo-128px.gif)

References: [Lunala Moongeist Beam](https://64.media.tumblr.com/9df0fbe642fd3bea410dc62e590ed53b/tumblr_o85mdrp3OG1rpn9eno2_400.gif), [Lunala ordinary attack](https://smilingperformer.tumblr.com/post/177310328609), [Solgaleo solar charge](https://i.makeagif.com/media/3-27-2021/S4IqtG.gif), [Sunsteel Strike](https://media.giphy.com/media/l0K4cxxZHcJmztAvC/giphy.gif), [Solgaleo plasma](https://i.makeagif.com/media/12-31-2018/JFHhf_.gif). Reference assets remain in ignored dist files and are not packaged. The encounter recording is labeled Demo; production retains random scheduling.
