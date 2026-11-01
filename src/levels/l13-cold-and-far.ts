import { v3, norm } from '../core/vec';
import { type LevelDef, type BodyRef, plat, sphereBody, topOf, zone } from '../core/level';
import type { Zone } from '../core/physics';
import { deco, at, wp } from './lib-a';

// The cold and far: אורנוס and נפטון, two gas giants hanging below their small moons. The Sun is a tiny bright dot and
// the light is dim. It is so cold (−200 °C and below) that the suit freezes in a few seconds away from a warm station.
// On מירנדה (moon of אורנוס) climb the giant ice cliff; a launch pad hops you to טריטון (moon of נפטון), whose nitrogen
// geyser throws you up to the page. Jump off a moon's underside and you fall into a giant's clouds.

const URA = { id: 'uranus', c: v3(0, -58, 0), r: 30 };
const NEP = { id: 'neptune', c: v3(80, -58, 0), r: 28 };
const MIR: BodyRef = { id: 'miranda', center: v3(0, 0, 0), radius: 8 };
const TRI: BodyRef = { id: 'triton', center: v3(80, 0, 0), radius: 9 };

const warm = (id: string, b: BodyRef, lat: number, lon: number, r = 2.4, alt = 0): Zone => zone(id, 'warm', at(b, lat, lon, alt + 0.5).pos, r);

export const L13: LevelDef = {
  n: 13,
  slug: 'cold-and-far',
  titleHe: 'הקרים והרחוקים',
  worldNo: 3,
  worldId: 'uranus',
  thermo: true,
  introHe: [
    'הגעתם הכי רחוק: אורנוס ונפטון, שני כוכבי לכת גזיים וקפואים. השמש מכאן היא רק נקודה קטנה, והאור חלש.',
    'הקור כאן עז. רוצו מתחנת חימום לתחנת חימום, ואל תקפצו מהצד התחתון של ירח: למטה מחכים עננים בלי סוף.',
  ],
  objectiveHe: 'טפסו על צוק הקרח של מירנדה, ושגרו את עצמכם אל טריטון שליד נפטון',
  hintsHe: [
    'מד החום יורד מהר. עמדו רגע בתחנת חימום כתומה ורק אז המשיכו.',
    'הכבידה של הירחים הקטנים חלשה מאוד: קפיצה מלאה עולה גבוה, וכדאי לרוץ לאט.',
    'הגייזר של טריטון מתפרץ כל כמה שניות. עמדו עליו וחכו.',
  ],
  atlasHe: 'אורנוס ונפטון הם כוכבי הלכת הרחוקים ביותר מהשמש, ולכן הם קרים מאוד וחשוכים. הם כוכבי לכת גזיים, בלי פני שטח מוצקים. ככל שכוכב לכת רחוק יותר מהשמש, המסלול שלו ארוך יותר והשנה בו ארוכה יותר.',
  extraHe: 'לפי נאס"א: שנה באורנוס נמשכת כ-84 שנות ארץ, ובנפטון כ-165 שנות ארץ, כך שמאז שגילו את נפטון ב-1846 הוא השלים בערך הקפה אחת. ליד העננים שלהם כ-200°C מתחת לאפס. אורנוס מסתובב כשהוא שוכב על הצד.',
  skillHe: 'רחוק מהשמש: קר, חשוך, שנה ארוכה',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    const cliff = plat('cliff', MIR, 20, 60, 9.0, 2.6, 12, 2.6, { ice: true, tag: 'ice' });
    const ventBase = plat('vent-base', TRI, 70, 0, 0.3, 2.4, 1, 2.4, { tag: 'ice' });
    const vent = topOf(ventBase, TRI.center, 0);
    const pageSpot = { pos: v3(vent.pos.x + vent.up.x * 11, vent.pos.y + vent.up.y * 11, vent.pos.z + vent.up.z * 11), up: vent.up };
    const landing = at(TRI, 62, -22, 0);
    return {
      bodies: [
        { ...sphereBody('uranus', 'uranus', URA.c, URA.r, 70), kind: 'gas' },
        { ...sphereBody('neptune', 'neptune', NEP.c, NEP.r, 70), kind: 'gas' },
        sphereBody('miranda', 'miranda', MIR.center, MIR.radius, 11),
        sphereBody('triton', 'triton', TRI.center, TRI.radius, 12),
      ],
      boxes: [cliff, ventBase],
      balls: [],
      zones: [
        warm('m0', MIR, 80, 0, 2.8), warm('m1', MIR, 35, 35), warm('m2', MIR, 20, 60, 2.2, 9.0), warm('m3', MIR, 45, 110),
        warm('t0', TRI, 62, -22, 2.6), warm('t2', TRI, 70, 0, 2.4, 0.3), 
        // Triton's nitrogen geyser erupts every few seconds
        zone('geyser', 'launch', at(TRI, 70, 0, 0.3 + 0.3).pos, 1.1, { power: 7.2, period: 3.2, open: 1.3 }),
      ],
      props: [],
      spawn: at(MIR, 80, 0, 0.5),
      page: pageSpot,
      crumbs: [
        // on top of Miranda's giant ice cliff
        topOf(cliff, MIR.center, 0.6),
        // on Miranda's night side, far from the warm stations: a quick dash there and back
        at(MIR, 60, -120, 0.9),
        // halfway up the geyser's plume
        { pos: v3(vent.pos.x + vent.up.x * 5.5, vent.pos.y + vent.up.y * 5.5, vent.pos.z + vent.up.z * 5.5), up: vent.up },
      ],
      checkpoints: [at(MIR, 80, 0), at(MIR, 45, 110), landing],
      pads: [
        { id: 'to-triton', ...at(MIR, 45, 116), labelHe: 'אל טריטון', kind: 'warp', to: landing },
      ],
      switches: [],
      sunDir: norm(v3(0.5, 0.75, 0.45)),
      paint: [
        { body: 'miranda', lat: 30, lon: 60, deg: 30, color: '#b9c4cc', kind: 'ice' },
        { body: 'triton', lat: 60, lon: 0, deg: 40, color: '#f0d8d0', kind: 'ice' },
        { body: 'triton', lat: -20, lon: 150, deg: 35, color: '#c8b0a0', kind: 'sand' },
      ],
      decor: [
        deco('ice_crystal', MIR, 60, -60, 1), deco('ice_crystal', MIR, 10, 100, 0.8), deco('crater', MIR, -10, -40, 3),
        deco('star_beacon', MIR, 82, 20, 0.6), deco('star_beacon', MIR, 47, 100, 0.6),
        deco('sign', MIR, 74, 30, 1, { label: 'צוק הקרח ⬆' }),
        deco('launch_pad', MIR, 45, 116, 1),
        deco('ice_crystal', TRI, 40, -60, 1), deco('crater', TRI, 10, 60, 4), deco('crater', TRI, -30, -120, 3),
        deco('star_beacon', TRI, 60, -34, 0.6), deco('flag', TRI, 64, 20, 1),
        deco('sign', TRI, 62, -20, 1, { label: 'גייזר חנקן ⬆' }),
      ],
    };
  },
  script: {
    event(api, ev) {
      if (ev.type === 'launch' && ev.id === 'geyser' && !api.state.said) {
        api.state.said = true;
        api.say('פששש! גייזר של טריטון זורק אתכם למעלה. גם כאן, כל כך רחוק מהשמש, משהו עדיין זז.', 'good');
      }
      if (ev.type === 'cloud-fall' && !api.state.fell) {
        api.state.fell = true;
        api.say('לאורנוס ולנפטון אין קרקע: רק עננים קפואים, עמוק עמוק למטה.', 'info');
      }
    },
  },
  route: [
    { to: 'crumb:1' },
    { to: wp(MIR, 80, 0), wait: 0.8 },
    { to: wp(MIR, 35, 35), wait: 0.6 },
    { to: 'top:cliff', jump: 'full', jumpAt: 4.5, near: 1.0 },
    { to: wp(MIR, 20, 60, 9.4), wait: 0.6 },
    { to: wp(MIR, 45, 110), jump: 'tap', jumpAt: 9 },
    { to: wp(MIR, 45, 110), wait: 0.6 },
    // stand on the pad until it hops you over (aim at the landing spot with a wide arrival radius, so the bot
    // stands still on the pad and doesn't walk back toward it after the hop)
    { to: wp(MIR, 45, 116), near: 1.0 },
    { to: wp(TRI, 62, -22), near: 200, wait: 1.6 },
    { to: wp(TRI, 62, -22), wait: 0.6 },
    { to: wp(TRI, 70, 0, 0.6), near: 0.5 },
    { to: 'crumb:2', wait: 8, timeout: 12 },
    { to: 'page', wait: 8, timeout: 12 },
  ],
  routeTimeout: 200,
};
