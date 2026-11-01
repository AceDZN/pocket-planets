import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve } from '../src/core/bot';
import { startLevel, tick, type LevelRun, type GameEvent } from '../src/core/game';
import { NO_INPUT } from '../src/core/physics';
import { v3, addScaled, len, dist } from '../src/core/vec';
import { surf, type LevelDef, type Spot } from '../src/core/level';
import { L02 } from '../src/levels/l02-mercury-day-night';
import { L03 } from '../src/levels/l03-venus-greenhouse';
import { L04 } from '../src/levels/l04-mars-red';
import { L05 } from '../src/levels/l05-where-did-i-land';
import { L10 } from '../src/levels/l10-asteroid-belt';
import { L11 } from '../src/levels/l11-jupiter-no-ground';
import { L12 } from '../src/levels/l12-saturn-rings';
import { L13 } from '../src/levels/l13-cold-and-far';
import { L14 } from '../src/levels/l14-rocky-or-gas';

const DT = 1 / 60;

function idle(run: LevelRun, secs: number): GameEvent[] {
  const out: GameEvent[] = [];
  for (let t = 0; t < secs; t += DT) out.push(...tick(run, NO_INPUT, DT));
  return out;
}

/** Put Nuri on a spot (as a hop does) and let them settle. */
function place(run: LevelRun, s: Spot, settle = 0.4): GameEvent[] {
  const p = run.sim.player;
  p.pos = addScaled(s.pos, s.up, 0.05);
  p.vel = v3();
  p.up = s.up;
  p.checkpoint = { pos: { ...s.pos }, up: { ...s.up } };
  return idle(run, settle);
}

/** A surface spot on one of the level's bodies. */
function ground(run: LevelRun, body: string, lat: number, lon: number): Spot {
  const b = run.parts.bodies.find((x) => x.id === body)!;
  return surf(b.center, b.radius, lat, lon);
}

const onEarth = (def: LevelDef): LevelDef => ({
  ...def,
  build() { const p = def.build(); p.bodies = p.bodies.map((b) => ({ ...b, world: 'earth' })); return p; },
});
const types = (ev: GameEvent[]) => ev.map((e) => e.type);
const toasts = (ev: GameEvent[]) => ev.filter((e) => e.type === 'toast').map((e) => e.he ?? '');

for (const def of [L02, L03, L04, L05, L10, L11, L12, L13, L14]) {
  test(`L${def.n}: the route wins through the game input with all three crumbs and no respawn`, () => {
    const r = solve(def);
    assert.ok(r.won, `L${def.n} ${r.failed}`);
    assert.equal(r.stars, 3);
    assert.equal(r.respawns, 0);
  });
}

for (const def of [L02, L04, L10]) {
  test(`L${def.n}: with Earth gravity the same route fails`, () => {
    assert.equal(solve(onEarth(def), def.route, 60).won, false);
  });
}

test('L2: the day side of כספית overheats the suit, the night side freezes it, the twilight band is fine', () => {
  let run = startLevel(L02);
  let ev = [...place(run, ground(run, 'mercury', 20, 70)), ...idle(run, 9)];
  assert.ok(types(ev).includes('overheat'));
  run = startLevel(L02);
  ev = [...place(run, ground(run, 'mercury', 20, -90)), ...idle(run, 9)];
  assert.ok(types(ev).includes('freeze'));
  run = startLevel(L02);
  ev = [...place(run, ground(run, 'mercury', 22, 1)), ...idle(run, 20)];
  assert.ok(!types(ev).includes('overheat') && !types(ev).includes('freeze'));
});

test('L3: on נוגה even the night side cooks the suit away from the cool stations', () => {
  const run = startLevel(L03);
  const ev = [...place(run, ground(run, 'venus', -40, 180)), ...idle(run, 9)];
  assert.ok(types(ev).includes('overheat'));
});

test('L5: the pads wait for all three clues; each wrong world is a funny detour back to the landing', () => {
  const run = startLevel(L05);
  const pad = (id: string) => run.parts.pads.find((p) => p.id === id)!;
  const landing = ground(run, 'unknown', 0, 0).pos;
  // before the evidence the pads do nothing
  place(run, pad('pad-mercury'));
  idle(run, 2);
  assert.equal(run.status, 'play');
  run.sim.flags.add('evidence');
  for (const id of ['pad-mars', 'pad-moon', 'pad-venus']) {
    const before = run.wrongPads;
    const ev = [...place(run, pad(id), 0.1), ...idle(run, 1.2)];
    assert.equal(run.wrongPads, before + 1, id);
    assert.equal(run.status, 'play');
    assert.ok(types(ev).includes('wrong-pad'));
    assert.ok(toasts(ev).some((t) => t.length > 20), `${id} explains itself`);
    assert.ok(dist(run.sim.player.pos, landing) < 2.5, `${id} hops back to the landing`);
  }
  place(run, pad('pad-mercury'), 0.1);
  idle(run, 1.2);
  assert.equal(run.status, 'won');
});

test('L11: a missed jump between the moons falls into the clouds of צדק and back to the checkpoint', () => {
  const run = startLevel(L11);
  const ev = [...place(run, { pos: v3(0, -25, 0), up: v3(0, 1, 0) }), ...idle(run, 6)];
  assert.ok(ev.some((e) => e.type === 'cloud-fall' && e.id === 'jupiter'));
  assert.equal(run.status, 'play');
});

test('L12: falling inward past the rings drops you into שבתאי', () => {
  const run = startLevel(L12);
  const ev = [...place(run, { pos: v3(0, 0, 22.5), up: v3(0, 0, 1) }), ...idle(run, 6)];
  assert.ok(ev.some((e) => e.type === 'cloud-fall' && e.id === 'saturn'));
});

test('L13: far from a warm station the cold of מירנדה freezes the suit', () => {
  const run = startLevel(L13);
  const ev = [...place(run, ground(run, 'miranda', -60, 180)), ...idle(run, 10)];
  assert.ok(types(ev).includes('freeze'));
});

// ---------- L14: predict the ground before each launch ----------

const HUB_R = 8;
const onHub = (run: LevelRun) => len(run.sim.player.pos) < HUB_R + 2;
const roundOf = (run: LevelRun) => [0, 1, 2, 3].find((k) => run.sim.flags.has(`round-${k}`));

/** Launch with one gear choice in the current round; if Nuri arrives in one piece, touch the beacon. */
function attempt(run: LevelRun, gear: 'boots' | 'skim'): { ok: boolean; ev: GameEvent[] } {
  const k = roundOf(run)!;
  const pad = run.parts.pads.find((p) => p.id === `${gear}-${k}`)!;
  const ev = [...place(run, pad, 0.1), ...idle(run, 4)];
  if (!onHub(run)) {
    const b = run.parts.switches.find((s) => s.id === `beacon-${k}`)!;
    ev.push(...place(run, b, 0.6));
  }
  return { ok: roundOf(run) !== k, ev };
}

test('L14: the cloud-skimmer on a rocky world is a BONK and back to the station', () => {
  const run = startLevel(L14);
  const { ok, ev } = attempt(run, 'skim'); // round 0: מאדים
  assert.equal(ok, false);
  assert.ok(types(ev).includes('bump'));
  assert.ok(toasts(ev).some((t) => t.includes('בונק')));
  assert.ok(onHub(run));
  assert.equal(roundOf(run), 0);
  assert.equal(run.respawns, 1);
});

test('L14: boots onto a gas giant fall through the clouds and back to the station', () => {
  const run = startLevel(L14);
  assert.ok(attempt(run, 'boots').ok); // מאדים: boots are right
  const { ok, ev } = attempt(run, 'boots'); // שבתאי: no ground
  assert.equal(ok, false);
  assert.ok(ev.some((e) => e.type === 'cloud-fall' && e.id === 'saturn'));
  assert.ok(onHub(run));
  assert.equal(roundOf(run), 1);
  // and the skimmer then works
  assert.ok(attempt(run, 'skim').ok);
});

test('L14: no constant or alternating gear strategy gets through; rocky near / gas far does', () => {
  const play = (plan: ('boots' | 'skim')[]) => {
    const run = startLevel(L14);
    for (const g of plan) if (!attempt(run, g).ok) return false;
    return run.sim.flags.has('all-done');
  };
  assert.equal(play(['boots', 'boots', 'boots', 'boots']), false);
  assert.equal(play(['skim', 'skim', 'skim', 'skim']), false);
  assert.equal(play(['boots', 'skim', 'boots', 'skim']), false);
  assert.equal(play(['skim', 'boots', 'skim', 'boots']), false);
  assert.equal(play(['boots', 'skim', 'skim', 'boots']), true);
});

test('L14: the page stays locked until all four worlds are done', () => {
  const run = startLevel(L14);
  place(run, run.parts.page);
  idle(run, 1);
  assert.equal(run.status, 'play');
});
