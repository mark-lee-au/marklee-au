export const ASCEND_CONFIG = {
  saveVersion: 4,
  saveKey: 'marklee-au:ascend:genesis:v1',
  baseClickPower: 1,
  mutationEnergy: 10,
  adaptedEnergy: 30,
  specialisationEnergy: 60,
  complexEnergy: 120,
  mutationRevealDelayMs: 760,
  saveThrottleMs: 250,
  maxRuntimeDeltaSeconds: 0.25,
  passiveRenderIntervalSeconds: 0.1,
  maxPrototypeResetEnergy: 1_000_000,
  adaptations: {
    membrane: {
      name: 'Reinforced Membrane',
      effect: '+1 Energy per manual tap',
      clickPower: 2,
      passiveEnergyPerSecond: 0,
      replicationEvery: 0,
      replicationBonus: 0,
    },
    mitochondria: {
      name: 'Mitochondria',
      effect: '+0.25 Energy per second',
      clickPower: 1,
      passiveEnergyPerSecond: 0.25,
      replicationEvery: 0,
      replicationBonus: 0,
    },
    replication: {
      name: 'Replication',
      effect: '+5 Energy every 10th manual tap',
      clickPower: 1,
      passiveEnergyPerSecond: 0,
      replicationEvery: 10,
      replicationBonus: 5,
    },
  },
  specialisations: {
    contractile: {
      name: 'Contractile Tail',
      effect: '+2 Energy per manual tap',
      clickPowerBonus: 2,
      passiveEnergyBonus: 0,
      burstEvery: 0,
      burstBonus: 0,
    },
    photosynthesis: {
      name: 'Photosynthetic Folds',
      effect: '+0.5 Energy per second',
      clickPowerBonus: 0,
      passiveEnergyBonus: 0.5,
      burstEvery: 0,
      burstBonus: 0,
    },
    sensory: {
      name: 'Sensory Cilia',
      effect: '+8 Energy every 8th manual tap',
      clickPowerBonus: 0,
      passiveEnergyBonus: 0,
      burstEvery: 8,
      burstBonus: 8,
    },
  },
} as const;

export type AdaptationId = keyof typeof ASCEND_CONFIG.adaptations;
export type SpecialisationId = keyof typeof ASCEND_CONFIG.specialisations;
export type OrganismStage = 'void' | 'primordial' | 'adapted' | 'complex';
