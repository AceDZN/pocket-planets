// Regression tests for the independent playtest (PLAYTEST.md): guessing costs a crumb, the levels whose puzzle could
// be skipped by running straight at the page no longer can, and the suit waits while the intro is read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startLevel, tick, wrongAnswer, stars, type LevelRun } from '../src/core/game';
import { NO_INPUT } from '../src/core/physics';
import { sub, dot, addScaled, len, norm, v3 } from '../src/core/vec';
import { LEVELS } from '../src/levels/index';

const DT = 1 / 60;

/** Run straight at the page, jumping on every landing (and a jet puff at each apex). */
function beeline(n: number, puff: boolean, secs = 40): LevelRun {
  const run = startLevel(LEVELS[n - 1]);
  let wasUp = false, puffed = false;
  for (let t = 0; t < secs && run.status !== 'won'; t += DT) {
    const p = run.sim.player;
    const d = sub(run.parts.page.pos, p.pos);
    const tan = addScaled(d, p.up, -dot(d, p.up));
    const vUp = dot(p.vel, p.up);
    let jp = false;
    if (p.grounded) { jp = true; puffed = false; } else if (puff && !puffed && wasUp && vUp <= 0) { jp = true; puffed = true; }
    wasUp = vUp > 0;
    tick(run, { move: len(tan) > 0.01 ? norm(tan) : v3(), jumpHeld: true, jumpPressed: jp, poundPressed: false, actionPressed: false }, DT);
  }
  return run;
}

for (const n of [2, 5, 7, 9, 14, 16, 17, 18]) {
  test(`L${n}: running straight at the page does not skip the level's puzzle`, () => {
    assert.notEqual(beeline(n, false).status, 'won');
    assert.notEqual(beeline(n, true).status, 'won');
  });
}

test('a wrong answer: Shvitton takes back the newest star crumb, so guessing every pad scores lower', () => {
  const run = startLevel(LEVELS[4]);
  run.crumbs[0] = true; run.crumbOrder.push(0);
  run.crumbs[2] = true; run.crumbOrder.push(2);
  wrongAnswer(run);
  assert.deepEqual(run.crumbs, [true, false, false]);
  assert.equal(run.wrongPads, 1);
  wrongAnswer(run);
  wrongAnswer(run); // nothing left to take
  assert.deepEqual(run.crumbs, [false, false, false]);
  assert.equal(stars(run), 1);
});

test('the suit holds steady while the intro is read on the landing spot, then cold counts', () => {
  for (const n of [11, 12, 13]) {
    const run = startLevel(LEVELS[n - 1]);
    for (let t = 0; t < 20; t += DT) tick(run, NO_INPUT, DT);
    assert.equal(run.respawns, 0, `L${n}: no freeze while standing at the start`);
    assert.equal(run.meter, 0);
  }
});
