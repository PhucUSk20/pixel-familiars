# Primal Groudon

Open **Pixel Pet: Open Primal Groudon** from the VS Code Command Palette. Its own panel tab is separate from Mega Rayquaza and the Codex activity companion. No session, model or hook is required to animate it.

## Motions

| Action | Choreography |
| --- | --- |
| Heavy walking | Alternating lifted feet, opposing arm swing, torso weight shift, delayed tail sweep and foot dust. |
| Sleep | Crouched torso, folded arms, visible lowered head, closed eye, slow breathing and sleep marks. |
| Roar | Head rises, jaw opens, shoulders/arms spread, armor trembles and sound rings expand from the mouth. |
| Precipice Blades | Arms wind up, body compresses on the slam, then four faceted molten blades rise sequentially with ground rings, sparks and debris, before settling away. |
| Energy Burst | Purple particles converge into a layered mouth orb, gold sparks mark the charge, then a bright cored projectile leaves a wavering trail while Groudon recoils. |
| Eruption | Head and jaw open during heat buildup, followed by fireballs launching diagonally from the articulated mouth, crossing above the stage and falling as a meteor shower with hot cores, trails and impact rings. |

**Auto** cycles all six motions. Selection blends over 1.1 seconds from the current pose, including rapid interrupted clicks. Manual motions repeat. **Pause** freezes pose, effects, source-loop playback and transitions. Hidden panels stop advancing. Toolbars reflow when narrow; the scene scales without horizontal overflow.

## Artwork and reference

The supplied `extensions/codex/groudon-primal-128px.gif` remains untouched. Its native 128px, 160-frame source loop lasts eight seconds. The atlas removes the source background for compositing; a browser comparison verifies every frame against the original GIF. Original mode plays those frames without rig deformation.

The new motions deform source texture through measured head, jaw, arm, leg and tail bindings with feathered boundaries. Nearest-neighbor sampling preserves the source palette. This is a rig of the supplied view, not a new 3D model or a turntable animation. Pixel effects are drawn procedurally around it.

References supplied by the user:

- [Paradonyx Primal Groudon turntable](https://www.deviantart.com/paradonyx/art/A-wild-Primal-Groudon-Appeared%21-%28turntable%29-490754256): access blocked during this implementation; the supplied sprite establishes the anatomy.
- [Primal Groudon GIF collection](https://tenor.com/search/primal-groudon-gifs): inspected Precipice Blades and Eruption sequences for windup, downward impact, rock emergence and lava arcs.
- [Purple mouth-charge GIF](https://i.pinimg.com/originals/50/c1/82/50c182390260968bac58c3e6a8d78e23.gif): inspected the charge, concentric glow, gold sparks and purple release. **Energy Burst** is a descriptive label, not a claim about the official move name.

Reference downloads stay in ignored `dist/` and are not bundled. The panel makes no host/model requests and adds no AI token use. The source sprite is independent of the regular pet/theme engine.

## Recording and verification

```powershell
npm.cmd run record:groudon
npm.cmd run record:groudon -- --action blades
npm.cmd run record:groudon -- --action burst
```

The main recording produces `docs/images/groudon-actions.gif` with all six motions and transitions. `--original` records the unchanged loop; `--check` runs browser checks before recording. Chrome/Edge and ffmpeg are needed for recording.

Unit checks cover source-palette fidelity, separate limb movements, windup/slam, recoil, mouth positioning and continuous interrupted transitions. Chromium checks all 160 original frames, six distinct rendered actions, attack states, paused transitions, resizing and the absence of host/model messages. The full companion and Mega Rayquaza UI regression also runs through `npm.cmd run test:ui`.

In Arena, Meteor Rain falls over Kyogre. A fifth ground-pair turn makes Kyogre's water beam and Groudon's fire beam meet at a pulsing collision core before a shockwave disperses them. Both mouth positions come from the articulated sprites.

Precipice Blades now sends a luminous fracture towards Kyogre, followed by six broad jagged magma pillars rising beneath the opponent. Contact throws fragments and steam and lifts Kyogre with a recoil reaction. The standalone preview shares the same renderer.
