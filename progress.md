# Progress

Build log for Pocket Planets (grade 8 geography, chapter 1). Newest first.

## Repo

Public at https://github.com/AceDZN/pocket-planets, branch `main`.

## 1 Nov 2026

- **Independent playtest** (see `PLAYTEST.md`): 13 majors, no blockers. Fixed: guessing an answer now costs the
  newest star crumb (Shvitton snatches it back); the jump gauge number reads the world's full jump, not how long
  Space was held; the suit waits while the intro is read; L2's page moved under the high Sun behind shade rocks
  (faster heating there, mild shade); L7's pod compares two places before it blooms and uses Workbook's three
  conditions for life; L16's answer pads open after two light rides; pound text says Shift; the daily comet scrubs
  signs and skips levels that still name a world; NASA numbers labelled העשרה. Regression tests in
  `tests/playtest.test.ts` (80 tests in all).
- **Per-world sky.** Sky, Sun size and air follow the world Nuri stands on (L7 samples, L14 stops, L18 mini-worlds);
  during a long flight the level's own sky returns. The camera pulls in when a hill or ledge would hide Nuri.

- **Daily comet (השביט היומי).** Replay mode: three authored worlds a day, picked by a date seed so a class shares a
  run. The world's name and the jump number are hidden, and the world's name is scrubbed from objective and hints.
  After each page the player names the world from three options. Distractors must differ in something you can feel
  (jump height ×1.35, Sun size ×1.8, or air), so the guess is always fair. A wrong guess explains the felt difference
  and stays retryable. Daily levels post nothing to the Workbook host and save no atlas pages. Tests cover 60 days.
- **Tripo models integrated.** Nuri (Mixamo rig, 11 clips) holds the take-off frame of Tripo's multi-hop jump clip,
  switches to the flailing `scared` loop on falls over 1.6 s, slams with `pound` from 0.55 s so the impact meets the
  ground, and wears a clear bubble on the head bone (the Tripo helmet is painted). Rigged models never show a T-pose
  (they start in idle). `crystal` and `satellite_gps` alias the shared files.
- **Camera matched to mockup 01.** Lower pitch, aim ahead and above Nuri so the horizon and sky sit in frame. Pull-back
  follows height above the last ground, not altitude over the planet, so standing on a tall ledge no longer zooms out.
  L1's Earth now hangs behind the crater rim from the first jump; the rim is a wide cliff, not a pillar.
- **Answer pads lost the planet hologram** (mockup 05 had them): it turned "which world fits these clues" into colour
  matching. Pads show the Hebrew name and a neutral beam.
- **Fixes:** banded-texture index went negative for some seeds (map crashed); pause-on-blur only when the document is
  hidden; HUD pause/mute order under RTL.
- **Crew.** Visual/Chrome builder made 5 mockups (ChatGPT image gen in the user's Chrome) and 8 Tripo models within
  budget (8/8 generations, 3/3 rig and animation jobs, 300 credits). Level designers A (L2–5, L10–14) and B (L6–9,
  L15–18) author levels in parallel on the same engine; an independent playtester follows.
- **Engine.** Pure, deterministic core (`src/core`, no Three.js): spherical gravity to the nearest body, ring planes,
  gas bodies without surface, oriented boxes, balls, zones, props, coyote time, jump buffer, variable jump, one jet
  puff, ground pound, carry and throw with weight = mass × g. Suit meter from Sun angle and shade. Route bot replays
  each level through the same `Input` the keyboard feeds; every level's route must win in tests.

## Decisions

- **One take-off speed on every world** (apex = Earth apex ÷ g). That makes the jump gauge a direct reading of relative
  gravity, and כספית = מאדים in jump height, so level 5 can't be solved by jump height alone.
- **Tiny bodies use a gameplay gravity floor** (0.08 g) and say so in the atlas, rather than letting Nuri drift off.
- **Values not in Workbook are labelled העשרה.** Workbook text is the source of truth for terms.
- **No duplicate core verbs** with the other geography games (see the "Not like" table in `GAME_IDENTITY.md`).
- **No "wrong answer" popups.** Every mistake has a physical, funny consequence and a way back.
