// The route bot: replays a level's authored solution through the same Input the keyboard and touch controls feed.
// Tests use it to prove each level is solvable with the real physics; the browser autoplay uses it for the host test.

import { V3, sub, len, norm, tangent, dot, scale, addScaled } from './vec';
import { boxCenter, ballCenter } from './physics';
import type { Input } from './physics';
import type { LevelRun } from './game';
import type { RouteStep } from './level';
import { tick, startLevel } from './game';
import type { LevelDef } from './level';

export interface Bot { i: number; jumped: boolean; airT: number; puffed: boolean; pounded: boolean; acted: boolean; waitT: number; stepT: number; failed: string | null; prevJump: boolean }

export const makeBot = (): Bot => ({ i: 0, jumped: false, airT: 0, puffed: false, pounded: false, acted: false, waitT: 0, stepT: 0, failed: null, prevJump: false });

function resolve(run: LevelRun, to: V3 | string): { pos: V3; done?: boolean } | null {
  if (typeof to !== 'string') return { pos: to };
  if (to === 'page') return { pos: run.parts.page.pos, done: run.pageTaken };
  if (to.startsWith('crumb:')) {
    const k = Number(to.slice(6));
    return { pos: run.parts.crumbs[k].pos, done: run.crumbs[k] };
  }
  const pad = run.parts.pads.find((p) => p.id === to);
  if (pad) return { pos: pad.pos };
  const pr = run.sim.props.find((p) => p.id === to);
  if (pr) return { pos: pr.pos, done: run.sim.player.carrying === pr.id };
  const sw = run.parts.switches.find((s) => s.id === to);
  if (sw) return { pos: sw.pos, done: run.usedSwitches.has(sw.id) };
  if (to.startsWith('top:')) {
    const b = run.sim.boxes.find((x) => x.id === to.slice(4));
    if (b) return { pos: addScaled(boxCenter(run.sim, b), b.axes[1], b.half.y + 0.4) };
  }
  if (to.startsWith('ball:')) {
    const b = run.sim.balls.find((x) => x.id === to.slice(5));
    if (b) { const c = ballCenter(run.sim, b); const up = norm(sub(c, run.sim.player.pos)); return { pos: addScaled(c, up, -b.radius) }; }
  }
  const cp = run.parts.checkpoints.find((_, i) => `cp:${i}` === to);
  if (cp) return { pos: cp.pos };
  return null;
}

export function botInput(run: LevelRun, route: RouteStep[], bot: Bot, dt: number): Input {
  const input: Input = { move: { x: 0, y: 0, z: 0 }, jumpHeld: false, jumpPressed: false, poundPressed: false, actionPressed: false };
  const st = route[bot.i];
  if (!st || bot.failed) return input;
  const p = run.sim.player;
  const tgt = resolve(run, st.to);
  if (!tgt) { bot.failed = `step ${bot.i}: unknown target ${String(st.to)}`; return input; }
  bot.stepT += dt;
  if (bot.stepT > (st.timeout ?? 25)) { bot.failed = `step ${bot.i}: timeout`; return input; }

  const d = tangent(sub(tgt.pos, p.pos), p.up);
  const dist = len(d);
  const near = st.near ?? 0.8;
  const kind = st.jump ?? 'none';
  const jumpAt = st.jumpAt ?? 2.5;

  if (!p.grounded) bot.airT += dt; else if (bot.jumped && bot.airT > 0.05) bot.airT = 0;

  const arrived = tgt.done || (dist < near && p.grounded && (kind === 'none' || bot.jumped));
  if (!arrived) {
    const slow = kind === 'none' || bot.jumped ? Math.min(1, dist / 1.2 + 0.15) : 1;
    input.move = dist > 0.05 ? scale(norm(d), slow) : input.move;
    if (kind !== 'none' && !bot.jumped && p.grounded && dist <= jumpAt) {
      input.jumpPressed = true; input.jumpHeld = true; bot.jumped = true; bot.airT = 0; bot.prevJump = true;
      return input;
    }
    if (bot.jumped && !p.grounded) {
      const vn = dot(p.vel, p.up);
      input.jumpHeld = kind !== 'tap' || bot.airT < 0.06;
      if (kind === 'tap' && bot.airT >= 0.06) input.jumpHeld = false;
      if (kind === 'puff' && !bot.puffed && vn <= 0.2 && bot.airT > 0.15) {
        // release, then press again for the jet puff
        if (bot.prevJump) { input.jumpHeld = false; bot.prevJump = false; return input; }
        input.jumpPressed = true; input.jumpHeld = true; bot.puffed = true;
      }
      if (st.pound && !bot.pounded && dist < 0.7) { input.poundPressed = true; bot.pounded = true; }
    }
    // landed short of the target after a jump: allow another try on the same step
    if (bot.jumped && p.grounded && bot.airT === 0 && dist > near && kind !== 'none' && bot.stepT > 0.3) {
      bot.jumped = false; bot.puffed = false; bot.pounded = false;
    }
    return input;
  }

  if (st.pound && !bot.pounded) {
    // pound on arrival: hop then pound
    if (p.grounded && !bot.jumped) { input.jumpPressed = true; input.jumpHeld = true; bot.jumped = true; return input; }
    if (!p.grounded) { input.poundPressed = true; bot.pounded = true; return input; }
    return input;
  }
  if (st.action && !bot.acted) { input.actionPressed = true; bot.acted = true; return input; }
  if (st.until && !run.sim.flags.has(st.until)) return input;
  if ((st.wait ?? 0) > bot.waitT) { bot.waitT += dt; return input; }
  bot.i++;
  Object.assign(bot, { jumped: false, airT: 0, puffed: false, pounded: false, acted: false, waitT: 0, stepT: 0, prevJump: false });
  return input;
}

export interface SolveResult { won: boolean; t: number; failed: string | null; respawns: number; stars: number; step: number }

/** Run a level headless with its route (or a given one). */
export function solve(def: LevelDef, route: RouteStep[] = def.route, maxT = def.routeTimeout ?? 180, dt = 1 / 60): SolveResult {
  const run = startLevel(def);
  const bot = makeBot();
  let t = 0;
  while (t < maxT && run.status !== 'won' && !bot.failed) {
    tick(run, botInput(run, route, bot, dt), dt);
    t += dt;
    if (bot.i >= route.length && (run.status as string) !== 'won') { bot.failed = 'route ended without a win'; break; }
  }
  return { won: run.status === 'won', t, failed: bot.failed, respawns: run.respawns, stars: run.crumbs.filter(Boolean).length, step: bot.i };
}
