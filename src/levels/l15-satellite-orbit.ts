import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type RouteStep, freeBox, topOf, prop } from '../core/level';
import type { Body, Box } from '../core/physics';
import { decoAt, deliver, sendHome } from './lib-b';

// Low orbit: satellites float above a big Earth. Magnet boots pull Nuri "down" toward the orbit plane (a flat
// field), so the satellites work as floating platforms. Anything that falls drops into the atmosphere and burns up.
// A wheel of space junk spins around the stepping platform between the GPS and the weather satellite: grab each
// piece (E) and throw it (E) down into the atmosphere, then carry the spare part to the weather satellite.

const UP = v3(0, 1, 0);
const EARTH_C = v3(15, -76, 0);
const EARTH_R = 50;

const sat = (id: string, x: number, y: number, z: number, w = 3, d = 3): Box[] => [
  freeBox(id, v3(x, y - 0.5, z), UP, w, 1, d, { tag: 'metal' }),
  freeBox(`${id}-pl`, v3(x - w / 2 - 1.5, y - 0.15, z), UP, 3, 0.3, 1.6, { tag: 'panel' }),
  freeBox(`${id}-pr`, v3(x + w / 2 + 1.5, y - 0.15, z), UP, 3, 0.3, 1.6, { tag: 'panel' }),
];

const MID = v3(23, 0.5, 0);
const wheel = (id: string, phase: number) =>
  prop(id, 'debris', v3(MID.x, MID.y + 0.45, MID.z + 1.4), 1, 0.4, { kind: 'orbit', center: v3(MID.x, MID.y + 0.45, MID.z), axis: UP, radius: 1.4, period: 6, phase });

export const L15: LevelDef = {
  n: 15,
  slug: 'satellite-orbit',
  titleHe: 'מסלול הלוויינים',
  worldNo: 4,
  worldId: 'orbit',
  introHe: [
    'אתם במסלול סביב כדור הארץ, בין לוויינים: לוויין תקשורת, לוויין ניווט (GPS) ולוויין מזג אוויר.',
    'לוויין מזג האוויר התקלקל, ובדרך אליו מסתובבת פסולת חלל. מגפי מגנט מחזיקים אתכם על הפלטפורמות. מה שנופל, נשרף באטמוספרה.',
  ],
  objectiveHe: 'נקו את פסולת החלל ותקנו את לוויין מזג האוויר',
  hintsHe: [
    'עמדו במרכז הפלטפורמה שבין הלוויינים. כשפסולת עוברת לידכם, תפסו אותה (E) וזרקו אותה (E) החוצה, אל האטמוספרה שמתחת.',
    'אחרי שהמסלול נקי, קחו את החלק החילוף מלוויין ה-GPS והביאו אותו ללוויין מזג האוויר.',
  ],
  atlasHe: 'לוויינים מקיפים את כדור הארץ: לווייני תקשורת מעבירים שידורים ושיחות, לווייני ניווט (GPS) עוזרים לדעת איפה אנחנו, ולווייני מזג אוויר מצלמים עננים וסופות. פסולת חלל, שרידים של לוויינים וטילים, נעה מהר מאוד ומסכנת אותם. חלקים שנופלים לאטמוספרה נשרפים בה.',
  extraHe: 'עוקבים אחרי יותר מ-27,000 פיסות פסולת חלל, והן נעות במהירות של כ-28,000 קמ"ש. אם הפסולת תתנגש ותתפרק לעוד ועוד חלקים, זה נקרא תסמונת קסלר.',
  skillHe: 'לוויינים ופסולת חלל',
  modules: ['grade-8/chapter-1/space-exploration'],
  build() {
    const comm = sat('comm', 0, 0.5, 0);
    const gps = sat('gps', 13, 2.0, 0);
    const weather = sat('weather', 33, 1.0, 0, 3.4, 3.4);
    const mast = freeBox('mast', v3(13, 2.75, -1.1), UP, 0.8, 1.5, 0.8, { tag: 'metal' });
    const mid = freeBox('mid', v3(MID.x, MID.y - 0.3, MID.z), UP, 3.6, 0.6, 3.6, { tag: 'metal' });
    const boxes = [...comm, ...gps, ...weather, mast, mid];
    const bodies: Body[] = [
      // the magnet-boot field: a flat pull toward the orbit plane far below (drawn as nothing)
      { id: 'field', kind: 'ring', world: 'orbit', center: v3(15, -30, 0), radius: 0, influence: 50, normal: UP, inner: 0, outer: 90 },
      // the Earth itself, far below, wrapped in the atmosphere that burns what falls
      { id: 'earth', kind: 'sphere', world: 'earth', center: EARTH_C, radius: EARTH_R, influence: 1 },
    ];
    const weatherTop = topOf(weather[0]);
    return {
      bodies,
      boxes,
      balls: [],
      zones: [
        { id: 'reentry', kind: 'kill', center: EARTH_C, radius: EARTH_R + 9, sayHe: 'נפלתם אל האטמוספרה! החיכוך עם האוויר מחמם כמו מטאור. חזרה ללוויין.' },
      ],
      props: [
        wheel('deb1', 0), wheel('deb2', 1 / 3), wheel('deb3', 2 / 3),
        prop('deb0', 'debris', v3(13, 6, 2.2), 1, 0.4, { kind: 'orbit', center: v3(13, 6, 0), axis: UP, radius: 2.2, period: 7, phase: 0.25 }),
        prop('part', 'part', topOf(gps[2], v3(), 0.4).pos, 1, 0.4),
      ],
      spawn: topOf(comm[0], v3(), 0.5),
      page: { ...topOf(weather[0], v3(), 0.9), when: 'fixed' },
      crumbs: [
        topOf(comm[0], v3(), 5.5),
        topOf(mast, v3(), 5.6),
        topOf(weather[2], v3(), 0.9),
      ],
      checkpoints: [topOf(gps[0], v3(), 0.45), topOf(mid, v3(), 0.45)],
      pads: [],
      switches: [
        deliver('fix', weatherTop, 'part', 'fixed', 'לוויין מזג האוויר חזר לפעול! הוא מצלם שוב את העננים והסופות מעל כדור הארץ.', 2.2),
      ],
      sunDir: norm(v3(0.5, 0.6, 0.6)),
      paint: [
        { body: 'earth', lat: 70, lon: 0, deg: 35, color: '#2f7fd8', kind: 'water' },
        { body: 'earth', lat: 45, lon: 120, deg: 30, color: '#2f7fd8', kind: 'water' },
        { body: 'earth', lat: 40, lon: -110, deg: 28, color: '#2f7fd8', kind: 'water' },
        { body: 'earth', lat: 90, lon: 0, deg: 12, color: '#f2f8ff', kind: 'ice' },
      ],
      decor: [
        decoAt('satellite', topOf(comm[0], v3(), -0.1), 1.6, { label: 'לוויין תקשורת' }),
        decoAt('satellite_gps', { pos: v3(13.8, 2.0, 0.8), up: UP }, 1.6, { label: 'לוויין ניווט (GPS)' }),
        decoAt('satellite', topOf(weather[0], v3(), -0.1), 1.8, { label: 'לוויין מזג אוויר', unless: 'fixed' }),
        decoAt('satellite', topOf(weather[0], v3(), -0.1), 1.8, { label: 'לוויין מזג אוויר ✓', when: 'fixed' }),
        decoAt('sign', topOf(mid, v3(), -0.45), 0.8, { label: 'פסולת חלל!' }),
        decoAt('debris', { pos: v3(40, -3, 6), up: norm(v3(0.3, 1, 0.2)) }, 1.2),
        decoAt('debris', { pos: v3(-6, 3, -7), up: norm(v3(-0.4, 1, 0.1)) }, 1),
        decoAt('comet', { pos: v3(60, 30, -60), up: UP }, 3),
      ],
    };
  },
  script: {
    event(api, ev) {
      if (ev.type === 'burn' && ev.id?.startsWith('deb')) {
        const n = ((api.state.burnt as number) ?? 0) + (ev.id === 'deb0' ? 0 : 1);
        api.state.burnt = n;
        api.emit('reentry', ev.at, ev.id);
        api.log('debris', 'burnt', ev.id);
        if (n >= 3 && !api.flags.has('lane')) {
          api.setFlag('lane');
          api.say('המסלול נקי! כל הפסולת נשרפה באטמוספרה. עכשיו הביאו את החלק ללוויין מזג האוויר.', 'good');
          api.objective('הביאו את החלק החילוף ללוויין מזג האוויר');
        } else {
          api.say(`פסולת החלל נפלה אל האטמוספרה ונשרפה! (${n}/3)`, 'good');
        }
      }
      if (ev.type === 'burn' && ev.id === 'part' && !api.flags.has('fixed')) {
        const part = api.props.find((p) => p.id === 'part');
        if (part) sendHome(part);
        api.say('אופס, החלק נפל ונשרף באטמוספרה. חלק חילוף חדש מחכה על לוויין ה-GPS.', 'oops');
      }
      if (ev.type === 'bump') {
        const last = (api.state.bumpT as number) ?? -9;
        if (api.t - last > 3) api.say('בום! פסולת חלל פגעה בכם. היא נעה מהר, ומגפי המגנט לא החזיקו.', 'oops');
        api.state.bumpT = api.t;
      }
      if (ev.type === 'switch' && ev.id === 'fix') {
        // the part is installed: it stays with the satellite
        const part = api.props.find((p) => p.id === 'part');
        if (part) part.alive = false;
        api.objective('קחו את דף האטלס מלוויין מזג האוויר');
      }
    },
  },
  route: [
    { to: 'crumb:0', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: 'top:comm-pr' },
    { to: 'top:gps-pl', jump: 'full', jumpAt: 6.8 },
    { to: 'top:gps' },
    { to: 'top:mast', jump: 'full', jumpAt: 1.4 },
    { to: 'crumb:1', jump: 'puff', jumpAt: 0.3, near: 0.5 },
    { to: 'top:gps-pr' },
    { to: 'top:mid', jump: 'full', jumpAt: 3.5, near: 0.3 },
    ...['deb1', 'deb2', 'deb3'].flatMap((id): RouteStep[] => [
      { to: v3(MID.x, MID.y + 0.4, MID.z), near: 0.2 },
      { to: id, action: true, near: 2.2 },
      { to: v3(MID.x, MID.y + 0.4, MID.z - 0.4), action: true, near: 0.2, wait: 0.6 },
    ]),
    { to: v3(MID.x, MID.y + 0.4, MID.z), near: 0.3, until: 'lane' },
    { to: 'top:gps-pr', jump: 'full', jumpAt: 6.2 },
    { to: 'part', action: true, near: 1.0 },
    { to: 'top:mid', jump: 'full', jumpAt: 6, near: 0.4 },
    { to: 'top:weather-pl', jump: 'full', jumpAt: 6.4 },
    { to: 'crumb:2', near: 0.5 },
    { to: 'top:weather', action: true, near: 0.6, until: 'fixed' },
    { to: 'page' },
  ],
  routeTimeout: 200,
};

/** Places, for tests. */
export const L15_PLACES = { MID };
