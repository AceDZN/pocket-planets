import type { LevelDef } from '../core/level';
import type { Save } from '../save';
import { unlocked, totalStars } from '../save';
import { STAR_SVG } from './hud';

// Title, level select overlay, win card, pause and atlas panels (DOM, Hebrew RTL).

const WORLD_TABS: { n: 1 | 2 | 3 | 4; he: string; dot: string }[] = [
  { n: 1, he: 'העולמות הסלעיים', dot: 'radial-gradient(circle at 35% 35%, #d8c8b8, #8a7a6a)' },
  { n: 2, he: 'כדור הארץ', dot: 'radial-gradient(circle at 35% 35%, #9ae0ff, #2a7ad8 55%, #2a9a4a)' },
  { n: 3, he: 'הענקים', dot: 'radial-gradient(circle at 35% 35%, #f2e6d0, #c88a5a 60%, #a8603a)' },
  { n: 4, he: 'אל היקום', dot: 'radial-gradient(circle at 35% 35%, #ffffff, #b08aff 50%, #3a2a8a)' },
];

export function el(html: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

const stars = (n: number, cls = '') => `<div class="stars ${cls}">${[0, 1, 2].map((i) => STAR_SVG.replace('class="star"', `class="star${i < n ? ' on' : ''}"`)).join('')}</div>`;

export function titleScreen(onPlay: () => void, hasProgress: boolean, onDaily: () => void): HTMLElement {
  const s = el(`<div class="screen">
    <h1 class="logo">כוכבים בכיס</h1>
    <div class="logo-en">POCKET PLANETS</div>
    <p class="tag">שביטון השובב ניפץ את מערכת השמש של הפלנטריום ופיזר את דפי האטלס. קפצו בין עולמות קטנטנים, הרגישו את הכבידה, החום והאוויר של כל אחד, והחזירו את הדפים!</p>
    <button class="btn" data-a="play">${hasProgress ? 'המשיכו במסע ▶' : 'יוצאים לדרך ▶'}</button>
    <button class="btn ghost" data-a="daily">☄️ השביט היומי</button>
    <div class="small">גאוגרפיה לכיתה ח׳ · פרק 1: היקום ומערכת השמש</div>
  </div>`);
  s.querySelector('[data-a="play"]')!.addEventListener('click', onPlay);
  s.querySelector('[data-a="daily"]')!.addEventListener('click', onDaily);
  return s;
}

export interface MapHandlers { play(n: number): void; tab(w: number): void; select(n: number): void; atlas(): void; back(): void; daily(): void }

export function mapOverlay(levels: LevelDef[], save: Save, cur: number, h: MapHandlers): HTMLElement {
  const pages = Object.values(save.atlas).filter(Boolean).length;
  const curDef = levels[cur - 1];
  const s = el(`<div class="mapui">
    <div class="ls-top">
      <div class="counter card"><div class="k">דפי אטלס</div><div class="v"><bdi class="n">${pages}/${levels.length}</bdi></div><div class="k">⭐ <bdi class="n">${totalStars(save)}/${levels.length * 3}</bdi></div></div>
      <div class="tabs">${WORLD_TABS.map((w) => `<button class="tab card ${w.n === curDef.worldNo ? 'on' : ''}" data-w="${w.n}"><span class="dot" style="background:${w.dot}"></span>${w.he}</button>`).join('')}</div>
    </div>
    <div class="node-labels"></div>
    <div class="ls-info card"><div>${cur}. ${curDef.hideName && !save.atlas[cur] ? '???' : curDef.titleHe}</div><div class="sk">${curDef.skillHe}</div></div>
    <button class="btn ls-play">שחקו ▶</button>
    <button class="ls-atlas card"><span class="book">📖</span>אטלס</button>
    <button class="ls-daily card">☄️ השביט היומי</button>
  </div>`);
  s.querySelector('.ls-daily')!.addEventListener('click', () => h.daily());
  s.querySelectorAll<HTMLElement>('.tab').forEach((b) => b.addEventListener('click', () => h.tab(Number(b.dataset.w))));
  s.querySelector('.ls-play')!.addEventListener('click', () => h.play(cur));
  s.querySelector('.ls-atlas')!.addEventListener('click', () => h.atlas());
  const labels = s.querySelector('.node-labels')!;
  levels.forEach((d) => {
    const open = unlocked(save, d.n);
    const lab = el(`<div class="nlabel ${d.n === cur ? 'cur' : ''} ${open ? '' : 'lock'}" data-n="${d.n}"><span>${open ? d.n : '🔒'}</span><span class="ms">${[0, 1, 2].map((i) => `<span class="${i < (save.stars[d.n] ?? 0) ? 'on' : ''}">★</span>`).join('')}</span></div>`);
    lab.addEventListener('click', () => { if (open) h.select(d.n); });
    labels.appendChild(lab);
  });
  return s;
}

export function winCard(def: LevelDef, nStars: number, crumbs: number, onNext: () => void, onReplay: () => void, onMap: () => void, last: boolean): HTMLElement {
  const s = el(`<div class="screen dim"><div class="wincard card">
    <h2>${def.transfer ? `זה היה: ${def.titleHe}` : 'דף אטלס חדש!'}</h2>
    ${stars(nStars, 'bigstars')}
    <div class="small">פירורי כוכב: <bdi class="n">${crumbs}/3</bdi></div>
    <div class="fact">${def.atlasHe}${def.extraHe ? `<span class="extra"><b>העשרה</b>${def.extraHe}</span>` : ''}</div>
    <div class="row-btns">${last ? '' : '<button class="btn" data-a="next">לעולם הבא ▶</button>'}<button class="btn ghost" data-a="replay">שוב ↻</button><button class="btn ghost" data-a="map">מפה</button></div>
  </div></div>`);
  s.querySelector('[data-a="next"]')?.addEventListener('click', onNext);
  s.querySelector('[data-a="replay"]')!.addEventListener('click', onReplay);
  s.querySelector('[data-a="map"]')!.addEventListener('click', onMap);
  return s;
}

export interface PauseHandlers { resume(): void; restart(): void; map(): void; hint(): void; mute(m: boolean): void; reduced(r: boolean): void }

export function pausePanel(muted: boolean, reduced: boolean, noHints: boolean, h: PauseHandlers): HTMLElement {
  const s = el(`<div class="screen dim"><div class="panel card">
    <h2>הפסקה</h2>
    <button class="btn" data-a="resume">ממשיכים ▶</button>
    <div class="row-btns"><button class="btn ghost" data-a="restart">מתחילים מחדש ↻</button>${noHints ? '' : '<button class="btn ghost" data-a="hint">רמז 💡</button>'}<button class="btn ghost" data-a="map">מפה</button></div>
    <label class="toggle"><input type="checkbox" data-a="mute" ${muted ? 'checked' : ''}> השתקה</label>
    <label class="toggle"><input type="checkbox" data-a="reduced" ${reduced ? 'checked' : ''}> פחות תנועה (מצלמה שקטה)</label>
    <div class="small">חיצים / WASD: ריצה · רווח: קפיצה (שוב באוויר: סילון) · Shift: הלימה · E: הרמה/זריקה · גרירה: מצלמה<br>הצפון תמיד למעלה במפות, המזרח מימין, גם כשהכתוב מימין לשמאל.</div>
  </div></div>`);
  s.querySelector('[data-a="resume"]')!.addEventListener('click', h.resume);
  s.querySelector('[data-a="restart"]')!.addEventListener('click', h.restart);
  s.querySelector('[data-a="map"]')!.addEventListener('click', h.map);
  s.querySelector('[data-a="hint"]')?.addEventListener('click', h.hint);
  s.querySelector<HTMLInputElement>('[data-a="mute"]')!.addEventListener('change', (e) => h.mute((e.target as HTMLInputElement).checked));
  s.querySelector<HTMLInputElement>('[data-a="reduced"]')!.addEventListener('change', (e) => h.reduced((e.target as HTMLInputElement).checked));
  return s;
}

export function atlasPanel(levels: LevelDef[], save: Save, onClose: () => void): HTMLElement {
  const s = el(`<div class="screen dim"><div class="panel card" style="width:min(94%,900px)">
    <h2>האטלס של נורי</h2>
    <div class="atlas-grid">${levels.map((d) => save.atlas[d.n]
      ? `<div class="apage got"><h4>${d.n}. ${d.titleHe}</h4>${d.atlasHe}${d.extraHe ? `<div style="margin-top:4px;color:#6a4a10"><b>העשרה:</b> ${d.extraHe}</div>` : ''}</div>`
      : `<div class="apage no"><h4>${d.n}. ${d.hideName ? '???' : d.titleHe}</h4>הדף עוד חסר…</div>`).join('')}</div>
    <button class="btn" data-a="close">סגירה</button>
  </div></div>`);
  s.querySelector('[data-a="close"]')!.addEventListener('click', onClose);
  return s;
}

/** Daily comet: after the page, name the world. A wrong pick gets Shvitton's comic explanation and stays retryable. */
export function guessCard(stage: number, options: { id: string; he: string }[], onPick: (id: string) => string | null): HTMLElement {
  const s = el(`<div class="screen dim"><div class="wincard card">
    <div class="small">השביט היומי · עולם <bdi class="n">${stage}/3</bdi></div>
    <h2>על איזה עולם נחתתם?</h2>
    <div class="guess">${options.map((o) => `<button class="btn ghost" data-w="${o.id}">${o.he}</button>`).join('')}</div>
    <div class="fact guess-say" hidden></div>
  </div></div>`);
  const say = s.querySelector<HTMLElement>('.guess-say')!;
  s.querySelectorAll<HTMLButtonElement>('.guess button').forEach((b) => b.addEventListener('click', () => {
    const msg = onPick(b.dataset.w!);
    if (msg) { b.disabled = true; b.classList.add('tried'); say.hidden = false; say.innerHTML = msg; }
  }));
  return s;
}

export function dailyEndCard(score: number, best: number, streak: number, firstTry: number, crumbs: number, seconds: number, onAgain: () => void, onMap: () => void): HTMLElement {
  const s = el(`<div class="screen dim"><div class="wincard card">
    <h2>☄️ השביט היומי הושלם!</h2>
    <div class="daily-score"><bdi class="n">${score}/12</bdi> שביטים</div>
    <div class="fact">ניחוש בפעם הראשונה: <bdi class="n">${firstTry}/3</bdi> · פירורי כוכב: <bdi class="n">${crumbs}/9</bdi> · זמן: <bdi class="n">${Math.round(seconds)}</bdi> שניות<br>השיא של היום: <bdi class="n">${best}</bdi> · ימים ברצף: <bdi class="n">${streak}</bdi><br>מחר שביטון יזרוק אתכם לשלושה עולמות אחרים.</div>
    <div class="row-btns"><button class="btn" data-a="again">שוב ↻</button><button class="btn ghost" data-a="map">מפה</button></div>
  </div></div>`);
  s.querySelector('[data-a="again"]')!.addEventListener('click', onAgain);
  s.querySelector('[data-a="map"]')!.addEventListener('click', onMap);
  return s;
}
