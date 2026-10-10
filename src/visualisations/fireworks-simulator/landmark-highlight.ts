/** A selected landmark stays selected when a different landmark is hovered. */
export type LandmarkAccentType = 'selected' | 'hover';

export function accentTypeForLandmark(
  id: string,
  selectedId: string | null,
  hoveredId: string | null,
): LandmarkAccentType | null {
  if (id === selectedId) return 'selected';
  if (id === hoveredId) return 'hover';
  return null;
}

/** Monotonic fade without oscillation; reduced motion makes changes immediate. */
export function smoothAccentStrength(previous: number, target: number, deltaS: number, reducedMotion: boolean): number {
  if (reducedMotion || Math.abs(target - previous) < .0015) return target;
  const fraction = 1 - Math.exp(-10 * Math.max(0, deltaS));
  return previous + (target - previous) * fraction;
}
