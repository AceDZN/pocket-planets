import { v3, fromLatLon, norm, cross, addScaled, add, scale, type V3 } from '../core/vec';
import { type LevelDef, type BodyRef, type Pad, type Spot, type Switch, sphereBody, plat, topOf, zone } from '../core/level';
import type { Body } from '../core/physics';

// Transfer: a launch station sends Nuri to four worlds in a mixed order. Before each launch, predict: will there be
// ground? Boots (מגפיים) for a rocky world, the cloud-skimmer (רחפן עננים) for a gas giant, where it makes the cloud
// deck hold you up. Boots into a gas giant: a long fall through the clouds and back to the station. The skimmer on rock:
// BONK, and back to the station. Neither "always boots" nor "always skimmer" (nor alternating) gets through.

const HUB = { id: 'hub', c: v3(0, 0, 0), r: 8 };
const HUB_REF: BodyRef = { id: HUB.id, center: HUB.c, radius: HUB.r };
const SUN = norm(fromLatLon(25, 60));

interface Dest { id: string; world: string; he: string; gas: boolean; c: V3; r: number; inf: number }
/** Mixed order: rocky, gas, gas, rocky. */
const DESTS: Dest[] = [
  { id: 'mars', world: 'mars', he: 'מאדים', gas: false, c: v3(220, 0, 0), r: 10, inf: 30 },
  { id: 'saturn', world: 'saturn', he: 'שבתאי', gas: true, c: v3(0, 0, 240), r: 18, inf: 40 },
  { id: 'neptune', world: 'neptune', he: 'נפטון', gas: true, c: v3(-240, 0, 0), r: 16, inf: 40 },
  { id: 'mercury', world: 'mercury', he: 'כספית', gas: false, c: v3(0, 0, -220), r: 9, inf: 30 },
];

/** A spot on a body in direction `u` (unit) at altitude `alt`. */
const onBody = (c: V3, r: number, u: V3, alt = 0): Spot => ({ pos: addScaled(c, u, r + alt), up: u });
/** Where each world's landing and beacon face: the top, except on כספית, where it is the twilight band. */
const landingUp = (d: Dest): V3 => (d.id === 'mercury' ? norm(addScaled(norm(cross(SUN, v3(0, 1, 0))), SUN, 0.06)) : v3(0, 1, 0));
/** `arc` units along the surface from the landing (negative: the other way). */
const fromLanding = (d: Dest, arc: number): V3 => {
  const u = landingUp(d);
  const along = norm(cross(u, d.id === 'mercury' ? SUN : v3(1, 0, 0)));
  return norm(add(u, scale(along, arc / d.r)));
};
const beaconUp = (d: Dest): V3 => fromLanding(d, 4);
const landing = (d: Dest): Spot => onBody(d.c, d.r, landingUp(d), d.gas ? 3 : 0.6);
const beacon = (d: Dest): Spot => onBody(d.c, d.r, beaconUp(d), 0);
const HUB_SPOT = onBody(HUB.c, HUB.r, fromLatLon(40, 0), 0);

const prompt = (k: number): string => `תחנה הבאה: ${DESTS[k].he}. האם תהיה שם קרקע? בחרו מגפיים או רחפן עננים.`;

export const L14: LevelDef = {
  n: 14,
  slug: 'rocky-or-gas',
  titleHe: 'סלעי או גזי?',
  worldNo: 3,
  worldId: 'deep',
  transfer: true,
  thermo: true,
  introHe: [
    'תחנת השיגור שולחת אתכם לארבעה עולמות, בסדר מעורבב. לפני כל שיגור בחרו ציוד נחיתה.',
    'מגפיים לעולם עם קרקע. רחפן עננים לעולם בלי קרקע, כי הוא מחזיק אתכם על העננים. חשבו: איפה העולם נמצא? קרוב לשמש או רחוק ממנה?',
  ],
  objectiveHe: prompt(0),
  hintsHe: [
    'ארבעת כוכבי הלכת הקרובים לשמש סלעיים: יש להם קרקע. ארבעת הרחוקים גזיים: אין להם קרקע.',
    'מגפיים: קפצו על המשטח הכתום. רחפן עננים: על המשטח הכחול. אחרי הנחיתה גשו אל המשואה.',
    'לא כדאי לבחור תמיד אותו ציוד. בכל תחנה שאלו מחדש: סלעי או גזי?',
  ],
  atlasHe: 'כוכבי הלכת הסלעיים (כספית, נוגה, כדור הארץ ומאדים) קרובים לשמש, קטנים ויש להם קרקע מוצקה. כוכבי הלכת הגזיים (צדק, שבתאי, אורנוס ונפטון) רחוקים מהשמש, ענקיים ובנויים בעיקר מגז, בלי פני שטח מוצקים. באזור החם ליד השמש נשארו בעיקר סלע ומתכת, ובאזור הרחוק והקר נשמרו גם גז וקרח.',
  extraHe: 'לפי נאס"א: לשבתאי ולנפטון אין קרקע: ככל שיורדים בתוך העננים, הגז נעשה צפוף וחם יותר, בלי משטח לעמוד עליו. רחפן העננים הוא המצאה של המשחק.',
  skillHe: 'סלעי או גזי: לחזות אם יש קרקע לפי המרחק מהשמש',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    const bodies: Body[] = [
      sphereBody('hub', 'deep', HUB.c, HUB.r, 14),
      ...DESTS.map((d) => (d.gas ? { ...sphereBody(d.id, d.world, d.c, d.r, d.inf), kind: 'gas' as const } : sphereBody(d.id, d.world, d.c, d.r, d.inf))),
    ];
    const pads: Pad[] = DESTS.flatMap((d, k) => [
      {
        id: `boots-${k}`, ...onBody(HUB.c, HUB.r, fromLatLon(62, -32)), labelHe: `מגפיים ← ${d.he}`, kind: 'warp' as const,
        to: landing(d), when: `round-${k}`, clears: ['skimmer'], answer: 'boots',
      },
      {
        id: `skim-${k}`, ...onBody(HUB.c, HUB.r, fromLatLon(62, 32)), labelHe: `רחפן עננים ← ${d.he}`, kind: 'warp' as const,
        to: landing(d), when: `round-${k}`, sets: 'skimmer', answer: 'skimmer',
      },
    ]);
    const switches: Switch[] = DESTS.map((d, k) => ({ id: `beacon-${k}`, ...beacon(d), radius: 1.3, by: 'touch' as const, sets: `got-${k}`, when: `round-${k}` }));
    const mast = plat('mast', HUB_REF, 30, 90, 2.6, 1.4, 4, 1.4, { tag: 'metal' });
    const mars = DESTS[0], sat = DESTS[1], nep = DESTS[2];
    return {
      bodies,
      boxes: [mast],
      balls: [],
      // heaters at the gas giants' landing and beacon: out there the cloud tops are −140 °C and colder
      zones: DESTS.filter((d) => d.gas).flatMap((d) => [
        zone(`warm-${d.id}`, 'warm', landing(d).pos, 3),
        zone(`warm-b-${d.id}`, 'warm', addScaled(beacon(d).pos, beaconUp(d), 0.5), 2.4),
      ]),
      props: [],
      spawn: onBody(HUB.c, HUB.r, fromLatLon(40, 0), 0.5),
      page: { ...onBody(HUB.c, HUB.r, fromLatLon(85, 0), 0.9), when: 'all-done' },
      crumbs: [
        // on top of the station's mast: the station's light gravity makes it a big jump
        topOf(mast, HUB.c, 0.6),
        // high above the ground of מאדים, behind the landing: a low-gravity leap
        onBody(mars.c, mars.r, fromLanding(mars, -3), 3.4),
        // on the cloud deck of שבתאי, between landing and beacon: only the skimmer lets you walk there
        onBody(sat.c, sat.r, norm(add(landingUp(sat), beaconUp(sat))), 0.6),
      ],
      checkpoints: [HUB_SPOT],
      pads,
      switches,
      sunDir: SUN,
      paint: [
        { body: 'mars', lat: 0, lon: 0, deg: 180, color: '#c1440e', kind: 'dust' },
        { body: 'mercury', lat: 0, lon: 0, deg: 180, color: '#8c8680', kind: 'dust' },
      ],
      decor: [
        ...DESTS.map((d) => ({ model: 'star_beacon', ...beacon(d), size: 0.8 })),
        { model: 'satellite', ...onBody(HUB.c, HUB.r, fromLatLon(20, -60)), size: 1.2 },
        { model: 'sign', ...onBody(HUB.c, HUB.r, fromLatLon(55, -20)), size: 1, label: 'מגפיים 🥾' },
        { model: 'sign', ...onBody(HUB.c, HUB.r, fromLatLon(55, 20)), size: 1, label: 'רחפן עננים ☁' },
        { model: 'crater', ...onBody(mars.c, mars.r, fromLatLon(30, 40)), size: 4 },
        { model: 'rover', ...onBody(mars.c, mars.r, fromLatLon(70, 30)), size: 1.2 },
        { model: 'cloud', ...onBody(sat.c, sat.r, fromLatLon(70, 60), 1), size: 3 },
        { model: 'cloud', ...onBody(nep.c, nep.r, fromLatLon(70, -60), 1), size: 3 },
      ],
    };
  },
  script: {
    init(api) {
      api.setFlag('round-0');
    },
    event(api, ev) {
      const k = DESTS.findIndex((_, i) => api.flags.has(`round-${i}`));
      if (k < 0) return;
      const d = DESTS[k];
      if (ev.type === 'switch' && ev.id === `beacon-${k}`) {
        api.log('gear', 'right', d.id);
        api.clearFlag(`round-${k}`);
        if (k + 1 < DESTS.length) {
          api.say(`${d.he}: ${d.gas ? 'כוכב לכת גזי, בלי קרקע. הרחפן החזיק אתכם על העננים!' : 'כוכב לכת סלעי, עם קרקע מוצקה. המגפיים עבדו!'}`, 'good');
          api.setFlag(`round-${k + 1}`);
          api.objective(prompt(k + 1));
        } else {
          api.say('כל ארבעת העולמות נכונים! דף האטלס מחכה בראש התחנה.', 'good');
          api.setFlag('all-done');
          api.objective('קחו את דף האטלס בראש התחנה');
        }
        api.hop(HUB_SPOT);
      } else if (ev.type === 'cloud-fall' && ev.id === d.id) {
        api.log('gear', 'wrong', `boots@${d.id}`);
        api.say(`למגפיים אין על מה לדרוך: ${d.he} הוא כוכב לכת גזי, רחוק מהשמש ובלי קרקע. חזרה לתחנה, נסו את הרחפן.`, 'oops');
        api.hop(HUB_SPOT);
      } else if (ev.type === 'land' && ev.id === d.id && !d.gas && api.flags.has('skimmer')) {
        api.log('gear', 'wrong', `skimmer@${d.id}`);
        api.say(`בונק! רחפן העננים התנגש בסלע. ${d.he} הוא כוכב לכת סלעי, קרוב לשמש ועם קרקע: צריך מגפיים. חזרה לתחנה.`, 'oops');
        api.emit('bump', api.player.pos);
        api.respawn();
        api.hop(HUB_SPOT);
      }
    },
  },
  route: [
    // the mast crumb on the station
    { to: 'top:mast', jump: 'full', jumpAt: 2.6, near: 1.0 },
    // 1: מאדים is rocky (close to the Sun): boots
    { to: 'boots-0', near: 0.9 },
    { to: landing(DESTS[0]).pos, near: 1000, wait: 1.4 },
    { to: 'crumb:1', jump: 'full', jumpAt: 1.2 },
    { to: 'beacon-0' },
    // 2: שבתאי is gas (far): skimmer
    { to: 'skim-1', near: 0.9 },
    { to: landing(DESTS[1]).pos, near: 1000, wait: 2.0 },
    { to: 'crumb:2' },
    { to: 'beacon-1' },
    // 3: נפטון is gas: skimmer
    { to: 'skim-2', near: 0.9 },
    { to: landing(DESTS[2]).pos, near: 1000, wait: 2.0 },
    { to: 'beacon-2' },
    // 4: כספית is rocky: boots
    { to: 'boots-3', near: 0.9 },
    { to: landing(DESTS[3]).pos, near: 1000, wait: 1.4 },
    { to: 'beacon-3' },
    { to: 'page' },
  ],
  routeTimeout: 200,
};
