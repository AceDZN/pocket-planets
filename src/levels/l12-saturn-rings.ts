import { v3, norm, type V3 } from '../core/vec';
import { type LevelDef, type Spot, freeBox, sphereBody, zone } from '../core/level';
import type { Body, Box, Zone } from '../core/physics';

// טבעות שבתאי: chunks of ice and rock floating in the ring plane. Gravity pulls toward the plane from either side, so
// you can stand on top of a chunk or on its underside, and a fall through a gap just bobs you back. The pull is tiny
// (floored for play): taps carry you far. Inside the ring's inner edge שבתאי itself takes over: a long cloud fall.
// At the outer edge waits אנצ׳לדוס, whose ice geyser throws you up to the page.

const SAT = { c: v3(0, 0, 0), r: 18 };
const RING = { inner: 25, outer: 60 };
const H = 1.2; // chunk thickness, centred on the plane
const polar = (rho: number, deg: number, y = 0): V3 => { const a = (deg * Math.PI) / 180; return v3(rho * Math.sin(a), y, rho * Math.cos(a)); };

interface Chunk { id: string; rho: number; deg: number; w: number; d: number; ice?: boolean; period?: number }
const CHUNKS: Chunk[] = [
  { id: 'k0', rho: 34, deg: 0, w: 4.4, d: 4.4 },
  { id: 'kin', rho: 27.5, deg: -11, w: 2.4, d: 2.4, ice: true },
  { id: 'k1', rho: 38.5, deg: 12, w: 3.4, d: 3.4, ice: true },
  { id: 'k2', rho: 42.5, deg: 24, w: 3.6, d: 3.6, period: 900 },
  { id: 'k3', rho: 47, deg: 34, w: 4, d: 4 },
  { id: 'k4', rho: 51, deg: 44, w: 3.4, d: 3.4, ice: true },
  { id: 'k5', rho: 56, deg: 54, w: 4, d: 4 },
];
const chunk = (id: string) => CHUNKS.find((k) => k.id === id)!;
const top = (k: Chunk, lift = 0.4): Spot => ({ pos: polar(k.rho, k.deg, H / 2 + lift), up: v3(0, 1, 0) });

/** אנצ׳לדוס: just outside the rings, a little below their plane. */
const ENC = { c: polar(65, 60, -7), r: 4 };
const encTop = (alt: number): V3 => v3(ENC.c.x, ENC.c.y + ENC.r + alt, ENC.c.z);

export const L12: LevelDef = {
  n: 12,
  slug: 'saturn-rings',
  titleHe: 'טבעות שבתאי',
  worldNo: 3,
  worldId: 'ring',
  thermo: true,
  introHe: [
    'שבתאי הוא כוכב לכת גזי, וסביבו טבעות של גושי קרח וסלע שמקיפים אותו.',
    'במשחק הזה, גושי הטבעת מושכים אתכם אל המישור שלה, מלמעלה וגם מלמטה. דלגו מגוש לגוש החוצה, אל הירח אנצ׳לדוס. אל תיפלו פנימה, אל שבתאי!',
  ],
  objectiveHe: 'דלגו על גושי הטבעת החוצה אל אנצ׳לדוס, ותנו לגייזר לזרוק אתכם אל הדף',
  hintsHe: [
    'הכבידה כאן חלשה מאוד: לחיצה קצרה על רווח מספיקה כדי לעבור לגוש הבא.',
    'נפלתם בין הגושים? הכבידה מושכת אל מישור הטבעת, אז תתנדנדו חזרה. אפשר גם לעמוד מתחת לגוש!',
    'קר מאוד ליד שבתאי. עצרו ליד משואות החימום הכתומות.',
  ],
  atlasHe: 'שבתאי הוא כוכב לכת גזי, ידוע בטבעות שלו: מיליוני גושי קרח וסלע שמקיפים אותו. לשבתאי אין פני שטח מוצקים. לירח שלו אנצ׳לדוס יש מים נוזליים מתחת לקרח, שפורצים החוצה בסדקים, ולכן מדענים מחפשים בו תנאים לחיים.',
  extraHe: 'לפי נאס"א: הטבעות רחבות מאוד, כ-280,000 ק"מ, אבל דקות מאוד, לרוב פחות מקילומטר. שבתאי רחוק מהשמש פי 9.5 בערך מכדור הארץ, ושנה בו נמשכת כ-29.5 שנות ארץ.',
  skillHe: 'כוכב לכת גזי, טבעות, מים מתחת לקרח',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    const bodies: Body[] = [
      { ...sphereBody('saturn', 'saturn', SAT.c, SAT.r, 60), kind: 'gas' },
      { id: 'ring', kind: 'ring', world: 'ring', center: v3(), radius: 0, influence: 26, normal: v3(0, 1, 0), inner: RING.inner, outer: RING.outer },
      sphereBody('enceladus', 'enceladus', ENC.c, ENC.r, 14),
    ];
    const boxes: Box[] = CHUNKS.map((k) => freeBox(k.id, polar(k.rho, k.deg), v3(0, 1, 0), k.w, H, k.d, {
      yaw: -k.deg, ice: k.ice, tag: k.ice ? 'ice' : undefined,
      motion: k.period ? { kind: 'orbit', center: v3(), axis: v3(0, 1, 0), radius: k.rho, period: k.period, phase: k.deg / 360 } : undefined,
    }));
    const warm = (id: string, p: V3, r = 2.4): Zone => zone(id, 'warm', p, r);
    return {
      bodies,
      boxes,
      balls: [],
      zones: [
        // a heater beacon on every chunk: out here a hop takes seconds, and the cold bites fast
        ...CHUNKS.map((k) => warm(`w-${k.id}`, top(k).pos, Math.max(k.w, k.d) * 0.75 + 0.6)),
        warm('we', encTop(0.5), 3),
        // the ice geyser: water from the ocean under the ice bursts out every few seconds
        zone('geyser', 'launch', encTop(0.3), 1.1, { power: 6.8, period: 3, open: 1.2 }),
      ],
      props: [],
      spawn: top(chunk('k0'), 0.6),
      page: { pos: encTop(10.5), up: v3(0, 1, 0) },
      crumbs: [
        // in the geyser's plume: wait for the eruption
        { pos: encTop(5.5), up: v3(0, 1, 0) },
        // high above chunk k4: a full jump (the tiny gravity takes a while to bring you back)
        { pos: polar(51, 44, 9), up: v3(0, 1, 0) },
        // on the little ice chunk at the inner edge, right above שבתאי
        top(chunk('kin'), 0.5),
      ],
      checkpoints: [top(chunk('k0'), 0), top(chunk('k3'), 0), top(chunk('k5'), 0), { pos: encTop(0), up: v3(0, 1, 0) }],
      pads: [],
      switches: [],
      sunDir: norm(v3(0.6, 0.45, -0.65)),
      sky: [{ kind: 'jupiter', dir: norm(v3(-0.7, 0.2, -0.7)), sizeDeg: 1.2 }],
      decor: [
        { model: 'ice_crystal', ...top(chunk('k1'), 0), size: 0.8 },
        { model: 'rock', ...top(chunk('k3'), 0), size: 0.9, yawDeg: 40 },
        { model: 'ice_crystal', ...top(chunk('k5'), 0), size: 1 },
        { model: 'star_beacon', ...top(chunk('k0'), 0), size: 0.6 },
        { model: 'star_beacon', ...top(chunk('k4'), 0), size: 0.6 },
        { model: 'sign', pos: polar(33, 3, H / 2), up: v3(0, 1, 0), size: 1, label: '⬅ שבתאי: אין קרקע!' },
        { model: 'ice_crystal', pos: polar(30, 20, 0.5), up: v3(0, 1, 0), size: 1.6 },
        { model: 'rock', pos: polar(45, 10, -0.4), up: v3(0, 1, 0), size: 1.4 },
        { model: 'ice_crystal', pos: polar(53, 30, 0.2), up: v3(0, 1, 0), size: 1.3 },
        { model: 'rock', pos: polar(40, 50, 0.3), up: v3(0, 1, 0), size: 1.2 },
        { model: 'ice_crystal', pos: polar(58, 40, -0.3), up: v3(0, 1, 0), size: 1.1 },
        { model: 'crater', pos: v3(ENC.c.x + ENC.r * 0.6, ENC.c.y + ENC.r * 0.8, ENC.c.z), up: norm(v3(0.6, 0.8, 0)), size: 1.4, parent: undefined },
      ],
    };
  },
  script: {
    event(api, ev) {
      if (ev.type === 'launch' && ev.id === 'geyser' && !api.state.geyserSaid) {
        api.state.geyserSaid = true;
        api.say('ששש! מים מהאוקיינוס שמתחת לקרח של אנצ׳לדוס פורצים החוצה וזורקים אתכם למעלה.', 'good');
      }
    },
  },
  route: [
    // side trip to the inner edge (don't overshoot: past it, שבתאי pulls you into its clouds)
    { to: 'crumb:2', jump: 'tap', jumpAt: 9 },
    { to: 'top:k0', jump: 'tap', jumpAt: 16, near: 1.2 },
    { to: 'top:k1', jump: 'tap', jumpAt: 16, near: 1.2 },
    { to: 'top:k2', jump: 'tap', jumpAt: 16, near: 1.2 },
    { to: 'top:k3', jump: 'tap', jumpAt: 16, near: 1.2 },
    { to: 'top:k4', jump: 'tap', jumpAt: 16, near: 1.2 },
    { to: 'crumb:1', jump: 'full', jumpAt: 1 },
    { to: 'top:k5', jump: 'tap', jumpAt: 16, near: 1.2 },
    { to: encTop(0.4), jump: 'tap', jumpAt: 12, near: 1.0 },
    { to: 'crumb:0', timeout: 15 },
    { to: 'page', wait: 8, timeout: 15 },
  ],
  routeTimeout: 240,
};
