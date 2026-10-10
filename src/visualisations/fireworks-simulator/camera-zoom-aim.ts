/** The screen-space projection origin is the geometric centre in both views. */
export function projectionScreenCentre(width: number, height: number): { x: number; y: number } {
  return { x: width / 2, y: height / 2 };
}

/** The zoom ray follows the camera's aim, never the pointer or a stale map pivot. */
export function cameraZoomAimDirection(
  eye: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  const x = target.x - eye.x;
  const y = target.y - eye.y;
  const z = target.z - eye.z;
  const length = Math.hypot(x, y, z);
  return length > 1e-8 ? { x: x / length, y: y / length, z: z / length } : { x: 0, y: 1, z: 0 };
}

/** The zoom marker follows the same origin used for rendering and screen rays. */
export function zoomAimScreenPoint(
  mode: 'skyline' | 'plan',
  viewport: {
    skylineScreenX: number;
    skylineHorizonY: number;
    planScreenX: number;
    planScreenY: number;
  },
): { x: number; y: number } {
  return mode === 'plan'
    ? { x: viewport.planScreenX, y: viewport.planScreenY }
    : { x: viewport.skylineScreenX, y: viewport.skylineHorizonY };
}
