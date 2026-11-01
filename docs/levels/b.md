# Levels B: World 2 (L6–L9) and World 4 (L15–L18)

Every level is checked by the route bot with the real physics: `npx tsx scripts/solve.ts 6 7 8 9 15 16 17 18`. Wrong approaches are checked in `tests/levels-b.test.ts`. Shared helpers live in `src/levels/lib-b.ts`.

| Level | Solver | Time | Crumbs | Respawns |
|---|---|---|---|---|
| L6 ארבע הספרות | WON | 28.1 s | 3 | 0 |
| L7 הגינה הנודדת | WON | 40.4 s | 3 | 0 |
| L8 שרשרת בין הספרות | WON | 21.6 s | 3 | 0 |
| L9 עולם בלי ספרה | WON | 10.9 s | 3 | 0 |
| L15 מסלול הלוויינים | WON | 27.7 s | 3 | 0 |
| L16 אור שהגיע באיחור | WON | 20.1 s | 3 | 0 |
| L17 מדרגות הגודל | WON | 57.4 s | 3 | 0 |
| L18 המסע הגדול | WON | 32.9 s | 3 | 0 |

---

## L6 · ארבע הספרות (`l06-four-spheres.ts`)

**What it teaches:** The four Earth spheres (גאוספרה, הידרוספרה, אטמוספרה, ביוספרה) and the יחסי גומלין between them. Module `grade-8/chapter-1/earth-system`.

**Misconception checked:** The spheres are separate things. In this level, each sphere opens the next. The sea (הידרוספרה) makes the clouds (אטמוספרה). Rock plus rain grows the forest (ביוספרה).

**Layout:** Earth, R=16, with four routes out of the hub.
- **East, rock:** steps g1–g3 and a peak at lon 12/19.5/27/35, with tops 0.8/1.6/2.4/3.2. The גאוספרה marker is on the peak.
- **South, sea:** ice floes f1–f3 lead to an islet at lat −49 with the הידרוספרה marker. The sea is a kill zone: `seaKill('sea', E, -35, 0, 13, 0.9)`.
- **North, clouds:** an updraft at lat 14 (power 16) and clouds c1–c3 (tops 4.0/5.2/6.4). They appear only after `hydro`. The אטמוספרה marker is on c3.
- **West, forest:** leaves l1–l3 and a canopy (top 4.0) on a trunk, plus a mushroom launcher (power 13). They grow only when `geo` and `atmo` are both found.

**Verified solution:** Peak, then floes to the islet, then the updraft to the clouds, then the mushroom launcher into the canopy, then the page at the hub.

**Crumbs:**
- above the peak (needs a jet puff)
- over the sea between the floes
- above the mushroom launcher

**Wrong approaches:**
- **Walking into the sea:** a "ספלאש!" toast and a respawn at the shore.
- **Looking for clouds before the sea:** the clouds aren't there yet.
- **Looking for the forest before rock and rain:** the forest doesn't grow.

---

## L7 · הגינה הנודדת (`l07-wandering-garden.ts`)

**What it teaches:** The conditions for life: air (אטמוספרה), liquid water (הידרוספרה), a pleasant temperature and soil. Earth is the only place in the Solar System where all four exist together. Modules `solar-system` and `earth-system`. The suit thermometer is on.

**Misconception checked:** "Any ground will do" and "the Moon, Mars and נוגה are like Earth."

**Layout:**
- Earth R=16, with three sample chunks (radius 6) reached by warp pads at the hub:
  - Moon at (−90, 30, −60)
  - Mars at (0, 40, −110)
  - נוגה at (90, 30, −60), with a cooling station
- On Earth:
  - a desert mesa at lon −36.5 (soil, no water)
  - an ice cap within 32° of the north pole
  - a riverbank at lon 36 (water + soil + air + warmth)

**Mechanic:** Carry the seed pod (E) and throw it (E).
- The pod is judged by `api.life()` where it lands.
- On the chunks, a pod thrown while standing there is judged immediately, because the weak pull would otherwise carry it off the chunk.
- On the ice cap, the level overrides the result to "too cold, the water is frozen."

**Verified solution:**
1. Crumb above the desert mesa (puff).
2. Mars and back.
3. Moon-rim crumb.
4. Ice-cap crumb.
5. Take the pod, throw it from the step beside the bank onto the bank: it blooms.
6. Take the page.

**Wrong approaches:** Each one wilts the pod: "פְסס… הזרע נבל. חסר כאן: …", naming what is missing. A new pod waits at the seed shed 1.6 s later.

| Where | What the toast names |
|---|---|
| Moon, Mars | אטמוספרה missing |
| נוגה | too hot |
| Desert | water (הידרוספרה) missing |
| Ice cap | too cold, water frozen |

Standing on the נוגה sample outside the cooling station overheats the suit.

---

## L8 · שרשרת בין הספרות (`l08-sphere-chain.ts`)

**What it teaches:** יחסי גומלין between the spheres, the human effect on them, and fixing it. Module `earth-system`.

**Misconception checked:** Changing one sphere doesn't affect the others. Here every fix ripples through the other spheres.

**Three problems:**
1. **The drained Hula.**
   - Pound the sluice: water returns, then lily pads and birds appear (they are platforms), leading to the observation cliff (top 3.3).
2. **The dust storm on the bare slope.**
   - A wind zone (power 30) blocks jumps until both saplings are planted.
   - Saplings go into the holes at (±5, −17), which sets `tree1`, `tree2`, then `trees`.
3. **The factory and sea rise.**
   - Without the solar switch (on the ridge, lon −48.5), the ice melts at t = 100/160/220 s (`SEA_AT`).
   - The sea floods the jetties in stages.
   - The ice-cap paint shrinks and the sea paint grows.
   - Pounding solar stops the melt.

**Verified solution:**
1. Sluice.
2. Saplings into both holes; the wind dies.
3. Terraces to the ridge, then solar.
4. Jetties to the islet (crumb).
5. Lily pads and bird to the cliff.
6. Page (`chain` = hula + trees + solar).

**Wrong approaches:**
- **Climbing the slope during the storm:** you get blown back (no `t2` landing).
- **Waiting too long:** the jetties go under water ("מפלס הים עלה…"). The high stones and the islet stay dry, so it can always be recovered.

---

## L9 · עולם בלי ספרה (`l09-missing-sphere.ts`)

**What it teaches:** A transfer level. Identify which sphere is missing from the evidence. `hideName`, `transfer`. Module `earth-system`.

**Misconception checked:** Guessing, or "always bring the same thing."

**The world:** "Dry" (R=14).
- It has air, rock and plants.
- Its riverbeds and lakebed are dry, and there are no clouds.
- Four capsules stand on stands, each marked with a sphere name:
  - atmo at (5, −16)
  - geo at (−9, 15)
  - bio at (11, 17)
  - hydro on the mesa at (−2, 37.5), reached by a step

**Altar:** Carry a capsule and throw it while standing on the altar. It counts within 3.6 of the altar top.

**Verified solution:** Collect the crumbs, bring the hydro capsule, then throw it on the altar.
- The riverbeds fill and the dust clears.
- `revealName('כדור הארץ, עם הידרוספרה')`.
- The page appears.

**Wrong approaches:** Each one does something silly for 3.5 s, then the capsule rolls home.

| Capsule | Flag | What happens |
|---|---|---|
| atmo | `gust` | a wind blast |
| geo | `rocks` | rocks pop up and launch you |
| bio | `wilted` | plants with no water wilt |

Bringing the nearest capsule (atmo) every time never wins. A capsule thrown from far away doesn't count.

---

## L15 · מסלול הלוויינים (`l15-satellite-orbit.ts`)

**What it teaches:** Communications, GPS and weather satellites, and פסולת חלל. Module `space-exploration`.

**`extraHe` (not in the Workbook):** more than 27,000 tracked pieces, about 28,000 km/h, Kessler syndrome.

**Misconception checked:** "Space is empty and safe" and "junk just floats away harmlessly."

**Layout:**
- Satellites float above a big Earth: comm at x=0, gps at x=13 with a mast, weather at x=33.
- A flat magnet-boot field (an invisible ring body) holds Nuri.
- Anything that falls enters a burn zone ("reentry", r=59 around the Earth).
- Between gps and weather is a mid platform with a wheel of three debris pieces (r 1.4, period 6). A fourth piece circles the mast.

**Verified solution:**
1. Crumb above comm (puff).
2. Over to gps; mast crumb (puff).
3. Stand in the centre of the mid platform.
4. Grab and throw each piece (3 burns sets `lane`).
5. Fetch the spare part from the GPS panel.
6. Cross to weather; crumb on the right panel.
7. Deliver the part (`fixed`).
8. Take the page.

**Wrong approaches:**
- **Standing in the debris path:** a bump, with a "בום!" toast at most every 3 s.
- **Dropping the part:** it burns and a new spare appears on the GPS satellite.
- **Falling:** a reentry toast and a respawn.

---

## L16 · אור שהגיע באיחור (`l16-late-light.ts`)

**What it teaches:** שנת אור, and that looking far away means looking into the past. Module `universe-structure`.

**Distances:** the Sun is 8 light-minutes away, Proxima more than 4 light-years, and a star in Andromeda 2.5 million light-years.

**Misconception checked:** "If I see a star, it exists now."

**Mechanic:** Three light bridges run from the stars to the observatory hub (2/4/7 tiles).
- A tile exists only while the light pulse passes over it.
- Speed C=3 units/s, a pulse every 6 s, each tile lit for 2.6 s.
- Warp pads fly out to each star. You ride the light home.
- The Andromeda star is already dead: a crystal and rock with a cloud. Reaching it gives a toast: "it's gone, yet its light is still travelling."

**Verified solution:**
1. Hub crumb (puff).
2. Out to Proxima and ride home (tile crumb, tap jump).
3. Out to Andromeda and ride home (tile crumb).
4. The "Andromeda star went out" answer pad sets `answered`.
5. The page appears at the hub.

**Wrong approaches:**
- **The Sun answer pad:** a "wrong" pad explains its light takes only 8 minutes, so we would know almost at once.
- **The Proxima answer pad:** explains 4+ years and invites you to fly out and see it is still there.
- **Missing a tile:** a fall into the void ("בלי אור אין לבנים!") and a respawn.

---

## L17 · מדרגות הגודל (`l17-scale-steps.ts`)

**What it teaches:** The size ladder: כוכב לכת, then מערכת כוכב, then גלקסיה, then צביר גלקסיות, then היקום. The Sun sits in an arm of שביל החלב, not at its centre. Module `universe-structure`.

**`extraHe`:** the Milky Way's diameter is about 100,000 light-years.

**Misconception checked:**
- Mixing up the order of sizes (galaxy vs. star system vs. cluster).
- "The Sun is at the centre of the galaxy."

**Layout:** Five stages, 120 units apart. Each ends in a deck of three size pads in shuffled order.
- Stage 1: a small planet.
- Stage 2: a star with two orbiting planets as moving platforms.
- Stage 3: a galaxy with a bulge and spiral-arm platforms.
- Stage 4: discs of a galaxy cluster.
- Stage 5: the universe, with the page.

**Stage 3 question:** "השמש במרכז הגלקסיה" (wrong) or "השמש בזרוע הגלקסיה" (warps to an arm and sets `sun-arm`). The galaxy-stage size pads wake only after the correct answer.

**Verified solution:** Climb each stage and ride the next-size pad. The crumbs need well-timed jumps, including riding the outer planet when it passes the deck.

**Wrong approaches:**
- **A smaller size:** "בוינג! קפצתם אחורה בסולם…" and a bounce to the stage start.
- **Skipping a size:** "וווּפּ! דילגתם על מדרגה…" and a bounce to the stage start.
- **The centre pad:** a wrong-pad explanation.

---

## L18 · המסע הגדול (`l18-grand-journey.ts`)

**What it teaches:** A final transfer level. Identify a world by what you feel there: jump height (gravity), heat (thermometer), air and ground. Module `solar-system`.

**Settings:** `noHints`, `hideName`, `transfer`, `thermo`. The jump meter shows "?".

**Misconception checked:**
- Telling worlds apart by their name label instead of by evidence.
- Remembering "always the same corner."

**Layout:** Four unlabeled mini-worlds (R=7) in a row, then home (Earth).

| Order | World | Marker pillar height | Notes |
|---|---|---|---|
| 1 | Moon | 5.2 | |
| 2 | נוגה | 1.0 | hot, cooling zone |
| 3 | Mars | 2.4 | |
| 4 | כספית | 2.4 | hot, cooling zone |

- Each pillar height is set so you can only reach the top with that world's jump.
- Touching the pillar marker wakes four name pads at the corners (±12, ±12).
- The correct corner is different on every world.

**Verified solution:** On each world, climb the pillar (crumbs above the Moon, Mars and כספית pillars, puff jumps), then ride the correct pad. At home, `revealName` and the page.

**Wrong approaches:**
- **A wrong name:** "פְּלוֹפּ! … זה לא X: …" describes what X is really like, then bounces you back to the landing spot.
- **The same corner every time:** fails on at least three worlds.
- **Before climbing the pillar:** the pads stay asleep.

---

## Engine notes found while building these

- The sky dome, air FX and ambient light follow `def.worldId`, not the body you stand on. This weakens the "sky" evidence on the L7 chunks and in L18.
- There is no per-zone temperature. The L7 ice cap uses a script override, and the thermometer still reads Earth values there.
- `usePad` events do not reach `script.event`. L16 reacts to its flag in `tick` instead.
- `vars` is not rendered, so the L8 sea rise uses flags, paint and boxes.
- The action key always throws; there is no gentle put-down.
- The bot treats "arrived" as horizontal distance only.
- Pickup takes the first prop in range, whatever the target.
- Fixed by the lead during this work: the cool/warm zone light crashed level load in `scene/world.ts`.
