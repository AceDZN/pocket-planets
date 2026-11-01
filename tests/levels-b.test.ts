import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve, makeBot, botInput } from '../src/core/bot';
import { startLevel, tick, type LevelRun, type GameEvent } from '../src/core/game';
import { NO_INPUT, active, type Input } from '../src/core/physics';
import { v3, addScaled, norm, tangent, sub, len, fromLatLon } from '../src/core/vec';
import { topOf, type LevelDef, type RouteStep, type Spot } from '../src/core/level';
import { spot, ride } from '../src/levels/lib-b';
import { L06, L06_PLACES } from '../src/levels/l06-four-spheres';
import { L07, L07_PLACES } from '../src/levels/l07-wandering-garden';
import { L08, L08_PLACES } from '../src/levels/l08-sphere-chain';
import { L09, L09_PLACES } from '../src/levels/l09-missing-sphere';
import { L15, L15_PLACES } from '../src/levels/l15-satellite-orbit';
import { L16 } from '../src/levels/l16-late-light';
import { L17 } from '../src/levels/l17-scale-steps';
import { L18, L18_STOPS } from '../src/levels/l18-grand-journey';

const DT = 1 / 60;

/** Play a route through the real input path and keep every game event. */
function play(def: LevelDef, route: RouteStep[], maxT = 120): { run: LevelRun; events: GameEvent[] } {
  const run = startLevel(def);
  const bot = makeBot();
  const events: GameEvent[] = [];
  for (let t = 0; t < maxT && run.status !== 'won' && !bot.failed && bot.i < route.length; t += DT) {
    events.push(...tick(run, botInput(run, route, bot, DT), DT));
  }
  return { run, events };
}

function idle(run: LevelRun, secs: number, input: Input = NO_INPUT): GameEvent[] {
  const out: GameEvent[] = [];
  for (let t = 0; t < secs; t += DT) out.push(...tick(run, input, DT));
  return out;
}

/** Put Nuri on a spot (as a hop does) and let them settle. */
function place(run: LevelRun, s: Spot): GameEvent[] {
  const p = run.sim.player;
  p.pos = addScaled(s.pos, s.up, 0.05);
  p.vel = v3();
  p.up = s.up;
  p.checkpoint = { pos: { ...s.pos }, up: { ...s.up } };
  return idle(run, 0.4);
}

/** Hand Nuri a prop and throw it toward `toward`, then wait for it to land. */
function throwProp(run: LevelRun, id: string, toward: { x: number; y: number; z: number }, wait = 3): GameEvent[] {
  const p = run.sim.player;
  const pr = run.sim.props.find((x) => x.id === id)!;
  pr.carried = true;
  pr.motion = undefined;
  pr.alive = true;
  p.carrying = id;
  p.facing = norm(tangent(sub(toward, p.pos), p.up));
  const ev = idle(run, DT, { ...NO_INPUT, actionPressed: true });
  return [...ev, ...idle(run, wait)];
}

const toasts = (ev: GameEvent[]) => ev.filter((e) => e.type === 'toast').map((e) => e.he ?? '');

const MINE = [L06, L07, L08, L09, L15, L16, L17, L18];

test('levels 6–9 and 15–18: every route wins with all three star crumbs and no respawns', () => {
  for (const def of MINE) {
    const r = solve(def);
    assert.ok(r.won, `L${def.n}: ${r.failed ?? 'not won'} at step ${r.step}`);
    assert.equal(r.stars, 3, `L${def.n} crumbs`);
    assert.equal(r.respawns, 0, `L${def.n} respawns`);
  }
});

test('levels 6–9 and 15–18: standing still never wins', () => {
  for (const def of MINE) {
    const run = startLevel(def);
    idle(run, 40);
    assert.equal(run.status, 'play', `L${def.n}`);
  }
});

// ---------- L6 ----------

test('L6: walking into the sea is a splash and a respawn; the clouds need the sea first', () => {
  const { E } = L06_PLACES;
  const run = startLevel(L06);
  place(run, spot(E, -18, -8, 0.45));
  const bot = makeBot();
  const events: GameEvent[] = [];
  const walk: RouteStep[] = [{ to: spot(E, -34, -8).pos, timeout: 8 }];
  for (let t = 0; t < 8 && !bot.failed && bot.i < walk.length && !events.some((e) => e.type === 'lost'); t += DT) {
    events.push(...tick(run, botInput(run, walk, bot, DT), DT));
  }
  events.push(...idle(run, 1));
  const lost = events.find((e) => e.type === 'lost');
  assert.ok(lost && lost.id === 'sea', 'fell into the sea');
  assert.ok(toasts(events).some((t) => t.includes('ספלאש')));
  assert.ok(run.respawns >= 1);
  // no hydrosphere token yet: no clouds, no atmosphere token
  const c3 = run.sim.boxes.find((b) => b.id === 'c3')!;
  assert.equal(active(run.sim, c3), false);
  assert.equal(run.sim.flags.has('atmo'), false);
});

test('L6: the forest grows only after rock (גאוספרה) and rain (אטמוספרה)', () => {
  const run = startLevel(L06);
  run.sim.flags.add('geo');
  idle(run, 0.2);
  const leaf = run.sim.boxes.find((b) => b.id === 'l1')!;
  assert.equal(active(run.sim, leaf), false);
  // the page is not there with three of four
  ['hydro', 'atmo'].forEach((f) => run.sim.flags.add(f));
  idle(run, 0.2);
  assert.equal(run.sim.flags.has('all4'), false);
});

// ---------- L7 ----------

function podThrowAt(where: Spot, aim: Spot, warmUp = 0.6): { run: LevelRun; events: GameEvent[] } {
  const run = startLevel(L07);
  const events = [...place(run, where), ...idle(run, warmUp)];
  events.push(...throwProp(run, 'pod', aim.pos));
  return { run, events };
}

test('L7: the seed pod wilts on the Moon, Mars and נוגה sample chunks, naming what is missing', () => {
  const { MOON, MARS, VENUS } = L07_PLACES;
  for (const [b, must] of [[MOON, 'אטמוספרה'], [MARS, 'אטמוספרה'], [VENUS, 'חם מדי']] as const) {
    const { run, events } = podThrowAt(spot(b, 0, 0, 0.45), spot(b, 0, -20, 0));
    assert.ok(events.some((e) => e.type === 'wilt'), `${b.id}: wilts`);
    const said = toasts(events).find((t) => t.includes('נבל')) ?? '';
    assert.ok(said.includes(must), `${b.id}: says ${must} in "${said}"`);
    assert.equal(run.sim.flags.has('bloom'), false);
    // a fresh pod waits back at the seed shed
    const pod = run.sim.props.find((p) => p.id === 'pod')!;
    assert.ok(len(sub(pod.pos, pod.home)) < 0.01, `${b.id}: pod sent home`);
  }
});

test('L7: the pod wilts in the desert (no water) and on the ice cap (too cold), blooms on the riverbank', () => {
  const { E } = L07_PLACES;
  const desert = podThrowAt(spot(E, 0, -43, 0.45), spot(E, 0, -50, 0));
  const dsaid = toasts(desert.events).find((t) => t.includes('נבל')) ?? '';
  assert.ok(dsaid.includes('מים') && !dsaid.includes('אוויר'), `desert: "${dsaid}"`);
  assert.equal(desert.run.sim.flags.has('bloom'), false);

  const ice = podThrowAt(spot(E, 70, 0, 0.45), spot(E, 80, 0, 0));
  const isaid = toasts(ice.events).find((t) => t.includes('נבל')) ?? '';
  assert.ok(isaid.includes('קר מדי'), `ice cap: "${isaid}"`);
  assert.equal(ice.run.sim.flags.has('bloom'), false);

  const probe = startLevel(L07);
  const box = (id: string) => probe.sim.boxes.find((b) => b.id === id)!;
  const bank = podThrowAt(topOf(box('bstep'), E.center), topOf(box('bank'), E.center));
  assert.ok(bank.run.sim.flags.has('bloom'), 'riverbank blooms');
});

test('L7: standing on the נוגה sample cooks the suit outside the cool station', () => {
  const { VENUS } = L07_PLACES;
  const run = startLevel(L07);
  place(run, spot(VENUS, 0, 50, 0.45));
  const ev = idle(run, 9);
  assert.ok(ev.some((e) => e.type === 'overheat'));
});

// ---------- L8 ----------

test('L8: the dust storm blows you off the bare slope until both saplings are planted', () => {
  const { E } = L08_PLACES;
  const climb: RouteStep[] = [{ to: 'top:t2', jump: 'full', jumpAt: 1.9, timeout: 6 }];
  const run = startLevel(L08);
  place(run, spot(L08_PLACES.E, 0, -24, 0.9 + 0.45));
  const bot = makeBot();
  const ev: GameEvent[] = [];
  for (let t = 0; t < 7 && !bot.failed && bot.i < climb.length; t += DT) ev.push(...tick(run, botInput(run, climb, bot, DT), DT));
  assert.ok(!ev.some((e) => e.type === 'land' && e.id === 't2'), 'storm keeps you off t2');

  const calm = startLevel(L08);
  calm.sim.flags.add('trees');
  place(calm, spot(E, 0, -24, 0.9 + 0.45));
  const bot2 = makeBot();
  const ev2: GameEvent[] = [];
  for (let t = 0; t < 7 && !bot2.failed && bot2.i < climb.length; t += DT) ev2.push(...tick(calm, botInput(calm, climb, bot2, DT), DT));
  assert.ok(ev2.some((e) => e.type === 'land' && e.id === 't2'), 'calm slope: you land on t2');
});

test('L8: without acting, the melting ice raises the sea and floods the low jetty; going solar stops it', () => {
  const { SEA_AT } = L08_PLACES;
  const run = startLevel(L08);
  const ev = idle(run, SEA_AT[1] + 2);
  assert.ok(run.sim.flags.has('sea1') && run.sim.flags.has('sea2'));
  assert.equal(active(run.sim, run.sim.boxes.find((b) => b.id === 'j1')!), false, 'jetty under water');
  assert.ok(toasts(ev).some((t) => t.includes('מפלס הים')));
  // the high stones and the islet stay dry
  assert.ok(active(run.sim, run.sim.boxes.find((b) => b.id === 'h2')!));

  const saved = startLevel(L08);
  saved.sim.flags.add('solar');
  idle(saved, SEA_AT[1] + 2);
  assert.equal(saved.sim.flags.has('sea1'), false);
});

test('L8: no lily pads or birds in the drained Hula until the sluice is pounded', () => {
  const run = startLevel(L08);
  assert.equal(active(run.sim, run.sim.boxes.find((b) => b.id === 'ly1')!), false);
  const { events } = play(L08, [{ to: 'cp:0' }, { to: 'sw-sluice', jump: 'full', jumpAt: 2.2, pound: true }], 15);
  assert.ok(events.some((e) => e.type === 'switch' && e.id === 'sw-sluice'));
});

// ---------- L9 ----------

const altarSpot = () => spot(L09_PLACES.W, 0, 5, 0.3 + 0.45);
const altarAim = () => spot(L09_PLACES.W, 0, -3, 0.3);

test('L9: wrong capsules do something silly, roll home, and never make the world bloom', () => {
  for (const [id, flag] of [['cap-atmo', 'gust'], ['cap-geo', 'rocks'], ['cap-bio', 'wilted']] as const) {
    const run = startLevel(L09);
    place(run, altarSpot());
    const ev = throwProp(run, id, altarAim().pos, 0.5);
    assert.ok(run.sim.flags.has(flag), `${id} → ${flag}`);
    assert.ok(toasts(ev).length > 0);
    idle(run, 4);
    assert.equal(run.sim.flags.has(flag), false, `${flag} wears off`);
    assert.equal(run.sim.flags.has('bloom'), false);
    const cap = run.sim.props.find((p) => p.id === id)!;
    assert.ok(len(sub(cap.pos, cap.home)) < 0.01, `${id} back on its stand`);
  }
});

test('L9: a constant strategy (always the nearest capsule) cannot win; the hydrosphere capsule does', () => {
  const run = startLevel(L09);
  for (let k = 0; k < 4; k++) {
    place(run, altarSpot());
    throwProp(run, 'cap-atmo', altarAim().pos, 5);
  }
  assert.equal(run.sim.flags.has('bloom'), false);
  assert.equal(run.status, 'play');
  place(run, altarSpot());
  throwProp(run, 'cap-hydro', altarAim().pos, 1);
  assert.ok(run.sim.flags.has('bloom'));
});

test('L9: a capsule thrown from far away does not count', () => {
  const run = startLevel(L09);
  place(run, spot(L09_PLACES.W, 0, 40, 0.45));
  throwProp(run, 'cap-hydro', spot(L09_PLACES.W, 0, 50, 0).pos, 3);
  assert.equal(run.sim.flags.has('bloom'), false);
});

// ---------- L15 ----------

test('L15: the spinning space junk bumps you if you stand in its path', () => {
  const { MID } = L15_PLACES;
  const run = startLevel(L15);
  place(run, { pos: v3(MID.x, MID.y + 0.4, MID.z + 1.4), up: v3(0, 1, 0) });
  const ev = idle(run, 7);
  assert.ok(ev.some((e) => e.type === 'bump'), 'bumped by debris');
});

test('L15: thrown junk burns in the atmosphere; a dropped part comes back as a spare', () => {
  const { MID } = L15_PLACES;
  const run = startLevel(L15);
  place(run, { pos: v3(MID.x, MID.y + 0.4, MID.z), up: v3(0, 1, 0) });
  const ev = throwProp(run, 'deb1', v3(MID.x, MID.y, MID.z - 5), 5);
  assert.ok(ev.some((e) => e.type === 'burn' && e.id === 'deb1'));
  const ev2 = throwProp(run, 'part', v3(MID.x, MID.y, MID.z - 5), 5);
  assert.ok(ev2.some((e) => e.type === 'burn' && e.id === 'part'));
  const part = run.sim.props.find((p) => p.id === 'part')!;
  assert.ok(part.alive && len(sub(part.pos, part.home)) < 0.01, 'spare part waits on the GPS satellite');
  assert.equal(run.sim.flags.has('lane'), false, 'one piece is not a clear lane');
});

test('L15: falling off a satellite drops you into the atmosphere and back to the checkpoint', () => {
  const { run, events } = play(L15, [{ to: v3(0, 0.9, 8), timeout: 6 }], 8);
  assert.ok(events.some((e) => e.type === 'lost' && e.id === 'reentry'));
  assert.ok(run.respawns >= 1);
});

// ---------- L16 ----------

test('L16: the light tiles exist only while the light passes over them', () => {
  const run = startLevel(L16);
  const seen = new Set<boolean>();
  for (let t = 0; t < 8; t += 0.25) { idle(run, 0.25); seen.add(run.sim.flags.has('lit-andr7')); }
  assert.deepEqual([...seen].sort(), [false, true]);
});

test('L16: the Sun and Proxima pads are wrong answers and do not win', () => {
  for (const id of ['ans-sun', 'ans-prox']) {
    const { run, events } = play(L16, [...ride(id), { to: 'page', timeout: 3 }], 12);
    assert.ok(events.some((e) => e.type === 'wrong-pad' && e.id === id), id);
    assert.equal(run.sim.flags.has('answered'), false);
    assert.equal(run.status, 'play');
  }
});

// ---------- L17 ----------

test('L17: skipping a size or going back down bounces you to the start of the stage', () => {
  for (const id of ['s0-2', 's0-3']) {
    const { run, events } = play(L17, [{ to: spot({ id: 'planet', center: v3(), radius: 6 }, 0, 140, 0.45).pos }, ...ride(id)], 30);
    assert.ok(events.some((e) => e.type === 'wrong-pad' && e.id === id), id);
    assert.ok(len(sub(run.sim.player.pos, v3(0, 0, 6.5))) < 2, `${id}: back at the planet start`);
    assert.equal(run.status, 'play');
  }
});

test('L17: the Sun is not at the centre of the galaxy, and the galaxy pads wait for that answer', () => {
  const run = startLevel(L17);
  const deck3 = run.parts.pads.filter((p) => p.id.startsWith('s2-'));
  assert.ok(deck3.length === 3 && deck3.every((p) => p.when === 'sun-arm'));
  const centre = run.parts.pads.find((p) => p.id === 'sun-centre')!;
  assert.equal(centre.kind, 'wrong');
  place(run, { pos: centre.pos, up: centre.up });
  const ev = idle(run, 1.2);
  assert.ok(ev.some((e) => e.type === 'wrong-pad' && e.id === 'sun-centre'));
  assert.equal(run.sim.flags.has('sun-arm'), false);
});

// ---------- L18 ----------

test('L18: a wrong name is a detour back to the landing spot, and always taking the same corner fails', () => {
  const s0 = L18_STOPS[0];
  const route = (pick: string): RouteStep[] => [
    { to: 'top:pillar1', jump: 'full', jumpAt: 2.6 }, { to: 'mark1' }, ...ride(pick),
  ];
  // corner 0 on the first world names Mars, but this is the Moon
  const first = `w1-${s0.labels[0]}`;
  const { run, events } = play(L18, route(first), 30);
  assert.ok(events.some((e) => e.type === 'wrong-pad' && e.id === first));
  assert.ok(len(sub(run.sim.player.pos, spot(s0.body, 0, 0, 0.5).pos)) < 2.5, 'back at the landing spot');
  assert.equal(run.status, 'play');
  // the right pad sits in a different corner on every world
  const corners = L18_STOPS.map((s) => s.labels.indexOf(s.key));
  assert.equal(new Set(corners).size, corners.length);
});

test('L18: no hints, a hidden name and no pads before the marker pillar is climbed', () => {
  assert.ok(L18.noHints && L18.hideName && L18.transfer);
  const run = startLevel(L18);
  place(run, run.parts.pads.find((p) => p.id === 'w1-moon')!);
  const ev = idle(run, 1.5);
  assert.ok(!ev.some((e) => e.type === 'pad'), 'pads are asleep until the pillar');
  void fromLatLon;
});
