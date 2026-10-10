/** Pure camera references for landmark transitions. Coordinates are local metres. */
export type CameraPoint = { x: number; y: number; z: number };
export function normalisedManualTarget(eye: CameraPoint, target: CameraPoint, minRangeM = 1200): CameraPoint {
  const dx = target.x - eye.x, dy = target.y - eye.y, dz = target.z - eye.z;
  const length = Math.hypot(dx, dy, dz) || 1;
  const range = Math.max(minRangeM, length);
  return { x: eye.x + (dx / length) * range, y: eye.y + (dy / length) * range, z: eye.z + (dz / length) * range };
}
export function orbitCameraEye(centre: CameraPoint, radius: number, azimuth: number, elevation: number): CameraPoint {
  return { x: centre.x + Math.cos(azimuth) * radius, y: centre.y + Math.sin(azimuth) * radius, z: centre.z + elevation };
}
