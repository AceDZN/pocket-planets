// Level format and authoring helpers. Levels are plain data built on round bodies with latitude/longitude placement.

import { V3, v3, add, scale, addScaled, cross, norm, fromLatLon, rotateAxis, perpendicular, dot } from './vec';
import type { Body, Box, Ball, Zone, Prop, Motion } from './physics';

export interface Spot { pos: V3; up: V3 }

export interface Pad {
  id: string;
  pos: V3;
  up: V3;
  labelHe: string;
  /** win: finishes the level; wrong: a funny detour back to `back`; warp: hop to `to`. */
  kind: 'win' | 'wrong' | 'warp';
  to?: Spot;
  back?: Spot;
  /** Shown after a wrong pad (one or two worked lines). */
  explainHe?: string;
  when?: string;
  /** Sets this flag when used (e.g. gear choice). */
  sets?: string;
  clears?: string[];
  /** For transfer levels: the answer this pad stands for. */
  answer?: string;
}

export interface Switch {
  id: string;
  pos: V3;
  up: V3;
  radius: number;
  by: 'pound' | 'touch' | 'deliver';
  /** deliver: which prop id must arrive (any prop of this kind if it starts with "kind:"). */
  prop?: string;
  sets: string;
  sayHe?: string;
  when?: string;
}

export interface RouteStep {
  /** A point to run to (surface spot), or the id of a page / crumb / pad / prop / switch. */
  to: V3 | string;
  /** Jump when this close (horizontal) to the target; 'puff' adds the jet at the apex. */
  jump?: 'full' | 'tap' | 'puff' | 'none';
  jumpAt?: number;
  /** Ground-pound once airborne / on arrival. */
  pound?: boolean;
  /** Press action on arrival (pick up / throw / plant). */
  action?: boolean;
  /** Wait this long on arrival (seconds) e.g. for a geyser or a pad to charge. */
  wait?: number;
  /** Wait until this flag is set. */
  until?: string;
  /** Arrival radius (default 0.8). */
  near?: number;
  /** Give up after this many seconds (default 25). */
  timeout?: number;
}

export interface LevelParts {
  bodies: Body[];
  boxes: Box[];
  balls: Ball[];
  zones: Zone[];
  props: Prop[];
  spawn: Spot;
  page: Spot & { when?: string };
  crumbs: Spot[];
  checkpoints: Spot[];
  pads: Pad[];
  switches: Switch[];
  /** Direction toward the Sun (unit). */
  sunDir: V3;
  /** Decorative placements for the renderer: Tripo props, signs, labels. Never colliders. */
  decor: Decor[];
  /** Surface paint patches (oceans, ice caps, deserts, lava) for the renderer and for zone placement. */
  paint?: Paint[];
  /** Big bodies hanging in the sky (Earth from the Moon, Jupiter from its moons…). */
  sky?: SkyBody[];
}

export interface Paint { body: string; lat: number; lon: number; deg: number; color: string; kind?: 'water' | 'ice' | 'grass' | 'sand' | 'lava' | 'dust'; when?: string; unless?: string }
export interface SkyBody { kind: 'earth' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'mars' | 'moon' | 'galaxy' | 'cluster'; dir: V3; sizeDeg: number }

export interface Decor {
  model: string;
  pos: V3;
  up: V3;
  yawDeg?: number;
  size?: number;
  parent?: string;
  when?: string;
  unless?: string;
  label?: string;
}

export interface ScriptApi {
  t: number;
  flags: Set<string>;
  say(he: string, kind?: 'info' | 'good' | 'oops'): void;
  setFlag(f: string): void;
  clearFlag(f: string): void;
  log(action: string, outcome: string, value?: unknown): void;
  state: Record<string, unknown>;
  player: { pos: V3; up: V3; grounded: boolean; carrying: string | null; bodyWorld: string | null };
  props: Prop[];
  /** Water/sea level offsets etc. the renderer reads. */
  vars: Record<string, number>;
  /** Emit a game event (audio / fx / HUD hooks: 'bloom', 'wilt', 'burn', 'reveal'…). */
  emit(type: string, at?: V3, id?: string): void;
  /** Can a seed pod bloom here? (Workbook's conditions for life.) */
  life(at: V3): { ok: boolean; have: Record<string, boolean>; reasonHe: string };
  /** Send Nuri back to the last checkpoint (counts as a retry). */
  respawn(): void;
  /** Hop Nuri to a spot (launch-pad cinematic) and make it the checkpoint. */
  hop(to: Spot): void;
  /** Set the HUD objective line. */
  objective(he: string): void;
  /** Reveal the hidden world name (transfer levels). */
  revealName(he: string): void;
  /** Current temperature where Nuri stands, °C. */
  tempC: number;
}

export interface LevelScript {
  init?(api: ScriptApi): void;
  tick?(api: ScriptApi, dt: number): void;
  event?(api: ScriptApi, ev: { type: string; id?: string; at?: V3 }): void;
}

export interface LevelDef {
  n: number;
  slug: string;
  titleHe: string;
  worldNo: 1 | 2 | 3 | 4;
  /** The main body's world profile id (for the atlas and the sky). */
  worldId: string;
  transfer?: boolean;
  /** Show the thermometer from the start (heat or cold matters here). */
  thermo?: boolean;
  /** How fast the suit heats up here (default 1): the shade-stop levels need exposure to matter. */
  heatRate?: number;
  /** Hide the world name in the HUD until the level is won. */
  hideName?: boolean;
  /** Spoiler-free title for catalogs and the locked atlas when the real title is the answer (hideName levels). */
  publicTitleHe?: string;
  noHints?: boolean;
  introHe: string[];
  objectiveHe: string;
  hintsHe: string[];
  /** The atlas line earned with the page; `extraHe` is labelled העשרה. */
  atlasHe: string;
  extraHe?: string;
  skillHe: string;
  modules: string[];
  build(): LevelParts;
  script?: LevelScript;
  /** A verified solution path the bot replays through the game's own input. */
  route: RouteStep[];
  /** Seconds the route should take at most. */
  routeTimeout?: number;
}

// ---------- helpers ----------

export function surf(center: V3, radius: number, lat: number, lon: number, alt = 0): Spot {
  const up = fromLatLon(lat, lon);
  return { pos: addScaled(center, up, radius + alt), up };
}

/** Tangent axes at a surface direction, rotated by yaw (degrees) around up. x = east-ish, z = north-ish. */
export function frame(up: V3, yawDeg = 0): [V3, V3, V3] {
  let north = v3(0, 1, 0);
  if (Math.abs(dot(north, up)) > 0.98) north = v3(0, 0, -1);
  let z = norm(addScaled(north, up, -dot(north, up)));
  let x = norm(cross(up, z));
  if (yawDeg) {
    const a = (yawDeg * Math.PI) / 180;
    x = rotateAxis(x, up, a);
    z = rotateAxis(z, up, a);
  }
  return [x, up, z];
}

export interface BodyRef { id: string; center: V3; radius: number }

/** A box resting on (or floating above) a body: `top` is the height of its top face above the surface. */
export function plat(
  id: string, b: BodyRef, lat: number, lon: number, top: number, w: number, h: number, d: number,
  opts: Partial<Box> & { yaw?: number } = {},
): Box {
  const up = fromLatLon(lat, lon);
  const axes = frame(up, opts.yaw ?? 0);
  const center = scale(up, b.radius + top - h / 2);
  const { yaw: _y, ...rest } = opts;
  return { id, center, half: v3(w / 2, h / 2, d / 2), axes, parent: b.id, ...rest };
}

/** A dome / hill: a ball sunk into the surface so `height` shows above it. */
export function hill(id: string, b: BodyRef, lat: number, lon: number, radius: number, height: number, opts: Partial<Ball> = {}): Ball {
  const up = fromLatLon(lat, lon);
  return { id, center: scale(up, b.radius + height - radius), radius, parent: b.id, ...opts };
}

/** A free box in world space (ring chunks, satellites, star platforms). */
export function freeBox(id: string, center: V3, up: V3, w: number, h: number, d: number, opts: Partial<Box> & { yaw?: number } = {}): Box {
  const axes = frame(norm(up), opts.yaw ?? 0);
  const { yaw: _y, ...rest } = opts;
  return { id, center, half: v3(w / 2, h / 2, d / 2), axes, ...rest };
}

/** Top-centre spot of a box (for crumbs, routes, spawns). Box must not have a parent offset beyond its body. */
export function topOf(b: Box, bodyCenter: V3 = v3(), lift = 0.45): Spot {
  const up = b.axes[1];
  return { pos: addScaled(add(bodyCenter, b.center), up, b.half.y + lift), up };
}

export function sphereBody(id: string, world: string, center: V3, radius: number, influence: number, motion?: Motion): Body {
  return { id, kind: 'sphere', world, center, radius, influence, motion };
}

export function zone(id: string, kind: Zone['kind'], center: V3, radius: number, opts: Partial<Zone> = {}): Zone {
  return { id, kind, center, radius, ...opts };
}

export function prop(id: string, kind: Prop['kind'], pos: V3, mass: number, radius = 0.4, motion?: Motion): Prop {
  return { id, kind, pos: { ...pos }, vel: v3(), radius, mass, carried: false, resting: !motion, alive: true, motion, home: { ...pos } };
}

export const pt = (s: Spot, lift = 0): V3 => addScaled(s.pos, s.up, lift);
export const offsetSpot = (s: Spot, d: V3): Spot => ({ pos: add(s.pos, d), up: s.up });
export { perpendicular };
