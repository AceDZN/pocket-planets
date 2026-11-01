import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, type Paint, plat, sphereBody, topOf, prop } from '../core/level';
import { spot, deco, decoAt, seaKill, zoneAt, pound, deliver } from './lib-b';

// Three broken links between the spheres. East: the drained Hula (pound the sluice and the water comes back, then
// the birds). West: a bare slope where the dust storm blows (plant two saplings and their roots hold the soil).
// South: the polar ice melts and the sea climbs over the low jetty, until the smoky factory on the ridge goes solar.

const E: BodyRef = { id: 'earth', center: v3(0, 0, 0), radius: 16 };
const SEA_AT = [100, 160, 220];

const east = (lon: number) => fromLatLon(0, lon + 90);

export const L08: LevelDef = {
  n: 8,
  slug: 'sphere-chain',
  titleHe: 'שרשרת בין הספרות',
  worldNo: 2,
  worldId: 'earth',
  introHe: [
    'שינוי בספרה אחת "מדלג" לספרות האחרות. כאן שלוש שרשראות כאלה נקרעו.',
    'החזירו מים לחולה, עצרו את סופת האבק על המדרון ובלמו את המסת הקרח. רק אז יופיע דף האטלס על צוק התצפית.',
  ],
  objectiveHe: 'תקנו את שלוש השרשראות (0/3)',
  hintsHe: [
    'בתעלת הניקוז שליד אגם החולה היבש יש מתג. הלמו עליו (קפיצה ואז ⬇).',
    'השתילים שבמשתלה נכנסים לגומות שלמרגלות המדרון. הרימו (E), עמדו ליד הגומה וזרקו (E).',
    'הקרח נמס כי האטמוספרה מתחממת. על הרכס, מעל המדרון, עומד מפעל מעשן: הלמו על המתג שלידו.',
  ],
  atlasHe: 'הספרות קשורות ביחסי גומלין. כשייבשו את ביצת החולה נעלמו המים (הידרוספרה) ואיתם בתי הגידול של הציפורים (ביוספרה), וכשהחזירו מים חזרו ציפורי המעבר. עצים מחזיקים את הקרקע (גאוספרה) ומפחיתים סופות אבק (אטמוספרה). התחממות האטמוספרה ממיסה קרחונים, ומפלס הים עולה ומציף חופים.',
  skillHe: 'יחסי גומלין בין הספרות',
  modules: ['grade-8/chapter-1/earth-system'],
  build() {
    // East: the Hula valley
    const sluice = plat('sluice', E, -7, 17, 0.4, 2.4, 0.8, 2.4, { tag: 'metal' });
    const ly1 = plat('ly1', E, 1, 25, 0.5, 2.0, 0.4, 2.0, { tag: 'lily', when: 'hula' });
    const ly2 = plat('ly2', E, -1, 32, 1.3, 2.0, 0.4, 2.0, { tag: 'lily', when: 'hula' });
    const bd1 = plat('bd1', E, 1, 39, 2.3, 2.0, 0.5, 2.0, { tag: 'bird', when: 'hula', motion: { kind: 'bob', dir: fromLatLon(1, 39), amp: 0.2, period: 3, phase: 0 } });
    const cliff = plat('cliff', E, 0, 48, 3.3, 3.4, 3.8, 3.4, { tag: 'grass' });
    // West: the bare slope up to the ridge
    const t1 = plat('t1', E, 0, -24, 0.9, 2.2, 1.6, 3.0, { tag: 'soil' });
    const t2 = plat('t2', E, 0, -31, 1.8, 2.2, 2.5, 3.0, { tag: 'soil' });
    const t3 = plat('t3', E, 0, -38, 2.7, 2.2, 3.4, 3.0, { tag: 'soil' });
    const ridge = plat('ridge', E, 0, -48.5, 3.5, 4.2, 4.2, 4.2);
    const panel1 = plat('panel1', E, 4, -52, 3.75, 1.2, 0.25, 0.8, { tag: 'panel', when: 'solar' });
    const panel2 = plat('panel2', E, -4, -52, 3.75, 1.2, 0.25, 0.8, { tag: 'panel', when: 'solar' });
    // South: the jetty out to the lighthouse islet, and the high stones that stay dry
    const j1 = plat('j1', E, -19, 0, 0.5, 1.8, 0.5, 1.6, { tag: 'wood', unless: 'sea2' });
    const j2 = plat('j2', E, -26, 0, 0.5, 1.8, 0.5, 1.6, { tag: 'wood', unless: 'sea2' });
    const j3 = plat('j3', E, -33, 0, 0.5, 1.8, 0.5, 1.6, { tag: 'wood', unless: 'sea2' });
    const islet = plat('islet', E, -41, 1, 1.6, 2.8, 2.0, 2.6, { tag: 'sand' });
    const h1 = plat('h1', E, -22, 9, 1.4, 1.8, 1.8, 1.8);
    const h2 = plat('h2', E, -31, 8, 1.8, 1.8, 2.2, 1.8);

    const water = (deg: number, extra: Partial<Paint> = {}): Paint => ({ body: 'earth', lat: -32, lon: 2, deg, color: '#2f7fd8', kind: 'water', ...extra });
    return {
      bodies: [sphereBody('earth', 'earth', E.center, E.radius, 40)],
      boxes: [sluice, ly1, ly2, bd1, cliff, t1, t2, t3, ridge, panel1, panel2, j1, j2, j3, islet, h1, h2],
      balls: [],
      zones: [
        seaKill('lake', E, 0, 32, 9, 0.6, 'ספלאש! נפלתם לאגם החולה. העגורים מסתכלים עליכם בתימהון.', { when: 'hula' }),
        seaKill('sea0', E, -32, 2, 12, 0.6, 'ספלאש! הים קר. חזרה לחוף.'),
        seaKill('sea1', E, -32, 2, 14, 0.75, 'ספלאש! הים עלה וכיסה את החוף.', { when: 'sea1' }),
        seaKill('sea2', E, -32, 2, 16, 1.1, 'ספלאש! המזח הנמוך כבר מתחת למים.', { when: 'sea2' }),
        seaKill('sea3', E, -32, 2, 18, 1.3, 'ספלאש! מפלס הים עלה עוד.', { when: 'sea3' }),
        zoneAt('dust', 'wind', E, 0, -35, 2.2, 4.2, { dir: east(-35), power: 30, unless: 'trees' }),
      ],
      props: [
        prop('sap1', 'pod', spot(E, 5, -7, 0.4).pos, 1, 0.4),
        prop('sap2', 'pod', spot(E, -5, -7, 0.4).pos, 1, 0.4),
      ],
      spawn: spot(E, 0, 0, 0.5),
      page: { ...topOf(cliff, E.center, 0.9), when: 'chain' },
      crumbs: [
        topOf(bd1, E.center, 2.75),
        topOf(islet, E.center, 0.9),
        topOf(ridge, E.center, 2.85),
      ],
      checkpoints: [spot(E, 0, 12, 0.45), spot(E, 0, -15, 0.45), spot(E, -12, 0, 0.45), topOf(ridge, E.center, 0.45)],
      pads: [],
      switches: [
        pound('sw-sluice', topOf(sluice, E.center), 'hula', 'המים זורמים חזרה לחולה (הידרוספרה)! ובעקבות המים חוזרים צמחי המים והציפורים (ביוספרה).'),
        deliver('hole1', spot(E, 5, -17, 0.45), 'kind:pod', 'tree1', 'השתיל נשתל בגומה, והשורשים כבר נאחזים בקרקע.', 1.7),
        deliver('hole2', spot(E, -5, -17, 0.45), 'kind:pod', 'tree2', 'השתיל נשתל בגומה, והשורשים כבר נאחזים בקרקע.', 1.7),
        pound('sw-solar', spot(E, 0, -46.5, 3.5 + 0.45), 'solar', 'המפעל עבר לאנרגיית שמש: פחות גזי חממה באטמוספרה, וההתחממות נבלמת. הקרח מפסיק להימס.'),
      ],
      sunDir: norm(fromLatLon(20, 15)),
      sky: [{ kind: 'moon', dir: norm(fromLatLon(50, 120)), sizeDeg: 6 }],
      paint: [
        { body: 'earth', lat: 0, lon: 32, deg: 10, color: '#a08a62', kind: 'dust', unless: 'hula' },
        { body: 'earth', lat: 0, lon: 32, deg: 10, color: '#3f8fd8', kind: 'water', when: 'hula' },
        { body: 'earth', lat: 0, lon: -33, deg: 11, color: '#b09468', kind: 'dust', unless: 'trees' },
        water(13), water(15, { when: 'sea1' }), water(17, { when: 'sea2' }), water(19, { when: 'sea3' }),
        { body: 'earth', lat: -90, lon: 0, deg: 30, color: '#eef6ff', kind: 'ice', unless: 'sea1' },
        { body: 'earth', lat: -90, lon: 0, deg: 24, color: '#eef6ff', kind: 'ice', when: 'sea1', unless: 'sea2' },
        { body: 'earth', lat: -90, lon: 0, deg: 18, color: '#eef6ff', kind: 'ice', when: 'sea2' },
        { body: 'earth', lat: 90, lon: 0, deg: 18, color: '#eef6ff', kind: 'ice' },
      ],
      decor: [
        decoAt('sign', spot(E, 4, 14, 0), 1, { label: 'עמק החולה' }),
        decoAt('sign', spot(E, 4, -13, 0), 1, { label: 'המדרון החשוף' }),
        decoAt('sign', spot(E, -12, 5, 0), 1, { label: 'החוף' }),
        decoAt('sign', spot(E, 7, -4, 0), 1, { label: 'משתלה' }),
        deco('bird', E, 4, 30, 0.8, 3.5, { when: 'hula' }), deco('bird', E, -4, 36, 0.7, 4.5, { when: 'hula' }), deco('bird', E, 6, 42, 0.8, 6, { when: 'hula' }),
        deco('rock', E, 8, 30, 1.2, 0, { unless: 'hula' }), deco('rock', E, -7, 35, 1.5, 0, { unless: 'hula' }),
        deco('sapling', E, 5, -17, 1, 0, { unless: 'tree1' }), deco('tree', E, 5, -17, 2.6, 0, { when: 'tree1' }),
        deco('sapling', E, -5, -17, 1, 0, { unless: 'tree2' }), deco('tree', E, -5, -17, 2.4, 0, { when: 'tree2' }),
        deco('tree', E, 8, -28, 2.2, 0, { when: 'trees' }), deco('tree', E, -8, -36, 2.6, 0, { when: 'trees' }),
        deco('cloud', E, 0, -33, 3, 3.2, { unless: 'trees' }), deco('cloud', E, 5, -28, 2.2, 2.4, { unless: 'trees' }),
        deco('factory', E, 0, -52, 2.2, 3.5, { unless: 'solar' }),
        deco('flag', E, 3, -45.5, 1, 3.5),
        decoAt('star_beacon', topOf(islet, E.center, -0.45), 1.2),
        deco('ice_crystal', E, -62, 10, 1.6, 0, { unless: 'sea2' }), deco('ice_crystal', E, -66, -12, 2, 0, { unless: 'sea1' }),
        deco('tree', E, 8, 50, 2.4), deco('tree', E, -8, 52, 2.2),
      ],
    };
  },
  script: {
    tick(api, dt) {
      const f = api.flags;
      if (!f.has('solar')) {
        const melt = ((api.state.melt as number) ?? 0) + dt;
        api.state.melt = melt;
        const say = ['הקרח בקוטב נמס, והמים זורמים לים. מפלס הים עולה!', 'הים עלה והציף את המזח הנמוך! עכשיו אפשר להגיע לאי רק בשביל האבנים הגבוה.', 'מפלס הים עלה שוב. עצרו את ההתחממות!'];
        SEA_AT.forEach((t, i) => {
          if (melt >= t && !f.has(`sea${i + 1}`)) { api.setFlag(`sea${i + 1}`); api.say(say[i], 'oops'); api.log('sea', 'rise', i + 1); }
        });
      }
      if (f.has('tree1') && f.has('tree2') && !f.has('trees')) {
        api.setFlag('trees');
        api.say('שורשי העצים (ביוספרה) מחזיקים את הקרקע (גאוספרה), וסופת האבק (אטמוספרה) נרגעה!', 'good');
      }
      const done = ['hula', 'trees', 'solar'].filter((k) => f.has(k)).length;
      if (api.state.done !== done) {
        api.state.done = done;
        api.objective(done < 3 ? `תקנו את שלוש השרשראות (${done}/3)` : 'השרשרת תוקנה! עלו אל צוק התצפית מעל החולה');
        if (done === 3 && !f.has('chain')) {
          api.setFlag('chain');
          api.emit('reveal');
          api.say('המים, האוויר, הקרקע והחיים שוב משפיעים זה על זה לטובה. דף האטלס מחכה על צוק התצפית!', 'good');
        }
      }
    },
  },
  route: [
    // the Hula sluice
    { to: 'cp:0' },
    { to: 'sw-sluice', jump: 'full', jumpAt: 2.2, pound: true },
    // two saplings to the slope
    { to: 'sap1', action: true, near: 1.0 },
    { to: spot(E, 5, -15.6, 0.45).pos, action: true, near: 0.6 },
    { to: 'sap2', action: true, near: 1.0 },
    { to: spot(E, -5, -15.6, 0.45).pos, action: true, near: 0.6, until: 'trees' },
    // up the calm slope to the factory
    { to: 'top:t1', jump: 'full', jumpAt: 1.7 },
    { to: 'top:t2', jump: 'full', jumpAt: 1.9 },
    { to: 'top:t3', jump: 'full', jumpAt: 1.9 },
    { to: 'top:ridge', jump: 'full', jumpAt: 2.7 },
    { to: 'crumb:2', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: 'sw-solar', pound: true },
    // the jetty to the islet
    { to: 'cp:2' },
    { to: 'top:j1', jump: 'full', jumpAt: 1.5 },
    { to: 'top:j2', jump: 'full', jumpAt: 2.0 },
    { to: 'top:j3', jump: 'full', jumpAt: 2.0 },
    { to: 'top:islet', jump: 'full', jumpAt: 2.4 },
    { to: 'crumb:1' },
    { to: 'top:j3', jump: 'full', jumpAt: 2.4 },
    { to: 'top:j2', jump: 'full', jumpAt: 2.0 },
    { to: 'top:j1', jump: 'full', jumpAt: 2.0 },
    // the restored lake up to the cliff
    { to: 'cp:0', jump: 'full', jumpAt: 1.5 },
    { to: 'top:ly1', jump: 'full', jumpAt: 1.6 },
    { to: 'top:ly2', jump: 'full', jumpAt: 2.0 },
    { to: 'top:bd1', jump: 'full', jumpAt: 2.0 },
    { to: 'crumb:0', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: 'top:cliff', jump: 'puff', jumpAt: 2.6 },
    { to: 'page', until: 'chain' },
  ],
  routeTimeout: 240,
};

/** Places, for tests. */
export const L08_PLACES = { E, SEA_AT };
