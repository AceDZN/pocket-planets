import * as THREE from 'three';

// Small procedural textures (canvas), generated once at boot. Nothing is fetched at runtime.

function hash(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, s: number, period: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const w = (i: number) => ((i % period) + period) % period;
  const a = hash(w(xi), w(yi), s), b = hash(w(xi + 1), w(yi), s), c = hash(w(xi), w(yi + 1), s), d = hash(w(xi + 1), w(yi + 1), s);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, s: number, period = 8): number {
  let f = 0, amp = 0.5, fr = 1;
  for (let o = 0; o < 5; o++) { f += amp * valueNoise(x * fr, y * fr, s + o * 17, period * fr); amp *= 0.5; fr *= 2; }
  return f;
}

const cache = new Map<string, THREE.Texture>();

/** A tileable grey rock detail texture used as map multiplier and bump. */
export function rockTexture(seed = 1, size = 256): THREE.Texture {
  const key = `rock${seed}`;
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = fbm((x / size) * 8, (y / size) * 8, seed, 8);
    const speck = hash(x, y, seed + 9) > 0.985 ? -0.25 : 0;
    const v = Math.max(0, Math.min(1, 0.82 + (n - 0.5) * 0.7 + speck));
    const i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/** Soft radial glow sprite texture. */
export function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128): THREE.Texture {
  const key = `glow${inner}${outer}`;
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.55)'));
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/** A banded gas-giant texture (equirectangular). */
export function bandTexture(colors: string[], seed = 3, w = 512, h = 256): THREE.Texture {
  const key = `band${colors.join()}${seed}`;
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const cols = colors.map((x) => new THREE.Color(x));
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const wob = (fbm((x / w) * 6, (y / h) * 3, seed, 6) - 0.5) * 0.12;
    const band = (y / h + wob) * colors.length * 2.2;
    const k = ((Math.floor(band) % cols.length) + cols.length) % cols.length;
    const k2 = (k + 1) % cols.length;
    const f = band - Math.floor(band);
    const col = cols[k].clone().lerp(cols[k2], f * f);
    const n = 0.9 + fbm((x / w) * 16, (y / h) * 8, seed + 5, 16) * 0.2;
    const i = (y * w + x) * 4;
    img.data[i] = Math.min(255, col.r * 255 * n);
    img.data[i + 1] = Math.min(255, col.g * 255 * n);
    img.data[i + 2] = Math.min(255, col.b * 255 * n);
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

/** Earth-like texture for the Earth in the Moon's sky and the tiny Earths. */
export function earthTexture(w = 1024, h = 512): THREE.Texture {
  if (cache.has('earth')) return cache.get('earth')!;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const img = g.createImageData(w, h);
  const mix = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const lat = Math.abs(y / h - 0.5) * 2;
    // large continents plus finer coastline detail, so the Earth in the Moon's sky stays crisp at 30°+
    const land = fbm((x / w) * 6, (y / h) * 3, 11, 6) * 0.78 + fbm((x / w) * 32, (y / h) * 16, 7, 32) * 0.22;
    const cloud = fbm((x / w) * 12, (y / h) * 6, 23, 12) * 0.7 + fbm((x / w) * 48, (y / h) * 24, 5, 48) * 0.3;
    const depth = Math.max(0, 0.53 - land) / 0.2;
    let r = mix(70, 18, depth), gg = mix(150, 60, depth), b = mix(220, 160, depth);
    if (land > 0.53) {
      const k = (land - 0.53) / 0.2;
      const dry = lat < 0.4 ? Math.max(0, (land - 0.58) / 0.08) : 0;
      r = mix(mix(70, 120, k), 205, dry); gg = mix(mix(140, 120, k), 175, dry); b = mix(mix(60, 70, k), 110, dry);
    }
    const ice = Math.max(0, (lat - 0.8) / 0.06);
    r = mix(r, 240, ice); gg = mix(gg, 244, ice); b = mix(b, 250, ice);
    const ck = Math.max(0, Math.min(1, (cloud - 0.55) * 4));
    r = mix(r, 255, ck * 0.9); gg = mix(gg, 255, ck * 0.9); b = mix(b, 255, ck * 0.9);
    const i = (y * w + x) * 4;
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set('earth', t);
  return t;
}

/** Hebrew label sprite texture (RTL canvas text). */
export function labelTexture(text: string, bg = 'rgba(14,22,52,0.88)', fg = '#ffd75e'): { tex: THREE.Texture; aspect: number } {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  const font = '700 54px Rubik, sans-serif';
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 60;
  c.width = w; c.height = 92;
  g.font = font;
  g.direction = 'rtl';
  g.fillStyle = bg;
  const r = 40;
  g.beginPath();
  g.moveTo(r, 4); g.lineTo(w - r, 4); g.quadraticCurveTo(w - 4, 4, w - 4, 46); g.quadraticCurveTo(w - 4, 88, w - r, 88);
  g.lineTo(r, 88); g.quadraticCurveTo(4, 88, 4, 46); g.quadraticCurveTo(4, 4, r, 4); g.fill();
  g.strokeStyle = fg; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { tex: t, aspect: w / 92 };
}
