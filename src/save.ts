// Local progress only (localStorage). No accounts, no network.

import type { LearnEvent } from './core/game';

export interface Save {
  stars: Record<number, number>;
  atlas: Record<number, boolean>;
  muted: boolean;
  reduced: boolean;
  log: LearnEvent[];
  daily: Record<string, number>;
}

const KEY = 'pocket-planets-v1';

export function loadSave(): Save {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { stars: s.stars ?? {}, atlas: s.atlas ?? {}, muted: !!s.muted, reduced: !!s.reduced, log: s.log ?? [], daily: s.daily ?? {} };
  } catch {
    return { stars: {}, atlas: {}, muted: false, reduced: false, log: [], daily: {} };
  }
}

export function writeSave(s: Save): void {
  try {
    s.log = s.log.slice(-400);
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* private mode: progress lives in memory only */ }
}

/** Level n is open when it's the first or the previous one has a page. */
export const unlocked = (s: Save, n: number): boolean => n === 1 || !!s.atlas[n - 1];
export const totalStars = (s: Save): number => Object.values(s.stars).reduce((a, b) => a + b, 0);
