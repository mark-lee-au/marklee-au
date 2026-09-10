type PieceKind = 'function' | 'range' | 'value' | 'syntax';
type DragEdge = 'top' | 'right' | 'bottom' | 'left' | null;

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
  homeX: number;
  homeY: number;
  dragging: boolean;
  hovered: boolean;
  used: boolean;
  dragAngle: number;
};

type HoverLock = {
  state: PieceState;
  clientLeft: number;
  clientTop: number;
  hitLeft: number;
  hitTop: number;
  hitRight: number;
  hitBottom: number;
};

type ClusterPointer = {
  state: PieceState;
  id: number;
  moved: boolean;
  startX: number;
  startY: number;
  grabOffsetX: number;
  grabOffsetY: number;
  targetX: number;
  targetY: number;
  targetAngle: number;
  edge: DragEdge;
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
  grabOffsetX: number;
  grabOffsetY: number;
  grabRatioX: number;
  grabRatioY: number;
  pointerX: number;
  pointerY: number;
  width: number;
  height: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  scale: number;
  targetScale: number;
  looseScale: number;
  zone: 'answer' | 'cluster';
  targetX: number;
  targetY: number;
  targetAngle: number;
  edge: DragEdge;
};

document.querySelectorAll<HTMLElement>('[data-formula-daily]').forEach((root) => {
  const canvas = root.querySelector<HTMLElement>('[data-formula-canvas]');
  let boardNotes = root.querySelector<HTMLElement>('[data-board-notes]');
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
  const sampleDataButton = root.querySelector<HTMLButtonElement>('[data-sample-data-open]');
  const sampleDataSheet = root.querySelector<HTMLElement>('[data-sample-data-sheet]');

  if (canvas && !boardNotes) {
    boardNotes = document.createElement('div');
    boardNotes.className = 'formula-canvas__notes';
    boardNotes.dataset.boardNotes = '';
    boardNotes.setAttribute('aria-hidden', 'true');
    canvas.prepend(boardNotes);
  }

  if (!canvas || !field || !cluster || !inputCell || !formulaOutput || !placeholder || !strings || !attemptCount || !status || !clearButton || !submitButton) return;

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
    homeX: 0,
    homeY: 0,
    dragging: false,
    hovered: false,
    used: false,
    dragAngle: 0,
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
  let hoverLock: HoverLock | null = null;
  let suppressClickId: string | null = null;
  let suppressPlacedClickId: string | null = null;
  let clusterLayoutFrame = 0;
  let lastFieldWidth = 0;
  let lastAnswerHeight = 66;
  let clusterEnergy = 0;
  let clusterBreathingInset = 32;

  const createSeededRandom = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const populateBoardNotes = () => {
    const dayKey = new Date().toISOString().slice(0, 10);
    const seed = [...dayKey].reduce((total, character, index) => total + character.charCodeAt(0) * (index + 7), 0);
    const random = createSeededRandom(seed);
    const lessons = [
      ['LESSON OF THE DAY\nConditional totals\nSUMIF = range + criteria', '11%', '13%', '-7deg', '23ch'],
      ['Remember\nCOUNTIF(range, criteria)\ntext criteria needs quotes', '66%', '11%', '5deg', '23ch'],
      ['Warm-up\nfind the range first\nthen choose the function', '7%', '62%', '-10deg', '21ch'],
      ['Board note\ncommas split arguments\nclose every bracket', '70%', '60%', '8deg', '20ch'],
      ['Today\x27s sheet\nA2:A5 = regions\nB2:B5 = units', '17%', '43%', '4deg', '18ch'],
      ['Quick rule\nSUM adds values\nAVERAGE = total / count', '55%', '39%', '-4deg', '21ch'],
      ['Example\n=COUNTIF(A2:A5, "East")', '30%', '70%', '-5deg', '27ch'],
      ['Homework\nbuild it left to right\nthen test your answer', '74%', '35%', '7deg', '20ch'],
    ];
    const positions = [...lessons].sort(() => random() - .5).slice(0, 4);
    const chalkPalette = ['#b8f4c9', '#b9ddff', '#ffc1d0', '#dcc8ff', '#ffe5ad'];
    const colourOffset = Math.floor(random() * chalkPalette.length);
    if (!boardNotes) return;
    boardNotes.replaceChildren();
    positions.forEach(([text, left, top, rotate, width], index) => {
      const note = document.createElement('span');
      note.className = 'formula-canvas__note';
      note.textContent = text;
      note.style.left = left;
      note.style.top = top;
      note.style.maxWidth = width;
      note.style.setProperty('--note-rotate', rotate);
      note.style.setProperty('--note-colour', chalkPalette[(colourOffset + index) % chalkPalette.length]);
      note.style.opacity = index === 0 ? '.16' : index === 1 ? '.11' : '.08';
      boardNotes.append(note);
    });
  };

  const announce = (message: string) => { status.textContent = message; };

  const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

  const getBaseTilt = (state: PieceState) => ((states.indexOf(state) * 7) % 11) - 5;

  const getCanvasDragBounds = () => {
    const bounds = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);
    const leftInset = Number.parseFloat(style.borderLeftWidth) + 5;
    const rightInset = Number.parseFloat(style.borderRightWidth) + 5;
    const topInset = Number.parseFloat(style.borderTopWidth) + 5;
    const bottomInset = Number.parseFloat(style.borderBottomWidth) + 5;
    return {
      left: bounds.left + leftInset,
      right: bounds.right - rightInset,
      top: bounds.top + topInset,
      bottom: bounds.bottom - bottomInset,
    };
  };

  const releaseHoverLock = (state: PieceState | null = null) => {
    if (!hoverLock || (state && hoverLock.state !== state)) return;
    hoverLock.state.hovered = false;
    hoverLock = null;
    requestTick();
  };

  const HOVER_HIT_SLOP = 5;

  const pointerInsideHoverLock = (clientX: number, clientY: number) => (
    Boolean(hoverLock)
    && clientX >= (hoverLock?.hitLeft ?? 0)
    && clientX <= (hoverLock?.hitRight ?? 0)
    && clientY >= (hoverLock?.hitTop ?? 0)
    && clientY <= (hoverLock?.hitBottom ?? 0)
  );

  const pinHoveredPiece = (state: PieceState) => {
    if (state.used || state.dragging) return;
    if (hoverLock?.state !== state) releaseHoverLock();
    const bounds = state.element.getBoundingClientRect();
    const fieldBounds = field.getBoundingClientRect();
    state.hovered = true;
    state.vx = 0;
    state.vy = 0;
    hoverLock = {
      state,
      // Anchor the piece at its actual transform origin rather than the rotated
      // bounding box. This keeps hover visual-only and avoids a positional pop.
      clientLeft: fieldBounds.left + state.x,
      clientTop: fieldBounds.top + state.y,
      hitLeft: bounds.left - HOVER_HIT_SLOP,
      hitTop: bounds.top - HOVER_HIT_SLOP,
      hitRight: bounds.right + HOVER_HIT_SLOP,
      hitBottom: bounds.bottom + HOVER_HIT_SLOP,
    };
  };

  const syncHoveredPieceToViewport = (fieldBounds = field.getBoundingClientRect()) => {
    if (!hoverLock || hoverLock.state.used || hoverLock.state.dragging) return;
    const state = hoverLock.state;
    const canvasBounds = getCanvasDragBounds();
    const minX = canvasBounds.left - fieldBounds.left;
    const maxX = canvasBounds.right - fieldBounds.left - state.width;
    const minY = canvasBounds.top - fieldBounds.top;
    const maxY = canvasBounds.bottom - fieldBounds.top - state.height;
    state.x = clamp(hoverLock.clientLeft - fieldBounds.left, minX, maxX);
    state.y = clamp(hoverLock.clientTop - fieldBounds.top, minY, maxY);
    state.vx = 0;
    state.vy = 0;
    setPosition(state);
  };

  const pickEdge = (rawX: number, rawY: number, minX: number, maxX: number, minY: number, maxY: number): DragEdge => {
    const candidates: Array<[Exclude<DragEdge, null>, number]> = [];
    const left = minX - rawX;
    const right = rawX - maxX;
    const top = minY - rawY;
    const bottom = rawY - maxY;
    if (left > 0) candidates.push(['left', left]);
    if (right > 0) candidates.push(['right', right]);
    if (top > 0) candidates.push(['top', top]);
    if (bottom > 0) candidates.push(['bottom', bottom]);
    if (!candidates.length) return null;
    candidates.sort((a, b) => b[1] - a[1]);
    return candidates[0][0];
  };

  const edgeAngle = (state: PieceState, edge: DragEdge, overshoot = 0) => {
    const base = getBaseTilt(state);
    const pull = Math.min(12, 4 + overshoot * .04);
    if (edge === 'left') return base - pull;
    if (edge === 'right') return base + pull;
    if (edge === 'top') return base - Math.min(5, pull * .45);
    if (edge === 'bottom') return base + Math.min(5, pull * .45);
    return base;
  };

  const getClusterDragTarget = (state: PieceState, clientX: number, clientY: number, grabOffsetX: number, grabOffsetY: number) => {
    const fieldBounds = field.getBoundingClientRect();
    const canvasBounds = getCanvasDragBounds();
    const minX = canvasBounds.left - fieldBounds.left;
    const maxX = canvasBounds.right - fieldBounds.left - state.width;
    const minY = canvasBounds.top - fieldBounds.top;
    const maxY = canvasBounds.bottom - fieldBounds.top - state.height;
    const rawX = clientX - fieldBounds.left - grabOffsetX;
    const rawY = clientY - fieldBounds.top - grabOffsetY;
    const edge = pickEdge(rawX, rawY, minX, maxX, minY, maxY);
    const overshoot = edge === 'left' ? minX - rawX
      : edge === 'right' ? rawX - maxX
        : edge === 'top' ? minY - rawY
          : edge === 'bottom' ? rawY - maxY
            : 0;
    return {
      x: clamp(rawX, minX, maxX),
      y: clamp(rawY, minY, maxY),
      edge,
      angle: edgeAngle(state, edge, overshoot),
      minX,
      maxX,
      minY,
      maxY,
    };
  };

  const getViewportDragTarget = (state: PieceState, width: number, height: number, clientX: number, clientY: number, grabOffsetX: number, grabOffsetY: number) => {
    const canvasBounds = getCanvasDragBounds();
    const minX = canvasBounds.left;
    const maxX = canvasBounds.right - width;
    const minY = canvasBounds.top;
    const maxY = canvasBounds.bottom - height;
    const rawX = clientX - grabOffsetX;
    const rawY = clientY - grabOffsetY;
    const edge = pickEdge(rawX, rawY, minX, maxX, minY, maxY);
    const overshoot = edge === 'left' ? minX - rawX
      : edge === 'right' ? rawX - maxX
        : edge === 'top' ? minY - rawY
          : edge === 'bottom' ? rawY - maxY
            : 0;
    return {
      x: clamp(rawX, minX, maxX),
      y: clamp(rawY, minY, maxY),
      edge,
      angle: edgeAngle(state, edge, overshoot),
    };
  };

  const setEdgeContact = (element: HTMLElement | null, edge: DragEdge) => {
    if (edge && element) element.dataset.edge = edge;
    else if (element) delete element.dataset.edge;
    if (edge) {
      canvas.dataset.edgeActive = 'true';
      canvas.dataset.edge = edge;
    } else {
      delete canvas.dataset.edgeActive;
      delete canvas.dataset.edge;
    }
  };

  const overlapRatio = (left: number, top: number, width: number, height: number, bounds: DOMRect) => {
    const overlapWidth = Math.max(0, Math.min(left + width, bounds.right) - Math.max(left, bounds.left));
    const overlapHeight = Math.max(0, Math.min(top + height, bounds.bottom) - Math.max(top, bounds.top));
    return (overlapWidth * overlapHeight) / Math.max(1, width * height);
  };

  const stateOverAnswer = (state: PieceState) => {
    const fieldBounds = field.getBoundingClientRect();
    const answerBounds = inputCell.getBoundingClientRect();
    const left = fieldBounds.left + state.x;
    const top = fieldBounds.top + state.y;
    const centreX = left + state.width / 2;
    const centreY = top + state.height / 2;
    return pointInside(centreX, centreY, answerBounds, 7)
      || overlapRatio(left, top, state.width, state.height, answerBounds) >= .28;
  };

  const CLUSTER_PAD_X = 7;
  const CLUSTER_PAD_Y = 6;
  const CLUSTER_MIN_GAP_X = 10;
  const CLUSTER_MAX_GAP_X = 24;
  const CLUSTER_GAP_Y = 12;
  const CLUSTER_MOTION_PAD_Y = 14;
  const CLUSTER_COLLISION_GAP = 10;
  const CLUSTER_GRAVITY_PULL = .0007;
  const CLUSTER_WANDER_FORCE = .004;
  const CLUSTER_DAMPING = .91;
  const CLUSTER_SLEEP_SPEED = .035;
  const CLUSTER_MAX_SPEED = 7.5;
  const CLUSTER_ENERGY_DECAY = .982;
  const CLUSTER_ENERGY_SLEEP = .025;

  const getClusterBreathingInset = (pieceCount: number, rowCount: number) => (
    clamp(18 + pieceCount * .8 + Math.max(0, rowCount - 2) * 5, 28, 52)
  );

  const syncClusterHeight = () => {
    const available = states.filter((state) => !state.used);
    const bottom = available.length
      ? Math.max(...available.map((state) => state.homeY + state.height))
      : 0;
    const nextHeight = Math.max(18, Math.ceil(bottom + CLUSTER_PAD_Y + clusterBreathingInset));
    cluster.style.setProperty('--cluster-height', `${nextHeight}px`);
  };

  const scheduleClusterHeight = () => {
    if (clusterLayoutFrame) cancelAnimationFrame(clusterLayoutFrame);
    clusterLayoutFrame = requestAnimationFrame(() => {
      clusterLayoutFrame = 0;
      syncClusterHeight();
    });
  };

  const disturbCluster = (amount: number) => {
    if (reducedMotion || amount <= 1) return;
    const strength = Math.min(3.2, .8 + amount * .055);
    states.filter((state) => !state.used && !state.dragging && !state.hovered).forEach((state, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      state.vx += direction * strength * (.2 + (index % 3) * .08);
      state.vy += strength * (.45 + (index % 4) * .08);
    });
    clusterEnergy = Math.max(clusterEnergy, 1);
    requestTick();
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
    const tilt = state.dragging ? state.dragAngle : getBaseTilt(state);
    state.element.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${tilt}deg)`;
  };

  const getCollisionDimensions = (state: PieceState) => {
    const angle = Math.abs((state.dragging ? state.dragAngle : getBaseTilt(state)) * Math.PI / 180);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    return {
      width: state.width * cosine + state.height * sine,
      height: state.height * cosine + state.width * sine,
    };
  };

  const measureLoosePiece = (state: PieceState) => {
    const wasHidden = state.element.hidden;
    const previousVisibility = state.element.style.visibility;
    if (wasHidden) {
      state.element.style.visibility = 'hidden';
      state.element.hidden = false;
    }
    const width = state.element.offsetWidth;
    const height = state.element.offsetHeight;
    if (width > 0) state.width = width;
    if (height > 0) state.height = height;
    if (wasHidden) {
      state.element.hidden = true;
      state.element.style.visibility = previousVisibility;
    }
  };

  const packCluster = () => {
    const width = field.getBoundingClientRect().width;
    if (width <= 0) return;
    lastFieldWidth = width;

    const available = states.filter((state) => !state.used);
    available.forEach((state) => measureLoosePiece(state));

    type PackedRow = { states: PieceState[]; width: number; height: number };
    const rows: PackedRow[] = [];
    let row: PackedRow = { states: [], width: 0, height: 0 };
    const usableWidth = Math.max(80, width - CLUSTER_PAD_X * 2);

    available.forEach((state) => {
      const proposed = row.states.length
        ? row.width + CLUSTER_MIN_GAP_X + state.width
        : state.width;
      if (row.states.length && proposed > usableWidth) {
        rows.push(row);
        row = { states: [], width: 0, height: 0 };
      }
      row.width = row.states.length
        ? row.width + CLUSTER_MIN_GAP_X + state.width
        : state.width;
      row.height = Math.max(row.height, state.height);
      row.states.push(state);
    });
    if (row.states.length) rows.push(row);

    clusterBreathingInset = getClusterBreathingInset(available.length, rows.length);
    let y = CLUSTER_PAD_Y + clusterBreathingInset;
    rows.forEach((packedRow, rowIndex) => {
      const totalPieceWidth = packedRow.states.reduce((sum, state) => sum + state.width, 0);
      const isLastRow = rowIndex === rows.length - 1;
      const flexibleGap = packedRow.states.length > 1
        ? clamp((usableWidth - totalPieceWidth) / (packedRow.states.length - 1), CLUSTER_MIN_GAP_X, CLUSTER_MAX_GAP_X)
        : 0;
      const gap = isLastRow ? Math.min(flexibleGap, 14) : flexibleGap;
      const rowWidth = totalPieceWidth + gap * Math.max(0, packedRow.states.length - 1);
      let x = Math.max(CLUSTER_PAD_X, (width - rowWidth) / 2);

      packedRow.states.forEach((state) => {
        const stateIndex = states.indexOf(state);
        const jitterX = ((stateIndex * 7 + rowIndex * 3) % 5) - 2;
        const jitterY = ((stateIndex * 5 + rowIndex * 2) % 3) - 1;
        state.x = clamp(x + jitterX, 0, Math.max(0, width - state.width));
        state.y = Math.max(0, y + jitterY);
        state.homeX = state.x;
        state.homeY = state.y;
        state.vx = 0;
        state.vy = 0;
        setPosition(state);
        x += state.width + gap;
      });
      y += packedRow.height + CLUSTER_GAP_Y;
    });

    cluster.style.setProperty('--cluster-height', `${Math.max(18, Math.ceil(y - CLUSTER_GAP_Y + CLUSTER_PAD_Y + clusterBreathingInset))}px`);
    updateStrings();
  };

  const syncInputHeight = () => {
    const previousTarget = lastAnswerHeight;
    const nextHeight = Math.max(66, Math.ceil(formulaOutput.scrollHeight + 30));
    if (!inputCell.style.height) {
      inputCell.style.height = `${Math.max(66, Math.round(inputCell.getBoundingClientRect().height))}px`;
      void inputCell.offsetHeight;
    }
    inputCell.style.height = `${nextHeight}px`;
    if (nextHeight > previousTarget + 1) disturbCluster(nextHeight - previousTarget);
    lastAnswerHeight = nextHeight;
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
    scheduleClusterHeight();
  };

  const placePiece = (state: PieceState, index = placedIds.length) => {
    if (!selectedCell || state.used) return;
    releaseHoverLock(state);
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
    const bounds = field.getBoundingClientRect();
    state.used = false;
    state.dragging = false;
    state.dragAngle = getBaseTilt(state);
    state.x = clamp(state.x, 0, Math.max(0, bounds.width - state.width));
    state.y = clamp(state.y, 0, Math.max(0, bounds.height - state.height));
    state.element.hidden = false;
    state.vx = (Math.random() - .5) * .5;
    state.vy = 0;
    setPosition(state);
    renderFormula();
    scheduleClusterHeight();
    announce(`${state.value} returned to the cluster.`);
    clusterEnergy = Math.max(clusterEnergy, .9);
    requestTick();
  };

  const returnPlacedPieceAtDrop = (pointer: PlacedPointer, clientX: number, clientY: number, onSettled: () => void) => {
    const { state, ghost } = pointer;
    const index = placedIds.indexOf(state.id);
    if (index < 0) {
      onSettled();
      return;
    }

    const finalGhostWidth = pointer.width * pointer.looseScale;
    const finalGhostHeight = pointer.height * pointer.looseScale;
    const finalGhostTarget = getViewportDragTarget(
      state,
      finalGhostWidth,
      finalGhostHeight,
      clientX,
      clientY,
      pointer.grabRatioX * finalGhostWidth,
      pointer.grabRatioY * finalGhostHeight,
    );
    if (!reducedMotion) {
      ghost.style.transition = 'left 90ms cubic-bezier(.2,.8,.25,1), top 90ms cubic-bezier(.2,.8,.25,1), transform 90ms cubic-bezier(.2,.8,.25,1), filter 120ms ease, box-shadow 120ms ease';
    }
    ghost.style.left = `${finalGhostTarget.x}px`;
    ghost.style.top = `${finalGhostTarget.y}px`;
    ghost.style.transform = `rotate(${finalGhostTarget.angle}deg) scale(${pointer.looseScale})`;

    placedIds.splice(index, 1);
    previewId = null;
    previewIndex = null;
    state.used = true;
    state.dragging = false;
    state.element.hidden = true;
    state.vx = 0;
    state.vy = 0;
    renderFormula();
    announce(`${state.value} returned to the cluster.`);

    requestAnimationFrame(() => {
      const fieldBounds = field.getBoundingClientRect();
      const canvasBounds = getCanvasDragBounds();
      const minX = canvasBounds.left - fieldBounds.left;
      const maxX = canvasBounds.right - fieldBounds.left - state.width;
      const minY = canvasBounds.top - fieldBounds.top;
      const maxY = canvasBounds.bottom - fieldBounds.top - state.height;
      const rawX = clientX - fieldBounds.left - pointer.grabRatioX * state.width;
      const rawY = clientY - fieldBounds.top - pointer.grabRatioY * state.height;

      state.x = clamp(rawX, minX, maxX);
      state.y = clamp(rawY, minY, maxY);
      state.dragAngle = getBaseTilt(state);
      state.used = false;
      state.element.hidden = false;
      state.vx = 0;
      state.vy = 0;
      setPosition(state);
      pushPiecesFromBody(fieldBounds.left + state.x, fieldBounds.top + state.y, state.width, state.height);
      syncClusterHeight();
      updateStrings();
      onSettled();
      clusterEnergy = Math.max(clusterEnergy, 1);
      requestTick();
    });
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

  type NeighbourLink = {
    state: PieceState;
    neighbour: PieceState;
    dx: number;
    dy: number;
    distance: number;
    edgeGap: number;
  };

  const getNeighbourLink = (state: PieceState, active: PieceState[]): NeighbourLink | null => {
    let best: NeighbourLink | null = null;
    const stateCentreX = state.x + state.width / 2;
    const stateCentreY = state.y + state.height / 2;

    active.forEach((candidate) => {
      if (candidate === state) return;
      const dx = (candidate.x + candidate.width / 2) - stateCentreX;
      const dy = (candidate.y + candidate.height / 2) - stateCentreY;
      const distance = Math.max(.001, Math.hypot(dx, dy));
      const unitX = Math.abs(dx) / distance;
      const unitY = Math.abs(dy) / distance;
      const stateExtent = unitX * state.width / 2 + unitY * state.height / 2;
      const candidateExtent = unitX * candidate.width / 2 + unitY * candidate.height / 2;
      const edgeGap = distance - stateExtent - candidateExtent;
      if (!best || edgeGap < best.edgeGap || (Math.abs(edgeGap - best.edgeGap) < .5 && distance < best.distance)) {
        best = { state, neighbour: candidate, dx, dy, distance, edgeGap };
      }
    });

    return best;
  };

  const updateStrings = () => {
    const active = states.filter((state) => !state.used && !state.dragging);
    strings.replaceChildren();
    const drawn = new Set<string>();

    active.forEach((state) => {
      const link = getNeighbourLink(state, active);
      if (!link) return;
      const key = [state.id, link.neighbour.id].sort().join(':');
      if (drawn.has(key)) return;
      drawn.add(key);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.dataset.link = key;
      line.setAttribute('x1', String(state.x + state.width / 2));
      line.setAttribute('y1', String(state.y + state.height / 2));
      line.setAttribute('x2', String(link.neighbour.x + link.neighbour.width / 2));
      line.setAttribute('y2', String(link.neighbour.y + link.neighbour.height / 2));
      line.style.setProperty('--link-gap', String(Math.max(0, link.edgeGap)));
      strings.append(line);
    });
  };

  const clearAnswerDropState = () => {
    delete inputCell.dataset.dropActive;
  };

  const updateClusterDragPreview = (pointer: ClusterPointer) => {
    if (!pointer.moved || !stateOverAnswer(pointer.state)) {
      if (previewId === pointer.state.id) previewPiece(null);
      clearAnswerDropState();
      return;
    }
    const fieldBounds = field.getBoundingClientRect();
    const centreX = fieldBounds.left + pointer.state.x + pointer.state.width / 2;
    const centreY = fieldBounds.top + pointer.state.y + pointer.state.height / 2;
    const index = findReorderIndex(centreX, centreY, '');
    if (previewId !== pointer.state.id || previewIndex !== index) previewPiece(pointer.state, index);
    inputCell.dataset.dropActive = 'true';
  };

  const updatePlacedDragZone = (pointer: PlacedPointer) => {
    const answerBounds = inputCell.getBoundingClientRect();
    const projectedX = pointer.pointerX - pointer.grabRatioX * pointer.width;
    const projectedY = pointer.pointerY - pointer.grabRatioY * pointer.height;
    const centreX = projectedX + pointer.width / 2;
    const centreY = projectedY + pointer.height / 2;
    const overlap = overlapRatio(projectedX, projectedY, pointer.width, pointer.height, answerBounds);
    const overAnswer = pointer.zone === 'answer'
      ? pointInside(centreX, centreY, answerBounds) || overlap >= .12
      : pointInside(centreX, centreY, answerBounds, 5) || overlap >= .32;
    const nextZone = overAnswer ? 'answer' : 'cluster';
    if (nextZone === pointer.zone) return;
    pointer.zone = nextZone;
    pointer.targetScale = nextZone === 'answer' ? 1 : pointer.looseScale;
    pointer.ghost.dataset.dragZone = nextZone;
  };

  const updatePlacedDragInteraction = (pointer: PlacedPointer) => {
    if (!pointer.moved) return;
    const visualWidth = pointer.width * pointer.scale;
    const visualHeight = pointer.height * pointer.scale;
    const centreX = pointer.x + visualWidth / 2;
    const centreY = pointer.y + visualHeight / 2;
    if (pointer.zone === 'answer') {
      const index = findReorderIndex(centreX, centreY, pointer.state.id);
      showReorderPreview(pointer, index);
      inputCell.dataset.dropActive = 'true';
    } else {
      if (pointer.reorderIndex !== null) hideReorderPreview(pointer);
      clearAnswerDropState();
    }
  };

  const angularDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

  const advanceClusterPointer = (pointer: ClusterPointer) => {
    const state = pointer.state;
    const dx = pointer.targetX - state.x;
    const dy = pointer.targetY - state.y;
    const distance = Math.hypot(dx, dy);
    const follow = distance > 220 ? .2 : .48;
    state.vx = state.vx * .34 + dx * follow;
    state.vy = state.vy * .34 + dy * follow;
    const speed = Math.hypot(state.vx, state.vy);
    const maxSpeed = distance > 220 ? 72 : Math.max(18, Math.min(54, distance * .9));
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      state.vx *= scale;
      state.vy *= scale;
    }
    state.x += state.vx;
    state.y += state.vy;

    const fieldBounds = field.getBoundingClientRect();
    const canvasBounds = getCanvasDragBounds();
    const minX = canvasBounds.left - fieldBounds.left;
    const maxX = canvasBounds.right - fieldBounds.left - state.width;
    const minY = canvasBounds.top - fieldBounds.top;
    const maxY = canvasBounds.bottom - fieldBounds.top - state.height;
    state.x = clamp(state.x, minX, maxX);
    state.y = clamp(state.y, minY, maxY);
    state.dragAngle += angularDelta(state.dragAngle, pointer.targetAngle) * .28;
    if (distance < .35) {
      state.x = pointer.targetX;
      state.y = pointer.targetY;
    }
    setPosition(state);
    updateClusterDragPreview(pointer);
  };

  const advancePlacedPointer = (pointer: PlacedPointer) => {
    if (!pointer.moved) return;
    pointer.scale += (pointer.targetScale - pointer.scale) * .36;
    if (Math.abs(pointer.targetScale - pointer.scale) < .006) pointer.scale = pointer.targetScale;

    const visualWidth = pointer.width * pointer.scale;
    const visualHeight = pointer.height * pointer.scale;
    const target = getViewportDragTarget(
      pointer.state,
      visualWidth,
      visualHeight,
      pointer.pointerX,
      pointer.pointerY,
      pointer.grabRatioX * visualWidth,
      pointer.grabRatioY * visualHeight,
    );
    pointer.targetX = target.x;
    pointer.targetY = target.y;
    pointer.targetAngle = target.angle;
    pointer.edge = target.edge;
    setEdgeContact(pointer.ghost, pointer.edge);

    const dx = pointer.targetX - pointer.x;
    const dy = pointer.targetY - pointer.y;
    const distance = Math.hypot(dx, dy);
    const follow = distance > 220 ? .2 : .48;
    pointer.vx = pointer.vx * .34 + dx * follow;
    pointer.vy = pointer.vy * .34 + dy * follow;
    const speed = Math.hypot(pointer.vx, pointer.vy);
    const maxSpeed = distance > 220 ? 72 : Math.max(18, Math.min(54, distance * .9));
    if (speed > maxSpeed) {
      const velocityScale = maxSpeed / speed;
      pointer.vx *= velocityScale;
      pointer.vy *= velocityScale;
    }
    pointer.x += pointer.vx;
    pointer.y += pointer.vy;

    const bounds = getCanvasDragBounds();
    pointer.x = clamp(pointer.x, bounds.left, bounds.right - visualWidth);
    pointer.y = clamp(pointer.y, bounds.top, bounds.bottom - visualHeight);
    pointer.angle += angularDelta(pointer.angle, pointer.targetAngle) * .28;
    if (distance < .35) {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
    }
    pointer.ghost.style.left = `${pointer.x}px`;
    pointer.ghost.style.top = `${pointer.y}px`;
    pointer.ghost.style.transform = `rotate(${pointer.angle}deg) scale(${pointer.scale})`;
    updatePlacedDragInteraction(pointer);
  };

  const pushPiecesFromBody = (left: number, top: number, width: number, height: number) => {
    const fieldBounds = field.getBoundingClientRect();
    const bodyX = left - fieldBounds.left;
    const bodyY = top - fieldBounds.top;
    let pushed = false;
    states.filter((state) => !state.used && !state.dragging && !state.hovered).forEach((state) => {
      const dx = (state.x + state.width / 2) - (bodyX + width / 2);
      const dy = (state.y + state.height / 2) - (bodyY + height / 2);
      const overlapX = (state.width + width) / 2 + 10 - Math.abs(dx);
      const overlapY = (state.height + height) / 2 + 10 - Math.abs(dy);
      if (overlapX <= 0 || overlapY <= 0) return;
      const force = .055;
      if (overlapX < overlapY) {
        state.vx += overlapX * force * (dx >= 0 ? 1 : -1);
      } else {
        state.vy += overlapY * force * (dy >= 0 ? 1 : -1);
      }
      pushed = true;
    });
    if (pushed) clusterEnergy = Math.max(clusterEnergy, .9);
  };

  const resolveClusterCollisions = (active: PieceState[], fieldWidth: number, fieldHeight: number) => {
    const collisionGap = CLUSTER_COLLISION_GAP;
    const iterations = 10;
    let hadCorrections = false;

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      let corrected = false;

      for (let first = 0; first < active.length; first += 1) {
        for (let second = first + 1; second < active.length; second += 1) {
          const a = active[first];
          const b = active[second];
          const aPinned = a.dragging || a.hovered;
          const bPinned = b.dragging || b.hovered;
          if (aPinned && bPinned) continue;

          const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
          const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
          const aCollision = getCollisionDimensions(a);
          const bCollision = getCollisionDimensions(b);
          const overlapX = (aCollision.width + bCollision.width) / 2 + collisionGap - Math.abs(dx);
          const overlapY = (aCollision.height + bCollision.height) / 2 + collisionGap - Math.abs(dy);
          if (overlapX <= 0 || overlapY <= 0) continue;

          corrected = true;
          hadCorrections = true;
          const separateX = overlapX <= overlapY;
          const direction = separateX ? (dx >= 0 ? 1 : -1) : (dy >= 0 ? 1 : -1);
          const penetration = (separateX ? overlapX : overlapY) + .25;
          const movable = Number(!aPinned) + Number(!bPinned);
          if (!movable) continue;
          const aShare = aPinned ? 0 : penetration / movable;
          const bShare = bPinned ? 0 : penetration / movable;

          if (separateX) {
            a.x -= aShare * direction;
            b.x += bShare * direction;
          } else {
            a.y -= aShare * direction;
            b.y += bShare * direction;
          }

          if (!aPinned) {
            a.x = clamp(a.x, 0, Math.max(0, fieldWidth - a.width));
            a.y = clamp(a.y, 0, Math.max(0, fieldHeight - a.height));
          }
          if (!bPinned) {
            b.x = clamp(b.x, 0, Math.max(0, fieldWidth - b.width));
            b.y = clamp(b.y, 0, Math.max(0, fieldHeight - b.height));
          }
        }
      }

      if (!corrected) break;
    }

    return hadCorrections;
  };

  const clusterHasOverlap = (active: PieceState[]) => {
    for (let first = 0; first < active.length; first += 1) {
      for (let second = first + 1; second < active.length; second += 1) {
        const a = active[first];
        const b = active[second];
        const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
        const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
        const aCollision = getCollisionDimensions(a);
        const bCollision = getCollisionDimensions(b);
        const overlapX = (aCollision.width + bCollision.width) / 2 + CLUSTER_COLLISION_GAP - Math.abs(dx);
        const overlapY = (aCollision.height + bCollision.height) / 2 + CLUSTER_COLLISION_GAP - Math.abs(dy);
        if (overlapX > .2 && overlapY > .2) return true;
      }
    }
    return false;
  };

  const tick = (time: number) => {
    animationFrame = 0;
    if (!visible || reducedMotion) return;
    const bounds = field.getBoundingClientRect();
    const active = states.filter((state) => !state.used);
    const centreX = bounds.width / 2;
    const centreY = bounds.height / 2;

    // Preserve the current constrained drag/answer mechanics, but use the live
    // build's original loose-label physics for every other piece.
    syncHoveredPieceToViewport(bounds);
    if (activePointer) advanceClusterPointer(activePointer);
    if (activePlacedPointer) {
      advancePlacedPointer(activePlacedPointer);
      if (activePlacedPointer.moved) {
        pushPiecesFromBody(
          activePlacedPointer.x,
          activePlacedPointer.y,
          activePlacedPointer.width * activePlacedPointer.scale,
          activePlacedPointer.height * activePlacedPointer.scale,
        );
      }
    }

    // Original live movement model: a weak centre pull plus tiny organic drift.
    // Hovered pieces are the only current-version exception because they are
    // intentionally pinned to prevent answer-wrap hover flicker.
    active.forEach((state, index) => {
      if (state.dragging || state.hovered) return;
      const stateCentreX = state.x + state.width / 2;
      const stateCentreY = state.y + state.height / 2;
      state.vx += (centreX - stateCentreX) * .0007 + Math.sin(time / 1700 + index * 1.9) * .004;
      state.vy += (centreY - stateCentreY) * .0007 + Math.cos(time / 1900 + index * 1.3) * .004;
    });

    // Original live collision impulse. There is deliberately no positional
    // overlap resolver here: contacted labels push and slide around one another
    // rather than being snapped to a mathematically separated position.
    for (let first = 0; first < active.length; first += 1) {
      for (let second = first + 1; second < active.length; second += 1) {
        const a = active[first];
        const b = active[second];
        const aPinned = a.dragging || a.hovered;
        const bPinned = b.dragging || b.hovered;
        if (aPinned && bPinned) continue;
        const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
        const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
        const overlapX = (a.width + b.width) / 2 + 10 - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + 10 - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        const force = .035;
        if (overlapX < overlapY) {
          const direction = dx >= 0 ? 1 : -1;
          if (!aPinned) a.vx -= overlapX * force * direction;
          if (!bPinned) b.vx += overlapX * force * direction;
        } else {
          const direction = dy >= 0 ? 1 : -1;
          if (!aPinned) a.vy -= overlapY * force * direction;
          if (!bPinned) b.vy += overlapY * force * direction;
        }
      }
    }

    // Original live damping and boundary clamp. Continuous centre gravity means
    // displaced labels glide back toward the group instead of targeting a saved
    // home coordinate.
    active.forEach((state) => {
      if (state.dragging || state.hovered) return;
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
    if (!state) return;
    pinHoveredPiece(state);
    previewPiece(state);
  });

  field.addEventListener('pointerout', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    if (!button || button.contains(event.relatedTarget as Node | null) || activePointer) return;
    const state = states.find((piece) => piece.id === button.dataset.pieceId);
    if (!state) return;

    // Keep the active hover anchored to the original, non-moving hit area.
    // The visual piece can glow/lift or be compensated for answer-layout movement
    // without moving the pointer outside the interaction target.
    if (hoverLock?.state === state && pointerInsideHoverLock(event.clientX, event.clientY)) return;

    releaseHoverLock(state);
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
    releaseHoverLock(state);
    previewPiece(null);
    const bounds = button.getBoundingClientRect();
    state.dragging = true;
    state.dragAngle = getBaseTilt(state);
    state.vx = 0;
    state.vy = 0;
    state.element.dataset.dragging = 'true';
    cluster.dataset.dragging = 'true';
    try { button.setPointerCapture(event.pointerId); } catch { /* pointer capture is best effort */ }
    activePointer = {
      state,
      id: event.pointerId,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      grabOffsetX: event.clientX - bounds.left,
      grabOffsetY: event.clientY - bounds.top,
      targetX: state.x,
      targetY: state.y,
      targetAngle: state.dragAngle,
      edge: null,
    };
    requestTick();
  });

  document.addEventListener('pointermove', (event) => {
    if (hoverLock && !activePointer && !activePlacedPointer && !pointerInsideHoverLock(event.clientX, event.clientY)) {
      const releasedId = hoverLock.state.id;
      releaseHoverLock();
      if (previewId === releasedId) previewPiece(null);
    }

    if (activePointer && activePointer.id === event.pointerId) {
      event.preventDefault();
      const pointer = activePointer;
      const state = pointer.state;
      if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 5) pointer.moved = true;
      const target = getClusterDragTarget(state, event.clientX, event.clientY, pointer.grabOffsetX, pointer.grabOffsetY);
      pointer.targetX = target.x;
      pointer.targetY = target.y;
      pointer.targetAngle = target.angle;
      pointer.edge = target.edge;
      setEdgeContact(state.element, pointer.edge);
      if (reducedMotion) {
        state.x = target.x;
        state.y = target.y;
        state.dragAngle = target.angle;
        setPosition(state);
        updateClusterDragPreview(pointer);
        updateStrings();
      } else {
        requestTick();
      }
      return;
    }

    if (activePlacedPointer && activePlacedPointer.id === event.pointerId) {
      event.preventDefault();
      const pointer = activePlacedPointer;
      const distance = Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY);
      if (distance > 5 && !pointer.moved) {
        pointer.moved = true;
        pointer.ghost.style.visibility = 'visible';
        pointer.token.style.opacity = '.25';
      }
      pointer.pointerX = event.clientX;
      pointer.pointerY = event.clientY;
      updatePlacedDragZone(pointer);
      if (reducedMotion) {
        pointer.scale = pointer.targetScale;
        const visualWidth = pointer.width * pointer.scale;
        const visualHeight = pointer.height * pointer.scale;
        const target = getViewportDragTarget(
          pointer.state,
          visualWidth,
          visualHeight,
          pointer.pointerX,
          pointer.pointerY,
          pointer.grabRatioX * visualWidth,
          pointer.grabRatioY * visualHeight,
        );
        pointer.x = target.x;
        pointer.y = target.y;
        pointer.angle = target.angle;
        pointer.edge = target.edge;
        setEdgeContact(pointer.ghost, pointer.edge);
        pointer.ghost.style.left = `${pointer.x}px`;
        pointer.ghost.style.top = `${pointer.y}px`;
        pointer.ghost.style.transform = `rotate(${pointer.angle}deg) scale(${pointer.scale})`;
        updatePlacedDragInteraction(pointer);
      } else {
        requestTick();
      }
    }
  });

  const finishDrag = (event: PointerEvent, cancelled = false) => {
    if (!activePointer || activePointer.id !== event.pointerId) return;
    const pointer = activePointer;
    const { state, moved } = pointer;
    const droppedOnCell = !cancelled && moved && stateOverAnswer(state);
    const insertionIndex = previewIndex ?? placedIds.length;
    try {
      if (state.element.hasPointerCapture(event.pointerId)) state.element.releasePointerCapture(event.pointerId);
    } catch { /* capture may already be released */ }
    setEdgeContact(state.element, null);
    clearAnswerDropState();
    state.dragging = false;
    state.dragAngle = getBaseTilt(state);
    delete state.element.dataset.dragging;
    delete cluster.dataset.dragging;

    if (!cancelled && (!moved || droppedOnCell)) {
      placePiece(state, insertionIndex);
    } else {
      previewPiece(null);
      if (moved && !cancelled) {
        state.vx = 0;
        state.vy = 0;
          syncClusterHeight();
        announce(`${state.value} rejoined the cluster.`);
      }
      if (!state.used) setPosition(state);
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
    measureLoosePiece(state);
    const bounds = token.getBoundingClientRect();
    const ghost = token.cloneNode(true) as HTMLButtonElement;
    ghost.removeAttribute('data-placed-id');
    ghost.classList.add('formula-token--dragging');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.tabIndex = -1;
    ghost.style.left = `${bounds.left}px`;
    ghost.style.top = `${bounds.top}px`;
    ghost.style.width = `${bounds.width}px`;
    ghost.style.transformOrigin = '0 0';
    ghost.dataset.dragZone = 'answer';
    const looseWidth = state.width || bounds.width * 1.2;
    const looseHeight = state.height || bounds.height * 1.2;
    const looseScale = clamp(Math.sqrt((looseWidth / bounds.width) * (looseHeight / bounds.height)), 1.08, 1.42);
    const reorderPreview = document.createElement('span');
    reorderPreview.className = 'formula-token formula-token--preview formula-token--reorder';
    reorderPreview.setAttribute('aria-hidden', 'true');
    reorderPreview.style.minWidth = `${bounds.width}px`;
    setPieceContent(reorderPreview, state);
    root.append(ghost);
    try { token.setPointerCapture(event.pointerId); } catch { /* pointer capture is best effort */ }
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
      grabOffsetX: event.clientX - bounds.left,
      grabOffsetY: event.clientY - bounds.top,
      grabRatioX: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1),
      grabRatioY: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), 0, 1),
      pointerX: event.clientX,
      pointerY: event.clientY,
      width: bounds.width,
      height: bounds.height,
      x: bounds.left,
      y: bounds.top,
      vx: 0,
      vy: 0,
      angle: 0,
      scale: 1,
      targetScale: 1,
      looseScale,
      zone: 'answer',
      targetX: bounds.left,
      targetY: bounds.top,
      targetAngle: 0,
      edge: null,
    };
    requestTick();
  });

  const finishPlacedDrag = (event: PointerEvent, cancelled = false) => {
    if (!activePlacedPointer || activePlacedPointer.id !== event.pointerId) return;
    const pointer = activePlacedPointer;
    const { state, token, ghost, moved, originalIndex, reorderIndex } = pointer;
    const clusterBounds = field.getBoundingClientRect();
    const answerBounds = inputCell.getBoundingClientRect();
    const visualWidth = pointer.width * pointer.scale;
    const visualHeight = pointer.height * pointer.scale;
    const centreX = pointer.x + visualWidth / 2;
    const centreY = pointer.y + visualHeight / 2;
    const droppedOnCluster = !cancelled && moved && pointer.zone === 'cluster' && (
      pointInside(centreX, centreY, clusterBounds, 4)
      || overlapRatio(pointer.x, pointer.y, visualWidth, visualHeight, clusterBounds) >= .28
    );
    const droppedOnAnswer = !cancelled && moved && pointer.zone === 'answer' && (
      pointInside(centreX, centreY, answerBounds, 7)
      || overlapRatio(pointer.x, pointer.y, visualWidth, visualHeight, answerBounds) >= .28
    );
    try {
      if (token.hasPointerCapture(event.pointerId)) token.releasePointerCapture(event.pointerId);
    } catch { /* capture may already be released */ }
    setEdgeContact(ghost, null);
    clearAnswerDropState();
    pointer.reorderPreview.remove();
    token.style.opacity = '';
    token.hidden = false;

    if (!cancelled && !moved) {
      ghost.remove();
      returnPiece(state.id);
    } else if (droppedOnCluster) {
      returnPlacedPieceAtDrop(pointer, event.clientX, event.clientY, () => ghost.remove());
    } else if (droppedOnAnswer && reorderIndex !== null) {
      ghost.remove();
      placedIds.splice(originalIndex, 1);
      placedIds.splice(reorderIndex, 0, state.id);
      renderFormula();
      announce(`${state.value} moved to position ${reorderIndex + 1}.`);
    } else if (moved) {
      ghost.remove();
      renderFormula();
      announce(`${state.value} remains in its original position.`);
    } else {
      ghost.remove();
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

  if (sampleDataButton && sampleDataSheet) {
    let sampleDataOpen = sampleDataButton.getAttribute('aria-expanded') === 'true';

    const setSampleDataOpen = (open: boolean, returnFocus = false) => {
      sampleDataOpen = open;
      sampleDataButton.setAttribute('aria-expanded', String(open));
      sampleDataButton.setAttribute('aria-label', `${open ? 'Collapse' : 'Expand'} sample data`);
      sampleDataSheet.dataset.open = String(open);
      sampleDataSheet.setAttribute('aria-hidden', String(!open));
      sampleDataSheet.toggleAttribute('inert', !open);
      if (open) canvas.dataset.sampleOpen = 'true';
      else delete canvas.dataset.sampleOpen;
      if (returnFocus) sampleDataButton.focus();
      window.setTimeout(scheduleClusterHeight, reducedMotion ? 0 : 210);
    };

    sampleDataButton.addEventListener('click', () => setSampleDataOpen(!sampleDataOpen));
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !sampleDataOpen) return;
      event.preventDefault();
      setSampleDataOpen(false, true);
    });

    setSampleDataOpen(sampleDataOpen);
  }

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
    const nextWidth = field.getBoundingClientRect().width;
    if (Math.abs(nextWidth - lastFieldWidth) < 2) return;
    populateBoardNotes();
    packCluster();
  });
  resizeObserver.observe(canvas);

  const answerResizeObserver = new ResizeObserver(() => {
    syncHoveredPieceToViewport();
    scheduleClusterHeight();
  });
  answerResizeObserver.observe(inputCell);

  packCluster();
  renderFormula();
  updateStrings();
});
