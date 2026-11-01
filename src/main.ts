import '@fontsource/rubik/400.css';
import '@fontsource/rubik/700.css';
import '@fontsource/rubik/900.css';
import './style.css';
import * as THREE from 'three';
import { LEVELS } from './levels/index';
import { startLevel, tick, describe, restartLevel, useHint, stars, currentWorld, type LevelRun, type GameEvent } from './core/game';
import { makeBot, botInput, type Bot } from './core/bot';
import { WORLDS, gameGravityFactor } from './core/worlds';
import type { Input } from './core/physics';
import { initHost, postToHost, parseLevelParam } from './host';
import { initInput, pollControls, setInputEnabled } from './input';
import { initAudio, sfx, setMuted, setAir, playAmbient } from './audio';
import { loadSave, writeSave, unlocked, type Save } from './save';
import { buildWorld, type View, tv } from './scene/world';
import { buildSky, type SkyView } from './scene/sky';
import { CameraRig } from './scene/camera';
import { NuriView } from './scene/player';
import { Fx } from './scene/fx';
import { buildMap, type MapView } from './scene/map';
import { loadModels } from './scene/models';
import { lookFor } from './scene/palette';
import { Hud } from './ui/hud';
import { titleScreen, mapOverlay, winCard, pausePanel, atlasPanel, guessCard, dailyEndCard, el } from './ui/screens';
import { dailyKey, dailyPlan, mysteryDef, guessFeedbackHe, dailyScore, dailyStreak, type DailyPlan } from './core/daily';
import type { LevelDef } from './core/level';

const SLUG = 'pocket-planets';
initHost(SLUG);

const app = document.getElementById('app')!;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ui = document.getElementById('ui')!;
if ('ontouchstart' in window || matchMedia('(pointer: coarse)').matches) app.classList.add('is-touch');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 2000);
const rig = new CameraRig(camera);
const save: Save = loadSave();
if (matchMedia('(prefers-reduced-motion: reduce)').matches && !localStorage.getItem('pocket-planets-v1')) save.reduced = true;
app.classList.toggle('reduced', save.reduced);
setMuted(save.muted);

type Mode = 'loading' | 'title' | 'map' | 'play' | 'won' | 'paused' | 'atlas';
let mode: Mode = 'loading';
let run: LevelRun | null = null;
let scene = new THREE.Scene();
let world: View | null = null;
let sky: SkyView | null = null;
let nuri: NuriView | null = null;
let fx: Fx | null = null;
let map: MapView | null = null;
let hud: Hud | null = null;
let overlay: HTMLElement | null = null;
let mapCur = 1;
let bot: Bot | null = null;
let manualTime = false;
let levelT0 = 0;
let readyPosted = false;
let fromDeepLink = false;
let introEl: HTMLElement | null = null;
let winTimer = 0;
let fpsAcc = 0, fpsN = 0, fps = 0;
let camFill: THREE.DirectionalLight | null = null;
/** Daily comet run in progress (null in the story path). Daily levels post nothing to the host and save no pages. */
let daily: { plan: DailyPlan; i: number; t0: number; firstTry: number; crumbs: number; tries: number } | null = null;

function resize(): void {
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  if (map) { map.camera.aspect = camera.aspect; map.camera.updateProjectionMatrix(); }
}
new ResizeObserver(resize).observe(app);

function setOverlay(e: HTMLElement | null): void {
  overlay?.remove();
  overlay = e;
  if (e) ui.appendChild(e);
}

function clearScene(): void {
  introEl?.remove();
  introEl = null;
  world?.dispose();
  scene = new THREE.Scene();
  world = null; sky = null; nuri = null; fx = null;
}

// ---------------- level ----------------

function openLevel(n: number, opts: { deep?: boolean; def?: LevelDef } = {}): void {
  const def = opts.def ?? LEVELS[n - 1];
  if (!def) return;
  clearScene();
  run = startLevel(def);
  if (bot) bot = makeBot(); // autoplay carries on into the next level with a fresh route
  buildLevelScene();
  mode = 'play';
  setOverlay(null);
  setInputEnabled(true);
  if (!hud) hud = new Hud(ui, { pause: () => togglePause(), mute: () => toggleMute(), hint: () => doHint(), atlas: () => openAtlas() });
  hud.show(true);
  hud.setMuted(save.muted);
  hud.start(run);
  levelT0 = performance.now();
  winTimer = 0;
  showIntro(def.introHe, def.titleHe, def.hideName ? '???' : undefined);
  setAir(WORLDS[def.worldId].air);
  playAmbient(def.worldId);
  render();
  if (!readyPosted) { postToHost({ type: 'ready' }); readyPosted = true; }
  if (!daily) postToHost({ type: 'level-start', level: n });
  fromDeepLink = !!opts.deep;
}

function buildLevelScene(): void {
  if (!run) return;
  const look = lookFor(run.def.worldId);
  sky = buildSky(run.parts, run.def.worldId, scene);
  scene.add(new THREE.HemisphereLight(look.rim, look.ambient, 1.1));
  scene.add(new THREE.AmbientLight('#ffffff', 0.35));
  camFill = new THREE.DirectionalLight('#dfe8ff', 0.75);
  scene.add(camFill, camFill.target);
  world = buildWorld(run);
  scene.add(world.group);
  nuri = new NuriView();
  scene.add(nuri.root);
  fx = new Fx();
  fx.dustColor.set(look.ground).lerp(new THREE.Color('#ffffff'), 0.35);
  fx.airDrag = { none: 0, thin: 0.6, normal: 1.6, thick: 3 }[WORLDS[run.def.worldId].air];
  scene.add(fx.group);
  // face the page from the spawn
  const p = run.sim.player;
  p.facing = (() => {
    const d = tv(run!.parts.page.pos).sub(tv(p.pos));
    const up = tv(p.up);
    d.addScaledVector(up, -d.dot(up));
    if (d.lengthSq() < 1e-4) return p.facing;
    d.normalize();
    return { x: d.x, y: d.y, z: d.z };
  })();
  rig.reset(run.sim);
  rig.lookToward(run.parts.page.pos, p.pos);
}

function showIntro(lines: string[], title: string, shown?: string): void {
  introEl?.remove();
  const b = el(`<div class="banner"><span class="t">${shown ?? title}<span class="s">${run?.def.n ?? ''} / ${LEVELS.length}</span></span></div>`);
  ui.appendChild(b);
  setTimeout(() => b.remove(), 2700);
  introEl = el(`<div class="intro card">${lines.map((l) => `<div>${l}</div>`).join('')}</div>`);
  ui.appendChild(introEl);
  const it = introEl;
  setTimeout(() => { it.style.opacity = '0'; setTimeout(() => it.remove(), 600); }, 9000 + lines.join('').length * 40);
}

function onEvents(evs: GameEvent[]): void {
  if (!run || !nuri || !fx || !hud) return;
  const p = run.sim.player;
  const up = tv(p.up);
  const pos = tv(p.pos).addScaledVector(up, -0.38);
  const gf = gameGravityFactor(WORLDS[currentWorld(run)]);
  for (const e of evs) {
    switch (e.type) {
      case 'jump': sfx.jump(gf); nuri.impulse('jump'); fx.puffDust(pos, up, 8, gf * 22); if (introEl) introEl.style.opacity = '0.0'; break;
      case 'puff': sfx.puff(); nuri.impulse('puff'); fx.jet(tv(p.pos).addScaledVector(up, 0.1), up); break;
      case 'land': { const s = (e as { apex?: number }).apex ?? 0; sfx.land(s); nuri.impulse('land', s); fx.puffDust(pos, up, Math.min(26, 6 + Math.round(s * 2)), gf * 22); break; }
      case 'pound': sfx.click(); break;
      case 'pound-land': sfx.pound(); nuri.impulse('pound'); fx.ring(pos, up, '#ffe9a0'); fx.puffDust(pos, up, 30, gf * 22); rig.shake(0.35); break;
      case 'crumb': { const i = Number(e.id); sfx.crumb(i); hud.crumb(i); fx.sparkle(tv(run.parts.crumbs[i].pos), up); break; }
      case 'page': sfx.page(); hud.page(); fx.sparkle(tv(run.parts.page.pos), up, 60); break;
      case 'checkpoint': sfx.checkpoint(); break;
      case 'launch': sfx.launch(); fx.ring(pos, up, '#bfeaff'); break;
      case 'hop': sfx.launch(); fx.ring(pos, up, '#7af0ff'); rig.reset(run.sim); break;
      case 'pad': sfx.launch(); break;
      case 'wrong-pad': sfx.wrong(); rig.shake(0.3); break;
      case 'cloud-fall': sfx.fall(); rig.reset(run.sim); break;
      case 'lost': sfx.fall(); rig.reset(run.sim); break;
      case 'overheat': sfx.sizzle(); rig.reset(run.sim); break;
      case 'freeze': sfx.crackle(); rig.reset(run.sim); break;
      case 'hot-warning': sfx.sizzle(); break;
      case 'cold-warning': sfx.crackle(); break;
      case 'too-heavy': sfx.heavy(); rig.shake(0.15); break;
      case 'pickup': sfx.pickup(); break;
      case 'throw': sfx.throw(); break;
      case 'switch': sfx.switch(); fx.ring(pos, up, '#7af07a'); break;
      case 'bloom': sfx.bloom(); fx.sparkle(e.at ? tv(e.at) : pos, up, 60); break;
      case 'wilt': sfx.wilt(); break;
      case 'objective': if (e.he) hud.setObjective(e.he); break;
      case 'reveal': if (e.he) hud.revealName(e.he); break;
      case 'bump': sfx.heavy(); rig.shake(0.25); fx.sparkle(pos, up, 12); break;
      case 'burn': sfx.sizzle(); if (e.at) { fx.sparkle(tv(e.at), up, 40); fx.ring(tv(e.at), up, '#ff9a3a'); } break;
      case 'respawn': rig.reset(run.sim); break;
      case 'won': onWon(); break;
    }
  }
  // heat / cold particles
  if (run.meter > 0.3 && Math.random() < run.meter * 0.6) fx.steam(pos, up);
  if (run.meter < -0.3 && Math.random() < -run.meter * 0.6) fx.ice(pos, up);
}

function onWon(): void {
  if (!run || !hud) return;
  introEl?.remove();
  introEl = null;
  const n = run.def.n;
  const st = stars(run);
  if (daily) {
    daily.crumbs += run.crumbs.filter(Boolean).length;
    save.log.push(...run.log);
    writeSave(save);
    sfx.win();
    mode = 'won';
    winTimer = 1.6;
    return;
  }
  save.stars[n] = Math.max(save.stars[n] ?? 0, st);
  save.atlas[n] = true;
  save.log.push(...run.log);
  writeSave(save);
  if (run.def.hideName) hud.revealName(run.def.titleHe);
  sfx.win();
  mode = 'won';
  winTimer = 2.2;
  postToHost({ type: 'level-complete', level: n, stars: st, durationMs: Math.max(1, Math.round(performance.now() - levelT0)) });
}

function showWinCard(): void {
  if (!run) return;
  if (daily) { showGuess(); return; }
  const def = run.def;
  const last = def.n >= LEVELS.length;
  setOverlay(winCard(def, stars(run), run.crumbs.filter(Boolean).length, () => openLevel(def.n + 1), () => openLevel(def.n), () => openMap(def.n), last));
}

function togglePause(): void {
  if (!run) return;
  if (mode === 'play') {
    mode = 'paused';
    run.paused = true;
    setInputEnabled(false);
    setOverlay(pausePanel(save.muted, save.reduced, !!run.def.noHints, {
      resume: () => togglePause(),
      restart: () => { if (run) { const keep = run; run = restartLevel(keep); clearScene(); buildLevelScene(); hud?.start(run); mode = 'play'; setOverlay(null); setInputEnabled(true); if (!daily) postToHost({ type: 'level-start', level: run.def.n }); levelT0 = performance.now(); } },
      map: () => openMap(run?.def.n ?? 1),
      hint: () => { togglePause(); doHint(); },
      mute: (m) => { save.muted = m; setMuted(m); hud?.setMuted(m); writeSave(save); },
      reduced: (r) => { save.reduced = r; app.classList.toggle('reduced', r); writeSave(save); },
    }));
  } else if (mode === 'paused') {
    mode = 'play';
    run.paused = false;
    setInputEnabled(true);
    setOverlay(null);
  }
}

function toggleMute(): void { save.muted = !save.muted; setMuted(save.muted); hud?.setMuted(save.muted); writeSave(save); }
function doHint(): void { if (run && mode === 'play') useHint(run); }
function openAtlas(): void {
  const prev = mode;
  if (run && mode === 'play') { run.paused = true; setInputEnabled(false); }
  mode = 'atlas';
  setOverlay(atlasPanel(LEVELS, save, () => {
    setOverlay(null);
    if (prev === 'map') openMap(mapCur);
    else { mode = prev === 'atlas' ? 'play' : prev; if (run) { run.paused = false; setInputEnabled(true); } if (mode !== 'play') openMap(mapCur); }
  }));
}

// ---------------- daily comet ----------------

function startDaily(): void {
  daily = { plan: dailyPlan(dailyKey(), LEVELS), i: 0, t0: performance.now(), firstTry: 0, crumbs: 0, tries: 0 };
  openDailyStage();
}

function openDailyStage(): void {
  if (!daily) return;
  const st = daily.plan.stages[daily.i];
  daily.tries = 0;
  openLevel(st.level, { def: mysteryDef(LEVELS[st.level - 1]) });
}

function showGuess(): void {
  if (!daily) return;
  const d = daily;
  const st = d.plan.stages[d.i];
  setOverlay(guessCard(d.i + 1, st.options.map((id) => ({ id, he: WORLDS[id].he })), (id) => {
    d.tries++;
    if (id !== st.world) { sfx.wrong(); return guessFeedbackHe(st.world, id); }
    if (d.tries === 1) d.firstTry++;
    sfx.page();
    if (run) hud?.revealName(WORLDS[st.world].he);
    d.i++;
    if (d.i < d.plan.stages.length) openDailyStage();
    else finishDaily();
    return null;
  }));
}

function finishDaily(): void {
  if (!daily) return;
  const d = daily;
  const score = dailyScore(d.firstTry, d.crumbs);
  save.daily[d.plan.key] = Math.max(save.daily[d.plan.key] ?? 0, score);
  writeSave(save);
  setOverlay(dailyEndCard(score, save.daily[d.plan.key], dailyStreak(save.daily), d.firstTry, d.crumbs, (performance.now() - d.t0) / 1000, () => startDaily(), () => openMap()));
}

// ---------------- map / title ----------------

function openMap(cur?: number): void {
  daily = null;
  clearScene();
  run = null;
  hud?.show(false);
  mode = 'map';
  setInputEnabled(false);
  if (!map) map = buildMap(LEVELS);
  resize();
  if (cur) mapCur = cur;
  else { let n = 1; while (n < LEVELS.length && save.atlas[n]) n++; mapCur = n; }
  map.setCurrent(mapCur);
  map.focusWorld(LEVELS[mapCur - 1].worldNo);
  refreshMapOverlay();
}

function refreshMapOverlay(): void {
  setOverlay(mapOverlay(LEVELS, save, mapCur, {
    play: (n) => { initAudio(); openLevel(n); },
    tab: (w) => { const first = LEVELS.find((l) => l.worldNo === w && unlocked(save, l.n)); map?.focusWorld(w); if (first) { mapCur = first.n; map?.setCurrent(mapCur); } refreshMapOverlay(); map?.focusWorld(w); },
    select: (n) => { mapCur = n; map?.setCurrent(n); refreshMapOverlay(); },
    atlas: () => openAtlas(),
    back: () => openTitle(),
    daily: () => { initAudio(); startDaily(); },
  }));
}

function openTitle(): void {
  openMap();
  mode = 'title';
  setOverlay(titleScreen(() => { initAudio(); openMap(); }, Object.keys(save.atlas).length > 0, () => { initAudio(); startDaily(); }));
}

function updateMapLabels(): void {
  if (!map || !overlay) return;
  const labels = overlay.querySelectorAll<HTMLElement>('.nlabel');
  const w = app.clientWidth, h = app.clientHeight;
  labels.forEach((lab) => {
    const n = Number(lab.dataset.n);
    const p = map!.nodes[n - 1].clone();
    // the badge hangs under its world, so Nuri can stand on top of the current one (visual target 04)
    p.y -= n === 11 || n === 12 ? 1.5 : 1.05;
    p.project(map!.camera);
    lab.style.left = `${((p.x + 1) / 2) * w}px`;
    lab.style.top = `${((1 - p.y) / 2) * h}px`;
    lab.style.display = p.z < 1 && p.x > -1.2 && p.x < 1.2 ? '' : 'none';
  });
}

// ---------------- loop ----------------

function currentInput(dt: number): { input: Input; camDX: number; camDY: number } {
  const c = pollControls();
  for (const u of c.ui) {
    if (u === 'pause') { if (mode === 'atlas') { setOverlay(null); mode = 'play'; if (run) run.paused = false; setInputEnabled(true); } else togglePause(); }
    if (u === 'mute') toggleMute();
    if (u === 'hint') doHint();
    if (u === 'atlas' && (mode === 'play' || mode === 'map')) openAtlas();
    if (u === 'restart' && mode === 'play' && run) { run = restartLevel(run); clearScene(); buildLevelScene(); hud?.start(run); if (!daily) postToHost({ type: 'level-start', level: run.def.n }); levelT0 = performance.now(); }
    if (u === 'blur' && mode === 'play' && !manualTime && !bot && document.hidden) togglePause();
  }
  if (c.jumpPressed || c.actionPressed) initAudio();
  if (bot && run) return { input: botInput(run, run.def.route, bot, dt), camDX: 0, camDY: 0 };
  return {
    input: { move: rig.moveVector(c.stick), jumpHeld: c.jumpHeld, jumpPressed: c.jumpPressed, poundPressed: c.poundPressed, actionPressed: c.actionPressed },
    camDX: c.camDX, camDY: c.camDY,
  };
}

function stepFrame(dt: number): void {
  if ((mode === 'map' || mode === 'title' || (mode === 'atlas' && !run)) && map) {
    map.update(dt);
    updateMapLabels();
    return;
  }
  if (!run) return;
  const { input, camDX, camDY } = currentInput(dt);
  if (mode === 'play' || mode === 'won') {
    const evs = tick(run, input, dt);
    onEvents(evs);
  }
  if (mode === 'won') {
    winTimer -= dt;
    if (winTimer <= 0 && !overlay) showWinCard();
  }
  rig.update(run.sim, dt, camDX, camDY, save.reduced);
  nuri?.update(run.sim.player, dt, run.meter, run.status === 'won');
  world?.update(run, dt, camera);
  fx?.update(dt);
  sky?.follow(camera, rig.up, tv(run.sim.player.pos));
  if (camFill) { camFill.position.copy(camera.position).addScaledVector(rig.up, 4); camFill.target.position.copy(tv(run.sim.player.pos)); }
  hud?.update(run, dt);
}

function render(): void {
  if ((mode === 'map' || mode === 'title' || (mode === 'atlas' && !run)) && map) renderer.render(map.scene, map.camera);
  else renderer.render(scene, camera);
}

let last = performance.now();
function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 1) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
  if (manualTime || mode === 'loading') return;
  stepFrame(dt);
  render();
}

// ---------------- test hooks ----------------

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (ms: number) => void;
    __game: unknown;
  }
}

window.render_game_to_text = () => JSON.stringify({ mode, fps, ...(daily ? { daily: daily.i + 1 } : {}), ...(run ? describe(run) : { mapLevel: mapCur }) });
window.advanceTime = (ms: number) => {
  manualTime = true;
  const n = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < n; i++) if (mode !== 'paused') stepFrame(1 / 60);
  render();
};
window.__game = {
  openLevel: (n: number) => openLevel(n),
  openMap: (n?: number) => openMap(n),
  autoplay: (n?: number) => { if (n) openLevel(n); bot = makeBot(); return true; },
  stopAutoplay: () => { bot = null; },
  botState: () => bot,
  run: () => run,
  realtime: () => { manualTime = false; },
  resume: () => { if (mode === 'paused') togglePause(); },
  levels: LEVELS.map((l) => ({ n: l.n, slug: l.slug, title: l.titleHe })),
  daily: () => { startDaily(); return daily?.plan; },
  dailyState: () => daily && { i: daily.i, firstTry: daily.firstTry, crumbs: daily.crumbs },
};

// ---------------- boot ----------------

renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setOverlay(el('<div class="screen dim"><div class="panel card"><h2>הגרפיקה נעצרה</h2><div>מנסים להחזיר אותה…</div></div></div>')); });
renderer.domElement.addEventListener('webglcontextrestored', () => { if (run) openLevel(run.def.n); else openMap(mapCur); });

async function boot(): Promise<void> {
  initInput(canvas, ui);
  resize();
  const loading = el('<div class="loading"><div><div>כוכבים בכיס…</div><div class="bar"><i></i></div></div></div>');
  ui.appendChild(loading);
  await loadModels(['nuri', 'comet', 'launch_pad', 'satellite', 'satellite_gps', 'rover', 'seed_pod', 'crystal', 'ice_crystal', 'debris', 'crate', 'rock', 'tree'], (f) => { (loading.querySelector('.bar i') as HTMLElement).style.width = `${f * 100}%`; });
  try { await document.fonts.load('700 20px Rubik'); } catch { /* fallback font */ }
  loading.remove();
  const deep = parseLevelParam(location.search, LEVELS.length);
  if (deep !== null) {
    openLevel(deep + 1, { deep: true });
  } else {
    openTitle();
    render();
    postToHost({ type: 'ready' });
    readyPosted = true;
  }
  requestAnimationFrame(frame);
}
void boot();
void fromDeepLink;
