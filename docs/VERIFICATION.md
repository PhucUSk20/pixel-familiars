# Verification

## 2026-10-13 - Lower-lane spacing and fixed Ho-Oh rainbow (0.36.0)

- Moved Koraidon/Miraidon from the crowded lower-left cluster to 40%/68% width at y=-35, between the central and base tiers. Ho-Oh now rests at y=0 beside Lugia and departs downward, leaving room below Reshiram.
- Anchored the seven-color rainbow to the arena floor at 9.5% width, y=158. Its unrotated arch tops at y=93; sparks remain in the same low region. Flight, recoil and facing no longer move the rainbow.
- Typecheck, build, all 225 sequential unit/package tests and targeted Avian Chromium checks passed. Inspected full-roster Demo screenshots before and during Arceus. Regression checks compare actual rainbow drawing geometry before/after bird movement and verify the relocated encounter coordinates.
- Complete Chromium UI/hooks/MCP suite passed (dist/v036-ui3.log, empty stderr); earlier foreground runs were interrupted by session resets. Packaging passed.

## 2026-10-11 - Hoopa/Eon Duo and Paradox rivals (0.35.0)

- Added the supplied Hoopa Unbound, Mega Latias, Mega Latios, Koraidon and Miraidon bodies as full native 160-frame transparent atlases. Verified every frame is nonempty and has a transparent outer background. Original GIFs remain unchanged and are packaged alongside the atlases.
- Independent 42-second encounters: Hoopa fights both Eon dragons through six-portal fist attacks and dark waves; the duo replies with mist balls and dark psychic volleys. Koraidon uses Tera Blast/Flamethrower; Miraidon uses Dragon Pulse and a charging Electro Drift rush/return with a lightning-pillar finish. Effects and impacts follow current actor anchors.
- User-approved placement: Hoopa/Eon Duo between upper/middle tiers, Koraidon/Miraidon lower-left below Ho-Oh. Existing sky limits are unchanged. Two manual buttons and Summon All include all five immediately, increasing the full roster to 30. Boss holds, target indexing, facing, departure, Rest and camera resize include both new groups. The action strip scrolls on narrow layouts.
- Judgment stagger adapts above 26 targets so all three volleys hit every actor before departure; shots, contact and recoil share that timing. Added independent lifecycle, portal fist geometry, Electro Drift travel/contact, camera placement, boss interruption, thirty-target volley tests and package assertions.
- Typecheck, build, all 224 sequential tests, targeted new-encounter Chromium checks and the complete Chromium UI/hooks/MCP suite passed. Updated the controls enumeration and full-roster assertions. Inspected portal fists, dark waves, Eon attacks, Flamethrower, Electro Drift and the full roster screenshots. Narrow/wide controls and cancellation passed. Demo artifacts are labeled Demo.

- Package validation and packaging passed; installed 0.35.0 locally and verified the manifest, all five native atlases and matching Arena bundle SHA-256: 329A707AADE73741341A4CDD25C5A6FE5D11F72DFA3150DAEFECDE818D0C581B.

## 2026-10-09 - Balanced central duels and Arceus-facing shields (0.34.0)

- Terapagos, Mewtwo, Rayquaza and Deoxys share the middle tier at 34%/44%/56%/66% width, y=-120. Mewtwo faces its left opponent and its Mega X lunge stops before the target. Calyrex/Heatran retain the lower right; sky size is unchanged.
- Summon All gives Ultra its entrance but suppresses the Ultra boss assault/counterattack. Opponent pairs fight until Arceus arrives at 10 seconds. Manual Ultra summons retain their boss battle.
- Renderer facing overrides preserve normal directions and restore them after Arceus leaves. All sprites, including Deoxys, Giratina and Ultra, face Arceus through departure. Rayquaza, Mewtwo, Kyurem, Zygarde, Eternatus and allied Ultra raise Judgment barriers; impacts terminate at their crowns and each volley adds only eight pixels of recoil. Creation shields remain.
- Typecheck, build, all 218 sequential tests and the complete Chromium UI/hooks/MCP suite passed. Browser assertions cover absence of Ultra assault during Summon All, balanced positions, six barriers, facing through departure and restoration. Inspected native crystal entrance, full roster and Judgment shield screenshots. Updated the former unshielded-Ultra recoil assertion to its new protected range.

- Packaged and installed 0.34.0 locally. Installed manifest and Arena SHA-256 matched the build: 0B522553C15AAA78C2640E5E60569096910EA6E28EC4C74076753B67C0A7F56F.

## 2026-10-09 - Stellar Terapagos and Mega Heatran opponents (0.33.0)

- Added the supplied native 128px Terapagos/Heatran bodies. Mewtwo now attacks Terapagos in the two central gaps between upper and middle groups; alternating Ice/Shadow Calyrex attacks Heatran on the lower right. The encounter uses the existing 160px/360px sky limits and four actual boss targets.
- Added rainbow glass-facet emergence, native floating/glints, star charge, twelve staggered upward-then-downward Tera Starstorm projectiles and repeated impact beams. Heatran adds ground cracks/fiery Earth Power eruption, lava breath, continuous spiral Magma Storm, large blast and seven lava-veined stone pillars. Calyrex/Mewtwo retained attacks now follow their new opponent anchors.
- Summon All includes 25 actors immediately with entrances; Arceus still joins after 10 seconds. Inspected crystal arrival, Earth Power, Tera Starstorm, Magma Storm/pillars and full-roster layout screenshots. Inspected the forty-frame Terapagos motion reference contact sheet.
- All 217 sequential unit tests, typecheck, build, targeted four-actor checks, full Chromium UI/hooks/MCP suite, package test and packaging passed. Added trajectory/impact timing and central-tier/boss-count tests; updated ten/twenty-five target assertions. A stalled Chromium run was restarted with test progress milestones; the complete rerun exited successfully.
- Installed 0.33.0 locally. Installed manifest, both new atlases and Arena bundle hash were verified. SHA-256: 1B665DDD26A73D7C1FDB9765C31C63587BFEF12F82756E4E3007CAE36736E13E.

## 2026-10-09 - Mewtwo/Calyrex duel and immediate full roster (0.32.0)

- Replaced Mewtwo's bird opponents with independent alternating Ice/Shadow Calyrex. Added frozen target, charged/thrown Glacial Lance and ice fragments; ghost field, seven staggered Astral Barrage explosions; Mega X psychic lunge/dark orb/blue-white impact and Mega Y rising/falling orb, purple-white pillar, lightning and debris.
- Lowered Ho-Oh, tightened the ground pair and placed the rider duel on the lower right within the existing sky. Deoxys meteor shield and finale collision now use the raised body anchor.
- Summon All starts 23 actors with entrance effects, including Ultra, Mega Zygarde, base Kyurem, Eternamax and Mega Mewtwo. Combat begins after native entrances; Arceus joins at 10 seconds. Tests cover actual boss targets, form alternation, cancellation, responsive layout and the falling-orb trajectory. Fixed random Arceus recruitment in the bird test fixture to keep its target-count assertions deterministic.
- All 215 sequential unit tests, typecheck, build, targeted rider checks, full Chromium UI/hooks/MCP suite and packaging passed. The package test was rerun after adding the new documentation/screenshots. Inspected Ice lance, ghost barrage, both Mega variants and full-roster entrance screenshots.
- Installed 0.32.0 locally. Installed manifest version and Arena bundle SHA-256 match the workspace build (6F72AF01F091A379FA06E7A4972937B86FC53EC59228CD46BD1905E7C7BD2789).

## 2026-10-08 - Frequent bird visits, optional Mewtwo and stronger wings (0.31.2)

- Replaced permanent Ho-Oh/Lugia/Mewtwo with frequent bird visits, sea/rainbow entrances, horizontal/vertical flight, pair duels and departure. Auto first visits after 12 seconds with 45?75 second gaps after departure; Mewtwo has a 25% chance, with Mega X/Y retained. Summon All guarantees all three.
- Inspected wing-beat, Sacred Fire, golden-cone Aeroblast and bird-duel GIF contact sheets. Added periodic seven-color rainbow, strong wing articulation, attached flame aura, mouth charge/light convergence and cone beam. Only present actors join boss target arrays; visits preserve an existing resident battle and the default sky remains 160 pixels.
- All 210 sequential unit tests, typecheck, build and full Chromium UI suite passed. Inspected bird arrival/rainbow, golden-cone Aeroblast and signature clash screenshots. Tests include absent/paired/trio target counts, both optional-Mewtwo branches, bounded recurrence, visible wing and travel changes, Rest, and preserving resident battle progress.

- Packaged and installed 0.31.2 locally; installed Arena bundle SHA-256 matches the workspace build.

## 2026-10-08 - Seven permanent Arena residents and native Summon All entrances (0.31.1)

- Arena opens with Rayquaza, Deoxys, Kyogre, Groudon, Ho-Oh, Lugia and Mewtwo. The native trio stays visible after combat and Rest; its fight uses the existing 160-pixel default sky. Horizontal viewport resizing spaces residents while boss retreats preserve their completed positions.
- Arceus and Ultra always include the native trio among their targets. Summon All allows normal group entrance effects, including delayed Kyurem and Zygarde arrival, before Ultra at 19 seconds and Arceus at 22 seconds. Repeated clicks are blocked and Rest cancels pending arrivals.
- All 208 sequential unit tests passed. Packaged and installed 0.31.1 into local VS Code; the installed Arena bundle SHA-256 matches the workspace build.
- Default seven-resident and 22-actor assault Demo screenshots inspected. Typecheck, build, sequential unit tests including queued-arrival cancellation, and the full Chromium UI suite passed. The suite covers both Mega branches, native arrival stages, permanent visibility, 160-pixel default sky, 22-target assault, responsive controls, hook/MCP, fallback/privacy and upstream preview.

## 2026-10-08 - Ho-Oh, Lugia and Mewtwo (0.31.0)

- Added five supplied native bodies with border-connected background removal and attached wing/head/arm/tail articulation. Inspected Sacred Fire, Aeroblast, sea emergence, electric black orb and violet psychic sphere reference contact sheets.
- Added the approved paired Ho-Oh/Lugia assault against Mewtwo, 32-second three-round scene, sea rise, charging, two clash fronts, 50/50 Mega X/Y transformation and departure. The group occupies the left side of the residents: Ho-Oh/Mewtwo in the middle tier and Lugia at ocean level. Residents continue their own battle; Kyogre rendezvous moves right to leave space for Lugia.
- Added manual button and Auto scheduling, coordinated Ultra/Arceus participation, bounded recoil, shared departure and Rest cancellation. Summon All includes the new trio and now totals 22 actors. Late recruitment preserves existing retreat goals.
- Dependency installation, typecheck, all 206 sequential unit tests, build, targeted both-Mega browser checks, full Chromium UI suite and packaging passed. Inspected scene screenshots and packaged the Demo image/native assets/AVIAN.md. The full suite logs a transient observer navigation-context message and exits successfully after hook/MCP/fallback/privacy and upstream checks.
- Installed 0.31.0 into local VS Code and confirmed the installed Arena bundle hash matches the workspace build.


## 2026-10-08 - Upper Creation group and middle aerial pair (0.30.3)

- Upper tier now has three columns: celestial left, Creation center, Galar right. Rayquaza/Deoxys occupy the middle center between Unova and Kalos. Their ambient flight, duel, ultimate trajectory and airborne meteor contact use the raised lane; base sky provides space for the aerial pair without visitors.
- Mirrored Ultra to face right and increased Ultra and both Eternatus forms to 1.1 times around their sprite centers. Galar effect anchors follow the scale and Ultra charge/assault anchors follow its scaled body.
- Typecheck, all 202 unit tests, build, targeted layout/Summon All checks, full Chromium UI suite and packaging passed. Updated old altitude expectations and isolated the resident random-activity test from visitor scheduling. Installed 0.30.3 and verified the installed Arena bundle hash matches the workspace build.


## 2026-10-08 - Summon All (0.30.2)

- Added Summon All next to Rest. It cancels existing visitor choreography, summons all five groups with guaranteed Giratina, starts Ultra Necrozma and then Arceus for the nineteen-pet common battle. Repeated summons are blocked while Arceus is active; Rest cancels the encounter.
- Typecheck, all 202 sequential unit tests, build, targeted real-button/responsive checks, full Chromium UI suite and VSIX packaging passed. Full spacing-only UI validation also passed for 0.30.1. Updated the control-list assertion to include the new button.
- Inspected the nineteen-pet assault screenshot and installed 0.30.2. Confirmed the installed Arena bundle SHA256 matches the workspace build.


## 2026-10-08 - Wider group spacing (0.30.1)

- Replaced the fixed 56px group spread with viewport-proportional columns: three middle columns and two upper columns. Partners spread across each column while the third member stays above its midpoint. Outer partners use an 8.5% center inset to keep the body visible during boss recoil. Vertical tiers and resident behavior are unchanged.
- Dependency installation, typecheck, 201 unit tests, build, targeted responsive layout checks and VSIX packaging passed. Inspected the updated Demo image and installed 0.30.1; the installed Arena bundle SHA256 matches the workspace build.


## 2026-10-08 - Three-tier Arena group layout (0.30.0)

- Added shared fixed group slots. Resident ground/ocean/air behavior stays on the lowest tier. The middle tier contains Unova on the left, Palkia/Dialga/Giratina at center and Kalos on the right. The upper tier contains Solgaleo/Lunala/Necrozma on the left and Galar on the right. Each group has two close partners and a third member above their midpoint.
- Begin and viewport resize use the shared layout. Camera-only zoom preserves existing screen-X positions. Removed conditional celestial/Kyurem elevation and distant Ultra relocation; Mega Zygarde no longer adds a sideways rendering offset. Necrozma/Ultra stays in its celestial group, and Zamazenta faces inward from the right side of its group. Rush, absorption, recoil and departure remain active.
- All visitor scenes share a fixed 360px extra-sky cap sufficient for three tiers; additional groups do not add height. Expanded visitor recoil bounds to use transparent sprite margins, so left-side groups still show Judgment displacement rather than stopping at the old origin clamp.
- Dependency installation, typecheck, all 201 sequential unit tests, build and VSIX packaging passed. Targeted Chromium checks passed for grouped positions, stable slots during combined summons/boss interruption, eighteen/nineteen targets and narrow/shallow layouts. Inspected the all-group scene and linked the labeled Demo image and layout documentation in README.

- Full Chromium UI suite passed for every Arena encounter, responsive layout, pet panels, hooks/MCP, fallback/privacy and upstream preview. Updated obsolete Giratina Y expectations and sampled resident movement throughout the encounter rather than comparing two potentially reset skill timers.
- Installed 0.30.0 in local VS Code and verified the installed manifest and Arena bundle hash against the workspace build.

## 2026-10-08 - Galar Heroes (0.29.0)

- Added the supplied native 128px Crowned Zacian, Crowned Zamazenta, Eternatus and Eternamax atlases with border-connected background removal and attached head/leg/armor/tail articulation. Added Galar Heroes and automatic visits with a 46-second cooperative encounter.
- Inspected the user's Behemoth Blade/Bash, Dynamax Cannon, Eternabeam and lab-escape GIF contact sheets. Implemented thin ordinary pink beams, mouth/core charge, shield defense, transformation spiral, five storm rays, extended cyan blade, red-gold shield aura, coordinated rushes, dual Eternabeam, final strike, defeated Eternamax fragments and hero departure. After screenshot review, separated the hero approach angles, aimed the sword at the actual core and reduced the shield fill so the supplied body remains visible.
- Resident duels continue independently and visitors share the existing 280px extra-sky cap. Boss interruption preserves the current Eternatus form and cancels active rush offsets; target ordering supports eighteen Ultra opponents or nineteen Arceus attackers. Rest cancels the scene and inactive cancellation does not consume resident randomness.
- Dependency installation, typecheck, all 199 sequential unit tests, build and VSIX packaging passed. Targeted Chromium Galar validation passed again after the final visual changes, covering every phase, transformation, defeat/departure, pre/post-evolution interruption, seven/nineteen-pet Arceus encounters, eighteen-pet Ultra encounter and narrow/shallow controls.
- The first full UI attempt exposed a timing assumption in the resident-only rendezvous check (ground approach versus air fight). After explicitly waiting for both independent pairs, full Chromium UI validation passed for all Arena encounters, pet panels, autonomous interactions, activity/quotas, hooks/MCP, fallback/privacy and upstream preview.
- Installed 0.29.0 into local VS Code, verified the installed manifest and all four atlases/demo, and confirmed the installed Arena bundle hash matches the packaged workspace build.
- Recorded and inspected a 475-frame labeled Demo, linked it and the four native sources from README, and packaged all atlases, sources, the demo and GALAR.md. The resident UI check now explicitly waits for both independent ground/air rendezvous instead of assuming they begin fighting on the same tick.

## 2026-10-07 - Kalos Guardians (0.28.0)

- Added native 128px Xerneas, Yveltal, Zygarde Complete and Mega Zygarde Complete atlases with attached articulation and preserved source colors. Kalos Guardians and Auto start the approved 44.6-second duel/intervention scene; Rest cancels it.
- Inspected reference GIF contact sheets for Xerneas, Yveltal emergence/charge/beam, Extreme Speed and Core Enforcer, plus the attached Mega cannon screenshots. Implemented antler-orbit lights, seven-color beam, red cocoon and folded-wing arrival, red-violet beam, two-target speed dash, green Z trace, transformation flash and a white-violet cannon through three hexagonal charge gates.
- Resident duels continue independently; combined visitors share the existing 280px sky cap. Raised Zygarde above the resident air lane after screenshot inspection. Boss interruption keeps its current form, reveals Complete before normal arrival if necessary and safely supports fifteen Ultra opponents or sixteen Arceus attackers with finite camera coordinates.
- Dependency installation, typecheck, all 192 sequential unit tests, build and VSIX packaging passed. Targeted Chromium Kalos tests passed for every stage, pre/post-evolution interruption, seven/sixteen-pet Arceus encounters, fifteen-pet Ultra encounter, cancellation and narrow/shallow controls.
- Full Chromium UI validation passed for all Arena encounters and pet panels, autonomous interactions, activity/quotas, hooks/MCP, fallback/privacy and upstream preview. The full run includes the final raised guardian position.
- Recorded and visually inspected the final 460-frame labeled Demo, linked the four sources and demo in README, and included all assets and KALOS.md in the package. Installed 0.28.0 into local VS Code and verified the installed manifest and four atlases; installed Mega atlas hash matches the workspace.

## 2026-10-07 - Unova Dragons and Kyurem fusion (0.27.0)

- Added supplied native 128px Reshiram, Zekrom, Kyurem, White Kyurem and Black Kyurem bodies with border-connected background removal and attached articulated joints. The Unova Dragons button and Auto visit introduce the resident-independent 47.5-second encounter.
- Inspected the supplied Blue Flare, Zekrom signature, Kyurem homing-missile and charged energy-sphere GIF contact sheets. Retrieved the ordinary Reshiram Pinterest GIF and matched its overhead fire charge and burning tail. Zekrom has a blue turbine charge, lightning and a thick white/blue signature beam; four magenta missiles fan outward from Kyurem's back and follow curved homing trails.
- Each encounter independently chooses White/Reshiram or Black/Zekrom with a 50/50 threshold. Only the matching host is absorbed; the other dragon remains as the fusion opponent. Both forms clash attacks, then restore the host and depart. Boss interruption safely restores all three originals before the shared assault, hit reactions, recoil and departure. Rest cancels the whole sequence.
- Preserved existing resident randomness by avoiding RNG consumption for inactive Unova cancellation. The resident-only UI fixture disables new visitor Auto arrivals so its long simulated scenarios remain isolated; new unit checks verify the actual Auto summon and Rest suppression. Combined visitors retain the 280px sky cap, with a separate upper Kyurem lane above Giratina. Camera resizing preserves horizontal screen positions.
- Dependency installation, typecheck, all 185 sequential unit tests, build and packaging passed. Full Chromium UI validation passed for all Arena encounters, resident pets, quotas, hooks/MCP, privacy and autonomous interactions. Targeted Unova Chromium validation passed again after the final overhead-charge and upper-lane visual changes, covering both fusions, restored host/departure, four homing missiles, seven/thirteen-pet Arceus assaults, twelve-pet Ultra assault and narrow/shallow controls.
- Recorded and inspected both labeled Demo GIFs, refreshed them after the final visual changes and linked both plus all five source forms from README. The VSIX includes the five atlases, five native GIFs, both demos and UNOVA.md.

## 2026-10-07 - Compact shared sky and celestial corners (0.26.1)

- Space/Time/Giratina and Sun/Moon share the 280px extra-sky cap used by Sun/Moon alone, replacing the combined 480px expansion. The celestial upper lane moves from -300 to -230 so all five visitors fit. Existing screen-X camera preservation and concurrent battles remain active.
- Sun and moon backdrops follow the actual Arena sky corners rather than pet positions: top-left solar flames and top-right lunar disc. Insets preserve their full outer glow. Inspected the five-visitor charge screenshot and refreshed the Sun/Moon Demo GIF.
- Dependency installation, typecheck, all 176 sequential unit tests, build, packaging, targeted celestial Chromium checks and the full Chromium UI suite passed. Coverage includes concurrent visitors, corner coordinates, Arceus/Ultra encounters, cancellation, responsive controls, all resident pets, quotas, hook/MCP and privacy.
- VS Code installation verified as pixel-pet-local.pixel-pet-codex@0.26.1.

## 2026-10-07 - Ultra boss and Arceus alliance (0.26.0)

- Added Summon Ultra for a direct restored-form visit. Ultra can coexist with Space/Time/Giratina and Sun/Moon. Its boss timeline interrupts local rival duels for a combined four-to-nine-pet assault against the prism barrier, then one Light That Burns the Sky counter and departure. The absorption/restoration story now transitions into that boss encounter.
- Inspected the supplied final-move GIF contact sheet. Converging chest light grows into a colossal white/gold sphere, releases a wide sky pillar and an expanding detonation across the Arena. Hit flashes and visible recoil accompany each staggered contact. Palkia/Dialga shields and Giratina's silhouette shadow shield reduce knockback.
- Arceus can follow Ultra (35%), and Ultra can follow Arceus (30%). A lone Ultra can call Space/Time (65%). Manual buttons support either order. Arceus takes priority; Ultra joins the synchronized combined assault with an animated golden stream and white expanding rings. The full roster yields ten attackers and ten Judgment targets before a shared departure. Late visitors preserve prior retreat goals and camera changes preserve pet screen X positions. Rest cancels pending arrivals.
- Dependency installation, typecheck, build and all 176 sequential unit tests passed. Full Chromium UI validation passed, including both boss orders, natural reverse arrival, four/nine-pet Ultra counters, three creation shields, ten-pet assault/Judgment, recoil, cancellation, responsive controls, all existing pets, quotas, hooks/MCP, privacy and autonomous interactions. Targeted Chromium checks passed again after the final continuous-motion polish. An existing Windows shell test timed out under simultaneous GIF recording; the isolated final full-unit run passed.
- Recorded and inspected labeled Demo GIFs for the Ultra boss battle and Ultra/Arceus alliance, and updated the longer absorption/restoration recording. Added the two battle GIFs and controls to README and NECROZMA.md. Native pet bodies retain the established 128px source standard.

## 2026-10-07 - Necrozma light restoration (0.25.0)

- Added four native 128px Necrozma bodies from the supplied GIFs, with border-connected background removal and weighted pixel articulation. The new Necrozma button summons the celestial pair when needed; an occasional longer-cooldown natural visit can interrupt Sun / Moon. Resident battles continue.
- Researched the anime chronology and official Ultra Pok?dex. The scene shows Dawn Wings/Lunala, Solgaleo freeing Lunala, Dusk Mane/Solgaleo, host release, simultaneous lunar/solar light restoration, Ultra transformation and a golden sky burst. Both hosts are visible before Ultra. This is an anime-inspired compression; consuming both hosts is not treated as an Ultra prerequisite. Details and sources: NECROZMA.md.
- Rest cancels the entire encounter. Arceus interruption releases the host and resumes the existing joint assault. Camera changes preserve pet screen X; controls remain usable in narrow and shallow panels. Automatic visitor timers allow the final departure to complete.
- Dependency installation, typecheck, build, packaging and all 170 sequential unit tests passed. An existing Windows hook subprocess timeout under concurrent recording/UI load passed on the isolated rerun. Full Chromium UI validation passed for Necrozma, all existing Arena visitors/residents, quotas, hook/MCP, privacy and autonomous interactions.
- Inspected charge, native fusion, release, restoration and Ultra sky-burst screenshots. Re-recorded the 56-second labeled Demo GIF after correcting the solid tapered beam, and added the four supplied animated forms plus the full scene to README.
- VS Code reports pixel-pet-local.pixel-pet-codex@0.25.0 installed successfully.

## 2026-10-07 - Guaranteed Giratina after rival-only visits (0.24.3)

- Space/Time remembers its last appearance. A rival-only visit guarantees Giratina in the next normal encounter; the first visit and visits following Giratina retain their 45% trio chance. Rest, cancellation and failed repeated summons do not erase or reroll this history. Manual, automatic and Arceus-following arrivals share the rule; explicit recording/test scenarios remain deterministic.
- Typecheck, build and all 166 sequential unit tests passed. Tests cover repeated guarantee cycles, ordinary probability after trio visits, cancellation, Rest and manual-to-automatic transitions. Targeted Chromium verification clicked the real Space / Time button four times with random rolls that would otherwise omit Giratina, confirming visitor counts 2, 3, 2, 3 without runtime errors.
- Packaging passed and VS Code installed the local 0.24.3 VSIX successfully.

## 2026-10-07 - Star mane charge and elevated celestial bodies (0.24.2)

- Solgaleo now occupies the left lane facing right; Lunala occupies the right lane facing left. The sun and moon render diagonally above and outside the sprites: upper left for Solgaleo, upper right for Lunala. Extra sky keeps their upper rims visible, including concurrent Space/Time/Giratina encounters; camera changes preserve pet screen X coordinates.
- Solgaleo raises its head and expands its native white/gold mane pixels around the face into a wider star during signature charge. The blue forehead core gathers converging sparks, then transfers light to the mouth before the stationary solar beam. Source colors, mouth/forehead anchors and the lower body remain attached. The supplied Tenor reference was inspected as a contact sheet.
- Dependency installation, typecheck, build and all 164 sequential unit tests passed. Tests cover lane orientation, backdrop clearance, native mane expansion with stable face anchors and body core, existing nine-pet Judgment, independent encounters and cancellation. Targeted Chromium checks verify full mane opening, fixed mouth-origin beam and all prior celestial encounter phases. The charge screenshot was inspected and the README Demo GIF was re-recorded.
- Full Chromium UI validation passed for the Arena, existing visitors and resident panels, hook/MCP, privacy, quotas and autonomous idle interactions. Following the requested diagonal placement correction, targeted Chromium checks and all 164 unit tests passed again; the final diagonal charge screenshot and updated GIF were inspected.
- Packaging passed and VS Code installed the local 0.24.2 VSIX successfully.

## 2026-10-07 - Lunar charge, solar beam and concurrent visitors (0.24.1)

- Lunala folds its connected wing pixels inward around the ordinary plasma charge and opens them on release. Solgaleo stays in position for its signature mouth-origin gold/white beam. A cratered moon and a continuous flaming solar silhouette appear behind the two native sprites; two beam streams meet at one cached collision front.
- Diagonal spatial cuts open before the sprite reveal and close behind each arrival. Both visitor groups can start in either order or overlap automatically. Their independent two-round encounters continue alongside resident battles on separate sky layers; finishing either group does not stop the other. Camera zoom preserves active pet screen X positions.
- Arceus holds both encounters for the combined assault, with violet/gold streams from the celestial pets. Judgment targets all present pets, up to nine, with visible flash/recoil, then both visitor groups depart. Retreat goals remain attached to the correct pets if Space/Time joins after Arceus. Old visitor shield flags cannot reduce unshielded celestial knockback.
- Dependency installation, typecheck, build and all 162 sequential unit tests passed. Targeted Chromium checks cover fold/release, stationary beam, fixed front, five concurrent visitors, nine-pet assault/Judgment, departure, cancellation and responsive controls. Charge, arrival, beam clash, joint assault and Judgment screenshots were inspected.
- Full Chromium UI validation passed, including all existing pets, independent visitor encounters, hook/MCP, quotas, privacy and autonomous idle interactions. The pre-reveal spatial-cut screenshot was also inspected.
- The Sun/Moon Demo GIF was re-recorded for README. Packaging passed and VS Code installed the local 0.24.1 VSIX successfully.

## 2026-10-07 - Lunala and Solgaleo friendly encounter (0.24.0)

- The supplied 128px animated sources retain native colors and connected wing/head/leg/tail articulation. Border-connected dark source backgrounds are removed from the two atlases. Reference GIFs were inspected for the lunar platform, plasma charge, moon halo and solar dash.
- Sun / Moon summons both temporary visitors for a 20.7-second friendly encounter: ordinary plasma collision, Moongeist Beam versus Sunsteel Strike, recovery and departure. Auto visits use a deferred 90-180 second schedule; resident battles continue below. Rest cancels the visit, repeat summoning is blocked, and an explicit Arceus summon takes priority.
- Typecheck, build and all 157 sequential unit tests passed. Targeted Chromium checks cover each phase, fixed collision fronts, departure, cancellation, Arceus interruption, responsive controls and absence of extra host messages. Arrival, charge and signature clash screenshots were inspected. The labeled Demo encounter GIF and both original pet GIFs are included in README.
- Full Chromium UI validation passed, including all existing visitors and resident panels, hook/MCP, privacy, quotas and autonomous idle interactions.
- Packaging passed and VS Code installed the local 0.24.0 VSIX successfully.

## 2026-10-07 - Airborne Deoxys form contact (0.23.2)

- Arena meteorites stop in front of Deoxys at chest height instead of landing on the ground. Deoxys remains at the same X/Y during falling, touch and transformation; the intermediate descent/approach and upward return are removed from the form-change sequence.
- Nominal timing is 650 ms falling, 350 ms touch and 900 ms transformation (1.9 seconds total). The requested form still swaps only at the flash midpoint after real contact. Renderer pose and energy envelopes normalize to the shorter durations, retaining native sprite geometry. Dedicated sanctuary timing remains unchanged.
- Resize retargets an airborne meteorite to the resident position; Rest clears suspended rocks and cancels pending form switches. Autonomous Arena form changes and scripted aerial rounds share this behavior. The separate defeated-Deoxys meteor rebirth finale is preserved.
- Dependency installation, typecheck, build and all 152 sequential unit tests passed. Targeted Chromium checks verify chest-level contact, unchanged altitude, correct form switching and all aerial finale stages. The falling/touch/transformation screenshots were inspected; the aerial Demo GIF was re-recorded. Full Chromium UI validation passed, including existing visitors, resident panels, hook/MCP, privacy and idle interactions.

## 2026-10-07 - Combined Speed slashes, immediate shield and twin ruptures (0.23.1)

- Five aerial rounds now use fire against Defense's barrier, two colliding energy orbs, Speed pursuit with articulated violet tentacle slashes, the Normal beam clash and the 23-second finale. Rayquaza no longer dodges the second-round orb; both projectiles meet at one locked point between the pets and explode.
- The fire stream follows the articulated mouth and has a white core with gold/orange outer flames. Deoxys raises an arm and pulls 38 irregular meteor fragments inward as its ultimate orb launches at five seconds. Its cyan shield is already forming before Rayquaza reaches either the orb or the body. The orb breaks into a bright contact core, two expanding shock rings and 32 energy shards.
- Rebirth uses a falling crystalline meteor with nested red/purple triangular rims and a luminous star core, ground impact and rematerialization. The recorded aerial Demo includes fire, orb clash, combined Speed slashes and the finale; it remains local with no model calls.
- Rival-only signature collisions retain one central spatial rupture. With Giratina, the two ruptures cache the actual left/right collision fronts, persist independently of pet recoil, and both adjust with resize. No spatial crack is attached to Giratina's mouth or body. Updated the Giratina Demo GIF.
- Dependency installation reports zero vulnerabilities. Typecheck, build and all 150 sequential unit tests passed. Targeted Chromium checks verify projectile meeting, immediate shield timing, disappearance/rebirth, one versus two stable cracks and existing visitor interactions. Fire, early shield, orb destruction, triangular rebirth and twin-rupture screenshots were inspected. Full Chromium UI validation passed, including all existing panels, hooks/MCP, privacy and autonomous interactions.

## 2026-10-07 - Aerial cinematic finale (0.23.0)

- Removed the artificial pair of purple eye orbs from Giratina emergence while retaining its native eyes, silhouette aura and two-orb attack.
- Arena Rayquaza uses centered 1.1x body scale; Deoxys uses 0.9x, including transformation flashes and attack origins. Nearest-neighbor rendering keeps pixel edges sharp. Rayquaza stages horizontally ahead of Kyogre rather than directly above it, including narrow panels.
- Added an articulated nine-second tentacle frenzy and 23-second Dragon Ascent / Psycho Boost finale: gold/cyan source-textured dragon charge, red-purple dark-centered orb, breakthrough, hovering meteorites, psychic shield destruction, Deoxys dissolution, absence, falling meteor impact and materialization. Original four aerial rounds and independent ground battles remain. Auto completes the sequence before scheduled visitors; explicit summons and Rest can interrupt and restore visibility.
- Downloaded and inspected the four supplied animation references in ignored dist files. Reference assets are not packaged. Recorded updated aerial-finale and Giratina Demo GIFs and linked the finale in README.
- Dependency installation, typecheck, build and all 149 sequential unit tests passed. Full Chromium UI checks passed for the new choreography, cancellation, scales, horizontal separation and all existing resident/visitor panels, source fidelity, HUD, interactions, hooks/MCP and privacy flows. Inspected frenzy, orb clash, meteor shield, shield breakthrough and rebirth screenshots.

## 2026-10-07 ? Giratina silhouette aura and compact contacts (0.22.2)

The updated Giratina Demo GIF includes arrival aura, compact skill clashes and Judgment protection. Packaging passed and the local 0.22.2 VSIX was installed successfully.

- Replaced the dark circular shield with an exterior pixel aura derived from the current articulated RGBA silhouette. The violet rim follows head, wings, feet and tail and never paints over source body pixels. A mild 28% shadow blend preserves the pet?s original colors.
- Aura is active during ground emergence, clears before attack charging, and returns for Arceus Judgment. Contact targets the actual sprite crown. Shielded recoil stays at eight scene pixels per volley.
- Each contact uses one small shock ring, ten short sparks and three compact arcs instead of three large rings, 42 sparks and seven long arcs. Removed duplicate lash bursts and reduced orb bands; the two 50px countering orbs remain intact.
- Dependency installation, typecheck, build and 145 sequential unit tests passed. Full `npm.cmd run test:ui` passed, including aura arrival/attack/Judgment timing and all existing panels, hook/MCP, privacy and interaction flows. Arrival, compact-clash and Judgment screenshots were inspected. Coverage verifies exterior-only aura pixels, visible body colors, no distant dome, arrival/attack/Judgment/cancellation timing, targeted orb collisions and reduced recoil.

## 2026-10-07 ? Giratina skill clashes and shadow shield (0.22.1)

Updated `giratina-encounter.gif` records the full clash and Arceus intervention as Demo. Packaging passed and the local 0.22.1 VSIX was installed successfully.

- Each allied attack meets a separate Giratina counter at an actual mid-air pressure front. Signature shadow orbs grow to 50 scene pixels in diameter, stop with their leading edges against Spacial Rend and Roar of Time, and hold the clash before two radial explosions. Ordinary shadow lashes also stop at their respective contacts.
- Recoil now follows collision explosions instead of reporting direct pet hits while skills are blocked. Contact cores, violet bands, sparks, electrical arcs and expanding shock rings make both pressure fronts visible.
- Giratina always raises its own shadow shield during Judgment: darkened native sprite, a violet spectral rim, moving shadow wisps, upper-surface contact sparks and reduced eight-pixel per-volley knockback. Canceling resets the barrier.
- Dependency install, typecheck, build and 144 sequential unit tests passed. Full `npm.cmd run test:ui` passed, including all existing resident panels and Pixel Pet hook/MCP/privacy/interaction checks. Tests verify two distinct contact fronts, exact orb endpoints, shield rendering and reduced recoil. Targeted Chromium checks and inspected screenshots confirm both clashes and seven-pet Judgment with all three visitor shields.

## 2026-10-07 ? Giratina and coordinated encounters (0.22.0)

The updated Giratina, Space/Time and Arceus Demo GIFs were recorded. Packaging passed and VS Code installed the local 0.22.0 VSIX successfully.

- Giratina uses the supplied 160-frame native 128px Altered Forme source, connected articulation, shadow ground emergence/departure, dual shadow lashes and two targeted violet projectiles.
- Each Space/Time encounter chooses once between the rival duel (55%) and Giratina alliance (45%). Original aerial and ground resident battles continue independently until Arceus interrupts.
- All present pets share the same assault launch envelope against Arceus. Plasma streams in the assault and resident beam clashes have two expanding white rings. Both Palkia and Dialga always shield Judgment; unshielded pets receive greater knockback.
- Arceus performs Judgment only and departs with all visitors after the counter. Repeated-visit tests ensure no random follow-up skills return.
- Validation: dependency installation, typecheck, build and 142 sequential unit tests passed. The packaging asset test also passes with the new atlas, guide and GIF. Full `npm.cmd run test:ui` passed, including the existing Pixel Pet hook/MCP, privacy/fallback and interaction flows. Targeted Chromium checks passed for duo/trio encounters, seven-pet assault, twin-orb hits, shield contact, departure, cancellation and responsive camera behavior. Screenshots were inspected; `docs/images/giratina-encounter.gif` is a recorded, labeled Demo.

## Stable camera, randomized visitors and creation skills 0.21.1 ? 2026-10-06

- Camera opening/closing preserves resident screen centres while terrain and native sprite display scales change together. No habitat clamps are applied during camera zoom, and pending retreat goals retain their screen positions. Additional sky padding accommodates Judgment above visitor shields.
- Rival Auto intervals are 45?105 seconds; standalone Arceus intervals are 150?300 seconds. Signature collision retains its single 35% intervention roll; standalone Arceus independently rolls 40% for rivals arriving 0.9?2.1 seconds later. Their arrival completes before joining the assault, without fabricating a signature rupture.
- Ordinary Palkia attacks make one 50/50 mouth-pulse/hand-orb choice per encounter. The supplied hand-orb, luminous portal and Dialga charge references were downloaded into ignored dist files and visually inspected. Palkia now has a glowing oval portal and tapered plasma slash with curved fragments, without circular wake rings. Dialga gains inward spiraling charge filaments and expanding white perspective rings near its mouth.
- Visitors independently roll 65% for Judgment barriers. Shielded impacts stop at the upper barrier surface, flash and move up to eight pixels per volley; unshielded pets move up to 24, subject to bounds. Rest cancels all pending arrivals. Simulation controls remain exclusively in the Demo fixture.

- `npm ci`, typecheck, build, all 136 sequential tests, the complete Chromium UI suite and final targeted encounter check pass. Re-recorded the full hand-orb/six-pet Demo GIF, packaged the VSIX and installed extension 0.21.1.

## Palkia / Dialga space-time encounter 0.21.0 â€” 2026-10-06

- Added temporary native 128px Palkia/Dialga visitors with connected source-textured head, jaw, arm, leg and tail articulation. Both supplied 160-frame atlases retain foreground colors and remove the flat background. The Arena camera eases open an additional 96 scene pixels of starry sky while retaining one shared panel scale.
- The Space / Time button starts the encounter; Auto schedules rare encounters after 180â€“270 seconds. Arrival and departure use Palkia's branching violet spatial cracks and Dialga's gray time field with fractured clock fragments.
- Ordinary attacks emit a violet-white Palkia mouth pulse and an orange-gold Dialga flame stream that meet and explode. Signature charge lights Palkia's pink shoulder pearl and cocked arm, and Dialga's blue head point and mouth. The swinging hand releases a thick curved Spacial Rend crescent against broad Roar of Time plasma. Their collision creates an explosion and a fixed spatial rupture independent of moving/recoiling limbs.
- A single 35% roll after the signature explosion can summon Arceus. Visitors stay for six blocked attacks and six real Judgment contacts, including flashes and one bounded knockback per volley. Judgment launches above the upper visitors and descends into their actual positions. Visitors leave after the counter; Arceus follow-up skills remain intact.
- Rest and mode selection cancel unfinished scenes. Repeated summons cannot restart events. Resize preserves only the remaining retreat distance instead of reapplying a sixteen-pixel flee step on every camera frame. No model calls, hook/trust changes or simulated quota values are introduced.
- Unit regressions cover both intervention branches, roll timing and no rerolls, phase order, cancellation, six contacts, bounded knockback, native source area, hand/mouth articulation, descent into elevated targets and retreat stability across resizes. The Demo fixture forces branches only for testing/recording; the shipped webview exposes no preview probability override.

- `npm ci`, typecheck, build, all 131 sequential tests and the complete Chromium UI suite pass. The final lifecycle resize correction also passes the targeted creation UI check. Re-recorded the full Demo encounter GIF, packaged the VSIX and installed extension 0.21.0.

## Native 128px Arceus scale 0.20.2 â€” 2026-10-06

- Removed Arceus' private 1.25x body enlargement. Its 128Ã—128 source now maps to the Arena at 1:1, matching Rayquaza, Groudon, Kyogre and Deoxys. Drawing surfaces provide animation padding rather than another pet size; all actors receive the same responsive panel scale.
- Orbit and barrier radii and the forehead/mouth origins scale with the native body. Nearest-neighbor drawing preserves pixel edges. The combined assault still ends at the barrier; an origin already inside the barrier is blocked in place rather than projected outward.
- `npm ci`, typecheck, build, all 124 sequential tests and the complete Chromium UI suite pass. Re-recorded the Arceus GIF, packaged the VSIX and installed extension 0.20.2.

## Arceus summons, descent and Judgment counter 0.20.1 â€” 2026-10-06

- Added a local **Summon Arceus** button. It interrupts Auto/Rest/Duel, switches to Auto and stays disabled during the visit. No model or host requests are sent by summoning.
- Arceus descends from above with 18 orbiting colored elemental tablets; front/back drawing keeps the orbit around its original sprite. Departure ascends instead of fading in place.
- Only pets within 125 scene pixels step back, by up to 16 pixels within their existing movement bounds. Distant pets keep their positions and all pets retain their altitude. Each actual Judgment volley adds five pixels of bounded knockback exactly once.
- All four pets combine dragon, psychic, water and fire attacks against a golden barrier. Their attacks stop at the barrier and leave Arceus unharmed. Every visit then counters with Judgment. Subsequent visits retain Twister, Recover and Hyper Beam as additional skills after the counter.
- Unit regressions cover descent, blocked assault before Judgment, manual summon from Rest/Duel without teleportation, repeat protection, nearby/distant movement, volley knockback, cancellation, resize and the retained follow-up skills. All 124 sequential tests pass; typecheck and build pass. The complete Chromium UI suite passes, including manual summons from all modes, repeat protection, the descending orbit, combined barrier impacts, counter Judgment, retained follow-up skills and narrow/wide layouts. Re-recorded the Judgment GIF, packaged the VSIX and installed extension 0.20.1.

## Arceus divine visits 0.20.0 â€” 2026-10-06

- Auto mode includes rare centered Arceus visits. Every resident retreats smoothly into a visible corner and trembles; battles pause. Departure eases the residents back into their normal bounds, resumes roaming and schedules another visit. Rest cancels a visit; manual Duel keeps its paired choreography.
- The runtime atlas retains all 160 supplied foreground frames and removes the flat background key. A connected source-textured head/leg rig articulates the sprite while preserving its golden torso ring.
- Judgment includes forehead charge, sky launch, a radial bloom and three staggered volleys into all four actual pet positions, with luminous trails, vertical contact flashes, debris and ocean splashes. Twister, visual Recover and a mouth-origin Hyper Beam complete the visit cycle. Actual impacts trigger timed recoil and flashes; Recover leaves real usage/quota values alone.
- Unit coverage verifies rare timing, all lifecycle stages, retreat/resume, cancellation, resize, all Judgment endpoints, per-target contact timing and retained sprite area. Browser coverage exercises all four skills, four hit reactions, centered resize and cancellation using a Demo-only fixture adapter. No preview controls are exposed by the shipped webview.
- `npm ci`, typecheck, build, all 123 sequential tests and the complete Chromium UI suite pass. README includes the re-recorded Arceus Judgment preview and links to its guide. VSIX packaging passes; installed extension 0.20.0.

## Left-edge storm clouds and vertical scattered rain 0.19.12 â€” 2026-10-06

- The Arena cloud bank now extends all the way to the ocean's left edge, preserving its stepped pixel shapes and coverage above Groudon.
- Rain drops use independently seeded spawn positions, phases, speeds and lengths. Each drop falls vertically at a fixed horizontal position until respawn. The shared preview and Arena renderer no longer generate diagonal rows or sideways drift.
- Regression checks both storm edges, cloud style, deterministic frames, vertical motion, varied phases and lengths, and coverage at narrow and wide widths. All 116 sequential tests pass.
- The UI harness now drops messages only when its Arena page has closed, preserving errors during live delivery. Compaction checks the pet anchor and visible bath instead of treating an animated bath pixel as the pet position.
- `npm ci`, typecheck, build, all 116 sequential tests, the complete Chromium UI suite and VSIX packaging pass. Re-recorded the Kyogre actions, Arena duel and autonomous Arena GIFs. Installed extension 0.19.12.

## Arena jet height, ocean rainfall and contact feedback 0.19.11 â€” 2026-10-06

- Arena elevates the complete five-orb ring so its highest released horizontal jet aligns with Groudon's articulated head. Orb geometry and frozen release positions remain intact; standalone preview placement is unchanged.
- Rainfall extends to the ocean's left edge, including wide panels, while preserving the existing cloud bank and vertical lightning above Groudon.
- Added recoil and sprite flashes for Energy Burst and each landed meteor; strengthened water contact feedback. Aerial defense absorbs and reflects with visible recoil, Deoxys reacts to pursuit contact, and Rayquaza reacts to nearby autonomous psychic impacts and Groudon attacks. Dodged shots do not trigger hit feedback; recoil returns to the original pose.
- Regression covers five aligned jet lanes, ocean rain coverage with unchanged clouds, actual meteor landing frames, contact timing and recovery. Browser checks capture the elevated jets, storm and ground-hit reactions.
- `npm ci`, typecheck, build, all 115 sequential tests and the full Chromium UI suite pass. Re-recorded both Arena GIFs. Packaged and installed extension 0.19.11.

## PR #1 installer compatibility review 0.19.10 â€” 2026-10-06

- Reviewed nhankun2006's change against current main: remove the daemon override when launching Codex for hook review; skip the interactive launch when stdin is not a TTY. Integration has no conflicts and retains manual folder/hook trust.
- The installed Windows Codex CLI 0.160.1 accepts the updated workspace command. Added isolated installer-control-flow regressions for Windows, macOS and Linux covering interactive launch, non-TTY behavior and explicit --no-review; subprocesses are mocked so tests perform no installation or trust changes.
- The contributor reports a successful Fedora installation. No actual Linux environment was used in this local review; the platform matrix validates installer branching, not full Linux installation.
- `npm ci`, typecheck, build, all 110 sequential tests, the complete Chromium UI suite and VSIX packaging pass. Installed extension 0.19.10; merged the original PR commits without rewriting contributor authorship.

## Compact one-line English Arena HUD 0.19.9 â€” 2026-10-06

- CTX, 5h and Week remaining percentages, miniature pixel bars and compact reset countdowns stay on one line. Detailed English tooltips retain full countdown meaning. Unknown values remain unknown.
- Restored visible Auto, Duel and Rest buttons directly below the meters. Removed the header menu and Pause button/handler. Arena text, loading/error messages and accessible labels are English.
- Responsive browser assertions check a single meter row, no horizontal overflow and visible actions underneath on narrow and shallow panels. Shared real session usage still updates with the Pixel Pet view hidden.
- `npm ci`, typecheck, build, all 107 sequential tests and the complete Chromium UI suite pass. Re-recorded both Arena GIFs, packaged and installed extension 0.19.9.

## Shared Legendary Arena usage HUD 0.19.8 â€” 2026-10-06

- Replaced the action-button footer with remaining context, 5-hour quota and weekly quota plus reset countdowns. Unknown values remain unknown. Moved animation controls to the header menu, retaining automatic play by default.
- Arena subscribes to the companion's existing workspace/session observer. Arena visibility keeps that observer active independently of the Pixel Pet view. The webview receives only bounded numeric usage/reset fields; no transcript or tool contents. Disposal removes its subscription.
- Coverage checks three metrics, metadata sanitization, countdown boundaries, missing values, live updates with the companion hidden, controls, pause and responsive layout.
- `npm ci`, typecheck, build, all 107 sequential tests and the complete Chromium UI suite pass. Recorded both Arena GIFs with the new footer, packaged and installed extension 0.19.8.

## Magma blades and twin waterspouts 0.19.7 â€” 2026-10-06

- Groudon sends a glowing ground fracture towards Kyogre. Six successive jagged magma columns grow taller along the path, erupt beneath Kyogre and throw fragments, spray and steam. Kyogre recoils on contact. The standalone panel uses the same blade renderer.
- Kyogre raises two independently spiraling waterspouts, draws them together, and launches a fused rotating water drill into Groudon's articulated armor position. Contact creates a broad splash, steam, armor flash and recoil. The standalone panel shares the choreography.
- Regression covers column advance and target reach, separate funnels, convergence before launch, both facing directions, target-centered contact and absence of premature impact effects.
- `npm ci`, typecheck, build, all 104 sequential tests, the full Chromium UI suite and standalone recording checks pass. Re-recorded both Arena GIFs and both individual pet GIFs. Packaged and installed extension 0.19.7.

## Kyogre storm targets Groudon 0.19.6 â€” 2026-10-06

- Kyogre extends its cloud bank and rainfall across both pets; jagged lightning descends from directly above Groudon's articulated armor rather than striking near Kyogre. Contact adds sparks, a localized glow and recoil, synchronized with the same lightning clock.
- Shared storm rendering accepts an explicit target for Arena while the individual preview keeps its demonstration target. No new AI/host calls or timers are added.
- `npm ci`, typecheck, build, all 102 sequential tests and the complete Chromium UI suite pass. Targeted effect tests also pass after refining the continuous stepped lightning path.
- Regression verifies cloud/rain coverage of both pets, overhead bolt origin, armor endpoint and intervals without lightning. Arena captures the strike and asserts the hit reaction at its actual time.
- Re-recorded the duel, autonomous Arena and standalone Kyogre GIFs with the overhead storm. Packaged and installed extension 0.19.6; the complete UI suite and all 102 tests pass.

## Diagonal meteor rain and five water impacts 0.19.5 â€” 2026-10-06

- Fireballs leave the articulated mouth diagonally toward the opponent, cross above view, and descend diagonally into the target area. Trails follow both ascent and descent directions in Arena and the standalone Groudon panel.
- Five circular water emitters remain separate. Jets terminate at Groudon's armor; each impact produces water fragments, a pulsing splash and rising steam. Groudon recoils and shakes only after the jets arrive; effects stop during recovery.
- `npm ci`, typecheck, build, all 101 sequential tests and the complete Chromium UI suite pass.
- Re-recorded the standalone Groudon GIF and both Arena GIFs; final Chromium Arena checks pass after placing water contact on the armor.
- Regression coverage verifies ascent/descent direction, target landing, all five water lanes, impact timing, spray/steam and jet termination. Arena captures the actual impact and tests the recoil phase.

## Five circular Kyogre emitters 0.19.4 â€” 2026-10-06

- The five charging orbs retain their original circular perspective arrangement. At release the orbit stops at its existing phase; each jet originates at that exact orb position, with its own sheath, core and leading pulse. The orbs never transition into five rows.
- Updated the regression to require five distinct jets, original emitter positions on the ring, frozen release coordinates and both facing directions. The separate water/fire clash keeps its collision choreography.
- `npm ci`, typecheck, build, all 100 sequential tests and the complete Chromium UI suite pass. Production Arena frames visually confirm the circular emitter positions and five separate jets.
- Re-recorded the individual Kyogre GIF and both Arena GIFs with the corrected circular emitters.
- The Pinterest page could not be retrieved; implementation follows the user's attached image and explicit clarification that the five jets must launch from the existing circular orb positions.


## Water cannon, meteor shower and ground beam clash 0.19.3 â€” 2026-10-06

- Water cannon release now forms a continuous horizontal column from Kyogre's articulated mouth in Arena and the individual preview. The released stream no longer changes altitude or begins as a detached tail near the target.
- Groudon's Eruption launches eight staggered fireballs vertically from its articulated mouth. They travel above view then descend over the Kyogre area with hot cores, vertical trails and impact rings. The standalone volcanic panel uses the same meteor choreography.
- Added a fifth ground-pair turn: water and fire beams charge at both mouths, grow toward a common collision core, pulse and disperse in a shockwave. Manual ground sparring retains its independent clock alongside the aerial duel; autonomous Kyogre/Groudon rounds can also include this turn.
- Three regression tests cover horizontal release in both facing directions, mouth-origin ascent/target-area descent for all eight meteors, and beam endpoints/collision geometry. Updated controller and Chromium Arena checks exercise all five ground turns and capture the corrected effects.
- `npm ci`, typecheck, build, all 100 sequential tests and the complete Chromium UI suite pass.
- Re-recorded both production Arena GIFs (Duel and Auto) and individual Groudon/Kyogre GIFs. Final Arena Chromium checks also pass against the rebuilt runtime. No source sprites, AI calls or observer permissions were changed.

## Deoxys anatomy and ballistic aiming 0.19.2 â€” 2026-10-06

- Transformation now uses relaxed neutral joints, an unsquashed torso and the original source silhouette under the flash. Form changes discard the previous anatomy's joint pose. Skin weights protect the chest, normalize overlaps and taper shoulder/hip attachment; tentacle rotation is bounded to prevent mesh folding and stretching.
- A shared local ballistic shot locks actual origin and target at release. Manual Attack and autonomous Normal/Attack shots aim at Rayquaza's articulated head, rather than a fixed altitude or panel edge. Tails and overshoot follow the same two-dimensional direction, allowing subsequent dodges.
- Two regression tests cover stable transformation anatomy and target locking/overshoot/reset. `npm ci`, typecheck, build and all 97 sequential tests pass.
- The complete Chromium UI suite passes, including companion, hook/MCP, fallback/privacy and all individual legendary panels.
- Chromium source silhouette checks cover all four forms in idle, charge, release and transformation poses. Arena checks verify manual launch aim, a moving Rayquaza after launch, autonomous aiming, simultaneous ground battles, pause/rest and responsive layouts.
- Re-recorded the production duel GIF after the anatomy and aim corrections. Original source GIFs remain unchanged; no AI calls or host messages were introduced.

## Simultaneous legendary duels 0.19.1 â€” 2026-10-06

- Manual Duel now runs Rayquaza/Deoxys in the sky and Kyogre/Groudon below at the same time. The ground pair travels into its sea/land positions, faces its opponent and cycles four attack turns on an independent clock, including aerial meteorite interludes.
- Ground sprites and water/energy/blade/eruption effects reuse the existing production animations. Pause, Rest, Auto and responsive resize affect both pairs; no AI calls or host messages are introduced.
- `npm ci`, typecheck, build, all 95 sequential tests and the complete Chromium UI suite pass.
- Controller and Chromium Arena checks verify simultaneous non-sleeping actions, all four independent ground turns, the four aerial rounds, cancellation, pause and responsive layouts. Re-recorded the production duel GIF with all four pets fighting.

## Rayquaza vs Deoxys 0.19.0 â€” 2026-10-06

- Manual Duel now pairs Rayquaza with Deoxys, with smooth travel into an aerial lane. Groudon and Kyogre rest as spectators; autonomous play remains available.
- Four rounds cover Defense interception/reflection, Attack projectile and Rayquaza dodge, Speed pursuit, and opposing energy streams. Form changes still require a descending meteorite, landing, approach and physical contact before transformation.
- Added two deterministic controller tests covering all four rounds, contact-before-transformation, movement, spectators, resize and cancellation. `npm ci`, typecheck, build and all 95 tests pass sequentially.
- Targeted Chromium Arena checks pass for the four rounds, transformations, independent auto movement, pause, rest, narrow/wide resize and zero host/model messages.
- The full Chromium UI suite passes, including companion interactions, hooks/MCP subprocesses, fallback/privacy, compaction and all individual legendary panels.
- Recorded the complete 85-second production choreography in `docs/images/legendary-duel.gif`; the autonomous Arena GIF is retained separately. Reference artwork is not packaged.

## Deoxys 0.18.0 â€” 2026-10-06

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

# Verification â€” 2026-10-03

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

## Codex 0.11.4 child lifecycle recovery and installed version â€” 2026-10-05

- Confirmed two lingering agents in the user's other workspace had completed child turns but no corresponding parent SubagentStop. Replaying the parent hooks and reconciling workspace/parent-scoped child logs reduced active agents from 2 to 0 without changing parent tool counts.
- Child discovery validates the first session header and explicit parent-thread metadata. Forked logs may later contain copied parent session_meta records; child identity stays anchored to the validated header. Incremental readers must finish historical replay before their state is used. Scans and cached readers are bounded; no AI calls, transcript output or extra commands are introduced.
- Observed child tool modes now animate the corresponding agent mini near the main pet. Without observed tool details, it patrols neutrally. Labels distinguish Agent from individual tool workers. Real resumed child turns restart their worker lifecycle; terminal/aborted turns clear stale active counts so the idle habitat can resume.
- The bottom of each panel displays the version from the loaded VS Code ExtensionContext manifest. Each window must reload after installing an update.
- TypeScript, all 70 tests, build and VSIX packaging passed. Chromium host smoke passed, including a lost-Stop fixture repaired from a child log, resumed idle habitat, separate child/parent tool counts, and the exact version footer. VSIX 0.11.4 installed and confirmed in the extension inventory.

## Codex 0.11.3 portal colors by work type â€” 2026-10-05

- Read/Edit/Run/Search/Web/Delegate portals use green/gold/blue/orange/turquoise/purple respectively. Each worker keeps its entrance hue; normal runes and beam edges use a lighter shade of that hue. Failed observations use pink-red accents and pending results gray accents without replacing the work color.
- TypeScript, all 65 tests, build, packaging and Chromium host smoke passed. Re-recorded and visually inspected the README summoning GIF; installed VSIX 0.11.3. Animations remain local and hook trust is unchanged.

## Codex 0.11.2 unified mini summoning â€” 2026-10-05

- Removed the Codex webview's implicit `compose` subagent trail. Actual subagent lifecycle records now enter the same stable-ID sky-portal worker renderer as tools, preserving active-agent counts and the persistent local project Mini. Subagents do not suppress unrelated fallback wrapper workers.
- Completion-only observations and tools that finish during their entrance now finish materializing before result delivery. Failed-result soot and clickable signs stay hidden during summoning; cancellation cannot reveal an unmaterialized sprite.
- All 65 tests, TypeScript, build, VSIX packaging and Chromium host smoke passed. New regression cases cover stable subagent identities, portals before the first mini pixels, already-completed tools/agents, retained result delivery, and no legacy trail. The UI harness exercises native SubagentStart/Stop through one portal worker and checks the absence of a duplicate trail.
- Installed VSIX 0.11.2 and confirmed it with the VS Code extension inventory. Hook definitions and trust were not changed. Reload Window is required to apply the renderer in the existing VS Code window.

## Codex 0.11.1 buildings temporarily disabled â€” 2026-10-04

- Disabled workplace rendering and restored the ordinary shared meadow layout. The dormant artwork module remains available for future redesign. Task minis, summoning, result delivery, error inspection, pet interactions and full-width/compact-HUD behavior remain active. Chromium host smoke passed, including the disabled-building assertion.
- Removed building names from visible task badges/result cards and re-recorded the README worker GIF without buildings. Dependency installation, all 63 tests, TypeScript, build and packaging passed; the meadow screenshot was visually inspected. Hook definitions and trust remain unchanged.
- The UI harness now treats the order of concurrent Read/Edit/Run calls with identical timestamps as unspecified, while still checking all three modes and their independent lifecycles.

## Codex 0.11.0 responsive workshop village â€” 2026-10-04

- Replaced the small nine-pixel props with cohesive pixel architecture: a terracotta library with book windows and a door, a teal maker studio with an awning and workbench, a blue terminal pavilion with screen/server details, and a domed observatory. Signs and shared trim/shadow/path colors give each place a recognizable role.
- Scene widths 240+ show four buildings; 144â€“239 show three; 70â€“143 use compact stations; below 70 use one WORK lodge with three colored bays. Separate structures have non-overlapping bounds. Resizing updates live worker destinations while retaining their IDs and birth times.
- Landscaping moves the theme's static plants into available gaps and reserves the full layout's right skyline for the sun/moon. Original rocks remain in the foreground with unchanged obstacle coordinates, preserving leap behavior. Layout caching is bounded to eight widths per scene.
- Dependency installation, TypeScript, all 63 tests, build, packaging and Chromium host smoke passed. Added regressions cover all reflow boundaries, live worker resize, non-overlapping buildings, retained trees and unchanged obstacle navigation. Existing Direct hooks/fallback, privacy, quota, task-result delivery and local-only animation checks still pass.
- Visually inspected `dist/codex-wide-panel.png`, `dist/codex-sidebar.png`, `dist/codex-compact-workplaces.png`, `dist/codex-short-panel.png` and the production-module worker GIF. Hook definitions and trust records remain unchanged.

## Codex 0.10.1 permanent work buildings â€” 2026-10-04

- The library, writing desk and terminal now render as fixed background landmarks even with zero active tools. Wider scenes include the observatory. Buildings are painted before the main pet, so pets remain in front; No scene hides the landmarks. Worker completion no longer removes the buildings.
- Dependency installation, TypeScript, all 60 tests, build, VSIX packaging and Chromium host smoke passed. The UI checks idle buildings with a zero active-tool count, hides them with No scene, and retains existing task/result, privacy and narrow/ultrawide layout checks.
- Re-recorded the production-module worker GIF with permanent landmarks. `dist/codex-wide-panel.png` and the GIF cover image were visually inspected. Hook definitions and trust records remain unchanged.

## Codex 0.10.0 work zones, result delivery and full-width scenes â€” 2026-10-04

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

## Codex 0.2.3 PR review fixes â€” 2026-10-04

- Removed the VSCE packaging dependency and all ten `vsce-sign` packages that triggered Sourcery/Trivy unknown-license findings. Local VSIX packaging uses MIT-licensed `fflate` and an explicit asset list. No license metadata was falsified and no scanner exceptions were added.
- `npm audit` reports 0 vulnerabilities; the lockfile has no `vsce-sign` or `SEE LICENSE` entries.
- TypeScript, 24 tests and Chromium smoke pass. Regression tests cover VSIX metadata/contents/XML escaping, exclusion of repository secrets and incomplete archives, session rotation during discovery, failed MCP registration preserving hooks, and a second workspace clearing its own themeFile override after another window applied the same shared theme revision.
- Workspace theme application revisions are now stored in workspaceState rather than shared globalState. MCP registration completes before merged hooks are written. Removed session candidates are skipped when stat reports ENOENT.

## Codex 0.9.0 worker summoning and background processes â€” 2026-10-04

- Workers summon beside the current AI pet through pixel magic circles, orbiting lights and rising sparkles, then walk to nearby work spots. Stable IDs preserve position through parallel updates; the main pet no longer shifts to reserve a worker strip at the left edge. Completion has a short circle departure.
- Structured execution envelopes supply numeric background handles without retaining output or analyzing prose. Matching command exits or direct polls end each worker independently. Ordinary turn completion preserves known processes; interruption cancels the display. Quiet expired observations stay awaiting result rather than reporting confirmed live work.
- 54 tests cover actual wrapped execution outputs, independent process completion, late output, polling, hook/log deduplication, trust-independent metadata sanitization, stale results, summon pixels, placement, reordering, walking and narrow panels, alongside previous behavior. Chromium smoke additionally runs the bundled host and hook subprocesses through concurrent background launches and independent exits. Screenshots: `dist/codex-summoning.png`, `dist/codex-background-workers.png`.
- No model requests, additional AI agents, hook trust changes, installed OpenAI extension modifications or upstream sprite changes are introduced. Fallback still cannot know a nested task's start before the runtime emits an event or returns its background handle. Direct hooks remains the recommended source for timely lifecycle events.
- The installed runtime's read-only hooks/list check currently reports all 12 Pixel Pet hooks enabled and trusted with zero configuration errors. The actual observer events directory was empty during this inspection, so current IDE hook execution remains unverified. Trust configuration and adapter subprocess tests alone do not establish end-to-end IDE delivery.

## Codex 0.8.0 independent pet life and README GIFs â€” 2026-10-04

- Added two independent walkers with randomized solo actions and destinations. Invitations use a walking rendezvous; a scene starts on arrival, followed by a departure in opposite directions. Ordinary walking avoids clipping through the other pet. Manual Mini placement and viewport resizing stay bounded.
- Expanded the shared-theme local playlist to 20 distinct interactions, adding paper plane, fishing, magic portal, block tower, pillow fight, leaf boat and photo booth. Real AI activity and project checks retain priority; no observer, host/model requests or quota semantics changed.
- 47 tests cover separate positions and varied movement, bounded steps without teleporting, rendezvous/arrival/departure, work cancellation, placement/resizing, all 20 distinct pixel sequences and both slime/alien art, alongside the existing observer and project coverage. TypeScript, build/package and Chromium smoke check the real renderer, independent roaming, post-scene departure, work/approval/compaction/Rest/Wake, narrow panels and no extra host/model messages.
- The reproducible recorder uses the production habitat, interaction and pixel modules. The README life GIF has 400 frames at 10 fps (592Ã—198, 40 seconds); the 20-scene gallery has 76 frames (816Ã—654, 7.6 seconds). Both loop and are labeled Demo; no live logs, AI requests, upstream sprite changes or hook-trust changes are involved. Files: `docs/images/codex-pet-life.gif`, `docs/images/codex-pet-actions.gif`.

## Codex 0.7.0 autonomous pet interactions â€” 2026-10-04

- Added 13 distinct local choreographies using the existing theme sprites: picnic, catch, tag, peekaboo, seesaw, trampoline, disco, umbrella, bubbles, gift, tug of war, stargazing and high five. Feed and Play select separate scenes. A shuffled playlist covers all scenes before repeating.
- 43 tests cover idle timing, playlist diversity, immediate cancellation, explicit action replacement, distinct animated pixel sequences, bounded drawing, and both slime/alien themes, alongside existing observer and project-result coverage.
- Chromium smoke exercises the actual webview with a virtual clock: scenes start without clicks even past sleepAfter, Feed/Play paint different pixels, work/approval/compaction interrupt play, Rest pauses, Wake resumes, and a narrow panel fits. The isolated webview sends only its initial ready message; no task/model request is generated by play. The broader hook/MCP/project/worker/fallback suite remains included.
- Screenshot gallery: `dist/codex-interactions.png`; Feed: `dist/codex-feed.png`; autonomous narrow panel: `dist/codex-idle-interaction.png`. No upstream sprite files, hook trust or installed OpenAI extension code were changed.

## Codex 0.6.0 automatic project Mini â€” 2026-10-04

- Mini passively consumes structured Codex CommandExecution outcomes and VS Code check-task events; the Check button and task-execution handler were removed. Default checklists contain observed checks, with optional explicit required VS Code names.
- TypeScript, 40 tests and VSIX build/package pass. New regressions cover conservative single-command recognition, help/version/config/dry-run rejection, numeric exit metadata/privacy, automatic results, overlapping failure, edit invalidation, historical/untimed/cancelled results and out-of-order replay.
- Chromium smoke passes automatic Codex failure/pass/celebration, passive VS Code task results, code edits invalidating success, repeated polling not restoring stale success, and an out-of-workspace result being ignored. It verifies no Check button, zero task executions, no additional host/model requests, and unchanged quota.
- Check directories remain in the host, results reset on reload, unsupported commands remain unclassified, and successful observed checks do not imply every possible test was run. No hook trust or installed OpenAI code was changed. Screenshot: dist/codex-project-automatic.png.

## Codex 0.5.1 neutral project Mini â€” 2026-10-04

- Unverified project state renders no question mark or yellow status color. With no selected checks, the label is simply No checks selected. Error flags, verified check marks and evidence rules are preserved.
- TypeScript, 35 tests, build and VSIX packaging passed. Chromium smoke checks that the unverified Mini paints no question-mark pixels, alongside the existing project result and worker coverage.

## Codex 0.5.0 tool worker minis â€” 2026-10-04

- TypeScript and 35 tests pass. New regressions cover independent parallel IDs, stable births/departure, wrapper suppression, duplicate notifications, completed-only FileChange recovery, command argv, failure/interrupt, partial hook/log merging, stale expiration, privacy, distinct mini props and truthful overflow.
- Chromium smoke passes for three concurrent read/edit/run workers, independent completion and departure, actual hook subprocess children replacing their wrapper, explicit failed/stopped states, and a completed FileChange recovering the edit pose while the active counter stays zero. Eight simultaneous tools exercise six-worker overflow, the one-worker narrow layout, wrapping badges and showMinis without changing the active counter.
- Worker rendering sends no host/model requests and does not create subagents or change usage. The persistent project Mini and real subagent trail remain independent. Native events still require trust; no trust records or installed OpenAI code were modified. Completion-only log events cannot supply live nested start times.
- Screenshot: `dist/codex-parallel-workers.png`, visually inspected. Build/VSIX installation is local; these changes have not been committed or pushed.

## Codex 0.4.0 project Mini and meadow â€” 2026-10-04

- TypeScript, 29 tests, build, local VSIX packaging and Chromium host smoke passed. Project tests cover incomplete/missing/cancelled checks, code edits during/after verification, and overlapping checks preserving failures.
- Mini observes workspace Diagnostics and selected VS Code task process results. Zero diagnostics alone never means verified. No checks run automatically; Check shows a task picker and executes only the selected task. Ordinary Codex shell tools are not treated as project test results.
- UI smoke verifies reported errors, failed and successful task exits, edit invalidation, unchanged HUD/agent counts, and no task execution before the Check action. All animations/monitoring use local events; no chat client, AI/model calls or telemetry were added.
- Meadow uses an 11-row shaded sun with rays plus trees, flowers and grass. Shared upstream renderer and Alien artwork are unchanged. Exact old generated meadow upgrades; edited scenes/palettes and configured theme files are preserved.
- Screenshots: `dist/codex-project-verified.png`, `dist/codex-meadow.png`; visually inspected.

## Codex 0.3.1 shared-scene Mini companion â€” 2026-10-04

- Mini is composited directly into the main pixel canvas at the same ground level. Its accessible pointer/keyboard target follows the painted sprite; no separate yard or canvas remains.
- Mini represents the user; the main pet represents the observed AI session. Mini follows it, approaches it for Feed/Play, and the pair show affection while the AI pet keeps real-work priority.
- Chromium verifies dragging Mini away, moving it by keyboard, Play bringing it back beside the AI pet, rest/wake, and both in the shared scene. Privacy, HUD/counter invariants and live-tool priority checks still pass.

## Codex 0.3.0 local Mini playmate â€” 2026-10-04

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

- Rejected the previous redraw after comparing the supplied 128px GIF with official PokÃ©mon Mega Rayquaza artwork. The independent panel now plays the actual original 160 frames, with no anatomical redraw or mesh deformation. The incorrect five-action controls are removed; new faithful poses remain unfinished.
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
