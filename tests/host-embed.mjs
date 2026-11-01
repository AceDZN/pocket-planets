// The workbook bridge in a real embed: a localhost parent page with the game in an iframe at ?level=N.
// Checks `ready` → `level-start` for the deep-linked level → `level-complete` after a real win: the route bot drives
// the game's own Input (the same path the keyboard and touch stick feed), never an injected win state. Then checks
// that a standalone page posts nothing and throws nothing.
// Needs the dev server on :5245 (or BASE=<url of a build>).  Usage: node tests/host-embed.mjs [level]
import { chromium } from 'playwright';
import { createServer } from 'node:http';

const GAME = process.env.BASE ?? 'http://localhost:5245/';
const LEVEL = Number(process.argv[2] ?? 1);
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const parent = createServer((_, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<body style="margin:0"><script>window.msgs=[];addEventListener('message',e=>msgs.push({origin:e.origin,...e.data}))</script><iframe id="g" src="${GAME}?level=${LEVEL}" style="width:100vw;height:100vh;border:0"></iframe></body>`);
}).listen(4999);
await page.goto('http://localhost:4999/');
const frame = await (await page.waitForSelector('#g')).contentFrame();
await frame.waitForFunction(() => window.__game && window.render_game_to_text, null, { timeout: 30000 });
await page.waitForFunction(() => window.msgs.some((m) => m.type === 'ready'), null, { timeout: 30000 });
const opened = JSON.parse(await frame.evaluate(() => window.render_game_to_text()));
await frame.evaluate(() => { localStorage.clear(); window.__game.autoplay(); });
await page.waitForFunction(() => window.msgs.some((m) => m.type === 'level-complete'), null, { timeout: 120000 }).catch(() => {});
const msgs = await page.evaluate(() => window.msgs);
const end = JSON.parse(await frame.evaluate(() => window.render_game_to_text()));
console.log('opened on level', opened.level, '| status', end.status, '| crumbs', end.crumbs);
console.log(msgs.map((m) => `${m.type}${m.level ? ' L' + m.level : ''}${m.stars ? ' ★' + m.stars : ''}`).join(', '));
const iReady = msgs.findIndex((m) => m.type === 'ready');
const iStart = msgs.findIndex((m) => m.type === 'level-start');
const iDone = msgs.findIndex((m) => m.type === 'level-complete');
const ok =
  msgs.every((m) => m.source === 'workbook-game' && m.slug === 'pocket-planets' && m.version === 1) &&
  iReady === 0 && iStart > iReady && msgs[iStart].level === LEVEL && opened.level === LEVEL &&
  iDone > iStart && msgs[iDone].level === LEVEL && msgs[iDone].stars >= 1 && msgs[iDone].durationMs > 0 &&
  msgs.filter((m) => m.type === 'ready').length === 1;
// standalone: no parent, nothing posted (and no errors)
const solo = await (await browser.newContext()).newPage();
const errs = [];
solo.on('pageerror', (e) => errs.push(String(e)));
await solo.goto(GAME + '?level=2');
await solo.waitForFunction(() => window.__game, null, { timeout: 30000 });
await solo.waitForTimeout(1500);
const soloLevel = JSON.parse(await solo.evaluate(() => window.render_game_to_text())).level;
console.log('standalone opened level', soloLevel);
console.log(ok && !errs.length && soloLevel === 2 ? 'bridge OK' : 'bridge FAILED', errs);
await browser.close();
parent.close();
process.exit(ok && !errs.length && soloLevel === 2 ? 0 : 1);
