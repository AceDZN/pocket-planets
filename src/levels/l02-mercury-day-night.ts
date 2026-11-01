import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, plat, sphereBody, topOf } from '../core/level';
import { deco, at, wp } from './lib-a';

// כספית: the Sun hangs low over the twilight band (lon ≈ 0). East of it is the scorching day side, west of it the
// freezing night side. The course runs north along the band; one crumb sits under the high Sun and needs shade stops.

const M: BodyRef = { id: 'mercury', center: v3(0, 0, 0), radius: 16 };
/** The Sun stands 3.7° above the eastern horizon at lon 0, so the comfy band is a meridian strip there. */
const SUN = norm(fromLatLon(0, 86.3));
/** Shade rocks on the day side, east along the equator, taller where the Sun is higher. */
/** South of the band's equator crossing, so the rocks' long low-Sun shadows don't fall on the checkpoint. */
const ROCK_LAT = -8;
const ROCKS: Array<[lon: number, top: number]> = [[18, 2.0], [32, 2.4], [46, 2.8], [60, 3.0]];

export const L02: LevelDef = {
  n: 2,
  slug: 'mercury-day-night',
  titleHe: 'כספית, צד יום וצד לילה',
  worldNo: 1,
  worldId: 'mercury',
  thermo: true,
  introHe: [
    'כספית קרובה מאוד לשמש, ואין לה אטמוספרה ששומרת ומפזרת את החום.',
    'בצד היום החליפה מתבשלת, ובצד הלילה היא קופאת. רוצו צפונה לאורך רצועת הדמדומים, שם בדיוק נעים.',
  ],
  objectiveHe: 'רוצו לאורך רצועת הדמדומים אל דף האטלס שעל הצוק בצפון',
  hintsHe: [
    'הסתכלו על מד החום: מזרחה (לכיוון השמש) חם מדי, מערבה קר מדי. הרצועה האפורה שביניהם בטוחה.',
    'בצד היום, עמדו רגע בצל של סלע גבוה כדי שהחליפה תתקרר, ורק אז רוצו הלאה.',
    'הכבידה בכספית חלשה: קפיצה מלאה ועוד נשיפת סילון באוויר מגיעות לראש הצוק.',
  ],
  atlasHe: 'כספית היא כוכב הלכת הקרוב ביותר לשמש. אין לה אטמוספרה שתשמור את החום, ולכן בצד המואר חם מאוד ובצד החשוך קר מאוד. היא כוכב לכת סלעי, עם קרקע מוצקה ומכתשים.',
  extraHe: 'לפי נאס"א: ביום כ-430°C ובלילה כ-180°C מתחת לאפס. הכבידה כ-0.38 מזו של כדור הארץ. שנה בכספית (הקפה אחת סביב השמש) נמשכת כ-88 ימים.',
  skillHe: 'אין אטמוספרה: יום לוהט, לילה קפוא, צל מקרר',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    const scarp = plat('scarp', M, -42, 0, 2.6, 8, 5, 2.4);
    const pillar = plat('pillar', M, 16, -24, 4.0, 1.6, 6.5, 1.6);
    const mesa = plat('mesa', M, 50, 0, 3.7, 4, 7, 4);
    const rocks = ROCKS.map(([lon, top], i) => plat(`r${i + 1}`, M, ROCK_LAT, lon, top, 2.0, top + 2.5, 2.6));
    return {
      bodies: [sphereBody('mercury', 'mercury', M.center, M.radius, 40)],
      boxes: [scarp, pillar, mesa, ...rocks],
      balls: [],
      zones: [],
      props: [],
      spawn: at(M, -62, 0, 0.5),
      page: topOf(mesa, M.center, 0.9),
      crumbs: [
        // under the high Sun, past the shade rocks
        at(M, ROCK_LAT, 71, 2.6),
        // on a night-side pillar: full jump + puff, and quick before you freeze
        topOf(pillar, M.center, 0.6),
        // over the scarp, catch it at the top of a Mercury jump
        at(M, -36, 0, 5.2),
      ],
      checkpoints: [at(M, -30, 0), at(M, 0, 2), at(M, 32, 0)],
      pads: [],
      switches: [],
      sunDir: SUN,
      decor: [
        deco('crater', M, -20, 30, 6), deco('crater', M, 20, 50, 5), deco('crater', M, -10, -60, 7), deco('crater', M, 40, -40, 4),
        deco('rock', M, -52, 6, 1.2), deco('rock', M, 24, -6, 0.9), deco('rock', M, 8, 92, 1.1),
        deco('sign', M, -58, 3, 1, { label: 'רצועת הדמדומים ⬆' }),
        deco('sign', M, -3, 9, 1, { label: '☀ צד היום: היעזרו בצל' }),
        // frost crystals on the night side, so the cold half reads from the road (visual target 02)
        deco('ice_crystal', M, -40, -24, 1.1), deco('ice_crystal', M, -20, -31, 0.8), deco('ice_crystal', M, 0, -27, 1.3), deco('ice_crystal', M, 18, -35, 0.9), deco('ice_crystal', M, 35, -25, 1.2), deco('ice_crystal', M, -55, -36, 1), deco('ice_crystal', M, 10, -52, 1.4), deco('ice_crystal', M, 50, -42, 0.9), deco('ice_crystal', M, -28, -60, 1.2), deco('ice_crystal', M, 28, -70, 1),
        deco('flag', M, 46, 3, 1),
      ],
    };
  },
  route: [
    { to: 'top:scarp', jump: 'full', jumpAt: 2.0 },
    { to: 'crumb:2', jump: 'full', jumpAt: 1.5 },
    { to: wp(M, -30, 0) },
    { to: wp(M, 0, 2) },
    // day side: hop rock to rock and cool down in each rock's shadow (west of it)
    { to: 'top:r1', jump: 'full', jumpAt: 3, near: 1.1 },
    { to: wp(M, ROCK_LAT, 32 - 7), wait: 2 },
    { to: 'top:r2', jump: 'full', jumpAt: 3, near: 1.1 },
    { to: wp(M, ROCK_LAT, 46 - 7), wait: 2 },
    { to: 'top:r3', jump: 'full', jumpAt: 3, near: 1.1 },
    { to: wp(M, ROCK_LAT, 60 - 7), wait: 2 },
    { to: 'top:r4', jump: 'full', jumpAt: 3, near: 1.1 },
    { to: 'crumb:0', jump: 'full', jumpAt: 4 },
    // run back round the rock's north side into its shadow
    { to: wp(M, ROCK_LAT + 7, 67) },
    { to: wp(M, ROCK_LAT + 7, 53) },
    { to: wp(M, ROCK_LAT, 60 - 7), wait: 3 },
    { to: 'top:r3', jump: 'full', jumpAt: 3, near: 1.1 },
    { to: wp(M, ROCK_LAT, 46 - 7), wait: 2 },
    { to: 'top:r2', jump: 'full', jumpAt: 3, near: 1.1 },
    { to: wp(M, ROCK_LAT, 32 - 7), wait: 2 },
    { to: 'top:r1', jump: 'full', jumpAt: 3, near: 1.1 },
    { to: wp(M, 2, 3) },
    // night side pillar, then back into the band
    { to: wp(M, 14, -16) },
    { to: 'top:pillar', jump: 'puff', jumpAt: 1.6 },
    { to: wp(M, 22, 0) },
    { to: wp(M, 38, 0) },
    { to: 'top:mesa', jump: 'puff', jumpAt: 3.5, near: 1.2 },
    { to: 'page' },
  ],
};
