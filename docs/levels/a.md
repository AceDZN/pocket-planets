# Levels, set A (L2–L5, L10–L14)

Every route below is verified headless (`npx tsx scripts/solve.ts 2 3 4 5 10 11 12 13 14`). Each one wins with 3 crumbs and 0 respawns, and `tests/levels-a.test.ts` covers the wrong approaches. In the browser, each level also wins through `?level=N` with `__game.autoplay()`.

Shared helpers are in `src/levels/lib-a.ts`: `deco`, `at` (a surface Spot) and `wp` (a route waypoint, a V3).

| L | Solver time |
|---|---|
| 2 | 47.8 s |
| 3 | 18.3 s |
| 4 | 21.1 s |
| 5 | 26.5 s |
| 10 | 36.8 s |
| 11 | 45.3 s |
| 12 | 43.7 s |
| 13 | 27.7 s |
| 14 | 22.2 s |

---

## L2 · כספית, צד יום וצד לילה (`l02-mercury-day-night.ts`)

**Taught:** כספית has no air. The day side scorches and the night side freezes. Only the twilight band (the terminator) is livable. Shade counts as night.

**Misconception checked:** "the planet closest to the Sun is hot everywhere."

**Solution:**
1. Hop the scarp to the band.
2. Run along the band on rock tops, pausing in each rock's shadow.
3. Return round the north side.
4. Use a puff jump to the night pillar crumb.
5. Puff-jump onto the mesa and take the page.

**Wrong approaches:**
- Cutting straight across the day side: the suit meter overheats in about 6 s, then a respawn with a joke.
- Lingering on the night side: the suit freezes.
- Earth gravity: the scarp and mesa are out of reach, and the route fails (tested).

**NASA values (העשרה):** day about 430 °C, night about −180 °C, g about 0.38, a year is 88 days.

## L3 · נוגה הלוהטת (`l03-venus-greenhouse.ts`)

**Taught:** the thick greenhouse air keeps נוגה hot by day and night. Air also slows falls: terminal fall speed is low, so you glide.

**Misconception checked:** "the night side will be cool, like on כספית."

**Solution:**
1. Hop between cooling stations: over the wall, then up the vent plume (crumb).
2. Glide across the lava field (glide crumb) to the island.
3. Climb the stairs (crumb), take the second vent, and reach the cliff page.

**Wrong approaches:**
- Waiting for night far from a cool station: it still overheats (tested on the night side).
- Walking into the lava: a respawn.

**NASA values:** about 465 °C day and night, air about 90× ours, g about 0.9, a year is about 225 days.

## L4 · מאדים האדום (`l04-mars-red.ts`)

**Taught:** מאדים is a rocky planet with red dust and thin air. Gravity is about ⅓ of Earth's, so jumps are long. Polar ice. A giant volcano.

**Misconception checked:** "you jump the same everywhere."

**Solution:**
1. The rover crumb.
2. The pillar staircase through the dust storm (storm crumb).
3. Ice ledges (ice crumb).
4. A full jump to the volcano summit page.

**Wrong approaches:**
- Earth gravity: the pillars are out of reach (tested).
- The storm wind blows careless jumpers off the pillars.

**NASA values:** g about 0.38, Olympus Mons about 22 km, mean about −65 °C.

## L5 · ? (hidden: כספית) (`l05-where-did-i-land.ts`)

This is a transfer level.

**Taught:** identify a world from evidence:
- the jump (g about 0.38)
- day and night temperatures (a probe on each side)
- the sky (no air, a big Sun)

**Misconception checked:** "same jump means same world." כספית and מאדים share g, so jump height alone cannot decide.

**Solution:**
1. Touch all three probes: day, night, and the mast. Together they set `evidence`.
2. Then take the כספית pad.

**Wrong approaches:**
- מאדים, הירח and נוגה pads: each gives a funny `explainHe` toast, counts as a wrong pad, and hops you back to the landing (tested).
- The pads are inert before the evidence is gathered (tested).

**NASA values:** g of כספית and מאדים about 0.38. From כספית the Sun looks about 2.5× larger.

## L10 · חגורת האסטרואידים (`l10-asteroid-belt.ts`)

**Taught:**
- The belt lies between מאדים and צדק (both shown in the sky).
- Tiny bodies have tiny gravity.
- Gravity pulls toward the nearest body.

**Misconception checked:** "a bigger jump is always better." A full jump at nothing flies off into space.

**Solution:**
1. Tap-jump to the crumb above the first rock.
2. Tap-hop rock to rock from the facing side.
3. Ride the bobbing rock's cap into its crumb.
4. Hop on to the big rock: a full-jump crumb, then the page.

**Wrong approaches:**
- A full jump flings you away, giving a "lost in space" respawn.
- Earth gravity: the tap hops can't cross (tested).

**NASA values:** real km-scale asteroid gravity is thousands of times weaker. The game floors it (noted in `extraHe`).

## L11 · צדק בלי קרקע (`l11-jupiter-no-ground.ts`)

**Taught:**
- צדק is a gas giant with no ground.
- Its moons are where you can stand.
- Under the ice of אירופה lies a liquid ocean.

**Misconception checked:** "every planet has a surface to land on."

**Solution:**
1. The Io plume crumb.
2. A full jump to אירופה, then a side trip to the גנימד ledge crumb.
3. Back to the אירופה spire crumb.
4. Ground-pound the ice lid to crack it and reveal the ocean, then take the page in the crack.
5. Use warm stations along the way.

**Wrong approaches:**
- A missed moon jump falls into צדק's clouds, giving a cloud-fall respawn (tested).
- Loitering away from heat freezes the suit.

**NASA values:** g at the cloud tops about 2.5, about −110 °C. Io's volcanoes. גנימד is the largest moon.

## L12 · טבעות שבתאי (`l12-saturn-rings.ts`)

**Taught:**
- Rings are chunks of ice and rock in one thin plane.
- שבתאי is gas.
- Water bursts from אנצלדוס.

**Misconception checked:** "rings are a solid disc" and "you can land on שבתאי."

**Solution:**
1. The inner-edge crumb.
2. Tap-hop chunk to chunk outward (a high crumb over k4).
3. Reach אנצלדוס and ride the geyser through its crumb to the page.

**Wrong approaches:**
- Overshooting inward past the ring edge: a cloud-fall into שבתאי (tested).
- Falling through a gap only bobs you back to the plane.
- It is cold: heaters sit on every chunk.

**NASA values:** rings about 280,000 km wide but usually under 1 km thick. 9.5 AU, a year is 29.5 years.

## L13 · הקרים והרחוקים (`l13-cold-and-far.ts`)

**Taught:** the farthest planets are cold, dim, have long years, and are gas giants.

**Misconception checked:** "far planets are just smaller copies of ours."

**Solution:**
1. A dash to the night-side crumb on מירנדה.
2. Heater, then climb the ice cliff (crumb).
3. The pad to טריטון.
4. Ride the nitrogen geyser through its crumb to the page.

**Wrong approaches:**
- Away from heaters the suit freezes in about 5 s (tested).
- Jumping off a moon's underside: a cloud-fall into אורנוס or נפטון.

**NASA values:** a year is about 84 years on אורנוס and about 165 on נפטון. Clouds about −200 °C. אורנוס spins on its side.

## L14 · סלעי או גזי? (`l14-rocky-or-gas.ts`)

This is a transfer level.

**Taught:**
- The inner planets are rocky and have ground.
- The outer planets are gas and have none.
- Predict the ground from distance to the Sun.

**Misconception checked:** "every planet has ground," and its mirror, "big ones are just big rocks."

**How it works:**
- A station sends you to מאדים, שבתאי, נפטון and כספית, in that mixed order.
- Each round shows two pads:
  - **מגפיים** clears flag `skimmer`.
  - **רחפן עננים** sets `skimmer`, which makes the gas cloud deck solid.
- Touching the world's beacon ends the round and hops you home.

**Solution:**
1. Mast crumb.
2. Boots to מאדים (high-leap crumb).
3. Skimmer to שבתאי (cloud-deck crumb).
4. Skimmer to נפטון.
5. Boots to כספית (twilight landing).
6. Take the page atop the station.

**Wrong approaches:**
- Boots onto a gas giant: a cloud-fall and a joke, then back to the station; the same round repeats (tested).
- The skimmer onto rock: "בונק!", a bump effect, a respawn count, then back to the station (tested).
- Strategies that cannot win (tested): always boots, always skimmer, boots/skimmer alternating, and skimmer/boots alternating.
- The page stays locked until all four worlds are done.

**NASA values:** no solid surface on שבתאי or נפטון: gas grows denser and hotter with depth. The skimmer is a game invention (stated in `extraHe`).
