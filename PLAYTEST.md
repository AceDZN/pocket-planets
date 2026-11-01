# Playtest

What was verified, by whom, and what is still known to be rough. Captures and scripts live in the git-ignored
`scratch/` (`scratch/shots/`, `scratch/playtest/`) and are not committed.

## How it was tested

- **Automated, every commit.** `npm test` (80 tests): pure physics and climate, every level's route won by the bot
  through the game's own `Input` with 3/3 star crumbs and no respawn, daily-comet fairness over 60 days, the host
  bridge order, and the playtest regressions in `tests/playtest.test.ts` (no beeline shortcut on the puzzle levels,
  guessing costs a crumb, the suit waits while the intro is read).
- **Browser smoke run.** `node tests/smoke.mjs` plays all 18 levels in real Chrome with WebGL on a production build,
  fails on any page error or HTTP 4xx/5xx, and captures a frame per level. Last run: all 18 won, 3/3 crumbs,
  58–60 fps at 1280×720.
- **Workbook embed.** `npm run embed` loads the build in an iframe host: `ready` before `level-start`,
  `level-complete` only on a real win, nothing posted standalone or in the daily comet.
- **Independent playtester.** A separate agent played the stable build with real keyboard input (its own
  camera-relative WASD controller, Space, Shift, E), tried constant strategies on every level (hold W + full jump
  with jet, hold W + tap, hold W only, 40 s each), brute-forced every answer level, and reviewed all Hebrew text
  against the Workbook pages in `docs/curriculum/`.

## Playtest findings and what happened

No blockers and no softlocks: every death or wrong answer returned to a checkpoint.

| # | Finding | Status |
|---|---|---|
| 1 | Answer levels (L5, L9, L14, L17, L18) could be won by trying every pad, capsule or gear, at no cost | **Fixed.** A wrong answer now has Shvitton snatch the newest star crumb back to its spot (`wrongAnswer` in `src/core/game.ts`), so guessing scores lower and takes longer than reading the evidence. Still funny, still recoverable. |
| 2 | L1 can be won with one running jump from the spawn | **Kept, documented.** On the 14 m Moon a running jump gains height from the curvature; raising the rim only rewards a longer run-up and broke the ledge route. L1 is the "פי 6" wow moment; two of its crumbs still need the ledge and the jet. |
| 3 | L2 won by holding W and jumping: the twilight band ran straight to the page | **Fixed.** The page now waits on the day side under a high Sun, behind four shade rocks, and the suit heats faster there (`heatRate`). Shade is mild, not night-cold. Running straight at it overheats; the rock-to-shade route wins. |
| 4 | L7 won by throwing the pod at the riverbank from the spawn | **Fixed.** The pod "wants to compare": it blooms only after it has been tried in two other places (desert, ice cap, Moon, Mars or Venus samples). |
| 5 | L16 answered from the spawn; the toast stated "the star is gone" as fact | **Fixed.** Answer pads light up after riding the light home from two stars. The toast now says that in reality we cannot know whether so distant a star still exists. |
| 6 | "Pound with ⬇" is wrong on a keyboard (⬇ / S run backwards) | **Fixed.** L8 and L11 text and the L11 sign say Shift (⬇ only for the touch button). |
| 7 | The jump gauge number followed how long Space was held | **Fixed.** The number is now the world's full-jump ratio (a reading of gravity); the tube still shows the jump actually made. |
| 8 | L7 pod told Venus and Mars "there is no atmosphere", and the meadow "no soil" | **Fixed.** Workbook's three conditions only (atmosphere that supports life, liquid water, suitable temperature); the air reason names thick-but-unbreathable (Venus) and too thin (Mars). |
| 9 | L18: same sky everywhere, Mars "red ground" clue not visible | **Fixed.** Sky, Sun size and air follow the world Nuri stands on; the Mars clue now names thin air, pink sky and a smaller Sun. Mercury and Mars still share a pillar height on purpose (same gravity): heat and air tell them apart. |
| 10 | L11–L13 froze Nuri while the intro was still on screen | **Fixed.** The suit holds steady until the first move or jump at the landing spot. |
| 11 | Daily comet leaked the answer on the L12 stage (names of nearby worlds) | **Fixed.** Signs are scrubbed too, and any level whose scrubbed text still names a world (L7, L11–L14) is left out of the daily pool. |
| 12 | Game mechanics stated as physics (ring-plane gravity, "weak gravity" in orbit), map path read as distance order | **Fixed.** L12 says "in this game"; boot stages say the magnet boots lost grip; the map notes the path is level order, not distance from the Sun. |
| 13 | NASA numbers outside העשרה; Workbook facts inside it | **Fixed.** L3/L5 toasts and signs use words, not °C; the HUD thermometer is labelled העשרה; L15 debris facts (in Workbook) moved into the atlas text; the Europa ocean moved into העשרה. |

Minor fixes from the same pass: Esc closes the pause menu after clicking a toggle; L17 "קטנה" agreement; L16 "כבתה";
the daily scrub writes "מהעולם הזה" and the feedback "בירח"/"לירח"; L5 Moon pad "יותר מפי 2"; L5 intro no longer
narrows the answer to Mars or Mercury; Workbook spelling אנצ׳לדוס; L8 "the ice on land" melts into the sea.

## Known limits

- **Running jumps on tiny worlds go higher than the "פי N" number.** That is the curvature of a toy planet, not
  gravity; the gauge number stays the gravity reading.
- **L3, L4 and L10 can be crossed by running straight at the page.** Their stations, pillars and rocks lie on that
  line, so the straight run still meets the mechanic, but it is shorter than the authored route.
- **Fixed world order in L18.** Replays can be memorised; the first play cannot.
- **Intro card.** It covers Nuri for the first seconds of a level and fades on the first jump.
- **Labels can overlap** at the L16 hub and the L5 launch sign on narrow screens.
- **Scale is not to scale.** Earth fills 36° of the L1 sky (real: about 2°) and the L16 bridges are 2, 4 and 7
  tiles for 8 light-minutes, 4 light-years and 2.5 million light-years. The atlas text gives the real numbers.
- **Not tested on a real phone or tablet.** Touch layout was checked in Chrome's phone emulation (landscape).
- **Engine items left open:** grip on very small bodies, carrying by moving platforms, per-zone temperature, gentle
  put-down and pickup targeting.
