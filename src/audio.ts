// Synthesized sound (WebAudio), started after the first gesture. On airless worlds everything is muffled:
// in real space sound needs air to travel, so the game passes it through a low-pass "helmet" filter.

let ctx: AudioContext | null = null;
let master: GainNode, muffle: BiquadFilterNode, music: GainNode;
let muted = false;
let droneNodes: AudioNode[] = [];

export function initAudio(): void {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return; }
  try {
    ctx = new AudioContext();
  } catch { return; }
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.6;
  muffle = ctx.createBiquadFilter();
  muffle.type = 'lowpass';
  muffle.frequency.value = 18000;
  muffle.connect(master);
  master.connect(ctx.destination);
  music = ctx.createGain();
  music.gain.value = 0.18;
  music.connect(master);
}

export function setMuted(m: boolean): void {
  muted = m;
  if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.05);
}
export const isMuted = (): boolean => muted;

/** none → strong muffle (helmet only), thin → some, normal/thick → open. */
export function setAir(air: string): void {
  if (!ctx) return;
  const f = air === 'none' ? 700 : air === 'thin' ? 2600 : 16000;
  muffle.frequency.setTargetAtTime(f, ctx.currentTime, 0.2);
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, slide = 0, delay = 0, dest?: AudioNode): void {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest ?? muffle);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, vol = 0.3, freq = 1200, q = 0.8, delay = 0, sweep = 1): void {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(freq, t);
  if (sweep !== 1) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(muffle);
  src.start(t);
}

export const sfx = {
  jump(g: number): void { tone(260 + 120 * Math.min(1.5, g), 0.22 + 0.15 / Math.max(0.2, g), 'square', 0.12, 1.9); },
  puff(): void { noise(0.35, 0.35, 900, 0.7, 0, 2.5); },
  land(s: number): void { noise(0.12, Math.min(0.5, 0.15 + s * 0.03), 300, 1); tone(90, 0.12, 'sine', 0.25, 0.6); },
  pound(): void { tone(70, 0.4, 'sawtooth', 0.35, 0.4); noise(0.3, 0.5, 200, 0.7); },
  crumb(i = 0): void { [0, 4, 7].forEach((s, k) => tone(880 * Math.pow(2, (s + i * 2) / 12), 0.25, 'triangle', 0.18, 1, k * 0.06, master)); },
  page(): void { [0, 4, 7, 12, 16].forEach((s, k) => tone(523 * Math.pow(2, s / 12), 0.5, 'triangle', 0.2, 1, k * 0.09, master)); },
  launch(): void { noise(0.9, 0.4, 400, 0.6, 0, 6); tone(180, 0.9, 'sawtooth', 0.12, 3); },
  wrong(): void { tone(700, 0.7, 'sine', 0.2, 0.35, 0, master); tone(520, 0.4, 'square', 0.06, 0.5, 0.35, master); },
  checkpoint(): void { tone(660, 0.15, 'triangle', 0.18, 1, 0, master); tone(990, 0.25, 'triangle', 0.18, 1, 0.1, master); },
  sizzle(): void { noise(0.4, 0.25, 4000, 0.5); },
  crackle(): void { noise(0.25, 0.25, 6000, 2); tone(1400, 0.1, 'square', 0.04, 0.5); },
  click(): void { tone(1200, 0.05, 'square', 0.06, 1, 0, master); },
  heavy(): void { tone(110, 0.35, 'square', 0.15, 0.7, 0, master); },
  pickup(): void { tone(500, 0.12, 'triangle', 0.15, 1.6); },
  throw(): void { noise(0.25, 0.25, 1200, 0.8, 0, 0.4); },
  switch(): void { tone(300, 0.2, 'square', 0.15, 2); tone(600, 0.3, 'triangle', 0.15, 1, 0.12, master); },
  bloom(): void { [0, 5, 9, 12].forEach((s, k) => tone(440 * Math.pow(2, s / 12), 0.6, 'sine', 0.18, 1, k * 0.12, master)); },
  wilt(): void { tone(400, 0.8, 'sine', 0.15, 0.4, 0, master); },
  fall(): void { tone(900, 1.4, 'sine', 0.15, 0.15, 0, master); },
  win(): void { [0, 4, 7, 12, 7, 12, 16, 19].forEach((s, k) => tone(392 * Math.pow(2, s / 12), 0.3, 'triangle', 0.18, 1, k * 0.1, master)); },
};

/** A soft two-note drone per world plus a slow arpeggio: calm, spacey, never in the way. */
export function playAmbient(world: string): void {
  if (!ctx) return;
  for (const n of droneNodes) { try { (n as OscillatorNode).stop?.(); n.disconnect(); } catch { /* already stopped */ } }
  droneNodes = [];
  const roots: Record<string, number> = { moon: 110, mercury: 117, venus: 98, earth: 131, mars: 104, asteroid: 123, io: 110, europa: 110, ganymede: 110, ring: 147, enceladus: 147, miranda: 92, triton: 87, orbit: 131, deep: 82 };
  const r = roots[world] ?? 110;
  const t = ctx.currentTime;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 900;
  f.connect(music);
  for (const mul of [1, 1.5, 2.005]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = r * mul;
    const g = ctx.createGain();
    g.gain.value = mul === 1 ? 0.35 : 0.12;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07 + mul * 0.03;
    const lg = ctx.createGain();
    lg.gain.value = 0.08;
    lfo.connect(lg).connect(g.gain);
    o.connect(g).connect(f);
    o.start(t); lfo.start(t);
    droneNodes.push(o, lfo, g, lg);
  }
  droneNodes.push(f);
  // arpeggio
  const scale = [0, 3, 7, 10, 12, 15, 19];
  let k = 0;
  const loop = () => {
    if (!ctx || !droneNodes.includes(f)) return;
    const s = scale[(k * 5 + (k >> 2)) % scale.length];
    tone(r * 4 * Math.pow(2, s / 12), 1.4, 'triangle', 0.035, 1, 0, music);
    k++;
    setTimeout(loop, 900 + ((k * 397) % 3) * 300);
  };
  setTimeout(loop, 1200);
}
