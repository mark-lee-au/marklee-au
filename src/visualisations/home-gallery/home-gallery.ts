const root = document.querySelector<HTMLElement>('[data-gallery]');
const stage = document.querySelector<HTMLElement>('[data-gallery-stage]');
const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-gallery-card]'));
const rail = document.querySelector<HTMLElement>('[data-gallery-rail]');
const railThumb = document.querySelector<HTMLElement>('[data-gallery-thumb]');
const ticks = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gallery-tick]'));
const viewToggle = document.querySelector<HTMLButtonElement>('[data-view-toggle]');
const previousGuide = document.querySelector<HTMLButtonElement>("[data-gallery-guide='previous']");
const nextGuide = document.querySelector<HTMLButtonElement>("[data-gallery-guide='next']");
const autoSwipeControl = document.querySelector<HTMLElement>('[data-auto-swipe-control]');
const autoSwipeToggle = document.querySelector<HTMLInputElement>('[data-auto-swipe-toggle]');
const galleryStatus = document.querySelector<HTMLElement>('[data-gallery-status]');
const leftEdgeMagnet = document.querySelector<HTMLElement>("[data-edge-magnet='left']");
const rightEdgeMagnet = document.querySelector<HTMLElement>("[data-edge-magnet='right']");

if (root && stage && cards.length && rail && railThumb && ticks.length && viewToggle && previousGuide && nextGuide) {
  let activeIndex = 0;
  let listIndex = 0;
  let mode: 'carousel' | 'list' = 'carousel';
  let pointerId: number | null = null;
  let dragCaptureTarget: HTMLElement | null = null;
  let dragStartX = 0;
  let dragX = 0;
  let dragPosition = 0;
  let dragged = false;
  let dragPointerType = '';
  let dragScale = 1;
  let dragRenderFrame = 0;
  let pendingDragPosition = 0;
  let boundaryDragSide: -1 | 0 | 1 = 0;
  let boundaryDragPull = 0;
  const dragSamples: Array<{ x: number; time: number }> = [];
  let railPointerId: number | null = null;
  let railDragStartX = 0;
  let railDragMoved = false;
  let suppressRailClick = false;
  let railPreviewIndex = -1;
  let wheelLocked = false;
  let carouselFrame = 0;
  let carouselMotion: 'none' | 'wrap' | 'edge' | 'step' | 'drag' = 'none';
  let edgeHoldDirection: -1 | 0 | 1 = 0;
  let edgeLift = 0;
  let hasEdgePointer = false;
  let edgeSuppressedUntil = 0;
  let manualSequenceActive = false;
  const manualStepQueue: Array<-1 | 1> = [];
  let listEntryLocked = false;
  let listEntryTimer = 0;
  let autoSwipeEnabled = false;
  let autoSwipePulseTimer = 0;
  let edgeAutoSequenceDirection: -1 | 0 | 1 = 0;
  let edgeAutoSequenceCount = 0;
  let edgePointerClientX = 0;
  let edgePointerClientY = 0;
  const listEntryAnimations = new Set<Animation>();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const edgeHoverMedia = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');

  const HOME_VIEW_MODE_STORAGE_KEY = 'marklee.homeGallery.mode';
  const AUTO_SWIPE_STORAGE_KEY = 'marklee.homeGallery.autoSwipe';

  const readPreference = (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const writePreference = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable under strict privacy settings. The gallery
      // still works for the current page when persistence is blocked.
    }
  };

  type ListTree = number | {
    axis: 'x' | 'y';
    first: ListTree;
    second: ListTree;
  };

  const LIST_ACTIVE_WEIGHT_BOOST = 2.8;
  const LIST_SPLIT_MIN = 0.22;
  const LIST_TREE: ListTree = {
    axis: 'x',
    first: {
      axis: 'y',
      first: { axis: 'x', first: 0, second: 1 },
      second: { axis: 'x', first: 2, second: 3 },
    },
    second: {
      axis: 'y',
      first: 4,
      second: { axis: 'x', first: 5, second: 6 },
    },
  };
  const listBaseWeights = cards.map((card) => {
    const weight = Number(card.dataset.listWeight);
    return Number.isFinite(weight) && weight > 0 ? weight : 1;
  });

  const EDGE_AUTO_FIRST_DURATION = 1500;
  const EDGE_AUTO_MIN_DURATION = 760;
  const EDGE_AUTO_ACCELERATION = 0.82;
  const EDGE_WRAP_DURATION = 1050;
  const CARD_STEP_DURATION = 560;
  const QUEUED_CARD_STEP_DURATION = 300;
  const QUEUED_WRAP_DURATION = 760;
  const MOUSE_THROW_VELOCITY = 0.7; // px/ms, about 700px/s
  const MOUSE_DRAG_DISTANCE = 0.18; // fraction of one card step
  const BOUNDARY_DRAG_RESPONSE = 0.12; // visual travel grows logarithmically under the soft wall
  const BOUNDARY_DRAG_SOFTNESS = 0.14; // larger values make endpoint dragging feel heavier
  const BOUNDARY_DRAG_TRIGGER = 0.09; // raw pull needed to commit an endpoint wrap
  const BOUNDARY_GLOW_SOFTNESS = 0.18; // raw pull needed to build most of the edge glow
  const THROW_SPRING_STIFFNESS = 90;
  const THROW_SPRING_DAMPING = 19;
  const THROW_MAX_DURATION = 950;
  const EDGE_HOLD_PROGRESS = 0.08; // enter slightly into the viewport-edge zone before auto-stepping
  // Rotation uses different launch and landing zones. Leaving centre is
  // intentionally quicker: the outgoing card reaches its travelling skew in
  // the first part of the move. Arrival is slower: the incoming card starts
  // flattening earlier and is fully flat before the final centring travel.
  const LAUNCH_SKEW_DISTANCE = 0.3;
  const LANDING_FLAT_DISTANCE = 0.14;
  const LANDING_SKEW_DISTANCE = 0.62;

  const clampIndex = (value: number) => Math.max(0, Math.min(cards.length - 1, value));
  const wrapIndex = (value: number) => ((value % cards.length) + cards.length) % cards.length;
  const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;
  const smoothstep = (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    return clamped * clamped * (3 - 2 * clamped);
  };
  const smootherstep = (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
  };
  // Endpoint dragging behaves like a soft wall rather than a hard clamp. The
  // logarithm never reaches a fixed limit, but every additional amount of
  // pointer travel produces less carousel travel than the amount before it.
  const resistedBoundaryPull = (amount: number) => (
    BOUNDARY_DRAG_RESPONSE * Math.log1p(Math.max(0, amount) / BOUNDARY_DRAG_SOFTNESS)
  );
  const boundaryGlowProgress = (amount: number) => (
    1 - Math.exp(-Math.max(0, amount) / BOUNDARY_GLOW_SOFTNESS)
  );

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const pointInsideRoundedCard = (card: HTMLElement, clientX: number, clientY: number) => {
    const rect = card.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;

    const styles = getComputedStyle(card);
    const radius = Math.min(
      rect.width / 2,
      rect.height / 2,
      Math.max(
        parseFloat(styles.borderTopLeftRadius) || 0,
        parseFloat(styles.borderTopRightRadius) || 0,
        parseFloat(styles.borderBottomRightRadius) || 0,
        parseFloat(styles.borderBottomLeftRadius) || 0,
      ),
    );

    if (radius <= 0) return true;

    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    if (localX >= radius && localX <= rect.width - radius) return true;
    if (localY >= radius && localY <= rect.height - radius) return true;

    const cornerX = localX < radius ? radius : rect.width - radius;
    const cornerY = localY < radius ? radius : rect.height - radius;
    return Math.hypot(localX - cornerX, localY - cornerY) <= radius;
  };

  const edgeHoverGeometry = (cardRect: DOMRect) => {
    const rootRect = root.getBoundingClientRect();
    const width = Math.max(1, rootRect.width);

    // Mirror the responsive arrow geometry in CSS, then start the edge-hover
    // zone just inside the arrow area. Keep a guaranteed dead band between the
    // active card and the hover zone so drag and edge navigation cannot overlap.
    const guideInset = clamp(width * 0.04, 22, 76);
    const guideWidth = clamp(width * 0.062, 72, 112);
    const guideLead = clamp(width * 0.016, 18, 34);
    const fieldLead = clamp(width * 0.09, 96, 180);
    const deadBand = clamp(width * 0.012, 18, 30);

    // Let the magnetic hint begin farther inward than the visible arrow zone.
    // The card dead band remains authoritative so the field cannot steal drag.
    const nominalLeftStart = rootRect.left + guideInset + guideWidth + guideLead + fieldLead;
    const nominalRightStart = rootRect.right - guideInset - guideWidth - guideLead - fieldLead;
    const leftStart = Math.min(cardRect.left - deadBand, nominalLeftStart);
    const rightStart = Math.max(cardRect.right + deadBand, nominalRightStart);

    return { rootRect, leftStart, rightStart };
  };

  type EdgeFieldSide = 'left' | 'right';

  interface EdgeFieldState {
    side: EdgeFieldSide;
    element: HTMLElement | null;
    width: number;
    height: number;
    x: number;
    targetX: number;
    xVelocity: number;
    y: number;
    targetY: number;
    yVelocity: number;
    targetIntensity: number;
    intensity: number;
    active: boolean;
  }

  const createEdgeFieldState = (side: EdgeFieldSide, element: HTMLElement | null): EdgeFieldState => ({
    side,
    element,
    width: 0,
    height: 0,
    x: 0,
    targetX: 0,
    xVelocity: 0,
    y: 0,
    targetY: 0,
    yVelocity: 0,
    targetIntensity: 0,
    intensity: 0,
    active: false,
  });

  const edgeFields = {
    left: createEdgeFieldState('left', leftEdgeMagnet),
    right: createEdgeFieldState('right', rightEdgeMagnet),
  };
  let edgeFieldFrame = 0;
  let edgeFieldLastTime = 0;

  const edgeFieldForDirection = (direction: -1 | 1) => (
    direction < 0 ? edgeFields.left : edgeFields.right
  );

  const resizeEdgeField = (state: EdgeFieldState) => {
    const rect = state.element?.getBoundingClientRect();
    if (!rect) return;
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    if (!state.x) state.x = state.side === 'left' ? state.width * 0.16 : state.width * 0.84;
    if (!state.targetX) state.targetX = state.x;
    if (!state.y) state.y = state.height / 2;
    if (!state.targetY) state.targetY = state.y;
  };

  const setEdgeFieldCss = (state: EdgeFieldState) => {
    if (!state.height || !state.width) return;
    const yPercent = clamp((state.y / state.height) * 100, 2, 98);
    const intensity = clamp(state.intensity, 0, 1);
    const rippleStrength = clamp(Math.abs(state.yVelocity) / 10, 0, 1) * clamp(intensity * 1.3, 0, 1);
    const rippleOffset = clamp(state.yVelocity * 2.1, -28, 28) * (0.26 + rippleStrength * 0.74);
    const liquidScale = 0.98 + intensity * 0.28;
    const fogShift = clamp(state.yVelocity * 2.4, -28, 28);
    const trailReach = state.side === 'left' ? state.x : state.width - state.x;
    const trailLength = clamp(trailReach - 10, 20, state.width);

    root.style.setProperty(`--edge-hover-glow-${state.side}-y`, `${yPercent.toFixed(2)}%`);
    root.style.setProperty(`--edge-liquid-${state.side}-scale`, liquidScale.toFixed(4));
    root.style.setProperty(`--edge-liquid-${state.side}-ripple-offset`, `${rippleOffset.toFixed(2)}px`);
    root.style.setProperty(`--edge-liquid-${state.side}-fog-shift`, `${fogShift.toFixed(2)}px`);
    root.style.setProperty(`--edge-liquid-${state.side}-length`, `${trailLength.toFixed(2)}px`);
  };

  const animateEdgeFields = (now: number) => {
    const elapsed = edgeFieldLastTime
      ? clamp(now - edgeFieldLastTime, 8, 34)
      : 16.667;
    edgeFieldLastTime = now;
    const step = elapsed / 16.667;
    let keepRunning = false;

    (Object.values(edgeFields) as EdgeFieldState[]).forEach((state) => {
      resizeEdgeField(state);

      const intensityEase = 1 - Math.pow(0.76, step);
      state.intensity += (state.targetIntensity - state.intensity) * intensityEase;

      const xDelta = state.targetX - state.x;
      state.xVelocity += xDelta * 0.052 * step;
      state.xVelocity *= Math.pow(0.78, step);
      state.x += state.xVelocity * step;
      state.x = clamp(state.x, 0, Math.max(1, state.width));

      const yDelta = state.targetY - state.y;
      state.yVelocity += yDelta * 0.05 * step;
      state.yVelocity *= Math.pow(0.74, step);
      state.y += state.yVelocity * step;
      state.y = clamp(state.y, 0, Math.max(1, state.height));

      setEdgeFieldCss(state);

      if (
        state.targetIntensity > 0.002
        || state.intensity > 0.002
        || Math.abs(state.xVelocity) > 0.03
        || Math.abs(state.yVelocity) > 0.03
      ) keepRunning = true;
    });

    if (keepRunning && !reducedMotion.matches) {
      edgeFieldFrame = requestAnimationFrame(animateEdgeFields);
    } else {
      edgeFieldFrame = 0;
      edgeFieldLastTime = 0;
    }
  };

  const ensureEdgeFieldAnimation = () => {
    if (reducedMotion.matches || edgeFieldFrame) return;
    edgeFieldLastTime = 0;
    edgeFieldFrame = requestAnimationFrame(animateEdgeFields);
  };

  const setEdgeFieldTarget = (
    direction: -1 | 1,
    progress: number,
    clientX: number,
    clientY: number,
  ) => {
    const active = edgeFieldForDirection(direction);
    const inactive = direction < 0 ? edgeFields.right : edgeFields.left;
    resizeEdgeField(active);
    resizeEdgeField(inactive);

    const rect = active.element?.getBoundingClientRect();
    if (rect) {
      active.targetX = clamp(clientX - rect.left, 2, Math.max(2, rect.width));
      active.targetY = clamp(clientY - rect.top, 2, Math.max(2, rect.height - 2));
      if (active.intensity < 0.01 && Math.abs(active.x - active.targetX) > active.width * 0.35) {
        active.x = active.targetX;
        active.xVelocity = 0;
      }
      if (active.intensity < 0.01 && Math.abs(active.y - active.targetY) > active.height * 0.35) {
        active.y = active.targetY;
        active.yVelocity = 0;
      }
    }

    active.targetIntensity = smootherstep(progress);
    active.active = true;
    inactive.targetIntensity = 0;
    inactive.active = false;
    ensureEdgeFieldAnimation();
  };

  const releaseEdgeFields = (immediate = false) => {
    (Object.values(edgeFields) as EdgeFieldState[]).forEach((state) => {
      state.targetIntensity = 0;
      state.active = false;
      if (immediate) {
        state.intensity = 0;
        state.xVelocity = 0;
        state.yVelocity = 0;
        root.style.setProperty(`--edge-liquid-${state.side}-scale`, '0.98');
        root.style.setProperty(`--edge-liquid-${state.side}-ripple-offset`, '0px');
        root.style.setProperty(`--edge-liquid-${state.side}-fog-shift`, '0px');
        root.style.setProperty(`--edge-liquid-${state.side}-length`, '24px');
      }
    });

    if (immediate && edgeFieldFrame) {
      cancelAnimationFrame(edgeFieldFrame);
      edgeFieldFrame = 0;
      edgeFieldLastTime = 0;
      return;
    }

    ensureEdgeFieldAnimation();
  };

  const clearBoundaryGlow = () => {
    root.style.setProperty('--boundary-glow-left', '0');
    root.style.setProperty('--boundary-glow-right', '0');
    root.style.setProperty('--boundary-glow-left-scale', '0.7');
    root.style.setProperty('--boundary-glow-right-scale', '0.7');
  };

  const updateBoundaryGlow = (side: -1 | 0 | 1, rawPull: number) => {
    if (!autoSwipeEnabled || side === 0 || rawPull <= 0) {
      clearBoundaryGlow();
      return;
    }

    const progress = boundaryGlowProgress(rawPull);
    const opacity = Math.min(0.82, 0.82 * progress);
    const scale = 0.7 + progress * 0.36;

    if (side < 0) {
      // Home dragged right: pressure builds against the right screen edge.
      root.style.setProperty('--boundary-glow-left', '0');
      root.style.setProperty('--boundary-glow-right', opacity.toFixed(4));
      root.style.setProperty('--boundary-glow-left-scale', '0.7');
      root.style.setProperty('--boundary-glow-right-scale', scale.toFixed(4));
    } else {
      // About dragged left: pressure builds against the left screen edge.
      root.style.setProperty('--boundary-glow-right', '0');
      root.style.setProperty('--boundary-glow-left', opacity.toFixed(4));
      root.style.setProperty('--boundary-glow-right-scale', '0.7');
      root.style.setProperty('--boundary-glow-left-scale', scale.toFixed(4));
    }
  };


  const clearEdgeHoverGlow = () => {
    root.style.setProperty('--edge-hover-glow-left', '0');
    root.style.setProperty('--edge-hover-glow-right', '0');
    releaseEdgeFields();
  };

  const pulseAutoSwipeEdges = () => {
    if (reducedMotion.matches || !fineHover.matches || mode !== 'carousel') return;

    window.clearTimeout(autoSwipePulseTimer);
    delete root.dataset.autoSwipePulse;

    // Force a style flush so switching Auto Swipe off and back on quickly can
    // replay the confirmation pulse from its first frame.
    void root.offsetWidth;
    root.dataset.autoSwipePulse = 'on';
    autoSwipePulseTimer = window.setTimeout(() => {
      delete root.dataset.autoSwipePulse;
      autoSwipePulseTimer = 0;
    }, 860);
  };

  const updateEdgeHoverGlow = (
    direction: -1 | 1,
    progress: number,
    clientX: number,
    clientY: number,
  ) => {
    const eased = smootherstep(progress);
    // Keep the feedback readable but restrained. The bright edge line and the
    // constrained fog trail should do most of the explaining, not raw opacity.
    const opacity = progress <= 0
      ? 0
      : Math.min(0.27, 0.025 + eased * 0.245);

    setEdgeFieldTarget(direction, progress, clientX, clientY);

    if (direction < 0) {
      root.style.setProperty('--edge-hover-glow-right', '0');
      root.style.setProperty('--edge-hover-glow-left', opacity.toFixed(4));
    } else {
      root.style.setProperty('--edge-hover-glow-left', '0');
      root.style.setProperty('--edge-hover-glow-right', opacity.toFixed(4));
    }
  };
  const easeInOutCubic = (value: number) => (
    value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2
  );
  const heavyFlick = (value: number) => {
    if (value <= 0.66) {
      const load = value / 0.66;
      return 0.14 * load * load;
    }
    const release = (value - 0.66) / 0.34;
    return 0.14 + 0.86 * smoothstep(release);
  };
  const sectionLabel = (index: number) => cards[index]?.dataset.slideLabel || 'section';

  const resetEdgeAutoSequence = () => {
    edgeAutoSequenceDirection = 0;
    edgeAutoSequenceCount = 0;
  };

  const edgeAutoDuration = () => (
    Math.max(EDGE_AUTO_MIN_DURATION, EDGE_AUTO_FIRST_DURATION * Math.pow(EDGE_AUTO_ACCELERATION, edgeAutoSequenceCount))
  );

  const announce = (message: string) => {
    if (!galleryStatus) return;
    galleryStatus.textContent = '';
    requestAnimationFrame(() => {
      galleryStatus.textContent = message;
    });
  };

  const announceActiveSection = () => {
    announce(`${sectionLabel(activeIndex)}, section ${activeIndex + 1} of ${cards.length}`);
  };

  const clearRailPreview = () => {
    if (railPreviewIndex >= 0) {
      const previewTick = ticks[railPreviewIndex];
      if (previewTick) delete previewTick.dataset.preview;
    }
    railPreviewIndex = -1;
  };

  const previewRailIndex = (index: number) => {
    const nextIndex = clampIndex(index);
    if (railPreviewIndex === nextIndex) return;
    clearRailPreview();
    railPreviewIndex = nextIndex;
    ticks[nextIndex].dataset.preview = 'true';
  };

  const recordDragSample = (x: number, time: number) => {
    dragSamples.push({ x, time });
    const cutoff = time - 110;
    while (dragSamples.length > 2 && dragSamples[0].time < cutoff) dragSamples.shift();
  };

  const releaseVelocityPxPerMs = (releasedAt: number) => {
    if (dragSamples.length < 2) return 0;
    const last = dragSamples[dragSamples.length - 1];
    if (releasedAt - last.time > 90) return 0;

    const windowStart = last.time - 80;
    let first = dragSamples[0];
    for (const sample of dragSamples) {
      if (sample.time >= windowStart) {
        first = sample;
        break;
      }
    }

    const elapsed = last.time - first.time;
    if (elapsed < 8) return 0;
    return (last.x - first.x) / elapsed;
  };

  const scheduleDragRender = (position: number) => {
    pendingDragPosition = position;
    if (dragRenderFrame) return;
    dragRenderFrame = requestAnimationFrame(() => {
      dragRenderFrame = 0;
      renderCarousel(pendingDragPosition);
    });
  };

  const updateGuides = () => {
    const showGuides = mode === 'carousel';
    const previousIndex = wrapIndex(activeIndex - 1);
    const nextIndex = wrapIndex(activeIndex + 1);

    nextGuide.dataset.visible = showGuides ? 'true' : 'false';
    previousGuide.dataset.visible = showGuides ? 'true' : 'false';
    nextGuide.tabIndex = showGuides ? 0 : -1;
    previousGuide.tabIndex = showGuides ? 0 : -1;
    nextGuide.setAttribute('aria-hidden', showGuides ? 'false' : 'true');
    previousGuide.setAttribute('aria-hidden', showGuides ? 'false' : 'true');
    nextGuide.setAttribute('aria-label', `Show next section: ${sectionLabel(nextIndex)}`);
    previousGuide.setAttribute('aria-label', `Show previous section: ${sectionLabel(previousIndex)}`);
  };

  const updateRailThumb = (position: number) => {
    const progress = cards.length > 1
      ? Math.max(0, Math.min(1, position / (cards.length - 1)))
      : 0;
    railThumb.style.left = `${progress * 100}%`;
  };

  const updateRail = () => {
    updateRailThumb(activeIndex);

    ticks.forEach((tick, index) => {
      if (index === activeIndex) tick.setAttribute('aria-current', 'true');
      else tick.removeAttribute('aria-current');
    });
  };

  const renderCarousel = (position = activeIndex) => {
    // Keep the rail thumb physically coupled to the same fractional carousel
    // position as the cards. Scripted flicks, drag settling and wrap sweeps
    // therefore carry the indicator with exactly the same weight/easing.
    updateRailThumb(position);
    const stageWidth = stage.clientWidth;
    const spacing = Math.max(250, Math.min(560, stageWidth * 0.37));
    const depth = Math.max(210, Math.min(390, stageWidth * 0.24));

    cards.forEach((card, index) => {
      const offset = index - position;
      const distance = Math.abs(offset);
      const x = offset * spacing;
      const y = Math.min(28, distance * 9);
      const z = -distance * depth;
      const isCurrent = index === activeIndex;
      // The outgoing active card gets a short launch zone so it leaves the
      // flat state smoothly but reaches its travelling angle quickly. The
      // incoming card uses a longer landing zone, then remains at rotateY(0)
      // for the last part of its positional travel. This removes the visual
      // discontinuity at both ends without making launch and landing equally slow.
      const boundedDistance = Math.min(1, distance);
      const launchRotationProgress = smootherstep(
        Math.min(1, boundedDistance / LAUNCH_SKEW_DISTANCE),
      );
      const landingRotationProgress = distance <= LANDING_FLAT_DISTANCE
        ? 0
        : smootherstep(Math.min(
            1,
            (boundedDistance - LANDING_FLAT_DISTANCE)
              / Math.max(0.001, LANDING_SKEW_DISTANCE - LANDING_FLAT_DISTANCE),
          ));
      const rotationProgress = isCurrent
        ? launchRotationProgress
        : landingRotationProgress;
      const nearRotation = 34 * rotationProgress;
      const farRotation = Math.max(0, distance - 1) * 34;
      const rotation = offset === 0
        ? 0
        : -Math.sign(offset) * (nearRotation + farRotation);
      const scale = Math.max(0.62, 1 - distance * 0.11);
      const visible = distance < 2.25;

      // Visual focus follows the same asymmetric timing. The outgoing card
      // gives up its sharp active treatment during the quicker launch, while
      // the incoming card settles its surface/blur over the longer landing.
      const launchFocusLoss = smootherstep(Math.min(1, boundedDistance / LAUNCH_SKEW_DISTANCE));
      const landingFocusLoss = distance <= LANDING_FLAT_DISTANCE
        ? 0
        : smootherstep(Math.min(
            1,
            (boundedDistance - LANDING_FLAT_DISTANCE)
              / Math.max(0.001, LANDING_SKEW_DISTANCE - LANDING_FLAT_DISTANCE),
          ));
      const centreFocus = 1 - (isCurrent ? launchFocusLoss : landingFocusLoss);
      // Keep every visual depth property continuous as cards pass the one-card
      // neighbour boundary. The previous near/far branch changed surface,
      // shadow and blur values abruptly at distance === 1, which showed up as
      // a dark flicker during continuous scrolling.
      const farDepthProgress = smootherstep(Math.max(0, Math.min(1, (distance - 1) / 1.25)));
      const depthValue = (activeValue: number, neighbourValue: number, farValue: number) => (
        distance <= 1
          ? lerp(neighbourValue, activeValue, centreFocus)
          : lerp(neighbourValue, farValue, farDepthProgress)
      );
      const copyOpacity = depthValue(1, 0.045, 0.012);
      const visualOpacity = depthValue(1, 0.34, 0.09);
      const surfaceOpacity = depthValue(0.97, 0.5, 0.14);
      const shadowOpacity = depthValue(0.78, 0.36, 0.06);
      const copyBlur = depthValue(0, 18, 24);
      const visualBlur = depthValue(0, 7, 13);
      const visualSaturate = depthValue(1, 0.72, 0.54);
      const visualBrightness = depthValue(1, 0.62, 0.48);
      const neighbourDepth = distance <= 1
        ? 1 - centreFocus
        : lerp(1, 2, farDepthProgress);
      const refractShift = Math.sign(offset) * Math.min(12, 6 * neighbourDepth);
      const previewScale = distance <= 1
        ? lerp(1.045, 1, centreFocus)
        : lerp(1.045, 1.06, farDepthProgress);
      const refractOpacity = distance <= 1
        ? 0.72 * (1 - centreFocus)
        : lerp(0.72, 0.88, farDepthProgress);
      const canLift = index === activeIndex && Math.abs(position - activeIndex) < 0.52;
      const liftAmount = canLift ? edgeLift : 0;
      const liftStrength = Math.abs(liftAmount);
      const loadedX = x - liftAmount * 12;
      const loadedY = y - liftStrength * 6;
      // Edge hover can lift/shift the card, but Y-axis turn is owned by the
      // position curve above so repeated auto-steps cannot inject a new angle.
      const loadedRotation = rotation;
      const loadedScale = scale * (1 + liftStrength * 0.008);

      card.style.transform = `translate(-50%, -50%) translate3d(${loadedX}px, ${loadedY}px, ${z}px) rotateY(${loadedRotation}deg) scale(${loadedScale})`;
      const distanceFade = distance <= 1.35
        ? 1
        : 1 - smootherstep(Math.min(1, (distance - 1.35) / 0.9));
      card.style.opacity = visible ? String(distanceFade) : '0';
      card.style.setProperty('--gallery-card-copy-opacity', String(copyOpacity));
      card.style.setProperty('--gallery-card-visual-opacity', String(visualOpacity));
      card.style.setProperty('--gallery-card-surface-opacity', String(surfaceOpacity));
      card.style.setProperty('--gallery-card-shadow-opacity', String(shadowOpacity));
      card.style.setProperty('--gallery-card-copy-blur', `${copyBlur}px`);
      card.style.setProperty('--gallery-card-visual-blur', `${visualBlur}px`);
      card.style.setProperty('--gallery-card-visual-saturate', String(visualSaturate));
      card.style.setProperty('--gallery-card-visual-brightness', String(visualBrightness));
      card.style.setProperty('--gallery-card-refract-shift', `${refractShift}px`);
      card.style.setProperty('--gallery-card-preview-scale', String(previewScale));
      card.style.setProperty('--gallery-card-refract-opacity', String(refractOpacity));
      // Keep depth ordering continuous. Avoid a large z-index jump when the
      // rounded visual index changes during the approach to centre.
      card.style.zIndex = String(100 - Math.round(distance * 10));
      card.style.pointerEvents = distance < 1.15 ? 'auto' : 'none';
      const isSettledActive = carouselMotion === 'none' && isCurrent && distance < 0.001;
      card.dataset.active = isSettledActive ? 'true' : 'false';
      card.toggleAttribute('inert', !isCurrent);
      card.setAttribute('aria-hidden', isCurrent ? 'false' : 'true');
      card.style.transformOrigin = '50% 50%';
    });
  };

  const setActive = (nextIndex: number, shouldAnnounce = true) => {
    clearRailPreview();
    activeIndex = clampIndex(Math.round(nextIndex));
    updateRail();
    updateGuides();
    if (mode === 'carousel') renderCarousel();
    if (shouldAnnounce) announceActiveSection();
  };

  const clearEdgeGuideState = () => {
    delete previousGuide.dataset.edgeActive;
    delete nextGuide.dataset.edgeActive;
  };

  const updateEdgeGuideState = () => {
    clearEdgeGuideState();
    if (edgeLift < -0.12) previousGuide.dataset.edgeActive = 'true';
    else if (edgeLift > 0.12) nextGuide.dataset.edgeActive = 'true';
  };

  const cancelCarouselFrame = () => {
    if (carouselFrame) cancelAnimationFrame(carouselFrame);
    carouselFrame = 0;
  };

  const settleEdgeMotion = () => {
    if (carouselMotion !== 'edge') return;
    cancelCarouselFrame();
    carouselMotion = 'none';
    delete root.dataset.carouselMotion;
    edgeLift = 0;
    edgeHoldDirection = 0;
    clearEdgeGuideState();
    renderCarousel();
  };

  const clearManualNavigation = () => {
    manualSequenceActive = false;
    manualStepQueue.length = 0;
  };

  const cancelAllCarouselMotion = () => {
    cancelCarouselFrame();
    clearManualNavigation();
    clearBoundaryGlow();
    clearEdgeHoverGlow();
    carouselMotion = 'none';
    delete root.dataset.carouselMotion;
    edgeLift = 0;
    edgeHoldDirection = 0;
    clearEdgeGuideState();
    if (mode === 'carousel') renderCarousel();
  };

  const finishAnimatedMove = (targetIndex: number, onSettled?: () => void) => {
    activeIndex = targetIndex;
    carouselFrame = 0;
    edgeLift = 0;
    updateRail();
    updateGuides();
    clearEdgeGuideState();

    // Commit the exact centred frame while scripted-motion transitions are still disabled.
    // Re-enable normal hover transitions only after the browser has painted that frame.
    renderCarousel(targetIndex);
    carouselFrame = requestAnimationFrame(() => {
      carouselFrame = requestAnimationFrame(() => {
        carouselFrame = 0;
        carouselMotion = 'none';
        delete root.dataset.carouselMotion;
        renderCarousel(targetIndex);
        announceActiveSection();
        onSettled?.();
      });
    });
  };

  const runWrapFlick = (
    direction: -1 | 1,
    duration = EDGE_WRAP_DURATION,
    onSettled?: () => void,
    startPositionOverride?: number,
  ) => {
    if (carouselMotion !== 'none' || mode !== 'carousel') return;
    const targetIndex = wrapIndex(activeIndex + direction);

    if (reducedMotion.matches) {
      setActive(targetIndex);
      onSettled?.();
      return;
    }

    carouselMotion = 'wrap';
    root.dataset.carouselMotion = 'wrap';
    edgeLift = 0;
    clearEdgeGuideState();
    const startPosition = startPositionOverride ?? activeIndex;
    const targetPosition = targetIndex;
    const startedAt = performance.now();

    const frame = (now: number) => {
      if (carouselMotion !== 'wrap' || mode !== 'carousel') return;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = easeInOutCubic(progress);
      renderCarousel(startPosition + (targetPosition - startPosition) * eased);

      if (progress < 1) carouselFrame = requestAnimationFrame(frame);
      else finishAnimatedMove(targetIndex, onSettled);
    };

    carouselFrame = requestAnimationFrame(frame);
  };

  const runStepMove = (
    direction: -1 | 1,
    startPosition = activeIndex,
    durationOverride?: number,
    onSettled?: () => void,
  ) => {
    if (carouselMotion !== 'none' || mode !== 'carousel') return;
    const targetIndex = activeIndex + direction;
    if (targetIndex < 0 || targetIndex >= cards.length) {
      runWrapFlick(direction, durationOverride ?? EDGE_WRAP_DURATION, onSettled);
      return;
    }

    if (reducedMotion.matches) {
      setActive(targetIndex);
      onSettled?.();
      return;
    }

    carouselMotion = 'step';
    root.dataset.carouselMotion = 'step';
    edgeLift = 0;
    clearEdgeGuideState();
    const targetPosition = targetIndex;
    const remainingDistance = Math.max(0.18, Math.abs(targetPosition - startPosition));
    const baseDuration = durationOverride ?? CARD_STEP_DURATION;
    const duration = Math.max(180, baseDuration * remainingDistance);
    const startedAt = performance.now();

    const frame = (now: number) => {
      if (carouselMotion !== 'step' || mode !== 'carousel') return;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = easeInOutCubic(progress);
      renderCarousel(lerp(startPosition, targetPosition, eased));

      if (progress < 1) carouselFrame = requestAnimationFrame(frame);
      else finishAnimatedMove(targetIndex, onSettled);
    };

    carouselFrame = requestAnimationFrame(frame);
  };

  const settleToActive = (startPosition: number) => {
    if (carouselMotion !== 'none' || mode !== 'carousel') return;
    if (reducedMotion.matches || Math.abs(startPosition - activeIndex) < 0.001) {
      renderCarousel(activeIndex);
      return;
    }

    carouselMotion = 'step';
    root.dataset.carouselMotion = 'step';
    edgeLift = 0;
    clearEdgeGuideState();
    const remainingDistance = Math.abs(activeIndex - startPosition);
    const duration = Math.max(180, CARD_STEP_DURATION * remainingDistance);
    const startedAt = performance.now();

    const frame = (now: number) => {
      if (carouselMotion !== 'step' || mode !== 'carousel') return;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = easeInOutCubic(progress);
      renderCarousel(lerp(startPosition, activeIndex, eased));

      if (progress < 1) carouselFrame = requestAnimationFrame(frame);
      else finishAnimatedMove(activeIndex);
    };

    carouselFrame = requestAnimationFrame(frame);
  };

  const runMouseThrow = (
    direction: -1 | 1,
    startPosition: number,
    releaseVelocityPxMs: number,
  ) => {
    if (carouselMotion !== 'none' || mode !== 'carousel') return;
    const rawTarget = activeIndex + direction;
    if (rawTarget < 0 || rawTarget >= cards.length) {
      runWrapFlick(direction, QUEUED_WRAP_DURATION);
      return;
    }

    const targetIndex = rawTarget;
    if (reducedMotion.matches) {
      setActive(targetIndex);
      return;
    }

    carouselMotion = 'step';
    root.dataset.carouselMotion = 'step';
    edgeLift = 0;
    clearEdgeGuideState();

    let position = startPosition;
    // Pointer velocity is opposite carousel position: throwing the mouse left
    // advances the carousel to the right. Preserve that release momentum.
    let velocity = (-releaseVelocityPxMs / Math.max(1, dragScale)) * 1000; // cards/s
    if (Math.sign(velocity) !== direction) velocity = direction * Math.abs(velocity);
    velocity = Math.max(-3.25, Math.min(3.25, velocity));

    let previousTime = performance.now();
    const startedAt = previousTime;

    const frame = (now: number) => {
      if (carouselMotion !== 'step' || mode !== 'carousel') return;
      const dt = Math.min(0.032, Math.max(0.001, (now - previousTime) / 1000));
      previousTime = now;

      const displacement = targetIndex - position;
      const acceleration = displacement * THROW_SPRING_STIFFNESS - velocity * THROW_SPRING_DAMPING;
      velocity += acceleration * dt;
      position += velocity * dt;

      // Do not let a fast throw run through the destination into another card.
      if ((direction > 0 && position > targetIndex) || (direction < 0 && position < targetIndex)) {
        position = targetIndex;
        velocity *= 0.22;
      }

      renderCarousel(position);

      const settled = Math.abs(targetIndex - position) < 0.0015 && Math.abs(velocity) < 0.012;
      const timedOut = now - startedAt >= THROW_MAX_DURATION;
      if (!settled && !timedOut) {
        carouselFrame = requestAnimationFrame(frame);
        return;
      }

      finishAnimatedMove(targetIndex);
    };

    carouselFrame = requestAnimationFrame(frame);
  };

  const moveBy = (direction: -1 | 1, startPosition = activeIndex) => {
    if (mode !== 'carousel' || carouselMotion !== 'none') return;
    const rawTarget = activeIndex + direction;
    if (rawTarget < 0 || rawTarget >= cards.length) {
      runWrapFlick(direction);
      return;
    }
    runStepMove(direction, startPosition);
  };

  const continueManualNavigation = () => {
    const nextDirection = manualStepQueue.shift();
    if (nextDirection === undefined) {
      manualSequenceActive = false;
      return;
    }

    const rawTarget = activeIndex + nextDirection;
    if (rawTarget < 0 || rawTarget >= cards.length) {
      runWrapFlick(nextDirection, QUEUED_WRAP_DURATION, continueManualNavigation);
      return;
    }

    runStepMove(
      nextDirection,
      activeIndex,
      QUEUED_CARD_STEP_DURATION,
      continueManualNavigation,
    );
  };

  const requestManualNavigation = (direction: -1 | 1, maxQueued = Number.POSITIVE_INFINITY) => {
    if (mode !== 'carousel') return;

    // If the user clicks or presses again while an arrow-driven move is still
    // running, remember the input instead of dropping it. Queued moves use a
    // faster flick so several deliberate clicks feel responsive without
    // removing the weight from the first step.
    if (manualSequenceActive) {
      if (manualStepQueue.length < maxQueued) manualStepQueue.push(direction);
      return;
    }

    if (carouselMotion !== 'none') return;

    manualSequenceActive = true;
    const rawTarget = activeIndex + direction;
    if (rawTarget < 0 || rawTarget >= cards.length) {
      runWrapFlick(direction, EDGE_WRAP_DURATION, continueManualNavigation);
      return;
    }

    runStepMove(direction, activeIndex, CARD_STEP_DURATION, continueManualNavigation);
  };

  const edgeHoverAvailable = () => (
    autoSwipeEnabled
    && fineHover.matches
    && edgeHoverMedia.matches
    && !reducedMotion.matches
  );

  const continueEdgeAutoSequence = (direction: -1 | 1) => {
    if (!hasEdgePointer || mode !== 'carousel' || !edgeHoverAvailable()) {
      resetEdgeAutoSequence();
      return;
    }

    updateEdgeIntentFromPoint(edgePointerClientX, edgePointerClientY, null, false);
    if (edgeHoldDirection !== direction || carouselMotion !== 'none') {
      if (edgeHoldDirection === 0) resetEdgeAutoSequence();
      return;
    }

    edgeAutoSequenceCount = Math.min(edgeAutoSequenceCount + 1, 12);
    requestAnimationFrame(() => {
      if (carouselMotion === 'none' && edgeHoldDirection === direction && mode === 'carousel') {
        beginEdgeAutoStep(direction);
      }
    });
  };

  const beginEdgeAutoStep = (direction: -1 | 1) => {
    if (!edgeHoverAvailable() || mode !== 'carousel' || carouselMotion !== 'none') return;
    if (edgeHoldDirection !== direction) return;

    if (edgeAutoSequenceDirection !== direction) {
      edgeAutoSequenceDirection = direction;
      edgeAutoSequenceCount = 0;
    }

    const duration = edgeAutoDuration();
    const rawTarget = activeIndex + direction;
    if (rawTarget < 0 || rawTarget >= cards.length) {
      runWrapFlick(direction, Math.max(820, duration * 0.92), () => continueEdgeAutoSequence(direction));
      return;
    }

    carouselMotion = 'edge';
    root.dataset.carouselMotion = 'edge';
    const startIndex = activeIndex;
    const targetIndex = rawTarget;
    const startPosition = startIndex;
    const targetPosition = targetIndex;
    const startedAt = performance.now();
    const startingEdgeLift = edgeLift;

    const frame = (now: number) => {
      if (carouselMotion !== 'edge' || mode !== 'carousel') return;
      if (edgeHoldDirection !== direction) {
        settleEdgeMotion();
        return;
      }

      const progress = Math.min(1, (now - startedAt) / duration);
      const moveProgress = heavyFlick(progress);
      const liftRelease = smootherstep(Math.min(1, progress / 0.26));
      edgeLift = startingEdgeLift * (1 - liftRelease);
      updateEdgeGuideState();
      renderCarousel(startPosition + (targetPosition - startPosition) * moveProgress);

      if (progress < 1) {
        carouselFrame = requestAnimationFrame(frame);
        return;
      }

      edgeLift = 0;
      clearEdgeGuideState();
      finishAnimatedMove(targetIndex, () => continueEdgeAutoSequence(direction));
    };

    carouselFrame = requestAnimationFrame(frame);
  };

  const resetEdgeIntent = (cancelRunning = true) => {
    edgeHoldDirection = 0;
    edgeLift = 0;
    resetEdgeAutoSequence();
    clearEdgeGuideState();
    clearEdgeHoverGlow();
    if (cancelRunning && carouselMotion === 'edge') settleEdgeMotion();
    else if (mode === 'carousel' && carouselMotion === 'none') renderCarousel();
  };

  const updateEdgeIntentFromPoint = (clientX: number, clientY: number, target?: Element | null, allowAutoBegin = true) => {
    hasEdgePointer = true;

    if (
      !edgeHoverAvailable()
      || mode !== 'carousel'
      || pointerId !== null
      || manualSequenceActive
      || performance.now() < edgeSuppressedUntil
    ) {
      resetEdgeIntent();
      return;
    }
    if (carouselMotion === 'wrap') return;
    if (target?.closest('.gallery-header, .view-toggle, .gallery-controls')) {
      resetEdgeIntent();
      return;
    }

    const card = cards[activeIndex];
    const rect = card.getBoundingClientRect();
    const verticalAllowance = Math.min(70, rect.height * 0.14);
    if (clientY < rect.top - verticalAllowance || clientY > rect.bottom + verticalAllowance) {
      resetEdgeIntent();
      return;
    }

    const { rootRect, leftStart, rightStart } = edgeHoverGeometry(rect);
    let direction: -1 | 0 | 1 = 0;
    let liftProgress = 0;

    if (clientX <= leftStart) {
      direction = -1;
      liftProgress = clamp((leftStart - clientX) / Math.max(1, leftStart - rootRect.left), 0, 1);
    } else if (clientX >= rightStart) {
      direction = 1;
      liftProgress = clamp((clientX - rightStart) / Math.max(1, rootRect.right - rightStart), 0, 1);
    } else {
      resetEdgeIntent();
      return;
    }

    if (edgeAutoSequenceDirection !== 0 && edgeAutoSequenceDirection !== direction) {
      resetEdgeAutoSequence();
    }

    edgeLift = direction * smootherstep(liftProgress);
    updateEdgeHoverGlow(direction, liftProgress, clientX, clientY);
    const nextHoldDirection: -1 | 0 | 1 = liftProgress >= EDGE_HOLD_PROGRESS ? direction : 0;
    edgeHoldDirection = nextHoldDirection;
    updateEdgeGuideState();

    if (carouselMotion === 'none') renderCarousel();
    if (allowAutoBegin && edgeHoldDirection !== 0 && carouselMotion === 'none') beginEdgeAutoStep(edgeHoldDirection);
  };

  interface ListRect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  type ListDensity = 'featured-wide' | 'featured-stacked' | 'large' | 'medium' | 'compact' | 'sliver';

  const listTreeWeight = (node: ListTree, weights: number[]): number => {
    if (typeof node === 'number') return weights[node] ?? 1;
    return listTreeWeight(node.first, weights) + listTreeWeight(node.second, weights);
  };

  const layoutListTree = (
    node: ListTree,
    weights: number[],
    rect: ListRect,
    result: ListRect[],
  ) => {
    if (typeof node === 'number') {
      result[node] = rect;
      return;
    }

    const firstWeight = listTreeWeight(node.first, weights);
    const secondWeight = listTreeWeight(node.second, weights);
    const totalWeight = Math.max(0.001, firstWeight + secondWeight);
    const firstRatio = clamp(firstWeight / totalWeight, LIST_SPLIT_MIN, 1 - LIST_SPLIT_MIN);

    if (node.axis === 'x') {
      const firstWidth = rect.width * firstRatio;
      layoutListTree(node.first, weights, {
        x: rect.x,
        y: rect.y,
        width: firstWidth,
        height: rect.height,
      }, result);
      layoutListTree(node.second, weights, {
        x: rect.x + firstWidth,
        y: rect.y,
        width: rect.width - firstWidth,
        height: rect.height,
      }, result);
      return;
    }

    const firstHeight = rect.height * firstRatio;
    layoutListTree(node.first, weights, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: firstHeight,
    }, result);
    layoutListTree(node.second, weights, {
      x: rect.x,
      y: rect.y + firstHeight,
      width: rect.width,
      height: rect.height - firstHeight,
    }, result);
  };

  const resolveListDensity = (width: number, height: number, isActive: boolean): ListDensity => {
    if (isActive) return width >= 640 && height >= 300 ? 'featured-wide' : 'featured-stacked';

    const minDimension = Math.min(width, height);
    const area = width * height;
    const aspectRatio = width / Math.max(1, height);

    if (width < 118 || minDimension < 92) return 'sliver';
    if (width < 230 || height < 126 || aspectRatio < 0.62) return 'compact';
    if (area >= 118000 && width >= 340 && height >= 210) return 'large';
    if (area >= 70000 && width >= 240 && height >= 148 && aspectRatio >= 0.72) return 'medium';
    return 'compact';
  };

  const applyListSizing = (
    card: HTMLElement,
    width: number,
    height: number,
    density: ListDensity,
    isActive: boolean,
  ) => {
    const minDimension = Math.min(width, height);
    const paddingMin = density === 'sliver' ? 8 : density === 'compact' ? 12 : 14;
    const paddingMax = isActive ? 24 : density === 'large' ? 20 : 18;
    const padding = clamp(minDimension * (isActive ? 0.058 : 0.052), paddingMin, paddingMax);

    const titleMin = density === 'sliver'
      ? 13
      : density === 'compact'
        ? 16
        : density === 'medium'
          ? 18
          : density === 'large'
            ? 22
            : 30;
    const titleMax = isActive
      ? 84
      : density === 'large'
        ? 42
        : density === 'medium'
          ? 30
          : density === 'compact'
            ? 22
            : 17;
    const titleText = card.querySelector('h1, h2')?.textContent?.trim() ?? '';
    const titleCharacters = Math.max(4, titleText.length);
    const titleColumnRatio = density === 'featured-wide'
      ? 0.4
      : density === 'large'
        ? 0.47
        : density === 'medium'
          ? 0.58
          : 0.94;
    const titleAvailableWidth = Math.max(1, width * titleColumnRatio - padding * 2);
    const titleFitSize = titleAvailableWidth / (titleCharacters * 0.52);
    const titlePreferred = Math.min(
      width * (isActive ? 0.11 : density === 'large' ? 0.085 : density === 'medium' ? 0.076 : density === 'compact' ? 0.094 : 0.06),
      height * (isActive ? 0.26 : density === 'large' ? 0.18 : density === 'medium' ? 0.16 : density === 'compact' ? 0.18 : 0.13),
      density === 'sliver' ? titleMax : titleFitSize,
    );
    const titleSize = clamp(titlePreferred, titleMin, titleMax);

    const summaryMax = isActive ? 15.5 : density === 'large' ? 13.6 : density === 'medium' ? 12.6 : 12;
    const summarySize = clamp(Math.min(width * 0.03, height * 0.07), 12, summaryMax);
    const eyebrowSize = clamp(Math.min(width * 0.015, height * 0.042), 12, isActive ? 13 : 12.5);

    card.style.setProperty('--list-card-padding', `${padding.toFixed(2)}px`);
    card.style.setProperty('--list-title-size', `${titleSize.toFixed(2)}px`);
    card.style.setProperty('--list-summary-size', `${summarySize.toFixed(2)}px`);
    card.style.setProperty('--list-eyebrow-size', `${eyebrowSize.toFixed(2)}px`);
  };

  const updateListLayout = (index: number) => {
    const bounds = stage.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const weights = listBaseWeights.map((weight, cardIndex) => (
      cardIndex === index ? weight * LIST_ACTIVE_WEIGHT_BOOST : weight
    ));
    const rects: ListRect[] = [];
    layoutListTree(LIST_TREE, weights, {
      x: 0,
      y: 0,
      width: bounds.width,
      height: bounds.height,
    }, rects);

    const gap = clamp(Math.min(bounds.width, bounds.height) * 0.012, 6, 10);

    cards.forEach((card, cardIndex) => {
      const rect = rects[cardIndex];
      if (!rect) return;

      const x = rect.x + gap / 2;
      const y = rect.y + gap / 2;
      const width = Math.max(1, rect.width - gap);
      const height = Math.max(1, rect.height - gap);
      const isActive = cardIndex === index;
      const density = resolveListDensity(width, height, isActive);
      card.style.left = `${x.toFixed(2)}px`;
      card.style.top = `${y.toFixed(2)}px`;
      card.style.width = `${width.toFixed(2)}px`;
      card.style.height = `${height.toFixed(2)}px`;

      if (isActive) card.dataset.listActive = 'true';
      else delete card.dataset.listActive;

      card.dataset.listDensity = density;
      applyListSizing(card, width, height, density, isActive);
    });
  };

  const setListIndex = (nextIndex: number, _animateOutgoing = true) => {
    listIndex = clampIndex(nextIndex);
    updateListLayout(listIndex);
  };

  const trackListEntryAnimation = (animation: Animation) => {
    listEntryAnimations.add(animation);
    const cleanup = () => listEntryAnimations.delete(animation);
    animation.addEventListener('finish', cleanup, { once: true });
    animation.addEventListener('cancel', cleanup, { once: true });
  };

  const clearListEntryState = () => {
    window.clearTimeout(listEntryTimer);
    listEntryTimer = 0;
    listEntryLocked = false;
    delete root.dataset.listEntering;
  };

  const cancelListEntryAnimations = () => {
    clearListEntryState();
    listEntryAnimations.forEach((animation) => animation.cancel());
    listEntryAnimations.clear();
  };

  const setMode = (nextMode: 'carousel' | 'list', shouldAnnounce = true) => {
    cancelAllCarouselMotion();
    clearBoundaryGlow();
    mode = nextMode;
    root.dataset.mode = mode;
    writePreference(HOME_VIEW_MODE_STORAGE_KEY, mode);
    const isList = mode === 'list';
    if (isList) releaseEdgeFields(true);

    viewToggle.setAttribute('aria-pressed', String(isList));
    viewToggle.setAttribute('aria-label', isList ? 'Return to gallery' : 'Show overview');
    updateGuides();
    syncAutoSwipeControl();

    cards.forEach((card, index) => {
      if (isList) {
        card.removeAttribute('inert');
        card.setAttribute('aria-hidden', 'false');
        card.style.pointerEvents = 'auto';
        card.style.zIndex = '';
        card.style.removeProperty('filter');
        card.style.removeProperty('opacity');
      } else {
        delete card.dataset.listActive;
        delete card.dataset.listDensity;
        card.style.removeProperty('left');
        card.style.removeProperty('top');
        card.style.removeProperty('width');
        card.style.removeProperty('height');
        card.toggleAttribute('inert', index !== activeIndex);
      }
    });

    if (isList) {
      listIndex = activeIndex;
      setListIndex(listIndex, false);
      if (shouldAnnounce) announce(`Overview, all ${cards.length} portfolio sections visible`);
    } else {
      renderCarousel();
    }
  };

  const enterListMode = () => {
    cancelListEntryAnimations();
    cancelAllCarouselMotion();
    clearBoundaryGlow();

    const sourceCard = cards[activeIndex];
    const sourceRect = sourceCard.getBoundingClientRect();

    root.dataset.listEntering = 'true';
    listEntryLocked = true;
    setMode('list');

    if (reducedMotion.matches || typeof sourceCard.animate !== 'function') {
      clearListEntryState();
      return;
    }

    const targetRect = sourceCard.getBoundingClientRect();
    const sourceCentreX = sourceRect.left + sourceRect.width / 2;
    const sourceCentreY = sourceRect.top + sourceRect.height / 2;
    const targetCentreX = targetRect.left + targetRect.width / 2;
    const targetCentreY = targetRect.top + targetRect.height / 2;
    const scaleX = targetRect.width ? sourceRect.width / targetRect.width : 1;
    const scaleY = targetRect.height ? sourceRect.height / targetRect.height : 1;

    const sourceAnimation = sourceCard.animate(
      [
        {
          translate: `${sourceCentreX - targetCentreX}px ${sourceCentreY - targetCentreY}px`,
          scale: `${scaleX} ${scaleY}`,
          opacity: 1,
        },
        {
          translate: '0 0',
          scale: '1 1',
          opacity: 1,
        },
      ],
      {
        duration: 720,
        easing: 'cubic-bezier(0.2, 0.72, 0.16, 1)',
      },
    );
    trackListEntryAnimation(sourceAnimation);

    cards.forEach((card, index) => {
      if (index === activeIndex) return;

      const distance = Math.abs(index - activeIndex);
      const delay = 90 + Math.min(120, distance * 22);
      const animation = card.animate(
        [
          { translate: '0 0', scale: '0.965 0.965', opacity: 0 },
          { translate: '0 0', scale: '1 1', opacity: 1 },
        ],
        {
          duration: 500,
          delay,
          easing: 'cubic-bezier(0.22, 0.68, 0.2, 1)',
          fill: 'backwards',
        },
      );
      trackListEntryAnimation(animation);
    });

    listEntryTimer = window.setTimeout(() => {
      clearListEntryState();
    }, 760);
  };

  const returnToCarousel = () => {
    const targetIndex = clampIndex(listIndex);
    const target = cards[targetIndex];
    const startRect = target.getBoundingClientRect();
    cancelListEntryAnimations();

    activeIndex = targetIndex;
    updateRail();
    setMode('carousel', false);
    announceActiveSection();

    if (reducedMotion.matches || typeof target.animate !== 'function') return;

    const endRect = target.getBoundingClientRect();
    const startCentreX = startRect.left + startRect.width / 2;
    const startCentreY = startRect.top + startRect.height / 2;
    const endCentreX = endRect.left + endRect.width / 2;
    const endCentreY = endRect.top + endRect.height / 2;
    const scaleX = endRect.width ? startRect.width / endRect.width : 1;
    const scaleY = endRect.height ? startRect.height / endRect.height : 1;

    target.animate(
      [
        {
          translate: `${startCentreX - endCentreX}px ${startCentreY - endCentreY}px`,
          scale: `${scaleX} ${scaleY}`,
          opacity: 1,
        },
        { translate: '0 0', scale: '1 1', opacity: 1 },
      ],
      { duration: 520, easing: 'cubic-bezier(0.18, 0.76, 0.16, 1)' },
    );

    cards.forEach((card, index) => {
      if (index === targetIndex) return;
      const finalOpacity = Number(card.style.opacity || '0');
      card.animate(
        [{ opacity: 0 }, { opacity: finalOpacity }],
        { duration: 360, easing: 'ease-out' },
      );
    });
  };

  const syncAutoSwipeControl = () => {
    if (!autoSwipeControl || !autoSwipeToggle) return;
    const available = fineHover.matches && !reducedMotion.matches && mode === 'carousel';
    autoSwipeControl.hidden = !available;
    autoSwipeToggle.disabled = !available;
    autoSwipeToggle.checked = autoSwipeEnabled;
  };

  const setAutoSwipeEnabled = (enabled: boolean, persist = true) => {
    autoSwipeEnabled = enabled;
    root.dataset.autoSwipe = enabled ? 'on' : 'off';
    if (autoSwipeToggle) autoSwipeToggle.checked = enabled;

    if (!enabled) {
      window.clearTimeout(autoSwipePulseTimer);
      autoSwipePulseTimer = 0;
      delete root.dataset.autoSwipePulse;
      resetEdgeIntent();
      resetEdgeAutoSequence();
      releaseEdgeFields(true);
    } else if (persist) {
      pulseAutoSwipeEdges();
    }

    if (persist) writePreference(AUTO_SWIPE_STORAGE_KEY, enabled ? 'on' : 'off');
  };

  autoSwipeToggle?.addEventListener('change', () => {
    setAutoSwipeEnabled(autoSwipeToggle.checked);
  });

  previousGuide.addEventListener('click', () => {
    if (mode !== 'carousel') return;
    settleEdgeMotion();
    edgeSuppressedUntil = performance.now() + 420;
    requestManualNavigation(-1);
  });

  nextGuide.addEventListener('click', () => {
    if (mode !== 'carousel') return;
    settleEdgeMotion();
    edgeSuppressedUntil = performance.now() + 420;
    requestManualNavigation(1);
  });

  viewToggle.addEventListener('click', () => {
    if (mode === 'list') returnToCarousel();
    else enterListMode();
  });

  stage.addEventListener('wheel', (event) => {
    if (mode !== 'carousel') return;

    // Treat wheel navigation as a horizontal gesture only. Ordinary vertical
    // mouse-wheel/trackpad scrolling should not unexpectedly change sections.
    const horizontalDelta = Math.abs(event.deltaX) > 0
      ? event.deltaX
      : event.shiftKey
        ? event.deltaY
        : 0;
    const minimumDelta = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? 6 : 1;
    const hasHorizontalIntent = Math.abs(horizontalDelta) >= minimumDelta
      && (event.shiftKey || Math.abs(horizontalDelta) >= Math.abs(event.deltaY) * 1.25);
    if (!hasHorizontalIntent) return;

    event.preventDefault();
    if (wheelLocked) return;

    const direction: -1 | 1 = horizontalDelta > 0 ? 1 : -1;
    const wraps = activeIndex + direction < 0 || activeIndex + direction >= cards.length;

    settleEdgeMotion();
    clearManualNavigation();
    edgeSuppressedUntil = performance.now() + 420;
    wheelLocked = true;
    moveBy(direction);
    window.setTimeout(() => { wheelLocked = false; }, reducedMotion.matches ? 40 : wraps ? EDGE_WRAP_DURATION + 80 : CARD_STEP_DURATION + 80);
  }, { passive: false });

  stage.addEventListener('pointerdown', (event) => {
    if (mode !== 'carousel' || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a:not([data-list-card-link]):not(.gallery-preview--linked)')) return;

    // Dragging belongs to the visible active card only. Empty stage space, the
    // dead band and neighbouring cards must not become invisible grab handles.
    const activeCard = cards[activeIndex];
    if (!pointInsideRoundedCard(activeCard, event.clientX, event.clientY)) return;

    settleEdgeMotion();
    clearManualNavigation();
    if (carouselMotion !== 'none') return;
    edgeSuppressedUntil = performance.now() + 420;

    pointerId = event.pointerId;
    dragPointerType = event.pointerType;
    dragStartX = event.clientX;
    dragX = 0;
    dragPosition = activeIndex;
    pendingDragPosition = activeIndex;
    boundaryDragSide = 0;
    boundaryDragPull = 0;
    clearBoundaryGlow();
    dragScale = Math.max(250, stage.clientWidth * 0.44);
    dragged = false;
    dragSamples.length = 0;
    recordDragSample(event.clientX, event.timeStamp);
    carouselMotion = 'drag';
    root.dataset.carouselMotion = 'drag';
    root.dataset.dragging = 'true';
    // Capture on the link that received the press, not on the stage. A plain
    // click must keep its native destination (including preview links).
    dragCaptureTarget = target.closest<HTMLElement>('a') ?? activeCard;
    dragCaptureTarget.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', (event) => {
    if (mode === 'list') {
      if (!listEntryLocked && event.pointerType === 'mouse' && fineHover.matches) {
        const card = (event.target as Element).closest<HTMLElement>('[data-gallery-card]');
        const index = card ? Number(card.dataset.slideIndex) : Number.NaN;
        if (Number.isFinite(index) && index !== listIndex) setListIndex(index);
      }
      return;
    }

    if (pointerId !== event.pointerId) return;

    const coalesced = typeof event.getCoalescedEvents === 'function'
      ? event.getCoalescedEvents()
      : [event];
    for (const sample of coalesced.length ? coalesced : [event]) {
      recordDragSample(sample.clientX, sample.timeStamp);
    }

    dragX = event.clientX - dragStartX;
    if (Math.abs(dragX) > 5) dragged = true;
    const rawPosition = activeIndex - dragX / dragScale;
    const lastIndex = cards.length - 1;

    boundaryDragSide = 0;
    boundaryDragPull = 0;

    if (activeIndex === 0 && rawPosition < 0) {
      boundaryDragSide = -1;
      boundaryDragPull = -rawPosition;
      dragPosition = -resistedBoundaryPull(boundaryDragPull);
      updateBoundaryGlow(boundaryDragSide, boundaryDragPull);
    } else if (activeIndex === lastIndex && rawPosition > lastIndex) {
      boundaryDragSide = 1;
      boundaryDragPull = rawPosition - lastIndex;
      dragPosition = lastIndex + resistedBoundaryPull(boundaryDragPull);
      updateBoundaryGlow(boundaryDragSide, boundaryDragPull);
    } else {
      dragPosition = Math.max(0, Math.min(lastIndex, rawPosition));
      clearBoundaryGlow();
    }

    edgeLift = 0;
    scheduleDragRender(dragPosition);
  });

  const finishDrag = (event: PointerEvent, cancelled = false) => {
    if (pointerId !== event.pointerId) return;

    if (dragRenderFrame) cancelAnimationFrame(dragRenderFrame);
    dragRenderFrame = 0;
    renderCarousel(dragPosition);

    const releaseVelocity = cancelled ? 0 : releaseVelocityPxPerMs(event.timeStamp);
    const dragOffset = dragPosition - activeIndex;
    const isMouseThrow = dragPointerType === 'mouse'
      && Math.abs(releaseVelocity) >= MOUSE_THROW_VELOCITY;
    const velocityDirection: -1 | 0 | 1 = isMouseThrow
      ? (releaseVelocity < 0 ? 1 : -1)
      : 0;
    const boundaryVelocityCommit = boundaryDragSide !== 0
      && velocityDirection === boundaryDragSide;
    const boundaryWrapDirection: -1 | 0 | 1 = !cancelled
      && boundaryDragSide !== 0
      && (boundaryDragPull >= BOUNDARY_DRAG_TRIGGER || boundaryVelocityCommit)
      ? boundaryDragSide
      : 0;

    let direction: -1 | 0 | 1 = 0;
    if (boundaryWrapDirection !== 0) direction = boundaryWrapDirection;
    else if (isMouseThrow) direction = velocityDirection;
    else if (!cancelled && Math.abs(dragOffset) >= MOUSE_DRAG_DISTANCE) direction = dragOffset > 0 ? 1 : -1;

    const releasedFromPosition = dragPosition;
    pointerId = null;
    dragPointerType = '';
    dragSamples.length = 0;
    boundaryDragSide = 0;
    boundaryDragPull = 0;
    delete root.dataset.dragging;
    clearBoundaryGlow();
    clearEdgeHoverGlow();
    carouselMotion = 'none';
    delete root.dataset.carouselMotion;

    if (dragCaptureTarget?.hasPointerCapture(event.pointerId)) {
      dragCaptureTarget.releasePointerCapture(event.pointerId);
    }
    dragCaptureTarget = null;
    edgeSuppressedUntil = performance.now() + 420;

    if (boundaryWrapDirection !== 0) {
      runWrapFlick(boundaryWrapDirection, EDGE_WRAP_DURATION, undefined, releasedFromPosition);
    } else if (direction !== 0 && isMouseThrow) {
      runMouseThrow(direction, releasedFromPosition, releaseVelocity);
    } else if (direction !== 0) {
      moveBy(direction, releasedFromPosition);
    } else {
      settleToActive(releasedFromPosition);
    }

    window.setTimeout(() => { dragged = false; }, 0);
  };

  stage.addEventListener('pointerup', (event) => finishDrag(event));
  stage.addEventListener('pointercancel', (event) => finishDrag(event, true));

  root.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || !autoSwipeEnabled) return;
    edgePointerClientX = event.clientX;
    edgePointerClientY = event.clientY;
    updateEdgeIntentFromPoint(event.clientX, event.clientY, event.target as Element);
  });

  root.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') return;
    hasEdgePointer = false;
    resetEdgeIntent();
  });

  stage.addEventListener('click', (event) => {
    if (mode !== 'carousel') return;
    // Pointer capture can deliver a click after a swipe. It must never follow
    // either the section link or a project preview after the card was dragged.
    if (dragged || carouselMotion !== 'none') {
      event.preventDefault();
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, textarea, select')) return;
    const card = target.closest<HTMLElement>('[data-gallery-card]');
    if (!card) return;
    const index = Number(card.dataset.slideIndex);
    if (Number.isFinite(index) && index !== activeIndex) setActive(index);
  }, true);

  const railIndexFromClientX = (clientX: number) => {
    const rect = rail.getBoundingClientRect();
    if (!rect.width) return activeIndex;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (cards.length - 1));
  };

  rail.addEventListener('pointermove', (event) => {
    if (mode !== 'carousel') return;

    const index = railIndexFromClientX(event.clientX);
    if (railPointerId === event.pointerId) {
      if (!railDragMoved && Math.abs(event.clientX - railDragStartX) > 4) railDragMoved = true;
      if (railDragMoved) {
        clearRailPreview();
        setActive(index, false);
      }
      return;
    }

    if (event.pointerType === 'mouse' && fineHover.matches) previewRailIndex(index);
  });

  rail.addEventListener('pointerleave', () => {
    if (railPointerId === null) clearRailPreview();
  });

  rail.addEventListener('pointerdown', (event) => {
    if (mode !== 'carousel' || event.button !== 0) return;
    settleEdgeMotion();
    clearManualNavigation();
    edgeSuppressedUntil = performance.now() + 220;
    clearRailPreview();
    railPointerId = event.pointerId;
    railDragStartX = event.clientX;
    railDragMoved = false;
    rail.setPointerCapture(event.pointerId);
  });

  const finishRailDrag = (event: PointerEvent) => {
    if (railPointerId !== event.pointerId) return;
    const wasDragged = railDragMoved;
    railPointerId = null;
    railDragMoved = false;
    suppressRailClick = wasDragged;
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    if (wasDragged) announceActiveSection();
    window.setTimeout(() => { suppressRailClick = false; }, 0);
  };

  rail.addEventListener('pointerup', finishRailDrag);
  rail.addEventListener('pointercancel', finishRailDrag);

  rail.addEventListener('click', (event) => {
    if (mode !== 'carousel' || suppressRailClick) return;
    if ((event.target as Element).closest('[data-gallery-tick]')) return;
    settleEdgeMotion();
    clearManualNavigation();
    edgeSuppressedUntil = performance.now() + 220;
    setActive(railIndexFromClientX(event.clientX));
  });

  ticks.forEach((tick, index) => {
    tick.addEventListener('click', () => {
      if (mode !== 'carousel' || suppressRailClick) return;
      settleEdgeMotion();
      clearManualNavigation();
      edgeSuppressedUntil = performance.now() + 220;
      setActive(index);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (mode !== 'carousel') return;
    const target = event.target as HTMLElement;
    const blocksCarouselKeys = target.matches('input, textarea, select')
      || target.isContentEditable
      || (target.matches('button') && !target.matches('[data-gallery-guide]'));
    if (blocksCarouselKeys) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      settleEdgeMotion();
      requestManualNavigation(1, event.repeat ? 2 : Number.POSITIVE_INFINITY);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      settleEdgeMotion();
      requestManualNavigation(-1, event.repeat ? 2 : Number.POSITIVE_INFINITY);
    } else if (event.key === 'Home') {
      event.preventDefault();
      cancelAllCarouselMotion();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      cancelAllCarouselMotion();
      setActive(cards.length - 1);
    }
  });

  window.addEventListener('resize', () => {
    if (mode === 'carousel') {
      resetEdgeIntent();
      renderCarousel();
    } else updateListLayout(listIndex);
  });

  fineHover.addEventListener('change', () => {
    resetEdgeIntent();
    syncAutoSwipeControl();
    if (mode === 'list') setListIndex(listIndex, false);
  });

  edgeHoverMedia.addEventListener('change', () => {
    resetEdgeIntent();
  });

  reducedMotion.addEventListener('change', () => {
    resetEdgeIntent();
    if (reducedMotion.matches) {
      window.clearTimeout(autoSwipePulseTimer);
      autoSwipePulseTimer = 0;
      delete root.dataset.autoSwipePulse;
      releaseEdgeFields(true);
    }
    syncAutoSwipeControl();
    if (mode === 'list' && reducedMotion.matches) cancelListEntryAnimations();
    if (mode === 'carousel') renderCarousel();
  });

  clearBoundaryGlow();
  const storedAutoSwipe = readPreference(AUTO_SWIPE_STORAGE_KEY);
  setAutoSwipeEnabled(storedAutoSwipe === 'on', false);
  syncAutoSwipeControl();

  const storedMode = readPreference(HOME_VIEW_MODE_STORAGE_KEY);
  if (storedMode === 'list') {
    activeIndex = 0;
    updateRail();
    setMode('list', false);
  } else {
    setMode('carousel', false);
    setActive(0, false);
  }
}
