// World profiles: the authoritative numbers behind each world's physics and sky.
// Rounded from the NASA Planetary Fact Sheets (see CURRICULUM.md). Values that are
// not in the Workbook modules drive the physics but show as העשרה in the atlas.

export type Air = 'none' | 'thin' | 'normal' | 'thick';
export type Kind = 'rocky' | 'moon' | 'gas' | 'small' | 'artificial' | 'cosmic';

export interface WorldProfile {
  id: string;
  he: string;
  kind: Kind;
  /** Surface gravity relative to Earth (real, rounded). */
  g: number;
  /** Distance from the Sun in AU (for moons, the parent planet's). */
  au: number;
  air: Air;
  /** Day-side / night-side surface temperature, °C. Equal values mean the air spreads the heat. */
  dayC: number;
  nightC: number;
  /** Has a solid surface you can stand on. */
  surface: boolean;
  /** Earth's four spheres present (Workbook: אטמוספרה, הידרוספרה, גאוספרה, ביוספרה). */
  spheres: { atmo: boolean; hydro: boolean; geo: boolean; bio: boolean };
  /** One year in Earth days (orbit around the Sun), for the atlas. */
  yearDays?: number;
  sky: string;
}

export const WORLDS: Record<string, WorldProfile> = {
  moon: { id: 'moon', he: 'הירח', kind: 'moon', g: 0.17, au: 1, air: 'none', dayC: 120, nightC: -170, surface: true,
    spheres: { atmo: false, hydro: false, geo: true, bio: false }, sky: 'black' },
  mercury: { id: 'mercury', he: 'כספית', kind: 'rocky', g: 0.38, au: 0.39, air: 'none', dayC: 430, nightC: -180, surface: true,
    spheres: { atmo: false, hydro: false, geo: true, bio: false }, yearDays: 88, sky: 'black' },
  venus: { id: 'venus', he: 'נוגה', kind: 'rocky', g: 0.91, au: 0.72, air: 'thick', dayC: 465, nightC: 465, surface: true,
    spheres: { atmo: true, hydro: false, geo: true, bio: false }, yearDays: 225, sky: 'orange' },
  earth: { id: 'earth', he: 'כדור הארץ', kind: 'rocky', g: 1, au: 1, air: 'normal', dayC: 25, nightC: 10, surface: true,
    spheres: { atmo: true, hydro: true, geo: true, bio: true }, yearDays: 365, sky: 'blue' },
  mars: { id: 'mars', he: 'מאדים', kind: 'rocky', g: 0.38, au: 1.52, air: 'thin', dayC: 20, nightC: -100, surface: true,
    spheres: { atmo: true, hydro: false, geo: true, bio: false }, yearDays: 687, sky: 'pink' },
  asteroid: { id: 'asteroid', he: 'אסטרואיד', kind: 'small', g: 0.03, au: 2.8, air: 'none', dayC: -40, nightC: -110, surface: true,
    spheres: { atmo: false, hydro: false, geo: true, bio: false }, sky: 'black' },
  jupiter: { id: 'jupiter', he: 'צדק', kind: 'gas', g: 2.53, au: 5.2, air: 'thick', dayC: -110, nightC: -110, surface: false,
    spheres: { atmo: true, hydro: false, geo: false, bio: false }, yearDays: 4333, sky: 'bands' },
  io: { id: 'io', he: 'איו', kind: 'moon', g: 0.18, au: 5.2, air: 'none', dayC: -130, nightC: -160, surface: true,
    spheres: { atmo: false, hydro: false, geo: true, bio: false }, sky: 'black' },
  europa: { id: 'europa', he: 'אירופה', kind: 'moon', g: 0.13, au: 5.2, air: 'none', dayC: -150, nightC: -190, surface: true,
    spheres: { atmo: false, hydro: true, geo: true, bio: false }, sky: 'black' },
  ganymede: { id: 'ganymede', he: 'גנימד', kind: 'moon', g: 0.15, au: 5.2, air: 'none', dayC: -120, nightC: -190, surface: true,
    spheres: { atmo: false, hydro: false, geo: true, bio: false }, sky: 'black' },
  saturn: { id: 'saturn', he: 'שבתאי', kind: 'gas', g: 1.07, au: 9.5, air: 'thick', dayC: -140, nightC: -140, surface: false,
    spheres: { atmo: true, hydro: false, geo: false, bio: false }, yearDays: 10759, sky: 'rings' },
  ring: { id: 'ring', he: 'טבעות שבתאי', kind: 'small', g: 0.01, au: 9.5, air: 'none', dayC: -180, nightC: -200, surface: true,
    spheres: { atmo: false, hydro: false, geo: true, bio: false }, sky: 'rings' },
  enceladus: { id: 'enceladus', he: 'אנצ׳לדוס', kind: 'moon', g: 0.011, au: 9.5, air: 'none', dayC: -200, nightC: -220, surface: true,
    spheres: { atmo: false, hydro: true, geo: true, bio: false }, sky: 'rings' },
  uranus: { id: 'uranus', he: 'אורנוס', kind: 'gas', g: 0.9, au: 19.2, air: 'thick', dayC: -195, nightC: -195, surface: false,
    spheres: { atmo: true, hydro: false, geo: false, bio: false }, yearDays: 30687, sky: 'teal' },
  miranda: { id: 'miranda', he: 'מירנדה', kind: 'moon', g: 0.008, au: 19.2, air: 'none', dayC: -190, nightC: -210, surface: true,
    spheres: { atmo: false, hydro: false, geo: true, bio: false }, sky: 'teal' },
  neptune: { id: 'neptune', he: 'נפטון', kind: 'gas', g: 1.14, au: 30, air: 'thick', dayC: -200, nightC: -200, surface: false,
    spheres: { atmo: true, hydro: false, geo: false, bio: false }, yearDays: 60190, sky: 'blue-deep' },
  triton: { id: 'triton', he: 'טריטון', kind: 'moon', g: 0.08, au: 30, air: 'thin', dayC: -235, nightC: -235, surface: true,
    spheres: { atmo: false, hydro: false, geo: true, bio: false }, sky: 'blue-deep' },
  orbit: { id: 'orbit', he: 'מסלול סביב כדור הארץ', kind: 'artificial', g: 0.3, au: 1, air: 'none', dayC: 20, nightC: 20, surface: true,
    spheres: { atmo: false, hydro: false, geo: false, bio: false }, sky: 'black' },
  deep: { id: 'deep', he: 'החלל העמוק', kind: 'cosmic', g: 0.3, au: 1, air: 'none', dayC: 20, nightC: 20, surface: true,
    spheres: { atmo: false, hydro: false, geo: false, bio: false }, sky: 'galaxy' },
};

// ---- Game scaling (one set of legs for every world) ----

/** Game Earth gravity in units/s² (1 unit ≈ 1 m; the game clock runs a little fast for snappy jumps). */
export const G_EARTH = 22;
/** Max jump apex on Earth, in units (Nuri is about 1 unit tall). */
export const JUMP_EARTH = 1.25;
/** Take-off speed: the same on every world, so apex ∝ 1/g. */
export const JUMP_SPEED = Math.sqrt(2 * G_EARTH * JUMP_EARTH);
/** Bodies weaker than this use this floor so a hop doesn't leave forever; the atlas says the real pull is weaker. */
export const G_FLOOR = 0.08;
/** Magnet boots on artificial and cosmic platforms (not gravity: the gauge says so). */
export const BOOTS_G = 0.3;

export function gameGravityFactor(w: WorldProfile): number {
  if (w.kind === 'artificial' || w.kind === 'cosmic') return BOOTS_G;
  return Math.max(w.g, G_FLOOR);
}
export const isFloored = (w: WorldProfile): boolean => (w.kind === 'small' || w.kind === 'moon') && w.g < G_FLOOR;

/** Apex of a full jump in units, ignoring air (thin/no air) — exactly JUMP_EARTH / g. */
export const jumpApex = (gFactor: number): number => (JUMP_SPEED * JUMP_SPEED) / (2 * G_EARTH * gFactor);
/** Total air time of a full jump on flat ground, seconds. */
export const airTime = (gFactor: number): number => (2 * JUMP_SPEED) / (G_EARTH * gFactor);

/** Terminal fall speed by air (units/s): thick air slows your fall; no air never does. */
export const TERMINAL: Record<Air, number> = { none: Infinity, thin: 40, normal: 16, thick: 4.5 };
/** Horizontal air damping per second. */
export const AIR_DRAG: Record<Air, number> = { none: 0, thin: 0.05, normal: 0.25, thick: 1.4 };

/** The Sun's apparent angular radius, degrees, honest 1/AU scaling from a readable 1 AU size. */
export const SUN_RADIUS_1AU_DEG = 5;
export const sunAngularRadiusDeg = (au: number): number => SUN_RADIUS_1AU_DEG / au;
/** Stylized sunlight intensity: real light falls as 1/AU², the renderer compresses it so the outer worlds stay playable. */
export const sunLight = (au: number): number => Math.min(1.6, Math.max(0.12, 1 / Math.pow(au, 0.7)));
