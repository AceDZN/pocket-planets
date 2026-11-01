import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels/index';
import { solve } from '../src/core/bot';
import { L01 } from '../src/levels/l01-moon';
import type { LevelDef } from '../src/core/level';
import { jumpApex, gameGravityFactor, WORLDS } from '../src/core/worlds';
import { startLevel, tick } from '../src/core/game';
import { NO_INPUT } from '../src/core/physics';

test('there are 18 authored levels, numbered 1..18 with unique slugs', () => {
  assert.equal(LEVELS.length, 18);
  LEVELS.forEach((l, i) => assert.equal(l.n, i + 1));
  assert.equal(new Set(LEVELS.map((l) => l.slug)).size, 18);
});

test('every level has Hebrew text, three crumbs, a page, a route and Workbook modules', () => {
  for (const l of LEVELS) {
    const p = l.build();
    assert.equal(p.crumbs.length, 3, `L${l.n} crumbs`);
    assert.ok(l.titleHe && l.objectiveHe && l.atlasHe && l.skillHe, `L${l.n} text`);
    assert.ok(l.route.length > 0, `L${l.n} route`);
    for (const m of l.modules) assert.match(m, /^grade-8\/chapter-1\/(earth-system|universe-structure|solar-system|space-exploration)$/, `L${l.n} module ${m}`);
  }
});

test('every level is solvable through the game input (route bot, real physics)', () => {
  for (const l of LEVELS) {
    const r = solve(l);
    assert.ok(r.won, `L${l.n} ${l.slug}: ${r.failed ?? 'not won'} at step ${r.step}`);
  }
});

test('L1: the crater rim is out of reach with Earth legs-and-gravity, easy on the Moon', () => {
  const rimRise = 9.5 - 4; // ledge top to rim top
  assert.ok(jumpApex(gameGravityFactor(WORLDS.earth)) < 4, 'Earth jump cannot even reach the first ledge');
  assert.ok(jumpApex(gameGravityFactor(WORLDS.moon)) > rimRise);
  // the same level with Earth gravity: the route fails
  const onEarth: LevelDef = { ...L01, build() { const p = L01.build(); p.bodies = p.bodies.map((b) => ({ ...b, world: 'earth' })); return p; } };
  const r = solve(onEarth, L01.route, 60);
  assert.equal(r.won, false);
});

test('L1: standing still never wins (no page without climbing)', () => {
  const run = startLevel(L01);
  for (let i = 0; i < 60 * 30; i++) tick(run, NO_INPUT, 1 / 60);
  assert.equal(run.status, 'play');
});
