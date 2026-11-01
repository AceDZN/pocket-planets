import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, surf, plat, sphereBody, topOf } from '../core/level';

const M: BodyRef = { id: 'moon', center: v3(0, 0, 0), radius: 14 };

export const L01: LevelDef = {
  n: 1,
  slug: 'moon-jumps',
  titleHe: 'ירח הקפיצות',
  worldNo: 1,
  worldId: 'moon',
  introHe: [
    'אין לירח אוויר, ולכן השמיים שחורים גם כשהשמש זורחת.',
    'אותן רגליים, אותה קפיצה. נסו לקפוץ (רווח) ותראו כמה גבוה זה מגיע כאן.',
  ],
  objectiveHe: 'טפסו אל דף האטלס שעל שפת המכתש',
  hintsHe: [
    'לחצו רווח והחזיקו כדי לקפוץ הכי גבוה. בירח הכבידה חלשה, אז כל קפיצה ארוכה ואיטית.',
    'באוויר, לחיצה נוספת על רווח מפעילה נשיפת סילון אחת.',
  ],
  atlasHe: 'בירח כוח הכבידה חלש בהרבה מאשר בכדור הארץ, ולכן אותה קפיצה מגיעה לגובה רב יותר. אין לירח אטמוספרה ואין בו מים נוזליים, ולכן אין עליו חיים.',
  extraHe: 'כוח המשיכה על פני הירח הוא כשישית מזה של כדור הארץ, אז קפיצה מגיעה לגובה של פי 6 בערך.',
  skillHe: 'כבידה חלשה, אין אוויר',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    const ledge = plat('ledge', M, 0, 22, 4, 3.6, 6, 7);
    const rim = plat('rim', M, 2, 45, 9.5, 4.6, 11.5, 11);
    const step1 = plat('step1', M, -6, 9, 1, 2.4, 2.5, 2.4);
    const page = topOf(rim, M.center, 0.9);
    return {
      bodies: [sphereBody('moon', 'moon', M.center, M.radius, 40)],
      boxes: [ledge, rim, step1],
      balls: [],
      zones: [],
      props: [],
      spawn: surf(M.center, M.radius, 0, 0, 0.5),
      page,
      crumbs: [
        surf(M.center, M.radius, 0, 5, 4.5),
        topOf(ledge, M.center, 0.6),
        surf(M.center, M.radius, 1, 33, 12.5),
      ],
      checkpoints: [topOf(ledge, M.center, 0.1)],
      pads: [],
      switches: [],
      sunDir: norm(fromLatLon(25, 20)),
      // Earth hangs low behind the crater rim, in frame from the very first jump (visual target 01)
      sky: [{ kind: 'earth', dir: fromLatLon(14, 70), sizeDeg: 34 }],
      decor: [
        { model: 'crater', pos: surf(M.center, M.radius, -20, -25).pos, up: surf(M.center, M.radius, -20, -25).up, size: 5 },
        { model: 'crater', pos: surf(M.center, M.radius, 30, 70).pos, up: surf(M.center, M.radius, 30, 70).up, size: 7 },
        { model: 'crater', pos: surf(M.center, M.radius, -35, 120).pos, up: surf(M.center, M.radius, -35, 120).up, size: 4 },
        { model: 'rock', pos: surf(M.center, M.radius, -4, 12).pos, up: surf(M.center, M.radius, -4, 12).up, size: 0.6 },
        { model: 'rock', pos: surf(M.center, M.radius, 5, 15).pos, up: surf(M.center, M.radius, 5, 15).up, size: 0.45 },
        { model: 'rock', pos: surf(M.center, M.radius, -7, 30).pos, up: surf(M.center, M.radius, -7, 30).up, size: 0.8 },
        { model: 'rock', pos: surf(M.center, M.radius, 8, 38).pos, up: surf(M.center, M.radius, 8, 38).up, size: 0.5 },
        { model: 'rock', pos: surf(M.center, M.radius, -3, -6).pos, up: surf(M.center, M.radius, -3, -6).up, size: 0.4 },
        { model: 'rock', pos: surf(M.center, M.radius, 10, 26).pos, up: surf(M.center, M.radius, 10, 26).up, size: 0.7 },
        { model: 'rock', pos: surf(M.center, M.radius, -10, 52).pos, up: surf(M.center, M.radius, -10, 52).up, size: 0.9 },
        { model: 'rock', pos: surf(M.center, M.radius, 12, 58).pos, up: surf(M.center, M.radius, 12, 58).up, size: 0.6 },
        { model: 'flag', pos: surf(M.center, M.radius, 8, -8).pos, up: surf(M.center, M.radius, 8, -8).up, size: 1 },
      ],
    };
  },
  route: [
    { to: 'crumb:0', jump: 'full', jumpAt: 0.8 },
    { to: 'top:ledge', jump: 'full', jumpAt: 3.4 },
    { to: 'crumb:2', jump: 'puff', jumpAt: 3.2 },
    { to: 'top:rim', jump: 'full', jumpAt: 4 },
    { to: 'page' },
  ],
};
