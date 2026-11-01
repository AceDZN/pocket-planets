import * as THREE from 'three';
import type { LevelDef } from '../core/level';
import { lookFor } from './palette';
import { bandTexture, earthTexture, glowTexture } from './textures';
import { makeModel } from './models';

// The level-select map: a miniature solar system path from the Sun (right, where Hebrew reading starts) out to the
// galaxy (left). Each node is a little world; the DOM draws numbers, stars and padlocks over them.

export interface MapView {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  nodes: THREE.Vector3[];
  focusWorld(w: number): void;
  setCurrent(n: number): void;
  update(dt: number): void;
}

function nodeMesh(def: LevelDef): THREE.Object3D {
  const id = def.worldId;
  const r = id === 'jupiter' || id === 'saturn' ? 1.3 : def.worldNo === 3 && def.n === 13 ? 1.1 : 0.85;
  let mat: THREE.Material;
  if (def.n === 11) mat = new THREE.MeshStandardMaterial({ map: bandTexture(['#e8d2b0', '#c88a5a', '#f2e6d0', '#a8603a'], 4), roughness: 1 });
  else if (def.n === 12) mat = new THREE.MeshStandardMaterial({ map: bandTexture(['#f0e0b0', '#d8c088', '#f6ecc8', '#c8a870'], 6), roughness: 1 });
  else if (def.n === 13) mat = new THREE.MeshStandardMaterial({ map: bandTexture(['#3a6ae0', '#2a52c0', '#4a80f0'], 9), roughness: 1 });
  else if (def.worldNo === 2 || def.n === 15) mat = new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.8 });
  else mat = new THREE.MeshStandardMaterial({ color: lookFor(id).ground, roughness: 0.9, emissive: lookFor(id).ground2, emissiveIntensity: 0.15 });
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(def.n === 11 ? 1.5 : def.n === 12 ? 1.3 : r, 40, 28), mat);
  g.add(m);
  if (def.n === 12) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.6, 64), new THREE.MeshBasicMaterial({ color: '#e8d6a8', transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.rotation.x = 1.25;
    g.add(ring);
  }
  if (def.worldNo === 4 && def.n >= 16) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(def.n === 17 ? 'rgba(200,160,255,1)' : 'rgba(255,230,160,1)'), blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.setScalar(3.4);
    g.add(sp);
    m.scale.setScalar(0.6);
  }
  return g;
}

export function buildMap(levels: LevelDef[]): MapView {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#03051a');
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 600);
  scene.add(new THREE.AmbientLight('#8090c0', 0.9));
  const sunLight = new THREE.PointLight('#fff0d0', 900, 0, 1.6);
  sunLight.position.set(34, 0, 0);
  scene.add(sunLight);
  const fill = new THREE.DirectionalLight('#9ab0ff', 0.8);
  fill.position.set(-10, 10, 20);
  scene.add(fill);

  // stars + nebula glow
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(3000 * 3);
  for (let i = 0; i < 3000; i++) sp.set([(Math.random() - 0.5) * 300, (Math.random() - 0.5) * 180, -40 - Math.random() * 120], i * 3);
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.3, sizeAttenuation: false, color: '#dfe6ff' })));
  for (const [x, y, c, s] of [[-40, 16, 'rgba(160,120,255,0.5)', 60], [10, -20, 'rgba(80,120,255,0.35)', 70], [-10, 22, 'rgba(255,120,200,0.25)', 50]] as const) {
    const n = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(c), blending: THREE.AdditiveBlending, depthWrite: false }));
    n.position.set(x, y, -60);
    n.scale.set(s * 1.6, s, 1);
    scene.add(n);
  }
  // the Sun at the right edge
  const sun = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 32), new THREE.MeshBasicMaterial({ map: bandTexture(['#ffd060', '#ff9a20', '#ffe080', '#ff7a10', '#ffc040'], 11) }));
  sun.userData.spin = 0.03;
  sun.position.set(38, -2, -6);
  scene.add(sun);
  const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,170,60,0.9)'), blending: THREE.AdditiveBlending, depthWrite: false }));
  corona.scale.setScalar(52);
  corona.position.copy(sun.position);
  scene.add(corona);
  // the galaxy at the far left
  const gal = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(220,190,255,0.95)'), blending: THREE.AdditiveBlending, depthWrite: false }));
  gal.scale.set(26, 11, 1);
  gal.position.set(-50, 9, -14);
  scene.add(gal);

  // path: a gentle S from the Sun outward
  const nodes: THREE.Vector3[] = [];
  const xs = levels.map((_, i) => 24 - i * 4.1);
  levels.forEach((def, i) => {
    const x = xs[i];
    const y = Math.sin(i * 0.62) * 3.2 + (def.worldNo === 3 ? 1.2 : 0);
    const z = Math.cos(i * 0.9) * 1.6;
    const v = new THREE.Vector3(x, y, z);
    nodes.push(v);
    const m = nodeMesh(def);
    m.position.copy(v);
    m.userData.spin = 0.2 + (i % 3) * 0.1;
    m.name = `node${def.n}`;
    scene.add(m);
  });
  const curve = new THREE.CatmullRomCurve3(nodes);
  const dots = curve.getSpacedPoints(260);
  const dg = new THREE.BufferGeometry().setFromPoints(dots);
  scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: '#ffd760', size: 4, sizeAttenuation: false })));
  // asteroid belt between the rocky worlds and the giants
  const belt = new THREE.Group();
  for (let i = 0; i < 70; i++) {
    const r = makeModel('rock', 0.3 + Math.random() * 0.5);
    r.position.set(-14 + (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 6);
    r.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    belt.add(r);
  }
  scene.add(belt);

  const marker = makeModel('nuri', 1.4);
  scene.add(marker);
  const comet = makeModel('comet', 2.8);
  comet.position.set(4, 4.6, 4);
  comet.rotation.y = -0.35;
  // a key light of its own so Shvitton's face reads against the dark sky
  const cometKey = new THREE.SpotLight('#fff4e0', 60, 14, 0.5, 0.6);
  cometKey.position.set(0, 1.5, 6);
  cometKey.target = comet;
  comet.add(cometKey);
  scene.add(comet);

  let focusX = 14, t = 0, cur = 1;
  return {
    scene, camera, nodes,
    focusWorld(w) {
      const ids = levels.filter((l) => l.worldNo === w).map((l) => l.n - 1);
      focusX = (nodes[ids[0]].x + nodes[ids[ids.length - 1]].x) / 2;
    },
    setCurrent(n) { cur = n; },
    update(dt) {
      t += dt;
      camera.position.x += (focusX - camera.position.x) * (1 - Math.exp(-4 * dt));
      camera.position.y = 1.5;
      camera.position.z = 23;
      camera.lookAt(camera.position.x, 0.5, 0);
      for (const o of scene.children) if (o.userData.spin) o.rotation.y += dt * o.userData.spin;
      const p = nodes[cur - 1];
      marker.position.set(p.x, p.y + 0.8 + Math.abs(Math.sin(t * 3)) * 0.2, p.z);
      marker.rotation.y = Math.sin(t) * 0.4;
      marker.userData.mixer?.update(dt);
      // Shvitton hovers in the upper middle of the frame, mocking, with the stolen page (visual target 04)
      comet.position.y = 2.9 + Math.sin(t * 1.3) * 0.35;
      comet.position.x = camera.position.x + 3 + Math.sin(t * 0.4) * 1.5;
      comet.userData.tick?.(t, dt);
    },
  };
}
