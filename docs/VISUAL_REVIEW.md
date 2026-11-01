# Visual review: mockups vs the real game

The targets are the five ChatGPT image-generation mockups in `docs/visual-targets/` (prompts in `PROMPTS.md`). Actual
captures are real gameplay at 1280×720 in Chrome with WebGL, driven by the game's own input (the route bot presses the
same keys a player does). Captures live in the git-ignored `scratch/shots/` and are not committed.
`node scratch/shot.mjs <name> <level|map> [ms]` and `node tests/smoke.mjs` make them.

## 01 · First 30 seconds (Moon, level 1)

| | Target | Actual (`scratch/shots/l1-e.png`) | Action |
|---|---|---|---|
| Camera | Low, behind and to the side of Nuri; horizon at mid-frame; huge Earth in the sky | First pass looked down at a pillar with black sky and no Earth | Pitch 0.32 → 0.24, aim 2.6 m ahead and 0.9 m above Nuri; pull-back keyed to height above the last ground instead of planet altitude; Earth moved to lat 14, lon 70, 34° wide, so it hangs behind the crater rim from the first jump. **Fixed.** |
| Silhouettes | A wide crater cliff | A 4.6 m pillar | Rim widened to 11 m, ledge to 7 m, scattered rocks added. **Fixed.** |
| Nuri | Orange suit, glass bubble helmet, white backpack | Tripo Nuri (rigged), helmet painted and opaque | Clear helmet bubble parented to the head bone. **Fixed.** |
| HUD | Pause and mute top-left, title card with page icon and stars top-right, tall jump gauge on the left reading "פי 6", objective pill at the bottom | Same layout; the gauge reads "פי 3.4" after the first hop and "פי 6" at full height | Matches. |
| Star crumbs | A dotted arc of stars leading to the page | Separate glowing crumbs along the route, no dotted trail | Kept: the trail would show the route and remove the "how high can I jump here?" question. |
| Sky | Black sky, small bright Sun | Black sky (no air), Sun sized 1/AU | Matches. |

## 04 · Level select

| | Target | Actual (`scratch/shots/map5.png`) | Action |
|---|---|---|---|
| Layout | Solar system path from the Sun at the right toward the galaxy at the left; 4 world tabs; atlas counter; big "שחקו ▶"; round atlas button | Same | Matches. The mockup's node order is scrambled; ours follows `LEVELS.md`. |
| Badges | Number and stars under each world; Nuri standing on the current world | Badges floated above the worlds and hid Nuri | Badges moved under the worlds; Nuri stands on top of the current one. **Fixed.** |
| Sun | Fiery, textured, glowing | Flat yellow disc | Banded fire texture, slow spin, larger corona. **Fixed.** |
| Shvitton | The comet in mid-frame, mocking, holding a page | Cut off behind the tabs, face unlit | Moved into the upper middle with its own key light. **Fixed.** |
| Extra | — | "☄️ השביט היומי" button above the atlas button | Daily comet entry (not in the mockup). |

## 05 · Transfer pads

The mockup put a planet hologram above each answer pad (כספית, נוגה, מאדים, הירח). That turns "which world fits what
I felt?" into colour matching, so the pads show only the Hebrew name, a cyan charge ring and a neutral beam. The title
shows "???" and the jump gauge "?", as in the mockup.
