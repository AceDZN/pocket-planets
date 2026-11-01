// Heat, cold and the conditions for life. Pure: the HUD thermometer and the seed pod read these.

import { V3, dot, len, sub } from './vec';
import { type Sim, rayBlocked, zoneCenter, active } from './physics';
import { WORLDS, type WorldProfile } from './worlds';

export const SUIT_MAX_C = 150;
export const SUIT_MIN_C = -60;

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface HeatSample { c: number; sun: number; shade: boolean; zone: 'cool' | 'warm' | null }

/**
 * Surface temperature where Nuri stands. The Sun's height (dot of "up" with the Sun direction) sets day, night and
 * the twilight band in between; a rock between you and the Sun casts shade. Worlds with thick air (נוגה) have the same
 * temperature by day and by night, because the greenhouse air spreads and keeps the heat.
 */
export function temperatureAt(sim: Sim, w: WorldProfile, p: V3, up: V3, sunDir: V3): HeatSample {
  let zone: HeatSample['zone'] = null;
  for (const z of sim.zones) {
    if (!active(sim, z) || (z.kind !== 'cool' && z.kind !== 'warm')) continue;
    if (len(sub(p, zoneCenter(sim, z))) < z.radius) zone = z.kind;
  }
  const sun = dot(up, sunDir);
  const shade = sun > 0 && w.dayC !== w.nightC && rayBlocked(sim, p, sunDir, 30, undefined);
  // shade under a high Sun is mild (the rock and ground around still glow), not as cold as the night side
  const f = shade ? Math.min(0.4, smooth(-0.2, 0.45, sun)) : smooth(-0.2, 0.45, sun);
  return { c: w.nightC + (w.dayC - w.nightC) * f, sun, shade, zone };
}

/**
 * The suit meter: −1 frozen … 0 comfy … +1 overheated. Outside the suit's range it climbs with the excess; inside it
 * relaxes. Cool / warm stations push it back fast. Returns the new value.
 */
export function suitStep(meter: number, s: HeatSample, dt: number): number {
  let m = meter;
  if (s.c > SUIT_MAX_C) m += (0.07 + 0.15 * Math.min(1.5, (s.c - SUIT_MAX_C) / 400)) * dt;
  else if (s.c < SUIT_MIN_C) m -= (0.07 + 0.15 * Math.min(1.5, (SUIT_MIN_C - s.c) / 200)) * dt;
  else m -= Math.sign(m) * Math.min(Math.abs(m), 0.45 * dt);
  if (s.zone === 'cool' && m > 0) m = Math.max(0, m - 1.6 * dt);
  if (s.zone === 'warm' && m < 0) m = Math.min(0, m + 1.6 * dt);
  return Math.max(-1, Math.min(1, m));
}

export type Need = 'air' | 'water' | 'warmth';
export interface LifeCheck { ok: boolean; have: Record<Need, boolean>; reasonHe: string }

/** What is missing, said about this world: Venus has air (thick and unbreathable), Mars has air (too thin). */
function needHe(k: Need, w: WorldProfile): string {
  if (k === 'air') {
    return w.air === 'none' ? 'אין כאן אטמוספרה בכלל'
      : w.air === 'thin' ? 'האטמוספרה כאן דלילה מאוד ולא מתאימה לחיים'
      : w.air === 'thick' && w.id !== 'earth' ? 'יש כאן אטמוספרה סמיכה, אבל היא לא מתאימה לחיים'
      : 'האטמוספרה כאן לא מתאימה לחיים';
  }
  return k === 'water' ? 'אין כאן מים נוזליים (הידרוספרה)' : 'חם מדי או קר מדי';
}

/**
 * Can the seed pod bloom here? Workbook's three conditions for life: a suitable temperature, liquid water and an
 * atmosphere that supports life. Liquid water needs a water zone and a temperature between 0 and 100 °C.
 */
export function lifeCheck(sim: Sim, worldId: string, p: V3, tempC: number): LifeCheck {
  const w = WORLDS[worldId];
  const inZone = (k: 'water') => sim.zones.some((z) => z.kind === k && active(sim, z) && len(sub(p, zoneCenter(sim, z))) < z.radius);
  const have: Record<Need, boolean> = {
    air: w.id === 'earth',
    water: w.spheres.hydro && inZone('water') && tempC > 0 && tempC < 100,
    warmth: tempC >= 5 && tempC <= 40,
  };
  const missing = (Object.keys(have) as Need[]).filter((k) => !have[k]);
  return { ok: missing.length === 0, have, reasonHe: missing.map((k) => needHe(k, w)).join(' · ') };
}
