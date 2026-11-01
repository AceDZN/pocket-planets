import type { LevelRun } from '../core/game';
import { JUMP_EARTH } from '../core/worlds';
import { WORLDS } from '../core/worlds';
import { currentWorld } from '../core/game';
import { press } from '../input';

// In-game HUD (Hebrew RTL), laid out like the mockups: pause/mute top-left, title card top-right, jump gauge and
// thermometer on the left edge, the objective pill at the bottom. Numbers sit in LTR <bdi> spans.

export const STAR_SVG = '<svg class="star" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3 6.1 20.5l1.3-6.5L2.5 9.4l6.6-.8z"/></svg>';
const ICON = {
  pause: '<svg viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8c1.5 1.2 1.5 6.8 0 8M18.5 5.5c3 2.6 3 10.4 0 13" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
};

export interface HudHandlers { pause(): void; mute(): void; hint(): void; atlas(): void }

export class Hud {
  el: HTMLElement;
  private q = <T extends HTMLElement>(s: string) => this.el.querySelector<T>(s)!;
  private toastEls: HTMLElement[] = [];
  private shownToast = 0;
  private gaugeMax = 10;
  private live = 0;
  constructor(root: HTMLElement, h: HudHandlers) {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="hud-tl"><button class="round" data-a="pause" aria-label="השהיה">${ICON.pause}</button><button class="round" data-a="mute" aria-label="השתקה">${ICON.sound}</button></div>
      <div class="titlecard card"><h2 class="ttl"></h2><div class="row"><div class="pageicon empty" title="דף האטלס"></div><div class="stars">${STAR_SVG.repeat(3)}</div></div></div>
      <div class="hud-tr2"><button class="round" data-a="hint" aria-label="רמז">💡</button><button class="round" data-a="atlas" aria-label="אטלס">📖</button></div>
      <div class="gauges">
        <div class="gauge jump card"><div class="lbl">מד<br>הקפיצה</div><div class="tube"><div class="fill"></div><div class="earth"></div></div><div class="val"></div></div>
        <div class="gauge thermo card"><div class="lbl">מד חום</div><div class="ico">🔥</div><div class="tube"><div class="needle"></div></div><div class="ico">❄️</div><div class="temp"></div></div>
      </div>
      <div class="toasts"></div>
      <div class="objective card"><span class="arrow">⬆</span><span class="otext"></span></div>
      <div class="touch"><div class="tb" data-t="action" aria-label="פעולה">✋</div><div class="tb" data-t="pound" aria-label="הלימה">⬇</div><div class="tb big" data-t="jump" aria-label="קפיצה">⤒</div></div>`;
    root.appendChild(this.el);
    this.el.querySelectorAll<HTMLElement>('[data-a]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); (h as unknown as Record<string, () => void>)[b.dataset.a!](); }));
    const tb = (k: string) => this.q<HTMLElement>(`[data-t="${k}"]`);
    tb('jump').addEventListener('touchstart', (e) => { e.preventDefault(); press.jumpDown(); }, { passive: false });
    tb('jump').addEventListener('touchend', (e) => { e.preventDefault(); press.jumpUp(); }, { passive: false });
    tb('pound').addEventListener('touchstart', (e) => { e.preventDefault(); press.pound(); }, { passive: false });
    tb('action').addEventListener('touchstart', (e) => { e.preventDefault(); press.action(); }, { passive: false });
    // Earth tick on the jump tube
    const tube = this.q('.jump .tube');
    for (let k = 1; k <= 9; k++) { const t = document.createElement('div'); t.className = 'tick'; t.style.bottom = `${(k * 150) / 10}px`; tube.appendChild(t); }
  }

  setMuted(m: boolean): void { this.q('[data-a="mute"]').innerHTML = m ? ICON.mute : ICON.sound; }

  start(run: LevelRun): void {
    this.q('.ttl').textContent = run.def.hideName ? '???' : run.def.titleHe;
    this.q('.otext').textContent = run.def.objectiveHe;
    this.q('.pageicon').classList.add('empty');
    this.el.querySelectorAll('.titlecard .star').forEach((s) => s.classList.remove('on'));
    this.q('.toasts').innerHTML = '';
    this.toastEls = [];
    this.shownToast = run.toasts.length;
    this.live = 0;
    this.q<HTMLElement>('[data-a="hint"]').style.display = run.def.noHints ? 'none' : '';
    const w = WORLDS[run.def.worldId];
    // the Earth-jump tick sits at 1× (bottom); scale so the level's world fits
    this.gaugeMax = 10;
    void w;
  }

  revealName(name: string): void { this.q('.ttl').textContent = name; }
  setObjective(he: string): void { this.q('.otext').textContent = he; }

  crumb(i: number): void {
    const s = this.el.querySelectorAll('.titlecard .star')[i];
    s?.classList.add('on', 'pop');
  }
  page(): void { this.q('.pageicon').classList.remove('empty'); }

  update(run: LevelRun, dt: number): void {
    const p = run.sim.player;
    // live jump rise while airborne, else the last jump's apex
    const rise = p.jumpFrom ? p.rise : 0;
    this.live = p.jumpFrom ? rise : p.lastApex;
    const ratio = this.live / JUMP_EARTH;
    const frac = Math.min(1, ratio / this.gaugeMax);
    this.q<HTMLElement>('.jump .fill').style.height = `${Math.max(6, frac * 100)}%`;
    this.q<HTMLElement>('.jump .earth').style.bottom = `${(1 / this.gaugeMax) * 150}px`;
    const val = this.q('.jump .val');
    if (run.def.transfer) val.textContent = p.lastApex > 0.2 ? '?' : '';
    else val.innerHTML = p.lastApex > 0.2 || p.jumpFrom ? `פי <bdi class="n">${ratio < 9.95 ? ratio.toFixed(1).replace(/\.0$/, '') : Math.round(ratio)}</bdi>` : 'קפצו!';

    const th = this.q<HTMLElement>('.thermo');
    const w = WORLDS[currentWorld(run)];
    const extreme = run.def.thermo || Math.abs(run.meter) > 0.02;
    void w;
    th.style.display = extreme ? '' : 'none';
    const m = run.meter;
    this.q<HTMLElement>('.thermo .needle').style.bottom = `${50 + m * 50}%`;
    this.q('.thermo .temp').innerHTML = `<bdi class="n">${Math.round(run.heat.c)}°C</bdi>`;
    th.classList.toggle('warn', Math.abs(m) > 0.55);
    th.classList.toggle('cold', m < 0);

    // toasts
    while (this.shownToast < run.toasts.length) {
      const t = run.toasts[this.shownToast++];
      const d = document.createElement('div');
      d.className = `toast card ${t.kind}`;
      d.textContent = t.he;
      this.q('.toasts').appendChild(d);
      this.toastEls.push(d);
      const life = 3200 + t.he.length * 45;
      setTimeout(() => d.classList.add('out'), life);
      setTimeout(() => d.remove(), life + 450);
      if (this.toastEls.length > 3) this.toastEls.shift()?.remove();
    }
    void dt;
  }

  show(on: boolean): void { this.el.style.display = on ? '' : 'none'; }
}
