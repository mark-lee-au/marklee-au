/** Temporary user calibration for city navigation. All controls are dimensionless
 * multipliers applied at the final mouse/key handlers, not in the city geometry. */
export const NAV_CALIBRATION_VERSION = 4;
/** Tested baseline supplied by the project owner. Calibration is session-only:
 * refreshing always restores these values, regardless of older localStorage data. */
export const NAV_DEFAULT_PROFILE = Object.freeze({
  mouseMoveLow: 2.35, mouseMoveHigh: 1.00,
  mousePanLow: 1.50, mousePanHigh: 0.75,
  keyboardMoveLow: 5.75, keyboardMoveHigh: 2.25,
  keyboardPanLow: 5.75, keyboardPanHigh: 2.25,
  curvePower: 1.6,
});
// Keep the named defaults for existing test consumers.
export const NAV_DEFAULT_MOUSE_MOVE = NAV_DEFAULT_PROFILE.mouseMoveHigh;
export const NAV_DEFAULT_MOUSE_PAN = NAV_DEFAULT_PROFILE.mousePanHigh;
export const NAV_DEFAULT_KEYBOARD = NAV_DEFAULT_PROFILE.keyboardMoveHigh;
export const NAV_MIN = 0.25;
export const NAV_MAX = 10;
export const NAV_STEP = 0.05;
// Shared logarithmic altitude domain. Low altitude can have a stronger input
// response without changing the underlying ground-ray/metres-per-pixel model.
export const NAV_LOW_HEIGHT_M = 10;
export const NAV_HIGH_HEIGHT_M = 2000;
export const NAV_DEFAULT_CURVE_POWER = NAV_DEFAULT_PROFILE.curvePower;
export const NAV_MIN_CURVE_POWER = 0.4;
export const NAV_MAX_CURVE_POWER = 3;
export const NAV_CURVE_STEP = 0.1;

export function normaliseNavigationCurve(value: unknown): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return NAV_DEFAULT_CURVE_POWER;
  return Number((Math.round(Math.max(NAV_MIN_CURVE_POWER, Math.min(NAV_MAX_CURVE_POWER, numeric)) / NAV_CURVE_STEP) * NAV_CURVE_STEP).toFixed(1));
}

/** Screen heights are logarithmic: the midpoint in the plot is a geometric
 * altitude midpoint, not 1,005 m. Higher power keeps the ground boost longer. */
export function navigationAltitudeProgress(heightM: number, curvePower: number): number {
  const h = Number.isFinite(heightM) ? Math.max(NAV_LOW_HEIGHT_M, Math.min(NAV_HIGH_HEIGHT_M, heightM)) : NAV_HIGH_HEIGHT_M;
  const logProgress = Math.log(h / NAV_LOW_HEIGHT_M) / Math.log(NAV_HIGH_HEIGHT_M / NAV_LOW_HEIGHT_M);
  return Math.pow(logProgress, normaliseNavigationCurve(curvePower));
}

export function navigationAltitudeMultiplier(heightM: number, low: number, high: number, curvePower: number): number {
  return low + (high - low) * navigationAltitudeProgress(heightM, curvePower);
}

/** Maintain the previous saved high-altitude speed, providing a modest
 * starting near-ground boost when upgrading from v2 (both remain adjustable). */
export function navigationDefaultLow(high: number): number {
  return normaliseNavigationMultiplier(high * 1.6, high);
}


export function normaliseNavigationMultiplier(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(num)) return fallback;
  return Number((Math.round(Math.max(NAV_MIN, Math.min(NAV_MAX, num)) / NAV_STEP) * NAV_STEP).toFixed(2));
}

export type NavigationCalibration = {
  mouseMoveLow: number;
  mouseMoveHigh: number;
  mousePanLow: number;
  mousePanHigh: number;
  keyboardMoveLow: number;
  keyboardMoveHigh: number;
  keyboardPanLow: number;
  keyboardPanHigh: number;
  curvePower: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  screenWidth: number;
  screenHeight: number;
  viewMode: 'skyline' | 'plan';
  cameraHeightM: number;
  pointerLockSupported: boolean;
};

/** Plain-text, screenshot-friendly and copy/paste-safe. Browser APIs cannot
 * detect a mouse's physical hardware DPI or the OS pointer-speed setting. */
export function navigationCalibrationLine(value: NavigationCalibration): string {
  return [
    `FW-NAV:v${NAV_CALIBRATION_VERSION}`,
    `mouse_move_low=${value.mouseMoveLow.toFixed(2)}`,
    `mouse_move_high=${value.mouseMoveHigh.toFixed(2)}`,
    `mouse_pan_low=${value.mousePanLow.toFixed(2)}`,
    `mouse_pan_high=${value.mousePanHigh.toFixed(2)}`,
    `keyboard_move_low=${value.keyboardMoveLow.toFixed(2)}`,
    `keyboard_move_high=${value.keyboardMoveHigh.toFixed(2)}`,
    `keyboard_pan_low=${value.keyboardPanLow.toFixed(2)}`,
    `keyboard_pan_high=${value.keyboardPanHigh.toFixed(2)}`,
    `curve_power=${value.curvePower.toFixed(1)}`,
    `altitude_range_m=${NAV_LOW_HEIGHT_M}-${NAV_HIGH_HEIGHT_M}`,
    `viewport=${Math.round(value.viewportWidth)}x${Math.round(value.viewportHeight)}`,
    `screen=${Math.round(value.screenWidth)}x${Math.round(value.screenHeight)}`,
    `dpr=${value.devicePixelRatio.toFixed(2)}`,
    `mode=${value.viewMode}`,
    `height_m=${value.cameraHeightM.toFixed(1)}`,
    `effective_move=${navigationAltitudeMultiplier(value.cameraHeightM, value.mouseMoveLow, value.mouseMoveHigh, value.curvePower).toFixed(2)}`,
    `effective_pan=${navigationAltitudeMultiplier(value.cameraHeightM, value.mousePanLow, value.mousePanHigh, value.curvePower).toFixed(2)}`,
    `effective_keyboard_move=${navigationAltitudeMultiplier(value.cameraHeightM, value.keyboardMoveLow, value.keyboardMoveHigh, value.curvePower).toFixed(2)}`,
    `effective_keyboard_pan=${navigationAltitudeMultiplier(value.cameraHeightM, value.keyboardPanLow, value.keyboardPanHigh, value.curvePower).toFixed(2)}`,
    `pointer_lock=${value.pointerLockSupported ? 'supported' : 'unavailable'}`,
    'mouse_dpi=unknown',
  ].join(' | ');
}

export type PointerPosition = { x: number; y: number };
export function navigationPointerDelta(
  locked: boolean, movementX: number, movementY: number,
  client: PointerPosition, previous: PointerPosition,
): PointerPosition {
  return locked ? { x: movementX, y: movementY } : { x: client.x - previous.x, y: client.y - previous.y };
}

/** Virtual pointer remains inside the viewport for ground-ray anchoring, while
 * movement deltas remain unbounded and keep rotating/panning at display edges. */
export function navigationVirtualPosition(
  previous: PointerPosition, delta: PointerPosition,
  viewport: { left: number; top: number; right: number; bottom: number },
): PointerPosition {
  return {
    x: Math.max(viewport.left + 1, Math.min(viewport.right - 1, previous.x + delta.x)),
    y: Math.max(viewport.top + 1, Math.min(viewport.bottom - 1, previous.y + delta.y)),
  };
}

/** A locked virtual cursor may be clipped at an edge. In that case using two
 * equal ground rays would turn a nonzero drag into zero camera movement. */
export function navigationCanAnchorPointer(previous: PointerPosition, current: PointerPosition, delta: PointerPosition): boolean {
  return Math.abs((current.x - previous.x) - delta.x) < .01 &&
    Math.abs((current.y - previous.y) - delta.y) < .01;
}
