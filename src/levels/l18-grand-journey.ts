import { v3, norm } from '../core/vec';
import { type LevelDef, type BodyRef, type RouteStep, plat, sphereBody, topOf } from '../core/level';
import type { Box, Zone } from '../core/physics';
import { spot, deco, decoAt, pad, touch, ride } from './lib-b';
import type { Pad, Switch, Decor, Spot } from '../core/level';

// The final journey, no hints and no names: four little worlds in a row. On each, climb the marker pillar (its
// height is set by that world's jump), read the thermometer, the ground and the air, then step on the pad that
// names the world. A wrong name is a short, silly detour back to the landing spot. After the fourth: home.

type WorldKey = 'moon' | 'mars' | 'venus' | 'mercury';
const NAME: Record<WorldKey, string> = { moon: 'הירח', mars: 'מאדים', venus: 'נוגה', mercury: 'כספית' };
/** What each world is like, said when a pad names it wrongly. */
const LIKE: Record<WorldKey, string> = {
  moon: 'בירח הקפיצה ארוכה וגבוהה מאוד, אין אוויר והקרקע אפורה',
  mars: 'במאדים יש אוויר דליל ושמיים ורודים, השמש קטנה יותר, וקופצים גבוה בערך כמו בכספית',
  venus: 'בנוגה האוויר סמיך ולוהט ביום ובלילה, והקפיצה כמעט כמו בכדור הארץ',
  mercury: 'בכספית אין אוויר, ביום לוהט מאוד ובלילה קפוא, וקופצים גבוה בערך כמו במאדים',
};

interface Stop { key: WorldKey; body: BodyRef; pillar: number; labels: WorldKey[]; hot?: boolean }
const R = 7;
const STOPS: Stop[] = [
  { key: 'moon', body: { id: 'w1', center: v3(0, 0, 0), radius: R }, pillar: 5.2, labels: ['mars', 'venus', 'moon', 'mercury'] },
  { key: 'venus', body: { id: 'w2', center: v3(100, 0, 0), radius: R }, pillar: 1.0, labels: ['moon', 'mercury', 'mars', 'venus'], hot: true },
  { key: 'mars', body: { id: 'w3', center: v3(200, 0, 0), radius: R }, pillar: 2.4, labels: ['venus', 'mars', 'mercury', 'moon'] },
  { key: 'mercury', body: { id: 'w4', center: v3(300, 0, 0), radius: R }, pillar: 2.4, labels: ['mercury', 'moon', 'venus', 'mars'], hot: true },
];
const HOME: BodyRef = { id: 'home', center: v3(400, 0, 0), radius: R };
const CORNERS: [number, number][] = [[12, 12], [12, -12], [-12, 12], [-12, -12]];

const arrival = (s: Stop): Spot => spot(s.body, 0, 0, 0.5);
const pillarBox = (s: Stop, i: number): Box => plat(`pillar${i + 1}`, s.body, 0, -24, s.pillar, 1.6, s.pillar, 1.6, { tag: 'metal' });

function stopParts(s: Stop, i: number): { boxes: Box[]; pads: Pad[]; switches: Switch[]; zones: Zone[]; decor: Decor[] } {
  const pillar = pillarBox(s, i);
  const next = i + 1 < STOPS.length ? arrival(STOPS[i + 1]) : spot(HOME, 0, 0, 0.5);
  const seen = `seen${i + 1}`;
  const pads = s.labels.map((k, j) => {
    const at = spot(s.body, CORNERS[j][0], CORNERS[j][1], 0.45);
    const id = `w${i + 1}-${k}`;
    return k === s.key
      ? pad(id, at, NAME[k], 'warp', { to: next, answer: k, when: seen, sets: i + 1 === STOPS.length ? 'home' : `right${i + 1}` })
      : pad(id, at, NAME[k], 'wrong', {
        answer: k, when: seen, back: arrival(s),
        explainHe: `פְּלוֹפּ! משטח השיגור השתעל והחזיר אתכם. זה לא ${NAME[k]}: ${LIKE[k]}. הסתכלו שוב על הקפיצה, החום, האוויר והקרקע.`,
      });
  });
  return {
    boxes: [pillar],
    pads,
    switches: [touch(`mark${i + 1}`, topOf(pillar, s.body.center), seen, 'מדדתם את הקפיצה כאן. עכשיו בחרו: איזה עולם זה?', 1.3)],
    zones: s.hot ? [{ id: `cool${i + 1}`, kind: 'cool', center: spot(s.body, 0, -6, 0).pos, radius: 4.6 }] : [],
    decor: [
      deco('flag', s.body, -14, 0, 0.9),
      deco('rock', s.body, 30, 60, 1.2), deco('rock', s.body, -35, 120, 1.6), deco('crater', s.body, 40, -90, 2),
      ...(s.key === 'mars' ? [deco('rover', s.body, -30, 50, 0.9)] : []),
      ...(s.key === 'venus' ? [deco('crystal', s.body, 30, 140, 1.1)] : []),
    ],
  };
}

const PARTS = STOPS.map(stopParts);

/** Route on one stop: climb the pillar (touching the marker), take the stop's crumb if it has one, ride the right pad. */
function stopRoute(s: Stop, i: number, crumb?: number): RouteStep[] {
  const rightIdx = s.labels.indexOf(s.key);
  const steps: RouteStep[] = [
    { to: `top:pillar${i + 1}`, jump: 'full', jumpAt: 2.6 },
    { to: `mark${i + 1}` },
  ];
  if (crumb !== undefined) steps.push({ to: `crumb:${crumb}`, jump: 'puff', jumpAt: 0.3, near: 0.5 }, { to: `top:pillar${i + 1}`, near: 0.6 });
  steps.push(...ride(`w${i + 1}-${s.labels[rightIdx]}`));
  return steps;
}

export const L18: LevelDef = {
  n: 18,
  slug: 'grand-journey',
  titleHe: 'המסע הגדול',
  worldNo: 4,
  worldId: 'deep',
  transfer: true,
  hideName: true,
  noHints: true,
  thermo: true,
  introHe: [
    'המסע הגדול: ארבעה עולמות קטנים, בלי שמות ובלי רמזים.',
    'בכל עולם טפסו על עמוד הסימון, הסתכלו על הקפיצה, על מד החום, על האוויר ועל הקרקע, ובחרו את השם הנכון. בסוף מחכה הבית.',
  ],
  objectiveHe: 'זהו כל עולם לפי הקפיצה, החום, האוויר והקרקע',
  hintsHe: [],
  atlasHe: 'אפשר לזהות עולם לפי מה שמרגישים בו: כוח המשיכה קובע כמה גבוה קופצים, האטמוספרה קובעת אם יש אוויר ואם החום נשמר, והמרחק מהשמש והאוויר יחד קובעים כמה חם או קר. הירח, מאדים, נוגה וכספית שונים זה מזה בכל אחד מהדברים האלה.',
  skillHe: 'זיהוי עולמות (מבחן מסכם)',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    return {
      bodies: [
        ...STOPS.map((s) => sphereBody(s.body.id, s.key, s.body.center, s.body.radius, 30)),
        sphereBody('home', 'earth', HOME.center, HOME.radius, 14),
      ],
      boxes: PARTS.flatMap((p) => p.boxes),
      balls: [],
      zones: PARTS.flatMap((p) => p.zones),
      props: [],
      spawn: arrival(STOPS[0]),
      page: spot(HOME, 0, 32, 0.9),
      crumbs: [
        topOf(pillarBox(STOPS[0], 0), STOPS[0].body.center, 9.3),
        topOf(pillarBox(STOPS[2], 2), STOPS[2].body.center, 4.8),
        topOf(pillarBox(STOPS[3], 3), STOPS[3].body.center, 4.8),
      ],
      checkpoints: [],
      pads: PARTS.flatMap((p) => p.pads),
      switches: PARTS.flatMap((p) => p.switches),
      sunDir: norm(v3(0.15, 0.35, 1)),
      sky: [{ kind: 'galaxy', dir: norm(v3(-0.5, 0.6, -0.6)), sizeDeg: 12 }],
      paint: [
        { body: 'home', lat: -20, lon: 120, deg: 45, color: '#2f7fd8', kind: 'water' },
        { body: 'home', lat: 25, lon: -70, deg: 30, color: '#2f7fd8', kind: 'water' },
        { body: 'home', lat: 90, lon: 0, deg: 20, color: '#eef6ff', kind: 'ice' },
        { body: 'w3', lat: 85, lon: 0, deg: 14, color: '#f4ece4', kind: 'ice' },
      ],
      decor: [
        ...PARTS.flatMap((p) => p.decor),
        deco('tree', HOME, 10, 20, 1.6), deco('tree', HOME, -12, 45, 1.8), deco('bird', HOME, 5, 30, 0.7, 3),
        deco('cloud', HOME, 20, 0, 1.8, 4), decoAt('sign', spot(HOME, 8, 10, 0), 0.8, { label: 'הביתה' }),
      ],
    };
  },
  script: {
    tick(api) {
      if (api.flags.has('home') && !api.state.home) {
        api.state.home = true;
        api.revealName('המסע הגדול');
        api.say('זיהיתם את כל ארבעת העולמות לפי הקפיצה, החום, האוויר והקרקע. ברוכים השבים הביתה, לכדור הארץ!', 'good');
        api.objective('קחו את דף האטלס האחרון');
      }
      for (let i = 0; i < STOPS.length - 1; i++) {
        if (api.flags.has(`right${i + 1}`) && !api.state[`r${i}`]) {
          api.state[`r${i}`] = true;
          api.say(`נכון: זה היה ${NAME[STOPS[i].key]}! ממשיכים לעולם הבא.`, 'good');
        }
      }
    },
  },
  route: [
    ...stopRoute(STOPS[0], 0, 0),
    ...stopRoute(STOPS[1], 1),
    ...stopRoute(STOPS[2], 2, 1),
    ...stopRoute(STOPS[3], 3, 2),
    { to: 'page' },
  ],
  routeTimeout: 200,
};

/** Places, for tests. */
export const L18_STOPS = STOPS;
