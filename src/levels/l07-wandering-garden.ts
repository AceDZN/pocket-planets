import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, plat, sphereBody, topOf, prop } from '../core/level';
import { spot, deco, decoAt, zoneAt, pad, sendHome, angleDeg, ride } from './lib-b';

// A seed pod looks for a home. Carry it (E), then throw or drop it (E again): it blooms only where Workbook's three
// conditions for life meet — an atmosphere that supports life, liquid water and a suitable temperature. Sample chunks
// of the Moon, Mars and נוגה hang in space beside a tiny Earth; on Earth itself the desert lacks water and the ice cap
// is far too cold. The pod is a scientist: it won't settle until it has been tried in two other places to compare.

const E: BodyRef = { id: 'earth', center: v3(0, 0, 0), radius: 16 };
const MOON: BodyRef = { id: 'moon-chunk', center: v3(-90, 30, -60), radius: 6 };
const MARS: BodyRef = { id: 'mars-chunk', center: v3(0, 40, -110), radius: 6 };
const VENUS: BodyRef = { id: 'venus-chunk', center: v3(90, 30, -60), radius: 6 };

const HUB = spot(E, -4, 0, 0.5);
const ICE_DEG = 32;

const wpE = (lat: number, lon: number) => spot(E, lat, lon, 0.45).pos;
const sample = (b: BodyRef, world: string) => sphereBody(b.id, world, b.center, b.radius, 14);

export const L07: LevelDef = {
  n: 7,
  slug: 'wandering-garden',
  titleHe: 'הגינה הנודדת',
  worldNo: 2,
  worldId: 'earth',
  introHe: [
    'זרע קטן מחפש בית. הרימו אותו (E), וזרקו אותו (E שוב) למקום שבו הוא יוכל לפרוח.',
    'הזרע פורח רק במקום שיש בו אטמוספרה שמתאימה לחיים, מים נוזליים וטמפרטורה מתאימה.',
    'הזרע הוא חוקר: לפני שיפרח הוא רוצה להשוות. נסו אותו קודם בשני מקומות אחרים, למשל בדגימות הירח, מאדים ונוגה.',
  ],
  objectiveHe: 'נסו את הזרע בשני מקומות שונים, ואז מצאו מקום שבו יפרח',
  hintsHe: [
    'משטחי השיגור שליד המחסן מובילים לדגימות של עולמות אחרים. אפשר לקחת את הזרע איתכם.',
    'במדבר יש אוויר וחום, אבל כמעט אין מים נוזליים. בכיפת הקרח המים קפואים והקור עז.',
    'חפשו מקום שבו נפגשים מים זורמים וקרקע: גדת הנהר שבמזרח.',
  ],
  atlasHe: 'לחיים דרושים טמפרטורה מתאימה, מים נוזליים ואטמוספרה שמתאימה לחיים. כדור הארץ הוא העולם היחיד במערכת השמש שבו שלושת התנאים מתקיימים יחד, ואפילו בו לא בכל מקום באותה מידה: במדבר מעט מאוד מים, ובכיפת הקרח קר מאוד והמים קפואים.',
  skillHe: 'תנאים לקיום חיים',
  modules: ['grade-8/chapter-1/solar-system', 'grade-8/chapter-1/earth-system'],
  thermo: true,
  build() {
    const bank = plat('bank', E, 0, 36, 1.0, 4.2, 1.6, 5.2, { tag: 'soil' });
    const bstep = plat('bstep', E, 1, 26.5, 0.5, 1.8, 1.0, 2.0, { tag: 'grass' });
    const dstep = plat('dstep', E, 0, -27, 1.0, 2.0, 1.6, 2.2, { tag: 'sand' });
    const mesa = plat('mesa', E, 0, -36.5, 2.0, 2.8, 2.6, 2.8, { tag: 'sand' });
    const ice1 = plat('ice1', E, 64, 0, 1.0, 2.6, 1.2, 2.6, { ice: true, tag: 'ice' });
    const shed = plat('shed', E, 6, 0, 0.6, 2.2, 1.2, 1.6, { tag: 'wood' });
    const moonRim = plat('moon-rim', MOON, 0, -40, 1.4, 2.0, 1.8, 2.0);
    return {
      bodies: [
        sphereBody('earth', 'earth', E.center, E.radius, 40),
        sample(MOON, 'moon'), sample(MARS, 'mars'), sample(VENUS, 'venus'),
      ],
      boxes: [bank, bstep, dstep, mesa, ice1, shed, moonRim],
      balls: [],
      zones: [
        // the riverbank: flowing water and soil together
        zoneAt('river', 'water', E, 0, 37, 1.0, 2.8),
        zoneAt('bank-soil', 'soil', E, 0, 37, 1.0, 2.8),
        // ground everywhere else that has it (but no water)
        zoneAt('desert-soil', 'soil', E, 0, -40, 0, 9),
        zoneAt('moon-soil', 'soil', MOON, 0, 0, 0, 9),
        zoneAt('mars-soil', 'soil', MARS, 0, 0, 0, 9),
        zoneAt('venus-soil', 'soil', VENUS, 0, 0, 0, 9),
        zoneAt('venus-cool', 'cool', VENUS, 0, 0, 0, 2.6),
      ],
      props: [prop('pod', 'pod', spot(E, 3, 3, 0.4).pos, 1, 0.4)],
      spawn: HUB,
      page: { ...topOf(bank, E.center, 0.9), when: 'bloom' },
      crumbs: [
        spot(E, 0, -36.5, 2.0 + 2.85),
        spot(E, 64, 0, 1.0 + 1.6),
        spot(MOON, 0, -40, 1.4 + 5.2),
      ],
      checkpoints: [spot(E, 0, -20, 0.45), spot(E, 0, 20, 0.45), spot(E, 50, 0, 0.45)],
      pads: [
        pad('to-moon', spot(E, -9, -13, 0.45), 'דגימת ירח', 'warp', { to: spot(MOON, 0, 0, 0.5) }),
        pad('to-mars', spot(E, -13, 0, 0.45), 'דגימת מאדים', 'warp', { to: spot(MARS, 0, 0, 0.5) }),
        pad('to-venus', spot(E, -9, 13, 0.45), 'דגימת נוגה', 'warp', { to: spot(VENUS, 0, 0, 0.5) }),
        pad('moon-home', spot(MOON, 0, 30, 0.45), 'חזרה לכדור הארץ', 'warp', { to: HUB }),
        pad('mars-home', spot(MARS, 0, 30, 0.45), 'חזרה לכדור הארץ', 'warp', { to: HUB }),
        pad('venus-home', spot(VENUS, 0, 22, 0.45), 'חזרה לכדור הארץ', 'warp', { to: HUB }),
      ],
      switches: [],
      sunDir: norm(fromLatLon(30, 25)),
      sky: [{ kind: 'moon', dir: norm(fromLatLon(45, -70)), sizeDeg: 6 }],
      paint: [
        { body: 'earth', lat: 0, lon: -40, deg: 17, color: '#e3c27a', kind: 'sand' },
        { body: 'earth', lat: 90, lon: 0, deg: ICE_DEG, color: '#eef6ff', kind: 'ice' },
        { body: 'earth', lat: -90, lon: 0, deg: 20, color: '#eef6ff', kind: 'ice' },
        ...[-24, -16, -8, 0, 8, 16, 24].map((lat) => ({ body: 'earth', lat, lon: 45 + Math.abs(lat) * 0.15, deg: 4.5, color: '#2f7fd8', kind: 'water' as const })),
        { body: 'earth', lat: 0, lon: 160, deg: 40, color: '#2f7fd8', kind: 'water' },
        { body: 'earth', lat: 0, lon: 34, deg: 8, color: '#4f9a3e', kind: 'grass' },
      ],
      decor: [
        decoAt('sign', spot(E, 7, -4, 0), 1, { label: 'מחסן הזרעים' }),
        deco('sign', E, 4, -24, 1, 0, { label: 'מדבר' }),
        deco('sign', E, 50, 6, 1, 0, { label: 'כיפת הקרח' }),
        deco('sign', E, 5, 25, 1, 0, { label: 'גדת הנהר' }),
        deco('rock', E, 6, -40, 1.6), deco('rock', E, -7, -44, 2), deco('rock', E, 5, -32, 1.1),
        deco('ice_crystal', E, 60, 12, 1.4), deco('ice_crystal', E, 70, -15, 1.8), deco('ice_crystal', E, 58, -8, 1.1),
        deco('tree', E, 8, 33, 2.2), deco('tree', E, -9, 34, 2.6), deco('bird', E, 4, 44, 0.7, 4),
        decoAt('tree', topOf(bank, E.center, -0.45), 2.6, { when: 'bloom' }),
        decoAt('sapling', topOf(bank, E.center, -0.45), 1, { unless: 'bloom' }),
        deco('cloud', E, 10, 40, 2.4, 7), deco('cloud', E, -10, -10, 2, 8),
        deco('crater', MOON, 10, -10, 2.4), deco('crater', MOON, -15, 15, 1.8),
        deco('rock', MARS, 15, 15, 1.2), deco('rover', MARS, -15, -18, 0.9),
        deco('rock', VENUS, 18, -15, 1.4), deco('crystal', VENUS, -18, 10, 1),
        decoAt('sign', spot(MOON, -15, 0, 0), 0.9, { label: 'ירח' }),
        decoAt('sign', spot(MARS, -15, 0, 0), 0.9, { label: 'מאדים' }),
        decoAt('sign', spot(VENUS, -15, -8, 0), 0.9, { label: 'נוגה' }),
      ],
    };
  },
  script: {
    event(api, ev) {
      if (ev.id !== 'pod' || (ev.type !== 'drop' && ev.type !== 'throw')) return;
      const pod = api.props.find((p) => p.id === 'pod');
      if (!pod || pod.carried || api.flags.has('bloom')) return;
      const onEarth = (q: { x: number; y: number; z: number }) => Math.hypot(q.x, q.y, q.z) < E.radius + 6;
      if (ev.type === 'throw') {
        // the sample chunks are tiny and their pull is weak: a thrown pod would sail off them, so it sinks in at once
        if (onEarth(api.player.pos)) return;
        pod.pos = { ...api.player.pos };
        pod.vel = { x: 0, y: 0, z: 0 };
        pod.resting = true;
      }
      const home = Math.hypot(pod.pos.x - pod.home.x, pod.pos.y - pod.home.y, pod.pos.z - pod.home.z) < 0.3;
      if (home) return;
      let res = api.life(pod.pos);
      if (onEarth(pod.pos) && angleDeg(E, pod.pos, 90, 0) < ICE_DEG) {
        // the polar cap: the water is ice and the cold is fierce
        res = { ok: false, have: { ...res.have, water: false, warmth: false }, reasonHe: 'קר מדי, והמים כאן קפואים לקרח (אין מים נוזליים)' };
      }
      const tried = (api.state.tried ??= []) as string[];
      if (res.ok && tried.length < 2) {
        // the right spot, but nothing to compare it with yet
        api.emit('wilt', pod.pos, 'pod');
        api.log('plant', 'compare-first', tried.length);
        api.say(`הזרע מהסס… הוא רוצה להשוות לפני שהוא פורח. נסו אותו קודם ב${tried.length ? 'עוד מקום אחד' : 'שני מקומות אחרים'}.`, 'info');
        api.state.wiltAt = api.t;
        return;
      }
      if (res.ok) {
        api.setFlag('bloom');
        api.emit('bloom', pod.pos, 'pod');
        api.log('plant', 'bloom', 'riverbank');
        api.say('הזרע פורח! יש כאן אטמוספרה שמתאימה לחיים, מים נוזליים וטמפרטורה נעימה. דף האטלס צמח על הגדה.', 'good');
        api.objective('קחו את דף האטלס מגדת הנהר');
        pod.alive = false;
        return;
      }
      const where = api.player.bodyWorld ?? 'earth';
      // a "place" for the comparison: each sample world, or a part of Earth (ice cap, desert, anywhere else)
      const place = !onEarth(pod.pos) ? where : angleDeg(E, pod.pos, 90, 0) < ICE_DEG ? 'ice' : angleDeg(E, pod.pos, 0, -40) < 25 ? 'desert' : 'meadow';
      if (!tried.includes(place)) tried.push(place);
      if (tried.length < 2) api.objective(`נסו את הזרע עוד במקום אחד שונה, ואז מצאו מקום שבו יפרח`);
      else api.objective('מצאו לזרע מקום שבו יפרח');
      api.emit('wilt', pod.pos, 'pod');
      api.log('plant', 'wilt', { where, have: res.have });
      api.say(`פְסס… הזרע נבל. חסר כאן: ${res.reasonHe}`, 'oops');
      api.state.wiltAt = api.t;
    },
    tick(api) {
      const at = api.state.wiltAt as number | undefined;
      if (at === undefined || api.t - at < 1.6) return;
      delete api.state.wiltAt;
      const pod = api.props.find((p) => p.id === 'pod');
      if (pod && !pod.carried && pod.alive) {
        sendHome(pod);
        api.say('זרע חדש חיכה לכם במחסן הזרעים.', 'info');
      }
    },
  },
  route: [
    { to: 'cp:0' },
    { to: 'top:dstep', jump: 'full', jumpAt: 1.7 },
    { to: 'top:mesa', jump: 'full', jumpAt: 1.9 },
    { to: 'crumb:0', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    ...ride('to-mars'),
    ...ride('mars-home'),
    ...ride('to-moon'),
    { to: 'top:moon-rim', jump: 'full', jumpAt: 2 },
    { to: 'crumb:2', jump: 'full', jumpAt: 0.3, near: 0.5 },
    ...ride('moon-home'),
    { to: 'cp:1' },
    { to: 'cp:2' },
    { to: 'top:ice1', jump: 'full', jumpAt: 2.3 },
    { to: 'crumb:1', jump: 'full', jumpAt: 0.4, near: 0.5 },
    { to: 'cp:2' },
    { to: 'cp:1' },
    { to: 'cp:0' },
    // compare first: the desert (no liquid water), then the ice cap (frozen, too cold)
    { to: 'pod', action: true, near: 1.0 },
    { to: 'cp:0', action: true, wait: 2.4 },
    { to: 'pod', action: true, near: 1.0 },
    { to: 'cp:1' },
    { to: 'cp:2' },
    { to: wpE(60, 8), action: true, wait: 2.4 },
    { to: 'cp:2' },
    { to: 'cp:1' },
    { to: 'cp:0' },
    { to: 'pod', action: true, near: 1.0 },
    { to: 'top:bstep', jump: 'full', jumpAt: 1.6, action: true },
    { to: 'top:bank', jump: 'full', jumpAt: 3.2 },
    { to: 'page', until: 'bloom', near: 0.6 },
  ],
  routeTimeout: 240,
};

/** Places, for tests. */
export const L07_PLACES = { E, MOON, MARS, VENUS, ICE_DEG };
