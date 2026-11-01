import * as THREE from 'three';
import type { LevelParts } from '../core/level';
import { WORLDS, sunAngularRadiusDeg, sunLight } from '../core/worlds';
import { lookFor } from './palette';
import { glowTexture, bandTexture, earthTexture } from './textures';

// The sky: stars, the Sun's disc at its authoritative apparent size, big neighbours, and a per-world sky gradient.

const SKY_R = 400;

function skyDome(world: string): THREE.Mesh {
  const look = lookFor(world);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { top: { value: new THREE.Color(look.sky) }, hor: { value: new THREE.Color(look.skyHorizon) }, up: { value: new THREE.Vector3(0, 1, 0) } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 up; varying vec3 vDir; void main(){ float h = dot(vDir, up); float k = smoothstep(-0.25, 0.6, h); gl_FragColor = vec4(mix(hor, top, k), 1.0); }',
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(SKY_R, 32, 16), mat);
  m.renderOrder = -10;
  m.name = 'dome';
  return m;
}

function stars(count: number, seed = 7): THREE.Points {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = Math.sqrt(1 - u * u);
    pos.set([Math.cos(th) * rr * SKY_R * 0.95, u * SKY_R * 0.95, Math.sin(th) * rr * SKY_R * 0.95], i * 3);
    const warm = r();
    const c = new THREE.Color().setHSL(warm > 0.7 ? 0.08 : 0.6, 0.5, 0.75 + r() * 0.25);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false });
  const p = new THREE.Points(geo, mat);
  p.renderOrder = -9;
  return p;
}

function sunSprite(au: number): THREE.Group {
  const g = new THREE.Group();
  const D = SKY_R * 0.8;
  const angR = (sunAngularRadiusDeg(au) * Math.PI) / 180;
  const disc = Math.max(D * Math.tan(angR) * 2, 2.2);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,252,235,1)', 'rgba(255,240,200,0)'), depthWrite: false, fog: false }));
  core.scale.setScalar(disc * 1.25);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,200,110,0.55)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo.scale.setScalar(disc * 4 + 20);
  g.add(halo, core);
  g.userData.D = D;
  g.renderOrder = -8;
  return g;
}

function skyBody(kind: string, sizeDeg: number): THREE.Object3D {
  const D = SKY_R * 0.7;
  const r = D * Math.tan((sizeDeg * Math.PI) / 360);
  const g = new THREE.Group();
  let mat: THREE.Material;
  if (kind === 'earth') mat = new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.8, emissive: '#0a1a3a', emissiveIntensity: 0.4, fog: false });
  else if (kind === 'jupiter') mat = new THREE.MeshStandardMaterial({ map: bandTexture(['#e8d2b0', '#c88a5a', '#f2e6d0', '#a8603a', '#e0c098', '#d8a070'], 4), roughness: 1, fog: false, emissive: '#201008', emissiveIntensity: 0.3 });
  else if (kind === 'saturn') mat = new THREE.MeshStandardMaterial({ map: bandTexture(['#f0e0b0', '#d8c088', '#f6ecc8', '#c8a870'], 6), roughness: 1, fog: false, emissive: '#201808', emissiveIntensity: 0.3 });
  else if (kind === 'uranus') mat = new THREE.MeshStandardMaterial({ map: bandTexture(['#a8e8ee', '#90d8e0', '#b8f0f2'], 8), roughness: 1, fog: false, emissive: '#0a2a30', emissiveIntensity: 0.4 });
  else if (kind === 'neptune') mat = new THREE.MeshStandardMaterial({ map: bandTexture(['#3a6ae0', '#2a52c0', '#4a80f0', '#2040a0'], 9), roughness: 1, fog: false, emissive: '#0a1440', emissiveIntensity: 0.5 });
  else if (kind === 'mars') mat = new THREE.MeshStandardMaterial({ color: '#c4562a', roughness: 1, fog: false });
  else if (kind === 'moon') mat = new THREE.MeshStandardMaterial({ color: '#b0b0b8', roughness: 1, fog: false });
  else {
    // galaxy / cluster: glowing spiral sprites
    const n = kind === 'cluster' ? 9 : 1;
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(i % 2 ? 'rgba(200,170,255,0.9)' : 'rgba(255,220,180,0.9)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      sp.scale.set(r * 2.2, r * 0.9, 1);
      if (n > 1) sp.position.set((Math.cos(i * 2.4) * r) * 1.4, Math.sin(i * 1.7) * r * 0.9, 0);
      g.add(sp);
    }
    return g;
  }
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), mat);
  g.add(m);
  if (kind === 'saturn' || kind === 'uranus') {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.3, r * 2.2, 96), new THREE.MeshBasicMaterial({ color: kind === 'saturn' ? '#e8d6a8' : '#9ad0d8', transparent: true, opacity: kind === 'saturn' ? 0.75 : 0.25, side: THREE.DoubleSide, fog: false }));
    ring.rotation.x = kind === 'saturn' ? Math.PI / 2.6 : 0.2;
    g.add(ring);
  }
  if (kind === 'earth') {
    const atmo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(110,180,255,0.6)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    atmo.scale.setScalar(r * 2.5);
    g.add(atmo);
  }
  return g;
}

export interface SkyView { group: THREE.Group; sun: THREE.DirectionalLight; follow(cam: THREE.Camera, up: THREE.Vector3, focus: THREE.Vector3): void; sunDir: THREE.Vector3 }

export function buildSky(parts: LevelParts, worldId: string, scene: THREE.Scene): SkyView {
  const w = WORLDS[worldId];
  const look = lookFor(worldId);
  const group = new THREE.Group();
  group.add(skyDome(worldId));
  if (look.stars > 0) {
    const st = stars(Math.round(2400 * look.stars));
    (st.material as THREE.PointsMaterial).opacity = Math.min(1, look.stars);
    group.add(st);
  }
  const sunDir = new THREE.Vector3(parts.sunDir.x, parts.sunDir.y, parts.sunDir.z).normalize();
  const sun = sunSprite(w.au);
  sun.position.copy(sunDir).multiplyScalar(sun.userData.D);
  if (w.air !== 'thick' || worldId === 'jupiter') group.add(sun);
  else {
    // thick air: the Sun is a dim smudge behind the clouds
    const smudge = sunSprite(w.au);
    smudge.children.forEach((c) => ((c as THREE.Sprite).material.opacity = 0.35));
    smudge.position.copy(sun.position);
    group.add(smudge);
  }
  for (const b of parts.sky ?? []) {
    const o = skyBody(b.kind, b.sizeDeg);
    o.position.set(b.dir.x, b.dir.y, b.dir.z).normalize().multiplyScalar(SKY_R * 0.7);
    o.lookAt(0, 0, 0);
    group.add(o);
  }
  scene.add(group);

  const light = new THREE.DirectionalLight('#fff6e8', 2.6 * sunLight(w.au));
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  const sc = light.shadow.camera as THREE.OrthographicCamera;
  sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 120;
  light.shadow.bias = -0.0006;
  light.shadow.normalBias = 0.03;
  scene.add(light, light.target);
  if (w.air === 'thick') light.color.set(worldId === 'venus' ? '#ffc888' : '#ffe8c8');

  const fogCol = new THREE.Color(look.skyHorizon);
  scene.fog = look.haze > 0 ? new THREE.FogExp2(fogCol, look.haze) : null;

  return {
    group, sun: light, sunDir,
    follow(cam, up, focus) {
      group.position.copy(cam.position);
      const dome = group.getObjectByName('dome') as THREE.Mesh;
      (dome.material as THREE.ShaderMaterial).uniforms.up.value.copy(up);
      light.position.copy(focus).addScaledVector(sunDir, 50);
      light.target.position.copy(focus);
    },
  };
}
