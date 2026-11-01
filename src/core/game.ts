// Level runtime: wraps the physics sim with pages, crumbs, checkpoints, pads, switches, the suit meter and the
// learning log. Pure and deterministic, so the same code runs in the browser, in tests and in the solver bot.

import { V3, v3, len, sub, clone, dot, addScaled } from './vec';
import {
  type Sim, type Input, type PhysEvent, makeSim, step, respawn, gravityAt, bodyCenter, NO_INPUT,
} from './physics';
import { temperatureAt, suitStep, lifeCheck, type HeatSample, type LifeCheck } from './climate';
import { WORLDS, gameGravityFactor, jumpApex } from './worlds';
import type { LevelDef, LevelParts, Pad, Switch, ScriptApi, Spot } from './level';

export interface Toast { he: string; kind: 'info' | 'good' | 'oops'; t: number }
export interface LearnEvent { level: number; t: number; action: string; outcome: string; value?: unknown; hinted: boolean; retries: number; first: boolean }
export type Status = 'play' | 'won';

export interface GameEvent { type: string; id?: string; at?: V3; he?: string; apex?: number }

export interface LevelRun {
  def: LevelDef;
  parts: LevelParts;
  sim: Sim;
  status: Status;
  pageTaken: boolean;
  crumbs: boolean[];
  meter: number;
  heat: HeatSample;
  respawns: number;
  hintsUsed: number;
  wrongPads: number;
  padCharge: Record<string, number>;
  usedSwitches: Set<string>;
  toasts: Toast[];
  log: LearnEvent[];
  events: GameEvent[];
  state: Record<string, unknown>;
  vars: Record<string, number>;
  wonAt: number;
  /** Last pad chosen (transfer levels). */
  choice: string | null;
  life: LifeCheck | null;
  paused: boolean;
}

export const PAD_CHARGE = 0.7;

export function startLevel(def: LevelDef): LevelRun {
  const parts = def.build();
  const sim = makeSim(parts);
  const run: LevelRun = {
    def, parts, sim, status: 'play', pageTaken: false, crumbs: parts.crumbs.map(() => false), meter: 0,
    heat: { c: 20, sun: 1, shade: false, zone: null }, respawns: 0, hintsUsed: 0, wrongPads: 0, padCharge: {},
    usedSwitches: new Set(), toasts: [], log: [], events: [], state: {}, vars: {}, wonAt: 0, choice: null, life: null, paused: false,
  };
  sim.player.checkpoint = { pos: clone(parts.spawn.pos), up: clone(parts.spawn.up) };
  def.script?.init?.(api(run));
  return run;
}

function say(run: LevelRun, he: string, kind: Toast['kind'] = 'info'): void {
  run.toasts.push({ he, kind, t: run.sim.t });
  if (run.toasts.length > 6) run.toasts.shift();
  run.events.push({ type: 'toast', he });
}

export function logLearn(run: LevelRun, action: string, outcome: string, value?: unknown): void {
  run.log.push({
    level: run.def.n, t: Math.round(run.sim.t * 10) / 10, action, outcome, value,
    hinted: run.hintsUsed > 0, retries: run.respawns + run.wrongPads, first: run.respawns + run.wrongPads + run.hintsUsed === 0,
  });
}

function api(run: LevelRun): ScriptApi {
  const p = run.sim.player;
  const g = gravityAt(run.sim, p.pos, p.bodyId);
  return {
    t: run.sim.t,
    flags: run.sim.flags,
    say: (he, kind) => say(run, he, kind),
    setFlag: (f) => { if (!run.sim.flags.has(f)) { run.sim.flags.add(f); run.events.push({ type: 'flag', id: f }); } },
    clearFlag: (f) => { if (run.sim.flags.delete(f)) run.events.push({ type: 'unflag', id: f }); },
    log: (a, o, v) => logLearn(run, a, o, v),
    state: run.state,
    player: { pos: p.pos, up: p.up, grounded: p.grounded, carrying: p.carrying, bodyWorld: g.body?.world ?? null },
    props: run.sim.props,
    vars: run.vars,
  };
}

/** World profile of the body Nuri is on (or the level's main world). */
export function currentWorld(run: LevelRun): string {
  const p = run.sim.player;
  const g = gravityAt(run.sim, p.pos, p.bodyId);
  return g.body?.world ?? run.def.worldId;
}

function setCheckpoint(run: LevelRun, s: Spot): void {
  run.sim.player.checkpoint = { pos: clone(s.pos), up: clone(s.up) };
}

function hop(run: LevelRun, to: Spot): void {
  const p = run.sim.player;
  p.pos = addScaled(to.pos, to.up, 0.6);
  p.vel = v3();
  p.up = clone(to.up);
  p.grounded = false;
  p.jumpFrom = null;
  run.events.push({ type: 'hop', at: clone(to.pos) });
}

function usePad(run: LevelRun, pad: Pad): void {
  run.choice = pad.answer ?? pad.id;
  run.events.push({ type: 'pad', id: pad.id });
  if (pad.sets) run.sim.flags.add(pad.sets);
  for (const c of pad.clears ?? []) run.sim.flags.delete(c);
  if (pad.kind === 'win') {
    logLearn(run, 'pad', 'right', pad.answer ?? pad.id);
    win(run);
    return;
  }
  if (pad.kind === 'wrong') {
    run.wrongPads++;
    logLearn(run, 'pad', 'wrong', pad.answer ?? pad.id);
    say(run, pad.explainHe ?? 'אופס! זה לא העולם הנכון. חזרה לנקודת הנחיתה.', 'oops');
    run.events.push({ type: 'wrong-pad', id: pad.id });
    if (pad.back) { hop(run, pad.back); setCheckpoint(run, pad.back); }
    return;
  }
  if (pad.to) { hop(run, pad.to); setCheckpoint(run, pad.to); logLearn(run, 'pad', 'warp', pad.answer ?? pad.id); }
}

export function win(run: LevelRun): void {
  if (run.status === 'won') return;
  run.status = 'won';
  run.wonAt = run.sim.t;
  run.events.push({ type: 'won' });
  logLearn(run, 'level', 'won', { stars: stars(run) });
}

/** Stars: one per star crumb, at least one for winning. */
export function stars(run: LevelRun): number {
  return Math.max(1, run.crumbs.filter(Boolean).length);
}

function onPhys(run: LevelRun, e: PhysEvent): void {
  run.events.push({ type: e.type, id: e.id, at: e.at, apex: e.apex });
  const a = api(run);
  if (e.type === 'cloud-fall') {
    run.respawns++;
    say(run, 'אין כאן קרקע! נופלים ונופלים בתוך העננים… חזרה לנקודת הביקורת.', 'oops');
    logLearn(run, 'fall', 'gas-giant');
  } else if (e.type === 'lost') {
    run.respawns++;
    say(run, 'עפתם לחלל! הכבידה החלשה לא החזירה אתכם. חזרה לנקודת הביקורת.', 'oops');
    logLearn(run, 'fall', 'lost-in-space');
  } else if (e.type === 'too-heavy') {
    say(run, 'כבד מדי כאן! על עולם עם כבידה חלשה יותר זה היה קל.', 'oops');
    logLearn(run, 'lift', 'too-heavy', Math.round((e.apex ?? 0) * 10) / 10);
  } else if (e.type === 'land' && e.apex && e.apex > 0.3) {
    run.events.push({ type: 'apex', apex: e.apex });
  }
  // switches that react to pounds and deliveries
  if (e.type === 'pound-land') {
    for (const s of run.parts.switches) if (s.by === 'pound') trySwitch(run, s, e.at);
  }
  if (e.type === 'drop' || e.type === 'throw') {
    for (const s of run.parts.switches) if (s.by === 'deliver') {
      const pr = run.sim.props.find((x) => x.id === e.id);
      if (pr && (s.prop === pr.id || s.prop === `kind:${pr.kind}`)) trySwitch(run, s, pr.pos, pr.id);
    }
  }
  run.def.script?.event?.(a, { type: e.type, id: e.id, at: e.at });
}

function trySwitch(run: LevelRun, s: Switch, at: V3, propId?: string): void {
  if (run.usedSwitches.has(s.id)) return;
  if (s.when && !run.sim.flags.has(s.when)) return;
  if (len(sub(at, s.pos)) > s.radius) return;
  run.usedSwitches.add(s.id);
  run.sim.flags.add(s.sets);
  run.events.push({ type: 'switch', id: s.id });
  if (s.sayHe) say(run, s.sayHe, 'good');
  logLearn(run, 'switch', s.sets, propId);
  run.def.script?.event?.(api(run), { type: 'switch', id: s.id });
}

export function useHint(run: LevelRun): string | null {
  if (run.def.noHints || !run.def.hintsHe.length) return null;
  const h = run.def.hintsHe[Math.min(run.hintsUsed, run.def.hintsHe.length - 1)];
  run.hintsUsed++;
  logLearn(run, 'hint', 'shown', run.hintsUsed);
  say(run, h, 'info');
  return h;
}

/** Advance the level by dt seconds with the given input. */
export function tick(run: LevelRun, input: Input, dt: number): GameEvent[] {
  run.events = [];
  if (run.paused) return run.events;
  if (run.status === 'won') input = NO_INPUT;
  const sim = run.sim;
  const evs = step(sim, input, dt);
  for (const e of evs) onPhys(run, e);
  const p = sim.player;
  const w = WORLDS[currentWorld(run)];

  // heat / cold
  run.heat = temperatureAt(sim, w, p.pos, p.up, run.parts.sunDir);
  const prevMeter = run.meter;
  run.meter = suitStep(run.meter, run.heat, dt);
  if (Math.abs(run.meter) >= 1 && run.status === 'play') {
    const hot = run.meter > 0;
    run.respawns++;
    say(run, hot ? 'החליפה התחממה מדי! המגפיים מעשנים… חזרה לצל.' : 'קפאתם! הקסדה התכסתה בכפור… חזרה לנקודת הביקורת.', 'oops');
    run.events.push({ type: hot ? 'overheat' : 'freeze' });
    logLearn(run, hot ? 'overheat' : 'freeze', 'respawn', Math.round(run.heat.c));
    run.meter = 0;
    respawn(sim);
  } else if (prevMeter < 0.6 && run.meter >= 0.6) {
    run.events.push({ type: 'hot-warning' });
  } else if (prevMeter > -0.6 && run.meter <= -0.6) {
    run.events.push({ type: 'cold-warning' });
  }

  if (run.status !== 'play') return run.events;
  const near = (s: { pos: V3 }, r: number) => len(sub(p.pos, s.pos)) < r;

  for (let i = 0; i < run.parts.crumbs.length; i++) {
    if (!run.crumbs[i] && near(run.parts.crumbs[i], 1.0)) {
      run.crumbs[i] = true;
      run.events.push({ type: 'crumb', id: String(i) });
    }
  }
  for (const c of run.parts.checkpoints) {
    if (near(c, 1.3) && len(sub(p.checkpoint.pos, c.pos)) > 0.1) {
      setCheckpoint(run, c);
      run.events.push({ type: 'checkpoint', at: c.pos });
    }
  }
  for (const s of run.parts.switches) if (s.by === 'touch' && p.grounded) trySwitch(run, s, p.pos);

  for (const pad of run.parts.pads) {
    if (pad.when && !sim.flags.has(pad.when)) { run.padCharge[pad.id] = 0; continue; }
    if (near(pad, 1.1) && p.grounded) {
      run.padCharge[pad.id] = (run.padCharge[pad.id] ?? 0) + dt;
      if (run.padCharge[pad.id] >= PAD_CHARGE) { run.padCharge[pad.id] = 0; usePad(run, pad); }
    } else run.padCharge[pad.id] = 0;
  }

  const pg = run.parts.page;
  if (!run.pageTaken && (!pg.when || sim.flags.has(pg.when)) && near(pg, 1.1)) {
    run.pageTaken = true;
    run.events.push({ type: 'page' });
    win(run);
  }

  run.def.script?.tick?.(api(run), dt);
  return run.events;
}

export function restartLevel(run: LevelRun): LevelRun {
  const next = startLevel(run.def);
  next.hintsUsed = run.hintsUsed;
  next.respawns = run.respawns + 1;
  next.log = run.log;
  logLearn(next, 'restart', 'manual');
  return next;
}

/** Plain-text state for tests and agents (window.render_game_to_text). */
export function describe(run: LevelRun): Record<string, unknown> {
  const p = run.sim.player;
  const g = gravityAt(run.sim, p.pos, p.bodyId);
  const wid = g.body?.world ?? run.def.worldId;
  const w = WORLDS[wid];
  const gf = gameGravityFactor(w);
  const r2 = (x: number) => Math.round(x * 100) / 100;
  return {
    level: run.def.n,
    slug: run.def.slug,
    title: run.def.titleHe,
    world: wid,
    worldHe: w.he,
    status: run.status,
    objective: run.def.objectiveHe,
    gravityFactor: gf,
    realGravity: w.g,
    fullJumpApex: r2(jumpApex(gf)),
    lastJumpApex: r2(p.lastApex),
    air: w.air,
    tempC: Math.round(run.heat.c),
    suitMeter: r2(run.meter),
    inShade: run.heat.shade,
    player: {
      pos: [r2(p.pos.x), r2(p.pos.y), r2(p.pos.z)],
      grounded: p.grounded,
      onBody: g.body?.id ?? null,
      altitude: g.body ? r2(g.distance) : null,
      speed: r2(len(p.vel)),
      puffReady: p.puff,
      carrying: p.carrying,
    },
    page: { taken: run.pageTaken, pos: [r2(run.parts.page.pos.x), r2(run.parts.page.pos.y), r2(run.parts.page.pos.z)], open: !run.parts.page.when || run.sim.flags.has(run.parts.page.when) },
    crumbs: run.crumbs.filter(Boolean).length + '/' + run.crumbs.length,
    stars: run.status === 'won' ? stars(run) : 0,
    flags: [...run.sim.flags],
    pads: run.parts.pads.filter((x) => !x.when || run.sim.flags.has(x.when)).map((x) => ({ id: x.id, label: x.labelHe })),
    respawns: run.respawns,
    hints: run.hintsUsed,
    lastToast: run.toasts.at(-1)?.he ?? null,
    t: r2(run.sim.t),
  };
}

export function lifeHere(run: LevelRun, at: V3): LifeCheck {
  return lifeCheck(run.sim, currentWorld(run), at, run.heat.c);
}

export { bodyCenter, dot };
