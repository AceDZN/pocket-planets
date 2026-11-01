// Small authoring helpers shared by levels 2–5 and 10–14: decor and route points by latitude/longitude.

import type { V3 } from '../core/vec';
import { type BodyRef, type Decor, type Spot, surf } from '../core/level';

/** A decor prop standing on a body's surface. */
export function deco(model: string, b: BodyRef, lat: number, lon: number, size = 1, extra: Partial<Decor> = {}): Decor {
  const s = surf(b.center, b.radius, lat, lon);
  return { model, pos: s.pos, up: s.up, size, ...extra };
}

/** A spot on (or above) a body's surface. */
export const at = (b: BodyRef, lat: number, lon: number, alt = 0): Spot => surf(b.center, b.radius, lat, lon, alt);

/** A route waypoint on a body's surface (where Nuri's centre stands). */
export const wp = (b: BodyRef, lat: number, lon: number, alt = 0.4): V3 => surf(b.center, b.radius, lat, lon, alt).pos;
