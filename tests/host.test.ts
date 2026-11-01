import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevelParam } from '../src/host';

test('parseLevelParam: 1-based ?level=N to a level index', () => {
  assert.equal(parseLevelParam('?level=1', 18), 0);
  assert.equal(parseLevelParam('?level=18', 18), 17);
  assert.equal(parseLevelParam('?x=1&level=7', 18), 6);
});

test('parseLevelParam: absent, malformed or out of range is null', () => {
  for (const s of ['', '?level=', '?level=0', '?level=19', '?level=-2', '?level=2.5', '?level=abc', '?lvl=3']) {
    assert.equal(parseLevelParam(s, 18), null, s);
  }
});
