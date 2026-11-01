// Daily comet run ("השביט היומי"): Shvitton drops Nuri on three authored worlds picked by today's date, with the
// world's name and the jump number hidden. After each page the player names the world from what they felt and saw
// (jump height, the Sun's size, air, heat). The worlds are authored levels whose routes the bot already wins, so every
// daily run is solvable; only the labels change.

import type { LevelDef } from './level';
import { WORLDS, gameGravityFactor } from './worlds';
import { rng } from './vec';

export interface DailyStage {
  level: number;
  world: string;
  /** Three world ids in display order, one of them `world`. */
  options: string[];
}

export interface DailyPlan { key: string; stages: DailyStage[] }

/** Local calendar date as YYYY-MM-DD (a class playing together shares the same run). */
export function dailyKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function seedOf(key: string): number {
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Worlds a player can tell apart by feel: a single named body, not the artificial or cosmic stages. */
export function dailyEligible(levels: LevelDef[]): LevelDef[] {
  return levels.filter((l) => {
    const w = WORLDS[l.worldId];
    return w && !l.transfer && !l.hideName && w.kind !== 'artificial' && w.kind !== 'cosmic' && l.n !== levels.length;
  });
}

const GUESSABLE = ['moon', 'mercury', 'venus', 'earth', 'mars', 'asteroid', 'europa', 'io', 'ganymede', 'ring', 'enceladus', 'triton', 'miranda'];

/** A distractor must differ in something the player can sense: jump height, the Sun's size, or air. */
export function distinguishable(a: string, b: string): boolean {
  const A = WORLDS[a], B = WORLDS[b];
  const ga = gameGravityFactor(A), gb = gameGravityFactor(B);
  return Math.max(ga, gb) / Math.min(ga, gb) > 1.35 || Math.max(A.au, B.au) / Math.min(A.au, B.au) > 1.8 || A.air !== B.air;
}

export function dailyPlan(key: string, levels: LevelDef[]): DailyPlan {
  const r = rng(seedOf(key));
  const pool = dailyEligible(levels).slice();
  const stages: DailyStage[] = [];
  const used = new Set<string>();
  while (stages.length < 3 && pool.length) {
    const def = pool.splice(Math.floor(r() * pool.length), 1)[0];
    if (used.has(def.worldId)) continue;
    used.add(def.worldId);
    const others = GUESSABLE.filter((w) => w !== def.worldId && distinguishable(w, def.worldId));
    const options = [def.worldId];
    while (options.length < 3 && others.length) options.push(others.splice(Math.floor(r() * others.length), 1)[0]);
    for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
    stages.push({ level: def.n, world: def.worldId, options });
  }
  stages.sort((a, b) => a.level - b.level);
  return { key, stages };
}

/** The level as played in the daily run: name hidden, jump number hidden, the world's name scrubbed from the text. */
export function mysteryDef(def: LevelDef): LevelDef {
  const bare = WORLDS[def.worldId].he.replace(/^ה/, '');
  // "בירח" → "בעולם הזה", "והירח" → "והעולם הזה", "כספית" → "העולם הזה"
  const re = new RegExp(`([בלמו]?)ה?${bare}`, 'g');
  const scrub = (s: string) => s.replace(re, (_, p: string) => (p && p !== 'ו' ? `${p}עולם הזה` : `${p}העולם הזה`));
  return {
    ...def,
    hideName: true,
    transfer: true,
    introHe: ['שביטון זרק אתכם לעולם מסתורי!', 'הרגישו את הקפיצה, הביטו בשמש ובשמיים, ומצאו את דף האטלס.', 'בסוף תצטרכו לנחש: איפה הייתם?'],
    objectiveHe: scrub(def.objectiveHe),
    hintsHe: def.hintsHe.map(scrub),
  };
}

/** The comic explanation after a wrong guess: what that world would have felt like, compared with this one. */
export function guessFeedbackHe(actual: string, guess: string): string {
  const A = WORLDS[actual], G = WORLDS[guess];
  const fmt = (x: number) => (x < 9.95 ? x.toFixed(1).replace(/\.0$/, '') : String(Math.round(x)));
  const ja = 1 / gameGravityFactor(A), jg = 1 / gameGravityFactor(G);
  const bits: string[] = [];
  if (Math.max(ja, jg) / Math.min(ja, jg) > 1.35) bits.push(`ב${G.he} קופצים פי <bdi class="n">${fmt(jg)}</bdi> מכדור הארץ, וכאן קפצתם פי <bdi class="n">${fmt(ja)}</bdi>.`);
  if (Math.max(A.au, G.au) / Math.min(A.au, G.au) > 1.8) bits.push(G.au < A.au ? `ב${G.he} השמש נראית גדולה יותר, כי שם קרובים יותר אליה.` : `ב${G.he} השמש נראית קטנה יותר, כי שם רחוקים יותר ממנה.`);
  if (A.air !== G.air) bits.push(G.air === 'none' ? `ל${G.he} אין אוויר בכלל.` : `ל${G.he} יש אוויר${G.air === 'thick' ? ' סמיך' : G.air === 'thin' ? ' דליל' : ''}.`);
  return `שביטון מתגלגל מצחוק והזנב שלו מסתבך! ${bits[0] ?? ''} ${bits[1] ?? ''} נסו שוב.`.trim();
}

/** Comet score: 1 per first-try guess plus 1 per star crumb (max 12). */
export function dailyScore(firstTry: number, crumbs: number): number { return firstTry + crumbs; }

/** Consecutive days played, ending today or yesterday. */
export function dailyStreak(played: Record<string, number>, today = new Date()): number {
  let n = 0;
  const d = new Date(today);
  if (!(dailyKey(d) in played)) d.setDate(d.getDate() - 1);
  while (dailyKey(d) in played) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
