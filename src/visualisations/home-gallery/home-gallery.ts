const root = document.querySelector<HTMLElement>('[data-gallery]');
const stage = document.querySelector<HTMLElement>('[data-gallery-stage]');
const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-gallery-card]'));
const rail = document.querySelector<HTMLElement>('[data-gallery-rail]');
const railThumb = document.querySelector<HTMLElement>('[data-gallery-thumb]');
const ticks = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gallery-tick]'));
const viewToggle = document.querySelector<HTMLButtonElement>('[data-view-toggle]');
const previousGuide = document.querySelector<HTMLButtonElement>("[data-gallery-guide='previous']");
const nextGuide = document.querySelector<HTMLButtonElement>("[data-gallery-guide='next']");

if (root && stage && cards.length && rail && railThumb && ticks.length && viewToggle && previousGuide && nextGuide) {
  let activeIndex = 0;
  let listIndex = 0;
  let mode: 'carousel' | 'list' = 'carousel';
  let pointerId: number | null = null;
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
  let wheelLocked = false;
  let leavingTimer = 0;
  let carouselFrame = 0;
  let carouselMotion: 'none' | 'wrap' | 'edge' | 'step' | 'drag' = 'none';
  let edgeHoldDirection: -1 | 0 | 1 = 0;
  let edgeLift = 0;
  let edgeAutoStepCount = 0;
  let edgeAutoDirection: -1 | 0 | 1 = 0;
  let hasEdgePointer = false;
  let edgeSuppressedUntil = 0;
  let manualSequenceActive = false;
  const manualStepQueue: Array<-1 | 1> = [];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const edgeHoverMedia = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');

  const EDGE_AUTO_FIRST_DURATION = 1500;
  const EDGE_AUTO_REPEAT_DURATION = 750;
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
    const deadBand = clamp(width * 0.012, 18, 30);

    const nominalLeftStart = rootRect.left + guideInset + guideWidth + guideLead;
    const nominalRightStart = rootRect.right - guideInset - guideWidth - guideLead;
    const leftStart = Math.min(cardRect.left - deadBand, nominalLeftStart);
    const rightStart = Math.max(cardRect.right + deadBand, nominalRightStart);

    return { rootRect, leftStart, rightStart };
  };

  const clearBoundaryGlow = () => {
    root.style.setProperty('--boundary-glow-left', '0');
    root.style.setProperty('--boundary-glow-right', '0');
    root.style.setProperty('--boundary-glow-left-scale', '0.7');
    root.style.setProperty('--boundary-glow-right-scale', '0.7');
  };

  const updateBoundaryGlow = (side: -1 | 0 | 1, rawPull: number) => {
    if (side === 0 || rawPull <= 0) {
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
  };

  const updateEdgeHoverGlow = (
    direction: -1 | 1,
    progress: number,
    clientY: number,
  ) => {
    const stageRect = stage.getBoundingClientRect();
    const y = clamp(
      ((clientY - stageRect.top) / Math.max(1, stageRect.height)) * 100,
      4,
      96,
    );
    const eased = smootherstep(progress);
    // Keep edge-hover feedback substantially softer than endpoint pressure.
    // The broad side wash gives the entire edge presence, while the radial
    // bulge follows the pointer and strengthens with hover pressure.
    const opacity = (0.08 + eased * 0.24) * Math.min(1, progress * 3.5);

    if (direction < 0) {
      root.style.setProperty('--edge-hover-glow-right', '0');
      root.style.setProperty('--edge-hover-glow-left', opacity.toFixed(4));
      root.style.setProperty('--edge-hover-glow-left-y', `${y.toFixed(2)}%`);
    } else {
      root.style.setProperty('--edge-hover-glow-left', '0');
      root.style.setProperty('--edge-hover-glow-right', opacity.toFixed(4));
      root.style.setProperty('--edge-hover-glow-right-y', `${y.toFixed(2)}%`);
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

  const setActive = (nextIndex: number) => {
    activeIndex = clampIndex(Math.round(nextIndex));
    updateRail();
    updateGuides();
    if (mode === 'carousel') renderCarousel();
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
    edgeAutoStepCount = 0;
    edgeAutoDirection = 0;
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
    edgeAutoStepCount = 0;
    edgeAutoDirection = 0;
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

  const edgeHoverAvailable = () => edgeHoverMedia.matches && !reducedMotion.matches;

  const beginEdgeAutoStep = (direction: -1 | 1) => {
    if (!edgeHoverAvailable() || mode !== 'carousel' || carouselMotion !== 'none') return;
    if (edgeHoldDirection !== direction) return;

    if (edgeAutoDirection !== direction) {
      edgeAutoDirection = direction;
      edgeAutoStepCount = 0;
    }

    const duration = edgeAutoStepCount === 0
      ? EDGE_AUTO_FIRST_DURATION
      : EDGE_AUTO_REPEAT_DURATION;

    carouselMotion = 'edge';
    root.dataset.carouselMotion = 'edge';
    const startIndex = activeIndex;
    const targetIndex = wrapIndex(startIndex + direction);
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
      // Preserve any hover lift already present when the first move starts,
      // then release it smoothly. Repeated held-edge steps start from zero,
      // so they no longer inject a fresh tilt/scale jump on their first frame.
      const liftRelease = smootherstep(Math.min(1, progress / 0.24));
      edgeLift = startingEdgeLift * (1 - liftRelease);
      updateEdgeGuideState();
      renderCarousel(startPosition + (targetPosition - startPosition) * moveProgress);

      if (progress < 1) {
        carouselFrame = requestAnimationFrame(frame);
        return;
      }

      edgeAutoStepCount += 1;
      finishAnimatedMove(targetIndex, () => {
        if (edgeHoldDirection === direction && hasEdgePointer) beginEdgeAutoStep(direction);
      });
    };

    carouselFrame = requestAnimationFrame(frame);
  };

  const resetEdgeIntent = (cancelRunning = true) => {
    edgeHoldDirection = 0;
    edgeLift = 0;
    edgeAutoStepCount = 0;
    edgeAutoDirection = 0;
    clearEdgeGuideState();
    clearEdgeHoverGlow();
    if (cancelRunning && carouselMotion === 'edge') settleEdgeMotion();
    else if (mode === 'carousel' && carouselMotion === 'none') renderCarousel();
  };

  const updateEdgeIntentFromPoint = (clientX: number, clientY: number, target?: Element | null) => {
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

    edgeLift = direction * smootherstep(liftProgress);
    updateEdgeHoverGlow(direction, liftProgress, clientY);
    const nextHoldDirection: -1 | 0 | 1 = liftProgress >= EDGE_HOLD_PROGRESS ? direction : 0;
    if (nextHoldDirection !== edgeHoldDirection) {
      edgeAutoStepCount = 0;
      edgeAutoDirection = nextHoldDirection;
    }
    edgeHoldDirection = nextHoldDirection;
    updateEdgeGuideState();

    if (carouselMotion === 'none') renderCarousel();
    if (edgeHoldDirection !== 0 && carouselMotion === 'none') beginEdgeAutoStep(edgeHoldDirection);
  };

  const clearListLeaving = () => {
    window.clearTimeout(leavingTimer);
    cards.forEach((card) => {
      delete card.dataset.listLeaving;
      card.style.removeProperty('--vacuum-x');
    });
  };

  const updateListLayout = (index: number) => {
    const canExpand = fineHover.matches && window.innerWidth > 900;

    cards.forEach((card, cardIndex) => {
      const distance = Math.abs(cardIndex - index);
      const direction = Math.sign(cardIndex - index) || 1;
      const ripple = canExpand && distance > 0 && distance < 4
        ? direction * Math.max(1, 5 - distance * 1.35)
        : 0;
      const rippleScale = canExpand && distance > 0 && distance < 3
        ? Math.max(0.985, 1 - (3 - distance) * 0.006)
        : 1;

      card.style.setProperty('--ripple-y', `${ripple}px`);
      card.style.setProperty('--ripple-scale', String(rippleScale));
    });

    if (!canExpand) {
      stage.style.gridTemplateColumns = '';
      return;
    }

    const tracks = cards.map((_, cardIndex) => {
      const distance = Math.abs(cardIndex - index);
      if (distance === 0) return '2.25fr';
      if (distance === 1) return '0.96fr';
      if (distance === 2) return '0.84fr';
      return '0.74fr';
    });
    stage.style.gridTemplateColumns = tracks.join(' ');
  };

  const setListIndex = (nextIndex: number, animateOutgoing = true) => {
    const next = clampIndex(nextIndex);
    const previous = listIndex;
    listIndex = next;

    if (animateOutgoing && previous !== next && fineHover.matches) {
      clearListLeaving();
      const outgoing = cards[previous];
      outgoing.dataset.listLeaving = 'true';
      outgoing.style.setProperty('--vacuum-x', `${Math.sign(next - previous) * 10}px`);
      leavingTimer = window.setTimeout(clearListLeaving, reducedMotion.matches ? 1 : 320);
    }

    cards.forEach((card, index) => {
      if (fineHover.matches && index === listIndex) card.dataset.listActive = 'true';
      else delete card.dataset.listActive;
    });

    updateListLayout(listIndex);
  };

  const setMode = (nextMode: 'carousel' | 'list') => {
    cancelAllCarouselMotion();
    clearBoundaryGlow();
    mode = nextMode;
    root.dataset.mode = mode;
    const isList = mode === 'list';

    viewToggle.setAttribute('aria-pressed', String(isList));
    viewToggle.setAttribute('aria-label', isList ? 'Return to gallery view' : 'Show list view');
    updateGuides();

    cards.forEach((card, index) => {
      card.style.animationDelay = '';
      delete card.dataset.touchActive;

      if (isList) {
        card.removeAttribute('inert');
        card.setAttribute('aria-hidden', 'false');
        card.style.pointerEvents = 'auto';
        card.style.zIndex = '';
        card.style.removeProperty('filter');
      } else {
        delete card.dataset.listActive;
        card.toggleAttribute('inert', index !== activeIndex);
      }
    });

    if (isList) {
      listIndex = activeIndex;
      cards.forEach((card, index) => {
        card.style.animationDelay = reducedMotion.matches ? '0ms' : `${index * 24}ms`;
      });
      setListIndex(listIndex, false);
    } else {
      clearListLeaving();
      stage.style.gridTemplateColumns = '';
      renderCarousel();
    }
  };

  const returnToCarousel = () => {
    const targetIndex = clampIndex(listIndex);
    const target = cards[targetIndex];
    const startRect = target.getBoundingClientRect();

    activeIndex = targetIndex;
    updateRail();
    setMode('carousel');

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
    cancelAllCarouselMotion();
    if (mode === 'list') returnToCarousel();
    else setMode('list');
  });

  stage.addEventListener('wheel', (event) => {
    if (mode !== 'carousel') return;
    event.preventDefault();
    if (wheelLocked) return;

    const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(dominantDelta) < 6) return;

    const direction: -1 | 1 = dominantDelta > 0 ? 1 : -1;
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
    if (target.closest('button, input, textarea, select, a:not([data-list-card-link])')) return;

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
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', (event) => {
    if (pointerId !== event.pointerId || mode !== 'carousel') return;

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

    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
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
    if (event.pointerType !== 'mouse') return;
    updateEdgeIntentFromPoint(event.clientX, event.clientY, event.target as Element);
  });

  root.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') return;
    hasEdgePointer = false;
    resetEdgeIntent();
  });

  stage.addEventListener('click', (event) => {
    if (mode !== 'carousel' || dragged || carouselMotion !== 'none') return;
    const target = event.target as HTMLElement;
    if (target.closest('button, input, textarea, select')) return;
    const card = target.closest<HTMLElement>('[data-gallery-card]');
    if (!card) return;
    const index = Number(card.dataset.slideIndex);
    if (!Number.isFinite(index)) return;

    if (index === activeIndex) {
      const link = card.querySelector<HTMLAnchorElement>('[data-list-card-link]');
      if (link?.href) window.location.assign(link.href);
      return;
    }

    setActive(index);
  });

  cards.forEach((card, index) => {
    card.addEventListener('pointerenter', (event) => {
      if (mode !== 'list' || !fineHover.matches || event.pointerType === 'touch') return;
      setListIndex(index);
    });

    const surfaceLink = card.querySelector<HTMLAnchorElement>('[data-list-card-link]');
    surfaceLink?.addEventListener('pointerdown', (event) => {
      if (mode !== 'list' || event.pointerType === 'mouse') return;
      card.dataset.touchActive = 'true';
    });

    const clearTouch = () => {
      window.setTimeout(() => { delete card.dataset.touchActive; }, 120);
    };

    surfaceLink?.addEventListener('pointerup', clearTouch);
    surfaceLink?.addEventListener('pointercancel', clearTouch);
    surfaceLink?.addEventListener('focus', () => {
      if (mode === 'list') setListIndex(index, false);
    });
  });

  const railIndexFromClientX = (clientX: number) => {
    const rect = rail.getBoundingClientRect();
    if (!rect.width) return activeIndex;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (cards.length - 1));
  };

  rail.addEventListener('pointermove', (event) => {
    if (mode !== 'carousel') return;
    if (event.pointerType === 'mouse' && fineHover.matches) {
      settleEdgeMotion();
      clearManualNavigation();
      edgeSuppressedUntil = performance.now() + 220;
      setActive(railIndexFromClientX(event.clientX));
      return;
    }
    if (railPointerId === event.pointerId) setActive(railIndexFromClientX(event.clientX));
  });

  rail.addEventListener('pointerdown', (event) => {
    if (mode !== 'carousel' || event.button !== 0) return;
    settleEdgeMotion();
    clearManualNavigation();
    edgeSuppressedUntil = performance.now() + 220;
    railPointerId = event.pointerId;
    setActive(railIndexFromClientX(event.clientX));
    rail.setPointerCapture(event.pointerId);
  });

  const finishRailDrag = (event: PointerEvent) => {
    if (railPointerId !== event.pointerId) return;
    railPointerId = null;
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  };

  rail.addEventListener('pointerup', finishRailDrag);
  rail.addEventListener('pointercancel', finishRailDrag);

  ticks.forEach((tick, index) => {
    tick.addEventListener('pointerenter', (event) => {
      if (mode === 'carousel' && event.pointerType === 'mouse' && fineHover.matches) {
        settleEdgeMotion();
        clearManualNavigation();
        edgeSuppressedUntil = performance.now() + 220;
        setActive(index);
      }
    });
    tick.addEventListener('focus', () => {
      if (mode === 'carousel') {
        settleEdgeMotion();
        clearManualNavigation();
        setActive(index);
      }
    });
    tick.addEventListener('click', () => {
      if (mode === 'carousel') {
        settleEdgeMotion();
        clearManualNavigation();
        setActive(index);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (mode !== 'carousel') return;
    const target = event.target as HTMLElement;
    const blocksCarouselKeys = target.matches('input, textarea, select')
      || target.isContentEditable
      || (target.matches('button') && !target.matches('[data-gallery-guide]'));
    if (blocksCarouselKeys) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      settleEdgeMotion();
      requestManualNavigation(1, event.repeat ? 2 : Number.POSITIVE_INFINITY);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
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
    if (mode === 'list') setListIndex(listIndex, false);
  });

  edgeHoverMedia.addEventListener('change', () => {
    resetEdgeIntent();
  });

  reducedMotion.addEventListener('change', () => {
    resetEdgeIntent();
    if (mode === 'carousel') renderCarousel();
  });

  clearBoundaryGlow();
  setMode('carousel');
  setActive(0);
}
