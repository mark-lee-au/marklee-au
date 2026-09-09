import {
  ASCEND_CONFIG,
  type AdaptationId,
  type OrganismStage,
  type SpecialisationId,
} from './config';
import {
  createRunPhenotypes,
  createVisualSeed,
  PHENOTYPE_PALETTES,
  type RunPhenotypes,
  type VisualPhenotype,
} from './phenotype';

interface AscendState {
  energy: number;
  lifetimeEnergy: number;
  manualTapCount: number;
  clickPower: number;
  passiveEnergyPerSecond: number;
  selectedAdaptation: AdaptationId | null;
  selectedSpecialisation: SpecialisationId | null;
  organismStage: OrganismStage;
  milestones: {
    mutation: boolean;
    adapted: boolean;
    specialisation: boolean;
    complex: boolean;
  };
  lastUpdateTime: number;
  visualSeed: number;
  updateHistory: string[];
}

interface AscendSave {
  version: number;
  savedAt: number;
  state: Omit<AscendState, 'lastUpdateTime'>;
}

const isAdaptationId = (value: unknown): value is AdaptationId =>
  typeof value === 'string' && value in ASCEND_CONFIG.adaptations;

const isSpecialisationId = (value: unknown): value is SpecialisationId =>
  typeof value === 'string' && value in ASCEND_CONFIG.specialisations;

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
    selectedSpecialisation: null,
    organismStage: 'void',
    milestones: { mutation: false, adapted: false, specialisation: false, complex: false },
    lastUpdateTime: performance.now(),
    visualSeed: createVisualSeed(),
    updateHistory: [],
  };
}

function loadState(): AscendState {
  const fallback = initialState();

  try {
    const raw = localStorage.getItem(ASCEND_CONFIG.saveKey);
    if (!raw) return fallback;

    const save = JSON.parse(raw) as Partial<AscendSave>;
    const stored = save.state as Partial<AscendState> | undefined;
    if (![1, 2, 3, ASCEND_CONFIG.saveVersion].includes(save.version ?? -1) || !stored) return fallback;
    if (!finiteNonNegative(stored.energy) || !finiteNonNegative(stored.lifetimeEnergy)) return fallback;
    if (!Number.isInteger(stored.manualTapCount) || (stored.manualTapCount ?? -1) < 0) return fallback;

    const selectedAdaptation = isAdaptationId(stored.selectedAdaptation)
      ? stored.selectedAdaptation
      : null;
    const adaptation = selectedAdaptation
      ? ASCEND_CONFIG.adaptations[selectedAdaptation]
      : null;
    const selectedSpecialisation = isSpecialisationId(stored.selectedSpecialisation)
      ? stored.selectedSpecialisation
      : null;
    const specialisation = selectedSpecialisation
      ? ASCEND_CONFIG.specialisations[selectedSpecialisation]
      : null;
    const organismStage: OrganismStage = stored.organismStage === 'complex'
      ? 'complex'
      : stored.organismStage === 'adapted'
        ? 'adapted'
      : stored.organismStage === 'primordial'
        ? 'primordial'
        : stored.manualTapCount > 0
          ? 'primordial'
          : 'void';

    const migratedHistory: string[] = [];
    if (selectedAdaptation) migratedHistory.push(`${ASCEND_CONFIG.adaptations[selectedAdaptation].name.toUpperCase()} ACTIVE`);
    if (organismStage === 'adapted' || organismStage === 'complex') migratedHistory.push('GENESIS HAS BEGUN');
    if (selectedSpecialisation) migratedHistory.push(`${ASCEND_CONFIG.specialisations[selectedSpecialisation].name.toUpperCase()} ACTIVE`);
    if (organismStage === 'complex') migratedHistory.push('CELLULAR COMPLEXITY EMERGES');

    return {
      energy: stored.energy,
      lifetimeEnergy: stored.lifetimeEnergy,
      manualTapCount: stored.manualTapCount,
      clickPower: (adaptation?.clickPower ?? ASCEND_CONFIG.baseClickPower)
        + (specialisation?.clickPowerBonus ?? 0),
      passiveEnergyPerSecond: (adaptation?.passiveEnergyPerSecond ?? 0)
        + (specialisation?.passiveEnergyBonus ?? 0),
      selectedAdaptation,
      selectedSpecialisation,
      organismStage,
      milestones: {
        mutation: Boolean(stored.milestones?.mutation || stored.lifetimeEnergy >= ASCEND_CONFIG.mutationEnergy),
        adapted: Boolean(stored.milestones?.adapted || organismStage === 'adapted' || organismStage === 'complex'),
        specialisation: Boolean(stored.milestones?.specialisation || selectedSpecialisation),
        complex: Boolean(stored.milestones?.complex || organismStage === 'complex'),
      },
      lastUpdateTime: performance.now(),
      visualSeed: Number.isInteger(stored.visualSeed) && (stored.visualSeed ?? -1) >= 0
        ? stored.visualSeed
        : createVisualSeed(),
      updateHistory: Array.isArray(stored.updateHistory)
        ? stored.updateHistory.filter((item): item is string => typeof item === 'string').slice(-24)
        : migratedHistory,
    };
  } catch {
    return fallback;
  }
}

document.querySelectorAll<HTMLElement>('[data-ascend]').forEach((root) => {
  const cellButton = root.querySelector<HTMLButtonElement>('[data-cell-button]');
  const stage = root.querySelector<HTMLElement>('.ascend__stage');
  const energyDisplay = root.querySelector<HTMLElement>('[data-energy-display]');
  const energyValue = root.querySelector<HTMLElement>('[data-energy-value]');
  const instruction = root.querySelector<HTMLElement>('[data-instruction]');
  const adaptations = root.querySelector<HTMLElement>('[data-adaptations]');
  const mutationBurst = root.querySelector<HTMLElement>('[data-mutation-burst]');
  const specialisations = root.querySelector<HTMLElement>('[data-specialisations]');
  const bonus = root.querySelector<HTMLElement>('[data-bonus]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const currentUpdate = root.querySelector<HTMLElement>('[data-current-update]');
  const historyControl = root.querySelector<HTMLElement>('[data-update-history-control]');
  const historyToggle = root.querySelector<HTMLButtonElement>('[data-update-history-toggle]');
  const historyPanel = root.querySelector<HTMLElement>('[data-update-history-panel]');
  const historyList = root.querySelector<HTMLOListElement>('[data-update-history]');
  const nodeToggle = root.querySelector<HTMLInputElement>('[data-node-toggle]');
  const anatomyNodes = root.querySelectorAll<HTMLButtonElement>('[data-anatomy-node]');
  const resetForm = root.querySelector<HTMLFormElement>('[data-reset-form]');
  const resetEnergy = root.querySelector<HTMLInputElement>('[data-reset-energy]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-reset-button]');

  if (!cellButton || !stage || !energyDisplay || !energyValue || !instruction || !adaptations
    || !mutationBurst || !specialisations || !bonus || !status || !currentUpdate
    || !historyControl || !historyToggle || !historyPanel || !historyList || !nodeToggle
    || !resetForm || !resetEnergy || !resetButton) return;

  let state = loadState();
  let choiceReady = state.milestones.mutation;
  let specialisationReady = state.milestones.specialisation;
  let saveTimer = 0;
  let passiveAccumulator = 0;
  let bonusTimer = 0;
  let updateTimer = 0;
  let updateQueue: string[] = [];
  let historyHoverTimer = 0;
  let historyPinned = false;
  const cellForms = root.querySelectorAll<SVGGElement>('[data-cell-form]');
  let runPhenotypes: RunPhenotypes = createRunPhenotypes(state.visualSeed);

  const applyPhenotype = (form: SVGGElement, phenotype: VisualPhenotype) => {
    const palette = PHENOTYPE_PALETTES[phenotype.palette];
    form.dataset.membrane = phenotype.membrane;
    form.dataset.nucleus = phenotype.nucleus;
    form.dataset.interior = phenotype.interior;
    form.dataset.appendage = phenotype.appendage;
    form.style.setProperty('--cell-primary', palette.primary);
    form.style.setProperty('--cell-secondary', palette.secondary);
    form.style.setProperty('--cell-muted', palette.muted);
    form.style.setProperty('--cell-glow', palette.glow);
    form.style.setProperty('--cell-rotation', `${phenotype.rotation}deg`);
    form.style.setProperty('--cell-mirror', phenotype.mirror ? '-1' : '1');
  };

  const applyRunPhenotypes = () => {
    runPhenotypes = createRunPhenotypes(state.visualSeed);
    cellForms.forEach((form) => {
      applyPhenotype(
        form,
        form.dataset.cellForm === 'adapted' ? runPhenotypes.adapted : runPhenotypes.primordial,
      );
      if (form.dataset.cellForm === 'adapted') {
        form.dataset.complexMutation = runPhenotypes.complexMutation;
      }
    });
  };

  const titleCase = (value: string) => value.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

  const renderHistory = () => {
    historyList.replaceChildren();
    const entries = state.updateHistory.length ? state.updateHistory : ['No changes recorded yet.'];
    entries.forEach((message) => {
      const item = document.createElement('li');
      item.textContent = message;
      historyList.append(item);
    });
  };

  const showNextUpdate = () => {
    if (updateTimer || updateQueue.length === 0) return;
    const message = updateQueue.shift();
    if (!message) return;
    currentUpdate.textContent = message;
    currentUpdate.classList.remove('is-visible');
    void currentUpdate.offsetWidth;
    currentUpdate.classList.add('is-visible');
    updateTimer = window.setTimeout(() => {
      currentUpdate.classList.remove('is-visible');
      window.setTimeout(() => {
        updateTimer = 0;
        showNextUpdate();
      }, 900);
    }, 3000);
  };

  const recordUpdate = (message: string) => {
    if (state.updateHistory.at(-1) !== message) {
      state.updateHistory = [...state.updateHistory.slice(-23), message];
      renderHistory();
    }
    updateQueue.push(message);
    showNextUpdate();
    scheduleSave();
  };

  const positionAnatomyNodes = () => {
    const phenotype = state.organismStage === 'primordial'
      ? runPhenotypes.primordial
      : runPhenotypes.adapted;
    const form = root.querySelector<SVGGElement>(
      `[data-cell-form="${state.organismStage === 'primordial' ? 'primordial' : 'adapted'}"]`,
    );
    const targets: Record<string, Element | null> = {
      membrane: form?.querySelector(`[data-membrane="${phenotype.membrane}"]`) ?? null,
      nucleus: form?.querySelector(`[data-nucleus="${phenotype.nucleus}"]`) ?? null,
      interior: form?.querySelector(`[data-interior="${phenotype.interior}"]`) ?? null,
      appendage: form?.querySelector(`[data-appendage="${phenotype.appendage}"]`) ?? null,
      adaptation: state.selectedAdaptation
        ? root.querySelector(`[data-upgrade-visual="${state.selectedAdaptation}"]`)
        : null,
      specialisation: state.selectedSpecialisation
        ? root.querySelector(`[data-specialisation-visual="${state.selectedSpecialisation}"]`)
        : null,
      complex: state.organismStage === 'complex'
        ? form?.querySelector(`[data-complex-mutation="${runPhenotypes.complexMutation}"]`) ?? null
        : null,
    };
    const anchors: Record<string, [number, number]> = {
      membrane: [.16, .22],
      nucleus: [.5, .5],
      interior: [.28, .72],
      appendage: [.5, .5],
      adaptation: [.72, .22],
      specialisation: [.72, .72],
      complex: [.5, .5],
    };
    const stageBounds = stage.getBoundingClientRect();
    anatomyNodes.forEach((node) => {
      const name = node.dataset.anatomyNode ?? '';
      const target = targets[name];
      if (!target || node.hidden) return;
      const bounds = target.getBoundingClientRect();
      const [x, y] = anchors[name] ?? [.5, .5];
      node.style.left = `${bounds.left + bounds.width * x - stageBounds.left - 4.5}px`;
      node.style.top = `${bounds.top + bounds.height * y - stageBounds.top - 4.5}px`;
    });
  };

  const updateAnatomyNodes = () => {
    const hasCell = state.organismStage !== 'void';
    const phenotype = state.organismStage === 'primordial'
      ? runPhenotypes.primordial
      : runPhenotypes.adapted;
    const labels: Record<string, { label: string; visible: boolean }> = {
      membrane: { label: `${titleCase(phenotype.membrane)} membrane`, visible: hasCell },
      nucleus: { label: `${titleCase(phenotype.nucleus)} nucleus`, visible: hasCell },
      interior: { label: `${titleCase(phenotype.interior)} organelles`, visible: hasCell },
      appendage: {
        label: titleCase(phenotype.appendage),
        visible: hasCell && phenotype.appendage !== 'none',
      },
      adaptation: {
        label: state.selectedAdaptation
          ? ASCEND_CONFIG.adaptations[state.selectedAdaptation].name
          : 'First adaptation',
        visible: Boolean(state.selectedAdaptation),
      },
      specialisation: {
        label: state.selectedSpecialisation
          ? ASCEND_CONFIG.specialisations[state.selectedSpecialisation].name
          : 'Second adaptation',
        visible: Boolean(state.selectedSpecialisation),
      },
      complex: {
        label: {
          buds: 'Budding structures',
          ridges: 'Structural ridges',
          nodes: 'Signal nodes',
        }[runPhenotypes.complexMutation],
        visible: state.organismStage === 'complex',
      },
    };

    anatomyNodes.forEach((node) => {
      const details = labels[node.dataset.anatomyNode ?? ''];
      if (!details) return;
      node.hidden = !details.visible;
      node.tabIndex = details.visible && nodeToggle.checked ? 0 : -1;
      node.ariaLabel = `Inspect ${details.label}`;
      const tooltip = node.querySelector<HTMLElement>('span');
      if (tooltip) tooltip.textContent = details.label;
    });
    requestAnimationFrame(positionAnatomyNodes);
  };

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
    root.dataset.upgradeVisual = state.selectedAdaptation ?? 'none';
    root.dataset.specialisationVisual = state.selectedSpecialisation ?? 'none';
    energyDisplay.hidden = !hasCell;
    energyValue.textContent = formatEnergy(state.energy);
    instruction.textContent = hasCell ? 'TAP AGAIN' : 'TAP';
    instruction.style.setProperty('--instruction-opacity', String(instructionOpacity()));
    instruction.hidden = hasCell && instructionOpacity() === 0;
    cellButton.ariaLabel = hasCell
      ? 'Generate Energy by tapping the cell'
      : 'Create a primordial cell';

    adaptations.hidden = !(state.milestones.mutation && !state.selectedAdaptation && choiceReady);
    specialisations.hidden = !(state.milestones.specialisation
      && !state.selectedSpecialisation && specialisationReady);
    updateAnatomyNodes();
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
    recordUpdate('GENESIS HAS BEGUN');
    status.textContent = 'Genesis has begun. The cell has adapted.';
  };

  const becomeComplexIfReady = () => {
    if (state.milestones.complex || !state.selectedSpecialisation
      || state.lifetimeEnergy < ASCEND_CONFIG.complexEnergy) return;
    state.milestones.complex = true;
    state.organismStage = 'complex';
    root.classList.add('is-evolving');
    window.setTimeout(() => root.classList.remove('is-evolving'), 900);
    recordUpdate('CELLULAR COMPLEXITY EMERGES');
    status.textContent = 'Cellular complexity has emerged.';
  };

  const triggerSpecialisationIfReady = () => {
    if (state.milestones.specialisation || !state.milestones.adapted
      || state.lifetimeEnergy < ASCEND_CONFIG.specialisationEnergy) return;
    state.milestones.specialisation = true;
    specialisationReady = false;
    mutationBurst.classList.add('is-active');
    root.classList.add('is-mutating');
    window.setTimeout(() => {
      mutationBurst.classList.remove('is-active');
      root.classList.remove('is-mutating');
      specialisationReady = true;
      render();
      const firstChoice = specialisations.querySelector<HTMLButtonElement>('[data-specialisation]');
      firstChoice?.focus({ preventScroll: true });
      recordUpdate('SECOND ADAPTATION AVAILABLE');
      status.textContent = 'A second mutation is available. Choose one specialisation.';
    }, ASCEND_CONFIG.mutationRevealDelayMs);
  };

  const progressIfReady = () => {
    evolveIfReady();
    triggerSpecialisationIfReady();
    becomeComplexIfReady();
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
      recordUpdate('FIRST ADAPTATION AVAILABLE');
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
    let bonusGain = 0;
    if (state.selectedAdaptation === 'replication') {
      const replication = ASCEND_CONFIG.adaptations.replication;
      if (state.manualTapCount % replication.replicationEvery === 0) {
        bonusGain += replication.replicationBonus;
      }
    }
    if (state.selectedSpecialisation) {
      const specialisation = ASCEND_CONFIG.specialisations[state.selectedSpecialisation];
      if (specialisation.burstEvery > 0
        && state.manualTapCount % specialisation.burstEvery === 0) {
        bonusGain += specialisation.burstBonus;
      }
    }
    gain += bonusGain;
    if (bonusGain > 0) {
      bonus.textContent = `+${bonusGain}`;
      bonus.classList.remove('is-active');
      void bonus.offsetWidth;
      bonus.classList.add('is-active');
      window.clearTimeout(bonusTimer);
      bonusTimer = window.setTimeout(() => bonus.classList.remove('is-active'), 700);
    }

    addEnergy(gain);
    playTapFeedback();
    if (!state.milestones.mutation && state.lifetimeEnergy >= ASCEND_CONFIG.mutationEnergy) {
      triggerMutation();
    }
    progressIfReady();
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
    recordUpdate(`${adaptation.name.toUpperCase()} ACTIVE`);
    status.textContent = `${adaptation.name} selected. ${adaptation.effect}.`;
    progressIfReady();
    render();
    saveNow();
    cellButton.focus({ preventScroll: true });
  });

  specialisations.addEventListener('click', (event) => {
    const target = (event.target as Element).closest<HTMLButtonElement>('[data-specialisation]');
    const id = target?.dataset.specialisation;
    if (!isSpecialisationId(id) || state.selectedSpecialisation) return;

    const specialisation = ASCEND_CONFIG.specialisations[id];
    state.selectedSpecialisation = id;
    state.clickPower += specialisation.clickPowerBonus;
    state.passiveEnergyPerSecond += specialisation.passiveEnergyBonus;
    root.classList.add('has-adapted');
    window.setTimeout(() => root.classList.remove('has-adapted'), 600);
    recordUpdate(`${specialisation.name.toUpperCase()} ACTIVE`);
    status.textContent = `${specialisation.name} selected. ${specialisation.effect}.`;
    progressIfReady();
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
    specialisationReady = false;
    passiveAccumulator = 0;
    window.clearTimeout(bonusTimer);
    mutationBurst.classList.remove('is-active');
    bonus.classList.remove('is-active');
    root.classList.remove('is-mutating', 'is-evolving', 'has-adapted');
    applyRunPhenotypes();
    renderHistory();
    window.clearTimeout(updateTimer);
    updateTimer = 0;
    updateQueue = [];
    currentUpdate.classList.remove('is-visible');
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

  const setHistoryOpen = (open: boolean) => {
    historyControl.classList.toggle('is-open', open);
    historyToggle.ariaExpanded = String(open);
    historyPanel.tabIndex = open ? 0 : -1;
    historyPanel.ariaHidden = String(!open);
  };

  historyControl.addEventListener('mouseenter', () => {
    window.clearTimeout(historyHoverTimer);
    historyHoverTimer = window.setTimeout(() => setHistoryOpen(true), 1000);
  });
  historyControl.addEventListener('mouseleave', () => {
    window.clearTimeout(historyHoverTimer);
    if (!historyPinned && !historyControl.contains(document.activeElement)) setHistoryOpen(false);
  });
  historyControl.addEventListener('focusin', () => setHistoryOpen(true));
  historyControl.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (!historyPinned && !historyControl.contains(document.activeElement)) setHistoryOpen(false);
    });
  });
  historyToggle.addEventListener('click', () => {
    historyPinned = !historyPinned;
    setHistoryOpen(historyPinned);
  });
  historyControl.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    historyPinned = false;
    setHistoryOpen(false);
    historyToggle.focus();
  });

  const updateNodeVisibility = () => {
    root.dataset.nodesVisible = String(nodeToggle.checked);
    updateAnatomyNodes();
  };
  nodeToggle.addEventListener('change', updateNodeVisibility);

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
        progressIfReady();
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
  window.addEventListener('resize', positionAnatomyNodes);
  window.addEventListener('pagehide', saveNow);

  applyRunPhenotypes();
  updateResetButton();
  progressIfReady();
  renderHistory();
  updateNodeVisibility();
  render();
  requestAnimationFrame(passiveTick);
});
