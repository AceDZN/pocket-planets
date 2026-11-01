// Shared helpers for levels 6–9 and 15–18: surface spots, decor, sea kill caps, tokens and pads.

import { V3, addScaled, fromLatLon } from '../core/vec';
import { type BodyRef, type Decor, type Spot, type Switch, type Pad, type RouteStep, surf } from '../core/level';
import type { Zone, Prop } from '../core/physics';

/** A standing spot (player centre) at lat/lon, `alt` above the ground. */
export const spot = (b: BodyRef, lat: number, lon: number, alt = 0.45): Spot => surf(b.center, b.radius, lat, lon, alt);

/** A decor model on the ground (absolute position: the body must not move). */
export function deco(model: string, b: BodyRef, lat: number, lon: number, size = 1, alt = 0, extra: Partial<Decor> = {}): Decor {
  const s = surf(b.center, b.radius, lat, lon, alt);
  return { model, pos: s.pos, up: s.up, size, ...extra };
}

/** Decor on a spot (box tops etc.). */
export const decoAt = (model: string, s: Spot, size = 1, extra: Partial<Decor> = {}): Decor => ({ model, pos: s.pos, up: s.up, size, ...extra });

/**
 * A kill cap for a sea / void patch: a sphere zone whose top sits `top` above the ground at the patch centre and
 * that still swallows a standing player (centre 0.42 up) out to `capDeg` from the centre. Anything standing on a
 * box whose top is above `top` + 0.1 is safe everywhere.
 */
export function seaKill(id: string, b: BodyRef, lat: number, lon: number, capDeg: number, top: number, sayHe: string, extra: Partial<Zone> = {}): Zone {
  if (top < 0.55) throw new Error(`seaKill ${id}: top must clear a standing player (≥ 0.55)`);
  const R = b.radius, h = 0.42, c = Math.cos((capDeg * Math.PI) / 180);
  const s = ((R + top) ** 2 - (R + h) ** 2) / (2 * ((R + top) - (R + h) * c));
  return { id, kind: 'kill', center: addScaled(b.center, fromLatLon(lat, lon), s), radius: R + top - s, sayHe, ...extra };
}

/** A zone centred `alt` above the ground (water, soil, updraft, launch…). */
export function zoneAt(id: string, kind: Zone['kind'], b: BodyRef, lat: number, lon: number, alt: number, radius: number, extra: Partial<Zone> = {}): Zone {
  return { id, kind, center: surf(b.center, b.radius, lat, lon, alt).pos, radius, ...extra };
}

export const touch = (id: string, s: Spot, sets: string, sayHe?: string, radius = 1.2, when?: string): Switch =>
  ({ id, pos: s.pos, up: s.up, radius, by: 'touch', sets, sayHe, when });

export const pound = (id: string, s: Spot, sets: string, sayHe?: string, radius = 1.4, when?: string): Switch =>
  ({ id, pos: s.pos, up: s.up, radius, by: 'pound', sets, sayHe, when });

export const deliver = (id: string, s: Spot, prop: string, sets: string, sayHe?: string, radius = 1.6, when?: string): Switch =>
  ({ id, pos: s.pos, up: s.up, radius, by: 'deliver', prop, sets, sayHe, when });

export const pad = (id: string, s: Spot, labelHe: string, kind: Pad['kind'], extra: Partial<Pad> = {}): Pad =>
  ({ id, pos: s.pos, up: s.up, labelHe, kind, ...extra });

/** Put a prop back where it started (wilted pods, spare parts). */
export function sendHome(p: Prop): void {
  p.pos = { ...p.home };
  p.vel = { x: 0, y: 0, z: 0 };
  p.resting = true;
  p.carried = false;
  p.alive = true;
}

export const near = (a: V3, b: V3, r: number): boolean => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < r;

/** Angle in degrees between two directions from a body centre. */
export function angleDeg(b: BodyRef, p: V3, lat: number, lon: number): number {
  const d = fromLatLon(lat, lon);
  const x = p.x - b.center.x, y = p.y - b.center.y, z = p.z - b.center.z;
  const l = Math.hypot(x, y, z) || 1;
  return (Math.acos(Math.max(-1, Math.min(1, (x * d.x + y * d.y + z * d.z) / l))) * 180) / Math.PI;
}

/** Route steps that ride a warp pad: walk onto it, then stand still until the hop has happened. */
export const ride = (padId: string): RouteStep[] => [{ to: padId }, { to: padId, near: 1e9, wait: 1.3 }];
