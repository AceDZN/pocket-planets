# ASSETS

This file records where every binary art asset in the repo came from. The 3D models are in `public/models/`. `public/models/manifest.json` is the loader contract: file, heightM, bindHeight, forward axis, clips by role, clip lengths, bind bounding box and notes. The visual design targets are in `docs/visual-targets/`, and `PROMPTS.md` there has the exact prompts.

**Rule:** Tripo meshes are characters, props and set dressing only. They are never colliders and never the source of any gameplay value. Planets, rings, gravity fields, terrain, the Sun's disc and every gauge are procedural.

## Licence basis

- **Tripo models:** all 8 were generated new in the user's own Tripo Studio account (visibility **Private**), paid for from the account's existing credit balance. Their use is governed by Tripo's terms of service for that account. No marketplace models, no CC-BY assets and no scraped meshes are used.
- **Search before generating:**
  - **The account's own assets (137 models):** checked for satellite, rover, crystal, rock, rocket, debris, pod, crate and book. No satellite, rover, crystal cluster, rocket or debris model exists. The only near matches are "stylized rock cluster" (basalt, Golan), "snowy rock" and "egg-shaped sleep pod", and none fits.
  - **Public gallery:** "satellite" returns 280 models and "rover" returns 2,728. They are realistic, foil-and-metal, often more than 100k faces (for example a gold cube satellite with 123,098 faces). They don't fit the bright toy look.
  - **Cost and terms:** a gallery export costs 5 credits, and the model pages show the uploader and the prompt but no licence. "cartoon satellite" returned nothing. So every model was generated, to keep one consistent toy style.
- **Mockups:** made with ChatGPT image generation in the user's own ChatGPT account. They are design references only and do not ship in the game build.

## Budget (this crew, 2026-11-01)

| Item | Limit | Used |
| --- | --- | --- |
| New Tripo generations | 8 | **8** |
| Rig / animation jobs | 3 | **3**: Nuri humanoid auto-rig, AI animation "shiver", AI animation "overheat" |
| Credits spent by this crew | ≤ 600 | **300**: 8 × 30 generations, 20 rig, 2 × 20 AI animation |

Preset animation retargets (idle, run, jump, jump_down, fall, cheer, frightened) and GLB exports cost 0 credits; the balance did not change across them. No credits were bought, no plan was upgraded, and the Tripo API was not used. The `.geography-tripo-ui-lock` file was absent, and no native (non-tab) input was used.

**Displayed balance:** 2140 at the start and 1645 at the end. Other crews were spending from the same account at the same time: the balance dropped by 5, 5, 5 and about 30 at moments when this crew started nothing. So the total fall of 495 is more than this crew's 300.

| Step | Displayed credits before → after |
| --- | --- |
| Nuri generate | 2135 → 2105 |
| comet generate | 2105 → 2075 |
| launch pad generate | 2075 → 2045 |
| Nuri auto-rig (Humanoid, Mixamo preset) | 2035 → 2015 |
| seed pod + satellite generate | 2015 → 1955 |
| rover generate | 1955 → 1925 |
| crystals generate | 1925 → 1895 |
| debris generate | 1895 → 1835 (60 shown; 30 was another crew) |
| AI animation "shiver" (3 s) | 1755 → 1735 |
| AI animation "overheat" (3 s) | 1735 → 1715 |

## Tripo settings (all 8 generations)

Text-to-3D in Tripo Studio with model **H3.1 – Best Quality**, HD Model, texture on at 2K, Remove Lighting on, PBR on, Triangle topology, target polycount **20000**, Ultra Mesh off and Private. Each costs 30 credits. Nuri also had **T-Pose** on.

Nuri was then rigged as Humanoid with the **Mixamo** skeleton preset (20 credits). The animations are Tripo presets plus two Tripo AI animations, each 3 s. The export was GLB at 2K with Export Skeleton on, all 9 animations, and "Animation stay in Place" on.

## Processing

Raw downloads are in `assets-src/tripo/*_raw.glb` (git-ignored). The scripts were scratch scripts using `@gltf-transform/core@4`.

```sh
# Nuri only, before optimize:
#  - rename the AI clips: "Standing in place freezing cold: …" -> shiver,
#    "Standing in place overheating …" -> overheat, frightened -> scared
#  - run: set the mixamorig:Hips translation X/Z keys to the bind value (0.002, 0.033);
#    Tripo baked a +0.32 forward Z offset (and -0.018 X) into the clip
#  - bake two subclips from jump_down (linear resample at the cut points):
#    pound = t 1.50..3.05 s, land = t 2.15..3.05 s
#  -> assets-src/tripo/nuri_fixed.glb

# every model -> shipped file (no meshopt or draco: plain GLTFLoader)
npx gltf-transform optimize <raw-or-fixed>.glb public/models/<name>.glb \
  --compress false --simplify false --texture-compress webp --texture-size 1024
```

After optimize, every animation is still present with the same names and lengths, the run fix holds, and `gltf-transform validate` reports no errors or warnings. Every shipped file is under 2.1 MB, Y-up, with its base at y = 0. Tripo normalises the largest extent to 1.0, so scale = `heightM / bindHeight`. The only required extension is `EXT_texture_webp`. The Tripo exports list `KHR_materials_volume` as used, but no material uses it. Each model has one opaque PBR material with baseColor, metallicRoughness and normal maps, each 1024 webp.

## Models

| File | Bytes | SHA-256 | Tris | Bind bbox (min → max) | Tripo task |
| --- | ---: | --- | ---: | --- | --- |
| `nuri.glb` | 2,018,208 | `06be28632949bae798efdc26e59af3491d4306ebede75c2eb2d6327017e56031` | 19,126 | (-0.433, 0, -0.244) → (0.433, 1, 0.244) | https://studio.tripo3d.ai/workspace/generate/b94e7905-3af5-4c12-b276-696c53b80a9a |
| `comet.glb` | 564,404 | `96677b8dc1e87998eddb4c3a0d0d77cc391d55249c8795ca71a1340d4a00806d` | 18,984 | (-0.5, 0, -0.363) → (0.5, 0.821, 0.363) | https://studio.tripo3d.ai/workspace/generate/2a3980ef-cb35-4a18-92c6-ce42e51ef5d6 |
| `launch_pad.glb` | 592,036 | `372f417932420042cf0c905ef89ef279b3f1c02c58487f0d11861c374f164cad` | 19,510 | (-0.445, 0, -0.5) → (0.445, 0.26, 0.5) | https://studio.tripo3d.ai/workspace/generate/1a12b63a-8841-4d37-9bf5-6948f0ce3cfd |
| `satellite.glb` | 664,320 | `4359999cc635f5a3db49dc179ca2303963f1e6f64057627923225831761e33e3` | 19,156 | (-0.5, 0, -0.259) → (0.5, 0.888, 0.259) | https://studio.tripo3d.ai/workspace/generate/95a9ea6b-bd0e-41dc-a6a4-af02a20e5a4a |
| `rover.glb` | 661,636 | `25891e9a11e0a9b052ab0710c64195a776525c61a84e2bcf3867e91e62d2e794` | 19,044 | (-0.5, 0, -0.371) → (0.5, 0.994, 0.371) | https://studio.tripo3d.ai/workspace/generate/7c01cbe8-c73e-4e65-8712-1162c6d4c511 |
| `seed_pod.glb` | 539,440 | `2d1858a6e984d1697e1b7bf72ba85614d34c15c7b91b11116a697a2065df742f` | 18,586 | (-0.311, 0, -0.312) → (0.311, 1, 0.312) | https://studio.tripo3d.ai/workspace/generate/d42043ef-3dca-49de-a8a1-98ed5f2b8aee |
| `crystals.glb` | 580,688 | `f1dfc91c5cc3caca3cd8582ccdf84352817a105ecf8261de7dfe4136b070429e` | 19,570 | (-0.422, 0, -0.402) → (0.422, 1, 0.402) | https://studio.tripo3d.ai/workspace/generate/81264c94-4f31-4846-bf9f-6411d722289d |
| `debris.glb` | 590,924 | `0b8e1b97461154558af27ef2b91be15f609e8d0d45777a6b858f9beb6de806ba` | 19,040 | (-0.5, 0, -0.34) → (0.5, 0.477, 0.34) | https://studio.tripo3d.ai/workspace/generate/f290a212-da17-47d5-80cf-ae4c3d0cba77 |

Total: 6,211,656 bytes.

Raw downloads (in `assets-src/tripo/`):

| Raw file | Bytes | SHA-256 |
| --- | ---: | --- |
| nuri_raw | 4,001,240 | `e0d8fedde466a53a38ed34ad361eca594cd177d694751b0625acbc77f5f806c1` |
| nuri_fixed (after the clip edits) | 4,103,932 | `f997a41039619d694a2848fc94e9fa91670c37ec25911bf15c4a661e9444a8bf` |
| comet_raw | 3,126,768 | `02f6c10ab6d065c87fe0b3ae17ac8c979191803e889ede18a6927a6d28d60c96` |
| launch_pad_raw | 2,649,924 | `e9c69f6ec46220e307f2c15f727d9b33c768abdf0c931c3c3ad6c7c50478e82b` |
| satellite_raw | 3,114,976 | `b9f6aeefb9a8b456af7035c68233803d94461f463de2bfe42dd24baa06140b5f` |
| rover_raw | 2,893,196 | `5688bff5513d153174f770fcd3a12c5ff5ecdc2c60c15b3a064818120b0d3f3d` |
| seed_pod_raw | 1,949,912 | `a1cf6c5dbe7fc628597b7f781aba5256c5e2fed4461663df29ddfc3a7ee402a9` |
| crystals_raw | 2,550,820 | `3312c18291b364aa499345de243b0598bb8fc092061850a92da43e039bf39352` |
| debris_raw | 2,549,164 | `40f1d8c63f2e79c33df6dea486081e9fada156bffa80cca0a3aed5c06d6d2ad3` |

### Nuri animation sources

| Clip in GLB | Source | Seconds |
| --- | --- | ---: |
| `idle` | Tripo preset idle | 15.33 |
| `run` | Tripo preset run (Hips X/Z fixed) | 1.25 |
| `jump` | Tripo preset jump (repeated in-place hops) | 2.21 |
| `jump_down` | Tripo preset jump_down | 3.71 |
| `pound` | subclip of jump_down, 1.50–3.05 s | 1.55 |
| `land` | subclip of jump_down, 2.15–3.05 s | 0.90 |
| `fall` | Tripo preset fall (trips, ends lying down) | 3.00 |
| `scared` | Tripo preset frightened | 3.38 |
| `cheer` | Tripo preset cheer | 12.08 |
| `shiver` | Tripo AI animation, 3 s: "Standing in place freezing cold: hugs own arms tightly around the chest, shoulders hunched up, whole body shivering and teeth chattering, knees knocking together, small quick stomps of the feet to keep warm, looping." | 2.96 |
| `overheat` | Tripo AI animation, 3 s: "Standing in place overheating on hot ground: comically hops from one foot to the other as if the floor is burning, while fanning the face fast with one hand and wiping the forehead with the other, panting, looping." | 2.96 |

## Generation prompts

- **nuri** (T-Pose on): Cute stylized cartoon kid space explorer game character, full body, small child proportions with big head, chunky bright orange one-piece space suit with white gloves, white boots and a navy belt, an oversized round transparent glass bubble helmet around a friendly smiling face with brown messy hair, a small white backpack jetpack with two little thrusters, round blue badge on the chest. Bright saturated toy colors, clean smooth shapes, Nintendo-style platformer hero, symmetrical, arms out in T-pose, standing straight.
- **comet:** Cute goofy cartoon comet villain character: a round lumpy ball made of grey-brown rock with chunks of pale blue ice, huge googly cartoon eyes with big black pupils looking in different directions, a wide cheeky grin showing a gap tooth, a long streaming icy blue-white comet tail flowing backwards from the back of the ball like a runny nose drip, sparkly frost. Bright saturated toy colors, smooth stylized shapes, Nintendo-style game mascot, playful not scary, single object.
- **launch_pad:** Stylized toy sci-fi launch pad for a cartoon platformer game: a chunky round low platform disc, white and navy panels with a glowing cyan ring of lights around the rim, a recessed glowing yellow circle in the center with a chevron arrow pattern, four small yellow-black hazard bumpers around the edge, little steps on one side. Bright saturated toy colors, smooth clean shapes, Nintendo style, single object, viewed slightly from above.
- **seed_pod:** Cute stylized seed pod capsule game prop: a small rounded glass capsule like a big pill standing upright, transparent glass dome with a tiny green sprout with two round leaves growing from a mound of brown soil inside, chunky white and orange metal end caps with a little carry handle on top and a small glowing green indicator light. Bright saturated toy colors, smooth clean shapes, Nintendo style collectible, single object.
- **satellite:** Cute stylized toy weather satellite game prop: a chunky rounded white and orange box body with a small round camera eye and a little dish antenna on top, two big wide rectangular blue solar panel wings on arms, gold foil accents, a few small antennas. Bright saturated toy colors, smooth clean chunky shapes, Nintendo style, single object, symmetrical.
- **rover:** Cute stylized toy Mars rover game prop: six chunky rounded wheels on rocker suspension arms, a white and orange boxy body with a flat solar panel deck, a tall camera mast with a friendly two-lens camera head like eyes, a small robotic arm folded at the front, a little dish antenna. Bright saturated toy colors, smooth clean chunky shapes, Nintendo style, single object, side three-quarter view.
- **crystals:** Stylized toy crystal cluster game prop: a cluster of seven chunky faceted glowing ice-blue and cyan crystals of different heights growing out of a small rounded grey rock base, a couple of small pale violet crystals, frosty white tips. Bright saturated toy colors, smooth clean low-poly faceted shapes, Nintendo style, single object.
- **debris:** Stylized toy space debris game prop: a broken cylindrical rocket stage chunk, white with orange and navy stripes, a torn jagged open end with bent panels, a small cone nozzle at the other end, a detached bent solar panel piece and a few bolts attached, slightly dented. Bright saturated toy colors, smooth clean chunky shapes, Nintendo style, single object.

## Results versus what was asked

- **Nuri:** the helmet is an opaque painted bubble, not real glass; see the manifest notes for a procedural glass shell. The backpack is a white pack on the back; small thrusters are not obvious, so add the jet puff procedurally.
- **Rover:** has 4 wheels, not 6.
- **Satellite:** reads as a friendly robot-satellite with a face-like camera eye.
- **Launch pad:** the cyan rim lights are painted in the texture and are not emissive.
- **Not made (generation budget spent):**
  - a second satellite variant (GPS or communication dish)
  - an atlas-page or book prop
  - a crate

  Build the page procedurally: a flat parchment quad with a glow.
