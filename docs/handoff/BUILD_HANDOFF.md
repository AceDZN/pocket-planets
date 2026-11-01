# Pocket Planets · כוכבים בכיס — build handoff

Read `../COMMON.md` (and the round-1 COMMON it points to) first. Repo `/Users/acedzn/dev/AceDZN-exp/pocket-planets`, GitHub AceDZN/pocket-planets, dev port 5245, preview 4245.

## The pitch

A bright, bouncy **3D collect-a-thon platformer across a miniature solar system**, with the feel of the great planetoid platformers: run around tiny round worlds with their own gravity, long jumps, a ground-pound, a one-charge jet puff, coins and secrets, chunky camera and juice. The map's strongest blend this round is A Hat in Time × Outer Wilds (density 0.621, gate passed). Take the *feel*: a playful 3D platformer where each world's physics and sky are different and the differences are the lesson. Don't recreate either game: no copied characters, hats, time pieces, time loops, ships or level layouts.

**Story.** A clumsy comet smashed the school planetarium's pocket solar system and scattered its *atlas pages* (דפי האטלס). You're Nuri (נורי), a small rigged explorer with a too-big helmet, hopping from world to world to win the pages back. Each page you earn fills in a real fact about that world in the in-game atlas, written from what you just experienced.

**What you learn by playing (grade 8, chapter 1):**
- **Gravity holds the system, and it differs per world:** your jump arc, fall speed and how far you can throw a crate change with the world. On the Moon you sail; on Mars you float; on a heavy world you barely hop. Level designs need you to *use* the difference (a gap you can only clear on a low-gravity world, a crate that's light enough to carry only there).
- **Rocky vs gas planets, and why they sit where they do:** the inner four have ground; Jupiter, Saturn, Uranus and Neptune have no surface, so you platform on their moons, ring chunks and floating cloud-ice, and falling "into" a giant is a funny, safe fall through endless cloud back to a checkpoint.
- **Distance from the Sun, heat and light:** the Sun's disc in the sky shrinks world by world, and so does the light. Mercury's day side scorches and its night side freezes; Venus is the hottest because of its thick greenhouse air, not because it's nearest; the outer worlds are dim and icy.
- **Conditions for life (water, air, temperature) and Earth's four spheres** (אטמוספרה, הידרוספרה, ליתוספרה, ביוספרה): a seed pod you carry blooms only where all of them come together.
- **Space exploration and debris:** an orbit level of satellites (weather, GPS, communication) and the space junk around them.
- **Universe structure and light-years:** the last world steps out to stars, the galaxy and galaxy clusters; distant beacons blink late because their light took time to arrive, so a star you see may no longer exist.

Check every claim against the module snapshots in `reports/geography-games-claude-2026-11-01/curriculum/grade-8_chapter-1_*.md` (earth-system, universe-structure, solar-system, space-exploration). **Numbers that aren't in Workbook (exact gravity ratios, temperatures, day lengths) may drive the physics, but in the atlas they're labeled העשרה.** Use real values from NASA fact sheets, rounded, and record the source in `CURRICULUM.md`.

## Not like (check before each world)

| Existing | Its verb | Pocket Planets instead |
|---|---|---|
| OrbitalSpeedExplorer | drag a planet's distance, race one orbit | planets never move under the player's hand; you never set an orbit |
| CosmicScaleZoomExplorer | a zoom slider and a size-ladder quiz | the scale is walked and jumped, one step per level, no slider |
| KesslerOrbitLab | press "launch satellite", watch collisions | you platform through a debris field and clear a lane; you never launch |
| SphereChainReactionLab | pick a scenario, press "run the chain" | you carry a seed pod that needs every sphere present |
| Tilt World | sleep hours, dated train ticket, photograph the sky | no time skipping or photo shots; time runs normally |
| Rift Runner | portal puzzle rooms | no portals; the travel between worlds is a short launch-pad hop cinematic |
| Halfpipe Joule, Slope Sled | skating ramps, sledding a slope | platforming jumps, not riding |

## Worlds and levels (18)

Each world: 3–4 levels that introduce one idea each, then a **transfer level**. A level is a small round world (or a cluster of ring chunks or moons) with a main page and 3 bonus "star crumbs" for stars.

**World 1: the rocky neighbours (העולמות הסלעיים)**
1. **ירח הקפיצות** (the Moon): tutorial. Huge floaty jumps, black sky with no air, craters and silence (sound muffles). Reach a page on a crater rim you can only reach with Moon-strength jumps.
2. **מרקורי, צד יום וצד לילה** (Mercury): the day side is too hot to stand on (boots smoke), the night side freezes; you run along the narrow twilight band and use shade.
3. **נוגה הלוהטת** (Venus): thick orange clouds and greenhouse heat; the closer planet Mercury was *not* this hot. Cool-down pockets and pressure vents.
4. **מאדים האדום** (Mars): red dust, low gravity, a giant volcano climb and a dust storm that hides the route.
5. **Transfer: איפה נחתתי?** You land on an unnamed rocky world. Work out which one from the evidence you can feel and see (jump height, Sun size, heat, sky) and take the matching launch pad. The wrong pad drops you somewhere funny and you retry.

**World 2: Earth, the one with everything (כדור הארץ)**
6. **ארבע הספרות** : a guided tour that crosses rock, ocean, air and living layers of a tiny Earth; each sphere opens a route.
7. **הגינה הנודדת**: carry the seed pod; it wilts on worlds without water, air or a mild temperature, and blooms only on Earth. Bring a pod from World 1 to show why the others fail.
8. **שרשרת בין הספרות**: one change in one sphere changes another (melting ice raises the sea and floods low platforms; a forest stops a dust storm). Uses the module's own examples, such as draining the Hula.
9. **Transfer: עולם בלי ספרה**: a world missing one sphere; find which and why life can't hold there.

**World 3: the giants and their moons (הענקים)**
10. **חגורת האסטרואידים**: hop drifting rocks between Mars and Jupiter.
11. **צדק בלי קרקע** (Jupiter): there's nothing to stand on; platform across its moons (an icy one with an ocean underneath) and laugh at the endless fall into the clouds.
12. **טבעות שבתאי** (Saturn): ring-hopping on chunks of ice and rock.
13. **הקרים והרחוקים** (Uranus and Neptune): dim light and deep cold; a world so far that its year feels endless in the atlas.
14. **Transfer: סלעי או גזי?** A mixed run where you must predict before each launch whether there will be ground, and choose your landing gear (boots or cloud-skimmer) accordingly.

**World 4: out past the planets (אל היקום)**
15. **מסלול הלוויינים**: Earth orbit, satellites that matter to everyday life, and space debris; clear a safe lane and fix a weather satellite.
16. **אור שהגיע באיחור**: star beacons light your path but blink late; work out which star you see is "old light".
17. **מדרגות הגודל**: step out from the solar system to the galaxy and to a cluster, one platforming step per scale.
18. **Final transfer: המסע הגדול**: no hints; a remixed tour where the worlds are unlabeled and shuffled, and you rebuild the atlas from what each world feels like.

After the campaign: **daily comet runs** (a solver-verified remix of three worlds with a "guess the world" pad) for replay.

## Look and feel

Saturated toy-diorama planets with strong rim light; each world has its own sky (black Moon sky, orange Venus haze, pink Mars dusk, banded Jupiter filling the horizon). The Sun's disc is the constant reference in the sky and visibly shrinks as you go out. Camera: classic third-person platformer with a soft follow and planet-up orientation. HUD in Hebrew RTL: atlas pages, star crumbs, a small "gravity feel" indicator you *learn* to read, and the world name only after you've identified it in transfer levels.

**Tripo:** Nuri (rigged humanoid: idle, run, jump, land, ground-pound, cheer, shiver, overheat), the comet villain with a goofy face, a launch pad, satellites, a rover, crystals and props. Planets, rings, gravity fields, the Sun's apparent size and all physics values are procedural and authoritative, never a mesh.

## Tech notes

Spherical gravity per world (gravity toward the planetoid centre; on ring chunks, toward the ring plane) in a pure TypeScript physics module with tests for jump height ratios between worlds. Coyote time, jump buffering, variable jump height, a forgiving camera, touch controls (stick + jump + action) for phones. `render_game_to_text()` reports the world, gravity factor, player state, collected pages and objective.
