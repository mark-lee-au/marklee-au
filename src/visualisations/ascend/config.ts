export const ASCEND_CONFIG = {
  saveVersion: 1,
  saveKey: 'marklee-au:ascend:genesis:v1',
  baseClickPower: 1,
  mutationEnergy: 10,
  adaptedEnergy: 30,
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
} as const;

export type AdaptationId = keyof typeof ASCEND_CONFIG.adaptations;
export type OrganismStage = 'void' | 'primordial' | 'adapted';
