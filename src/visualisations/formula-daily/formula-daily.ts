type PieceKind = 'function' | 'range' | 'value' | 'syntax';

type PieceState = {
  element: HTMLButtonElement;
  id: string;
  value: string;
  kind: PieceKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  dragging: boolean;
  used: boolean;
};

type ClusterPointer = {
  state: PieceState;
  id: number;
  moved: boolean;
  startX: number;
  startY: number;
};

type PlacedPointer = {
  state: PieceState;
  token: HTMLButtonElement;
  ghost: HTMLButtonElement;
  id: number;
  moved: boolean;
  startX: number;
  startY: number;
  originalIndex: number;
  reorderIndex: number | null;
  reorderPreview: HTMLSpanElement;
};

document.querySelectorAll<HTMLElement>('[data-formula-daily]').forEach((root) => {
  const field = root.querySelector<HTMLElement>('[data-cluster-field]');
  const cluster = root.querySelector<HTMLElement>('[data-cluster]');
  const inputCell = root.querySelector<HTMLElement>('[data-input-cell]');
  const formulaOutput = root.querySelector<HTMLElement>('[data-formula-output]');
  const placeholder = root.querySelector<HTMLElement>('[data-placeholder]');
  const strings = root.querySelector<SVGSVGElement>('[data-strings]');
  const attemptCount = root.querySelector<HTMLElement>('[data-attempt-count]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const clearButton = root.querySelector<HTMLButtonElement>('[data-clear]');
  const submitButton = root.querySelector<HTMLButtonElement>('[data-submit]');

  if (!field || !cluster || !inputCell || !formulaOutput || !placeholder || !strings || !attemptCount || !status || !clearButton || !submitButton) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const placedIds: string[] = [];
  const states: PieceState[] = Array.from(field.querySelectorAll<HTMLButtonElement>('[data-piece-id]')).map((element) => ({
    element,
    id: element.dataset.pieceId ?? '',
    value: element.dataset.pieceValue ?? '',
    kind: (element.dataset.pieceKind ?? 'syntax') as PieceKind,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 0,
    height: 0,
    dragging: false,
    used: false,
  }));

  let attempts = 0;
  let selectedCell = true;
  let previewId: string | null = null;
  let previewIndex: number | null = null;
  let visible = true;
  let frame = 0;
  let animationFrame = 0;
  let activePointer: ClusterPointer | null = null;
  let activePlacedPointer: PlacedPointer | null = null;
  let suppressClickId: string | null = null;
  let suppressPlacedClickId: string | null = null;
  let clusterOffset = 0;
  let clearanceFrame = 0;

  const announce = (message: string) => { status.textContent = message; };

  const syncClusterClearance = () => {
    const answerBounds = inputCell.getBoundingClientRect();
    const fieldBounds = field.getBoundingClientRect();
    const available = states.filter((state) => !state.used);
    const topPieceInset = available.length
      ? Math.max(0, Math.min(...available.map((state) => state.y)))
      : 0;
    const unshiftedPieceTop = fieldBounds.top - clusterOffset + topPieceInset;
    const nextOffset = Math.max(0, Math.ceil(answerBounds.bottom + 12 - unshiftedPieceTop));
    if (Math.abs(nextOffset - clusterOffset) < 2) return;
    clusterOffset = nextOffset;
    cluster.style.transform = `translateY(${clusterOffset}px)`;
    cluster.style.marginBottom = `${clusterOffset + 4}px`;
  };

  const scheduleClusterClearance = () => {
    if (clearanceFrame) cancelAnimationFrame(clearanceFrame);
    clearanceFrame = requestAnimationFrame(() => {
      clearanceFrame = 0;
      syncClusterClearance();
    });
  };

  const setPieceContent = (element: HTMLElement, state: PieceState) => {
    if (state.kind !== 'function' || !state.value.endsWith('(')) {
      element.textContent = state.value;
      return;
    }
    const name = document.createElement('span');
    name.className = 'piece-part piece-part--function';
    name.textContent = state.value.slice(0, -1);
    const opening = document.createElement('span');
    opening.className = 'piece-part piece-part--syntax';
    opening.textContent = '(';
    element.append(name, opening);
  };

  const setPosition = (state: PieceState) => {
    const tilt = ((states.indexOf(state) * 7) % 11) - 5;
    state.element.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${tilt}deg)`;
  };

  const measureAndArrange = () => {
    const bounds = field.getBoundingClientRect();
    states.forEach((state, index) => {
      state.width = state.element.offsetWidth;
      state.height = state.element.offsetHeight;
      if (state.x === 0 && state.y === 0) {
        const columns = Math.max(4, Math.floor(bounds.width / 130));
        const column = index % columns;
        const row = Math.floor(index / columns);
        state.x = 18 + column * ((bounds.width - 100) / Math.max(1, columns - 1)) + ((row * 19 + index * 7) % 23) - 11;
        state.y = 22 + row * 62 + ((index * 13) % 19) - 9;
      }
      state.x = Math.max(0, Math.min(bounds.width - state.width, state.x));
      state.y = Math.max(0, Math.min(bounds.height - state.height, state.y));
      setPosition(state);
    });
    scheduleClusterClearance();
  };

  const syncInputHeight = () => {
    const nextHeight = Math.max(66, Math.ceil(formulaOutput.scrollHeight + 14));
    inputCell.style.height = `${nextHeight}px`;
  };

  const renderFormula = () => {
    formulaOutput.replaceChildren();
    placedIds.forEach((id) => {
      const state = states.find((piece) => piece.id === id);
      if (!state) return;
      const token = document.createElement('button');
      token.type = 'button';
      token.className = `formula-token chalk-piece--${state.kind}`;
      token.dataset.placedId = state.id;
      setPieceContent(token, state);
      token.setAttribute('aria-label', `Remove ${state.value}`);
      formulaOutput.append(token);
    });
    const preview = states.find((piece) => piece.id === previewId && !piece.used);
    if (preview) {
      const ghost = document.createElement('span');
      ghost.className = 'formula-token formula-token--preview';
      setPieceContent(ghost, preview);
      ghost.setAttribute('aria-hidden', 'true');
      const insertionPoint = Math.max(0, Math.min(previewIndex ?? placedIds.length, placedIds.length));
      formulaOutput.insertBefore(ghost, formulaOutput.children[insertionPoint] ?? null);
    }
    placeholder.hidden = placedIds.length > 0 || Boolean(preview);
    inputCell.setAttribute('aria-label', `Formula answer for total units sold in East, selected. ${placedIds.length ? placedIds.map((id) => states.find((piece) => piece.id === id)?.value).join('') : 'Empty'}`);
    syncInputHeight();
    scheduleClusterClearance();
  };

  const placePiece = (state: PieceState, index = placedIds.length) => {
    if (!selectedCell || state.used) return;
    previewId = null;
    previewIndex = null;
    state.used = true;
    state.element.hidden = true;
    placedIds.splice(Math.max(0, Math.min(index, placedIds.length)), 0, state.id);
    renderFormula();
    announce(`${state.value} added to the answer.`);
  };

  const previewPiece = (state: PieceState | null, index = placedIds.length) => {
    previewId = state && !state.used ? state.id : null;
    previewIndex = previewId ? Math.max(0, Math.min(index, placedIds.length)) : null;
    states.forEach((piece) => {
      piece.element.dataset.preview = String(piece.id === previewId);
    });
    renderFormula();
  };

  const returnPiece = (id: string) => {
    const state = states.find((piece) => piece.id === id);
    const index = placedIds.indexOf(id);
    if (!state || index < 0) return;
    placedIds.splice(index, 1);
    state.used = false;
    state.element.hidden = false;
    state.vx = (Math.random() - .5) * 2;
    state.vy = -1;
    renderFormula();
    announce(`${state.value} returned to the cluster.`);
    requestTick();
  };

  const pointInside = (x: number, y: number, bounds: DOMRect, margin = 0) => (
    x >= bounds.left - margin
    && x <= bounds.right + margin
    && y >= bounds.top - margin
    && y <= bounds.bottom + margin
  );

  const findReorderIndex = (x: number, y: number, draggedId: string) => {
    const tokens = Array.from(formulaOutput.querySelectorAll<HTMLButtonElement>('[data-placed-id]'))
      .filter((token) => token.dataset.placedId !== draggedId && !token.hidden);
    for (let index = 0; index < tokens.length; index += 1) {
      const bounds = tokens[index].getBoundingClientRect();
      if (y < bounds.top - 5) return index;
      const withinRow = y <= bounds.bottom + 5;
      if (withinRow && x < bounds.left + bounds.width / 2) return index;
    }
    return tokens.length;
  };

  const showReorderPreview = (pointer: PlacedPointer, index: number) => {
    if (pointer.reorderIndex === index && pointer.reorderPreview.isConnected) return;
    pointer.reorderIndex = index;
    pointer.token.hidden = true;
    const remaining = Array.from(formulaOutput.querySelectorAll<HTMLButtonElement>('[data-placed-id]'))
      .filter((token) => token.dataset.placedId !== pointer.state.id && !token.hidden);
    formulaOutput.insertBefore(pointer.reorderPreview, remaining[index] ?? null);
    syncInputHeight();
  };

  const hideReorderPreview = (pointer: PlacedPointer) => {
    pointer.reorderIndex = null;
    pointer.reorderPreview.remove();
    pointer.token.hidden = false;
    syncInputHeight();
  };

  const updateStrings = () => {
    const active = states.filter((state) => !state.used && !state.dragging);
    strings.replaceChildren();
    const drawn = new Set<string>();
    active.forEach((state) => {
      let nearest: PieceState | undefined;
      let nearestDistance = Number.POSITIVE_INFINITY;
      active.forEach((candidate) => {
        if (candidate === state) return;
        const distance = Math.hypot(candidate.x - state.x, candidate.y - state.y);
        if (distance < nearestDistance) {
          nearest = candidate;
          nearestDistance = distance;
        }
      });
      if (!nearest || nearestDistance > 180) return;
      const key = [state.id, nearest.id].sort().join(':');
      if (drawn.has(key)) return;
      drawn.add(key);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(state.x + state.width / 2));
      line.setAttribute('y1', String(state.y + state.height / 2));
      line.setAttribute('x2', String(nearest.x + nearest.width / 2));
      line.setAttribute('y2', String(nearest.y + nearest.height / 2));
      strings.append(line);
    });
  };

  const tick = (time: number) => {
    animationFrame = 0;
    if (!visible || reducedMotion) return;
    const bounds = field.getBoundingClientRect();
    const active = states.filter((state) => !state.used);
    const centreX = bounds.width / 2;
    const centreY = bounds.height / 2;

    active.forEach((state, index) => {
      if (state.dragging) return;
      const stateCentreX = state.x + state.width / 2;
      const stateCentreY = state.y + state.height / 2;
      state.vx += (centreX - stateCentreX) * .0007 + Math.sin(time / 1700 + index * 1.9) * .004;
      state.vy += (centreY - stateCentreY) * .0007 + Math.cos(time / 1900 + index * 1.3) * .004;
    });

    for (let first = 0; first < active.length; first += 1) {
      for (let second = first + 1; second < active.length; second += 1) {
        const a = active[first];
        const b = active[second];
        if (a.dragging && b.dragging) continue;
        const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
        const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
        const overlapX = (a.width + b.width) / 2 + 10 - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + 10 - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        const force = .035;
        if (overlapX < overlapY) {
          const direction = dx >= 0 ? 1 : -1;
          if (!a.dragging) a.vx -= overlapX * force * direction;
          if (!b.dragging) b.vx += overlapX * force * direction;
        } else {
          const direction = dy >= 0 ? 1 : -1;
          if (!a.dragging) a.vy -= overlapY * force * direction;
          if (!b.dragging) b.vy += overlapY * force * direction;
        }
      }
    }

    active.forEach((state) => {
      if (state.dragging) return;
      state.vx *= .91;
      state.vy *= .91;
      state.x = Math.max(0, Math.min(bounds.width - state.width, state.x + state.vx));
      state.y = Math.max(0, Math.min(bounds.height - state.height, state.y + state.vy));
      setPosition(state);
    });

    frame += 1;
    if (frame % 3 === 0) updateStrings();
    animationFrame = window.requestAnimationFrame(tick);
  };

  const requestTick = () => {
    if (!animationFrame && visible && !reducedMotion) animationFrame = window.requestAnimationFrame(tick);
  };

  field.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    if (!button) return;
    if (suppressClickId === button.dataset.pieceId) return;
    const state = states.find((piece) => piece.id === button.dataset.pieceId);
    if (state) placePiece(state);
  });

  field.addEventListener('pointerover', (event) => {
    if (activePointer || activePlacedPointer) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    const state = states.find((piece) => piece.id === button?.dataset.pieceId);
    if (state) previewPiece(state);
  });

  field.addEventListener('pointerout', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    if (!button || button.contains(event.relatedTarget as Node | null) || activePointer) return;
    if (previewId === button.dataset.pieceId) previewPiece(null);
  });

  field.addEventListener('focusin', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    const state = states.find((piece) => piece.id === button?.dataset.pieceId);
    if (state) previewPiece(state);
  });

  field.addEventListener('focusout', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    if (button && previewId === button.dataset.pieceId) previewPiece(null);
  });

  field.addEventListener('pointerdown', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    if (!button) return;
    const state = states.find((piece) => piece.id === button.dataset.pieceId);
    if (!state) return;
    event.preventDefault();
    previewPiece(state);
    state.dragging = true;
    state.element.dataset.dragging = 'true';
    activePointer = { state, id: event.pointerId, moved: false, startX: event.clientX, startY: event.clientY };
  });

  document.addEventListener('pointermove', (event) => {
    if (activePointer && activePointer.id === event.pointerId) {
      event.preventDefault();
      const bounds = field.getBoundingClientRect();
      const state = activePointer.state;
      if (Math.hypot(event.clientX - activePointer.startX, event.clientY - activePointer.startY) > 5) activePointer.moved = true;
      state.x = event.clientX - bounds.left - state.width / 2;
      state.y = event.clientY - bounds.top - state.height / 2;
      setPosition(state);
      updateStrings();
      if (activePointer.moved) {
        const answerBounds = inputCell.getBoundingClientRect();
        const index = pointInside(event.clientX, event.clientY, answerBounds, 4)
          ? findReorderIndex(event.clientX, event.clientY, '')
          : placedIds.length;
        if (previewIndex !== index) previewPiece(state, index);
      }
      return;
    }
    if (activePlacedPointer && activePlacedPointer.id === event.pointerId) {
      event.preventDefault();
      const distance = Math.hypot(event.clientX - activePlacedPointer.startX, event.clientY - activePlacedPointer.startY);
      if (distance > 5) {
        activePlacedPointer.moved = true;
        activePlacedPointer.ghost.style.visibility = 'visible';
        activePlacedPointer.token.style.opacity = '.25';
      }
      activePlacedPointer.ghost.style.transform = `translate3d(${event.clientX - activePlacedPointer.startX}px, ${event.clientY - activePlacedPointer.startY}px, 0)`;
      const answerBounds = inputCell.getBoundingClientRect();
      if (activePlacedPointer.moved && pointInside(event.clientX, event.clientY, answerBounds, 4)) {
        const index = findReorderIndex(event.clientX, event.clientY, activePlacedPointer.state.id);
        showReorderPreview(activePlacedPointer, index);
      } else if (activePlacedPointer.reorderIndex !== null) {
        hideReorderPreview(activePlacedPointer);
      }
    }
  });

  const finishDrag = (event: PointerEvent, cancelled = false) => {
    if (!activePointer || activePointer.id !== event.pointerId) return;
    const { state, moved } = activePointer;
    state.dragging = false;
    delete state.element.dataset.dragging;
    const cellBounds = inputCell.getBoundingClientRect();
    const droppedOnCell = !cancelled
      && event.clientX >= cellBounds.left
      && event.clientX <= cellBounds.right
      && event.clientY >= cellBounds.top
      && event.clientY <= cellBounds.bottom;
    const insertionIndex = previewIndex ?? placedIds.length;
    if (!cancelled && (!moved || droppedOnCell)) placePiece(state, insertionIndex);
    if (moved && !droppedOnCell) {
      previewPiece(null);
      state.vx = 0;
      state.vy = 0;
      announce(`${state.value} rejoined the cluster.`);
    }
    suppressClickId = !cancelled ? state.id : null;
    window.setTimeout(() => { suppressClickId = null; }, 0);
    activePointer = null;
    requestTick();
  };

  document.addEventListener('pointerup', (event) => finishDrag(event));
  document.addEventListener('pointercancel', (event) => finishDrag(event, true));

  formulaOutput.addEventListener('pointerdown', (event) => {
    const token = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-placed-id]');
    const state = states.find((piece) => piece.id === token?.dataset.placedId);
    if (!token || !state || activePointer || activePlacedPointer) return;
    event.preventDefault();
    const bounds = token.getBoundingClientRect();
    const ghost = token.cloneNode(true) as HTMLButtonElement;
    ghost.removeAttribute('data-placed-id');
    ghost.classList.add('formula-token--dragging');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.tabIndex = -1;
    ghost.style.left = `${bounds.left}px`;
    ghost.style.top = `${bounds.top}px`;
    ghost.style.width = `${bounds.width}px`;
    const reorderPreview = document.createElement('span');
    reorderPreview.className = 'formula-token formula-token--preview formula-token--reorder';
    reorderPreview.setAttribute('aria-hidden', 'true');
    reorderPreview.style.minWidth = `${bounds.width}px`;
    setPieceContent(reorderPreview, state);
    root.append(ghost);
    activePlacedPointer = {
      state,
      token,
      ghost,
      id: event.pointerId,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      originalIndex: placedIds.indexOf(state.id),
      reorderIndex: null,
      reorderPreview,
    };
  });

  const finishPlacedDrag = (event: PointerEvent, cancelled = false) => {
    if (!activePlacedPointer || activePlacedPointer.id !== event.pointerId) return;
    const pointer = activePlacedPointer;
    const { state, token, ghost, moved, originalIndex, reorderIndex } = pointer;
    const clusterBounds = field.getBoundingClientRect();
    const answerBounds = inputCell.getBoundingClientRect();
    const droppedOnCluster = !cancelled && pointInside(event.clientX, event.clientY, clusterBounds);
    const droppedOnAnswer = !cancelled && moved && pointInside(event.clientX, event.clientY, answerBounds, 4);
    ghost.remove();
    pointer.reorderPreview.remove();
    token.style.opacity = '';
    token.hidden = false;
    if (!cancelled && !moved) {
      returnPiece(state.id);
    } else if (droppedOnCluster) {
      returnPiece(state.id);
    } else if (droppedOnAnswer && reorderIndex !== null) {
      placedIds.splice(originalIndex, 1);
      placedIds.splice(reorderIndex, 0, state.id);
      renderFormula();
      announce(`${state.value} moved to position ${reorderIndex + 1}.`);
    } else if (moved) {
      renderFormula();
      announce(`${state.value} remains in its original position.`);
    }
    if (cancelled) previewPiece(null);
    suppressPlacedClickId = !cancelled ? state.id : null;
    window.setTimeout(() => { suppressPlacedClickId = null; }, 0);
    activePlacedPointer = null;
  };

  document.addEventListener('pointerup', (event) => finishPlacedDrag(event));
  document.addEventListener('pointercancel', (event) => finishPlacedDrag(event, true));

  inputCell.addEventListener('click', (event) => {
    const placed = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-placed-id]');
    if (placed?.dataset.placedId) {
      if (suppressPlacedClickId === placed.dataset.placedId) return;
      returnPiece(placed.dataset.placedId);
      return;
    }
    selectedCell = true;
    inputCell.dataset.selected = 'true';
    announce('The answer is selected. Pick the next formula piece.');
  });

  inputCell.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if ((event.target as HTMLElement).matches('[data-placed-id]')) return;
    event.preventDefault();
    selectedCell = true;
    inputCell.dataset.selected = 'true';
    announce('The answer is selected. Pick the next formula piece.');
  });

  inputCell.addEventListener('dragover', (event) => event.preventDefault());

  clearButton.addEventListener('click', () => {
    [...placedIds].forEach(returnPiece);
    announce('Answer cleared.');
  });

  submitButton.addEventListener('click', () => {
    attempts += 1;
    attemptCount.textContent = String(attempts);
    if (attempts >= 5) {
      submitButton.disabled = true;
      announce('Five test submissions recorded. Formula checking comes later.');
      return;
    }
    announce(`Attempt ${attempts} recorded. ${5 - attempts} test submissions remain.`);
  });

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestTick();
    if (!visible && animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  });
  observer.observe(field);

  const resizeObserver = new ResizeObserver(() => {
    measureAndArrange();
    updateStrings();
  });
  resizeObserver.observe(field);

  const answerResizeObserver = new ResizeObserver(scheduleClusterClearance);
  answerResizeObserver.observe(inputCell);

  measureAndArrange();
  renderFormula();
  updateStrings();
  requestTick();
});
