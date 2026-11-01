import { v3, fromLatLon, norm, type V3 } from '../core/vec';
import { type LevelDef, freeBox, sphereBody } from '../core/level';
import type { Ball, Body, Motion } from '../core/physics';

// חגורת האסטרואידים: drifting rocks between a small Mars (behind, toward the Sun) and a huge Jupiter (ahead).
// Their gravity is tiny (floored for play), so a short tap jump from the side that faces the next rock carries Nuri
// across; a full jump at nothing flies off into space. One rock bobs up and down: ride it into a crumb.

interface Rock { id: string; c: V3; r: number; inf: number; motion?: Motion }
const ROCKS: Rock[] = [
  { id: 'a0', c: v3(0, 0, 0), r: 4.5, inf: 8 },
  { id: 'a1', c: v3(11, 0, 0), r: 3, inf: 7, motion: { kind: 'bob', dir: v3(0, 0, 1), amp: 1.2, period: 10, phase: 0 } },
  { id: 'a2', c: v3(20.5, 1, 0), r: 3.5, inf: 7, motion: { kind: 'bob', dir: v3(0, 1, 0), amp: 1.6, period: 8, phase: 0 } },
  { id: 'a3', c: v3(28.5, -0.5, 1), r: 2.6, inf: 6.5, motion: { kind: 'bob', dir: v3(1, 0, 0), amp: 0.8, period: 7, phase: 1 } },
  { id: 'a4', c: v3(38, 0, 0), r: 5, inf: 20 },
];
const rock = (id: string) => ROCKS.find((r) => r.id === id)!;
/** Route markers: a ball just inside each rock, so `ball:<id>` aims at the rock's near side as it drifts. */
const marker = (r: Rock): Ball => ({ id: `m-${r.id}`, center: v3(), radius: r.r - 0.1, parent: r.id });
const surfAt = (r: Rock, dir: V3, alt: number) => { const u = norm(dir); return { pos: v3(r.c.x + u.x * (r.r + alt), r.c.y + u.y * (r.r + alt), r.c.z + u.z * (r.r + alt)), up: u }; };

export const L10: LevelDef = {
  n: 10,
  slug: 'asteroid-belt',
  titleHe: 'חגורת האסטרואידים',
  worldNo: 3,
  worldId: 'asteroid',
  introHe: [
    'בין מאדים לצדק מסתובבים אינספור גושי סלע: חגורת האסטרואידים.',
    'הם קטנים כל כך שכוח הכבידה שלהם כמעט אפסי. עמדו על הצד שפונה לסלע הבא וקפצו קפיצה קצרה. קפיצה מלאה סתם לשמיים תעיף אתכם לחלל!',
  ],
  objectiveHe: 'דלגו מאסטרואיד לאסטרואיד אל הסלע הגדול שבו מחכה הדף',
  hintsHe: [
    'לחיצה קצרה על רווח = קפיצה קטנה. עמדו על הצד של הסלע שמסתכל אל הסלע הבא, ואז לחצו לחיצה קצרה.',
    'באמצע הדרך הסלע הבא מושך חזק יותר, ואתם נופלים אליו. הכבידה תמיד מושכת אל הגוף הקרוב.',
    'הסלע שעולה ויורד יכול להרים אתכם גבוה. עמדו עליו וחכו.',
  ],
  atlasHe: 'חגורת האסטרואידים נמצאת בין מאדים לצדק. אסטרואיד הוא גוש סלע שמקיף את השמש. האסטרואידים קטנים מאוד, ולכן כוח הכבידה שלהם חלש מאוד: ככל שגוף קטן יותר, הוא מושך פחות.',
  extraHe: 'לפי נאס"א: בסלע ברוחב כמה קילומטרים הכבידה חלשה פי אלפים מזו של כדור הארץ, וקפיצה הייתה מעיפה אתכם לחלל. במשחק חיזקנו אותה מעט כדי שתוכלו לנחות.',
  skillHe: 'כבידה של גוף קטן, כבידה אל הגוף הקרוב',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    const bodies: Body[] = ROCKS.map((r) => sphereBody(r.id, 'asteroid', r.c, r.r, r.inf, r.motion));
    const a2 = rock('a2');
    // a flat cap on top of the bobbing rock: stand on it to ride up
    const cap = { ...freeBox('a2cap', v3(0, a2.r - 0.15, 0), v3(0, 1, 0), 1.6, 0.6, 1.6), parent: 'a2' };
    const a4 = rock('a4');
    const pageSpot = surfAt(a4, v3(1, 0.25, 0.1), 0.9);
    return {
      bodies,
      boxes: [cap],
      balls: ROCKS.map(marker),
      zones: [],
      props: [],
      spawn: surfAt(rock('a0'), v3(0, 1, 0), 0.5),
      page: pageSpot,
      crumbs: [
        // at the top of the bobbing rock's ride
        { pos: v3(a2.c.x, a2.c.y + 1.6 + a2.r + 0.3 + 0.55, a2.c.z), up: v3(0, 1, 0) },
        // just above the first rock: a short tap reaches it, a full jump would fling you off into space
        surfAt(rock('a0'), v3(0, 1, 0), 3.6),
        // high above the big rock: a full jump, but not so wild that you fly off
        surfAt(a4, v3(0, 1, 0), 6.5),
      ],
      checkpoints: [surfAt(rock('a0'), v3(0, 1, 0), 0), surfAt(a4, v3(-1, 0.15, 0), 0)],
      pads: [],
      switches: [],
      sunDir: norm(v3(-0.6, 0.75, 0.3)),
      sky: [
        { kind: 'mars', dir: norm(v3(-1, 0.2, -0.5)), sizeDeg: 2.5 },
        { kind: 'jupiter', dir: norm(v3(1, 0.15, -0.35)), sizeDeg: 13 },
      ],
      decor: [
        { model: 'comet', pos: v3(22, 14, -18), up: v3(0, 1, 0), size: 3, yawDeg: 30 },
        { model: 'rock', pos: v3(8, -9, -10), up: v3(0, 1, 0), size: 2 },
        { model: 'rock', pos: v3(30, 10, 12), up: v3(0, 1, 0), size: 2.4 },
        { model: 'rock', pos: v3(48, -12, 9), up: v3(0, 1, 0), size: 1.8 },
        { model: 'crater', ...surfAt(rock('a0'), v3(-0.5, 0.6, 0.6), 0), size: 2 },
        { model: 'crater', ...surfAt(a4, v3(0.2, 0.8, -0.5), 0), size: 3 },
        { model: 'flag', ...surfAt(a4, v3(0.9, 0.45, 0.2), 0), size: 1 },
        { model: 'sign', ...surfAt(rock('a0'), v3(0.5, 0.85, 0.2), 0), size: 1, label: 'קפיצה קצרה ➜' },
      ],
    };
  },
  route: [
    { to: 'crumb:1', jump: 'tap', jumpAt: 0.5 },
    { to: 'ball:m-a1', jump: 'tap', jumpAt: 1.0, near: 1.2 },
    { to: 'ball:m-a2', jump: 'tap', jumpAt: 1.0, near: 1.2 },
    { to: 'top:a2cap', near: 0.6 },
    { to: 'crumb:0', timeout: 12 },
    { to: 'ball:m-a3', jump: 'tap', jumpAt: 1.0, near: 1.2 },
    { to: 'ball:m-a4', jump: 'tap', jumpAt: 1.0, near: 1.2 },
    { to: surfAt(rock('a4'), v3(0, 1, 0), 0.4).pos },
    { to: 'crumb:2', jump: 'full', jumpAt: 0.6 },
    { to: 'page' },
  ],
  routeTimeout: 200,
};
