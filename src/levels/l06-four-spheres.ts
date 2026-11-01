import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, plat, sphereBody, topOf } from '../core/level';
import { spot, deco, decoAt, seaKill, zoneAt, touch } from './lib-b';

// A tiny Earth with four routes out of the meadow hub. Each sphere's token opens the next route, the way the spheres
// feed each other: the sea (הידרוספרה) evaporates into clouds (אטמוספרה); rain plus rock weathered into soil
// (גאוספרה) grows the forest (ביוספרה).

const E: BodyRef = { id: 'earth', center: v3(0, 0, 0), radius: 16 };

const NAMES: Record<string, string> = { geo: 'גאוספרה', hydro: 'הידרוספרה', atmo: 'אטמוספרה', bio: 'ביוספרה' };
const ORDER = ['geo', 'hydro', 'atmo', 'bio'];

export const L06: LevelDef = {
  n: 6,
  slug: 'four-spheres',
  titleHe: 'ארבע הספרות',
  worldNo: 2,
  worldId: 'earth',
  introHe: [
    'ברוכים הבאים לכדור הארץ: עולם אחד שעוטפות אותו ארבע ספרות.',
    'בכל שביל מחכה אסימון של ספרה אחת. געו בארבעתם, ודף האטלס יופיע במרכז האחו.',
  ],
  objectiveHe: 'מצאו את ארבעת אסימוני הספרות (0/4)',
  hintsHe: [
    'התחילו בהרים שבמזרח (גאוספרה) ובים הקפוא שבדרום (הידרוספרה). אל תיפלו למים!',
    'אחרי שתגעו בהידרוספרה, המים יתאדו ויהיו עננים בצפון. היכנסו לזרם האוויר העולה והוא ירים אתכם.',
    'היער שבמערב צומח רק כשיש גם קרקע (גאוספרה) וגם גשם (אטמוספרה).',
  ],
  atlasHe: 'לכדור הארץ ארבע ספרות: אטמוספרה (האוויר), הידרוספרה (כל המים), גאוספרה (הסלעים, הקרקע וההרים) וביוספרה (כל היצורים החיים). הן משפיעות זו על זו ביחסי גומלין: מים מתאדים ויוצרים עננים, וגשם וקרקע מצמיחים יער.',
  skillHe: 'ארבע הספרות ויחסי גומלין',
  modules: ['grade-8/chapter-1/earth-system'],
  build() {
    // גאוספרה: rock ledges climbing east to a peak
    const g1 = plat('g1', E, 0, 12, 0.8, 2.0, 1.6, 2.4, { tag: 'soil' });
    const g2 = plat('g2', E, 0, 19.5, 1.6, 2.0, 2.4, 2.4);
    const g3 = plat('g3', E, 0, 27, 2.4, 2.0, 3.2, 2.4);
    const peak = plat('peak', E, 0, 35, 3.2, 2.8, 4.0, 2.8);
    // הידרוספרה: ice floes over a cold sea, an island at the far side
    const f1 = plat('f1', E, -20, 0, 1.0, 2.4, 0.6, 2.2, { ice: true, tag: 'ice' });
    const f2 = plat('f2', E, -29, 2, 1.0, 2.2, 0.6, 2.2, { ice: true, tag: 'ice' });
    const f3 = plat('f3', E, -38, -1, 1.0, 2.2, 0.6, 2.2, { ice: true, tag: 'ice' });
    const isle = plat('isle', E, -49, 0, 1.0, 3.4, 1.4, 3.0, { tag: 'sand' });
    // אטמוספרה: clouds that exist once the sea has evaporated
    const c1 = plat('c1', E, 27, 0, 4.0, 2.8, 0.6, 2.6, { tag: 'cloud', when: 'hydro' });
    const c2 = plat('c2', E, 37, 3, 5.2, 2.4, 0.6, 2.4, { tag: 'cloud', when: 'hydro' });
    const c3 = plat('c3', E, 47.5, 0, 6.4, 2.8, 0.6, 2.8, { tag: 'cloud', when: 'hydro' });
    // ביוספרה: leaves that grow after rain on soil, up to the canopy
    const l1 = plat('l1', E, 0, -13, 1.0, 2.2, 0.5, 2.2, { tag: 'grass', when: 'forest' });
    const l2 = plat('l2', E, 2, -20, 2.0, 2.2, 0.5, 2.2, { tag: 'grass', when: 'forest' });
    const l3 = plat('l3', E, -1, -27, 3.0, 2.2, 0.5, 2.2, { tag: 'grass', when: 'forest' });
    const canopy = plat('canopy', E, 0, -36, 4.0, 3.0, 0.7, 3.0, { tag: 'grass', when: 'forest' });
    const trunk = plat('trunk', E, 0, -36, 3.3, 0.9, 3.3, 0.9, { tag: 'wood', when: 'forest' });

    const boxes = [g1, g2, g3, peak, f1, f2, f3, isle, c1, c2, c3, l1, l2, l3, trunk, canopy];
    return {
      bodies: [sphereBody('earth', 'earth', E.center, E.radius, 40)],
      boxes,
      balls: [],
      zones: [
        seaKill('sea', E, -35, 0, 13, 0.9, 'ספלאש! נפלתם להידרוספרה, והמים קרים כקרח. חזרה לחוף.'),
        zoneAt('draft', 'launch', E, 14, 0, 0.4, 1.0, { power: 16, when: 'hydro' }),
        zoneAt('shroom', 'launch', E, -6, -9, 0.4, 0.9, { power: 13, when: 'forest' }),
      ],
      props: [],
      spawn: spot(E, 0, 0, 0.5),
      page: { ...spot(E, 5, 0, 0.9), when: 'all4' },
      crumbs: [
        spot(E, 0, 35, 3.2 + 2.85),
        spot(E, -33.5, 1, 2.3),
        spot(E, -6, -9, 4.1),
      ],
      checkpoints: [spot(E, 0, 7, 0.45), spot(E, -14, 0, 0.45), spot(E, 9, 0, 0.45), spot(E, 0, -7, 0.45)],
      pads: [],
      switches: [
        touch('tok-geo', topOf(peak, E.center), 'geo', 'גאוספרה! הסלעים, ההרים והקרקע: החלק המוצק של כדור הארץ.'),
        touch('tok-hydro', topOf(isle, E.center), 'hydro', 'הידרוספרה! כל המים: ימים, נהרות, קרחונים. השמש מאדה את הים, ובצפון נוצרים עננים…'),
        touch('tok-atmo', topOf(c3, E.center), 'atmo', 'אטמוספרה! עטיפת האוויר: רוח, עננים וגשם. הגשם יורד על היער שבמערב.', 1.2, 'hydro'),
        touch('tok-bio', topOf(canopy, E.center), 'bio', 'ביוספרה! כל היצורים החיים: צמחים, בעלי חיים ואנחנו.', 1.2, 'forest'),
      ],
      sunDir: norm(fromLatLon(30, 25)),
      sky: [{ kind: 'moon', dir: norm(fromLatLon(40, -60)), sizeDeg: 7 }],
      paint: [
        { body: 'earth', lat: -35, lon: 0, deg: 15, color: '#2f7fd8', kind: 'water' },
        { body: 'earth', lat: -10, lon: 120, deg: 30, color: '#2f7fd8', kind: 'water' },
        { body: 'earth', lat: 90, lon: 0, deg: 22, color: '#eef6ff', kind: 'ice' },
        { body: 'earth', lat: -90, lon: 0, deg: 18, color: '#eef6ff', kind: 'ice' },
        { body: 'earth', lat: 0, lon: 28, deg: 12, color: '#9a8a74', kind: 'dust' },
        { body: 'earth', lat: 0, lon: -32, deg: 14, color: '#3f7f38', kind: 'grass', when: 'forest' },
        { body: 'earth', lat: 0, lon: -32, deg: 14, color: '#8a7a58', kind: 'dust', unless: 'forest' },
      ],
      decor: [
        deco('sign', E, 2, 4, 1, 0, { label: 'גאוספרה ←' }),
        deco('sign', E, -6, 2, 1, 0, { label: 'הידרוספרה ↓' }),
        deco('sign', E, 7, -2, 1, 0, { label: 'אטמוספרה ↑' }),
        deco('sign', E, -2, -5, 1, 0, { label: '→ ביוספרה' }),
        deco('rock', E, 4, 16, 1.6), deco('rock', E, -5, 24, 2.2), deco('rock', E, 5, 31, 1.8), deco('crystal', E, -4, 38, 1.2),
        deco('ice_crystal', E, -48, 3, 1.1, 1.0),
        deco('cloud', E, 30, -10, 3, 6.5, { when: 'hydro' }), deco('cloud', E, 35, 12, 2.5, 8, { when: 'hydro' }), deco('cloud', E, 24, 8, 2, 5.5, { when: 'hydro' }),
        decoAt('cloud', topOf(c1, E.center, -0.2), 2.4, { when: 'hydro' }),
        decoAt('cloud', topOf(c3, E.center, -0.2), 2.6, { when: 'hydro' }),
        deco('sapling', E, 4, -18, 1), deco('sapling', E, -4, -24, 1), deco('sapling', E, 3, -30, 1, 0, { unless: 'forest' }),
        deco('tree', E, 5, -22, 2.4, 0, { when: 'forest' }), deco('tree', E, -5, -30, 2.8, 0, { when: 'forest' }),
        deco('tree', E, 6, -38, 2.6, 0, { when: 'forest' }), deco('tree', E, -6, -40, 2.2, 0, { when: 'forest' }),
        deco('tree', E, 0, -36, 3.6, 0, { when: 'forest' }),
        deco('bird', E, 4, -34, 0.8, 6, { when: 'bio' }), deco('bird', E, -3, -31, 0.7, 7, { when: 'bio' }),
        deco('flag', E, 3, -3, 1),
      ],
    };
  },
  script: {
    event(api, ev) {
      if (ev.type !== 'switch') return;
      if (api.flags.has('geo') && api.flags.has('atmo') && !api.flags.has('forest')) {
        api.setFlag('forest');
        api.say('יחסי גומלין: סלע שהתבלה לקרקע (גאוספרה) וגשם (אטמוספרה) הצמיחו יער (ביוספרה) במערב!', 'good');
      }
      const found = ORDER.filter((k) => api.flags.has(k));
      api.objective(found.length < 4
        ? `מצאו את ארבעת אסימוני הספרות (${found.length}/4): ${found.map((k) => NAMES[k]).join(' · ')}`
        : 'ארבע הספרות נמצאו! חזרו לאחו אל דף האטלס');
      if (found.length === 4 && !api.flags.has('all4')) {
        api.setFlag('all4');
        api.emit('reveal');
        api.say('אטמוספרה, הידרוספרה, גאוספרה, ביוספרה: ארבע הספרות עוטפות את כדור הארץ ופועלות יחד. דף האטלס מחכה באחו!', 'good');
      }
    },
  },
  route: [
    { to: 'top:g1', jump: 'full', jumpAt: 1.7 },
    { to: 'top:g2', jump: 'full', jumpAt: 1.7 },
    { to: 'top:g3', jump: 'full', jumpAt: 1.7 },
    { to: 'top:peak', jump: 'full', jumpAt: 1.9 },
    { to: 'tok-geo' },
    { to: 'crumb:0', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: 'cp:0' },
    { to: 'cp:1' },
    { to: 'top:f1', jump: 'full', jumpAt: 1.6 },
    { to: 'top:f2', jump: 'full', jumpAt: 2.6 },
    { to: 'crumb:1', jump: 'full', jumpAt: 1.4, near: 0.5 },
    { to: 'top:f3', jump: 'full', jumpAt: 2.6 },
    { to: 'top:isle', jump: 'full', jumpAt: 2.7 },
    { to: 'tok-hydro' },
    { to: 'top:f3', jump: 'full', jumpAt: 2.7 },
    { to: 'top:f2', jump: 'full', jumpAt: 2.6 },
    { to: 'top:f1', jump: 'full', jumpAt: 2.6 },
    { to: 'cp:1', jump: 'full', jumpAt: 1.6 },
    { to: 'cp:2' },
    { to: 'top:c1' },
    { to: 'top:c2', jump: 'puff', jumpAt: 2.3 },
    { to: 'top:c3', jump: 'puff', jumpAt: 3.2 },
    { to: 'tok-atmo' },
    { to: 'cp:3' },
    { to: 'crumb:2', near: 0.5 },
    { to: 'top:l1', jump: 'full', jumpAt: 1.6 },
    { to: 'top:l2', jump: 'full', jumpAt: 1.7 },
    { to: 'top:l3', jump: 'full', jumpAt: 1.7 },
    { to: 'top:canopy', jump: 'puff', jumpAt: 2.7 },
    { to: 'tok-bio' },
    { to: 'page' },
  ],
  routeTimeout: 240,
};

/** Places, for tests. */
export const L06_PLACES = { E };
