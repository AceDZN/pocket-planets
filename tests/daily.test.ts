import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels/index';
import { dailyKey, dailyPlan, mysteryDef, distinguishable, guessFeedbackHe, dailyStreak, leaks, withPrep, dailyEligible } from '../src/core/daily';
import { solve } from '../src/core/bot';
import { WORLDS } from '../src/core/worlds';

const days = Array.from({ length: 60 }, (_, i) => dailyKey(new Date(2026, 10, 1 + i)));

test('the daily run is the same for everyone on a date and changes between dates', () => {
  assert.deepEqual(dailyPlan('2026-11-01', LEVELS), dailyPlan('2026-11-01', LEVELS));
  const distinct = new Set(days.map((k) => JSON.stringify(dailyPlan(k, LEVELS).stages)));
  assert.ok(distinct.size > 20, `only ${distinct.size} distinct runs in 60 days`);
});

test('every daily run: three different worlds, three fair options each, never a transfer or the finale', () => {
  for (const k of days) {
    const { stages } = dailyPlan(k, LEVELS);
    assert.equal(stages.length, 3, k);
    assert.equal(new Set(stages.map((s) => s.world)).size, 3, k);
    for (const s of stages) {
      const def = LEVELS[s.level - 1];
      assert.ok(!def.transfer && !def.hideName && s.level !== LEVELS.length, `${k} L${s.level}`);
      assert.equal(s.options.length, 3);
      assert.ok(s.options.includes(s.world));
      for (const o of s.options) if (o !== s.world) assert.ok(distinguishable(o, s.world), `${k}: ${o} vs ${s.world}`);
    }
  }
});

test('mystery levels hide the world name in the text the player sees', () => {
  for (const def of LEVELS) {
    const m = mysteryDef(def);
    const name = WORLDS[def.worldId].he.replace(/^ה/, '');
    assert.ok(m.hideName && m.transfer);
    for (const s of [m.objectiveHe, ...m.hintsHe, ...m.introHe]) assert.ok(!s.includes(name), `L${def.n}: "${s}"`);
  }
});

test('every level the daily run can pick still wins through the game input as a mystery', () => {
  const picked = new Set(days.flatMap((k) => dailyPlan(k, LEVELS).stages.map((s) => s.level)));
  for (const n of picked) {
    const r = solve(mysteryDef(LEVELS[n - 1]));
    assert.ok(r.won, `L${n}: ${r.failed ?? 'not won'}`);
  }
});

test('a wrong guess explains a felt difference, never just "wrong"', () => {
  const s = guessFeedbackHe('moon', 'mars');
  assert.match(s, /פי/);
  assert.match(s, /נסו שוב/);
});

test('streak counts consecutive days ending today or yesterday', () => {
  const today = new Date(2026, 10, 10);
  assert.equal(dailyStreak({ '2026-11-10': 5, '2026-11-09': 3, '2026-11-07': 1 }, today), 2);
  assert.equal(dailyStreak({ '2026-11-09': 3, '2026-11-08': 3 }, today), 2);
  assert.equal(dailyStreak({ '2026-11-05': 3 }, today), 0);
});

test('no daily level shows a world name in its objective, hints or signs once scrubbed', () => {
  for (const l of dailyEligible(LEVELS)) assert.equal(leaks(l), false, `L${l.n}`);
  assert.ok(new Set(dailyEligible(LEVELS).map((l) => l.worldId)).size >= 5, 'enough worlds left to vary the run');
});

test('Hebrew prepositions merge with the article: בירח, לירח, מהעולם הזה', () => {
  assert.equal(withPrep('ב', 'הירח'), 'בירח');
  assert.equal(withPrep('ל', 'הירח'), 'לירח');
  assert.equal(withPrep('ב', 'מאדים'), 'במאדים');
  const m = mysteryDef({ ...LEVELS[9], objectiveHe: 'דלגו מאסטרואיד לאסטרואיד' });
  assert.equal(m.objectiveHe, 'דלגו מהעולם הזה לעולם הזה');
  assert.doesNotMatch(guessFeedbackHe('mars', 'moon'), /בהירח|להירח/);
});
