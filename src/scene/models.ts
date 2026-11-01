import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { glowTexture, labelTexture } from './textures';

// Tripo GLBs (public/models, see ASSETS.md) with procedural fallbacks so every level renders even before a model
// loads. Models are dressing only: they never collide and never show geographic state.

export interface ModelEntry { file: string; heightM?: number; forward?: string; rigged?: boolean; clips?: Record<string, string>; yawOffsetRad?: number; notes?: string }

const loaded = new Map<string, GLTF>();
let manifest: Record<string, ModelEntry> = {};

export async function loadModels(names: string[], onProgress?: (f: number) => void): Promise<void> {
  try {
    const res = await fetch('./models/manifest.json');
    if (res.ok) manifest = await res.json();
  } catch { manifest = {}; }
  const loader = new GLTFLoader();
  const want = names.filter((n) => manifest[n]?.file && !loaded.has(n));
  let done = 0;
  await Promise.all(want.map(async (n) => {
    try {
      const g = await loader.loadAsync(`./models/${manifest[n].file}`);
      g.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      loaded.set(n, g);
    } catch (e) { console.warn('model failed', n, e); }
    onProgress?.(++done / want.length);
  }));
}

export const hasModel = (n: string): boolean => loaded.has(n);
export const modelEntry = (n: string): ModelEntry | undefined => manifest[n];
export const gltf = (n: string): GLTF | undefined => loaded.get(n);

/** Clone a loaded model scaled so its largest extent (or height for characters) is `size`, base at y = 0. */
export function cloneModel(n: string, size: number, byHeight = false): THREE.Object3D | null {
  const g = loaded.get(n);
  if (!g) return null;
  const inner = SkeletonUtils.clone(g.scene);
  const box = new THREE.Box3().setFromObject(inner);
  const dim = box.getSize(new THREE.Vector3());
  const s = size / (byHeight ? dim.y : Math.max(dim.x, dim.y, dim.z) || 1);
  inner.scale.setScalar(s);
  inner.position.y = -box.min.y * s;
  const yaw = manifest[n]?.yawOffsetRad ?? 0;
  if (yaw) inner.rotation.y = yaw;
  const outer = new THREE.Group();
  outer.add(inner);
  outer.userData.inner = inner;
  return outer;
}

const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

function fallback(n: string, size: number, label?: string): THREE.Object3D {
  const g = new THREE.Group();
  const s = size;
  switch (n) {
    case 'launch_pad': {
      g.add(mesh(new THREE.CylinderGeometry(0.5 * s, 0.56 * s, 0.22 * s, 32), std('#3a4766', { metalness: 0.6, roughness: 0.35 }), 0, 0.11 * s));
      g.add(mesh(new THREE.CylinderGeometry(0.4 * s, 0.4 * s, 0.05 * s, 32), std('#e8eef8', { metalness: 0.3, emissive: '#5ad0ff', emissiveIntensity: 0.25 }), 0, 0.24 * s));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.add(mesh(new THREE.BoxGeometry(0.08 * s, 0.1 * s, 0.16 * s), std('#ffcf33', { emissive: '#ffae00', emissiveIntensity: 0.6 }), Math.cos(a) * 0.5 * s, 0.2 * s, Math.sin(a) * 0.5 * s));
      }
      break;
    }
    case 'crate': {
      g.add(mesh(new THREE.BoxGeometry(s * 0.9, s * 0.9, s * 0.9), std('#e0e6ee', { metalness: 0.4, roughness: 0.4 }), 0, s * 0.45));
      g.add(mesh(new THREE.BoxGeometry(s * 0.94, s * 0.18, s * 0.94), std('#ff7a2a'), 0, s * 0.45));
      break;
    }
    case 'seed_pod': {
      g.add(mesh(new THREE.CylinderGeometry(0.22 * s, 0.26 * s, 0.12 * s, 20), std('#8a6a4a'), 0, 0.06 * s));
      const glass = mesh(new THREE.SphereGeometry(0.3 * s, 24, 16), std('#bff4ff', { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1 }), 0, 0.38 * s);
      g.add(glass);
      const sprout = new THREE.Group();
      sprout.name = 'sprout';
      sprout.add(mesh(new THREE.CylinderGeometry(0.02 * s, 0.03 * s, 0.32 * s, 6), std('#4ab84a'), 0, 0.28 * s));
      sprout.add(mesh(new THREE.SphereGeometry(0.08 * s, 10, 8), std('#6ad85a'), 0.07 * s, 0.42 * s).translateX(0));
      sprout.add(mesh(new THREE.SphereGeometry(0.07 * s, 10, 8), std('#6ad85a'), -0.07 * s, 0.38 * s));
      g.add(sprout);
      break;
    }
    case 'debris': {
      const body = mesh(new THREE.CylinderGeometry(0.22 * s, 0.26 * s, 0.7 * s, 10), std('#b8bcc6', { metalness: 0.7, roughness: 0.4 }), 0, 0.35 * s);
      body.rotation.z = 0.6;
      g.add(body);
      g.add(mesh(new THREE.BoxGeometry(0.5 * s, 0.03 * s, 0.24 * s), std('#2a3a8a', { metalness: 0.5 }), 0.25 * s, 0.5 * s));
      break;
    }
    case 'part': {
      g.add(mesh(new THREE.BoxGeometry(0.5 * s, 0.35 * s, 0.35 * s), std('#ffcf33', { metalness: 0.5 }), 0, 0.2 * s));
      g.add(mesh(new THREE.CylinderGeometry(0.06 * s, 0.06 * s, 0.4 * s, 8), std('#e0e6ee'), 0, 0.5 * s));
      break;
    }
    case 'crater': {
      const ring = mesh(new THREE.TorusGeometry(0.5 * s, 0.09 * s, 8, 40), std('#8a8a92', { roughness: 1 }), 0, 0);
      ring.rotation.x = Math.PI / 2;
      ring.scale.z = 0.5;
      g.add(ring);
      const floor = mesh(new THREE.CircleGeometry(0.48 * s, 32), std('#6a6a72', { roughness: 1 }), 0, 0.01);
      floor.rotation.x = -Math.PI / 2;
      g.add(floor);
      break;
    }
    case 'flag': {
      g.add(mesh(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 1.4 * s), std('#e0e0e0', { metalness: 0.7 }), 0, 0.7 * s));
      g.add(mesh(new THREE.BoxGeometry(0.6 * s, 0.38 * s, 0.01 * s), std('#ff7a2a'), 0.3 * s, 1.2 * s));
      break;
    }
    case 'rock': {
      const m = mesh(new THREE.DodecahedronGeometry(0.5 * s, 0), std('#7a7068', { roughness: 1, flatShading: true }), 0, 0.3 * s);
      m.scale.set(1, 0.7, 0.85);
      g.add(m);
      break;
    }
    case 'crystal': case 'ice_crystal': {
      const col = n === 'ice_crystal' ? '#bfe8ff' : '#b07aff';
      for (let i = 0; i < 5; i++) {
        const h = (0.5 + (i % 3) * 0.25) * s;
        const c = mesh(new THREE.ConeGeometry(0.12 * s, h, 6), std(col, { emissive: col, emissiveIntensity: 0.35, roughness: 0.15, transparent: true, opacity: 0.85 }), Math.cos(i * 1.3) * 0.15 * s, h / 2, Math.sin(i * 1.3) * 0.15 * s);
        c.rotation.z = Math.cos(i * 2.1) * 0.35;
        c.rotation.x = Math.sin(i * 2.1) * 0.35;
        g.add(c);
      }
      break;
    }
    case 'rover': {
      g.add(mesh(new THREE.BoxGeometry(0.9 * s, 0.3 * s, 0.6 * s), std('#e8e8ee', { metalness: 0.4 }), 0, 0.42 * s));
      for (const [x, z] of [[-0.35, -0.32], [0.35, -0.32], [-0.35, 0.32], [0.35, 0.32], [0, -0.32], [0, 0.32]]) {
        const w = mesh(new THREE.CylinderGeometry(0.13 * s, 0.13 * s, 0.1 * s, 12), std('#333'), x * s, 0.14 * s, z * s);
        w.rotation.x = Math.PI / 2;
        g.add(w);
      }
      g.add(mesh(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 0.5 * s), std('#ccc'), 0.3 * s, 0.8 * s));
      g.add(mesh(new THREE.BoxGeometry(0.18 * s, 0.12 * s, 0.14 * s), std('#ccc'), 0.3 * s, 1.08 * s));
      break;
    }
    case 'satellite': case 'satellite_gps': {
      g.add(mesh(new THREE.BoxGeometry(0.5 * s, 0.5 * s, 0.5 * s), std(n === 'satellite' ? '#ffcf33' : '#e0e6ee', { metalness: 0.7, roughness: 0.3 }), 0, 0.25 * s));
      g.add(mesh(new THREE.BoxGeometry(1.6 * s, 0.03 * s, 0.4 * s), std('#2a4ac8', { metalness: 0.5, roughness: 0.3 }), 0, 0.25 * s));
      const dish = mesh(new THREE.SphereGeometry(0.22 * s, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), std('#f0f0f0', { side: THREE.DoubleSide }), 0, 0.62 * s);
      g.add(dish);
      break;
    }
    case 'comet': {
      const body = mesh(new THREE.IcosahedronGeometry(0.5 * s, 1), std('#9aa4b4', { flatShading: true, roughness: 0.9 }), 0, 0.5 * s);
      g.add(body);
      for (const x of [-0.17, 0.17]) {
        g.add(mesh(new THREE.SphereGeometry(0.14 * s, 12, 8), std('#ffffff'), x * s, 0.62 * s, 0.42 * s));
        g.add(mesh(new THREE.SphereGeometry(0.065 * s, 10, 8), std('#111'), x * s, 0.62 * s, 0.54 * s));
      }
      const tail = mesh(new THREE.ConeGeometry(0.4 * s, 1.8 * s, 16, 1, true), std('#bfeaff', { transparent: true, opacity: 0.45, emissive: '#7ad8ff', emissiveIntensity: 0.6, side: THREE.DoubleSide, depthWrite: false }), 0, 0.5 * s, -1.2 * s);
      tail.rotation.x = -Math.PI / 2;
      g.add(tail);
      g.userData.tick = (t: number) => { body.rotation.y = Math.sin(t * 2) * 0.3; g.position.y += 0; };
      break;
    }
    case 'tree': {
      g.add(mesh(new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 0.6 * s, 8), std('#7a5230'), 0, 0.3 * s));
      g.add(mesh(new THREE.IcosahedronGeometry(0.42 * s, 1), std('#3fa04a', { flatShading: true }), 0, 0.85 * s));
      break;
    }
    case 'sapling': {
      g.add(mesh(new THREE.CylinderGeometry(0.03 * s, 0.05 * s, 0.4 * s, 6), std('#7a5230'), 0, 0.2 * s));
      g.add(mesh(new THREE.IcosahedronGeometry(0.2 * s, 0), std('#6ad85a', { flatShading: true }), 0, 0.45 * s));
      break;
    }
    case 'bird': {
      const b = mesh(new THREE.SphereGeometry(0.2 * s, 10, 8), std('#f4f4f4'), 0, 0.3 * s);
      b.scale.set(1.4, 0.8, 0.8);
      g.add(b);
      g.add(mesh(new THREE.ConeGeometry(0.05 * s, 0.18 * s, 6), std('#ff9a2a'), 0.32 * s, 0.32 * s).rotateZ(-Math.PI / 2));
      g.add(mesh(new THREE.CylinderGeometry(0.015 * s, 0.015 * s, 0.4 * s), std('#e04a3a'), 0, 0.05 * s));
      break;
    }
    case 'factory': {
      g.add(mesh(new THREE.BoxGeometry(1.2 * s, 0.6 * s, 0.8 * s), std('#9a9aa6'), 0, 0.3 * s));
      g.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.15 * s, 1.2 * s, 10), std('#7a7a86'), 0.4 * s, 0.9 * s));
      break;
    }
    case 'cloud': {
      for (let i = 0; i < 5; i++) g.add(mesh(new THREE.SphereGeometry((0.3 + (i % 2) * 0.12) * s, 12, 8), std('#ffffff', { roughness: 1, transparent: true, opacity: 0.92 }), (i - 2) * 0.28 * s, 0.25 * s + (i % 2) * 0.1 * s, 0));
      break;
    }
    case 'star_beacon': {
      const core = mesh(new THREE.IcosahedronGeometry(0.4 * s, 2), std('#fff2b0', { emissive: '#ffd040', emissiveIntensity: 2 }), 0, 0.5 * s);
      g.add(core);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,220,120,1)'), blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.setScalar(2.6 * s);
      glow.position.y = 0.5 * s;
      g.add(glow);
      break;
    }
    case 'nuri': {
      g.add(mesh(new THREE.CapsuleGeometry(0.2 * s, 0.22 * s, 6, 12), std('#ff7a1f'), 0, 0.4 * s));
      g.add(mesh(new THREE.BoxGeometry(0.3 * s, 0.32 * s, 0.15 * s), std('#eef2f8'), 0, 0.45 * s, -0.2 * s));
      g.add(mesh(new THREE.SphereGeometry(0.15 * s, 16, 12), std('#f2c29a'), 0, 0.78 * s));
      g.add(mesh(new THREE.SphereGeometry(0.27 * s, 20, 14), std('#d8f2ff', { transparent: true, opacity: 0.3, roughness: 0.05 }), 0, 0.78 * s));
      break;
    }
    case 'sign': default: {
      g.add(mesh(new THREE.CylinderGeometry(0.04 * s, 0.04 * s, 1.2 * s), std('#8a6a4a'), 0, 0.6 * s));
      break;
    }
  }
  if (label) {
    const { tex, aspect } = labelTexture(label);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    sp.scale.set(0.5 * aspect, 0.5, 1);
    sp.position.y = s * 1.3 + 0.6;
    sp.renderOrder = 5;
    g.add(sp);
  }
  return g;
}

/** A Tripo model if loaded, else the procedural stand-in. */
export function makeModel(n: string, size: number, label?: string): THREE.Object3D {
  const m = cloneModel(n, size);
  if (!m) return fallback(n, size, label);
  if (label) {
    const { tex, aspect } = labelTexture(label);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
    sp.scale.set(0.5 * aspect, 0.5, 1);
    sp.position.y = size * 1.2 + 0.6;
    sp.renderOrder = 5;
    m.add(sp);
  }
  return m;
}
