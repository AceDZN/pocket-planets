import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, plat, sphereBody, topOf, zone } from '../core/level';
import type { Zone } from '../core/physics';
import { deco, at, wp } from './lib-a';

// נוגה: 465 °C by day AND by night, so the run is a chain of cool stations no more than a few seconds apart.
// Pressure vents launch Nuri onto high rock; the thick air makes every fall a slow glide (over a lava field).

const V: BodyRef = { id: 'venus', center: v3(0, 0, 0), radius: 15 };
const SUN = norm(fromLatLon(10, 0));

const cool = (id: string, lat: number, lon: number, alt = 0, r = 1.7): Zone => zone(id, 'cool', at(V, lat, lon, alt + 0.5).pos, r);
const vent = (id: string, lat: number, lon: number, power: number, extra: Partial<Zone> = {}): Zone =>
  zone(id, 'launch', at(V, lat, lon, 0.3).pos, 0.9, { power, ...extra });
/** A lava pool: a kill sphere sunk into the ground so only a low dome of it rises above the surface. */
const lava = (id: string, lat: number, lon: number, r = 2.6, depth = 1.9): Zone =>
  zone(id, 'kill', at(V, lat, lon, -depth).pos, r, { sayHe: 'פלופ! נפלתם ללבה של נוגה. חזרה לתחנת הקירור.' });

export const L03: LevelDef = {
  n: 3,
  slug: 'venus-greenhouse',
  titleHe: 'נוגה הלוהטת',
  worldNo: 1,
  worldId: 'venus',
  thermo: true,
  introHe: [
    'נוגה רחוקה מהשמש יותר מכספית, ובכל זאת היא כוכב הלכת החם ביותר.',
    'האטמוספרה העבה שלה כולאת את החום כמו חממה, כך שחם בה ביום וגם בלילה. קפצו מתחנת קירור לתחנת קירור לפני שהחליפה מתבשלת.',
  ],
  objectiveHe: 'עברו מתחנת קירור לתחנה עד דף האטלס שבצד הלילה',
  hintsHe: [
    'עמדו רגע בתוך תחנת קירור כחולה: מד החום יורד מהר. בין התחנות אל תתעכבו.',
    'פתח האדים זורק אתכם למעלה. האוויר הסמיך מאט את הנפילה, אז מגובה אפשר לרחף רחוק מעל הלבה.',
    'בצד הלילה לא נעשה קר יותר. גם שם רוצו מתחנה לתחנה.',
  ],
  atlasHe: 'לנוגה יש אטמוספרה עבה מאוד שכולאת את החום כמו חממה, ולכן היא כוכב הלכת החם ביותר במערכת השמש, חמה יותר מכספית שקרובה יותר לשמש. החום שווה ביום ובלילה. נוגה היא כוכב לכת סלעי.',
  extraHe: 'לפי נאס"א: כ-465°C על פני השטח, ביום ובלילה. האוויר כבד פי 90 בערך מהאוויר שלנו, והכבידה כ-0.9 מזו של כדור הארץ. שנה בנוגה נמשכת כ-225 ימים.',
  skillHe: 'אטמוספרה עבה: חממה, נפילה איטית',
  modules: ['grade-8/chapter-1/solar-system', 'grade-8/chapter-1/earth-system'],
  build() {
    const wall = plat('wall', V, 0, 18, 0.9, 1.2, 3, 6);
    const caldera = plat('caldera', V, 0, 59, 3.6, 4.2, 6, 4.2, { tag: 'lava' });
    const island = plat('island', V, 0, 97, 0.7, 3.4, 2.5, 3.4);
    const hump = plat('hump', V, 0, 132, 1.0, 2.4, 3, 4);
    const stair1 = plat('stair1', V, 22, 118, 1.2, 1.8, 3, 1.8);
    const stair2 = plat('stair2', V, 30, 124, 2.4, 1.8, 4, 1.8);
    const cliff = plat('cliff', V, 0, 164, 3.4, 4, 6, 5);
    return {
      bodies: [sphereBody('venus', 'venus', V.center, V.radius, 40)],
      boxes: [wall, caldera, island, hump, stair1, stair2, cliff],
      balls: [],
      zones: [
        cool('c0', 0, 0), cool('c1', 0, 36), cool('c2', 0, 59, 3.6, 1.6), cool('c3', 0, 97, 0.7, 1.6),
        cool('c4', 0, 116), cool('c5', 0, 148),
        vent('v1', 0, 47, 13),
        vent('v2', 0, 153.5, 13, { period: 2.2, open: 1.1 }),
        lava('l1', 0, 72), lava('l2', 0, 79), lava('l3', 0, 86), lava('l4', 6, 75), lava('l5', -6, 75), lava('l6', 6, 83), lava('l7', -6, 83),
        lava('l8', 12, 79, 2.2, 1.6), lava('l9', -12, 79, 2.2, 1.6),
      ],
      props: [],
      spawn: at(V, 0, 0, 0.5),
      page: topOf(cliff, V.center, 0.9),
      crumbs: [
        // high in the vent's plume
        at(V, 0, 49, 3.9),
        // over the middle of the lava field, on the glide
        at(V, 0, 82, 3.4),
        // up a dead-end stair on the night side, far from any cool station
        topOf(stair2, V.center, 0.6),
      ],
      checkpoints: [at(V, 0, 36), topOf(caldera, V.center, 0.1), topOf(island, V.center, 0.1), at(V, 0, 116), at(V, 0, 148)],
      pads: [],
      switches: [],
      sunDir: SUN,
      paint: [
        { body: 'venus', lat: 0, lon: 79, deg: 16, color: '#ff5a1f', kind: 'lava' },
        { body: 'venus', lat: 40, lon: -60, deg: 25, color: '#c9783a', kind: 'dust' },
      ],
      decor: [
        deco('ice_crystal', V, 3, 0, 0.9), deco('ice_crystal', V, 3, 36, 0.9), deco('ice_crystal', V, 3.5, 116, 0.9), deco('ice_crystal', V, 3.5, 148, 0.9),
        deco('sign', V, -4, 2, 1, { label: 'תחנת קירור ❄' }),
        deco('sign', V, -6, 104, 1, { label: 'צד הלילה: עדיין 465°C' }),
        deco('crater', V, -30, 20, 5), deco('crater', V, 35, 80, 6), deco('crater', V, -35, 140, 5),
        deco('rock', V, 8, 25, 1), deco('rock', V, -9, 104, 1.2), deco('rock', V, 10, 140, 0.9),
        deco('cloud', V, 25, 40, 3, { yawDeg: 20 }), deco('cloud', V, -25, 110, 3), deco('cloud', V, 20, 170, 2.5),
      ],
    };
  },
  route: [
    { to: wp(V, 0, 12) },
    { to: wp(V, 0, 26), jump: 'full', jumpAt: 3.6 },
    { to: wp(V, 0, 36), wait: 0.5 },
    // walk into the vent: it throws you up through the crumb onto the caldera
    { to: 'crumb:0' },
    { to: 'top:caldera', near: 1.2 },
    { to: wp(V, 0, 59, 4.0), wait: 0.6 },
    // jump off the edge and glide over the lava on the thick air
    { to: 'top:island', jump: 'full', jumpAt: 8.8, near: 1.4 },
    { to: wp(V, 0, 97, 1.1), wait: 0.6 },
    { to: wp(V, 0, 116), wait: 0.6 },
    { to: 'top:stair1', jump: 'full', jumpAt: 2.2 },
    { to: 'top:stair2', jump: 'puff', jumpAt: 2.6 },
    { to: wp(V, 0, 116), wait: 0.8 },
    { to: 'top:hump', jump: 'full', jumpAt: 2 },
    { to: wp(V, 0, 148), wait: 0.6 },
    { to: 'top:cliff', near: 1.4 },
    { to: 'page' },
  ],
};
