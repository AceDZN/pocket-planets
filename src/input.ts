// Keyboard, mouse-drag camera and touch controls. Produces a camera-relative stick plus edge-triggered buttons.

export interface Controls {
  stick: { x: number; y: number };
  jumpHeld: boolean;
  jumpPressed: boolean;
  poundPressed: boolean;
  actionPressed: boolean;
  camDX: number;
  camDY: number;
  ui: string[];
}

const keys = new Set<string>();
let jumpEdge = false, poundEdge = false, actionEdge = false;
let camDX = 0, camDY = 0;
const ui: string[] = [];
const touchStick = { x: 0, y: 0, id: -1, ox: 0, oy: 0 };
let touchJump = false;
let enabled = true;

export function setInputEnabled(on: boolean): void { enabled = on; if (!on) keys.clear(); }

export function initInput(canvas: HTMLElement, root: HTMLElement): void {
  addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    const c = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(c)) e.preventDefault();
    if (e.repeat) return;
    keys.add(c);
    if (c === 'Space') jumpEdge = true;
    if (c === 'ShiftLeft' || c === 'ShiftRight' || c === 'KeyX') poundEdge = true;
    if (c === 'KeyE' || c === 'Enter') actionEdge = true;
    if (c === 'Escape' || c === 'KeyP') ui.push('pause');
    if (c === 'KeyM') ui.push('mute');
    if (c === 'KeyR') ui.push('restart');
    if (c === 'KeyH') ui.push('hint');
    if (c === 'Tab' || c === 'KeyB') ui.push('atlas');
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => { keys.clear(); ui.push('blur'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { keys.clear(); ui.push('blur'); } });

  // mouse drag orbits the camera
  let drag = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') { drag = true; lx = e.clientX; ly = e.clientY; } });
  addEventListener('pointermove', (e) => { if (drag) { camDX += e.clientX - lx; camDY += e.clientY - ly; lx = e.clientX; ly = e.clientY; } });
  addEventListener('pointerup', () => { drag = false; });

  // touch: left half = stick, right half = camera drag; buttons are DOM elements
  const camTouch = { id: -1, x: 0, y: 0 };
  canvas.addEventListener('touchstart', (e) => {
    for (const t of Array.from(e.changedTouches)) {
      const r = canvas.getBoundingClientRect();
      if (t.clientX - r.left < r.width * 0.45 && touchStick.id < 0) {
        touchStick.id = t.identifier; touchStick.ox = t.clientX; touchStick.oy = t.clientY; touchStick.x = touchStick.y = 0;
        showStick(root, t.clientX - r.left, t.clientY - r.top, 0, 0);
      } else if (camTouch.id < 0) { camTouch.id = t.identifier; camTouch.x = t.clientX; camTouch.y = t.clientY; }
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === touchStick.id) {
        const dx = t.clientX - touchStick.ox, dy = t.clientY - touchStick.oy;
        const l = Math.hypot(dx, dy), m = Math.min(1, l / 55);
        touchStick.x = l > 4 ? (dx / l) * m : 0;
        touchStick.y = l > 4 ? (-dy / l) * m : 0;
        const r = canvas.getBoundingClientRect();
        showStick(root, touchStick.ox - r.left, touchStick.oy - r.top, touchStick.x, -touchStick.y);
      } else if (t.identifier === camTouch.id) {
        camDX += (t.clientX - camTouch.x) * 1.2; camDY += (t.clientY - camTouch.y) * 1.2; camTouch.x = t.clientX; camTouch.y = t.clientY;
      }
    }
    e.preventDefault();
  }, { passive: false });
  const end = (e: TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === touchStick.id) { touchStick.id = -1; touchStick.x = touchStick.y = 0; hideStick(root); }
      if (t.identifier === camTouch.id) camTouch.id = -1;
    }
  };
  canvas.addEventListener('touchend', end);
  canvas.addEventListener('touchcancel', end);
}

function showStick(root: HTMLElement, x: number, y: number, dx: number, dy: number): void {
  let s = root.querySelector<HTMLElement>('.stick');
  if (!s) { s = document.createElement('div'); s.className = 'stick'; s.innerHTML = '<div class="knob"></div>'; root.appendChild(s); }
  s.style.display = 'block';
  s.style.left = `${x}px`;
  s.style.top = `${y}px`;
  (s.firstElementChild as HTMLElement).style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
}
function hideStick(root: HTMLElement): void { const s = root.querySelector<HTMLElement>('.stick'); if (s) s.style.display = 'none'; }

/** Touch / on-screen buttons call these. */
export const press = {
  jumpDown(): void { touchJump = true; jumpEdge = true; },
  jumpUp(): void { touchJump = false; },
  pound(): void { poundEdge = true; },
  action(): void { actionEdge = true; },
};

export function pollControls(): Controls {
  const k = (c: string) => keys.has(c);
  let x = (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0);
  let y = (k('KeyW') || k('ArrowUp') ? 1 : 0) - (k('KeyS') || k('ArrowDown') ? 1 : 0);
  if (touchStick.id >= 0) { x = touchStick.x; y = touchStick.y; }
  const l = Math.hypot(x, y);
  if (l > 1) { x /= l; y /= l; }
  const out: Controls = {
    stick: enabled ? { x, y } : { x: 0, y: 0 },
    jumpHeld: enabled && (k('Space') || touchJump),
    jumpPressed: enabled && jumpEdge,
    poundPressed: enabled && poundEdge,
    actionPressed: enabled && actionEdge,
    camDX, camDY, ui: ui.splice(0),
  };
  jumpEdge = poundEdge = actionEdge = false;
  camDX = camDY = 0;
  return out;
}
