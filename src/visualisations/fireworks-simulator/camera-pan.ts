/** Screen-space metres for manual SKYLINE panning. Never derive this from
 * camera.target: landmark inspection, zoom and view direction all change it. */
export type PanVec3 = { x: number; y: number; z: number };
type PanVec2 = { x: number; y: number };

export type PanCalculation = {
  eye: PanVec3;
  forward: PanVec3;
  right: PanVec3;
  focalPx: number;
  dxPx: number;
  dyPx: number;
  inputFactor?: number;
  previousRay?: PanVec3;
  currentRay?: PanVec3;
};

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
// Calibrated for deliberate city navigation, not a flight-simulator fly speed.
// Keep one gain for mouse, touch and keyboard so inputs feel related. This is
// internal UX tuning, not a user-facing setting.
export const PAN_RESPONSE = 0.45;
export const MIN_PAN_M_PER_PX = 0.005;
export const MAX_PAN_M_PER_PX = 6;
// An angled ground ray must not introduce a sudden second speed mode.
const MAX_ANCHOR_TO_FALLBACK_RATIO = 1.35;

/** Choose a visible-ground reference when looking down; transition towards a
 * bounded virtual plane when looking towards/above the horizon. A horizontal
 * ray must never create an infinite ground-intersection distance. */
export function skylineMetresPerPixel(eyeHeightM: number, forwardZ: number, focalPx: number): number {
  const height = Math.max(0.25, eyeHeightM);
  // A 60 m virtual plane still made nearby buildings jump many screen pixels
  // at pavement level. Use a short, height-continuous reference instead.
  const virtualDepth = Math.max(8, height * 1.6);
  const angle = Math.max(0, -forwardZ);
  const groundDepth = height / Math.max(angle, .0001);
  const boundedGroundDepth = clamp(groundDepth, 8, Math.max(200, height * 4));
  const groundWeight = clamp((angle - .06) / .22, 0, 1);
  const referenceDepth = virtualDepth + (boundedGroundDepth - virtualDepth) * groundWeight;
  return clamp(referenceDepth / Math.max(1, focalPx), MIN_PAN_M_PER_PX, MAX_PAN_M_PER_PX);
}

/** Only use a true ground hit if it is comfortably below the horizon and
 * resolved to a meaningful screen scale. Shallow rays and very close hits
 * fall back to the bounded screen-space pan instead of causing huge jumps. */
export function stableGroundPanHit(eye: PanVec3, ray: PanVec3, focalPx: number): PanVec2 | null {
  if (ray.z >= -.24 || eye.z <= 0) return null;
  const distance = eye.z / -ray.z;
  const metresPerPixel = distance / Math.max(1, focalPx);
  if (metresPerPixel < MIN_PAN_M_PER_PX || metresPerPixel > MAX_PAN_M_PER_PX) return null;
  return { x: eye.x + distance * ray.x, y: eye.y + distance * ray.y };
}

/** Damped cursor-aware panning when possible; projection-aware horizontal fallback
 * for low altitudes, skyline/horizon views and keyboard input. */
export function skylinePanDisplacement(args: PanCalculation): PanVec2 {
  const { eye, forward, right, focalPx, dxPx, dyPx } = args;
  const factor = (args.inputFactor ?? 1) * PAN_RESPONSE;
  const metresPerPixel = skylineMetresPerPixel(eye.z, forward.z, focalPx);
  const rightLength = Math.max(.00001, Math.hypot(right.x, right.y));
  const forwardLength = Math.max(.00001, Math.hypot(forward.x, forward.y));
  const fallback = {
    x: (-right.x / rightLength * dxPx + forward.x / forwardLength * dyPx) * metresPerPixel * factor,
    y: (-right.y / rightLength * dxPx + forward.y / forwardLength * dyPx) * metresPerPixel * factor,
  };
  if (!args.previousRay || !args.currentRay) return fallback;
  const before = stableGroundPanHit(eye, args.previousRay, focalPx);
  const after = stableGroundPanHit(eye, args.currentRay, focalPx);
  if (!before || !after) return fallback;
  const anchored = { x: (before.x - after.x) * factor, y: (before.y - after.y) * factor };
  // Even a formally valid ground intersection can be too fast in a tilted
  // skyline. Keep anchor movement close to the keyboard/horizon reference,
  // fading back to the fallback before the cap is reached.
  const maxStep = Math.hypot(dxPx, dyPx) * metresPerPixel * MAX_ANCHOR_TO_FALLBACK_RATIO * factor;
  const length = Math.hypot(anchored.x, anchored.y);
  if (length > maxStep || anchored.x * fallback.x + anchored.y * fallback.y < 0) return fallback;
  // Crossfade before entering/leaving the valid ground-intersection region.
  // This avoids a noticeable speed snap around the horizon or at low height.
  const angleWeight = clamp((Math.min(-args.previousRay.z, -args.currentRay.z) - .24) / .14, 0, 1);
  const groundMetresPerPixel = Math.min(eye.z / -args.previousRay.z, eye.z / -args.currentRay.z) / Math.max(1, focalPx);
  const distanceWeight = clamp((groundMetresPerPixel - MIN_PAN_M_PER_PX) / .16, 0, 1);
  const motionWeight = clamp((maxStep - length) / Math.max(.0001, maxStep * .18), 0, 1);
  const weight = angleWeight * distanceWeight * motionWeight;
  return {
    x: fallback.x + (anchored.x - fallback.x) * weight,
    y: fallback.y + (anchored.y - fallback.y) * weight,
  };
}
