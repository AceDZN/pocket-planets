// STUB — to be replaced by the real level.
import { v3, fromLatLon, norm } from '../core/vec';
import { type LevelDef, type BodyRef, surf, sphereBody } from '../core/level';

const B: BodyRef = { id: 'main', center: v3(0, 0, 0), radius: 12 };

export const L13: LevelDef = {
  n: 13,
  slug: 'cold-and-far',
  titleHe: 'הקרים והרחוקים',
  worldNo: 3,
  worldId: 'triton',
  introHe: ['(בבנייה)'],
  objectiveHe: 'הגיעו אל דף האטלס',
  hintsHe: ['רוצו אל הדף.'],
  atlasHe: '(בבנייה)',
  skillHe: '(בבנייה)',
  modules: ['grade-8/chapter-1/solar-system'],
  build() {
    return {
      bodies: [sphereBody('main', 'triton', B.center, B.radius, 30)],
      boxes: [], balls: [], zones: [], props: [],
      spawn: surf(B.center, B.radius, 0, 0, 0.5),
      page: surf(B.center, B.radius, 0, 25, 0.9),
      crumbs: [surf(B.center, B.radius, 0, 8, 0.9), surf(B.center, B.radius, 0, 14, 0.9), surf(B.center, B.radius, 0, 20, 0.9)],
      checkpoints: [], pads: [], switches: [],
      sunDir: norm(fromLatLon(20, 10)),
      decor: [],
    };
  },
  route: [{ to: 'crumb:0' }, { to: 'crumb:1' }, { to: 'crumb:2' }, { to: 'page' }],
};
