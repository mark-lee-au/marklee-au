export const PHENOTYPE_PALETTES = [
  { primary: '#dfe7dc', secondary: '#b9dc91', muted: '#667461', glow: 'rgba(185, 220, 145, .38)' },
  { primary: '#d5e7e6', secondary: '#83d4cb', muted: '#5f7775', glow: 'rgba(131, 212, 203, .38)' },
  { primary: '#eee1c3', secondary: '#e2b96d', muted: '#796b52', glow: 'rgba(226, 185, 109, .36)' },
  { primary: '#e2d8ed', secondary: '#b69bd4', muted: '#6f6478', glow: 'rgba(182, 155, 212, .36)' },
  { primary: '#ead7d2', secondary: '#d99182', muted: '#79635e', glow: 'rgba(217, 145, 130, .34)' },
  { primary: '#dbe6c8', secondary: '#9fc77b', muted: '#647158', glow: 'rgba(159, 199, 123, .36)' },
] as const;

export const MEMBRANE_VARIANTS = ['angular', 'lobed', 'asymmetric', 'diamond'] as const;
export const NUCLEUS_VARIANTS = ['central', 'offset', 'divided'] as const;
export const INTERIOR_VARIANTS = ['sparse', 'banded', 'clustered'] as const;
export const APPENDAGE_VARIANTS = ['none', 'flagellum', 'cilia', 'spines'] as const;
export const COMPLEX_MUTATIONS = ['buds', 'ridges', 'nodes'] as const;

export interface VisualPhenotype {
  palette: number;
  membrane: typeof MEMBRANE_VARIANTS[number];
  nucleus: typeof NUCLEUS_VARIANTS[number];
  interior: typeof INTERIOR_VARIANTS[number];
  appendage: typeof APPENDAGE_VARIANTS[number];
  rotation: number;
  mirror: boolean;
}

export interface RunPhenotypes {
  primordial: VisualPhenotype;
  adapted: VisualPhenotype;
  complexMutation: typeof COMPLEX_MUTATIONS[number];
}

const mulberry32 = (seed: number) => () => {
  let value = seed += 0x6D2B79F5;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

const pickIndex = (random: () => number, length: number) => Math.floor(random() * length);

const differentIndex = (random: () => number, length: number, previous: number) =>
  (previous + 1 + pickIndex(random, length - 1)) % length;

export function createVisualSeed(): number {
  const values = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(values)[0];
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

export function createRunPhenotypes(seed: number): RunPhenotypes {
  const random = mulberry32(seed >>> 0);
  const primordialPalette = pickIndex(random, PHENOTYPE_PALETTES.length);
  const primordialMembrane = pickIndex(random, MEMBRANE_VARIANTS.length);
  const primordialNucleus = pickIndex(random, NUCLEUS_VARIANTS.length);
  const primordialInterior = pickIndex(random, INTERIOR_VARIANTS.length);
  const primordialAppendage = pickIndex(random, APPENDAGE_VARIANTS.length);

  const primordial: VisualPhenotype = {
    palette: primordialPalette,
    membrane: MEMBRANE_VARIANTS[primordialMembrane],
    nucleus: NUCLEUS_VARIANTS[primordialNucleus],
    interior: INTERIOR_VARIANTS[primordialInterior],
    appendage: APPENDAGE_VARIANTS[primordialAppendage],
    rotation: pickIndex(random, 4) * 90,
    mirror: random() >= .5,
  };

  const adapted: VisualPhenotype = { ...primordial };
  if (primordial.appendage === 'none') {
    adapted.appendage = APPENDAGE_VARIANTS[1 + pickIndex(random, APPENDAGE_VARIANTS.length - 1)];
  } else if (random() < .5) {
    adapted.interior = INTERIOR_VARIANTS[
      differentIndex(random, INTERIOR_VARIANTS.length, primordialInterior)
    ];
  } else {
    adapted.nucleus = NUCLEUS_VARIANTS[
      differentIndex(random, NUCLEUS_VARIANTS.length, primordialNucleus)
    ];
  }

  const complexMutation = COMPLEX_MUTATIONS[pickIndex(random, COMPLEX_MUTATIONS.length)];

  return { primordial, adapted, complexMutation };
}
