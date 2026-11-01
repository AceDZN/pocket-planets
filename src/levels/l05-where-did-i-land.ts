import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, type Pad, type Switch, plat, sphereBody, topOf } from '../core/level';
import { deco, at, wp } from './lib-a';

// Transfer: an unnamed world with the jump of כספית and מאדים alike (g 0.38), so the jump alone can't decide.
// Three probes (day side, night side, the sky mast) collect the evidence; then four launch pads wake up. Black sky,
// no air, a huge Sun, 430 °C by day and −180 °C by night: כספית. Every other pad is a funny wrong landing.

const W: BodyRef = { id: 'unknown', center: v3(0, 0, 0), radius: 14 };
const SUN = norm(fromLatLon(0, 86.3));
const LANDING = at(W, 0, 0);
/** The day-side rocks sit south of the landing so their long shadows miss the band's checkpoint. */
const DAY_LAT = -8;

/** Pads along the twilight band; the right one is neither first nor last on the way down. */
const PADS: Array<{ id: string; lat: number; answer: string; labelHe: string; kind: Pad['kind']; explainHe?: string }> = [
  {
    id: 'pad-mars', lat: -20, answer: 'mars', labelHe: 'מאדים', kind: 'wrong',
    explainHe: 'נחתתם עם מסכת אבק ומעיל חורף… אבל כאן אין אוויר בכלל והשמיים שחורים. במאדים יש אטמוספרה דלילה, שמיים ורודים ושמש קטנה יותר, ואין בו חום לוהט כזה. חזרה לנקודת הנחיתה!',
  },
  {
    id: 'pad-moon', lat: -31, answer: 'moon', labelHe: 'הירח', kind: 'wrong',
    explainHe: 'קפצתם לשלום לירח… ונחתתם על הראש. בירח הקפיצה גבוהה יותר מפי 2 מכאן, והשמש שם בגודל שאנחנו רואים מכדור הארץ, לא ענקית כמו כאן. חזרה לנקודת הנחיתה!',
  },
  { id: 'pad-mercury', lat: -42, answer: 'mercury', labelHe: 'כספית', kind: 'win' },
  {
    id: 'pad-venus', lat: -53, answer: 'venus', labelHe: 'נוגה', kind: 'wrong',
    explainHe: 'פתחתם מטרייה לעננים העבים… אבל אין כאן עננים, ובצד הלילה קופא. בנוגה האוויר העבה שומר על חום עצום גם בלילה. חזרה לנקודת הנחיתה!',
  },
];

const PROBE_FLAGS = ['probe-day', 'probe-night', 'probe-sky'];

export const L05: LevelDef = {
  n: 5,
  slug: 'where-did-i-land',
  titleHe: 'כספית',
  worldNo: 1,
  worldId: 'mercury',
  transfer: true,
  hideName: true,
  publicTitleHe: 'איפה נחתתי?',
  thermo: true,
  introHe: [
    'הנחיתה הייתה קצת עקומה, והמפה נשרפה. על איזה עולם נחתתם?',
    'הקפיצה לבד לא תספיק כדי לדעת. הפעילו את שלושת החיישנים: בצד היום, בצד הלילה ועל תורן השמיים. אחר כך בחרו משטח שיגור.',
  ],
  objectiveHe: 'הפעילו 3 חיישנים: צד היום, צד הלילה ותורן השמיים',
  hintsHe: [
    'החיישנים נדלקים כשעומדים עליהם. צד היום מזרחה (לכיוון השמש), צד הלילה מערבה, והתורן צפונה.',
    'שאלו את עצמכם: האם יש כאן אוויר? מה צבע השמיים? כמה גדולה השמש? ומה ההבדל בין היום ללילה?',
    'עולם בלי אוויר, עם שמש ענקית, חום לוהט ביום וקור עז בלילה, הוא העולם הקרוב ביותר לשמש.',
  ],
  atlasHe: 'זיהיתם את כספית לפי העדויות: אין לה אטמוספרה ולכן השמיים שחורים, היא הקרובה ביותר לשמש ולכן השמש נראית ענקית, ובלי אוויר שישמור את החום יש בה יום לוהט ולילה קפוא. מאדים, עם אותה כבידה בערך, הוא כוכב רחוק יותר עם אוויר דליל.',
  extraHe: 'לפי נאס"א: הכבידה בכספית ובמאדים כמעט זהה, כ-0.38 מזו של כדור הארץ. מכספית השמש נראית גדולה פי 2.5 בערך ממה שאנחנו רואים, וממאדים קטנה פי 1.5 בערך.',
  skillHe: 'זיהוי עולם לפי עדויות: אוויר, שמיים, שמש, חום',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    const mast = plat('mast', W, 32, 0, 3.0, 1.8, 5, 1.8, { tag: 'metal' });
    const shade1 = plat('shade1', W, DAY_LAT, 28, 2.6, 1.8, 5, 2.6);
    const shade2 = plat('shade2', W, DAY_LAT, 52, 3.2, 1.8, 5.6, 2.6);
    const pillar = plat('pillar', W, -10, -34, 3.6, 1.6, 6, 1.6);
    const probe = (id: string, sets: string, s: { pos: { x: number; y: number; z: number }; up: { x: number; y: number; z: number } }, sayHe: string): Switch =>
      ({ id, pos: s.pos, up: s.up, radius: 1.2, by: 'touch', sets, sayHe });
    const pads: Pad[] = PADS.map((p) => {
      const s = at(W, p.lat, 1);
      return { id: p.id, pos: s.pos, up: s.up, labelHe: p.labelHe, kind: p.kind, answer: p.answer, explainHe: p.explainHe, back: LANDING, when: 'evidence' };
    });
    return {
      bodies: [sphereBody('unknown', 'mercury', W.center, W.radius, 40)],
      boxes: [mast, shade1, shade2, pillar],
      balls: [],
      zones: [],
      props: [],
      spawn: at(W, 0, 0, 0.5),
      // no page: the right pad wins
      page: { ...at(W, 0, 0, -13), when: 'never' },
      crumbs: [
        // above the sky mast: a full jump from its top
        at(W, 32, 0, 3.0 + 3.6),
        // deep in the day side past the shade rocks
        at(W, DAY_LAT, 72, 1.6),
        // on a night-side pillar
        topOf(pillar, W.center, 0.6),
      ],
      checkpoints: [at(W, 0, 2)],
      pads,
      switches: [
        probe('probe-day', 'probe-day', at(W, DAY_LAT, 40), 'חיישן צד היום: לוהט! אין אוויר שיפזר את החום.'),
        probe('probe-night', 'probe-night', at(W, 0, -30), 'חיישן צד הלילה: קפוא! אין אוויר שישמור את החום.'),
        probe('probe-sky', 'probe-sky', topOf(mast, W.center, 0), 'חיישן השמיים: אין כאן אוויר בכלל. השמיים שחורים גם ביום, והשמש נראית ענקית.'),
      ],
      sunDir: SUN,
      decor: [
        deco('part', W, 2, -3, 0.8), deco('debris', W, -2, 3, 0.7), deco('crater', W, -3, -1, 3),
        deco('satellite', W, -1, 4, 0.9, { yawDeg: 40 }),
        deco('crater', W, 25, 40, 5), deco('crater', W, -30, -60, 6), deco('crater', W, 40, -30, 4), deco('crater', W, -20, 100, 5),
        deco('rock', W, 6, 18, 1), deco('rock', W, -8, -20, 1.1),
        deco('sign', W, -12, 4, 1, { label: 'משטחי שיגור ⬇' }),
        deco('launch_pad', W, -20, 1, 1), deco('launch_pad', W, -31, 1, 1), deco('launch_pad', W, -42, 1, 1), deco('launch_pad', W, -53, 1, 1),
      ],
    };
  },
  script: {
    event(api, ev) {
      if (ev.type !== 'switch' || api.flags.has('evidence')) return;
      const n = PROBE_FLAGS.filter((f) => api.flags.has(f)).length;
      if (n < PROBE_FLAGS.length) {
        api.objective(`הפעילו את החיישנים: ${n} מתוך 3`);
        return;
      }
      api.setFlag('evidence');
      api.say('כל החיישנים פועלים! ארבעה משטחי שיגור התעוררו בדרום. על איזה עולם אתם עומדים?', 'good');
      api.objective('בחרו את משטח השיגור של העולם שעליו נחתתם');
    },
  },
  route: [
    // night probe, and the night pillar crumb on the way
    { to: wp(W, 0, -30) },
    { to: 'top:pillar', jump: 'puff', jumpAt: 2.6, near: 1.0 },
    { to: wp(W, 0, 2) },
    // sky mast
    { to: wp(W, 24, 0) },
    { to: 'top:mast', jump: 'full', jumpAt: 2.6, near: 0.9 },
    { to: 'crumb:0', jump: 'full', jumpAt: 1.0 },
    { to: wp(W, 4, 4) },
    // day probe, cooling in the rocks' shade, then the deep crumb
    { to: wp(W, DAY_LAT, 28 - 7.5), wait: 0.6 },
    { to: 'top:shade1', jump: 'full', jumpAt: 3, near: 1.0 },
    { to: wp(W, DAY_LAT, 40) },
    { to: wp(W, DAY_LAT, 52 - 7.5), wait: 1.6 },
    { to: 'top:shade2', jump: 'full', jumpAt: 3, near: 1.0 },
    { to: 'crumb:1', jump: 'full', jumpAt: 3.5 },
    { to: wp(W, DAY_LAT + 7, 58) },
    { to: wp(W, DAY_LAT + 7, 46) },
    { to: wp(W, DAY_LAT, 52 - 7.5), wait: 2.2 },
    { to: wp(W, DAY_LAT + 7, 28) },
    { to: wp(W, 2, 4) },
    // the right pad
    { to: wp(W, -12, 4) },
    { to: wp(W, -36, 4.5) },
    { to: 'pad-mercury', near: 0.5, wait: 1.5 },
  ],
};
