import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { LevelRun } from '../core/game';
import { bodyCenter, boxCenter, ballCenter, zoneCenter, active, zoneOpen } from '../core/physics';
import type { Body, Box, Ball, Zone, Prop } from '../core/physics';
import type { Pad, Switch, Decor, Paint, Spot } from '../core/level';
import { fromLatLon } from '../core/vec';
import { lookFor, LOOKS, type Look } from './palette';
import { rockTexture, glowTexture, bandTexture, earthTexture, labelTexture } from './textures';
import { makeModel } from './models';

const tv = (v: { x: number; y: number; z: number }) => new THREE.Vector3(v.x, v.y, v.z);

// ---- 3D value noise for vertex colors / tiny bumps ----
function h3(x: number, y: number, z: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function n3(x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const u = s(xf), v = s(yf), w = s(zf);
  let r = 0;
  for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    r += h3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  }
  return r;
}
export function fbm3(x: number, y: number, z: number): number {
  let f = 0, a = 0.5, fr = 1;
  for (let o = 0; o < 4; o++) { f += a * n3(x * fr, y * fr, z * fr); a *= 0.5; fr *= 2.03; }
  return f;
}

function surfaceColor(look: Look, n: THREE.Vector3, world: string, sunDir: THREE.Vector3, paints: Paint[], flags: Set<string>): THREE.Color {
  const k = fbm3(n.x * 3.1 + 7, n.y * 3.1, n.z * 3.1);
  const fine = n3(n.x * 22, n.y * 22, n.z * 22);
  const c = new THREE.Color(look.ground).lerp(new THREE.Color(look.ground2), Math.min(1, Math.max(0, (k - 0.35) * 2.2)));
  c.multiplyScalar(0.88 + fine * 0.24);
  if (look.dayNight) {
    const s = n.dot(sunDir);
    const day = new THREE.Color(look.dayNight.day), night = new THREE.Color(look.dayNight.night);
    if (s > 0.12) c.lerp(day, Math.min(0.75, (s - 0.12) * 1.6) * (0.75 + fine * 0.4));
    else if (s < -0.12) c.lerp(night, Math.min(0.8, (-s - 0.12) * 1.8));
    else c.multiplyScalar(0.72);
  }
  for (const p of paints) {
    if ((p.when && !flags.has(p.when)) || (p.unless && flags.has(p.unless))) continue;
    const d = fromLatLon(p.lat, p.lon);
    const ang = (Math.acos(Math.max(-1, Math.min(1, n.x * d.x + n.y * d.y + n.z * d.z))) * 180) / Math.PI;
    const edge = p.deg * (0.85 + (k - 0.45) * 0.6);
    if (ang < edge) {
      const pc = new THREE.Color(p.color);
      if (p.kind === 'water') pc.offsetHSL(0, 0, (fine - 0.5) * 0.06);
      c.copy(pc.multiplyScalar(0.92 + fine * 0.16));
    }
  }
  return c;
}

export interface View {
  group: THREE.Group;
  update(run: LevelRun, dt: number, cam: THREE.Camera): void;
  pageObj: THREE.Object3D;
  dispose(): void;
}

function planetMesh(b: Body, world: string, sunDir: THREE.Vector3, paints: Paint[], flags: Set<string>): THREE.Mesh {
  const look = lookFor(world);
  const detail = Math.min(48, Math.max(14, Math.round(b.radius * 2.4)));
  const geo = new THREE.IcosahedronGeometry(b.radius, detail);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const n = new THREE.Vector3();
  const myPaints = paints.filter((p) => p.body === b.id);
  for (let i = 0; i < pos.count; i++) {
    n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    const bump = (fbm3(n.x * 6, n.y * 6, n.z * 6) - 0.5) * Math.min(0.12, b.radius * 0.01);
    pos.setXYZ(i, n.x * (b.radius + bump), n.y * (b.radius + bump), n.z * (b.radius + bump));
    const c = surfaceColor(look, n, world, sunDir, myPaints, flags);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const tex = rockTexture(world.length);
  tex.repeat.set(6, 3);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: look.ice ? 0.35 : 0.92, metalness: 0.0, map: tex, bumpMap: tex, bumpScale: 1.2 });
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  m.castShadow = true;
  m.userData.repaint = (fl: Set<string>) => {
    const c2 = geo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
      const c = surfaceColor(look, n, world, sunDir, myPaints, fl);
      c2.setXYZ(i, c.r, c.g, c.b);
    }
    c2.needsUpdate = true;
  };
  return m;
}

function gasMesh(b: Body): THREE.Mesh {
  const cols: Record<string, string[]> = {
    jupiter: ['#e8d2b0', '#c88a5a', '#f2e6d0', '#a8603a', '#e0c098', '#d8a070'],
    saturn: ['#f0e0b0', '#d8c088', '#f6ecc8', '#c8a870'],
    uranus: ['#a8e8ee', '#90d8e0', '#b8f0f2'],
    neptune: ['#3a6ae0', '#2a52c0', '#4a80f0', '#2040a0'],
  };
  const geo = new THREE.SphereGeometry(b.radius, 96, 64);
  const mat = new THREE.MeshStandardMaterial({ map: bandTexture(cols[b.world] ?? cols.jupiter, b.world.length), roughness: 1, emissive: new THREE.Color('#2a1a10'), emissiveIntensity: 0.25 });
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  return m;
}

function boxMesh(b: Box, look: Look): THREE.Mesh {
  const w = b.half.x * 2, h = b.half.y * 2, d = b.half.z * 2;
  const r = Math.min(0.28, Math.min(w, h, d) * 0.2);
  const geo = new RoundedBoxGeometry(w, h, d, 3, r);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(b.ice ? '#dff4ff' : look.rockTop), side = new THREE.Color(b.ice ? '#9fd4ff' : look.rock);
  const tagCol: Record<string, string> = {
    metal: '#c8d0dc', lily: '#5cc46a', bird: '#f4f4f4', star: '#ffe680', cloud: '#fff6e8', panel: '#3a5ad8', gold: '#ffd24a', wood: '#a8743a',
    water: '#3a8ad8', ice: '#cfeeff', lava: '#ff6a2a', grass: '#5daa4a', sand: '#e8d08a', soil: '#7a5230', galaxy: '#9a7aff', cluster: '#ff9ad8', crystal: '#b07aff',
  };
  if (b.tag && tagCol[b.tag]) { top.set(tagCol[b.tag]); side.set(tagCol[b.tag]).multiplyScalar(0.75); }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = fbm3(x * 0.9 + b.center.x, y * 0.9 + b.center.y, z * 0.9 + b.center.z);
    const isTop = y > h / 2 - r * 1.2;
    if (!isTop && !b.tag) {
      // chunky cliff faces: push side vertices out a little (visual only; the collider stays a box)
      const s = 1 + (k - 0.5) * 0.08;
      pos.setXYZ(i, x * s, y, z * s);
    }
    const c = (isTop ? top : side).clone().multiplyScalar(0.82 + k * 0.36);
    if (!isTop && y > h / 2 - 0.7 && !b.tag) c.lerp(top, 0.35);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const tex = rockTexture(3);
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, map: b.tag ? null : tex, bumpMap: b.tag ? null : tex, bumpScale: 1.5,
    roughness: b.ice ? 0.25 : b.tag === 'metal' || b.tag === 'panel' ? 0.35 : 0.9,
    metalness: b.tag === 'metal' ? 0.6 : 0, transparent: !!b.ice || b.tag === 'water', opacity: b.tag === 'water' ? 0.78 : b.ice ? 0.92 : 1,
    emissive: new THREE.Color(({ star: '#ffb020', lava: '#ff3a00', galaxy: '#6a3aff', cluster: '#ff4aa8', crystal: '#7a3aff' } as Record<string, string>)[b.tag ?? ''] ?? '#000000'),
    emissiveIntensity: ['star', 'lava', 'galaxy', 'cluster', 'crystal'].includes(b.tag ?? '') ? 0.6 : 0,
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  const basis = new THREE.Matrix4().makeBasis(tv(b.axes[0]), tv(b.axes[1]), tv(b.axes[2]));
  m.quaternion.setFromRotationMatrix(basis);
  return m;
}

function starShape(): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.17 : 0.4;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}

function crumbMesh(): THREE.Object3D {
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(starShape(), { depth: 0.14, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
  geo.center();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#ffcf33', emissive: '#ff9a00', emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.3 }));
  m.castShadow = true;
  g.add(m);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,210,80,0.9)'), blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(1.6);
  g.add(glow);
  return g;
}

function pageTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 320;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f6e7c1'; g.fillRect(0, 0, 256, 320);
  g.strokeStyle = '#b8862e'; g.lineWidth = 10; g.strokeRect(8, 8, 240, 304);
  g.strokeStyle = '#c99a45'; g.lineWidth = 3; g.strokeRect(22, 22, 212, 276);
  const grd = g.createRadialGradient(118, 150, 10, 128, 160, 70);
  grd.addColorStop(0, '#9ad4ff'); grd.addColorStop(0.6, '#3a7ad8'); grd.addColorStop(1, '#1a3a8a');
  g.fillStyle = grd; g.beginPath(); g.arc(128, 160, 68, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#5aa84a'; g.beginPath(); g.ellipse(110, 140, 26, 18, 0.4, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(150, 185, 18, 12, -0.3, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#8a6220'; g.lineWidth = 2; g.beginPath(); g.ellipse(128, 160, 100, 30, -0.3, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#c8962e';
  for (const [x, y] of [[50, 60], [200, 70], [60, 260], [205, 255]]) { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function pageMesh(): THREE.Object3D {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.38), new THREE.MeshStandardMaterial({ map: pageTexture(), side: THREE.DoubleSide, emissive: '#ffd27a', emissiveIntensity: 0.35, roughness: 0.8 }));
  m.castShadow = true;
  g.add(m);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,220,120,0.95)'), blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(3.6);
  g.add(glow);
  const light = new THREE.PointLight('#ffd27a', 6, 7, 1.6);
  g.add(light);
  return g;
}

function checkpointMesh(): THREE.Object3D {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.8), new THREE.MeshStandardMaterial({ color: '#d9dde6', metalness: 0.7, roughness: 0.3 }));
  pole.position.y = 0.9;
  g.add(pole);
  const flagC = document.createElement('canvas'); flagC.width = 128; flagC.height = 80;
  const fg = flagC.getContext('2d')!; fg.fillStyle = '#1c2a6a'; fg.fillRect(0, 0, 128, 80); fg.fillStyle = '#ffcf33';
  fg.translate(64, 40); fg.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 11 : 26; const a = (i / 10) * Math.PI * 2 - Math.PI / 2; fg.lineTo(Math.cos(a) * r, Math.sin(a) * r); } fg.fill();
  const ft = new THREE.CanvasTexture(flagC); ft.colorSpace = THREE.SRGBColorSpace;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.47), new THREE.MeshStandardMaterial({ map: ft, side: THREE.DoubleSide }));
  flag.position.set(0.4, 1.55, 0);
  flag.name = 'flag';
  g.add(flag);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 40), new THREE.MeshStandardMaterial({ color: '#ffcf33', emissive: '#ffae00', emissiveIntensity: 0.3 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  ring.name = 'ring';
  g.add(ring);
  return g;
}

function padMesh(pad: Pad): THREE.Object3D {
  const g = new THREE.Group();
  const model = makeModel('launch_pad', 1.9);
  g.add(model);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 8, 48), new THREE.MeshStandardMaterial({ color: '#7af0ff', emissive: '#29c8ff', emissiveIntensity: 1.2 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.32;
  ring.name = 'charge';
  g.add(ring);
  if (pad.answer && LOOKS[pad.answer]) {
    // holographic preview of the world this pad stands for (as in the transfer mockup)
    const lk = LOOKS[pad.answer];
    const holo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 20), new THREE.MeshStandardMaterial({ color: lk.ground, emissive: lk.ground2, emissiveIntensity: 0.5, roughness: 0.7 }));
    holo.position.y = 1.55;
    holo.name = 'holo';
    g.add(holo);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 2.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: lk.rim, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    beam.position.y = 1.3;
    g.add(beam);
  }
  const { tex, aspect } = labelTexture(pad.labelHe);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  label.scale.set(0.62 * aspect, 0.62, 1);
  label.position.y = 2.6;
  label.renderOrder = 5;
  g.add(label);
  return g;
}

function switchMesh(s: Switch): THREE.Object3D {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.25, 32), new THREE.MeshStandardMaterial({ color: '#2a3550', metalness: 0.5, roughness: 0.4 }));
  base.position.y = 0.12;
  g.add(base);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.22, 32), new THREE.MeshStandardMaterial({ color: s.by === 'pound' ? '#ff5a3a' : '#3ad07a', emissive: s.by === 'pound' ? '#ff3a1a' : '#1aa05a', emissiveIntensity: 0.5 }));
  btn.position.y = 0.34;
  btn.name = 'btn';
  g.add(btn);
  if (s.by === 'pound') {
    const { tex, aspect } = labelTexture('⬇ הלמו!');
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    label.scale.set(0.45 * aspect, 0.45, 1);
    label.position.y = 1.7;
    label.name = 'label';
    g.add(label);
  }
  return g;
}

function zoneMesh(z: Zone): THREE.Object3D {
  const g = new THREE.Group();
  if (z.kind === 'updraft' || z.kind === 'launch') {
    const h = z.kind === 'launch' ? 3.5 : 7;
    const col = z.kind === 'launch' ? '#bfeaff' : '#e8f6ff';
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(z.radius * 0.8, z.radius, h, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    cyl.position.y = h / 2;
    cyl.name = 'plume';
    g.add(cyl);
    const vent = new THREE.Mesh(new THREE.TorusGeometry(z.radius * 0.75, 0.12, 8, 24), new THREE.MeshStandardMaterial({ color: '#4a4a55', roughness: 0.8 }));
    vent.rotation.x = Math.PI / 2;
    vent.position.y = 0.05;
    g.add(vent);
  } else if (z.kind === 'cool' || z.kind === 'warm') {
    const cool = z.kind === 'cool';
    const dome = new THREE.Mesh(new THREE.SphereGeometry(z.radius * 0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: cool ? '#8fe0ff' : '#ffb35a', transparent: true, opacity: 0.32, emissive: cool ? '#2ab0ff' : '#ff7a1a', emissiveIntensity: 0.4, depthWrite: false }));
    g.add(dome);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.1, 10), new THREE.MeshStandardMaterial({ color: '#e8eef8', metalness: 0.6 }));
    lamp.position.y = 0.55;
    g.add(lamp);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshStandardMaterial({ color: cool ? '#bff0ff' : '#ffd08a', emissive: cool ? '#3ac0ff' : '#ff9a2a', emissiveIntensity: 2 }));
    bulb.position.y = 1.2;
    g.add(bulb);
    g.add(Object.assign(new THREE.PointLight(cool ? '#7ad8ff' : '#ffa040', 5, z.radius * 2.2, 1.5), { position: new THREE.Vector3(0, 1.3, 0) }));
    const { tex, aspect } = labelTexture(cool ? '❄ קירור' : '🔥 חימום');
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    label.scale.set(0.38 * aspect, 0.38, 1);
    label.position.y = 2.0;
    g.add(label);
  } else if (z.kind === 'wind') {
    // drawn by fx streaks
  }
  return g;
}

function propMesh(p: Prop): THREE.Object3D {
  if (p.kind === 'crate') return makeModel('crate', p.radius * 2);
  if (p.kind === 'pod') return makeModel('seed_pod', p.radius * 2.4);
  if (p.kind === 'debris') return makeModel('debris', p.radius * 2.6);
  return makeModel('part', p.radius * 2.2);
}

/** Orient an object so its +Y is `up` and it yaws by deg. */
export function orient(o: THREE.Object3D, up: { x: number; y: number; z: number }, yawDeg = 0): void {
  const u = tv(up).normalize();
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), u);
  if (yawDeg) o.rotateY((yawDeg * Math.PI) / 180);
}

export function buildWorld(run: LevelRun): View {
  const group = new THREE.Group();
  const { parts, sim } = run;
  const sun = tv(parts.sunDir).normalize();
  const look = lookFor(run.def.worldId);
  const paints = parts.paint ?? [];

  const bodyObjs = new Map<string, THREE.Object3D>();
  for (const b of parts.bodies) {
    if (b.kind === 'ring') continue;
    const m = b.kind === 'gas' ? gasMesh(b) : planetMesh(b, b.world, sun, paints, sim.flags);
    m.position.copy(tv(bodyCenter(sim, b)));
    group.add(m);
    bodyObjs.set(b.id, m);
  }
  const parentPos = (id?: string) => (id ? tv(bodyCenter(sim, sim.bodies.find((b) => b.id === id)!)) : new THREE.Vector3());
  const bodyLook = (id?: string) => lookFor(id ? sim.bodies.find((b) => b.id === id)?.world ?? run.def.worldId : run.def.worldId);

  const boxObjs: [Box, THREE.Mesh][] = [];
  for (const b of sim.boxes) {
    const m = boxMesh(b, bodyLook(b.parent));
    m.position.copy(tv(boxCenter(sim, b)));
    if (b.ghost) m.visible = false;
    group.add(m);
    boxObjs.push([b, m]);
  }
  const ballObjs: [Ball, THREE.Mesh][] = [];
  for (const b of sim.balls) {
    const bl = bodyLook(b.parent);
    const geo = new THREE.IcosahedronGeometry(b.radius, Math.min(20, Math.max(6, Math.round(b.radius * 3))));
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
      const k = fbm3(n.x * 4 + b.center.x, n.y * 4, n.z * 4);
      const c = new THREE.Color(b.ice ? '#d8f0ff' : bl.rock).lerp(new THREE.Color(bl.rockTop), k * 0.8);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const tex = rockTexture(5);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, bumpMap: tex, roughness: b.ice ? 0.3 : 0.9 }));
    m.castShadow = m.receiveShadow = true;
    m.position.copy(tv(ballCenter(sim, b)));
    group.add(m);
    ballObjs.push([b, m]);
  }

  const zoneObjs: [Zone, THREE.Object3D][] = [];
  for (const z of sim.zones) {
    if (z.kind === 'water' || z.kind === 'soil' || z.kind === 'shade' || z.kind === 'kill') continue;
    const o = zoneMesh(z);
    const c = zoneCenter(sim, z);
    o.position.copy(tv(c));
    const up = z.dir && z.kind !== 'wind' ? z.dir : (() => { const g = parentPos(z.parent); return tv(c).sub(g).normalize(); })();
    orient(o, up);
    group.add(o);
    zoneObjs.push([z, o]);
  }

  const place = (o: THREE.Object3D, s: Spot, yaw = 0) => { o.position.copy(tv(s.pos)); orient(o, s.up, yaw); };

  const pageObj = pageMesh();
  place(pageObj, parts.page);
  group.add(pageObj);

  const crumbObjs = parts.crumbs.map((c) => { const o = crumbMesh(); place(o, c); group.add(o); return o; });
  const cpObjs = parts.checkpoints.map((c) => { const o = checkpointMesh(); place(o, { pos: { x: c.pos.x - c.up.x * 0.45, y: c.pos.y - c.up.y * 0.45, z: c.pos.z - c.up.z * 0.45 }, up: c.up }); group.add(o); return o; });
  const padObjs = parts.pads.map((p) => { const o = padMesh(p); place(o, { pos: { x: p.pos.x - p.up.x * 0.42, y: p.pos.y - p.up.y * 0.42, z: p.pos.z - p.up.z * 0.42 }, up: p.up }); group.add(o); return [p, o] as const; });
  const swObjs = parts.switches.map((s) => { const o = switchMesh(s); place(o, { pos: { x: s.pos.x - s.up.x * 0.42, y: s.pos.y - s.up.y * 0.42, z: s.pos.z - s.up.z * 0.42 }, up: s.up }); group.add(o); return [s, o] as const; });
  const propObjs = sim.props.map((p) => { const o = propMesh(p); group.add(o); return [p, o] as const; });
  const decorObjs: [Decor, THREE.Object3D][] = parts.decor.map((d) => {
    const o = makeModel(d.model, d.size ?? 1, d.label);
    o.position.copy(tv(d.pos)).add(parentPos(d.parent));
    orient(o, d.up, d.yawDeg ?? 0);
    group.add(o);
    return [d, o];
  });

  let lastFlags = [...sim.flags].join();
  let t = 0;
  const upTmp = new THREE.Vector3();

  return {
    group,
    pageObj,
    update(r, dt) {
      t += dt;
      const s = r.sim;
      for (const b of s.bodies) {
        const o = bodyObjs.get(b.id);
        if (o && b.motion) o.position.copy(tv(bodyCenter(s, b)));
        if (o && b.kind === 'gas') o.rotation.y += dt * 0.02;
      }
      for (const [b, m] of boxObjs) {
        m.visible = !b.ghost && active(s, b);
        if (b.motion || b.parent) m.position.copy(tv(boxCenter(s, b)));
      }
      for (const [b, m] of ballObjs) { m.visible = active(s, b); if (b.motion || b.parent) m.position.copy(tv(ballCenter(s, b))); }
      for (const [z, o] of zoneObjs) {
        o.visible = active(s, z);
        o.position.copy(tv(zoneCenter(s, z)));
        const plume = o.getObjectByName('plume') as THREE.Mesh | undefined;
        if (plume) {
          const open = zoneOpen(z, s.t);
          (plume.material as THREE.MeshBasicMaterial).opacity = open ? 0.22 + Math.sin(t * 9) * 0.05 : 0.03;
          plume.scale.y = open ? 1 : 0.2;
        }
      }
      const pageOpen = !r.parts.page.when || s.flags.has(r.parts.page.when);
      pageObj.visible = !r.pageTaken && pageOpen;
      pageObj.children[0].rotation.y = t * 1.4;
      pageObj.children[0].position.y = 0.25 + Math.sin(t * 2) * 0.12;
      crumbObjs.forEach((o, i) => { o.visible = !r.crumbs[i]; o.children[0].rotation.y = t * 2.2 + i; o.children[0].position.y = Math.sin(t * 2.5 + i) * 0.1; });
      cpObjs.forEach((o, i) => {
        const on = r.sim.player.checkpoint.pos.x === r.parts.checkpoints[i].pos.x && r.sim.player.checkpoint.pos.z === r.parts.checkpoints[i].pos.z;
        const ring = o.getObjectByName('ring') as THREE.Mesh;
        (ring.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 1.6 + Math.sin(t * 5) * 0.4 : 0.15;
        const flag = o.getObjectByName('flag')!;
        flag.rotation.y = Math.sin(t * 3) * 0.15;
      });
      for (const [p, o] of padObjs) {
        const on = !p.when || s.flags.has(p.when);
        o.visible = on;
        const holo = o.getObjectByName('holo');
        if (holo) holo.rotation.y += dt * 0.8;
        const ring = o.getObjectByName('charge') as THREE.Mesh;
        const ch = (r.padCharge[p.id] ?? 0) / 0.7;
        ring.scale.setScalar(1 + ch * 0.25 + Math.sin(t * 4) * 0.03);
        (ring.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + ch * 3;
      }
      for (const [sw, o] of swObjs) {
        o.visible = !sw.when || s.flags.has(sw.when);
        const btn = o.getObjectByName('btn')!;
        btn.position.y = r.usedSwitches.has(sw.id) ? 0.2 : 0.34;
        const lab = o.getObjectByName('label');
        if (lab) lab.visible = !r.usedSwitches.has(sw.id);
      }
      for (const [p, o] of propObjs) {
        o.visible = p.alive;
        o.position.copy(tv(p.pos));
        const g = r.sim.player;
        if (p.carried) orient(o, g.up);
        else if (!p.motion) {
          upTmp.copy(tv(p.pos));
          // orient to the nearest body for resting props
          let best = Infinity, bc = new THREE.Vector3();
          for (const b of s.bodies) { const c = tv(bodyCenter(s, b)); const d = c.distanceTo(upTmp) - b.radius; if (d < best) { best = d; bc = c; } }
          orient(o, upTmp.clone().sub(bc).normalize());
        } else o.rotation.x += dt * 0.7;
      }
      for (const [d, o] of decorObjs) {
        const vis = (!d.when || s.flags.has(d.when)) && (!d.unless || !s.flags.has(d.unless));
        o.visible = vis;
        if (d.parent) o.position.copy(tv(d.pos)).add(parentPos(d.parent));
        o.userData.tick?.(t, dt);
      }
      const fl = [...s.flags].join();
      if (fl !== lastFlags) {
        lastFlags = fl;
        for (const o of bodyObjs.values()) o.userData.repaint?.(s.flags);
      }
    },
    dispose() {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
    },
  };
}

export { tv };
