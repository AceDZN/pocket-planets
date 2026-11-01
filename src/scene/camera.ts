import * as THREE from 'three';
import type { Sim } from '../core/physics';
import { bodyCenter, gravityAt } from '../core/physics';

// Third-person follow camera with planet-up orientation: the camera's "up" is the ground's up under Nuri, and its
// forward direction is carried around the little worlds as you run. Pulls back on big low-gravity jumps.

const tv = (v: { x: number; y: number; z: number }) => new THREE.Vector3(v.x, v.y, v.z);

export class CameraRig {
  fwd = new THREE.Vector3(0, 0, -1);
  up = new THREE.Vector3(0, 1, 0);
  pitch = 0.32;
  dist = 7;
  private idle = 0;
  private shakeT = 0;
  private shakeA = 0;
  private altSmooth = 0;
  constructor(public cam: THREE.PerspectiveCamera) {}

  reset(sim: Sim): void {
    const p = sim.player;
    this.up.copy(tv(p.up));
    // look from the spawn toward the level's page
    const f = tv(p.facing);
    this.fwd.copy(f.sub(this.up.clone().multiplyScalar(f.dot(this.up)))).normalize();
    this.pitch = 0.32;
    this.altSmooth = 0;
    this.place(sim, 1);
  }

  lookToward(target: { x: number; y: number; z: number }, p: { x: number; y: number; z: number }): void {
    const d = tv(target).sub(tv(p));
    d.sub(this.up.clone().multiplyScalar(d.dot(this.up)));
    if (d.lengthSq() > 1e-4) this.fwd.copy(d.normalize());
  }

  shake(a: number): void { this.shakeA = Math.max(this.shakeA, a); this.shakeT = 0.35; }

  /** Camera-relative stick → world move direction. */
  moveVector(stick: { x: number; y: number }): { x: number; y: number; z: number } {
    const right = new THREE.Vector3().crossVectors(this.fwd, this.up).normalize();
    const v = this.fwd.clone().multiplyScalar(stick.y).addScaledVector(right, stick.x);
    return { x: v.x, y: v.y, z: v.z };
  }

  update(sim: Sim, dt: number, camDX: number, camDY: number, reduced: boolean): void {
    const p = sim.player;
    const targetUp = tv(p.up).normalize();
    this.up.lerp(targetUp, 1 - Math.exp(-6 * dt)).normalize();
    // parallel-transport forward onto the new tangent plane
    this.fwd.sub(this.up.clone().multiplyScalar(this.fwd.dot(this.up)));
    if (this.fwd.lengthSq() < 1e-6) this.fwd.set(1, 0, 0).cross(this.up);
    this.fwd.normalize();

    if (camDX || camDY) {
      this.fwd.applyAxisAngle(this.up, -camDX * 0.006).normalize();
      this.pitch = Math.max(-0.15, Math.min(1.15, this.pitch + camDY * 0.004));
      this.idle = 0;
    } else this.idle += dt;

    // lazy auto-follow behind the run direction
    const vt = tv(p.vel).sub(this.up.clone().multiplyScalar(tv(p.vel).dot(this.up)));
    const sp = vt.length();
    if (this.idle > 1.2 && sp > 2) {
      const f = vt.normalize();
      const along = f.dot(this.fwd);
      if (along > -0.4) {
        const cross = new THREE.Vector3().crossVectors(this.fwd, f).dot(this.up);
        this.fwd.applyAxisAngle(this.up, Math.max(-1, Math.min(1, cross)) * dt * 1.4 * Math.min(1, sp / 6)).normalize();
      }
    }
    this.place(sim, dt, reduced);
  }

  private place(sim: Sim, dt: number, reduced = false): void {
    const p = sim.player;
    const g = gravityAt(sim, p.pos, p.bodyId);
    const alt = Math.min(12, Math.max(0, g.distance));
    this.altSmooth += (alt - this.altSmooth) * (1 - Math.exp(-2.5 * dt));
    const dist = this.dist + Math.min(7, this.altSmooth * 0.55);
    const focus = tv(p.pos).addScaledVector(this.up, 0.6);
    const pos = focus.clone()
      .addScaledVector(this.up, Math.sin(this.pitch) * dist + 1.1)
      .addScaledVector(this.fwd, -Math.cos(this.pitch) * dist);
    // keep the camera out of planets
    for (const b of sim.bodies) {
      if (b.kind !== 'sphere') continue;
      const c = tv(bodyCenter(sim, b));
      const d = pos.clone().sub(c);
      const min = b.radius + 0.8;
      if (d.length() < min) pos.copy(c).addScaledVector(d.normalize(), min);
    }
    if (this.shakeT > 0 && !reduced) {
      this.shakeT -= dt;
      const a = this.shakeA * (this.shakeT / 0.35);
      pos.add(new THREE.Vector3((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a));
    }
    this.cam.position.lerp(pos, dt >= 1 ? 1 : 1 - Math.exp(-10 * dt));
    this.cam.up.copy(this.up);
    this.cam.lookAt(focus.clone().addScaledVector(this.fwd, 1.6).addScaledVector(this.up, 0.4));
  }
}
