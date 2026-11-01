// Browser smoke run: opens every authored level at ?level=N in real Chrome (WebGL on), lets the route bot play it
// through the game's own Input, and checks it is won with no page errors. Captures a mid-level frame per level into
// the git-ignored scratch/shots/ for the visual review.
// Needs the dev server on :5245 (or BASE=<url>).  Usage: node tests/smoke.mjs [n…]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const GAME = process.env.BASE ?? 'http://localhost:5245/';
const only = process.argv.slice(2).map(Number);
mkdirSync('scratch/shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const levels = only.length ? only : Array.from({ length: 18 }, (_, i) => i + 1);
let bad = 0;
for (const n of levels) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('response', (r) => r.status() >= 400 && errs.push(`${r.status()} ${r.url()}`));
  await page.goto(`${GAME}?level=${n}`);
  await page.waitForFunction(() => window.__game && window.render_game_to_text, null, { timeout: 30000 });
  await page.evaluate(() => window.__game.autoplay());
  const t0 = Date.now();
  let shot = false, st = {};
  while (Date.now() - t0 < 180000) {
    await page.waitForTimeout(500);
    st = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    if (!shot && Date.now() - t0 > 4000) { await page.screenshot({ path: `scratch/shots/smoke-L${String(n).padStart(2, '0')}.png` }); shot = true; }
    if (st.status === 'won' || st.mode === 'won') break;
  }
  const won = st.status === 'won' || st.mode === 'won';
  if (!won || errs.length) bad++;
  console.log(`L${n}`.padEnd(4), won ? 'WON ' : 'FAIL', `${Math.round((Date.now() - t0) / 1000)}s`, `fps ${st.fps ?? '?'}`, `crumbs ${st.crumbs ?? '?'}`, errs.slice(0, 3).join(' | '));
  await page.close();
}
await browser.close();
console.log(bad ? `${bad} level(s) failed` : 'all levels won in the browser');
process.exit(bad ? 1 : 0);
