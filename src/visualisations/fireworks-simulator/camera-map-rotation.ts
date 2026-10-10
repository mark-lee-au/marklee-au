/** Manual SKYLINE map rotation, independent of the mutable camera look target.
 * Both the eye and look point rotate as a rigid pose around a ground-based
 * anchor. Automatic landmark inspection uses a separate camera orbit. */
export type MapPoint = { x: number; y: number; z: number };
export type MapPose = { eye: MapPoint; target: MapPoint };
export const MIN_CAMERA_HEIGHT_M = 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const plus = (a: MapPoint, b: MapPoint): MapPoint => ({ x: a.x+b.x, y: a.y+b.y, z: a.z+b.z });
const minus = (a: MapPoint, b: MapPoint): MapPoint => ({ x: a.x-b.x, y: a.y-b.y, z: a.z-b.z });
const scaled = (a: MapPoint, k: number): MapPoint => ({ x: a.x*k, y: a.y*k, z: a.z*k });
const unit = (a: MapPoint): MapPoint => scaled(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));
const axisRotate = (p: MapPoint, axis: MapPoint, angle: number): MapPoint => {
  const c = Math.cos(angle), s = Math.sin(angle);
  const dot = p.x*axis.x + p.y*axis.y + p.z*axis.z;
  return {
    x: p.x*c + (axis.y*p.z-axis.z*p.y)*s + axis.x*dot*(1-c),
    y: p.y*c + (axis.z*p.x-axis.x*p.z)*s + axis.y*dot*(1-c),
    z: p.z*c + (axis.x*p.y-axis.y*p.x)*s + axis.z*dot*(1-c),
  };
};
const around = (point: MapPoint, pivot: MapPoint, axis: MapPoint, angle: number): MapPoint =>
  plus(pivot, axisRotate(minus(point, pivot), axis, angle));

/** Anchor on the real map instead of at camera.target, which can be a floating
 * 1.2 km navigation reference after focusing a building. Looking horizontally
 * uses a nearby ground point to avoid kilometre-scale camera displacement. */
export function manualMapPivot(pose: MapPose): MapPoint {
  const direction = unit(minus(pose.target, pose.eye));
  const horizontal = Math.hypot(direction.x, direction.y);
  const groundDistance = direction.z < -.045 ? pose.eye.z / -direction.z : Infinity;
  const maximumDistance = Math.max(80, pose.eye.z * 3.5);
  if (groundDistance > 0 && Number.isFinite(groundDistance) && groundDistance <= maximumDistance) {
    return { x: pose.eye.x + direction.x * groundDistance,
      y: pose.eye.y + direction.y * groundDistance, z: 0 };
  }
  // At street level a short pivot avoids a large lateral camera orbit.
  const forwardM = clamp(pose.eye.z * .3 + 6, 6, 180);
  return { x: pose.eye.x + direction.x / Math.max(.00001, horizontal) * forwardM,
    y: pose.eye.y + direction.y / Math.max(.00001, horizontal) * forwardM, z: 0 };
}

/** Raw right-drag input follows the arrow-key directions: dragging left has
 * the same effect as Left Arrow, and dragging up as Up Arrow. The rotation
 * geometry itself stays shared with keyboard input. */
export function mouseMapRotationDelta(dxPx: number, dyPx: number): { dx: number; dy: number } {
  return { dx: -dxPx, dy: -dyPx };
}

/** Rotate the eye and look target together around the same map pivot at
 * every altitude. If the orbit would dip below the camera floor, lift both
 * points by the same amount. This preserves the full rotation and sightline
 * without switching to a separate camera-only pitch mode at 10 m. */
export function rotateManualMap(
  pose: MapPose, pivot: MapPoint, dxPx: number, dyPx: number,
  groundClearanceM = MIN_CAMERA_HEIGHT_M, yawRadPerPx = .00105, pitchRadPerPx = .0012,
): MapPose {
  const axisZ = { x: 0, y: 0, z: 1 };
  const yaw = dxPx * yawRadPerPx;
  let result: MapPose = {
    eye: around(pose.eye, pivot, axisZ, yaw),
    target: around(pose.target, pivot, axisZ, yaw),
  };
  const forward = unit(minus(result.target, result.eye));
  const right = unit({ x: forward.y, y: -forward.x, z: 0 });
  // Avoid crossing the world-up vertical axis, which would invert controls.
  const currentPitch = Math.atan2(forward.z, Math.hypot(forward.x, forward.y));
  const pitchLimit = Math.PI * .485;
  const pitch = clamp(dyPx * pitchRadPerPx, -pitchLimit - currentPitch, pitchLimit - currentPitch);
  if (Math.abs(pitch) < 1e-9) return result;
  const orbit = (angle: number): MapPose => ({
    eye: around(result.eye, pivot, right, angle),
    target: around(result.target, pivot, right, angle),
  });
  result = orbit(pitch);
  // A full orbit at the floor may lower the eye, even when the user wants
  // to look up. Translate the entire rotated pose upward to the legal floor
  // instead of discarding the pitch or introducing an in-place look mode.
  const lift = Math.max(0, groundClearanceM - result.eye.z);
  if (lift > 0) {
    result.eye.z += lift;
    result.target.z += lift;
  }
  return result;
}
