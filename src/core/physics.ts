// Spherical-gravity platformer physics. Pure and deterministic: the scene only renders this state.
// Gravity points to the centre of the body you're nearest (on Saturn's ring, to the ring plane).
// Nuri's legs are the same on every world, so jump height and air time scale as 1/g.

import {
  V3, v3, add, sub, scale, addScaled, dot, len, norm, tangent, clone, rotateAxis, perpendicular,
} from './vec';
import {
  WORLDS, G_EARTH, JUMP_SPEED, TERMINAL, AIR_DRAG, gameGravityFactor, type Air,
} from './worlds';

export type Motion =
  | { kind: 'orbit'; center: V3; axis: V3; radius: number; period: number; phase: number }
  | { kind: 'bob'; dir: V3; amp: number; period: number; phase: number };

export interface Body {
  id: string;
  /** sphere: solid ball; gas: no surface (fall through clouds); ring: gravity toward a plane. */
  kind: 'sphere' | 'gas' | 'ring';
  world: string;
  center: V3;
  radius: number;
  /** Capture distance above the surface (or from the ring plane). */
  influence: number;
  motion?: Motion;
  /** ring only */
  normal?: V3;
  inner?: number;
  outer?: number;
}

export interface Box {
  id: string;
  /** Offset from the parent body's centre (or world position when no parent). */
  center: V3;
  half: V3;
  /** Orthonormal local axes x, y (box "up"), z. */
  axes: [V3, V3, V3];
  parent?: string;
  motion?: Motion;
  ice?: boolean;
  /** Flag that must be set for the box to exist / flag that removes it. */
  when?: string;
  unless?: string;
  /** Collides only (no landing visuals), e.g. invisible walls. */
  ghost?: boolean;
  tag?: string;
}

export interface Ball {
  id: string;
  center: V3;
  radius: number;
  parent?: string;
  motion?: Motion;
  ice?: boolean;
  when?: string;
  unless?: string;
  tag?: string;
}

export interface Zone {
  id: string;
  kind: 'updraft' | 'launch' | 'cool' | 'warm' | 'water' | 'soil' | 'shade' | 'wind' | 'kill';
  center: V3;
  radius: number;
  parent?: string;
  /** updraft: accel; launch: take-off speed; wind: speed along dir. */
  power?: number;
  dir?: V3;
  /** launch: fires every `period` s for `open` s (geysers, vents). */
  period?: number;
  open?: number;
  phase?: number;
  when?: string;
  unless?: string;
}

export interface Prop {
  id: string;
  kind: 'crate' | 'pod' | 'debris' | 'part';
  pos: V3;
  vel: V3;
  radius: number;
  /** Earth weight in "Nuri lifts" units; liftable when mass·g ≤ LIFT_LIMIT. */
  mass: number;
  carried: boolean;
  resting: boolean;
  alive: boolean;
  motion?: Motion;
  home: V3;
}

export interface Input {
  /** World-space desired move direction (any length ≤ 1); projected onto the ground plane here. */
  move: V3;
  jumpHeld: boolean;
  jumpPressed: boolean;
  poundPressed: boolean;
  actionPressed: boolean;
}

export const NO_INPUT: Input = { move: v3(), jumpHeld: false, jumpPressed: false, poundPressed: false, actionPressed: false };

export interface Player {
  pos: V3;
  vel: V3;
  up: V3;
  facing: V3;
  grounded: boolean;
  groundId: string | null;
  groundIce: boolean;
  coyote: number;
  buffer: number;
  puff: boolean;
  jumping: boolean;
  cut: boolean;
  pounding: boolean;
  bodyId: string | null;
  jumpFrom: V3 | null;
  jumpUp: V3;
  rise: number;
  lastApex: number;
  airTime: number;
  lostTime: number;
  carrying: string | null;
  checkpoint: { pos: V3; up: V3 };
}

export interface PhysEvent {
  type: 'jump' | 'puff' | 'land' | 'pound' | 'pound-land' | 'launch' | 'cloud-fall' | 'lost' | 'pickup' | 'too-heavy' | 'throw' | 'drop' | 'bump';
  at: V3;
  apex?: number;
  id?: string;
  speed?: number;
}

export const PLAYER_R = 0.4;
export const RUN_SPEED = 6.2;
export const ACCEL_GROUND = 46;
export const ACCEL_ICE = 7;
export const ACCEL_AIR = 16;
export const COYOTE = 0.11;
export const BUFFER = 0.13;
export const PUFF_SPEED = 0.62 * JUMP_SPEED;
export const POUND_SPEED = 18;
export const LIFT_LIMIT = 10;
export const THROW_H = 6;
export const THROW_V = 0.55 * JUMP_SPEED;
export const LOST_AFTER = 2.2;
export const STEP = 1 / 120;

export interface Sim {
  t: number;
  bodies: Body[];
  boxes: Box[];
  balls: Ball[];
  zones: Zone[];
  props: Prop[];
  flags: Set<string>;
  player: Player;
  events: PhysEvent[];
  /** Body positions this step (cache). */
  bodyPos: Map<string, V3>;
}

// ---------- motion ----------

export function motionPos(m: Motion, t: number, base: V3): V3 {
  if (m.kind === 'bob') {
    const s = Math.sin(((t + m.phase) / m.period) * Math.PI * 2);
    return addScaled(base, m.dir, s * m.amp);
  }
  const axis = norm(m.axis);
  const start = perpendicular(axis);
  const ang = ((t / m.period) + m.phase) * Math.PI * 2;
  return addScaled(m.center, rotateAxis(start, axis, ang), m.radius);
}

export function bodyCenter(sim: Sim, b: Body): V3 {
  const c = sim.bodyPos.get(b.id);
  if (c) return c;
  return b.motion ? motionPos(b.motion, sim.t, b.center) : b.center;
}

function parentOffset(sim: Sim, parent?: string): V3 {
  if (!parent) return v3();
  const b = sim.bodies.find((x) => x.id === parent);
  return b ? bodyCenter(sim, b) : v3();
}

export function boxCenter(sim: Sim, b: Box, t = sim.t): V3 {
  const base = add(parentOffset(sim, b.parent), b.center);
  return b.motion ? motionPos(b.motion, t, base) : base;
}
export function ballCenter(sim: Sim, b: Ball, t = sim.t): V3 {
  const base = add(parentOffset(sim, b.parent), b.center);
  return b.motion ? motionPos(b.motion, t, base) : base;
}
export function zoneCenter(sim: Sim, z: Zone): V3 {
  return add(parentOffset(sim, z.parent), z.center);
}

export const active = (sim: Sim, x: { when?: string; unless?: string }): boolean =>
  (!x.when || sim.flags.has(x.when)) && (!x.unless || !sim.flags.has(x.unless));

export function zoneOpen(z: Zone, t: number): boolean {
  if (!z.period) return true;
  const ph = (((t + (z.phase ?? 0)) % z.period) + z.period) % z.period;
  return ph < (z.open ?? z.period);
}

// ---------- gravity ----------

export interface Gravity { dir: V3; g: number; body: Body | null; air: Air; distance: number }

/** Signed distance from p to the body's surface (or to the ring plane, Infinity off the ring). */
export function bodyDistance(sim: Sim, b: Body, p: V3): number {
  const c = bodyCenter(sim, b);
  if (b.kind === 'ring') {
    const n = norm(b.normal ?? v3(0, 1, 0));
    const d = sub(p, c);
    const h = dot(d, n);
    const r = len(tangent(d, n));
    if (r < (b.inner ?? 0) - 2 || r > (b.outer ?? Infinity) + 2) return Infinity;
    return Math.abs(h);
  }
  return len(sub(p, c)) - b.radius;
}

export function gravityAt(sim: Sim, p: V3, prefer: string | null = null): Gravity {
  let best: Body | null = null;
  let bestD = Infinity;
  for (const b of sim.bodies) {
    const d = bodyDistance(sim, b, p);
    if (d > b.influence) continue;
    // gas giants pull only when nothing else is near (moons win)
    const score = b.kind === 'gas' ? d + 1000 : d;
    if (score < bestD) { bestD = score; best = b; }
  }
  if (prefer && best && best.id !== prefer) {
    const cur = sim.bodies.find((b) => b.id === prefer);
    if (cur) {
      const d = bodyDistance(sim, cur, p);
      if (d <= cur.influence && d < bestD + 0.75 && cur.kind !== 'gas') { best = cur; bestD = d; }
    }
  }
  if (!best) return { dir: v3(0, -1, 0), g: 0, body: null, air: 'none', distance: Infinity };
  const c = bodyCenter(sim, best);
  let dir: V3;
  if (best.kind === 'ring') {
    const n = norm(best.normal ?? v3(0, 1, 0));
    dir = scale(n, dot(sub(p, c), n) >= 0 ? -1 : 1);
  } else {
    dir = norm(sub(c, p));
  }
  const w = WORLDS[best.world];
  return { dir, g: G_EARTH * gameGravityFactor(w), body: best, air: w.air, distance: bestD };
}

// ---------- collision ----------

interface Contact { n: V3; pen: number; id: string; ice: boolean; vel: V3 }

function sphereContact(p: V3, r: number, c: V3, R: number): { n: V3; pen: number } | null {
  const d = sub(p, c);
  const l = len(d);
  if (l >= R + r) return null;
  return { n: l > 1e-6 ? scale(d, 1 / l) : v3(0, 1, 0), pen: R + r - l };
}

export function boxContact(p: V3, r: number, c: V3, half: V3, axes: [V3, V3, V3]): { n: V3; pen: number } | null {
  const d = sub(p, c);
  const lx = dot(d, axes[0]), ly = dot(d, axes[1]), lz = dot(d, axes[2]);
  if (Math.abs(lx) > half.x + r || Math.abs(ly) > half.y + r || Math.abs(lz) > half.z + r) return null;
  const cx = Math.max(-half.x, Math.min(half.x, lx));
  const cy = Math.max(-half.y, Math.min(half.y, ly));
  const cz = Math.max(-half.z, Math.min(half.z, lz));
  const inside = cx === lx && cy === ly && cz === lz;
  if (!inside) {
    const closest = add(add(add(c, scale(axes[0], cx)), scale(axes[1], cy)), scale(axes[2], cz));
    const diff = sub(p, closest);
    const l = len(diff);
    if (l >= r) return null;
    return { n: scale(diff, 1 / Math.max(l, 1e-6)), pen: r - l };
  }
  // centre inside the box: push out along the axis of least penetration
  const px = half.x - Math.abs(lx), py = half.y - Math.abs(ly), pz = half.z - Math.abs(lz);
  if (py <= px && py <= pz) return { n: scale(axes[1], ly >= 0 ? 1 : -1), pen: py + r };
  if (px <= pz) return { n: scale(axes[0], lx >= 0 ? 1 : -1), pen: px + r };
  return { n: scale(axes[2], lz >= 0 ? 1 : -1), pen: pz + r };
}

/** All contacts of a sphere at p with radius r against the level's solids. */
export function contacts(sim: Sim, p: V3, r: number, dt: number): Contact[] {
  const out: Contact[] = [];
  for (const b of sim.bodies) {
    if (b.kind !== 'sphere') continue;
    const c = bodyCenter(sim, b);
    const k = sphereContact(p, r, c, b.radius);
    if (k) {
      const prev = b.motion ? motionPos(b.motion, sim.t - dt, b.center) : c;
      out.push({ ...k, id: b.id, ice: false, vel: scale(sub(c, prev), 1 / dt) });
    }
  }
  for (const b of sim.boxes) {
    if (!active(sim, b)) continue;
    const c = boxCenter(sim, b);
    const k = boxContact(p, r, c, b.half, b.axes);
    if (k) out.push({ ...k, id: b.id, ice: !!b.ice, vel: scale(sub(c, boxCenter(sim, b, sim.t - dt)), 1 / dt) });
  }
  for (const b of sim.balls) {
    if (!active(sim, b)) continue;
    const c = ballCenter(sim, b);
    const k = sphereContact(p, r, c, b.radius);
    if (k) out.push({ ...k, id: b.id, ice: !!b.ice, vel: scale(sub(c, ballCenter(sim, b, sim.t - dt)), 1 / dt) });
  }
  return out;
}

/** Ray against solids (for shade). Returns hit distance or Infinity. Coarse march, deterministic. */
export function rayBlocked(sim: Sim, from: V3, dir: V3, maxDist: number, skipBody?: string): boolean {
  const step = 0.35;
  for (let s = 0.6; s < maxDist; s += step) {
    const p = addScaled(from, dir, s);
    for (const b of sim.bodies) if (b.kind === 'sphere' && b.id !== skipBody && len(sub(p, bodyCenter(sim, b))) < b.radius) return true;
    for (const b of sim.boxes) if (active(sim, b) && !b.ghost && boxContact(p, 0, boxCenter(sim, b), b.half, b.axes)) return true;
    for (const b of sim.balls) if (active(sim, b) && len(sub(p, ballCenter(sim, b))) < b.radius) return true;
  }
  return false;
}

// ---------- player ----------

export function makePlayer(pos: V3, up: V3): Player {
  return {
    pos: clone(pos), vel: v3(), up: clone(up), facing: perpendicular(up), grounded: false, groundId: null, groundIce: false,
    coyote: 0, buffer: 0, puff: true, jumping: false, cut: false, pounding: false, bodyId: null, jumpFrom: null,
    jumpUp: clone(up), rise: 0, lastApex: 0, airTime: 0, lostTime: 0, carrying: null, checkpoint: { pos: clone(pos), up: clone(up) },
  };
}

export function respawn(sim: Sim): void {
  const p = sim.player;
  p.pos = addScaled(p.checkpoint.pos, p.checkpoint.up, 0.6);
  p.vel = v3();
  p.up = clone(p.checkpoint.up);
  p.grounded = false;
  p.pounding = false;
  p.jumping = false;
  p.jumpFrom = null;
  p.lostTime = 0;
  p.puff = true;
  if (p.carrying) {
    const pr = sim.props.find((x) => x.id === p.carrying);
    if (pr) { pr.carried = false; pr.pos = clone(pr.home); pr.vel = v3(); }
    p.carrying = null;
  }
}

function stepPlayer(sim: Sim, input: Input, dt: number, edges: { jump: boolean; pound: boolean; action: boolean }): void {
  const p = sim.player;
  const grav = gravityAt(sim, p.pos, p.bodyId);
  const ev = sim.events;

  if (!grav.body) {
    p.lostTime += dt;
    if (p.lostTime > LOST_AFTER) { ev.push({ type: 'lost', at: clone(p.pos) }); respawn(sim); return; }
  } else {
    p.lostTime = 0;
    p.bodyId = grav.body.id;
    if (grav.body.kind === 'gas' && len(sub(p.pos, bodyCenter(sim, grav.body))) < grav.body.radius) {
      ev.push({ type: 'cloud-fall', at: clone(p.pos), id: grav.body.id });
      respawn(sim);
      return;
    }
  }
  const up = grav.body ? scale(grav.dir, -1) : p.up;
  p.up = up;
  const g = grav.g;

  // input → tangent velocity
  let move = tangent(input.move, up);
  const ml = len(move);
  if (ml > 1) move = scale(move, 1 / ml);
  if (ml > 0.1) p.facing = norm(move);
  const carryMul = p.carrying ? 0.8 : 1;
  const target = scale(move, RUN_SPEED * carryMul);
  let vt = tangent(p.vel, up);
  let vn = dot(p.vel, up);
  const accel = p.grounded ? (p.groundIce ? ACCEL_ICE : ACCEL_GROUND) : ACCEL_AIR;
  const dv = sub(target, vt);
  const dvl = len(dv);
  const maxDv = accel * dt;
  vt = dvl > maxDv ? addScaled(vt, dv, maxDv / dvl) : target;
  if (!p.grounded) vt = scale(vt, Math.exp(-AIR_DRAG[grav.air] * dt * 0.5));

  // zones that push
  for (const z of sim.zones) {
    if (!active(sim, z)) continue;
    const zc = zoneCenter(sim, z);
    if (len(sub(p.pos, zc)) > z.radius) continue;
    if (z.kind === 'updraft' && zoneOpen(z, sim.t)) vn += (z.power ?? 30) * dt;
    if (z.kind === 'wind' && z.dir) vt = addScaled(vt, tangent(z.dir, up), (z.power ?? 3) * dt);
    if (z.kind === 'launch' && zoneOpen(z, sim.t) && vn < (z.power ?? 12) * 0.6) {
      vn = z.power ?? 12;
      p.grounded = false; p.jumping = false; p.pounding = false; p.puff = true;
      p.jumpFrom = clone(p.pos); p.jumpUp = clone(up); p.rise = 0;
      ev.push({ type: 'launch', at: clone(p.pos), id: z.id });
    }
  }

  // jump / puff / pound
  if (edges.jump) p.buffer = BUFFER;
  if (p.buffer > 0 && (p.grounded || p.coyote > 0) && g > 0) {
    vn = JUMP_SPEED;
    p.grounded = false; p.coyote = 0; p.buffer = 0; p.jumping = true; p.cut = false; p.puff = true;
    p.jumpFrom = clone(p.pos); p.jumpUp = clone(up); p.rise = 0; p.airTime = 0;
    ev.push({ type: 'jump', at: clone(p.pos) });
  } else if (edges.jump && !p.grounded && p.coyote <= 0 && p.puff && !p.pounding) {
    vn = Math.max(vn, PUFF_SPEED);
    p.puff = false;
    p.buffer = 0;
    ev.push({ type: 'puff', at: clone(p.pos) });
  }
  if (p.jumping && !input.jumpHeld && vn > 0 && !p.cut) { vn *= 0.5; p.cut = true; }
  if (edges.pound && !p.grounded && !p.pounding) {
    p.pounding = true;
    ev.push({ type: 'pound', at: clone(p.pos) });
  }

  vn -= g * dt;
  if (p.pounding) vn = -POUND_SPEED;
  vn = Math.max(vn, -TERMINAL[grav.air]);
  p.vel = addScaled(vt, up, vn);

  // integrate + collide
  p.pos = addScaled(p.pos, p.vel, dt);
  const wasGrounded = p.grounded;
  p.grounded = false;
  let groundVel: V3 | null = null;
  let nSum = v3();
  for (let iter = 0; iter < 3; iter++) {
    const cs = contacts(sim, p.pos, PLAYER_R, dt);
    if (!cs.length) break;
    for (const c of cs) {
      nSum = add(nSum, c.n);
      p.pos = addScaled(p.pos, c.n, c.pen);
      const rel = sub(p.vel, c.vel);
      const into = dot(rel, c.n);
      if (into < 0) p.vel = addScaled(p.vel, c.n, -into);
      if (dot(c.n, up) > 0.55) {
        p.grounded = true; p.groundId = c.id; p.groundIce = c.ice; groundVel = c.vel;
      }
    }
  }
  // wedged between two walls that together hold you up: that counts as standing
  if (!p.grounded && len(nSum) > 0.2 && dot(norm(nSum), up) > 0.55) p.grounded = true;
  // ground probe: stay grounded on a surface just below the feet (no flicker on curved ground and corners)
  if (!p.grounded && (wasGrounded || vn <= 0) && dot(p.vel, up) <= 0.5) {
    for (const c of contacts(sim, addScaled(p.pos, up, -0.07), PLAYER_R, dt)) {
      if (dot(c.n, up) > 0.55) { p.grounded = true; p.groundId = c.id; p.groundIce = c.ice; groundVel = c.vel; break; }
    }
  }
  if (p.grounded && groundVel) {
    // ride moving platforms: keep the tangent velocity relative to the ground
    p.pos = addScaled(p.pos, tangent(groundVel, up), dt);
  }

  // jump tracking for the gauge
  if (p.jumpFrom) p.rise = Math.max(p.rise, dot(sub(p.pos, p.jumpFrom), p.jumpUp));
  if (!p.grounded) p.airTime += dt;
  if (p.grounded && !wasGrounded) {
    const apex = p.jumpFrom ? p.rise : 0;
    if (p.jumpFrom) p.lastApex = apex;
    ev.push({ type: p.pounding ? 'pound-land' : 'land', at: clone(p.pos), apex, id: p.groundId ?? undefined, speed: -vn });
    p.pounding = false; p.jumping = false; p.jumpFrom = null; p.puff = true; p.airTime = 0;
  }
  if (p.grounded) { p.coyote = COYOTE; } else { p.coyote -= dt; }
  p.buffer -= dt;

  // carry / throw
  if (edges.action) {
    if (p.carrying) {
      const pr = sim.props.find((x) => x.id === p.carrying)!;
      pr.carried = false;
      pr.resting = false;
      pr.vel = add(addScaled(scale(p.facing, THROW_H), up, THROW_V), tangent(p.vel, up));
      pr.pos = addScaled(addScaled(p.pos, up, 0.9), p.facing, 0.6);
      p.carrying = null;
      ev.push({ type: 'throw', at: clone(p.pos), id: pr.id });
    } else {
      const near = sim.props.find((x) => x.alive && !x.carried && x.kind !== 'debris' && len(sub(x.pos, p.pos)) < 1.4 + x.radius);
      if (near) {
        const weight = near.mass * (g / G_EARTH);
        if (weight <= LIFT_LIMIT) { near.carried = true; p.carrying = near.id; ev.push({ type: 'pickup', at: clone(p.pos), id: near.id }); }
        else ev.push({ type: 'too-heavy', at: clone(p.pos), id: near.id, apex: weight });
      }
    }
  }
}

function stepProps(sim: Sim, dt: number): void {
  const p = sim.player;
  for (const pr of sim.props) {
    if (!pr.alive) continue;
    if (pr.carried) {
      pr.pos = addScaled(p.pos, p.up, 1.05);
      pr.vel = clone(p.vel);
      continue;
    }
    if (pr.motion) { pr.pos = motionPos(pr.motion, sim.t, pr.home); continue; }
    if (pr.resting) continue;
    const grav = gravityAt(sim, pr.pos);
    if (!grav.body) { pr.alive = pr.kind === 'debris' ? false : pr.alive; if (pr.kind !== 'debris') { pr.pos = clone(pr.home); pr.vel = v3(); } continue; }
    if (grav.body.kind === 'gas' && len(sub(pr.pos, bodyCenter(sim, grav.body))) < grav.body.radius) {
      pr.pos = clone(pr.home); pr.vel = v3(); continue;
    }
    pr.vel = addScaled(pr.vel, grav.dir, grav.g * dt);
    const vdown = -dot(pr.vel, grav.dir) ;
    if (vdown < -TERMINAL[grav.air]) pr.vel = addScaled(pr.vel, grav.dir, -(vdown + TERMINAL[grav.air]));
    pr.pos = addScaled(pr.pos, pr.vel, dt);
    const cs = contacts(sim, pr.pos, pr.radius, dt);
    let landed = false;
    for (const c of cs) {
      pr.pos = addScaled(pr.pos, c.n, c.pen);
      const into = dot(pr.vel, c.n);
      if (into < 0) pr.vel = addScaled(pr.vel, c.n, -into * 1.25);
      if (dot(c.n, scale(grav.dir, -1)) > 0.55) landed = true;
    }
    if (landed) {
      pr.vel = scale(pr.vel, Math.exp(-8 * dt));
      if (len(pr.vel) < 0.25) { pr.vel = v3(); pr.resting = true; sim.events.push({ type: 'drop', at: clone(pr.pos), id: pr.id }); }
    }
  }
}

export interface EdgeState { jump: boolean; pound: boolean; action: boolean }

/** Advance the simulation by dt seconds in fixed sub-steps. Edge inputs fire on the first sub-step only. */
export function step(sim: Sim, input: Input, dt: number): PhysEvent[] {
  sim.events = [];
  const n = Math.max(1, Math.round(dt / STEP));
  for (let i = 0; i < n; i++) {
    sim.t += STEP;
    sim.bodyPos.clear();
    for (const b of sim.bodies) sim.bodyPos.set(b.id, b.motion ? motionPos(b.motion, sim.t, b.center) : b.center);
    const edges = { jump: i === 0 && input.jumpPressed, pound: i === 0 && input.poundPressed, action: i === 0 && input.actionPressed };
    stepPlayer(sim, input, STEP, edges);
    stepProps(sim, STEP);
  }
  return sim.events;
}

export function makeSim(parts: { bodies: Body[]; boxes: Box[]; balls: Ball[]; zones: Zone[]; props: Prop[]; spawn: { pos: V3; up: V3 } }): Sim {
  const sim: Sim = {
    t: 0, bodies: parts.bodies, boxes: parts.boxes, balls: parts.balls, zones: parts.zones, props: parts.props,
    flags: new Set(), player: makePlayer(parts.spawn.pos, parts.spawn.up), events: [], bodyPos: new Map(),
  };
  return sim;
}
