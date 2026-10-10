import type { Landmark } from './city-landmarks';

/** Right-button wheel is an inspectable, one-metre target selector.
 * Camera height moved by left+wheel and other navigation is unchanged. */
export const TARGET_HEIGHT_STEP_M = 1;

export function targetHeightStepMForStreak(streakCount: number): number {
  if (streakCount >= 30) return 10;
  if (streakCount >= 20) return 5;
  if (streakCount >= 10) return 2;
  return TARGET_HEIGHT_STEP_M;
}

export function nextTargetHeightM(currentM: number, wheelDirection: number, minimumM: number, maximumM: number, stepM = TARGET_HEIGHT_STEP_M): number {
  const nearestStep = Math.round(currentM / stepM) * stepM;
  return Math.max(minimumM, Math.min(maximumM, nearestStep - Math.sign(wheelDirection) * stepM));
}

/** Never retain the large maximum from a previous high target when browsing
 * back down. During comparison the current target, not the current eye,
 * controls profile scale; the camera ghost may be clipped at the scale top. */
export function comparisonScaleMaxM(targetM: number, cityMaxM: number, cameraM: number, comparing: boolean): number {
  const referenceM = comparing ? targetM : cameraM;
  return Math.max(600, Math.ceil((Math.max(referenceM, cityMaxM) + 50) / 100) * 100);
}


/** Heights share the city's local metre coordinate system. Do not use width/footprint
 * as a proxy for height or manufacture landmarks absent from the city bundle. */
export function sortHeightLandmarks(landmarks: Landmark[]): Landmark[] {
  return landmarks.filter((landmark) => Number.isFinite(landmark.heightM) && landmark.heightM > 0)
    .sort((a, b) => a.heightM - b.heightM || a.name.localeCompare(b.name));
}

/** A landmark stays active until its roof height is reached; the next takes over.
 * -1 is the deliberately empty state above the tallest source landmark. */
export function activeHeightLandmarkIndex(sorted: Landmark[], targetM: number): number {
  return sorted.findIndex((landmark) => targetM < landmark.heightM);
}

/** Compare landmarks at their real source-scaled height in every state.
 * Selection changes colour and opacity, never the metre scale. */
export function comparisonDisplayedHeightPx(rawHeightPx: number, _isActive: boolean): number {
  return rawHeightPx;
}

/** Fall-back and floor-derived heights cannot support a factual height rank. */
export function heightAtlasLandmarks<T extends Landmark & { heightComparable?: boolean }>(landmarks: T[]): T[] {
  return sortHeightLandmarks(landmarks.filter(item => item.heightComparable !== false)) as T[];
}

export type Silhouette = { outline: string; details: string };

/** Illustrative 2D profiles, not measured facade or elevation data. The browser
 * scales their displayed heights using the actual source heightM separately. */
export function landmarkSilhouette(landmark: Landmark): Silhouette {
  const name = landmark.name.toLowerCase();
  if (name.includes('harbour bridge')) {
    return {
      outline: 'M5 160 L5 139 L14 139 Q60 -134 106 139 L115 139 L115 160 L101 160 L101 140 Q60 -105 19 140 L19 160 Z M11 130 H109 V137 H11 Z',
      details: 'M22 135 L22 98 M37 135 L37 66 M52 135 L52 51 M68 135 L68 51 M83 135 L83 66 M98 135 L98 98 M4 154 H116',
    };
  }
  if (name.includes('opera house')) {
    return {
      outline: 'M6 148 H116 V160 H6 Z M12 145 Q8 95 47 0 Q44 94 61 145 Z M38 145 Q44 95 86 39 Q78 110 92 145 Z M77 145 Q80 112 109 78 Q102 124 113 145 Z',
      details: 'M14 139 Q26 80 43 26 M43 139 Q56 91 81 48 M79 139 Q89 109 106 85 M9 147 H114',
    };
  }
  if (name.includes('sydney tower')) {
    return {
      outline: 'M58 1 H62 V30 L70 31 V48 L83 55 V70 L70 76 L66 150 H54 L50 76 L37 70 V55 L50 48 V31 L58 30 Z M41 58 H79 V70 H41 Z',
      details: 'M60 4 V155 M43 61 H77 M52 79 H68 M55 110 H65 M48 150 H72',
    };
  }
  // Use real footprint proportions to distinguish broad buildings from narrow
  // towers without inventing specific crowns or ornamental architectural facts.
  const wide = landmark.widthM > landmark.depthM * 1.5;
  const l = wide ? 11 : 28;
  const r = wide ? 109 : 92;
  const inset = wide ? 13 : 10;
  const outline = landmark.heightM > 180
    ? `M${l} 160 V30 H${l + inset} V0 H${r - inset} V30 H${r} V160 Z`
    : `M${l} 160 V0 H${r} V160 Z`;
  const x1 = l + (r-l) / 3, x2 = l + (r-l) * 2 / 3;
  return { outline, details: `M${x1} 38 V154 M${x2} 38 V154 M${l + 4} 54 H${r - 4} M${l + 4} 93 H${r - 4} M${l + 4} 132 H${r - 4}` };
}
