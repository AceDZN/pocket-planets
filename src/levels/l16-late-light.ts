import { v3, norm, addScaled, type V3 } from '../core/vec';
import { type LevelDef, type RouteStep, freeBox, topOf } from '../core/level';
import type { Body, Box } from '../core/physics';
import { decoAt, pad } from './lib-b';

// Light takes time to travel. Three stars send their light along three bridges toward the observatory, and the light
// moves at a speed you can see: a tile exists only while light is passing over it. Warp out to a star and ride its
// light back. One star is already gone, yet its old light is still on the way. Which one?

const UP = v3(0, 1, 0);
const C = 3; // light speed on the bridges, units/s
const PERIOD = 6; // a new pulse leaves each star every PERIOD s
const LIT = 2.6; // how long a tile stays lit as the pulse passes
const PITCH = 3;
const HUB_HALF = 4.5;

interface Star { key: string; dir: V3; n: number; nameHe: string; distHe: string; dead?: boolean }
const STARS: Star[] = [
  { key: 'sun', dir: v3(0, 0, -1), n: 2, nameHe: 'השמש', distHe: '8 דקות אור' },
  { key: 'prox', dir: v3(1, 0, 0), n: 4, nameHe: 'פרוקסימה קנטאורי', distHe: 'יותר מ-4 שנות אור' },
  { key: 'andr', dir: v3(-1, 0, 0), n: 7, nameHe: 'כוכב בגלקסיית אנדרומדה', distHe: '2.5 מיליון שנות אור', dead: true },
];

const at = (d: V3, dist: number, y = 0): V3 => addScaled(v3(0, y, 0), d, dist);
/** Tile k (1 = beside the star) of a bridge with n tiles. */
const tileDist = (s: Star, k: number) => HUB_HALF + 0.3 + 1.35 + (s.n - k) * PITCH;
const starDist = (s: Star) => HUB_HALF + 0.3 + s.n * PITCH + 1.8;
const tileId = (s: Star, k: number) => `${s.key}${k}`;

function bridge(s: Star): Box[] {
  const out: Box[] = [];
  const side = s.dir.x !== 0;
  for (let k = 1; k <= s.n; k++) {
    out.push(freeBox(tileId(s, k), at(s.dir, tileDist(s, k), 0.2), UP, side ? 2.7 : 2.0, 0.6, side ? 2.0 : 2.7, { tag: 'star', when: `lit-${tileId(s, k)}` }));
  }
  out.push(freeBox(`${s.key}-star`, at(s.dir, starDist(s), 0), UP, 3.6, 1, 3.6, { tag: s.dead ? 'crystal' : 'star' }));
  return out;
}

const starTop = (s: Star, lift = 0.45) => ({ pos: at(s.dir, starDist(s), 0.5 + lift), up: UP });
const hubSpot = (x: number, z: number, lift = 0.45) => ({ pos: v3(x, 0.5 + lift, z), up: UP });

/** Route: warp out, then ride the light home tile by tile. */
function rideHome(s: Star): RouteStep[] {
  const steps: RouteStep[] = [
    { to: at(s.dir, starDist(s) - 1.4, 0.95), near: 0.3, until: `lit-${tileId(s, 1)}` },
  ];
  for (let k = 1; k <= s.n; k++) {
    const next = k < s.n ? `lit-${tileId(s, k + 1)}` : undefined;
    steps.push({ to: `top:${tileId(s, k)}`, near: 0.6, until: next });
  }
  steps.push({ to: at(s.dir, HUB_HALF - 1.2, 0.95), near: 0.5 });
  return steps;
}

export const L16: LevelDef = {
  n: 16,
  slug: 'late-light',
  titleHe: 'אור שהגיע באיחור',
  worldNo: 4,
  worldId: 'deep',
  introHe: [
    'אור נע מהר מאוד, אבל גם לו לוקח זמן להגיע. כאן אפשר לראות אותו נוסע לאורך הגשרים.',
    'אחד משלושת הכוכבים כבר כבה, ובכל זאת עדיין רואים אותו מאיר. גלו איזה.',
  ],
  objectiveHe: 'גלו איזה כוכב כבר כבה, אבל האור שלו עוד מגיע',
  hintsHe: [
    'משטחי השיגור בתצפית מטיסים אתכם אל כל כוכב. משם, רכבו על האור חזרה: הלבנים קיימות רק כשהאור עובר עליהן.',
    'אור השמש מגיע אלינו אחרי 8 דקות. אם השמש הייתה כבה, היינו יודעים כמעט מיד. מה לגבי כוכב שהאור שלו נוסע מיליוני שנים?',
  ],
  atlasHe: 'שנת אור היא המרחק שהאור עובר בשנה אחת, כ-9,460 מיליארד ק"מ. אור השמש מגיע אלינו אחרי 8 דקות, מפרוקסימה קנטאורי אחרי יותר מ-4 שנים, ומגלקסיית אנדרומדה אחרי כ-2.5 מיליון שנה. לכן כשאנחנו מסתכלים על כוכב רחוק, אנחנו רואים אור ישן, וייתכן שהכוכב עצמו כבר לא קיים.',
  skillHe: 'שנת אור: לראות את העבר',
  modules: ['grade-8/chapter-1/universe-structure'],
  build() {
    const hub = freeBox('hub', v3(0, 0, 0), UP, HUB_HALF * 2, 1, HUB_HALF * 2, { tag: 'metal' });
    const boxes: Box[] = [hub, ...STARS.flatMap(bridge)];
    const bodies: Body[] = [
      { id: 'field', kind: 'ring', world: 'deep', center: v3(0, -30, 0), radius: 0, influence: 50, normal: UP, inner: 0, outer: 90 },
    ];
    const warp = (s: Star, x: number) => pad(`go-${s.key}`, hubSpot(x, -2.8), `אל ${s.nameHe}`, 'warp', { to: starTop(s) });
    const answer = (s: Star, x: number) => s.dead
      ? pad(`ans-${s.key}`, hubSpot(x, 2.8), `${s.nameHe} כבה`, 'warp', { to: hubSpot(0, 0.2), sets: 'answered', answer: s.key })
      : pad(`ans-${s.key}`, hubSpot(x, 2.8), `${s.nameHe} כבה`, 'wrong', {
        back: hubSpot(-3, 0), answer: s.key,
        explainHe: s.key === 'sun'
          ? 'השמש? האור שלה מגיע אלינו אחרי 8 דקות בלבד. אילו כבתה, היינו רואים את זה כמעט מיד. והנה היא זורחת!'
          : 'פרוקסימה? האור שלה בדרך קצת יותר מ-4 שנים. אילו כבתה מזמן, כבר היינו רואים. טוסו אליה ותראו שהיא עוד שם.',
      });
    return {
      bodies,
      boxes,
      balls: [],
      zones: [
        { id: 'void', kind: 'kill', center: v3(0, -60, 0), radius: 48, sayHe: 'נפלתם אל החושך שבין הכוכבים. בלי אור אין לבנים! חזרה לנקודת הביקורת.' },
      ],
      props: [],
      spawn: hubSpot(-3, 0, 0.5),
      page: { ...hubSpot(0, 0.2, 0.9), when: 'answered' },
      crumbs: [
        hubSpot(0, -0.8, 6.2),
        { pos: at(STARS[1].dir, tileDist(STARS[1], 2), 0.5 + 1.75), up: UP },
        { pos: at(STARS[2].dir, tileDist(STARS[2], 4), 0.5 + 1.75), up: UP },
      ],
      checkpoints: [],
      pads: [
        warp(STARS[0], 0), warp(STARS[1], 2.8), warp(STARS[2], -2.8),
        answer(STARS[0], 0), answer(STARS[1], 2.8), answer(STARS[2], -2.8),
        ...STARS.map((s) => pad(`back-${s.key}`, { pos: addScaled(starTop(s).pos, s.dir, 1.1), up: UP }, 'חזרה לתצפית', 'warp', { to: hubSpot(-3, 0) })),
      ],
      switches: [],
      sunDir: norm(v3(0.3, 0.8, 0.5)),
      sky: [
        { kind: 'galaxy', dir: norm(v3(-1, 0.35, 0.2)), sizeDeg: 14 },
        { kind: 'cluster', dir: norm(v3(0.6, 0.5, -0.8)), sizeDeg: 9 },
      ],
      decor: [
        decoAt('star_beacon', starTop(STARS[0], 0), 2.4, { label: `${STARS[0].nameHe} · ${STARS[0].distHe}` }),
        decoAt('star_beacon', starTop(STARS[1], 0), 1.6, { label: `${STARS[1].nameHe} · ${STARS[1].distHe}` }),
        decoAt('rock', starTop(STARS[2], 0), 1.0, { label: `${STARS[2].nameHe} · ${STARS[2].distHe}` }),
        decoAt('cloud', { pos: at(STARS[2].dir, starDist(STARS[2]) + 0.5, 2.2), up: UP }, 2.4),
        decoAt('sign', hubSpot(-3.6, 3.8, 0), 0.9, { label: 'איזה כוכב כבה?' }),
        decoAt('sign', hubSpot(3.6, -3.8, 0), 0.9, { label: 'טיסה אל הכוכבים' }),
        decoAt('satellite', hubSpot(3.4, 0, 0), 1.4, { label: 'טלסקופ' }),
      ],
    };
  },
  script: {
    tick(api) {
      for (const s of STARS) {
        for (let k = 1; k <= s.n; k++) {
          const ph = (((api.t - ((k - 1) * PITCH) / C) % PERIOD) + PERIOD) % PERIOD;
          const f = `lit-${tileId(s, k)}`;
          if (ph < LIT) { if (!api.flags.has(f)) api.setFlag(f); } else if (api.flags.has(f)) api.clearFlag(f);
        }
      }
      const dead = STARS[2];
      const p = api.player.pos;
      const top = starTop(dead).pos;
      if (!api.state.sawDead && Math.hypot(p.x - top.x, p.y - top.y, p.z - top.z) < 2.5) {
        api.state.sawDead = true;
        api.log('visit', 'dead-star');
        api.say('כאן היה כוכב… והוא כבר כבה. ובכל זאת האור שיצא ממנו מזמן עדיין נוסע אל התצפית!', 'info');
      }
      if (api.flags.has('answered') && !api.state.answered) {
        api.state.answered = true;
        api.say('נכון! האור מהכוכב באנדרומדה נוסע אלינו כ-2.5 מיליון שנה. מה שאנחנו רואים הוא אור ישן מאוד, והכוכב עצמו כבר כבה.', 'good');
      }
    },
  },
  route: [
    { to: 'crumb:0', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: 'go-prox' },
    { to: 'go-prox', near: 1e9, wait: 1.3 },
    ...rideHome(STARS[1]).map((s, i) => (i === 2 ? { ...s, jump: 'tap' as const, jumpAt: 0.4 } : s)),
    { to: 'go-andr' },
    { to: 'go-andr', near: 1e9, wait: 1.3 },
    ...rideHome(STARS[2]).map((s, i) => (i === 4 ? { ...s, jump: 'tap' as const, jumpAt: 0.4 } : s)),
    { to: 'ans-andr' },
    { to: 'ans-andr', near: 1e9, wait: 1.3 },
    { to: 'page' },
  ],
  routeTimeout: 200,
};
