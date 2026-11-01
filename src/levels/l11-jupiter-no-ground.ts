import { v3, norm } from '../core/vec';
import { type LevelDef, type BodyRef, plat, sphereBody, topOf, zone } from '../core/level';
import type { Ball, Body } from '../core/physics';
import { deco, at, wp } from './lib-a';

// צדק: a gas giant with no ground under its clouds. Nuri platforms across three of its moons (איו, אירופה, גנימד)
// hanging above it; a missed jump between moons drops out of their pull, and צדק's strong gravity drags you down
// through endless cloud (a safe cloud-fall back to the checkpoint). On אירופה a ground-pound cracks the ice lid and
// shows the liquid ocean beneath; the page waits in the crack.

const J = { id: 'jupiter', c: v3(0, -62, 0), r: 34 };
const IO: BodyRef = { id: 'io', center: v3(-30, 0, 0), radius: 9 };
const EU: BodyRef = { id: 'europa', center: v3(0, 4, 0), radius: 12 };
const GA: BodyRef = { id: 'ganymede', center: v3(34, 0, 0), radius: 11 };
const MOONS = [IO, EU, GA];

/** Route markers just inside each moon, so `ball:<id>` aims at its near side. */
const marker = (b: BodyRef): Ball => ({ id: `m-${b.id}`, center: v3(), radius: b.radius - 0.1, parent: b.id });
/** Lat/lon on a moon as seen from its own centre. */
const ll = (b: BodyRef, lat: number, lon: number, alt = 0) => at(b, lat, lon, alt);

export const L11: LevelDef = {
  n: 11,
  slug: 'jupiter-no-ground',
  titleHe: 'צדק בלי קרקע',
  worldNo: 3,
  worldId: 'jupiter',
  thermo: true,
  introHe: [
    'צדק הוא כוכב לכת גזי וענק. אין לו פני שטח מוצקים, רק עננים ועוד עננים.',
    'אז קופצים על הירחים שלו: איו, אירופה וגנימד. החטאתם קפיצה? צדק ימשוך אתכם לנפילה ארוכה בתוך העננים.',
  ],
  objectiveHe: 'קפצו מאיו אל אירופה, וסדקו את הקרח בהלימה (קפיצה ואז Shift)',
  hintsHe: [
    'עמדו על הצד של הירח שפונה לירח הבא, וקפצו קפיצה מלאה. באמצע הדרך הירח הבא כבר מושך אתכם.',
    'כאן קר מאוד, רחוק מהשמש. התחממו ליד הלבה של איו או בתחנות החימום הכתומות.',
    'על מכסה הקרח של אירופה: קפצו ולחצו Shift באוויר (או ⬇ במסך מגע) כדי להלום ולסדוק אותו.',
  ],
  atlasHe: 'צדק הוא כוכב הלכת הגדול ביותר במערכת השמש. הוא כוכב לכת גזי: בנוי בעיקר מגז ואין לו פני שטח מוצקים. סביבו מקיפים עשרות ירחים. שנה בצדק נמשכת כ-12 שנות ארץ.',
  extraHe: 'לפי נאס"א: מתחת לקרח של הירח אירופה יש כנראה אוקיינוס של מים נוזליים, ולכן מדענים מחפשים בו סימני חיים. הכבידה בשכבת העננים של צדק כ-2.5 מזו של כדור הארץ, והטמפרטורה שם כ-110°C מתחת לאפס. על איו יש הרי געש פעילים. גנימד הוא הירח הגדול ביותר במערכת השמש.',
  skillHe: 'כוכב לכת גזי בלי קרקע, ירחים, אוקיינוס מתחת לקרח',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    const bodies: Body[] = [
      { ...sphereBody('jupiter', 'jupiter', J.c, J.r, 70), kind: 'gas' },
      sphereBody('io', 'io', IO.center, IO.radius, 13),
      sphereBody('europa', 'europa', EU.center, EU.radius, 10),
      sphereBody('ganymede', 'ganymede', GA.center, GA.radius, 10),
    ];
    // Io: a volcano cone; Europa: the ice lid over the crack, an ice spire; Ganymede: a crater ledge
    const cone = plat('cone', IO, 75, 0, 1.4, 2.6, 3, 2.6, { tag: 'lava' });
    const lid = plat('lid', EU, 62, 30, 0.8, 2.8, 1.6, 2.8, { ice: true, tag: 'ice', unless: 'cracked' });
    const spire = plat('spire', EU, 70, 95, 4.6, 1.6, 7, 1.6, { ice: true, tag: 'ice' });
    const ledge = plat('ledge', GA, 30, -90, 2.2, 2.4, 4, 2.4);
    const pageSpot = ll(EU, 62, 30, 0.6);
    return {
      bodies,
      boxes: [cone, lid, spire, ledge],
      balls: MOONS.map(marker),
      zones: [
        // Io's volcano: a hot plume that throws you up, and warm lava ground around it
        zone('plume', 'launch', ll(IO, 75, 0, 1.4 + 0.3).pos, 1.0, { power: 9 }),
        zone('io-warm', 'warm', ll(IO, 62, 0, 0.5).pos, 3.2),
        zone('io-warm2', 'warm', ll(IO, 10, 90, 0.5).pos, 2.2),
        zone('eu-warm', 'warm', ll(EU, 8, -90, 0.5).pos, 2.4),
        zone('eu-warm2', 'warm', ll(EU, 52, 50, 0.5).pos, 2.4),
        zone('eu-warm3', 'warm', ll(EU, 50, -10, 0.5).pos, 2.4),
        zone('eu-warm4', 'warm', ll(EU, 6, 75, 0.5).pos, 2.4),
        zone('ga-warm', 'warm', ll(GA, 8, -90, 0.5).pos, 2.6),
        zone('ocean', 'water', pageSpot.pos, 2.5, { when: 'cracked' }),
      ],
      props: [],
      spawn: ll(IO, 40, 30, 0.5),
      page: { ...pageSpot, when: 'cracked' },
      crumbs: [
        // at the top of Io's volcanic plume
        ll(IO, 75, 0, 1.4 + 8.4),
        // on top of Europa's ice spire: a slippery landing
        topOf(spire, EU.center, 0.6),
        // a side trip to Ganymede, the biggest moon
        topOf(ledge, GA.center, 0.6),
      ],
      checkpoints: [ll(IO, 40, 30), ll(EU, 8, -90), ll(EU, 50, -10), ll(GA, 8, -90), ll(EU, 6, 75), ll(EU, 52, 50)],
      pads: [],
      switches: [
        { id: 'crack', pos: topOf(lid, EU.center, 0).pos, up: topOf(lid, EU.center, 0).up, radius: 1.8, by: 'pound', sets: 'cracked' },
      ],
      sunDir: norm(v3(0.3, 0.9, 0.35)),
      paint: [
        { body: 'io', lat: 60, lon: 0, deg: 22, color: '#ffcf3a', kind: 'lava' },
        { body: 'io', lat: -30, lon: 140, deg: 30, color: '#e8a21a', kind: 'sand' },
        { body: 'europa', lat: 0, lon: 0, deg: 180, color: '#e8f2ff', kind: 'ice' },
        { body: 'europa', lat: 62, lon: 30, deg: 10, color: '#1f6fd6', kind: 'water', when: 'cracked' },
        { body: 'ganymede', lat: 20, lon: 60, deg: 35, color: '#8a8070', kind: 'dust' },
      ],
      decor: [
        deco('crater', IO, 20, 120, 3), deco('crater', IO, -40, -40, 4),
        deco('crystal', IO, 66, 20, 0.8), deco('rock', IO, 50, -20, 1),
        deco('ice_crystal', EU, 30, -60, 1.2), deco('ice_crystal', EU, 20, 140, 1), deco('ice_crystal', EU, 70, 120, 0.9),
        deco('sign', EU, 52, 18, 1, { label: 'מכסה קרח: קפיצה + Shift' }),
        deco('crater', GA, -10, 40, 5), deco('crater', GA, 40, -30, 4), deco('flag', GA, 20, -80, 1),
        deco('satellite', EU, 75, 60, 0.8, { unless: 'cracked' }),
      ],
    };
  },
  script: {
    event(api, ev) {
      if (ev.type === 'switch' && ev.id === 'crack') {
        api.say('קראק! מתחת לקרח של אירופה מתגלים מים נוזליים (העשרה: מדענים חושבים שיש שם אוקיינוס שלם).', 'good');
        api.emit('reveal', ev.at);
        api.objective('קחו את דף האטלס מתוך הסדק');
        api.log('crack', 'europa-ocean');
      }
    },
  },
  route: [
    // Io's plume and back down onto Io
    { to: wp(IO, 68, 0, 0.4) },
    { to: 'crumb:0', jump: 'tap', jumpAt: 4, timeout: 12 },
    { to: wp(IO, 10, 80, 0.4) },
    // the jump to Europa from Io's Europa-facing side
    { to: 'ball:m-europa', jump: 'full', jumpAt: 1.2, near: 1.5 },
    { to: wp(EU, 8, -90, 0.4), wait: 0.5 },
    { to: wp(EU, 50, -10, 0.4), wait: 0.8 },
    { to: wp(EU, 6, 75, 0.4), wait: 0.6 },
    // side trip to Ganymede and back
    { to: 'ball:m-ganymede', jump: 'full', jumpAt: 1.2, near: 1.5 },
    { to: 'crumb:2', jump: 'full', jumpAt: 2.5 },
    { to: wp(GA, 8, -90, 0.4), wait: 0.6 },
    { to: 'ball:m-europa', jump: 'full', jumpAt: 1.2, near: 1.5 },
    { to: wp(EU, 6, 75, 0.4), wait: 0.6 },
    { to: wp(EU, 52, 50, 0.4), wait: 0.6 },
    { to: 'top:spire', jump: 'full', jumpAt: 3.5, near: 1.0 },
    { to: wp(EU, 52, 50, 0.4), wait: 0.8 },
    { to: 'crack', pound: true, near: 0.9 },
    { to: 'page' },
  ],
  routeTimeout: 200,
};
