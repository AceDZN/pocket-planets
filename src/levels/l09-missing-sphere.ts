import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, plat, sphereBody, topOf, prop } from '../core/level';
import { spot, deco, decoAt, zoneAt, sendHome, near } from './lib-b';

// Transfer: a world with one sphere missing. Read the clues (dry riverbeds, a cracked lakebed, a sky with no clouds,
// air you can breathe, rock under your feet), then carry the right sphere capsule to the altar. Wrong capsules
// do something silly and roll back to their stands; only the missing sphere makes the world bloom.

const W: BodyRef = { id: 'dry', center: v3(0, 0, 0), radius: 14 };
const ALTAR_LAT = 0, ALTAR_LON = 0;

const CAPS: Record<string, string> = { 'cap-atmo': 'atmo', 'cap-hydro': 'hydro', 'cap-geo': 'geo', 'cap-bio': 'bio' };
const WRONG: Record<string, { flag: string; he: string }> = {
  atmo: { flag: 'gust', he: 'וווש! עוד אוויר לעולם שכבר יש בו אוויר: אתם נושמים כאן מההתחלה. בלי מים לא נוצרים עננים, אז רק אבק עף.' },
  geo: { flag: 'rocks', he: 'בום! ערימת סלעים צצה מתחת לרגליים. אבל גאוספרה יש כאן כבר: אתם עומדים עליה כל הזמן.' },
  bio: { flag: 'wilted', he: 'שתילים צצו סביב המזבח… ומיד נבלו. צמחים ובעלי חיים לא יכולים לחיות בלי מים.' },
};

export const L09: LevelDef = {
  n: 9,
  slug: 'missing-sphere',
  titleHe: 'עולם בלי ספרה',
  worldNo: 2,
  worldId: 'earth',
  transfer: true,
  hideName: true,
  introHe: [
    'הגעתם לעולם מוזר. משהו חסר בו, אבל מה?',
    'חפשו רמזים ברחבי העולם, ואז הביאו אל המזבח את הקפסולה של הספרה החסרה.',
  ],
  objectiveHe: 'גלו איזו ספרה חסרה והביאו את הקפסולה שלה אל המזבח',
  hintsHe: [
    'הסתכלו סביב: האם יש כאן אוויר? סלעים וקרקע? עננים? נהרות?',
    'ערוצי הנחלים יבשים והשמיים בלי עננים. איזו ספרה מכילה את כל המים?',
    'הרימו קפסולה (E), עלו על המזבח וזרקו אותה עליו (E שוב).',
  ],
  atlasHe: 'כל ספרה תלויה באחרות. בעולם שאין בו הידרוספרה אין נהרות ואין עננים, וגם הביוספרה לא יכולה להתקיים. הוספת אוויר או סלעים לא עוזרת, כי הם כבר שם: רק המים מחזירים את החיים.',
  skillHe: 'זיהוי ספרה חסרה (העברה)',
  modules: ['grade-8/chapter-1/earth-system'],
  build() {
    const altar = plat('altar', W, ALTAR_LAT, ALTAR_LON, 0.3, 5.0, 0.6, 5.0, { tag: 'gold' });
    const s1 = plat('s1', W, -1, 29, 1.0, 2.0, 1.6, 2.2, { tag: 'sand' });
    const mesa = plat('mesa', W, -2, 37.5, 2.0, 3.0, 2.6, 3.0, { tag: 'sand' });
    const fall = plat('fall', W, 24, -6, 1.1, 2.6, 1.8, 2.0);
    const fall2 = plat('fall2', W, 31, -6, 2.1, 2.6, 2.8, 2.0);
    const pillar = plat('pillar', W, -22, 8, 1.0, 1.4, 1.6, 1.4);
    const rocks = [
      plat('rock-a', W, 0, 9, 0.9, 1.4, 1.4, 1.4, { when: 'rocks' }),
      plat('rock-b', W, 6, 5, 0.6, 1.0, 1.0, 1.0, { when: 'rocks' }),
      plat('rock-c', W, -6, 5, 0.7, 1.2, 1.2, 1.2, { when: 'rocks' }),
    ];
    const stand = (id: string, lat: number, lon: number) => prop(id, 'crate', spot(W, lat, lon, 0.4).pos, 1, 0.4);
    return {
      bodies: [sphereBody('dry', 'earth', W.center, W.radius, 36)],
      boxes: [altar, s1, mesa, fall, fall2, pillar, ...rocks],
      balls: [],
      zones: [
        zoneAt('gust-wind', 'wind', W, 0, 0, 1.2, 5.5, { dir: fromLatLon(90, 0), power: 40, when: 'gust' }),
        zoneAt('rock-pop', 'launch', W, 0, 0, 0.9, 2.8, { power: 11, when: 'rocks' }),
      ],
      props: [
        stand('cap-atmo', 5, -16),
        stand('cap-geo', -9, 15),
        stand('cap-bio', 11, 17),
        prop('cap-hydro', 'crate', topOf(mesa, W.center, 0.4).pos, 1, 0.4),
      ],
      spawn: spot(W, 0, -10, 0.5),
      page: { ...spot(W, 0, -5, 0.9), when: 'bloom' },
      crumbs: [
        topOf(mesa, W.center, 2.85),
        topOf(fall2, W.center, 0.9),
        topOf(pillar, W.center, 2.0),
      ],
      checkpoints: [spot(W, 0, 20, 0.45), spot(W, 16, -6, 0.45)],
      pads: [],
      switches: [],
      sunDir: norm(fromLatLon(25, 10)),
      sky: [{ kind: 'moon', dir: norm(fromLatLon(40, -50)), sizeDeg: 5 }],
      paint: [
        { body: 'dry', lat: 0, lon: 0, deg: 92, color: '#b89a6a', kind: 'dust', unless: 'bloom' },
        { body: 'dry', lat: 0, lon: 180, deg: 92, color: '#a88a5a', kind: 'dust', unless: 'bloom' },
        // dry riverbeds and a cracked lakebed (the clues) that fill with water once the hydrosphere is back
        ...[[30, -14], [26, -10], [22, -6], [18, -2]].map(([lat, lon]) => ({ body: 'dry', lat, lon, deg: 3, color: '#d9c49a', kind: 'sand' as const, unless: 'bloom' })),
        ...[[30, -14], [26, -10], [22, -6], [18, -2]].map(([lat, lon]) => ({ body: 'dry', lat, lon, deg: 3, color: '#2f7fd8', kind: 'water' as const, when: 'bloom' })),
        { body: 'dry', lat: -22, lon: 8, deg: 9, color: '#cdb486', kind: 'sand', unless: 'bloom' },
        { body: 'dry', lat: -22, lon: 8, deg: 9, color: '#2f7fd8', kind: 'water', when: 'bloom' },
        { body: 'dry', lat: -10, lon: 150, deg: 35, color: '#2f7fd8', kind: 'water', when: 'bloom' },
        { body: 'dry', lat: 90, lon: 0, deg: 18, color: '#eef6ff', kind: 'ice', when: 'bloom' },
      ],
      decor: [
        deco('sign', W, 5, -13, 0.9, 0, { label: 'אטמוספרה' }),
        deco('sign', W, -9, 12, 0.9, 0, { label: 'גאוספרה' }),
        deco('sign', W, 11, 14, 0.9, 0, { label: 'ביוספרה' }),
        decoAt('sign', topOf(mesa, W.center, -0.45), 0.9, { label: 'הידרוספרה' }),
        deco('sign', W, 20, -9, 1, 0, { label: 'ערוץ נחל יבש', unless: 'bloom' }),
        deco('sign', W, -16, 4, 1, 0, { label: 'קרקעית אגם סדוקה', unless: 'bloom' }),
        deco('flag', W, 4, -6, 1),
        deco('rock', W, 12, 30, 1.6), deco('rock', W, -14, 26, 2), deco('rock', W, 20, 40, 1.4), deco('rock', W, -26, -20, 1.8),
        deco('crater', W, -30, 40, 3),
        deco('sapling', W, 4, 4, 0.9, 0, { when: 'wilted' }), deco('sapling', W, -4, -3, 0.8, 0, { when: 'wilted' }),
        deco('cloud', W, 0, 3, 2, 3.5, { when: 'gust' }),
        deco('tree', W, 8, 8, 2.4, 0, { when: 'bloom' }), deco('tree', W, -9, -8, 2.2, 0, { when: 'bloom' }),
        deco('tree', W, 14, -20, 2.6, 0, { when: 'bloom' }), deco('tree', W, -18, 18, 2.4, 0, { when: 'bloom' }),
        deco('cloud', W, 15, 10, 3, 6, { when: 'bloom' }), deco('cloud', W, -10, -20, 2.4, 7, { when: 'bloom' }), deco('cloud', W, 25, -30, 2.8, 6.5, { when: 'bloom' }),
        deco('bird', W, 6, -2, 0.8, 4, { when: 'bloom' }),
      ],
    };
  },
  script: {
    event(api, ev) {
      // a capsule counts when it is thrown from the altar or comes to rest on it
      if ((ev.type !== 'drop' && ev.type !== 'throw') || !ev.id || !(ev.id in CAPS) || api.flags.has('bloom')) return;
      const cap = api.props.find((p) => p.id === ev.id);
      if (!cap || cap.carried) return;
      if ((api.state.reset as { id: string } | undefined)?.id === ev.id) return;
      const altarTop = spot(W, ALTAR_LAT, ALTAR_LON, 0.3 + 0.4).pos;
      if (!near(cap.pos, altarTop, 3.6)) return;
      const sphere = CAPS[ev.id];
      if (sphere === 'hydro') {
        api.setFlag('bloom');
        api.emit('bloom', cap.pos, ev.id);
        api.log('capsule', 'right', sphere);
        api.revealName('כדור הארץ, עם הידרוספרה');
        api.say('המים חזרו! נהרות זורמים, עננים מתאספים והעולם פורח. לעולם הזה חסרה ההידרוספרה. דף האטלס צמח ליד המזבח.', 'good');
        api.objective('קחו את דף האטלס שליד המזבח');
        cap.alive = false;
        return;
      }
      const w = WRONG[sphere];
      api.setFlag(w.flag);
      api.emit('oops', cap.pos, ev.id);
      api.log('capsule', 'wrong', sphere);
      api.say(w.he, 'oops');
      api.state.reset = { id: ev.id, flag: w.flag, at: api.t };
    },
    tick(api) {
      const r = api.state.reset as { id: string; flag: string; at: number } | undefined;
      if (!r) return;
      if (api.t - r.at > 1.2) {
        const cap = api.props.find((p) => p.id === r.id);
        if (cap && !cap.carried && Math.hypot(cap.pos.x - cap.home.x, cap.pos.y - cap.home.y, cap.pos.z - cap.home.z) > 0.3) {
          sendHome(cap);
          api.say('הקפסולה חזרה אל הכן שלה.', 'info');
        }
      }
      if (api.t - r.at > 3.5) { api.clearFlag(r.flag); delete api.state.reset; }
    },
  },
  route: [
    { to: 'cp:1' },
    { to: 'top:fall', jump: 'full', jumpAt: 1.8 },
    { to: 'top:fall2', jump: 'full', jumpAt: 2.2 },
    { to: 'crumb:1' },
    { to: 'cp:0' },
    { to: 'top:s1', jump: 'full', jumpAt: 1.7 },
    { to: 'top:mesa', jump: 'full', jumpAt: 2.4 },
    { to: 'crumb:0', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: 'cap-hydro', action: true, near: 1.0 },
    { to: spot(W, -14, 14, 0.45).pos },
    { to: 'top:pillar', jump: 'full', jumpAt: 1.6 },
    { to: 'crumb:2', jump: 'full', jumpAt: 0.3, near: 0.5 },
    { to: spot(W, 0, 13, 0.45).pos },
    { to: spot(W, 0, 8.5, 0.75).pos, jump: 'full', jumpAt: 2.6, action: true, near: 0.6, until: 'bloom' },
    { to: 'page' },
  ],
  routeTimeout: 200,
};

/** Places, for tests. */
export const L09_PLACES = { W };
