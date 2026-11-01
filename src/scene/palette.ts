// Per-world look: ground colors, sky, fog and light. Purely visual; the physics never reads this.

export interface Look {
  ground: string;
  ground2: string;
  rock: string;
  rockTop: string;
  sky: string;
  skyHorizon: string;
  haze: number;
  stars: number;
  ambient: string;
  rim: string;
  ice?: boolean;
  /** Paint day and night sides differently (airless rocky worlds next to the Sun). */
  dayNight?: { day: string; night: string };
}

export const LOOKS: Record<string, Look> = {
  moon: { ground: '#a4a4ab', ground2: '#7c7c86', rock: '#8e8e96', rockTop: '#b9b9c0', sky: '#000004', skyHorizon: '#05060c', haze: 0, stars: 1, ambient: '#39405a', rim: '#9fc4ff' },
  mercury: { ground: '#8d7d6e', ground2: '#5f544c', rock: '#7a6a5c', rockTop: '#a39182', sky: '#000003', skyHorizon: '#0a0604', haze: 0, stars: 1, ambient: '#3a3440', rim: '#ffb070',
    dayNight: { day: '#ff8a3a', night: '#9cc8ff' } },
  venus: { ground: '#c47a35', ground2: '#8c4a20', rock: '#9a5526', rockTop: '#d08a45', sky: '#d9862e', skyHorizon: '#f2b766', haze: 0.05, stars: 0, ambient: '#7a4a2a', rim: '#ffd08a' },
  earth: { ground: '#5daa4a', ground2: '#3f7f38', rock: '#8a7a68', rockTop: '#6fb85a', sky: '#5aa8ff', skyHorizon: '#cfe9ff', haze: 0.008, stars: 0.15, ambient: '#5a7aa0', rim: '#ffffff' },
  mars: { ground: '#c4562a', ground2: '#8f3a1c', rock: '#9a4422', rockTop: '#d47a48', sky: '#c98a6a', skyHorizon: '#f0c09a', haze: 0.012, stars: 0.25, ambient: '#6a4038', rim: '#ffc9a0' },
  asteroid: { ground: '#7a7068', ground2: '#544c46', rock: '#6a625a', rockTop: '#8c8278', sky: '#000003', skyHorizon: '#040408', haze: 0, stars: 1, ambient: '#363a4a', rim: '#c0d0ff' },
  io: { ground: '#e0c64a', ground2: '#c97a2a', rock: '#b8902c', rockTop: '#f0dc70', sky: '#030202', skyHorizon: '#0a0805', haze: 0, stars: 1, ambient: '#40384a', rim: '#ffe6a0' },
  europa: { ground: '#ece4d4', ground2: '#b98a62', rock: '#d8cdb8', rockTop: '#fbf6ea', sky: '#020206', skyHorizon: '#070912', haze: 0, stars: 1, ambient: '#404a66', rim: '#c8e2ff', ice: true },
  ganymede: { ground: '#9a8c7a', ground2: '#6e6358', rock: '#857868', rockTop: '#b8ab98', sky: '#020206', skyHorizon: '#070912', haze: 0, stars: 1, ambient: '#404a66', rim: '#c8e2ff' },
  jupiter: { ground: '#d9b48a', ground2: '#a8653a', rock: '#c09070', rockTop: '#e8d0b0', sky: '#020206', skyHorizon: '#140c08', haze: 0, stars: 1, ambient: '#4a4050', rim: '#ffd8a8' },
  ring: { ground: '#dfe8f2', ground2: '#a9b6c8', rock: '#c4d0de', rockTop: '#f4f8ff', sky: '#020206', skyHorizon: '#0a0a14', haze: 0, stars: 1, ambient: '#3e4a66', rim: '#e8f0ff', ice: true },
  enceladus: { ground: '#f4f8ff', ground2: '#c6d6ea', rock: '#dde8f6', rockTop: '#ffffff', sky: '#020206', skyHorizon: '#0a0a14', haze: 0, stars: 1, ambient: '#3e4a66', rim: '#e8f0ff', ice: true },
  saturn: { ground: '#e6cf9a', ground2: '#b89a62', rock: '#d0b888', rockTop: '#f2e2b8', sky: '#020206', skyHorizon: '#0a0a14', haze: 0, stars: 1, ambient: '#3e4a66', rim: '#ffe8b8' },
  miranda: { ground: '#9aa6ae', ground2: '#6a7680', rock: '#86929a', rockTop: '#b8c4cc', sky: '#010306', skyHorizon: '#04121a', haze: 0, stars: 1, ambient: '#2a3a50', rim: '#8ae8f0' },
  uranus: { ground: '#9ae0e6', ground2: '#6ab8c4', rock: '#86929a', rockTop: '#b8c4cc', sky: '#010306', skyHorizon: '#04121a', haze: 0, stars: 1, ambient: '#2a3a50', rim: '#8ae8f0' },
  triton: { ground: '#d8b8b2', ground2: '#9e8a8a', rock: '#b8a0a0', rockTop: '#ecd6d0', sky: '#01020a', skyHorizon: '#03081e', haze: 0, stars: 1, ambient: '#2a3050', rim: '#8aa8ff', ice: true },
  neptune: { ground: '#3a6ad8', ground2: '#2a4aa8', rock: '#b8a0a0', rockTop: '#ecd6d0', sky: '#01020a', skyHorizon: '#03081e', haze: 0, stars: 1, ambient: '#2a3050', rim: '#8aa8ff' },
  orbit: { ground: '#c8ccd6', ground2: '#8e95a4', rock: '#aab2c0', rockTop: '#e2e8f2', sky: '#000004', skyHorizon: '#04060e', haze: 0, stars: 1, ambient: '#3a4258', rim: '#bfe0ff' },
  deep: { ground: '#6a4ad8', ground2: '#3a2a8a', rock: '#7a5ae8', rockTop: '#b8a0ff', sky: '#03010a', skyHorizon: '#0c0420', haze: 0, stars: 1.6, ambient: '#3a2a6a', rim: '#d0b0ff' },
};

export const lookFor = (world: string): Look => LOOKS[world] ?? LOOKS.moon;
