import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLDS, jumpApex, airTime, JUMP_EARTH, gameGravityFactor, G_FLOOR, sunAngularRadiusDeg } from '../src/core/worlds';
import { makeSim, step, NO_INPUT, type Input } from '../src/core/physics';
import { sphereBody, surf } from '../src/core/level';
import { v3 } from '../src/core/vec';
import { temperatureAt, suitStep, lifeCheck } from '../src/core/climate';

/** Jump straight up on a big flat-ish world and measure the apex with the real step function. */
function measureApex(world: string): { apex: number; air: number } {
  const B = { id: 'b', center: v3(0, 0, 0), radius: 400 };
  const spawn = surf(B.center, B.radius, 0, 0, 0.45);
  const sim = makeSim({ bodies: [sphereBody('b', world, B.center, B.radius, 2000)], boxes: [], balls: [], zones: [], props: [], spawn });
  for (let i = 0; i < 30; i++) step(sim, NO_INPUT, 1 / 60);
  const jump: Input = { ...NO_INPUT, jumpPressed: true, jumpHeld: true };
  step(sim, jump, 1 / 60);
  let t = 1 / 60, apex = 0;
  for (; t < 60; t += 1 / 60) {
    const ev = step(sim, { ...NO_INPUT, jumpHeld: true }, 1 / 60);
    const land = ev.find((e) => e.type === 'land');
    if (land) { apex = land.apex ?? 0; break; }
  }
  return { apex, air: t };
}

test('the same legs on every world: full jump apex is JUMP_EARTH / g', () => {
  for (const id of ['earth', 'moon', 'mars', 'mercury', 'venus', 'europa']) {
    const g = gameGravityFactor(WORLDS[id]);
    assert.ok(Math.abs(jumpApex(g) - JUMP_EARTH / g) < 1e-9, id);
  }
});

test('measured jump heights keep the real gravity ratios (airless worlds)', () => {
  const earth = measureApex('earth');
  const moon = measureApex('moon');
  const mercury = measureApex('mercury');
  assert.ok(Math.abs(earth.apex - JUMP_EARTH) < 0.08, `earth apex ${earth.apex}`);
  const ratio = moon.apex / earth.apex;
  assert.ok(Math.abs(ratio - 1 / 0.17) < 0.35, `moon/earth apex ratio ${ratio}`);
  assert.ok(Math.abs(mercury.apex / earth.apex - 1 / 0.38) < 0.15, 'mercury ratio');
  assert.ok(moon.air / earth.air > 5, 'moon jumps last much longer');
});

test('כספית and מאדים have the same pull, so jump height alone cannot tell them apart', () => {
  assert.equal(WORLDS.mercury.g, WORLDS.mars.g);
  assert.equal(jumpApex(gameGravityFactor(WORLDS.mercury)), jumpApex(gameGravityFactor(WORLDS.mars)));
});

test('air time scales as 1/g', () => {
  assert.ok(Math.abs(airTime(0.17) / airTime(1) - 1 / 0.17) < 1e-9);
});

test('tiny bodies use the gameplay floor and say so', () => {
  assert.equal(gameGravityFactor(WORLDS.enceladus), G_FLOOR);
  assert.ok(WORLDS.enceladus.g < G_FLOOR);
});

test('the Sun shrinks with distance: 1/AU', () => {
  assert.ok(sunAngularRadiusDeg(WORLDS.mercury.au) > sunAngularRadiusDeg(WORLDS.earth.au));
  assert.ok(Math.abs(sunAngularRadiusDeg(30) * 30 - sunAngularRadiusDeg(1)) < 1e-9);
});

function heatAt(world: string, lat: number, lon: number) {
  const B = { id: 'b', center: v3(0, 0, 0), radius: 10 };
  const sim = makeSim({ bodies: [sphereBody('b', world, B.center, B.radius, 30)], boxes: [], balls: [], zones: [], props: [], spawn: surf(B.center, B.radius, 0, 0, 0.5) });
  const s = surf(B.center, B.radius, lat, lon, 0.4);
  return temperatureAt(sim, WORLDS[world], s.pos, s.up, v3(0, 0, 1));
}

test('כספית: scorching day side, freezing night side, a livable twilight band', () => {
  const day = heatAt('mercury', 0, 0), night = heatAt('mercury', 0, 180), dusk = heatAt('mercury', 0, 85);
  assert.ok(day.c > 300 && night.c < -150);
  assert.ok(dusk.c > -60 && dusk.c < 150, `twilight ${dusk.c}`);
});

test('נוגה is hot on the night side too (thick greenhouse air), unlike כספית', () => {
  assert.ok(heatAt('venus', 0, 180).c > 400);
  assert.ok(heatAt('venus', 0, 180).c > heatAt('mercury', 0, 0).c);
});

test('the suit overheats on the day side and recovers in comfort', () => {
  let m = 0;
  const hot = heatAt('mercury', 0, 0);
  let t = 0;
  while (m < 1 && t < 30) { m = suitStep(m, hot, 0.1); t += 0.1; }
  assert.ok(m >= 1 && t > 2, `overheats after ${t}s, not instantly`);
  const ok = heatAt('mercury', 0, 85);
  m = 0.5;
  for (let i = 0; i < 30; i++) m = suitStep(m, ok, 0.1);
  assert.ok(m < 0.2);
});

test('life needs air, liquid water and a mild temperature', () => {
  const B = { id: 'b', center: v3(0, 0, 0), radius: 10 };
  const mk = (world: string) => makeSim({
    bodies: [sphereBody('b', world, B.center, B.radius, 30)], boxes: [], balls: [], props: [], spawn: surf(B.center, B.radius, 0, 0, 0.5),
    zones: [{ id: 'w', kind: 'water', center: surf(B.center, B.radius, 0, 0).pos, radius: 3 }, { id: 's', kind: 'soil', center: surf(B.center, B.radius, 0, 0).pos, radius: 3 }],
  });
  const at = surf(B.center, B.radius, 0, 0, 0.3).pos;
  assert.equal(lifeCheck(mk('earth'), 'earth', at, 20).ok, true);
  assert.equal(lifeCheck(mk('earth'), 'earth', at, -20).ok, false, 'frozen water and cold');
  assert.equal(lifeCheck(mk('mars'), 'mars', at, 10).have.air, false, 'Mars air does not support life');
  assert.equal(lifeCheck(mk('moon'), 'moon', at, 20).ok, false);
  assert.match(lifeCheck(mk('venus'), 'venus', at, 465).reasonHe, /סמיכה/, 'Venus is told it has air, just not one for life');
  assert.doesNotMatch(lifeCheck(mk('mars'), 'mars', at, 10).reasonHe, /אין כאן אטמוספרה/, 'Mars has thin air, not none');
  const far = surf(B.center, B.radius, 0, 90, 0.3).pos;
  assert.equal(lifeCheck(mk('earth'), 'earth', far, 20).have.water, false, 'no water away from the river');
});
