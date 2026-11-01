import * as THREE from 'three';
import { cloneModel, gltf, modelEntry } from './models';
import { glowTexture } from './textures';
import type { Player } from '../core/physics';

// Nuri: the rigged Tripo explorer when loaded (AnimationMixer), else a procedural stand-in with squash & stretch.

export type Anim = 'idle' | 'run' | 'jump' | 'fall' | 'land' | 'pound' | 'cheer' | 'shiver' | 'overheat';

const tv = (v: { x: number; y: number; z: number }) => new THREE.Vector3(v.x, v.y, v.z);

export class NuriView {
  root = new THREE.Group();
  body = new THREE.Group();
  private mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<Anim, THREE.AnimationAction>();
  private current: Anim | null = null;
  private squash = 0;
  private helmetMat: THREE.MeshStandardMaterial | null = null;
  private jet: THREE.Sprite;
  private t = 0;
  private lockAnim = 0;
  private proc: { legs: THREE.Object3D[]; arms: THREE.Object3D[] } | null = null;
  private shadow: THREE.Mesh;
  height = 1.15;

  constructor() {
    this.root.add(this.body);
    const m = cloneModel('nuri', this.height, true);
    if (m) {
      this.body.add(m);
      const g = gltf('nuri')!;
      this.mixer = new THREE.AnimationMixer(m.userData.inner);
      const clips = modelEntry('nuri')?.clips ?? {};
      for (const [role, name] of Object.entries(clips)) {
        const clip = g.animations.find((a) => a.name === name);
        if (clip) this.actions.set(role as Anim, this.mixer.clipAction(clip));
      }
      m.traverse((o) => {
        const mm = o as THREE.Mesh;
        if (mm.isMesh && /helmet|glass/i.test(mm.name + (mm.material as THREE.Material).name)) this.helmetMat = mm.material as THREE.MeshStandardMaterial;
      });
    } else {
      this.buildProcedural();
    }
    this.jet = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(120,220,255,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    this.jet.scale.setScalar(0.9);
    this.jet.position.set(0, 0.45, -0.32);
    this.body.add(this.jet);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.03;
    this.root.add(this.shadow);
    this.play('idle');
  }

  private buildProcedural(): void {
    const suit = new THREE.MeshStandardMaterial({ color: '#ff7a1f', roughness: 0.55 });
    const white = new THREE.MeshStandardMaterial({ color: '#eef2f8', roughness: 0.4 });
    const grey = new THREE.MeshStandardMaterial({ color: '#7a8496', roughness: 0.5 });
    const skin = new THREE.MeshStandardMaterial({ color: '#f2c29a', roughness: 0.7 });
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = this.body) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
    };
    add(new THREE.CapsuleGeometry(0.22, 0.25, 6, 14), suit, 0, 0.52, 0);
    add(new THREE.BoxGeometry(0.34, 0.36, 0.18), white, 0, 0.56, -0.22);
    add(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), new THREE.MeshStandardMaterial({ color: '#3ab0ff', emissive: '#2a90ff', emissiveIntensity: 1 }), 0, 0.6, -0.32).rotateX(Math.PI / 2);
    add(new THREE.SphereGeometry(0.17, 18, 14), skin, 0, 0.92, 0.02);
    add(new THREE.SphereGeometry(0.18, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.1), new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.9 }), 0, 0.95, -0.01);
    for (const x of [-0.06, 0.06]) add(new THREE.SphereGeometry(0.028, 8, 6), new THREE.MeshStandardMaterial({ color: '#1a1a1a' }), x, 0.94, 0.17);
    this.helmetMat = new THREE.MeshStandardMaterial({ color: '#d8f2ff', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false });
    add(new THREE.SphereGeometry(0.3, 24, 18), this.helmetMat, 0, 0.92, 0.02);
    add(new THREE.TorusGeometry(0.22, 0.04, 8, 24), white, 0, 0.7, 0.02).rotateX(Math.PI / 2);
    const legs: THREE.Object3D[] = [], arms: THREE.Object3D[] = [];
    for (const x of [-0.1, 0.1]) {
      const pivot = new THREE.Group(); pivot.position.set(x, 0.36, 0); this.body.add(pivot);
      add(new THREE.CapsuleGeometry(0.075, 0.16, 4, 8), suit, 0, -0.14, 0, pivot);
      add(new THREE.BoxGeometry(0.15, 0.1, 0.22), white, 0, -0.3, 0.03, pivot);
      legs.push(pivot);
    }
    for (const x of [-0.27, 0.27]) {
      const pivot = new THREE.Group(); pivot.position.set(x, 0.66, 0); this.body.add(pivot);
      add(new THREE.CapsuleGeometry(0.06, 0.18, 4, 8), suit, 0, -0.13, 0, pivot);
      add(new THREE.SphereGeometry(0.07, 8, 6), white, 0, -0.28, 0, pivot);
      arms.push(pivot);
    }
    this.proc = { legs, arms };
  }

  play(a: Anim, lock = 0): void {
    if (this.lockAnim > 0 && lock === 0) return;
    if (lock) this.lockAnim = lock;
    if (this.current === a) return;
    const prev = this.current ? this.actions.get(this.current) : undefined;
    this.current = a;
    const act = this.actions.get(a) ?? (a === 'fall' ? this.actions.get('jump') : a === 'pound' || a === 'land' ? this.actions.get('jump') : undefined) ?? this.actions.get('idle');
    if (!act) return;
    const once = a === 'land' || a === 'jump';
    act.reset();
    act.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    act.clampWhenFinished = once;
    act.fadeIn(0.15).play();
    if (prev && prev !== act) prev.fadeOut(0.15);
  }

  impulse(kind: 'jump' | 'land' | 'pound' | 'puff', strength = 1): void {
    if (kind === 'jump') this.squash = -0.25;
    if (kind === 'land') this.squash = Math.min(0.35, 0.12 + strength * 0.02);
    if (kind === 'pound') this.squash = 0.45;
    if (kind === 'puff') (this.jet.material as THREE.SpriteMaterial).opacity = 1;
  }

  update(p: Player, dt: number, meter: number, won: boolean): void {
    this.t += dt;
    this.lockAnim = Math.max(0, this.lockAnim - dt);
    const up = tv(p.up).normalize();
    let fwd = tv(p.facing);
    fwd.sub(up.clone().multiplyScalar(fwd.dot(up)));
    if (fwd.lengthSq() < 1e-6) fwd = new THREE.Vector3(1, 0, 0).cross(up);
    fwd.normalize();
    const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
    const target = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd));
    this.root.quaternion.slerp(target, 1 - Math.exp(-14 * dt));
    this.root.position.copy(tv(p.pos)).addScaledVector(up, -0.4);

    const vn = p.vel.x * up.x + p.vel.y * up.y + p.vel.z * up.z;
    const speedT = Math.hypot(p.vel.x - up.x * vn, p.vel.y - up.y * vn, p.vel.z - up.z * vn);
    if (won) this.play('cheer');
    else if (p.pounding) this.play('pound');
    else if (!p.grounded) this.play(vn > 0 ? 'jump' : 'fall');
    else if (meter > 0.55) this.play('overheat');
    else if (meter < -0.55) this.play('shiver');
    else if (speedT > 0.8) this.play('run');
    else this.play('idle');
    if (this.mixer) {
      const run = this.actions.get('run');
      if (run && this.current === 'run') run.timeScale = Math.max(0.6, speedT / 5);
      this.mixer.update(dt);
    }

    // squash & stretch
    this.squash += (0 - this.squash) * Math.min(1, dt * 10);
    const sq = this.squash;
    this.body.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    if (!p.grounded && !p.pounding) this.body.scale.y *= 1 + Math.min(0.08, Math.abs(vn) * 0.006);
    if (p.pounding) this.body.rotation.x += dt * 22; else this.body.rotation.x *= Math.exp(-dt * 18);

    const jm = this.jet.material as THREE.SpriteMaterial;
    jm.opacity = Math.max(0, jm.opacity - dt * 2.2);

    // shiver / overheat jiggle and helmet tint (frost / steam)
    if (meter < -0.4) this.body.position.x = Math.sin(this.t * 60) * 0.02 * -meter; else this.body.position.x = 0;
    if (this.helmetMat) {
      const hot = Math.max(0, meter), cold = Math.max(0, -meter);
      this.helmetMat.emissive = new THREE.Color().setRGB(hot * 0.9, hot * 0.25, cold * 0.6);
      this.helmetMat.opacity = 0.28 + cold * 0.45;
    }

    if (this.proc) {
      const { legs, arms } = this.proc;
      const ph = this.t * (6 + speedT * 1.6);
      const run = this.current === 'run' ? Math.min(1, speedT / 4) : 0;
      const air = !p.grounded;
      legs.forEach((l, i) => { l.rotation.x = air ? (i ? -0.5 : 0.7) : Math.sin(ph + i * Math.PI) * 0.8 * run; });
      arms.forEach((a, i) => {
        if (this.current === 'cheer') { a.rotation.x = Math.PI * 0.9 + Math.sin(this.t * 10 + i) * 0.2; a.rotation.z = (i ? -1 : 1) * 0.3; }
        else if (this.current === 'overheat') { a.rotation.x = -1.2 + Math.sin(this.t * 18 + i * 2) * 0.6; a.rotation.z = 0; }
        else if (this.current === 'shiver') { a.rotation.x = -0.8; a.rotation.z = (i ? 1 : -1) * 0.9; }
        else if (air) { a.rotation.x = -2.2 + Math.sin(this.t * 12 + i) * 0.4; a.rotation.z = (i ? -1 : 1) * 0.4; }
        else { a.rotation.x = Math.sin(ph + i * Math.PI + Math.PI) * 0.9 * run; a.rotation.z = (i ? -1 : 1) * 0.08; }
      });
      if (this.current === 'idle') this.body.position.y = Math.sin(this.t * 2.4) * 0.015;
      else if (this.current === 'cheer') this.body.position.y = Math.abs(Math.sin(this.t * 7)) * 0.18;
      else this.body.position.y = 0;
    }
    this.shadow.visible = p.grounded;
  }
}
