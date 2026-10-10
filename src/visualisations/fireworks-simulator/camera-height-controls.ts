/** Direct camera-height input sensitivity. Keep this independent from ground
 * panning, map rotation, the ordinary dolly and the right-button height target.
 * Keyboard input arrives as an eased CSS-pixel-equivalent per frame; wheel
 * input arrives in normalised WheelEvent pixels (typically ~100 per notch).
 */
export function keyboardHeightMetresPerPixel(cameraDistanceM: number): number {
  const distanceM = Number.isFinite(cameraDistanceM) ? Math.max(0, cameraDistanceM) : 0;
  // About 8–10× less vertical travel than the former
  // clamp(distance * .0015, .25, 8) * .75 scale.
  return Math.max(.025, Math.min(1, distanceM * .0002)) * .75;
}

export function mouseHeightMetresPerWheelUnit(cameraDistanceM: number): number {
  const distanceM = Number.isFinite(cameraDistanceM) ? Math.max(0, cameraDistanceM) : 0;
  // About 5× less travel than the former clamp(distance * .00022, .1, .8).
  return Math.max(.02, Math.min(.16, distanceM * .00004));
}
