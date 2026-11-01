# כוכבים בכיס · Pocket Planets

A Hebrew 3D platformer across a toy-sized solar system, for grade 8 geography (chapter 1: the universe and the solar
system). Shvitton the comet smashed the planetarium and scattered the pages of Nuri's atlas. Nuri jumps across tiny
round worlds to win them back, and every world feels different: the same legs jump six times higher on the Moon, the
day side of Mercury cooks the suit while its night side freezes it, Jupiter has no ground to land on, and the Sun shrinks
as you travel out.

Three.js + TypeScript + Vite. Fully static, no backend, progress in `localStorage`.

## Run

```bash
npm install
```

```bash
npm run dev
```

The dev server is on http://localhost:5245 (`strictPort`). `npm run preview` serves a build on port 4245.

```bash
npm test
```

```bash
npm run build
```

`npm test` runs the physics, climate, host, daily-comet and level tests. The level tests replay every level's route
through the game's own input and real physics. `npx tsx scripts/solve.ts [n…]` prints the same routes level by level.
`npm run embed` (dev server running) checks the Workbook host bridge in a real iframe.

Deep link: `?level=N` (1–18) opens an authored level directly.

## Controls

| | Keyboard | Touch |
|---|---|---|
| Run | Arrows / WASD | Left stick |
| Jump (hold for higher) | Space | ⤒ button |
| Jet puff (once, in the air) | Space again | ⤒ again |
| Ground pound | Shift / X | ⬇ button |
| Pick up / throw / use | E / Enter | ✋ button |
| Camera | Mouse drag | Drag the right side |
| Hint | H | 💡 |
| Atlas | Tab / B | 📖 |
| Pause | Esc / P | ⏸ |
| Mute | M | 🔊 |
| Restart | R | (pause menu) |

The pause menu has mute and reduced-motion toggles. Reduced motion is on by default when the system asks for it.

## What's in it

- **18 authored levels in 4 worlds** (rocky worlds, Earth's four spheres, the giants, out to the universe), each a
  page of the atlas. A transfer level closes each world, and the finale has no hints.
- **Physics as the lesson:** one take-off speed everywhere, so apex height is Earth height ÷ g. Air changes falling
  (none, thin, thick). The Sun's apparent size is 1/distance. The suit meter shows heat and cold from the Sun angle and
  shade; Mercury's twilight band is the only safe road. Gas giants have no surface: falling in is a cloud-fall respawn.
- **Jump gauge** reading "פי X" against Earth. In mystery and transfer levels it shows "?" and you reason from feel.
- **Daily comet (השביט היומי):** three worlds a day, chosen by date (the whole class gets the same run), with names
  and numbers hidden. After each page you name the world. A wrong guess gets Shvitton's comic explanation of what that
  world would have felt like, and you try again. Score is out of 12, with a day streak.
- **No "wrong" popups.** Mistakes are funny and recoverable: cloud-falls, smoking boots, frozen helmets, detours.
- **Tripo models** (Nuri rigged with 11 clips, comet, launch pad, satellite, rover, seed pod, crystals, debris) with
  procedural fallbacks. See `ASSETS.md`.
- **Workbook host bridge** (`src/host.ts`), `?level=N`, relative asset paths, `workbook/` catalog files.

Planned, not built: a crate and an atlas-book model (the Tripo generation budget ran out), a teacher view of the
learning log, and more daily-comet remixes beyond relabelling authored worlds.

## Docs

- `GAME_IDENTITY.md`: story, first 30 seconds, controls, look, the "Not like" table
- `LEVELS.md`: every level's idea, layout and route
- `CURRICULUM.md`: level → Workbook module, terms, misconceptions, sources
- `PLAYTEST.md`: what was verified and known limits
- `docs/VISUAL_REVIEW.md`: mockups vs real captures
- `ASSETS.md`: models, prompts, licences
- `progress.md`: build log and decisions

## Deploy to Vercel

It's a static Vite site, so no config is needed:

1. Import `AceDZN/pocket-planets` in Vercel (Framework preset: **Vite**).
2. Build command `npm run build`, output directory `dist`.
3. Deploy. Assets use relative paths (`base: './'`), so the build also works from a sub-path or a CDN folder.

Or from the CLI:

```bash
npx vercel --prod
```

The Workbook site (geography-games.workbook.co.il) embeds the build from its own CDN; that release is done by the
Workbook planning lead, not from this repo.
