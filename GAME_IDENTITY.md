# Pocket Planets · כוכבים בכיס — game identity

A bright, bouncy 3D collect-a-thon platformer across a miniature solar system, for grade 8 geography (chapter 1, היקום ומערכת השמש). You run around tiny round worlds that each have their own gravity, air, heat and sky. The differences between worlds are the puzzle: a gap you can only clear on the Moon, a night side that freezes you on כספית but not on נוגה, a seed pod that blooms only where all four spheres meet, a gas giant you can't stand on.

## Story

A clumsy comet, **שביטון** (Shvitón, a goofy rock-and-ice ball with a runny-nose tail), crashed through the school planetarium's pocket solar system and scattered its **atlas pages** (דפי האטלס) across the worlds. You play **נורי** (Nuri), a small explorer in an orange suit and a too-big glass helmet. Each world holds one page; earning it fills in that world's atlas spread with a fact written from what you just felt there. Star crumbs (פירורי כוכב) are the bonus collectibles: three per level, one star each.

## The first 30 seconds (level 1, ירח הקפיצות)

1. **0–5 s.** A launch-pad hop cinematic drops Nuri onto a grey, cratered Moon the size of a small park. The sky is black even though the Sun is up; Earth hangs blue in the sky. Sound is muffled (low-pass) because there's no air. One line: "אין כאן אוויר, אז השמיים שחורים גם ביום. נסו לקפוץ!"
2. **5–15 s.** The first jump is huge and slow: Nuri sails up six times higher than on Earth, arms flailing, dust puffs drifting without wind. The jump gauge (מד הקפיצה) at the left fills past the little Earth tick: "פי 6 מבכדור הארץ".
3. **15–30 s.** The page glints on a crater rim far above a cliff no Earth jump could clear. A trail of star crumbs arcs up to it. Jump, puff the jet once at the top, land on the rim. The page flies into the atlas with a page-turn sound and a line: "כוח הכבידה של הירח חלש: אותה קפיצה, גובה פי 6."

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Run (camera-relative) | WASD / arrows | left stick |
| Jump (hold = higher) | Space | jump button |
| Jet puff (one per jump) | Space again in the air | jump button again |
| Ground-pound | Shift or X in the air | ⬇ button |
| Pick up / throw / use | E | hand button |
| Camera | drag the mouse (auto-follows) | drag the right half |
| Atlas | Tab or B | book button |
| Hint | H | bulb |
| Pause / mute / restart | Esc or P / M / R | top bar |

## What the player reads (HUD, Hebrew RTL)

- **Top right:** level title (hidden until identified in transfer levels), atlas page icon, star crumbs ×3 (icons, not color only).
- **Left edge:** the jump gauge (מד הקפיצה): a vertical bar showing the last jump's apex in Nuri-heights, with a fixed Earth tick. This is the gravity feel indicator you learn to read; in transfer levels it shows no number.
- **Left, under it:** the thermometer (מד חום) when a world is hot or cold: snowflake at the bottom, flame at the top, a needle, and boots that smoke or a helmet that frosts. Overheating or freezing pops Nuri back to the last checkpoint with a funny animation, never a "wrong" popup.
- **Bottom centre:** one objective line. **Bottom corners:** touch controls on phones.
- **Sky:** the Sun's disc is the constant reference and visibly shrinks world by world (authoritative angular size, scaled the same way for every world).

## Physics is the lesson (authoritative, pure TypeScript)

- Nuri's legs are the same everywhere: one take-off speed. Jump height and air time scale as 1 / surface gravity. Gravity points to the centre of the body you're on; on Saturn's ring chunks it points to the ring plane.
- Air: no air (Moon, כספית) means black sky, no drag, muffled sound. Thick air (נוגה) means orange haze, strong drag, heat everywhere. Thin air (מאדים) means a pink sky and dust.
- Heat comes from the Sun's direction (day side, night side, the twilight band, shade cast by rocks, computed by raycast) plus a per-world greenhouse term. That is why נוגה's night side is hot and כספית's is freezing.
- Gas giants have no surface: falling "into" one is a long, safe fall through cloud bands back to a checkpoint.
- Tripo meshes are characters, props and dressing only. Planets, rings, gravity, the Sun's size and all gauges are procedural.

## Look

Saturated toy-diorama planets with a strong rim light, each world with its own sky: black Moon sky with blue Earth, orange Venus haze, pink-butterscotch Mars dusk, banded Jupiter filling the horizon, Saturn's rings across the sky, dim teal Neptune. Chunky low-poly-plus-smooth-shading surfaces, crisp shadows, glowy collectibles, star-field skybox. Third-person camera with a soft follow and planet-up orientation; the camera pulls back on low-gravity jumps. Rubik font, rounded HUD cards in deep navy with warm yellow accents. Distinct from the other games: no robot, no courier, no diorama table, no map board.

## Not like (checked before each world)

| Existing | Its verb | Pocket Planets instead |
|---|---|---|
| OrbitalSpeedExplorer (solar-system) | drag a planet's distance, race one orbit | planets never move under the player's hand; you never set an orbit or race one |
| CosmicScaleZoomExplorer (universe-structure) | a zoom slider and a size-ladder quiz | the scale is walked and jumped, one platforming step per scale; no slider, no quiz |
| KesslerOrbitLab (space-exploration) | press "launch satellite", watch collisions | you platform through a debris field and knock pieces down to burn in the air; you never launch |
| SphereChainReactionLab (earth-system) | pick a scenario, press "run the chain" | you cause the change with your own body (ground-pound a dam, plant a sapling) and use its effect to move on |
| Tilt World | walk a pocket Earth, commit sleep hours or a train ticket, photograph sky events | many worlds; no time skipping, no photos, no clock; the verbs are jump, puff, pound, carry |
| Rift Makers | place plumes and drips in the mantle | no mantle, no placing forces |
| Cloud Shepherd / Windshift Riders | steer a cloud / fly a sailplane | on foot; no flying vehicle |
| Landscape Detective | read a landscape with field-tool charges, pin it on a map | identification in transfer levels comes from your own jump, heat and sky, and you answer by taking a launch pad, not a pin or tool |
| Basin Breakers, Rush Hour Israel | cut terrain / snap road pieces | no terrain editing or building |
| Rift Runner | portal puzzle rooms | no portals; travel is a launch-pad hop cinematic |
| Clumpus, Halfpipe Joule, Slope Sled, Splash Arc, Bank Shot | rolling blob, skating, sledding, launching arcs, bank shots | you run and jump; you never aim a launch arc |
| Goblin Kitchen, Rooftop Radio, Pie Duel, Perspective Thief | kitchen orders, cloth glider courier, probability duel, forced perspective | no orders, no delivery loop, no glider, no duel |

## Replay

After the campaign, **daily comet runs** (ריצת השביט היומית): a seeded, solver-verified remix of three unlabeled worlds, each ending at a "which world was this?" launch-pad choice.
