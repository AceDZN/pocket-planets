// Tiny 3D vector helpers for the pure simulation (no Three.js in src/core).

export interface V3 { x: number; y: number; z: number }

export const v3 = (x = 0, y = 0, z = 0): V3 => ({ x, y, z });
export const clone = (a: V3): V3 => ({ x: a.x, y: a.y, z: a.z });
export const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scale = (a: V3, s: number): V3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
export const addScaled = (a: V3, b: V3, s: number): V3 => ({ x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s });
export const dot = (a: V3, b: V3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
export const len = (a: V3): number => Math.hypot(a.x, a.y, a.z);
export const dist = (a: V3, b: V3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const norm = (a: V3, fallback: V3 = { x: 0, y: 1, z: 0 }): V3 => {
  const l = len(a);
  return l > 1e-9 ? scale(a, 1 / l) : clone(fallback);
};
export const lerp = (a: V3, b: V3, t: number): V3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
/** a with its component along unit n removed. */
export const tangent = (a: V3, n: V3): V3 => addScaled(a, n, -dot(a, n));

/** Rotate v around unit axis k by angle (Rodrigues). */
export function rotateAxis(v: V3, k: V3, angle: number): V3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  const kv = cross(k, v);
  const kd = dot(k, v) * (1 - c);
  return { x: v.x * c + kv.x * s + k.x * kd, y: v.y * c + kv.y * s + k.y * kd, z: v.z * c + kv.z * s + k.z * kd };
}

/** Any unit vector perpendicular to unit n. */
export function perpendicular(n: V3): V3 {
  const a = Math.abs(n.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0);
  return norm(cross(a, n));
}

/** Unit direction from latitude/longitude in degrees (+y = north pole, lon 0 = +z, lon 90 = +x). */
export function fromLatLon(latDeg: number, lonDeg: number): V3 {
  const la = (latDeg * Math.PI) / 180, lo = (lonDeg * Math.PI) / 180;
  return { x: Math.cos(la) * Math.sin(lo), y: Math.sin(la), z: Math.cos(la) * Math.cos(lo) };
}

/** A deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
