import * as THREE from 'three';
import { glowTexture } from './textures';

// Particles: dust, sparkles, smoke, frost and shockwave rings. A fixed pool per system, updated on the CPU.

interface P { pos: THREE.Vector3; vel: THREE.Vector3; life: number; max: number; size: number; grav: THREE.Vector3; drag: number }

class System {
  points: THREE.Points;
  private ps: P[] = [];
  private geo = new THREE.BufferGeometry();
  private pos: Float32Array;
  private col: Float32Array;
  private sizes: Float32Array;
  constructor(private n: number, tex: THREE.Texture, additive: boolean, private color: THREE.Color) {
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.sizes = new Float32Array(n);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex } },
      vertexShader: 'attribute float size; attribute vec3 color; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * 300.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, 1.0) * t; if (gl_FragColor.a < 0.02) discard; }',
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
  }
  emit(at: THREE.Vector3, vel: THREE.Vector3, life: number, size: number, grav: THREE.Vector3, drag: number): void {
    if (this.ps.length >= this.n) this.ps.shift();
    this.ps.push({ pos: at.clone(), vel, life, max: life, size, grav, drag });
  }
  update(dt: number, tint?: THREE.Color): void {
    this.ps = this.ps.filter((p) => (p.life -= dt) > 0);
    const c = tint ?? this.color;
    for (let i = 0; i < this.n; i++) {
      const p = this.ps[i];
      if (!p) { this.sizes[i] = 0; continue; }
      p.vel.addScaledVector(p.grav, dt).multiplyScalar(Math.exp(-p.drag * dt));
      p.pos.addScaledVector(p.vel, dt);
      this.pos.set([p.pos.x, p.pos.y, p.pos.z], i * 3);
      const k = p.life / p.max;
      this.col.set([c.r * k, c.g * k, c.b * k], i * 3);
      this.sizes[i] = p.size * (0.6 + (1 - k) * 0.8);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  }
}

export class Fx {
  group = new THREE.Group();
  dust: System;
  spark: System;
  smoke: System;
  frost: System;
  private rings: { m: THREE.Mesh; t: number }[] = [];
  dustColor = new THREE.Color('#bbbbbb');
  /** 0 = no air (dust flies ballistic and slow), higher = dust hangs and fades. */
  airDrag = 0;
  constructor() {
    const soft = glowTexture('rgba(255,255,255,1)');
    this.dust = new System(400, soft, false, new THREE.Color('#cccccc'));
    this.spark = new System(300, soft, true, new THREE.Color('#ffd34a'));
    this.smoke = new System(200, soft, false, new THREE.Color('#999999'));
    this.frost = new System(200, soft, true, new THREE.Color('#9ad8ff'));
    this.group.add(this.dust.points, this.spark.points, this.smoke.points, this.frost.points);
  }
  private rnd(up: THREE.Vector3, spread: number, lift: number): THREE.Vector3 {
    const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(spread * 2);
    v.addScaledVector(up, -v.dot(up)).addScaledVector(up, lift * (0.5 + Math.random() * 0.5));
    return v;
  }
  puffDust(at: THREE.Vector3, up: THREE.Vector3, n: number, g: number): void {
    for (let i = 0; i < n; i++) this.dust.emit(at.clone().addScaledVector(up, 0.05), this.rnd(up, 2.2, 1.6), 0.8 + Math.random() * 0.8 + (this.airDrag ? 0 : 1.2), 0.5 + Math.random() * 0.4, up.clone().multiplyScalar(-g * 0.25), this.airDrag);
  }
  sparkle(at: THREE.Vector3, up: THREE.Vector3, n = 24): void {
    for (let i = 0; i < n; i++) this.spark.emit(at, this.rnd(up, 3.5, 3), 0.7 + Math.random() * 0.5, 0.35 + Math.random() * 0.3, up.clone().multiplyScalar(-3), 1.5);
  }
  jet(at: THREE.Vector3, up: THREE.Vector3): void {
    for (let i = 0; i < 18; i++) this.frost.emit(at, this.rnd(up, 0.8, -4), 0.5, 0.45, new THREE.Vector3(), 2);
  }
  steam(at: THREE.Vector3, up: THREE.Vector3): void { this.smoke.emit(at, this.rnd(up, 0.4, 1.4), 1.0, 0.45, new THREE.Vector3(), 0.8); }
  ice(at: THREE.Vector3, up: THREE.Vector3): void { this.frost.emit(at.clone().addScaledVector(up, 0.9), this.rnd(up, 0.6, 0.3), 0.8, 0.18, new THREE.Vector3(), 1); }
  ring(at: THREE.Vector3, up: THREE.Vector3, color = '#ffffff'): void {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false }));
    m.position.copy(at);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), up);
    this.group.add(m);
    this.rings.push({ m, t: 0 });
  }
  update(dt: number): void {
    this.dust.update(dt, this.dustColor);
    this.spark.update(dt);
    this.smoke.update(dt);
    this.frost.update(dt);
    this.rings = this.rings.filter((r) => {
      r.t += dt;
      r.m.scale.setScalar(1 + r.t * 9);
      (r.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - r.t * 1.8);
      if (r.t > 0.5) { this.group.remove(r.m); r.m.geometry.dispose(); return false; }
      return true;
    });
  }
}
