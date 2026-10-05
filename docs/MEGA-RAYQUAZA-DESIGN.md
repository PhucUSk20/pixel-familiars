# Mega Rayquaza appearance reference

Reference reviewed 2026-10-05: [official Pokémon illustration](https://www.pokemon.co.jp/ex/usum/common/images/legacy/171102_03/poke_03.jpg) and the user's `extensions/codex/legendary-128px.gif`.

The 0.12.1 generic rig is rejected: it simplified and changed the anatomy. Version 0.13.0 instead samples the supplied 128px artwork through a textured mesh. Measured source regions move the real head, jaw, fins, arms, body, tail and tendrils. The source GIF is preserved, and Original mode provides a direct visual comparison.

Preserve these defining shapes in every future pose:

- Long pointed head and lower facial projection, two elongated horns, angular brow and visible teeth. Do not substitute a short generic dragon muzzle.
- Large angular fins behind the head, with distinct light/dark green surfaces and gold outlines.
- Long, substantial serpentine green body with a dark underside. Preserve volume while coiling, rather than drawing a thin tube.
- Gold/orange circular markings along the body and the long flowing tendrils with distinct wider tips.
- Small clawed arms, repeated body fins and the segmented, tapering tail.

Motion reference supplied by the user: [Mega Rayquaza GIF](https://i.pinimg.com/originals/64/a6/b8/64a6b818a118ae6a547e4c6c5bf27142.gif). The 20-frame, 2.6-second clip raises the head to roar, follows a twist down the body and shows tendrils flowing after it. It is a motion reference, not a bundled asset. The texture mesh uses that delayed follow-through while retaining the user's pixel artwork.

Animation acceptance: preserve recognizable anatomy before adding effects. Flight needs independent head/neck/body/tail motion with delayed follow-through; curled sleep needs a coherent coil and tucked head; roar needs a hinged jaw; Pulse must originate at the mouth; dash must streamline the same character. The mesh animates the available view; it does not invent unseen front/back anatomy. The production GIF records all five actions and their transitions.

Original artwork is a visual reference and is not shipped as an extension asset. Runtime animations remain local and make no model calls.
