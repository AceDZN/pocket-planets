import { v3, norm, add, type V3 } from '../core/vec';
import { type LevelDef, type BodyRef, type Spot, type Pad, freeBox, topOf, sphereBody, plat } from '../core/level';
import type { Body, Box } from '../core/physics';
import { spot, decoAt, deco, pad, ride } from './lib-b';

// The size ladder, one step at a time: a planet, a star system, a galaxy, a cluster of galaxies, the universe.
// Each stage ends in three launch pads named after sizes; only the next size up takes you on. A pad that goes back
// down or skips a step bounces you to the start of the stage. In the galaxy, first say where our Sun lives.

const UP = v3(0, 1, 0);
const LADDER = ['כוכב לכת', 'מערכת כוכב', 'גלקסיה', 'צביר גלקסיות', 'היקום'];
const X = [0, 120, 240, 360, 480];
const P: BodyRef = { id: 'planet', center: v3(0, 0, 0), radius: 6 };
const PL2_PERIOD = 26;

const o = (stage: number, x: number, y: number, z: number): V3 => v3(X[stage] + x, y, z);
const on = (b: Box, lift = 0.45): Spot => topOf(b, v3(), lift);

/** Three size pads; `order` lists ladder indexes left to right. */
function sizePads(stage: number, spots: Spot[], order: number[], next: Spot, back: Spot, when?: string): Pad[] {
  return order.map((k, i) => {
    const id = `s${stage}-${k}`;
    if (k === stage + 1) return pad(id, spots[i], LADDER[k], 'warp', { to: next, answer: String(k), when });
    const explainHe = k <= stage
      ? `בוינג! קפצתם אחורה בסולם: ${LADDER[k]} קטן יותר מ${LADDER[stage]}. כל מדרגה עולה לגודל הבא. חזרה לתחילת השלב.`
      : `וווּפּ! דילגתם על מדרגה: בין ${LADDER[stage]} ל${LADDER[k]} יש עוד גודל באמצע. חזרה לתחילת השלב.`;
    return pad(id, spots[i], LADDER[k], 'wrong', { back, explainHe, answer: String(k), when });
  });
}

const orbiting = (id: string, stage: number, y: number, radius: number, period: number, phase: number, tag: string): Box =>
  freeBox(id, o(stage, 0, y, radius), UP, 2.8, 0.6, 2.8, { tag, motion: { kind: 'orbit', center: o(stage, 0, y, 0), axis: UP, radius, period, phase } });

export const L17: LevelDef = {
  n: 17,
  slug: 'scale-steps',
  titleHe: 'מדרגות הגודל',
  worldNo: 4,
  worldId: 'deep',
  introHe: [
    'היקום בנוי כמו סולם של גדלים: כוכב לכת, מערכת כוכב, גלקסיה, צביר גלקסיות, ובסוף היקום כולו.',
    'בסוף כל שלב מחכים שלושה משטחי שיגור. רק הגודל הבא בסולם ימשיך אתכם הלאה.',
  ],
  objectiveHe: 'טפסו בסולם הגדלים: בחרו בכל שלב את הגודל הבא',
  hintsHe: [
    'כוכב לכת סובב סביב כוכב, ויחד הם מערכת כוכב. הרבה מערכות כוכבים יחד הן גלקסיה.',
    'השמש שלנו נמצאת באחת הזרועות של שביל החלב, רחוק מהמרכז.',
    'הרבה גלקסיות יחד הן צביר גלקסיות, וכל הצבירים יחד הם היקום.',
  ],
  atlasHe: 'סולם הגדלים ביקום: כוכב לכת ← מערכת כוכב ← גלקסיה ← צביר גלקסיות ← היקום. כדור הארץ הוא כוכב לכת במערכת השמש, מערכת השמש נמצאת בזרוע של הגלקסיה שביל החלב (לא במרכזה), ושביל החלב היא אחת הגלקסיות בצביר גלקסיות.',
  extraHe: 'הקוטר של שביל החלב הוא כ-100,000 שנות אור.',
  skillHe: 'סולם הגדלים ביקום',
  modules: ['grade-8/chapter-1/universe-structure'],
  build() {
    // 1: a little planet
    const mount = plat('mount', P, 10, 90, 0.9, 1.6, 1.4, 1.6);
    // 2: a star with planets orbiting it, and a deck beyond the outer orbit
    const sun = freeBox('sun', o(1, 0, 0, 0), UP, 5, 1, 5, { tag: 'star' });
    const pl1 = orbiting('pl1', 1, 2.2, 6.5, 20, 0.25, 'soil');
    const pl2 = orbiting('pl2', 1, 4.7, 11, PL2_PERIOD, 0.25, 'water');
    const deck2 = freeBox('deck2', o(1, 16, 7, 0), UP, 4, 1, 8.4, { tag: 'metal' });
    // 3: a galaxy: a bright crowded centre and a spiral arm of star tiles
    const bulge = freeBox('bulge', o(2, 0, 0, 0), UP, 7, 2, 7, { tag: 'galaxy' });
    const arm: Box[] = [
      [16, 0, -4, 1.0], [20, 1.4, 1, 1.6], [24, 2.8, 5, 2.2], [27, 4.4, 9.5, 2.8], [30, 6.0, 14, 3.4],
    ].map(([x, y, z, _], i) => freeBox(`arm${i + 1}`, o(2, x, y, z), UP, 3, 0.6, 3, { tag: 'galaxy' }));
    const deck3 = freeBox('deck3', o(2, 33, 7.4, 20), UP, 8.4, 1, 4, { tag: 'metal' });
    // 4: a cluster of galaxies, each a glowing disc
    const discs: Box[] = [[0, 0, 0], [7, 2.5, 3], [14, 1.5, -2], [20, 4, 2]].map(([x, y, z], i) =>
      freeBox(`g${i + 1}`, o(3, x, y, z), UP, 3.4, 0.6, 3.4, { tag: i % 2 ? 'cluster' : 'galaxy' }));
    const deck4 = freeBox('deck4', o(3, 27, 6, 2), UP, 4, 1, 8.4, { tag: 'metal' });
    // 5: the universe
    const u1 = freeBox('u1', o(4, 0, 0, 0), UP, 4, 1, 4, { tag: 'cluster' });
    const u2 = freeBox('u2', o(4, 8, 2.5, 0), UP, 3.4, 0.6, 3.4, { tag: 'galaxy' });
    const u3 = freeBox('u3', o(4, 15, 4.5, 2), UP, 4.4, 1, 4.4, { tag: 'cluster' });

    const boxes = [mount, sun, pl1, pl2, deck2, bulge, ...arm, deck3, ...discs, deck4, u1, u2, u3];
    const bodies: Body[] = [
      sphereBody('planet', 'earth', P.center, P.radius, 8),
      { id: 'field', kind: 'ring', world: 'deep', center: v3(240, -30, 0), radius: 0, influence: 50, normal: UP, inner: 0, outer: 320 },
    ];
    const starts: Spot[] = [spot(P, 0, 0, 0.5), on(sun), on(bulge), on(discs[0]), on(u1)];
    const deckRow = (b: Box, alongZ: boolean): Spot[] => [-2.6, 0, 2.6].map((d) => ({ pos: add(on(b).pos, alongZ ? v3(0, 0, d) : v3(d, 0, 0)), up: UP }));
    const sunInArm = on(arm[2]);
    return {
      bodies,
      boxes,
      balls: [],
      zones: [
        ...X.slice(1).map((x, i) => ({ id: `void${i + 1}`, kind: 'kill' as const, center: v3(x + 12, -75, 0), radius: 60, sayHe: 'נסחפתם אל הריק שבין הגלקסיות! חזרה לתחילת השלב.' })),
      ],
      props: [],
      spawn: starts[0],
      page: on(u3, 0.9),
      crumbs: [
        topOf(mount, P.center, 2.85),
        on(arm[4], 4.6),
        on(discs[3], 4.4),
      ],
      checkpoints: [],
      pads: [
        ...sizePads(0, [spot(P, 0, 155), spot(P, 0, 180), spot(P, 0, 205)], [2, 1, 3], starts[1], starts[0]),
        ...sizePads(1, deckRow(deck2, true), [4, 0, 2], starts[2], starts[1]),
        pad('sun-centre', { pos: add(on(bulge).pos, v3(-1.6, 0, 1.6)), up: UP }, 'השמש במרכז הגלקסיה', 'wrong', {
          back: starts[2], answer: 'centre',
          explainHe: 'אאוץ׳! במרכז שביל החלב צפוף מאוד בכוכבים. השמש שלנו נמצאת באחת הזרועות, רחוק מהמרכז. חזרה לתחילת השלב.',
        }),
        pad('sun-arm', { pos: add(on(bulge).pos, v3(1.6, 0, -1.6)), up: UP }, 'השמש בזרוע הגלקסיה', 'warp', { to: sunInArm, sets: 'sun-arm', answer: 'arm' }),
        ...sizePads(2, deckRow(deck3, false), [3, 1, 4], starts[3], sunInArm, 'sun-arm'),
        ...sizePads(3, deckRow(deck4, true), [2, 4, 0], starts[4], starts[3]),
      ],
      switches: [],
      sunDir: norm(v3(0.4, 0.8, 0.45)),
      sky: [
        { kind: 'galaxy', dir: norm(v3(-0.6, 0.4, -0.7)), sizeDeg: 16 },
        { kind: 'cluster', dir: norm(v3(0.7, 0.45, 0.5)), sizeDeg: 10 },
      ],
      paint: [
        { body: 'planet', lat: -20, lon: 60, deg: 40, color: '#2f7fd8', kind: 'water' },
        { body: 'planet', lat: 30, lon: -120, deg: 35, color: '#2f7fd8', kind: 'water' },
        { body: 'planet', lat: 90, lon: 0, deg: 20, color: '#eef6ff', kind: 'ice' },
      ],
      decor: [
        deco('sign', P, 8, 10, 0.8, 0, { label: '1 · כוכב לכת' }),
        deco('tree', P, -12, 40, 1.2), deco('tree', P, 20, -40, 1.4), deco('rock', P, -15, 120, 0.9),
        decoAt('star_beacon', on(sun, -0.45), 3.2, { label: '2 · מערכת כוכב' }),
        decoAt('sign', { pos: add(on(bulge).pos, v3(0, 0, -2.8)), up: UP }, 0.9, { label: '3 · גלקסיה: שביל החלב' }),
        decoAt('star_beacon', on(arm[2], -0.45), 0.9, { label: 'השמש שלנו כאן', when: 'sun-arm' }),
        decoAt('star_beacon', { pos: add(on(bulge).pos, v3(2.4, 0.6, 2.4)), up: UP }, 1.6),
        decoAt('star_beacon', { pos: add(on(bulge).pos, v3(-2.4, 0.6, -2.4)), up: UP }, 1.4),
        decoAt('sign', on(discs[0], -0.45), 0.9, { label: '4 · צביר גלקסיות' }),
        decoAt('sign', on(u1, -0.45), 0.9, { label: '5 · היקום' }),
        decoAt('comet', { pos: o(4, 6, 12, -10), up: UP }, 3),
      ],
    };
  },
  script: {
    tick(api) {
      // the outer planet swings past the deck once per orbit (angle 0 = +x side)
      const a = ((api.t / PL2_PERIOD + 0.25) % 1) * 360;
      const by = a > 60 && a < 100;
      if (by && !api.flags.has('pl2-by-deck')) api.setFlag('pl2-by-deck');
      if (!by && api.flags.has('pl2-by-deck')) api.clearFlag('pl2-by-deck');
    },
  },
  route: [
    { to: spot(P, 0, 70, 0.45).pos },
    { to: 'top:mount', jump: 'full', jumpAt: 1.8 },
    { to: 'crumb:0', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: spot(P, 0, 140, 0.45).pos },
    ...ride('s0-1'),
    { to: 'top:pl1', jump: 'full', jumpAt: 6, near: 1.0 },
    { to: 'top:pl2', jump: 'full', jumpAt: 6.5, near: 1.0 },
    { to: 'top:pl2', near: 1.0, until: 'pl2-by-deck' },
    { to: 'top:deck2', jump: 'full', jumpAt: 7 },
    ...ride('s1-2'),
    ...ride('sun-arm'),
    { to: 'top:arm4', jump: 'full', jumpAt: 4 },
    { to: 'top:arm5', jump: 'full', jumpAt: 4 },
    { to: 'crumb:1', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: 'top:arm5', near: 0.6 },
    { to: 'top:deck3', jump: 'full', jumpAt: 5 },
    ...ride('s2-3'),
    { to: 'top:g2', jump: 'full', jumpAt: 7.5 },
    { to: 'top:g3', jump: 'full', jumpAt: 7.5 },
    { to: 'top:g4', jump: 'full', jumpAt: 7.5 },
    { to: 'crumb:2', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: 'top:g4', near: 0.6 },
    { to: 'top:deck4', jump: 'full', jumpAt: 8 },
    ...ride('s3-4'),
    { to: 'top:u2', jump: 'full', jumpAt: 8 },
    { to: 'top:u3', jump: 'full', jumpAt: 8 },
    { to: 'page' },
  ],
  routeTimeout: 240,
};
