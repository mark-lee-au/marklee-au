/** Shared viewport-edge drawer: a click toggles it; a drag moves its tab vertically.
 * The panel remains in the document for focus management, but is inert while closed. */
export type EdgeDrawer = { setOpen(open: boolean): void; isOpen(): boolean; position(): void };

const EDGE_MARGIN_PX = 6;

/** The tab sits halfway down its panel. Keep the panel's top and bottom
 * inside the viewport in both states, rather than using the small tab height
 * as the collapsed-state limit. */
export function clampEdgeDrawerTop(requestedTop: number, viewportHeight: number, drawerHeight: number): number {
  const bottomLimit = Math.max(EDGE_MARGIN_PX, viewportHeight - drawerHeight - EDGE_MARGIN_PX);
  return Math.min(bottomLimit, Math.max(EDGE_MARGIN_PX, requestedTop));
}

export function setupEdgeDrawer(options: {
  viewport: HTMLElement;
  drawer: HTMLElement;
  tab: HTMLButtonElement;
  panel: HTMLElement;
  edge: 'left' | 'right';
  initiallyOpen: boolean;
  initialTopFraction: number;
  name: string;
  reducedMotion: () => boolean;
}): EdgeDrawer {
  const { viewport, drawer, tab, panel, edge, name } = options;
  let open = options.initiallyOpen;
  let top: number | null = null;
  let drag: { id: number; y: number; top: number; moved: boolean } | null = null;
  let suppressClick = false;
  drawer.classList.add('fireworks-simulator__edge-drawer', `fireworks-simulator__edge-drawer--${edge}`);
  tab.classList.add('fireworks-simulator__edge-tab');
  // The scene normally fills 100dvh, but its minimum height can exceed a very
  // short browser window. Bound tabs to the visible window, not the overflow.
  const visibleHeight = () => Math.max(1, Math.min(
    viewport.clientHeight, window.innerHeight - viewport.getBoundingClientRect().top,
  ));
  const position = () => {
    const h = visibleHeight();
    // Collapsing only changes opacity/translation, not the panel's height.
    // Keep the central tab the same distance from each screen edge.
    top = clampEdgeDrawerTop(top ?? h * options.initialTopFraction, h, drawer.offsetHeight);
    drawer.style.top = `${top}px`;
  };
  const setOpen = (next: boolean) => {
    open = next;
    drawer.classList.toggle('is-open', open);
    drawer.classList.toggle('is-collapsed', !open);
    panel.inert = !open;
    panel.setAttribute('aria-hidden', String(!open));
    tab.setAttribute('aria-expanded', String(open));
    const label = `${open ? 'Hide' : 'Show'} ${name}`;
    tab.setAttribute('aria-label', label);
    tab.title = `${label}. Drag vertically to move tab`;
    tab.textContent = (edge === 'left') ? (open ? '‹' : '›') : (open ? '›' : '‹');
    if (!open && panel.contains(document.activeElement)) tab.focus();
    position();
  };
  tab.addEventListener('click', (event) => {
    if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
    setOpen(!open);
  });
  tab.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    position();
    drag = { id: event.pointerId, y: event.clientY, top: top ?? 0, moved: false };
    tab.setPointerCapture(event.pointerId);
  });
  tab.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dy = event.clientY - drag.y;
    if (Math.abs(dy) > 6) drag.moved = true;
    if (!drag.moved) return;
    drawer.classList.add('is-dragging');
    top = clampEdgeDrawerTop(drag.top + dy, visibleHeight(), drawer.offsetHeight);
    drawer.style.top = `${top}px`;
  });
  const finish = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    drawer.classList.remove('is-dragging');
    if (moved) {
      suppressClick = true;
      // Pointer capture can be lost without generating a click.
      window.setTimeout(() => { suppressClick = false; }, 100);
    }
  };
  tab.addEventListener('pointerup', finish);
  tab.addEventListener('pointercancel', finish);
  tab.addEventListener('lostpointercapture', finish);
  window.addEventListener('resize', position);
  // Landmark lists and responsive panels can change size without a window resize.
  // Clamp the saved top again so neither panel drifts past the bottom edge.
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(position);
    observer.observe(viewport);
    observer.observe(drawer);
  }
  setOpen(open);
  return { setOpen, isOpen: () => open, position };
}
