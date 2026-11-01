// Usage: npx tsx scripts/solve.ts [levelNumbers...]  — runs each level's route headless and prints the result.
import { LEVELS } from '../src/levels/index';
import { solve } from '../src/core/bot';

const want = process.argv.slice(2).map(Number);
for (const def of LEVELS) {
  if (want.length && !want.includes(def.n)) continue;
  const r = solve(def);
  console.log(`L${String(def.n).padStart(2)} ${def.slug.padEnd(22)} ${r.won ? 'WON ' : 'FAIL'} t=${r.t.toFixed(1)}s crumbs=${r.stars} respawns=${r.respawns} step=${r.step} ${r.failed ?? ''}`);
}
