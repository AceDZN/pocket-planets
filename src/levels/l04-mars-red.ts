import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, plat, hill, sphereBody, topOf, zone } from '../core/level';
import { deco, at, wp } from './lib-a';

// מאדים: low gravity makes every jump long and slow. Climb a pillar run through a dust storm (a crosswind zone, the
// route hidden in dust clouds) onto the flank of a giant volcano and up to its summit. A parked rover and the polar
// ice cap hold the side crumbs.

const M: BodyRef = { id: 'mars', center: v3(0, 0, 0), radius: 18 };
const SUN = norm(fromLatLon(15, 30));
/** The volcano: a big dome, steep at its foot (too steep to walk) and walkable higher up. */
const VOLC = { lat: 0, lon: 62, r: 9, h: 8 };
/** Pillars through the storm: each step rises about 2 (an Earth jump with its puff reaches 1.7). */
const PILLARS: Array<[lon: number, top: number]> = [[24, 2.1], [31, 4.2], [38, 6.3]];

export const L04: LevelDef = {
  n: 4,
  slug: 'mars-red',
  titleHe: 'מאדים האדום',
  worldNo: 1,
  worldId: 'mars',
  introHe: [
    'מאדים הוא כוכב לכת סלעי, אדום מאבק של חלודה. הכבידה בו חלשה, אז כל קפיצה ארוכה ואיטית.',
    'האוויר דליל מאוד, אבל הרוח מרימה סופות אבק ענקיות. טפסו דרך הסופה אל פסגת הר הגעש.',
  ],
  objectiveHe: 'טפסו על העמודים דרך סופת האבק אל פסגת הר הגעש',
  hintsHe: [
    'בתוך הסופה הרוח דוחפת הצידה. כוונו קצת נגד הרוח בזמן הקפיצה.',
    'כל עמוד גבוה מהקודם. קפיצה מלאה במאדים מספיקה, ונשיפת הסילון עוזרת אם נשארתם קצרים.',
    'למטה הר הגעש תלול מדי ללכת. עלו עליו מהעמוד הגבוה, ומשם צעדו אל הפסגה.',
  ],
  atlasHe: 'מאדים הוא כוכב לכת סלעי, רביעי מהשמש. צבעו אדום בגלל אבק עשיר בברזל. יש לו אטמוספרה דלילה מאוד, סופות אבק, כיפות קרח בקטבים והרי געש ענקיים. בגלל המרחק הגדול יותר מהשמש, שנה במאדים ארוכה יותר: כ-687 ימים.',
  extraHe: 'לפי נאס"א: הכבידה כ-0.38 מזו של כדור הארץ. הר הגעש אולימפוס מונס גבוה כ-22 ק"מ, פי 2.5 בערך מהאוורסט. הטמפרטורה ממוצעת כ-65°C מתחת לאפס.',
  skillHe: 'כבידה חלשה, אוויר דליל, סופת אבק',
  modules: ['grade-8/chapter-1/solar-system', 'grade-8/chapter-1/space-exploration'],
  build() {
    const rover = plat('rover', M, -4, 9, 1.3, 2.0, 2.6, 2.8, { tag: 'metal' });
    const pillars = PILLARS.map(([lon, top], i) => plat(`p${i + 1}`, M, 0, lon, top, 1.7, top + 3, 1.7));
    const ice1 = plat('ice1', M, 52, 4, 1.6, 2.4, 3, 2.4, { ice: true, tag: 'ice' });
    const ice2 = plat('ice2', M, 60, 0, 3.4, 2.0, 5, 2.0, { ice: true, tag: 'ice' });
    const volcano = hill('volcano', M, VOLC.lat, VOLC.lon, VOLC.r, VOLC.h);
    const summit = at(M, VOLC.lat, VOLC.lon, VOLC.h);
    return {
      bodies: [sphereBody('mars', 'mars', M.center, M.radius, 45)],
      boxes: [rover, ...pillars, ice1, ice2],
      balls: [volcano],
      zones: [
        zone('storm', 'wind', at(M, 0, 31, 3).pos, 7.5, { dir: fromLatLon(-90, 0), power: 5 }),
      ],
      props: [],
      spawn: at(M, 0, 0, 0.5),
      page: { pos: summit.pos, up: summit.up },
      crumbs: [
        // above the rover's mast: jump from its roof
        at(M, -4, 9, 1.3 + 4.1),
        // high in the storm between two pillars: the wind drifts you, a puff gets you there
        at(M, 0, 34.5, 7.4),
        // on the polar ice cap: a slippery landing
        topOf(ice2, M.center, 0.6),
      ],
      checkpoints: [at(M, 0, 16), topOf(pillars[2], M.center, 0.1)],
      pads: [],
      switches: [],
      sunDir: SUN,
      sky: [{ kind: 'earth', dir: fromLatLon(40, -60), sizeDeg: 2 }],
      paint: [
        { body: 'mars', lat: 90, lon: 0, deg: 38, color: '#f2f6ff', kind: 'ice' },
        { body: 'mars', lat: -20, lon: 120, deg: 30, color: '#9a3b1c', kind: 'dust' },
        { body: 'mars', lat: 0, lon: VOLC.lon, deg: 20, color: '#7a2e16', kind: 'dust' },
      ],
      decor: [
        deco('rover', M, -4, 9, 1.4, { yawDeg: 90 }),
        deco('flag', M, 4, 3, 1),
        deco('sign', M, 3, 15, 1, { label: 'סופת אבק ⚠' }),
        deco('cloud', M, 6, 26, 4), deco('cloud', M, -6, 31, 5), deco('cloud', M, 4, 37, 4.5), deco('cloud', M, -3, 22, 3.5),
        deco('star_beacon', M, 2, 24, 0.7), deco('star_beacon', M, 2, 31, 0.7), deco('star_beacon', M, 2, 38, 0.7),
        deco('crater', M, -30, 20, 6), deco('crater', M, 25, 100, 7), deco('crater', M, -15, -40, 5),
        deco('rock', M, 10, 12, 1), deco('rock', M, -12, 45, 1.3), deco('rock', M, 30, -10, 0.9),
        deco('ice_crystal', M, 56, 8, 0.8), deco('ice_crystal', M, 62, -6, 0.7),
      ],
    };
  },
  route: [
    { to: 'top:rover', jump: 'full', jumpAt: 2.6, near: 1.0 },
    { to: 'crumb:0', jump: 'full', jumpAt: 1.0 },
    { to: wp(M, 30, 2) },
    { to: 'top:ice1', jump: 'full', jumpAt: 3.0, near: 1.0 },
    { to: 'crumb:2', jump: 'full', jumpAt: 3.4 },
    { to: wp(M, 30, 4) },
    { to: wp(M, 0, 16) },
    { to: 'top:p1', jump: 'full', jumpAt: 3.0, near: 1.0 },
    { to: 'top:p2', jump: 'full', jumpAt: 3.4, near: 1.0 },
    { to: 'crumb:1', jump: 'puff', jumpAt: 2.5 },
    { to: 'top:p3', jump: 'full', jumpAt: 3.6, near: 1.0 },
    // onto the walkable upper slope of the volcano, then up to the summit
    { to: wp(M, 0, 48, 6.6), jump: 'full', jumpAt: 4.5, near: 1.2 },
    { to: 'page' },
  ],
};
