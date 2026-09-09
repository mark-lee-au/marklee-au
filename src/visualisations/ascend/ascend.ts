import { ASCEND_CONFIG, type AdaptationId, type OrganismStage } from './config';

interface AscendState {
  energy: number;
  lifetimeEnergy: number;
  manualTapCount: number;
  clickPower: number;
  passiveEnergyPerSecond: number;
  selectedAdaptation: AdaptationId | null;
  organismStage: OrganismStage;
  milestones: {
    mutation: boolean;
    adapted: boolean;
  };
  lastUpdateTime: number;
}

interface AscendSave {
  version: number;
  savedAt: number;
  state: Omit<AscendState, 'lastUpdateTime'>;
}

const isAdaptationId = (value: unknown): value is AdaptationId =>
  typeof value === 'string' && value in ASCEND_CONFIG.adaptations;

const finiteNonNegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

function initialState(): AscendState {
  return {
    energy: 0,
    lifetimeEnergy: 0,
    manualTapCount: 0,
    clickPower: ASCEND_CONFIG.baseClickPower,
    passiveEnergyPerSecond: 0,
    selectedAdaptation: null,
    organismStage: 'void',
    milestones: { mutation: false, adapted: false },
    lastUpdateTime: performance.now(),
  };
}

function loadState(): AscendState {
  const fallback = initialState();

  try {
    const raw = localStorage.getItem(ASCEND_CONFIG.saveKey);
    if (!raw) return fallback;

    const save = JSON.parse(raw) as Partial<AscendSave>;
    const stored = save.state as Partial<AscendState> | undefined;
    if (save.version !== ASCEND_CONFIG.saveVersion || !stored) return fallback;
    if (!finiteNonNegative(stored.energy) || !finiteNonNegative(stored.lifetimeEnergy)) return fallback;
    if (!Number.isInteger(stored.manualTapCount) || (stored.manualTapCount ?? -1) < 0) return fallback;

    const selectedAdaptation = isAdaptationId(stored.selectedAdaptation)
      ? stored.selectedAdaptation
      : null;
    const adaptation = selectedAdaptation
      ? ASCEND_CONFIG.adaptations[selectedAdaptation]
      : null;
    const organismStage: OrganismStage = stored.organismStage === 'adapted'
      ? 'adapted'
      : stored.organismStage === 'primordial'
        ? 'primordial'
        : stored.manualTapCount > 0
          ? 'primordial'
          : 'void';

    return {
      energy: stored.energy,
      lifetimeEnergy: stored.lifetimeEnergy,
      manualTapCount: stored.manualTapCount,
      clickPower: adaptation?.clickPower ?? ASCEND_CONFIG.baseClickPower,
      passiveEnergyPerSecond: adaptation?.passiveEnergyPerSecond ?? 0,
      selectedAdaptation,
      organismStage,
      milestones: {
        mutation: Boolean(stored.milestones?.mutation || stored.lifetimeEnergy >= ASCEND_CONFIG.mutationEnergy),
        adapted: Boolean(stored.milestones?.adapted || organismStage === 'adapted'),
      },
      lastUpdateTime: performance.now(),
    };
  } catch {
    return fallback;
  }
}

document.querySelectorAll<HTMLElement>('[data-ascend]').forEach((root) => {
  const cellButton = root.querySelector<HTMLButtonElement>('[data-cell-button]');
  const energyDisplay = root.querySelector<HTMLElement>('[data-energy-display]');
  const energyValue = root.querySelector<HTMLElement>('[data-energy-value]');
  const instruction = root.querySelector<HTMLElement>('[data-instruction]');
  const adaptations = root.querySelector<HTMLElement>('[data-adaptations]');
  const mutationBurst = root.querySelector<HTMLElement>('[data-mutation-burst]');
  const activeAdaptation = root.querySelector<HTMLElement>('[data-active-adaptation]');
  const genesisMessage = root.querySelector<HTMLElement>('[data-genesis-message]');
  const bonus = root.querySelector<HTMLElement>('[data-bonus]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const resetForm = root.querySelector<HTMLFormElement>('[data-reset-form]');
  const resetEnergy = root.querySelector<HTMLInputElement>('[data-reset-energy]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-reset-button]');

  if (!cellButton || !energyDisplay || !energyValue || !instruction || !adaptations
    || !mutationBurst || !activeAdaptation || !genesisMessage || !bonus || !status
    || !resetForm || !resetEnergy || !resetButton) return;

  let state = loadState();
  let choiceReady = state.milestones.mutation;
  let saveTimer = 0;
  let passiveAccumulator = 0;
  let bonusTimer = 0;

  const formatEnergy = (value: number) => {
    const rounded = Math.round(value);
    return Math.abs(value - rounded) < 0.005 ? String(rounded) : value.toFixed(1);
  };

  const saveNow = () => {
    window.clearTimeout(saveTimer);
    saveTimer = 0;
    const { lastUpdateTime: _runtimeOnly, ...savedState } = state;
    const save: AscendSave = {
      version: ASCEND_CONFIG.saveVersion,
      savedAt: Date.now(),
      state: savedState,
    };
    try {
      localStorage.setItem(ASCEND_CONFIG.saveKey, JSON.stringify(save));
    } catch {
      // The game remains playable when browser storage is unavailable.
    }
  };

  const scheduleSave = () => {
    if (saveTimer) return;
    saveTimer = window.setTimeout(saveNow, ASCEND_CONFIG.saveThrottleMs);
  };

  const instructionOpacity = () => {
    if (state.manualTapCount <= 2) return 1;
    return Math.max(0, 1 - (state.manualTapCount - 2) * 0.24);
  };

  const render = () => {
    const hasCell = state.organismStage !== 'void';
    root.dataset.organismStage = state.organismStage;
    energyDisplay.hidden = !hasCell;
    energyValue.textContent = formatEnergy(state.energy);
    instruction.textContent = hasCell ? 'TAP AGAIN' : 'TAP';
    instruction.style.setProperty('--instruction-opacity', String(instructionOpacity()));
    instruction.hidden = hasCell && instructionOpacity() === 0;
    cellButton.ariaLabel = hasCell
      ? 'Generate Energy by tapping the cell'
      : 'Create a primordial cell';

    adaptations.hidden = !(state.milestones.mutation && !state.selectedAdaptation && choiceReady);
    activeAdaptation.hidden = !state.selectedAdaptation;
    if (state.selectedAdaptation) {
      activeAdaptation.textContent = `${ASCEND_CONFIG.adaptations[state.selectedAdaptation].name.toUpperCase()} ACTIVE`;
    }
    genesisMessage.hidden = !state.milestones.adapted;
  };

  const playTapFeedback = () => {
    cellButton.classList.remove('is-tapped');
    void cellButton.offsetWidth;
    cellButton.classList.add('is-tapped');
  };

  const evolveIfReady = () => {
    if (state.milestones.adapted || !state.selectedAdaptation
      || state.lifetimeEnergy < ASCEND_CONFIG.adaptedEnergy) return;
    state.milestones.adapted = true;
    state.organismStage = 'adapted';
    root.classList.add('is-evolving');
    window.setTimeout(() => root.classList.remove('is-evolving'), 900);
    status.textContent = 'Genesis has begun. The cell has adapted.';
  };

  const triggerMutation = () => {
    state.milestones.mutation = true;
    choiceReady = false;
    mutationBurst.classList.add('is-active');
    root.classList.add('is-mutating');
    window.setTimeout(() => {
      mutationBurst.classList.remove('is-active');
      root.classList.remove('is-mutating');
      choiceReady = true;
      render();
      const firstChoice = adaptations.querySelector<HTMLButtonElement>('[data-adaptation]');
      firstChoice?.focus({ preventScroll: true });
      status.textContent = 'A mutation is available. Choose one adaptation.';
    }, ASCEND_CONFIG.mutationRevealDelayMs);
  };

  const addEnergy = (amount: number) => {
    state.energy += amount;
    state.lifetimeEnergy += amount;
  };

  cellButton.addEventListener('click', () => {
    if (state.organismStage === 'void') state.organismStage = 'primordial';
    state.manualTapCount += 1;

    let gain = state.clickPower;
    if (state.selectedAdaptation === 'replication') {
      const replication = ASCEND_CONFIG.adaptations.replication;
      if (state.manualTapCount % replication.replicationEvery === 0) {
        gain += replication.replicationBonus;
        bonus.classList.remove('is-active');
        void bonus.offsetWidth;
        bonus.classList.add('is-active');
        window.clearTimeout(bonusTimer);
        bonusTimer = window.setTimeout(() => bonus.classList.remove('is-active'), 700);
      }
    }

    addEnergy(gain);
    playTapFeedback();
    if (!state.milestones.mutation && state.lifetimeEnergy >= ASCEND_CONFIG.mutationEnergy) {
      triggerMutation();
    }
    evolveIfReady();
    render();
    scheduleSave();
  });

  adaptations.addEventListener('click', (event) => {
    const target = (event.target as Element).closest<HTMLButtonElement>('[data-adaptation]');
    const id = target?.dataset.adaptation;
    if (!isAdaptationId(id) || state.selectedAdaptation) return;

    const adaptation = ASCEND_CONFIG.adaptations[id];
    state.selectedAdaptation = id;
    state.clickPower = adaptation.clickPower;
    state.passiveEnergyPerSecond = adaptation.passiveEnergyPerSecond;
    root.classList.add('has-adapted');
    window.setTimeout(() => root.classList.remove('has-adapted'), 600);
    status.textContent = `${adaptation.name} selected. ${adaptation.effect}.`;
    evolveIfReady();
    render();
    saveNow();
    cellButton.focus({ preventScroll: true });
  });

  const resetTarget = () => {
    const parsed = Number(resetEnergy.value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(
      Math.max(Math.floor(parsed), 0),
      ASCEND_CONFIG.maxPrototypeResetEnergy,
    );
  };

  const updateResetButton = () => {
    resetButton.textContent = `Reset to ${resetTarget()}`;
  };

  resetEnergy.addEventListener('input', updateResetButton);
  resetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const targetEnergy = resetTarget();
    state = initialState();
    state.energy = targetEnergy;
    state.lifetimeEnergy = targetEnergy;
    state.manualTapCount = targetEnergy;
    state.organismStage = targetEnergy === 0 ? 'void' : 'primordial';
    state.milestones.mutation = targetEnergy >= ASCEND_CONFIG.mutationEnergy;
    choiceReady = state.milestones.mutation;
    passiveAccumulator = 0;
    window.clearTimeout(bonusTimer);
    mutationBurst.classList.remove('is-active');
    bonus.classList.remove('is-active');
    root.classList.remove('is-mutating', 'is-evolving', 'has-adapted');
    resetEnergy.value = String(targetEnergy);
    updateResetButton();
    render();
    saveNow();
    status.textContent = targetEnergy === 0
      ? 'Prototype reset. Tap to create a primordial cell.'
      : `Prototype reset to ${targetEnergy} Energy.`;

    const firstChoice = adaptations.querySelector<HTMLButtonElement>('[data-adaptation]');
    if (choiceReady) firstChoice?.focus({ preventScroll: true });
    else cellButton.focus({ preventScroll: true });
  });

  const passiveTick = (now: number) => {
    const elapsed = Math.min(
      Math.max((now - state.lastUpdateTime) / 1000, 0),
      ASCEND_CONFIG.maxRuntimeDeltaSeconds,
    );
    state.lastUpdateTime = now;

    if (state.passiveEnergyPerSecond > 0 && document.visibilityState === 'visible') {
      passiveAccumulator += elapsed;
      if (passiveAccumulator >= ASCEND_CONFIG.passiveRenderIntervalSeconds) {
        addEnergy(passiveAccumulator * state.passiveEnergyPerSecond);
        passiveAccumulator = 0;
        evolveIfReady();
        render();
        scheduleSave();
      }
    }

    requestAnimationFrame(passiveTick);
  };

  document.addEventListener('visibilitychange', () => {
    state.lastUpdateTime = performance.now();
    passiveAccumulator = 0;
  });
  window.addEventListener('pagehide', saveNow);

  updateResetButton();
  render();
  requestAnimationFrame(passiveTick);
});
