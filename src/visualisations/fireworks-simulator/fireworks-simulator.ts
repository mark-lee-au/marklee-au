import { normalisedManualTarget, orbitCameraEye } from './camera-landmark-orbit';
import { setupEdgeDrawer } from './edge-drawer';
import { sortedLandmarkList, landmarkHeightLabel, type LandmarkSort } from './landmark-list';
import { cityLandmarks, overlapsAuthoredLandmark, type Landmark } from './city-landmarks';
import { accentTypeForLandmark, smoothAccentStrength } from './landmark-highlight';
import { activeHeightLandmarkIndex, landmarkSilhouette, nextTargetHeightM, comparisonScaleMaxM, TARGET_HEIGHT_STEP_M, targetHeightStepMForStreak, comparisonDisplayedHeightPx, heightAtlasLandmarks } from './height-comparison';
import { createCityWebGLRenderer, type CityLayerKey, type CityRenderSettings } from './city-webgl';
import { skylinePanDisplacement } from './camera-pan';
import { keyboardHeightMetresPerPixel, mouseHeightMetresPerWheelUnit } from './camera-height-controls';
import { MIN_CAMERA_HEIGHT_M, manualMapPivot, mouseMapRotationDelta, rotateManualMap } from './camera-map-rotation';
import { cameraZoomAimDirection, projectionScreenCentre, zoomAimScreenPoint } from './camera-zoom-aim';
import { defaultSkySelection, skyScene, skyClockLabel, sydneyInstant, sydneySolarEvents, type SkyScene } from './night-sky';
import { NAV_DEFAULT_PROFILE, NAV_LOW_HEIGHT_M, NAV_HIGH_HEIGHT_M, normaliseNavigationCurve, navigationAltitudeMultiplier, normaliseNavigationMultiplier, navigationCalibrationLine, navigationPointerDelta, navigationVirtualPosition, navigationCanAnchorPointer } from './navigation-calibration';

type PresetRenderDefaults = {
  durationS: number;
  density: number;
  breakSpeedScale: number;
  dragScale: number;
  gravityScale: number;
  droopScale: number;
  symmetry: number;
  raggedness: number;
  trailWidth: number;
  trailLifetimeS: number;
  strobeHz: number;
  splitAt: number | null;
};

type Preset = {
  id: string;
  name: string;
  familyId: string;
  calibreMm: number;
  tipColours: string[];
  trailColour: string | null;
  renderDefaults: PresetRenderDefaults;
  colourPattern: string;
  burstHeightOverrideM?: number | null;
  spreadDiameterOverrideM?: number | null;
};

type EffectFamily = {
  id: string;
  label: string;
  geometry: string;
  physicsProfileId: string;
  defaultTrail: string;
};

type ScaleShell = {
  calibreMm: number;
  approxBurstHeightM: number;
  approxMaxSpreadDiameterM: number;
};

type PaletteColour = {
  id: string;
  label: string;
  renderHex: string;
};

type PeonyCalibration = {
  initialExpansionMps: number;
  visibleDurationS: number;
  maxDiameterM: number;
};

type PrototypeConfig = {
  schemaVersion: string;
  cityUrl: string;
  presets: Preset[];
  families: EffectFamily[];
  calibres: ScaleShell[];
  palette: PaletteColour[];
  peonyCalibration?: PeonyCalibration;
};

type Point2 = [number, number];
type Vec3 = { x: number; y: number; z: number };
type ScreenPoint = { x: number; y: number; depth: number };

type CityBuilding = {
  id: string;
  name: string | null;
  footprint: Point2[];
  heightM: number;
  minHeightM?: number;
  heightSource: string;
  geometrySource: string;
  class: string;
  roadConflict?: boolean;
  roadConflictAreaM2?: number;
  roadClearanceAdjusted?: boolean;
};

type CityRoad = {
  id: string;
  name: string | null;
  points: Point2[];
  roadClass?: string | null;
  functionHierarchy: number | null;
  onType: 'ground' | 'bridge' | 'tunnel' | 'unknown';
  surfaceCode?: number | null;
  laneCategory: 'unknown' | 'one' | 'two-or-more';
  laneCountExact: number | null;
  laneSource?: string | null;
  displayWidthM: number;
  widthSource: string;
  sourceClass: string;
};

type CityTransportPoint = {
  id: string;
  type: 'junction' | 'traffic-signal' | 'crossing' | 'other';
  name?: string | null;
  x: number;
  y: number;
  z?: number;
  sourceClass: string;
};

type CityStructure = {
  id: string;
  type: 'arch-bridge' | 'opera-house' | 'observation-tower';
  name: string;
  x: number;
  y: number;
  z: number;
  rotationDeg?: number;
  spanM?: number;
  heightM: number;
  pylonHeightM?: number;
  widthM?: number;
  depthM?: number;
  podHeightM?: number;
  sourceClass: string;
};

type CityBundle = {
  schemaVersion: string;
  city: {
    id: string;
    name: string;
    country: string;
    geometryMode: string;
    sourceNote: string;
    sceneExtent?: 'cbd' | 'inner-sydney' | 'east-coast' | 'greater-sydney-test';
  };
  bounds: { minX: number; maxX: number; minY: number; maxY: number; maxZ: number };
  water: { sourceClass: string; polygons: Point2[][] };
  land?: { sourceClass: string; triangles: Point2[][] };
  roads?: CityRoad[];
  transportPoints?: CityTransportPoint[];
  buildings: CityBuilding[];
  structures: CityStructure[];
  launchSites: Array<{ id: string; label: string; x: number; y: number; z: number }>;
  profile: {
    buildingCount: number; waterVertexCount: number; structureCount: number;
    roadCount?: number; namedRoadCount?: number; exactLaneCount?: number;
    junctionCount?: number; trafficSignalCount?: number; crossingCount?: number;
    roadConflictCount?: number; roadHiddenBuildingCount?: number;
  };
};

type PreparedBuilding = {
  building: CityBuilding;
  centre: Vec3;
  radiusM: number;
  winding: number;
};

type PreparedRoadSegment = {
  road: CityRoad;
  a: Vec3;
  b: Vec3;
  centre: Vec3;
  radiusM: number;
};

type ParticleSeed = {
  dx: number;
  dy: number;
  depth: number;
  radialScale: number;
  brightness: number;
  colourIndex: number;
  phase: number;
};

type RuntimeState = {
  preset: Preset;
  family: EffectFamily;
  calibreMm: number;
  heightM: number;
  spreadM: number;
  primaryColourId: string;
  custom: boolean;
};

type ViewMode = 'skyline' | 'plan';
type CameraPose = { eye: Vec3; target: Vec3; rollRad: number };
type PlanPose = { x: number; y: number; rotationRad: number; zoom: number };
type PointerSpot = { x: number; y: number };


type Viewport = {
  width: number;
  height: number;
  dpr: number;
  planScale: number;
  planCentreX: number;
  planCentreY: number;
  planScreenX: number;
  planScreenY: number;
  skylineScreenX: number;
  skylineHorizonY: number;
};

const GRAVITY = 9.81;
const DEFAULT_INITIAL_EXPANSION_MPS = 170;
const BASE_DRAG = 0.04;
const MOBILE_BREAKPOINT = 700;
const AUTO_REPLAY_DELAY_S = 1.35;
// Keep the camera above the ground, including after dolly/height/focus travel.
// At the floor, rotating the map stops vertically instead of tilting in place.
const GROUND_CLEARANCE_M = MIN_CAMERA_HEIGHT_M;
// Input tuning is expressed in CSS-pixel drag equivalents so mouse and
// keyboard controls share one feel. Touch keeps its existing direct scale.
const MOUSE_PAN_FACTOR = 0.78;
const MAP_ROTATE_YAW_RAD_PER_PX = 0.00105;
const MAP_ROTATE_PITCH_RAD_PER_PX = 0.0012;
const HEIGHT_SELECTOR_MAX_M = 5000;
const KEYBOARD_PAN_PX_PER_S = 760;
const KEYBOARD_PAN_FAST_PX_PER_S = 1240;
const KEYBOARD_ROTATE_PX_PER_S = 560;
const KEYBOARD_ROTATE_FAST_PX_PER_S = 900;
const KEYBOARD_HEIGHT_PX_PER_S = 460;
const KEYBOARD_HEIGHT_FAST_PX_PER_S = 760;
const CITY_LINE = 'rgba(184, 206, 210, .38)';
const CITY_LINE_BRIGHT = 'rgba(215, 229, 229, .62)';
const CITY_LINE_FAINT = 'rgba(174, 198, 203, .09)';
const CITY_EDGE_FADE_M = 300;

const toRadians = (degrees: number) => degrees * Math.PI / 180;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function radialDisplacement(
  timeS: number,
  durationS: number,
  targetRadiusM: number,
  defaults: PresetRenderDefaults,
  initialExpansionMps: number,
): number {
  if (timeS <= 0) return 0;
  const t = Math.min(timeS, durationS);
  const v0 = initialExpansionMps * defaults.breakSpeedScale;
  const drag = BASE_DRAG * defaults.dragScale;
  const displacement = Math.log(1 + drag * v0 * t) / drag;
  const durationDisplacement = Math.log(1 + drag * v0 * durationS) / drag;
  return durationDisplacement > 0 ? targetRadiusM * (displacement / durationDisplacement) : 0;
}

function prototypeLiftTime(heightM: number): number {
  return clamp(1.95 + heightM / 125, 2.45, 4.75);
}

function normalise(v: Vec3): Vec3 {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scaleVector(v: Vec3, scale: number): Vec3 {
  return { x: v.x * scale, y: v.y * scale, z: v.z * scale };
}

function vectorLength(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function rotate2d(x: number, y: number, angleDeg = 0): Point2 {
  const angle = angleDeg * Math.PI / 180;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - y * s, x * s + y * c];
}

function initialise(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-fireworks-canvas]');
  const cityWebglCanvas = root.querySelector<HTMLCanvasElement>('[data-city-webgl]');
  const skyCanvas = root.querySelector<HTMLCanvasElement>('[data-sky-canvas]');
  const configNode = root.querySelector<HTMLScriptElement>('[data-fireworks-config]');
  const presetSelect = root.querySelector<HTMLSelectElement>('[data-preset]');
  const calibreSelect = root.querySelector<HTMLSelectElement>('[data-calibre]');
  const colourSelect = root.querySelector<HTMLSelectElement>('[data-colour]');
  const heightInput = root.querySelector<HTMLInputElement>('[data-height]');
  const spreadInput = root.querySelector<HTMLInputElement>('[data-spread]');
  const heightOutput = root.querySelector<HTMLOutputElement>('[data-height-output]');
  const spreadOutput = root.querySelector<HTMLOutputElement>('[data-spread-output]');
  const launchButton = root.querySelector<HTMLButtonElement>('[data-launch]');
  const stageInteraction = root.querySelector<HTMLElement>('[data-stage-interaction]');
  const cameraReset = root.querySelector<HTMLButtonElement>('[data-camera-reset]');
  const cameraReadout = root.querySelector<HTMLElement>('[data-camera-readout]');
  const cameraHeading = root.querySelector<HTMLElement>('[data-camera-heading]');
  const cameraElevation = root.querySelector<HTMLElement>('[data-camera-elevation]');
  const cameraCompass = root.querySelector<HTMLElement>('[data-camera-compass]');
  const sceneHint = root.querySelector<HTMLElement>('[data-fireworks-hint]');
  const effectLabel = root.querySelector<HTMLElement>('[data-effect-label]');
  const fpsLabel = root.querySelector<HTMLElement>('[data-fireworks-fps]');
  const particlesLabel = root.querySelector<HTMLElement>('[data-fireworks-particles]');
  const cityLabel = root.querySelector<HTMLElement>('[data-city-telemetry]');
  const rendererLabel = root.querySelector<HTMLElement>('[data-city-renderer]');
  const cityModeLabel = root.querySelector<HTMLElement>('[data-city-mode]');
  const previewOverviewButton = root.querySelector<HTMLButtonElement>('[data-city-preview-overview]');
  const customState = root.querySelector<HTMLElement>('[data-custom-state]');
  const status = root.querySelector<HTMLElement>('[data-fireworks-status]');
  const readoutCalibre = root.querySelector<HTMLElement>('[data-readout-calibre]');
  const readoutHeight = root.querySelector<HTMLElement>('[data-readout-height]');
  const readoutSpread = root.querySelector<HTMLElement>('[data-readout-spread]');
  const readoutDuration = root.querySelector<HTMLElement>('[data-readout-duration]');
  const heightScale = root.querySelector<HTMLElement>('[data-camera-height-scale]');
  const heightTrack = root.querySelector<HTMLElement>('.fireworks-simulator__scale-track');
  const scaleTop = root.querySelector<HTMLElement>('[data-camera-height-max]');
  const heightNode = root.querySelector<HTMLElement>('[data-camera-height-node]');
  const heightGhost = root.querySelector<HTMLElement>('[data-camera-height-ghost]');
  const cameraCursor = root.querySelector<HTMLElement>('[data-camera-cursor]');
  const zoomAim = root.querySelector<HTMLElement>('[data-zoom-aim]');
  const controlsDrawer = root.querySelector<HTMLElement>('[data-control-drawer]');
  const controlsForm = root.querySelector<HTMLFormElement>('[data-fireworks-controls]');
  const drawerToggle = root.querySelector<HTMLButtonElement>('[data-drawer-toggle]');
  const drawerSymbol = root.querySelector<HTMLElement>('[data-drawer-symbol]');
  const heightCue = root.querySelector<HTMLElement>('[data-camera-height-cue]');
  const heightCueValue = root.querySelector<HTMLElement>('[data-camera-target-height-value]');
  const heightComparison = root.querySelector<HTMLElement>('[data-height-comparison]');
  const heightComparisonFigures = root.querySelector<HTMLElement>('[data-height-comparison-figures]');
  const heightComparisonValue = root.querySelector<HTMLElement>('[data-height-comparison-value]');
  const heightComparisonName = root.querySelector<HTMLElement>('[data-height-comparison-name]');
  const heightComparisonRoof = root.querySelector<HTMLElement>('[data-height-comparison-roof]');
  const viewButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-view-mode]'));
  const keyLabelsRoot = root.querySelector<HTMLElement>('[data-key-labels]');
  const landmarkList = root.querySelector<HTMLElement>('[data-landmark-list]');
  const landmarkToggle = root.querySelector<HTMLButtonElement>('[data-landmark-toggle]');
  const landmarkDrawer = root.querySelector<HTMLElement>('[data-landmark-drawer]');
  const landmarkPanel = root.querySelector<HTMLElement>('.fireworks-simulator__landmark-panel');
  const landmarkSortButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-landmark-sort]'));
  const landmarkGroupInput = root.querySelector<HTMLInputElement>('[data-landmark-group]');
  const landmarkOrbitInput = root.querySelector<HTMLInputElement>('[data-landmark-orbit-toggle]');
  const highlightInput = root.querySelector<HTMLInputElement>('[data-highlight-key]');
  const navigationSpeedInputs = new Map(
    ['mouse-move-low', 'mouse-move-high', 'mouse-pan-low', 'mouse-pan-high', 'keyboard-move-low', 'keyboard-move-high', 'keyboard-pan-low', 'keyboard-pan-high'].map(key =>
      [key, {
        input: root.querySelector<HTMLInputElement>(`[data-nav-speed="${key}"]`),
        output: root.querySelector<HTMLOutputElement>(`[data-nav-speed-output="${key}"]`),
      }] as const));
  const navigationCurveInput = root.querySelector<HTMLInputElement>('[data-nav-curve]');
  const navigationCurveOutput = root.querySelector<HTMLOutputElement>('[data-nav-curve-output]');
  const navigationCurvePaths = new Map(['mouse-move', 'mouse-pan', 'keyboard-move', 'keyboard-pan'].map(key =>
    [key, root.querySelector<SVGPathElement>(`[data-nav-curve-path="${key}"]`)] as const));
  const navigationCurveDots = new Map(['mouse-move', 'mouse-pan', 'keyboard-move', 'keyboard-pan'].map(key =>
    [key, root.querySelector<SVGCircleElement>(`[data-nav-curve-dot="${key}"]`)] as const));
  const navigationCurveMarker = root.querySelector<SVGPathElement>('[data-nav-curve-marker]');
  const navigationCurveCurrent = root.querySelector<HTMLElement>('[data-nav-curve-current]');
  const navigationScaleTop = root.querySelector<SVGTextElement>('[data-nav-scale-top]');
  const navigationScaleMid = root.querySelector<SVGTextElement>('[data-nav-scale-mid]');
  const navigationConfig = root.querySelector<HTMLTextAreaElement>('[data-navigation-config]');
  const navigationCopyButton = root.querySelector<HTMLButtonElement>('[data-navigation-copy]');
  const navigationCopyStatus = root.querySelector<HTMLElement>('[data-navigation-copy-status]');
  const advancedViewportToggle = root.querySelector<HTMLInputElement>('[data-advanced-viewport]');
  const advancedViewportPanel = root.querySelector<HTMLElement>('[data-advanced-viewport-panel]');
  const skyDateInput = root.querySelector<HTMLInputElement>('[data-sky-date]');
  const skyTimeInput = root.querySelector<HTMLInputElement>('[data-sky-time]');
  const skyTimeValue = root.querySelector<HTMLElement>('[data-sky-time-value]');
  const skySunriseText = root.querySelector<HTMLElement>('[data-sky-sunrise]');
  const skySunsetText = root.querySelector<HTMLElement>('[data-sky-sunset]');
  const skySunrisePin = root.querySelector<HTMLElement>('[data-sky-sunrise-pin]');
  const skySunsetPin = root.querySelector<HTMLElement>('[data-sky-sunset-pin]');
  const skyMoonText = root.querySelector<HTMLElement>('[data-sky-moon]');
  const skyMoonPreview = root.querySelector<HTMLCanvasElement>('[data-sky-moon-preview]');
  const skyClockReadout = root.querySelector<HTMLElement>('[data-sky-clock]');
  const viewOptions = root.querySelector<HTMLDetailsElement>('[data-view-options]');
  const navigationGuide = root.querySelector<HTMLElement>('[data-navigation-guide]');
  const navigationGuideToggle = root.querySelector<HTMLInputElement>('[data-navigation-guide-toggle]');
  const navigationGuideHide = root.querySelector<HTMLButtonElement>('[data-navigation-guide-hide]');
  const pointerGuideLabel = root.querySelector<HTMLElement>('[data-pointer-guide-label]');
  const pointerGuideSummary = root.querySelector<HTMLElement>('[data-pointer-guide-summary]');
  const layerKeys: CityLayerKey[] = ['structures', 'buildings', 'roads', 'land'];
  const layerRows = new Map(layerKeys.map((key) => [key, {
    toggle: root.querySelector<HTMLInputElement>(`[data-layer-toggle="${key}"]`),
    slider: root.querySelector<HTMLInputElement>(`[data-layer-opacity="${key}"]`),
    output: root.querySelector<HTMLOutputElement>(`[data-layer-output="${key}"]`),
    row: root.querySelector<HTMLElement>(`[data-layer-row="${key}"]`),
  }]));

  if (
    !canvas || !configNode || !presetSelect || !calibreSelect || !colourSelect || !heightInput ||
    !spreadInput || !heightOutput || !spreadOutput || !launchButton || !stageInteraction || !cameraReset || !cameraReadout || !sceneHint || !effectLabel ||
    !fpsLabel || !particlesLabel || !cityLabel || !cityModeLabel || !customState || !status || !readoutCalibre ||
    !readoutHeight || !readoutSpread || !readoutDuration || !heightScale || !heightTrack || !scaleTop || !heightNode || !heightGhost || !heightCue || !cameraCursor || !zoomAim || !controlsDrawer || !controlsForm || !drawerToggle || !drawerSymbol || viewButtons.length < 2
  ) return;

  // Advanced calibration is opt-in and deliberately resets to hidden on refresh.
  if (advancedViewportToggle && advancedViewportPanel) {
    advancedViewportToggle.checked = false;
    advancedViewportPanel.hidden = true;
    advancedViewportPanel.inert = true;
    advancedViewportToggle.addEventListener('change', () => {
      advancedViewportPanel.hidden = !advancedViewportToggle.checked;
      advancedViewportPanel.inert = !advancedViewportToggle.checked;
    });
  }
  const skyContext = skyCanvas?.getContext('2d') ?? null;
  let skyDirty = true;
  let lastSkyDrawAt = -Infinity;
  let skySelection = defaultSkySelection(new Date());
  let skyEvents = sydneySolarEvents(skySelection.day);
  let skyInstant = sydneyInstant(skySelection.day, skySelection.minutes);
  let currentSky: SkyScene = skyScene(skyInstant);
  const syncSkySelection = () => {
    skyInstant = sydneyInstant(skySelection.day, skySelection.minutes);
    currentSky = skyScene(skyInstant);
    skyDirty = true;
    if (skyDateInput) skyDateInput.value = skySelection.day;
    if (skyTimeInput) skyTimeInput.value = String(skySelection.minutes);
    if (skyTimeValue) skyTimeValue.textContent = skyClockLabel(skySelection.minutes);
    if (skyClockReadout) skyClockReadout.textContent = `SKY / ${skySelection.day} · ${skyClockLabel(skySelection.minutes)} SYDNEY`;
    const eventLabel = (minutes: number | null) => minutes === null ? '--:--' : skyClockLabel(minutes);
    if (skySunriseText) skySunriseText.textContent = `SUNRISE ${eventLabel(skyEvents.sunrise)}`;
    if (skySunsetText) skySunsetText.textContent = `SUNSET ${eventLabel(skyEvents.sunset)}`;
    if (skySunrisePin) { skySunrisePin.hidden = skyEvents.sunrise === null; skySunrisePin.style.left = `${(skyEvents.sunrise ?? 0) / 1439 * 100}%`; }
    if (skySunsetPin) { skySunsetPin.hidden = skyEvents.sunset === null; skySunsetPin.style.left = `${(skyEvents.sunset ?? 0) / 1439 * 100}%`; }
    if (skyMoonText) skyMoonText.textContent = `MOON · ${currentSky.moon.phaseName} · ${Math.round(currentSky.moon.illuminated * 100)}% LIT · ${currentSky.moon.altitudeDeg > 0 ? 'ABOVE HORIZON' : 'BELOW HORIZON'}`;
  };
  skyDateInput?.addEventListener('change', () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(skyDateInput.value)) return;
    skySelection.day = skyDateInput.value;
    skyEvents = sydneySolarEvents(skySelection.day);
    syncSkySelection();
  });
  skyTimeInput?.addEventListener('input', () => {
    skySelection.minutes = Math.min(1439, Math.max(0, Number(skyTimeInput.value) || 0));
    syncSkySelection();
  });
  syncSkySelection();

  const mainContext = canvas.getContext('2d');
  if (!mainContext) {
    status.textContent = 'Canvas rendering is unavailable in this browser.';
    return;
  }
  // Static city faces and hundreds of bridge members are rasterised once per
  // view/resize. Moving firework particles remain on the main canvas each frame.
  let context = mainContext;
  const cityCanvas = document.createElement('canvas');
  const cityContext = cityCanvas.getContext('2d');
  const occlusionCanvas = document.createElement('canvas');
  const occlusionContext = occlusionCanvas.getContext('2d');
  let cityDirty = true;
  let occlusionDirty = true;
  let occlusionDeferUntil = 0;
  const webglCity = cityWebglCanvas ? createCityWebGLRenderer(cityWebglCanvas) : null;
  if (rendererLabel) rendererLabel.textContent = webglCity ? 'WEBGL CITY + CANVAS FX' : 'CANVAS 2D';

  let config: PrototypeConfig;
  try {
    config = JSON.parse(configNode.textContent ?? '') as PrototypeConfig;
  } catch {
    status.textContent = 'Firework preset data could not be read.';
    return;
  }

  const presetById = new Map(config.presets.map((preset) => [preset.id, preset]));
  const familyById = new Map(config.families.map((family) => [family.id, family]));
  const shellByCalibre = new Map(config.calibres.map((shell) => [shell.calibreMm, shell]));
  const colourById = new Map(config.palette.map((colour) => [colour.id, colour]));
  const firstPreset = config.presets[0];
  const firstFamily = firstPreset ? familyById.get(firstPreset.familyId) : undefined;
  const firstShell = firstPreset ? shellByCalibre.get(firstPreset.calibreMm) : undefined;

  if (!firstPreset || !firstFamily || !firstShell) {
    status.textContent = 'No supported prototype presets are available.';
    return;
  }

  const layers: CityRenderSettings = {
    opacity: { structures: 1, buildings: 1, roads: 1, land: 1 },
    highlight: true,
    landmarkAccents: [],
  };
  const layerVisible = (key: CityLayerKey) => layers.opacity[key] > 0;

  let state: RuntimeState = {
    preset: firstPreset,
    family: firstFamily,
    calibreMm: firstPreset.calibreMm,
    heightM: firstPreset.burstHeightOverrideM ?? firstShell.approxBurstHeightM,
    spreadM: firstPreset.spreadDiameterOverrideM ?? firstShell.approxMaxSpreadDiameterM,
    primaryColourId: firstPreset.tipColours[0] ?? 'white',
    custom: false,
  };

  let city: CityBundle | null = null;
  let activeCityPreview = false;
  let preparedBuildings: PreparedBuilding[] = [];
  let preparedRoadSegments: PreparedRoadSegment[] = [];
  const keyLabelNodes = new Map<string, HTMLElement>();
  const landmarkIds = new Set<string>();
  let landmarks: Landmark[] = [];
  let selectedLandmarkId: string | null = null;
  let hoveredLandmarkId: string | null = null;
  const landmarkAccentWeights = new Map<string, { hover: number; selected: number }>();
  let landmarkFlight: { start: CameraPose; end: CameraPose; elapsed: number; duration: number; centre: Vec3 } | null = null;
  let landmarkOrbit: { centre: Vec3; radius: number; azimuth: number; elevation: number } | null = null;
  const orbitPreferenceKey = 'fireworks-simulator:landmark-orbit:v1';
  let orbitEnabled = true;
  try { orbitEnabled = window.localStorage.getItem(orbitPreferenceKey) !== 'false'; } catch { /* Use enabled default. */ }
  if (landmarkOrbitInput) landmarkOrbitInput.checked = orbitEnabled;
  let cityLoadMs = 0;
  let firstCityRenderMs: number | null = null;
  let cityReadyAt = 0;
  let viewMode: ViewMode = 'skyline';
  const makeCamera = (mobile: boolean): CameraPose => mobile
    ? { eye: { x: 2450, y: 1350, z: 515 }, target: { x: 30, y: -210, z: 110 }, rollRad: 0 }
    : { eye: { x: 1350, y: 850, z: 380 }, target: { x: -170, y: -370, z: 105 }, rollRad: 0 };
  let camera: CameraPose = makeCamera(root.clientWidth < MOBILE_BREAKPOINT);
  // Session-only calibration. Refresh restores the owner's selected baseline,
  // even if an older v1-v3 profile remains in localStorage.
  let mouseMoveLow: number = NAV_DEFAULT_PROFILE.mouseMoveLow;
  let mouseMoveHigh: number = NAV_DEFAULT_PROFILE.mouseMoveHigh;
  let mousePanLow: number = NAV_DEFAULT_PROFILE.mousePanLow;
  let mousePanHigh: number = NAV_DEFAULT_PROFILE.mousePanHigh;
  let keyboardMoveLow: number = NAV_DEFAULT_PROFILE.keyboardMoveLow;
  let keyboardMoveHigh: number = NAV_DEFAULT_PROFILE.keyboardMoveHigh;
  let keyboardPanLow: number = NAV_DEFAULT_PROFILE.keyboardPanLow;
  let keyboardPanHigh: number = NAV_DEFAULT_PROFILE.keyboardPanHigh;
  let curvePower: number = NAV_DEFAULT_PROFILE.curvePower;
  // PLAN is an orthographic map with no physical eye altitude. Use high-end
  // multipliers there, rather than pretending the plan camera is at ground.
  const navigationHeight = () => viewMode === 'skyline' ? camera.eye.z : NAV_HIGH_HEIGHT_M;
  const effectiveMouseMove = () => navigationAltitudeMultiplier(navigationHeight(), mouseMoveLow, mouseMoveHigh, curvePower);
  const effectiveMousePan = () => navigationAltitudeMultiplier(navigationHeight(), mousePanLow, mousePanHigh, curvePower);
  const effectiveKeyboardMove = () => navigationAltitudeMultiplier(navigationHeight(), keyboardMoveLow, keyboardMoveHigh, curvePower);
  const effectiveKeyboardPan = () => navigationAltitudeMultiplier(navigationHeight(), keyboardPanLow, keyboardPanHigh, curvePower);
  const calibrationLine = () => navigationCalibrationLine({
    mouseMoveLow, mouseMoveHigh, mousePanLow, mousePanHigh,
    keyboardMoveLow, keyboardMoveHigh, keyboardPanLow, keyboardPanHigh, curvePower,
    viewportWidth: stageInteraction.clientWidth, viewportHeight: stageInteraction.clientHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    screenWidth: window.screen.width, screenHeight: window.screen.height,
    viewMode, cameraHeightM: navigationHeight(),
    pointerLockSupported: typeof stageInteraction.requestPointerLock === 'function',
  });
  const speedSlots = [
    ['mouse-move-low', () => mouseMoveLow, (v: number) => { mouseMoveLow = v; }],
    ['mouse-move-high', () => mouseMoveHigh, (v: number) => { mouseMoveHigh = v; }],
    ['mouse-pan-low', () => mousePanLow, (v: number) => { mousePanLow = v; }],
    ['mouse-pan-high', () => mousePanHigh, (v: number) => { mousePanHigh = v; }],
    ['keyboard-move-low', () => keyboardMoveLow, (v: number) => { keyboardMoveLow = v; }],
    ['keyboard-move-high', () => keyboardMoveHigh, (v: number) => { keyboardMoveHigh = v; }],
    ['keyboard-pan-low', () => keyboardPanLow, (v: number) => { keyboardPanLow = v; }],
    ['keyboard-pan-high', () => keyboardPanHigh, (v: number) => { keyboardPanHigh = v; }],
  ] as const;
  const speedPairs = () => [
    ['mouse-move', mouseMoveLow, mouseMoveHigh],
    ['mouse-pan', mousePanLow, mousePanHigh],
    ['keyboard-move', keyboardMoveLow, keyboardMoveHigh],
    ['keyboard-pan', keyboardPanLow, keyboardPanHigh],
  ] as const;
  const previewX = (altitude: number) => 28 + 230 * Math.log(
    Math.max(NAV_LOW_HEIGHT_M, Math.min(NAV_HIGH_HEIGHT_M, altitude)) / NAV_LOW_HEIGHT_M,
  ) / Math.log(NAV_HIGH_HEIGHT_M / NAV_LOW_HEIGHT_M);
  // Adapt the chart scale to the calibration range. A fixed 0–10× chart
  // hides small but important slope changes around the default 1–3× values.
  const previewMax = () => Math.max(4, Math.ceil(Math.max(
    mouseMoveLow, mouseMoveHigh, mousePanLow, mousePanHigh,
    keyboardMoveLow, keyboardMoveHigh, keyboardPanLow, keyboardPanHigh,
  ) / 2) * 2);
  const previewY = (multiplier: number) => 116 - 104 * Math.max(0, Math.min(previewMax(), multiplier)) / previewMax();
  let lastPreviewHeight = NaN;
  const syncCurveCurrent = () => {
    if (!viewOptions?.open) return;
    const h = navigationHeight();
    if (Number.isFinite(lastPreviewHeight) && Math.abs(lastPreviewHeight - h) < .2) return;
    lastPreviewHeight = h;
    const x = previewX(h);
    navigationCurveMarker?.setAttribute('d', `M ${x.toFixed(2)} 12 V 116`);
    for (const [key, low, high] of speedPairs()) {
      const dot = navigationCurveDots.get(key);
      dot?.setAttribute('cx', x.toFixed(2));
      dot?.setAttribute('cy', previewY(navigationAltitudeMultiplier(h, low, high, curvePower)).toFixed(2));
    }
    if (navigationCurveCurrent) navigationCurveCurrent.textContent =
      `AT ${Math.round(h).toLocaleString('en-AU')} M · MOVE ${effectiveMouseMove().toFixed(2)}× · PAN ${effectiveMousePan().toFixed(2)}× · KEY MOVE ${effectiveKeyboardMove().toFixed(2)}× · KEY PAN ${effectiveKeyboardPan().toFixed(2)}×`;
  };
  const syncCurvePlot = () => {
    if (navigationScaleTop) navigationScaleTop.textContent = `${previewMax()}×`;
    if (navigationScaleMid) navigationScaleMid.textContent = `${previewMax() / 2}×`;
    for (const [key, low, high] of speedPairs()) {
      const d = Array.from({ length: 49 }, (_, i) => {
        const t = i / 48;
        const h = NAV_LOW_HEIGHT_M * Math.pow(NAV_HIGH_HEIGHT_M / NAV_LOW_HEIGHT_M, t);
        return `${i ? 'L' : 'M'} ${(28 + 230 * t).toFixed(2)} ${previewY(navigationAltitudeMultiplier(h, low, high, curvePower)).toFixed(2)}`;
      }).join(' ');
      navigationCurvePaths.get(key)?.setAttribute('d', d);
    }
    lastPreviewHeight = NaN;
    syncCurveCurrent();
  };
  const syncCalibration = () => {
    for (const [key, read] of speedSlots) {
      const controls = navigationSpeedInputs.get(key);
      if (controls?.input) controls.input.value = read().toFixed(2);
      if (controls?.output) controls.output.textContent = `${read().toFixed(2)}×`;
    }
    if (navigationCurveInput) navigationCurveInput.value = curvePower.toFixed(1);
    if (navigationCurveOutput) navigationCurveOutput.textContent = curvePower.toFixed(1);
    syncCurvePlot();
    if (navigationConfig) navigationConfig.value = calibrationLine();
  };
  // Re-render on adjustment but intentionally do not persist trial changes.
  // The user's confirmed baseline is restored on every page refresh.
  const updateCalibration = () => syncCalibration();
  for (const [key, read, write] of speedSlots) {
    const input = navigationSpeedInputs.get(key)?.input;
    input?.addEventListener('input', () => {
      write(normaliseNavigationMultiplier(input.value, read()));
      if (navigationCopyStatus) navigationCopyStatus.textContent = '';
      updateCalibration();
    });
  }
  navigationCurveInput?.addEventListener('input', () => {
    curvePower = normaliseNavigationCurve(navigationCurveInput.value);
    if (navigationCopyStatus) navigationCopyStatus.textContent = '';
    updateCalibration();
  });
  viewOptions?.addEventListener('toggle', () => { if (viewOptions.open) syncCalibration(); });
  syncCalibration();
  navigationCopyButton?.addEventListener('click', async () => {
    syncCalibration();
    const line = calibrationLine();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard permission unavailable');
      await navigator.clipboard.writeText(line);
      if (navigationCopyStatus) navigationCopyStatus.textContent = 'COPIED';
    } catch {
      // A selectable text field is the fallback on browsers denying clipboard access.
      navigationConfig?.focus(); navigationConfig?.select();
      if (navigationCopyStatus) navigationCopyStatus.textContent = 'SELECTED: CTRL+C';
    }
  });

  let plan: PlanPose = { x: 0, y: 0, rotationRad: 0, zoom: 1 };
  let skylineDollyRemaining: Vec3 = { x: 0, y: 0, z: 0 };
  let planZoomTarget = plan.zoom;
  let heightSelectionTargetZ: number | null = null;
  let heightAnimationTargetZ: number | null = null;
  let heightScaleMaxM = 600;
  let heightWheelAccumulator = 0;
  let heightScrollStreak = 0;
  let lastHeightScrollAt = -Infinity;
  let heightTrackHeightPx = 1;
  let sortedHeightLandmarks: Landmark[] = [];
  type ComparisonFigure = { landmark: Landmark; element: HTMLElement; svg: SVGSVGElement };
  let comparisonFigures: ComparisonFigure[] = [];
  let lastComparisonActiveIndex = -2;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgElement = (name: string) => document.createElementNS(svgNS, name);

  const buildHeightComparison = () => {
    if (!heightComparisonFigures) return;
    heightComparisonFigures.replaceChildren();
    sortedHeightLandmarks = heightAtlasLandmarks(landmarks);
    comparisonFigures = [];
    lastComparisonActiveIndex = -2;
    for (const landmark of sortedHeightLandmarks) {
      const figure = document.createElement('div');
      figure.className = 'fireworks-simulator__height-figure';
      figure.dataset.phase = 'other';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 120 160');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.classList.add('fireworks-simulator__height-silhouette');
      const shape = landmarkSilhouette(landmark);
      const base = svgElement('path');
      base.setAttribute('d', shape.outline);
      base.setAttribute('class', 'fireworks-simulator__height-silhouette-outline');
      const details = svgElement('path');
      details.setAttribute('d', shape.details);
      details.setAttribute('class', 'fireworks-simulator__height-silhouette-detail');
      const fill = svgElement('path');
      fill.setAttribute('d', shape.outline);
      fill.setAttribute('class', 'fireworks-simulator__height-silhouette-fill');
      svg.append(base, details, fill);
      const label = document.createElement('span');
      label.className = 'fireworks-simulator__height-figure-label';
      label.textContent = landmark.name;
      const metre = document.createElement('small');
      metre.textContent = `${Math.round(landmark.heightM)} M`;
      figure.style.setProperty('--figure-base-alpha', '.18');
      figure.append(svg, label, metre);
      heightComparisonFigures.append(figure);
      comparisonFigures.push({ landmark, element: figure, svg });
    }
  };

  /** Positions all profiles against the existing ruler's real metre scale.
   * Only DOM/SVG silhouettes move: the camera and WebGL scene are untouched. */
  const syncHeightComparison = (targetM: number, maxM: number) => {
    if (!heightComparison || !heightComparisonValue || !heightComparisonName || !heightComparisonRoof || !heightTrack) return;
    const track = heightTrack.getBoundingClientRect();
    const stage = root.getBoundingClientRect();
    heightComparison.style.top = `${(track.top - stage.top).toFixed(1)}px`;
    heightComparison.style.height = `${heightTrackHeightPx}px`;
    heightComparison.style.setProperty('--scan-height', `${(heightTrackHeightPx * Math.min(1, targetM / maxM)).toFixed(2)}px`);
    heightComparisonValue.textContent = `${Math.round(targetM).toLocaleString('en-AU')} M`;
    const index = activeHeightLandmarkIndex(sortedHeightLandmarks, targetM);
    const active = index >= 0 ? sortedHeightLandmarks[index] : null;
    const anchorIndex = index >= 0 ? index : sortedHeightLandmarks.length - 1;
    if (index !== lastComparisonActiveIndex) {
      comparisonFigures.forEach(({ element }, i) => {
        const step = i - anchorIndex;
        element.style.setProperty('--figure-step', String(step));
      });
      lastComparisonActiveIndex = index;
    }
    for (const { landmark, element, svg } of comparisonFigures) {
      const step = Number(element.style.getPropertyValue('--figure-step')) || 0;
      const rawHeight = Math.min(heightTrackHeightPx, heightTrackHeightPx * landmark.heightM / maxM);
      const isActive = active?.id === landmark.id;
      const heightPx = comparisonDisplayedHeightPx(rawHeight, isActive);
      svg.style.height = `${heightPx.toFixed(2)}px`;
      const progress = isActive ? Math.min(1, targetM / landmark.heightM) : 0;
      element.style.setProperty('--hide-fill', `${((1 - progress) * 100).toFixed(2)}%`);
      element.dataset.miniature = String(heightPx < 35);
      element.dataset.phase = isActive ? 'active' : 'inactive';
      const absStep = Math.abs(step);
      const rightward = step >= 0;
      const alpha = isActive ? 1 : rightward
        ? (absStep <= 1 ? .42 : absStep <= 4 ? .31 : absStep <= 7 ? .19 : .12)
        : (absStep <= 1 ? .38 : absStep <= 3 ? .25 : .13);
      element.style.setProperty('--figure-base-alpha', `${alpha}`);
    }
    heightComparisonName.textContent = active ? active.name.toUpperCase() :
      sortedHeightLandmarks.length ? 'ABOVE ALL KEY BUILDINGS' : 'CITY DATA UNAVAILABLE';
    heightComparisonRoof.textContent = active ? `${Math.round(active.heightM)} M ROOF` :
      sortedHeightLandmarks.length ? `TALLEST ${Math.round(sortedHeightLandmarks.at(-1)!.heightM)} M` : '';
    heightComparison.dataset.aboveAll = String(index < 0 && sortedHeightLandmarks.length > 0);
  };

  let cursorOriginX = 0;
  let cursorOriginY = 0;
  // The visibility preference is remembered, but the currently preferred
  // input method is session-only and changes with the actual camera input.
  const guideStorageKey = 'fireworks-simulator:navigation-guide-visible:v1';
  const setGuideVisible = (visible: boolean) => {
    if (navigationGuide) navigationGuide.hidden = !visible;
    if (navigationGuideToggle) navigationGuideToggle.checked = visible;
    try { window.localStorage.setItem(guideStorageKey, visible ? 'true' : 'false'); }
    catch { /* Private browsing/storage restrictions must not break camera input. */ }
  };
  let storedGuideVisible: string | null = null;
  try { storedGuideVisible = window.localStorage.getItem(guideStorageKey); }
  catch { /* Use the default visible state when storage is unavailable. */ }
  setGuideVisible(storedGuideVisible !== 'false');
  navigationGuideToggle?.addEventListener('change', () => setGuideVisible(navigationGuideToggle.checked));
  navigationGuideHide?.addEventListener('click', () => setGuideVisible(false));
  let lastGuideInput: 'pointer' | 'keyboard' = 'pointer';
  let lastPointerGuideType: 'mouse' | 'touch' = 'mouse';
  const setGuideInput = (input: 'keyboard' | 'mouse' | 'touch') => {
    const next = input === 'keyboard' ? 'keyboard' : 'pointer';
    const pointerType = input === 'touch' ? 'touch' : 'mouse';
    if (next === lastGuideInput && (next === 'keyboard' || pointerType === lastPointerGuideType)) return;
    lastGuideInput = next;
    if (next === 'pointer') lastPointerGuideType = pointerType;
    if (navigationGuide) {
      navigationGuide.dataset.activeInput = next;
      navigationGuide.dataset.pointerType = lastPointerGuideType;
    }
    if (pointerGuideLabel) pointerGuideLabel.textContent = lastPointerGuideType === 'touch' ? 'TOUCH' : 'MOUSE';
    if (pointerGuideSummary) pointerGuideSummary.textContent = lastPointerGuideType === 'touch' ? 'DRAG / PINCH' : 'DRAG / WHEEL';
  };
  if (window.matchMedia('(pointer: coarse)').matches) setGuideInput('touch');
  let lastCameraMotionAt = -Infinity;
  let identityCompact = false;
  const compactIdentity = () => {
    if (identityCompact) return;
    identityCompact = true;
    root.classList.add('is-identity-compact');
  };
  // Intentionally not persisted: every fresh page load begins with the title.
  const identityTimer = window.setTimeout(compactIdentity, 5000);
  const noteCameraMotion = () => {
    lastCameraMotionAt = performance.now();
    root.classList.add('is-camera-moving');
    compactIdentity();
  };

  // The context menu must not steal right-button camera gestures, including
  // when the pointer is above forms, header links or text on this page.
  const blockPageContextMenu = (event: MouseEvent) => event.preventDefault();
  document.addEventListener('contextmenu', blockPageContextMenu, true);
  // One manual map rotation path at all altitudes. The pivot is the visible
  // ground rather than the floating camera look target.
  let manualRotationPivot: Vec3 | null = null;
  let hasMovedCamera = false;
  let cameraBasisCache: ReturnType<typeof computeCameraBasis> | null = null;
  let skylineFocalPx = 1;
  // Some browsers/device drivers report WheelEvent.buttons=0 even with a
  // mouse button physically held. Track actual pointer chord state as well.
  let heldMouseButtons = 0;
  const activePointers = new Map<number, PointerSpot>();
  const pointerOrigins = new Map<number, PointerSpot>();
  const pointerTravel = new Map<number, number>();
  let gestureLastCentroid: PointerSpot | null = null;
  let gestureLastDistance = 0;
  let gestureLastAngle = 0;
  let suppressSceneClick = false;

  type NavigationKey =
    | 'panUp' | 'panDown' | 'panLeft' | 'panRight'
    | 'rotateUp' | 'rotateDown' | 'rotateLeft' | 'rotateRight'
    | 'heightPositive' | 'heightNegative'
    | 'moveForward' | 'moveBackward';
  const pressedNavigationKeys = new Set<NavigationKey>();
  let keyboardFast = false;
  let keyboardPanVelocityX = 0;
  let keyboardPanVelocityY = 0;
  let keyboardRotateVelocityX = 0;
  let keyboardRotateVelocityY = 0;
  let keyboardHeightVelocity = 0;
  let keyboardDollyVelocity = 0;
  let lastAnimationTime = performance.now();

  let viewport: Viewport = {
    width: 1,
    height: 1,
    dpr: 1,
    planScale: 1,
    planCentreX: 0,
    planCentreY: 0,
    planScreenX: 0.5,
    planScreenY: 0.5,
    skylineScreenX: 0.5,
    skylineHorizonY: 0.5,
  };
  let seeds: ParticleSeed[] = [];
  let launchStart = performance.now();
  let animationFrame = 0;
  let fpsFrames = 0;
  let fpsWindowStart = performance.now();
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const colourHex = (id: string | null | undefined, fallback = '#f3f6ff') =>
    (id && colourById.get(id)?.renderHex) || fallback;
  const expansionAnchorMps = config.peonyCalibration?.initialExpansionMps ?? DEFAULT_INITIAL_EXPANSION_MPS;

  const launchSite = (): Vec3 => {
    const site = city?.launchSites?.[0];
    return site ? { x: site.x, y: site.y, z: site.z } : { x: 0, y: 0, z: 0 };
  };

  const displayEffectName = () => {
    const originalPrimary = state.preset.tipColours[0] ?? 'white';
    if (state.primaryColourId === originalPrimary) return state.preset.name;
    const colourName = colourById.get(state.primaryColourId)?.label ?? state.primaryColourId;
    return `${colourName} ${state.family.label}`;
  };

  const qualityScale = () => {
    if (reducedMotion) return 0.55;
    if (viewport.width < 500) return 0.62;
    if (viewport.width < MOBILE_BREAKPOINT) return 0.72;
    if (viewport.width < 1000) return 0.86;
    return 1;
  };

  const baseParticleCount = () => {
    switch (state.family.id) {
      case 'chrysanthemum': return 138;
      case 'willow': return 108;
      case 'crossette': return 32;
      case 'peony':
      default: return 156;
    }
  };

  const buildSeedKey = () => [
    state.preset.id,
    state.calibreMm,
    Math.round(state.heightM),
    Math.round(state.spreadM),
    state.primaryColourId,
    viewport.width < MOBILE_BREAKPOINT ? 'mobile' : 'desktop',
  ].join('|');

  const createSeeds = () => {
    const defaults = state.preset.renderDefaults;
    const count = Math.max(18, Math.round(baseParticleCount() * defaults.density * qualityScale()));
    const random = mulberry32(hashString(buildSeedKey()));
    const generated: ParticleSeed[] = [];

    for (let index = 0; index < count; index += 1) {
      const z = random() * 2 - 1;
      const phi = random() * Math.PI * 2;
      const ring = Math.sqrt(Math.max(0, 1 - z * z));
      const symmetryNoise = (1 - defaults.symmetry) * (random() - 0.5) * 0.9;
      const raggedness = (random() - 0.5) * defaults.raggedness * 1.45;
      generated.push({
        dx: ring * Math.cos(phi),
        dy: ring * Math.sin(phi),
        depth: z,
        radialScale: clamp(1 + symmetryNoise + raggedness, 0.58, 1.34),
        brightness: lerp(0.62, 1, random()),
        colourIndex: Math.floor(random() * Math.max(1, state.preset.tipColours.length)),
        phase: random() * Math.PI * 2,
      });
    }

    seeds = generated;
    const renderedParticles = state.family.id === 'crossette' ? seeds.length * 4 : seeds.length;
    particlesLabel.textContent = `PARTICLES ${renderedParticles}`;
  };

  const positionZoomAim = () => {
    const point = zoomAimScreenPoint(viewMode, viewport);
    zoomAim.style.left = `${point.x.toFixed(2)}px`;
    zoomAim.style.top = `${point.y.toFixed(2)}px`;
  };
  const showZoomAim = () => {
    lastZoomInputAt = performance.now();
    root.classList.add('is-zooming');
  };
  let lastZoomInputAt = -Infinity;

  const updateViewport = () => {
    const rect = root.getBoundingClientRect();
    // Cache stage geometry. Reading layout on every pointermove makes the
    // custom cursor feel delayed when the city is expensive to render.
    cursorOriginX = rect.left;
    cursorOriginY = rect.top;
    heightTrackHeightPx = Math.max(1, heightTrack.clientHeight);
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, width < MOBILE_BREAKPOINT ? 1.5 : 2);

    if (skyCanvas && skyContext) {
      skyCanvas.width = Math.max(1, Math.round(width * dpr));
      skyCanvas.height = Math.max(1, Math.round(height * dpr));
      skyCanvas.style.width = `${width}px`;
      skyCanvas.style.height = `${height}px`;
      skyDirty = true;
    }
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    webglCity?.resize(width, height, dpr);

    const bounds = city?.bounds ?? { minX: -1500, maxX: 1500, minY: -2400, maxY: 1300 };
    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxY - bounds.minY;
    const topPad = width < MOBILE_BREAKPOINT ? 96 : 70;
    const bottomPad = width < MOBILE_BREAKPOINT ? Math.min(310, height * 0.45) : 92;
    const sidePad = width < MOBILE_BREAKPOINT ? 28 : 74;
    const usableWidth = Math.max(180, width - sidePad * 2);
    const usableHeight = Math.max(180, height - topPad - bottomPad);
    const planScale = Math.min(usableWidth / worldWidth, usableHeight / worldHeight);

    // A user-controlled camera survives resizing. The initial mobile framing is
    // selected only until the user has changed the POV.
    if (!hasMovedCamera) {
      camera = makeCamera(width < MOBILE_BREAKPOINT);
      constrainSkylineGround();
      skylineDollyRemaining = { x: 0, y: 0, z: 0 };
    }
    const screenCentre = projectionScreenCentre(width, height);
    viewport = {
      width,
      height,
      dpr,
      planScale,
      planCentreX: (bounds.minX + bounds.maxX) / 2,
      planCentreY: (bounds.minY + bounds.maxY) / 2,
      planScreenX: screenCentre.x,
      planScreenY: screenCentre.y,
      skylineScreenX: screenCentre.x,
      skylineHorizonY: screenCentre.y,
    };
    skylineFocalPx = (height * 0.5) / Math.tan(toRadians(width < MOBILE_BREAKPOINT ? 45 : 39) / 2);
    positionZoomAim();
    cameraBasisCache = null;
    createSeeds();
    cityDirty = true;
    occlusionDirty = true;
    // Keep the compositor-driven height markers aligned after a resize.
    syncHeightIndicator();
    syncOrientationHud();
  };

  function computeCameraBasis() {
    const { eye, target, rollRad } = camera;
    const forward = normalise(subtract(target, eye));
    // Maintain the same world-up frame at every elevation. Changing the
    // reference axis near vertical used to abruptly flip the whole city.
    // SKYLINE pitch is limited below 90 degrees so this cross stays defined.
    const baseRight = normalise(cross(forward, { x: 0, y: 0, z: 1 }));
    const baseUp = normalise(cross(baseRight, forward));
    const cr = Math.cos(rollRad), sr = Math.sin(rollRad);
    const right = { x: baseRight.x*cr + baseUp.x*sr, y: baseRight.y*cr + baseUp.y*sr, z: baseRight.z*cr + baseUp.z*sr };
    const up = { x: baseUp.x*cr - baseRight.x*sr, y: baseUp.y*cr - baseRight.y*sr, z: baseUp.z*cr - baseRight.z*sr };
    return { eye, forward, right, up };
  }

  const cameraBasis = () => cameraBasisCache ??= computeCameraBasis();

  const projectSkyline = (point: Vec3): ScreenPoint | null => {
    const { eye, forward, right, up } = cameraBasis();
    const relative = subtract(point, eye);
    const depth = dot(relative, forward);
    if (depth < 8) return null;
    const focal = skylineFocalPx;
    return {
      x: viewport.skylineScreenX + (dot(relative, right) * focal) / depth,
      y: viewport.skylineHorizonY - (dot(relative, up) * focal) / depth,
      depth,
    };
  };

  const projectPlan = (point: Vec3): ScreenPoint => {
    const dx = point.x - (viewport.planCentreX + plan.x);
    const dy = point.y - (viewport.planCentreY + plan.y);
    const cos = Math.cos(plan.rotationRad), sin = Math.sin(plan.rotationRad);
    return {
      x: viewport.planScreenX + (dx*cos - dy*sin) * viewport.planScale * plan.zoom,
      y: viewport.planScreenY - (dx*sin + dy*cos) * viewport.planScale * plan.zoom,
      depth: point.z,
    };
  };

  const project = (point: Vec3) => viewMode === 'plan' ? projectPlan(point) : projectSkyline(point);

  const skylineFocalLength = () => skylineFocalPx;

  /** The astronomical scene is in local east/north/up metres, matching the
   * Sydney city bundle. Render into the background canvas, not on top of city
   * geometry or the fireworks effects. Bright-star subset only (draft). */
  const moonPreviewContext = skyMoonPreview?.getContext('2d') ?? null;
  const moonTexture = document.createElement('canvas');
  moonTexture.width = moonTexture.height = 64;
  const moonTextureContext = moonTexture.getContext('2d');
  let moonTextureKey = '';
  const paintMoonTexture = () => {
    if (!moonTextureContext) return;
    const moon = currentSky.moon;
    const key = `${moon.illuminated.toFixed(3)}:${moon.waxing}`;
    if (key === moonTextureKey) return;
    moonTextureKey = key;
    const texture = moonTextureContext.createImageData(64, 64);
    const phase = Math.acos(Math.max(-1, Math.min(1, 2 * moon.illuminated - 1)));
    const litSide = moon.waxing ? -1 : 1; // southern-sky draft orientation
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const nx = (x - 31.5) / 29, ny = (y - 31.5) / 29;
      const radius2 = nx * nx + ny * ny;
      if (radius2 > 1) continue;
      const nz = Math.sqrt(1 - radius2);
      const dotLight = litSide * nx * Math.sin(phase) + nz * Math.cos(phase);
      const lit = Math.max(0, dotLight);
      const maria = 0.88 + 0.08 * Math.sin(x * 0.58 + y * 0.12) * Math.cos(y * 0.43);
      const colour = Math.round((24 + lit * 208) * maria);
      const i = (y * 64 + x) * 4;
      texture.data[i] = colour;
      texture.data[i + 1] = colour;
      texture.data[i + 2] = Math.min(255, colour + 8);
      texture.data[i + 3] = Math.round(Math.min(1, (1 - radius2) * 28) * 255);
    }
    moonTextureContext.putImageData(texture, 0, 0);
    if (moonPreviewContext) {
      moonPreviewContext.clearRect(0, 0, 42, 42);
      moonPreviewContext.drawImage(moonTexture, 1, 1, 40, 40);
      moonPreviewContext.strokeStyle = 'rgba(245, 234, 202, .32)';
      moonPreviewContext.lineWidth = .6;
      moonPreviewContext.beginPath(); moonPreviewContext.arc(21, 21, 17.8, 0, Math.PI * 2); moonPreviewContext.stroke();
    }
  };
  const skyScreen = (direction: Vec3): { x: number; y: number } | null => {
    const { forward, right, up } = cameraBasis();
    const depth = dot(direction, forward);
    if (depth <= 0.06) return null;
    return {
      x: viewport.skylineScreenX + dot(direction, right) * skylineFocalPx / depth,
      y: viewport.skylineHorizonY - dot(direction, up) * skylineFocalPx / depth,
    };
  };
  const drawNightSky = (now: number) => {
    if (!skyCanvas || !skyContext) return;
    if (skyDirty) paintMoonTexture();
    skyCanvas.style.display = viewMode === 'skyline' ? 'block' : 'none';
    if (viewMode !== 'skyline') { skyDirty = true; return; }
    if (!skyDirty && !cityDirty && now - lastSkyDrawAt < 180) return;
    skyDirty = false;
    lastSkyDrawAt = now;
    skyContext.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    const width = viewport.width, height = viewport.height;
    skyContext.clearRect(0, 0, width, height);
    const darkness = currentSky.darkness;
    // A restrained time-of-day atmosphere keeps the wireframe readable even
    // in daylight. Twilight warms the horizon; stars fade as sunlight rises.
    const daylight = Math.max(0, Math.min(1, (currentSky.sun.altitudeDeg + 8) / 20));
    const twilight = Math.max(0, 1 - Math.abs(currentSky.sun.altitudeDeg + 5) / 12);
    const atmospheric = skyContext.createLinearGradient(0, 0, 0, height);
    atmospheric.addColorStop(0, `rgba(${Math.round(9 + 18 * daylight)}, ${Math.round(17 + 32 * daylight)}, ${Math.round(30 + 49 * daylight)}, ${(0.26 + daylight * .43).toFixed(3)})`);
    atmospheric.addColorStop(0.68, `rgba(${Math.round(14 + 31 * daylight + 13 * twilight)}, ${Math.round(19 + 42 * daylight + 4 * twilight)}, ${Math.round(27 + 52 * daylight)}, ${(0.16 + daylight * .47 + twilight * .11).toFixed(3)})`);
    atmospheric.addColorStop(1, `rgba(5, 7, 10, ${(daylight * .14).toFixed(3)})`);
    skyContext.fillStyle = atmospheric;
    skyContext.fillRect(0, 0, width, height);
    for (let index = 0; index < currentSky.stars.length; index++) {
      const star = currentSky.stars[index];
      const screen = skyScreen(star.direction);
      if (!screen || screen.x < -12 || screen.y < -12 || screen.x > width + 12 || screen.y > height + 12) continue;
      const size = Math.max(.65, Math.min(2.25, 1.95 - star.magnitude * .43));
      const flicker = reducedMotion ? 1 : 0.96 + 0.04 * Math.sin(now / 1750 + index * 2.49);
      const opacity = Math.min(.94, (0.78 - star.magnitude * .09) * darkness * flicker);
      if (opacity <= 0.01) continue;
      if (star.magnitude < 1.0) {
        skyContext.fillStyle = `rgba(202, 217, 251, ${(opacity * .11).toFixed(3)})`;
        skyContext.beginPath(); skyContext.arc(screen.x, screen.y, size * 3.6, 0, Math.PI * 2); skyContext.fill();
      }
      skyContext.fillStyle = `rgba(234, 239, 255, ${opacity.toFixed(3)})`;
      skyContext.beginPath(); skyContext.arc(screen.x, screen.y, size, 0, Math.PI * 2); skyContext.fill();
    }
    const moon = currentSky.moon;
    if (moon.altitudeDeg > 0) {
      const screen = skyScreen(moon.direction);
      if (screen && screen.x > -30 && screen.y > -30 && screen.x < width + 30 && screen.y < height + 30) {
        paintMoonTexture();
        const radius = Math.max(10, Math.min(18, skylineFocalPx * Math.tan(0.42 * Math.PI / 180)));
        skyContext.save();
        skyContext.globalAlpha = 0.72 + darkness * 0.28;
        skyContext.shadowColor = 'rgba(232, 236, 251, .4)';
        skyContext.shadowBlur = 12;
        skyContext.drawImage(moonTexture, screen.x - radius, screen.y - radius, radius * 2, radius * 2);
        skyContext.restore();
      }
    }
  };

  const sphereVisible = (centre: Vec3, radiusM: number, marginPx = 28) => {
    const point = project(centre);
    if (!point) return false;
    const radiusPx = viewMode === 'plan'
      ? radiusM * viewport.planScale * plan.zoom
      : (radiusM * skylineFocalLength()) / Math.max(8, point.depth);
    return !(
      point.x + radiusPx < -marginPx || point.x - radiusPx > viewport.width + marginPx ||
      point.y + radiusPx < -marginPx || point.y - radiusPx > viewport.height + marginPx
    );
  };

  const prepareCityGeometry = () => {
    if (!city) {
      preparedBuildings = [];
      preparedRoadSegments = [];
      return;
    }

    preparedBuildings = city.buildings
      .filter((building) => !building.roadConflict && building.footprint.length >= 3 &&
        !overlapsAuthoredLandmark(building, city?.structures ?? []))
      .map((building) => {
        let minX = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
        for (const [x, y] of building.footprint) {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        const baseZ = building.minHeightM ?? 0;
        const roofZ = building.heightM;
        const centre = {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
          z: (baseZ + roofZ) / 2,
        };
        const radiusM = Math.hypot(maxX - minX, maxY - minY, roofZ - baseZ) / 2;
        const area = building.footprint.reduce((acc, [x, y], index) => {
          const next = building.footprint[(index + 1) % building.footprint.length];
          return acc + x * next[1] - next[0] * y;
        }, 0);
        return { building, centre, radiusM, winding: area >= 0 ? 1 : -1 };
      });

    preparedRoadSegments = [];
    for (const road of city.roads ?? []) {
      if (road.points.length < 2) continue;
      const z = road.onType === 'bridge' ? .65 : .16;
      for (let index = 0; index < road.points.length - 1; index += 1) {
        const [x1, y1] = road.points[index];
        const [x2, y2] = road.points[index + 1];
        const a = { x: x1, y: y1, z };
        const b = { x: x2, y: y2, z };
        preparedRoadSegments.push({
          road,
          a,
          b,
          centre: { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z },
          radiusM: Math.hypot(x2 - x1, y2 - y1) / 2 + road.displayWidthM,
        });
      }
    }
  };

  // Clip geometry against the camera near plane. Without this, free-flight
  // through/near a tower loses entire walls and truss segments abruptly.
  const clipNear = (vertices: Vec3[]): Vec3[] => {
    if (viewMode === 'plan') return vertices;
    const { eye, forward } = cameraBasis();
    const depth = (p: Vec3) => dot(subtract(p, eye), forward);
    const near = 9;
    const clipped: Vec3[] = [];
    let previous = vertices[vertices.length - 1];
    let dp = depth(previous);
    for (const current of vertices) {
      const dc = depth(current);
      if ((dp >= near) !== (dc >= near)) {
        const t = clamp((near - dp) / (dc - dp), 0, 1);
        clipped.push({ x: lerp(previous.x, current.x, t), y: lerp(previous.y, current.y, t), z: lerp(previous.z, current.z, t) });
      }
      if (dc >= near) clipped.push(current);
      previous = current;
      dp = dc;
    }
    return clipped;
  };

  const strokeWorldLine = (a: Vec3, b: Vec3, colour: string, width = 1, alpha = 1) => {
    const clipped = clipNear([a, b]);
    if (clipped.length < 2) return;
    const pa = project(clipped[0]);
    const pb = project(clipped[1]);
    if (!pa || !pb) return;
    context.save();
    context.strokeStyle = colour;
    context.globalAlpha = alpha;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(pa.x, pa.y);
    context.lineTo(pb.x, pb.y);
    context.stroke();
    context.restore();
  };

  const drawPlanGrid = () => {
    if (!city) return;
    const step = 250;
    context.save();
    context.strokeStyle = 'rgba(210,224,225,.045)';
    context.lineWidth = 1;
    const minX = Math.floor(city.bounds.minX / step) * step;
    const maxX = Math.ceil(city.bounds.maxX / step) * step;
    const minY = Math.floor(city.bounds.minY / step) * step;
    const maxY = Math.ceil(city.bounds.maxY / step) * step;
    for (let x = minX; x <= maxX; x += step) strokeWorldLine({ x, y: minY, z: 0 }, { x, y: maxY, z: 0 }, CITY_LINE_FAINT);
    for (let y = minY; y <= maxY; y += step) strokeWorldLine({ x: minX, y, z: 0 }, { x: maxX, y, z: 0 }, CITY_LINE_FAINT);
    context.restore();
  };

  const groundExtent = () => {
    // Match the skyline guide field to the same scene envelope used by land,
    // roads and buildings. Earlier hard-coded padding created empty borders.
    const step = 250;
    const minX = Math.floor((city?.bounds.minX ?? -1800) / step) * step;
    const maxX = Math.ceil((city?.bounds.maxX ?? 1800) / step) * step;
    const minY = Math.floor((city?.bounds.minY ?? -2400) / step) * step;
    const maxY = Math.ceil((city?.bounds.maxY ?? 900) / step) * step;
    return { minX, maxX, minY, maxY };
  };

  const drawSkylineGrid = () => {
    const { minX, maxX, minY, maxY } = groundExtent();
    const step = 250;
    for (let x = minX; x <= maxX; x += step) {
      strokeWorldLine({ x, y: minY, z: 0 }, { x, y: maxY, z: 0 }, CITY_LINE_FAINT, 1, 0.7);
    }
    for (let y = minY; y <= maxY; y += step) {
      strokeWorldLine({ x: minX, y, z: 0 }, { x: maxX, y, z: 0 }, CITY_LINE_FAINT, 1, 0.7);
    }
  };

  const drawLand = () => {
    if (!layerVisible('land') || !city?.land?.triangles?.length) return;
    // Land is a sourced coastline mesh, not a rectangle with water painted
    // over it. Sea/harbour are transparent so the black stage shows through.
    // SKYLINE WebGL has its own depth-tested ground pass. This Canvas path
    // handles PLAN and WebGL-unavailable browsers only.
    context.save();
    context.globalAlpha *= layers.opacity.land;
    context.beginPath();
    let drawn = 0;
    for (const triangle of city.land.triangles) {
      if (triangle.length !== 3) continue;
      const clipped = clipNear(triangle.map(([x, y]) => ({ x, y, z: -.35 })));
      if (clipped.length < 3) continue;
      const screen = clipped.map(project);
      if (screen.some((point) => !point)) continue;
      context.moveTo(screen[0]!.x, screen[0]!.y);
      for (let i = 1; i < screen.length; i += 1) context.lineTo(screen[i]!.x, screen[i]!.y);
      context.closePath();
      drawn += 1;
    }
    if (drawn) {
      context.fillStyle = viewMode === 'plan' ? 'rgba(116,127,130,.23)' : 'rgba(116,127,130,.18)';
      context.fill();
    }
    context.restore();
  };

  const cityEdgeFadeBounds = () => {
    if (!city) return null;
    const { minX, maxX, minY, maxY } = city.bounds;
    const insetX = Math.min(CITY_EDGE_FADE_M, Math.max(40, (maxX - minX) / 3));
    const insetY = Math.min(CITY_EDGE_FADE_M, Math.max(40, (maxY - minY) / 3));
    return {
      outer: { minX, maxX, minY, maxY },
      inner: {
        minX: Math.min(maxX, minX + insetX),
        maxX: Math.max(minX, maxX - insetX),
        minY: Math.min(maxY, minY + insetY),
        maxY: Math.max(minY, maxY - insetY),
      },
    };
  };

  const drawFadeStrip = (corners: Vec3[], gradientFrom: Vec3, gradientTo: Vec3) => {
    const points = corners.map(project);
    if (points.some((point) => !point)) return;
    const start = project(gradientFrom);
    const end = project(gradientTo);
    if (!start || !end) return;
    context.save();
    context.beginPath();
    context.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i += 1) context.lineTo(points[i]!.x, points[i]!.y);
    context.closePath();
    // The overlay and Canvas fallback have no fragment shader. Remove their
    // existing pixels at the edge instead of painting visible dark bands.
    // SKYLINE WebGL handles the actual city directly in its fragment shader.
    context.globalCompositeOperation = 'destination-out';
    const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(.5, 'rgba(0,0,0,.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fill();
    context.restore();
  };

  const drawCityEdgeFade = () => {
    // Apply only to an off-screen city/occlusion canvas, never to the main
    // fireworks canvas. destination-out would erase active fireworks there.
    const fade = cityEdgeFadeBounds();
    if (!fade) return;
    const z = -.2;
    const { outer, inner } = fade;
    const midX = (outer.minX + outer.maxX) / 2;
    const midY = (outer.minY + outer.maxY) / 2;
    drawFadeStrip([
      { x: outer.minX, y: outer.minY, z },
      { x: inner.minX, y: inner.minY, z },
      { x: inner.minX, y: inner.maxY, z },
      { x: outer.minX, y: outer.maxY, z },
    ],
    { x: outer.minX, y: midY, z },
    { x: inner.minX, y: midY, z });
    // No eastern rectangular fade: the sourced Pacific shoreline is the edge.
    drawFadeStrip([
      { x: inner.minX, y: inner.minY, z },
      { x: inner.maxX, y: inner.minY, z },
      { x: outer.maxX, y: outer.minY, z },
      { x: outer.minX, y: outer.minY, z },
    ],
    { x: midX, y: outer.minY, z },
    { x: midX, y: inner.minY, z });
    drawFadeStrip([
      { x: outer.minX, y: outer.maxY, z },
      { x: outer.maxX, y: outer.maxY, z },
      { x: inner.maxX, y: inner.maxY, z },
      { x: inner.minX, y: inner.maxY, z },
    ],
    { x: midX, y: outer.maxY, z },
    { x: midX, y: inner.maxY, z });
  };

  const roadPixelWidth = (a: Vec3, b: Vec3, widthM: number) => {
    if (viewMode === 'plan') return clamp(widthM * viewport.planScale * plan.zoom, .75, 34);
    const pa = project(a), pb = project(b);
    const depth = ((pa?.depth ?? 0) + (pb?.depth ?? 0)) / 2;
    if (!Number.isFinite(depth) || depth <= 0) return .75;
    return clamp((widthM * skylineFocalLength()) / depth, .6, 24);
  };

  const drawRoads = () => {
    if (!layerVisible('roads') || !preparedRoadSegments.length) return;
    type RoadStroke = { pa: ScreenPoint; pb: ScreenPoint; width: number; major: boolean; tunnel: boolean; lanes: boolean };
    const groups = new Map<string, RoadStroke[]>();
    const laneGroups = new Map<string, RoadStroke[]>();

    for (const segment of preparedRoadSegments) {
      if (!sphereVisible(segment.centre, segment.radiusM, 42)) continue;
      const clipped = clipNear([segment.a, segment.b]);
      if (clipped.length < 2) continue;
      const pa = project(clipped[0]);
      const pb = project(clipped[1]);
      if (!pa || !pb) continue;
      const road = segment.road;
      const width = roadPixelWidth(clipped[0], clipped[1], road.displayWidthM);
      const major = (road.laneCountExact ?? 0) >= 4 || (road.functionHierarchy ?? 99) <= 2;
      const tunnel = road.onType === 'tunnel';
      // Quarter-pixel buckets preserve the visual road hierarchy while turning
      // thousands of individual Canvas strokes into a few dozen batched paths.
      const bucketWidth = Math.round(width * 4) / 4;
      const stroke = { pa, pb, width: bucketWidth, major, tunnel, lanes: (road.laneCountExact ?? 0) >= 2 && width >= 2.8 };
      const key = `${major ? 1 : 0}|${tunnel ? 1 : 0}|${bucketWidth.toFixed(2)}`;
      const list = groups.get(key) ?? [];
      list.push(stroke);
      groups.set(key, list);
      if (stroke.lanes) {
        const laneKey = bucketWidth.toFixed(2);
        const laneList = laneGroups.get(laneKey) ?? [];
        laneList.push(stroke);
        laneGroups.set(laneKey, laneList);
      }
    }

    context.save();
    context.globalAlpha *= layers.opacity.roads;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (const [key, strokes] of groups) {
      if (!strokes.length) continue;
      const [majorFlag, tunnelFlag] = key.split('|');
      const sample = strokes[0];
      context.globalAlpha = layers.opacity.roads * (tunnelFlag === '1' ? .22 : 1);
      context.beginPath();
      for (const stroke of strokes) {
        context.moveTo(stroke.pa.x, stroke.pa.y);
        context.lineTo(stroke.pb.x, stroke.pb.y);
      }
      context.strokeStyle = majorFlag === '1' ? 'rgba(151,174,180,.58)' : 'rgba(103,128,135,.43)';
      context.lineWidth = sample.width + Math.max(.65, sample.width * .12);
      context.stroke();
      context.strokeStyle = majorFlag === '1' ? '#070c0f' : '#090e11';
      context.lineWidth = sample.width;
      context.stroke();
    }
    context.globalAlpha = layers.opacity.roads;
    context.strokeStyle = 'rgba(211,205,178,.28)';
    for (const strokes of laneGroups.values()) {
      if (!strokes.length) continue;
      const width = strokes[0].width;
      context.setLineDash([Math.max(2, width * .42), Math.max(2.2, width * .58)]);
      context.lineWidth = clamp(width * .07, .4, .9);
      context.beginPath();
      for (const stroke of strokes) {
        context.moveTo(stroke.pa.x, stroke.pa.y);
        context.lineTo(stroke.pb.x, stroke.pb.y);
      }
      context.stroke();
    }
    context.restore();
  };

  const drawTransportPoints = () => {
    if (!layerVisible('roads') || !city?.transportPoints?.length) return;
    for (const item of city.transportPoints) {
      const point = project({ x: item.x, y: item.y, z: item.z ?? .4 });
      if (!point) continue;
      if (point.x < -8 || point.x > viewport.width + 8 || point.y < -8 || point.y > viewport.height + 8) continue;
      if (viewMode === 'skyline' && item.type === 'junction' && point.depth > 1000) continue;
      const base = viewMode === 'plan' ? 1.8 : clamp(900 / Math.max(120, point.depth), .7, 2.1);
      context.save();
      context.globalAlpha *= layers.opacity.roads;
      context.lineWidth = .75;
      if (item.type === 'traffic-signal') {
        context.fillStyle = 'rgba(224,194,116,.72)';
        context.beginPath(); context.arc(point.x, point.y, base * 1.45, 0, Math.PI * 2); context.fill();
      } else if (item.type === 'crossing') {
        context.strokeStyle = 'rgba(198,214,214,.58)';
        context.strokeRect(point.x - base, point.y - base, base * 2, base * 2);
      } else if (item.type === 'junction') {
        context.fillStyle = 'rgba(151,176,180,.25)';
        context.beginPath(); context.arc(point.x, point.y, base * .8, 0, Math.PI * 2); context.fill();
      }
      context.restore();
    }
  };

  type Surface = {
    corners: Vec3[];
    fill: string;
    edge: string;
    width: number;
    depth: number;
  };

  const paintSurface = (surface: Surface) => {
    const corners = clipNear(surface.corners);
    if (corners.length < 3) return;
    const vertices = corners.map(project);
    if (vertices.some((point) => !point)) return;
    const points = vertices as ScreenPoint[];
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) context.lineTo(points[i].x, points[i].y);
    context.closePath();
    context.fillStyle = surface.fill;
    context.fill();
    context.strokeStyle = surface.edge;
    context.lineWidth = surface.width;
    context.stroke();
  };

  // Fill *before* edges; unlike the Stage 5 wireframe, no rear roof / side
  // lines can shine through a building. Faces are painted back-to-front to
  // approximate depth without a WebGL dependency. Opaque graphite remains
  // visibly distinct from the black sky.
  const prismFaces = (
    footprint: Point2[], baseZ: number, roofZ: number,
    landmark = false,
  ): Surface[] => {
    if (footprint.length < 3) return [];
    const area = footprint.reduce((acc, [x, y], i) => {
      const next = footprint[(i + 1) % footprint.length];
      return acc + x * next[1] - next[0] * y;
    }, 0);
    const winding = area >= 0 ? 1 : -1;
    const eye = cameraBasis().eye;
    const roof: Vec3[] = footprint.map(([x, y]) => ({ x, y, z: roofZ }));
    const faces: Surface[] = [];
    const surface = (corners: Vec3[], fill: string, edge: string, width: number): Surface => ({
      corners, fill, edge, width,
      depth: corners.reduce((sum, point) => sum + (project(point)?.depth ?? 0), 0) / corners.length,
    });
    const edge = landmark && layers.highlight ? CITY_LINE_BRIGHT : CITY_LINE;
    if (viewMode === 'skyline') {
      footprint.forEach(([x, y], i) => {
        const [nx, ny] = footprint[(i + 1) % footprint.length];
        const mx = (x + nx) / 2;
        const my = (y + ny) / 2;
        const visible = winding * ((ny - y) * (eye.x - mx) - (nx - x) * (eye.y - my));
        if (visible <= 0) return;
        const normalLight = Math.abs(nx - x) / (Math.hypot(nx - x, ny - y) || 1);
        const fill = landmark
          ? (normalLight > .55 ? '#152027' : '#111a20')
          : (normalLight > .55 ? '#10191f' : '#0c1419');
        faces.push(surface([
          { x, y, z: baseZ }, { x: nx, y: ny, z: baseZ },
          { x: nx, y: ny, z: roofZ }, { x, y, z: roofZ },
        ], fill, edge, landmark ? 0.95 : 0.7));
      });
    }
    faces.push(surface(roof, landmark ? '#19242a' : '#152027', edge, landmark ? 1.05 : 0.8));
    return faces;
  };

  const drawBuilding = (building: CityBuilding) => {
    prismFaces(building.footprint, building.minHeightM ?? 0, building.heightM, building.class === 'landmark-massing')
      .sort((a, b) => b.depth - a.depth).forEach(paintSurface);
  };

  // Projected linework preserves real metre coordinates. The member is drawn
  // solid over the graphite fill, rather than as a see-through light outline.
  const drawMember = (a: Vec3, b: Vec3, bright = false, width = 1) => {
    strokeWorldLine(a, b, bright && layers.highlight ? 'rgba(205,219,221,.76)' : 'rgba(125,153,161,.5)', width);
  };

  const drawBridge = (structure: CityStructure) => {
    const span = structure.spanM ?? 503;
    const half = span / 2;
    const deckZ = 49;
    const rotation = structure.rotationDeg ?? 0;
    const point = (x: number, y: number, z: number): Vec3 => {
      const [rx, ry] = rotate2d(x, y, rotation);
      return { x: structure.x + rx, y: structure.y + ry, z };
    };
    // 28 panels per side is an observed structural characteristic. Arch
    // dimensions are approximate curves fitted to the published span, 134 m
    // crown and 18-57 m arch-truss depth, not an engineering reconstruction.
    const panels = 28;
    const upper = (t: number) => structure.heightM - 68 * t * t;
    const lower = (t: number) => upper(t) - (18 + 39 * t * t);
    const deckOutline: Point2[] = [[-25, -half * 1.23], [25, -half * 1.23], [25, half * 1.23], [-25, half * 1.23]]
      .map(([x,y]) => {
        const [rx,ry] = rotate2d(x,y,rotation);
        return [structure.x + rx, structure.y + ry] as Point2;
      });

    // Road deck and four solid pylons have dark faces, no rear-edge x-ray.
    prismFaces(deckOutline, deckZ - 8, deckZ, true).sort((a,b) => b.depth - a.depth).forEach(paintSurface);
    for (const y of [-half * 1.14, half * 1.14]) {
      for (const x of [-29, 29]) {
        const block: Point2[] = [[x-7,y-12],[x+7,y-12],[x+7,y+12],[x-7,y+12]].map(([a,b]) => {
          const q = point(a,b,0);
          return [q.x,q.y];
        });
        prismFaces(block, 0, structure.pylonHeightM ?? 89, true)
          .sort((a,b) => b.depth - a.depth).forEach(paintSurface);
      }
    }
    for (const x of [-25,25]) {
      drawMember(point(x,-half * 1.23,deckZ+1),point(x,half * 1.23,deckZ+1),true,0.9);
    }

    if (viewMode === 'plan') {
      for (let y = -half * 1.2; y < half * 1.2; y += 23) {
        drawMember(point(-25,y,deckZ+1),point(25,y,deckZ+1),false,0.6);
      }
      return;
    }

    // Far rib, cross braces, then near rib. This is a genuinely open steel
    // truss. Its gaps are intentional, unlike the opaque building surfaces.
    const eyeX = rotate2d(cameraBasis().eye.x - structure.x, cameraBasis().eye.y - structure.y, -rotation)[0];
    const ribs = eyeX > 0 ? [-20,20] : [20,-20];
    ribs.forEach((x, ribIndex) => {
      for (let i = 0; i < panels; i += 1) {
        const t0 = -1 + (2 * i) / panels;
        const t1 = -1 + (2 * (i + 1)) / panels;
        const y0 = t0 * half, y1 = t1 * half;
        const a = point(x,y0,lower(t0));
        const b = point(x,y1,lower(t1));
        const c = point(x,y1,upper(t1));
        const d = point(x,y0,upper(t0));
        const projected = [a,b,c,d].map(project);
        if (projected.every(Boolean)) {
          const s = projected as ScreenPoint[];
          context.beginPath();
          context.moveTo(s[0].x,s[0].y);
          s.slice(1).forEach(v => context.lineTo(v.x,v.y));
          context.closePath();
          context.fillStyle = ribIndex === 0 ? '#0c1419' : '#121e24';
          context.fill();
        }
        drawMember(a,b,true,1.3);
        drawMember(d,c,true,1.4);
        drawMember(a,d,false,0.8);
        drawMember(i%2 ? a : d, i%2 ? c : b, false,0.85);
        if (i % 2 === 0) drawMember(a,c,false,0.65);
      }
    });
    for (let i=0;i<=panels;i+=2) {
      const t=-1+2*i/panels, y=t*half;
      drawMember(point(-20,y,upper(t)), point(20,y,upper(t)),false,.75);
      if (lower(t)>deckZ+1) {
        for (const x of [-20,20]) drawMember(point(x,y,deckZ),point(x,y,lower(t)),false,.8);
      }
    }
  };

  const drawOperaHouse = (structure: CityStructure) => {
    const width = structure.widthM ?? 120;
    const depth = structure.depthM ?? 185;
    const rotation = structure.rotationDeg ?? 0;
    const point = (x: number, y: number, z: number): Vec3 => {
      const [rx, ry] = rotate2d(x, y, rotation);
      return { x: structure.x + rx, y: structure.y + ry, z };
    };

    // Bennelong Point is represented as a tapered podium rather than the old
    // rectangular plinth. This is still original schematic geometry, not a
    // surveyed Opera House mesh.
    const base: Point2[] = [
      [-width * .53, -depth * .50], [width * .53, -depth * .50],
      [width * .49, depth * .30], [width * .38, depth * .50],
      [-width * .38, depth * .50], [-width * .49, depth * .30],
    ];
    prismFaces(base.map(([x,y]) => { const p=point(x,y,0); return [p.x,p.y]; }),0,7,true)
      .sort((a,b) => b.depth - a.depth).forEach(paintSurface);
    if (viewMode === 'plan') return;

    // The previous prototype generated six generic tapered wedges and flipped
    // alternating ones with `reverse`. That made neighbouring sails point in
    // opposite longitudinal directions, which does not reflect Utzon's final
    // spherical solution. The official description says the roof comprises
    // three groups of interlocking vaulted shells, with shell profiles derived
    // from a common sphere and mirrored to complete each arch. The model below
    // therefore uses three groups of paired mirrored ribs. Every shell rises from a broad podium arch into a
    // narrow apex, while height, width, sweep and lateral lean vary between
    // shells. The groups share one longitudinal orientation rather than being
    // alternately reversed.
    type Shell = { x:number; y:number; h:number; w:number; run:number; lean:number; sweep:number; headingDeg:number };
    const shells: Shell[] = [
      // Concert Hall group. These nested shells occupy the western half of the
      // podium and share a northward rise while changing width and lean.
      {x:-27,y:-47,h:structure.heightM-7,w:52,run:48,lean:-9,sweep:7,headingDeg:-4},
      {x:-20,y:-18,h:53,w:46,run:44,lean:7,sweep:5,headingDeg:-2},
      {x:-13,y:9,h:43,w:39,run:39,lean:-5,sweep:3,headingDeg:0},
      // Joan Sutherland Theatre group. It sits beside the Concert Hall group,
      // slightly fanned rather than being a reversed copy.
      {x:24,y:-42,h:50,w:46,run:45,lean:8,sweep:5,headingDeg:4},
      {x:29,y:-13,h:43,w:40,run:40,lean:-6,sweep:3,headingDeg:5},
      {x:33,y:14,h:35,w:34,run:35,lean:5,sweep:2,headingDeg:6},
      // Smaller northern shell group.
      {x:-15,y:52,h:29,w:31,run:30,lean:-4,sweep:1,headingDeg:9},
      {x:18,y:55,h:25,w:28,run:27,lean:4,sweep:1,headingDeg:10},
    ];

    const shellPosition = (shell: Shell, u: number, t: number) => {
      // Each shell is a steep, pointed spherical-inspired arch. The earlier
      // prototype used a horizontal run nearly twice the shell height, which
      // made the roof read as shallow canopies when viewed from the harbour.
      // Here the run is deliberately shorter than the major shell height and
      // the transverse arch strongly lifts the centre ridge. This remains an
      // original schematic approximation, not surveyed roof geometry.
      const rise = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI * .5);
      const halfWidth = shell.w * Math.pow(Math.max(0, 1 - t), .66);
      const side = u * 2 - 1;
      const crossArc = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(side) * .92, 2)));
      const lateralLean = shell.lean * Math.pow(rise, 1.2);
      const localX = side * halfWidth * .5 + lateralLean;
      const localY = (t - .44) * shell.run + shell.sweep * Math.sin(t * Math.PI);
      const [hx, hy] = rotate2d(localX, localY, shell.headingDeg);
      const ridgeZ = 7 + shell.h * Math.pow(rise, .82);
      const edgeDrop = shell.h * .42 * (1 - crossArc) * Math.pow(rise, .9);
      return point(shell.x + hx, shell.y + hy, ridgeZ - edgeDrop);
    };

    shells.forEach((shell,index) => {
      const longSegments = 16;
      const crossSegments = 6;
      for(let a=0;a<longSegments;a++) {
        for(let b=0;b<crossSegments;b++) {
          const t0=a/longSegments,t1=(a+1)/longSegments,u0=b/crossSegments,u1=(b+1)/crossSegments;
          const quad=[shellPosition(shell,u0,t0),shellPosition(shell,u1,t0),shellPosition(shell,u1,t1),shellPosition(shell,u0,t1)];
          const screen=quad.map(project);
          if(screen.some(v=>!v)) continue;
          const depth=screen.reduce((sum,v)=>sum+(v?.depth ?? 0),0)/screen.length;
          paintSurface({corners:quad, depth, width:.5,
            fill:(index+b)%2?'#182329':'#121d23',edge:layers.highlight ? 'rgba(203,218,218,.3)' : CITY_LINE});
        }
      }
      // Mirrored ribs are the most recognisable structural cue from the
      // spherical solution. The centre ridge is slightly brighter.
      for (const u of [0,.167,.333,.5,.667,.833,1]) {
        for (let n=0;n<longSegments;n++) {
          drawMember(shellPosition(shell,u,n/longSegments),shellPosition(shell,u,(n+1)/longSegments),u===.5, u===.5 ? .82 : .58);
        }
      }
      for (const t of [.18,.36,.54,.72,.9]) {
        for (let n=0;n<crossSegments;n++) {
          drawMember(shellPosition(shell,n/crossSegments,t),shellPosition(shell,(n+1)/crossSegments,t),false,.48);
        }
      }
    });
  };

  const drawTower = (structure: CityStructure) => {
    const pod = structure.podHeightM ?? structure.heightM * .84;
    const radius=21;
    const points: Point2[] = Array.from({length:16},(_,i) => {
      const a=i/16*Math.PI*2;
      return [structure.x+Math.cos(a)*radius,structure.y+Math.sin(a)*radius];
    });
    const stem: Point2[] = [[-5,-5],[5,-5],[5,5],[-5,5]].map(([x,y])=>[structure.x+x,structure.y+y]);
    prismFaces(stem,0,pod,true).sort((a,b)=>b.depth-a.depth).forEach(paintSurface);
    prismFaces(points,pod-10,pod+10,true).sort((a,b)=>b.depth-a.depth).forEach(paintSurface);
    drawMember({x:structure.x,y:structure.y,z:pod+10},
      {x:structure.x,y:structure.y,z:structure.heightM},true,1);
  };

  const drawStructure = (structure: CityStructure) => {
    if (structure.type === 'arch-bridge') drawBridge(structure);
    else if (structure.type === 'opera-house') drawOperaHouse(structure);
    else if (structure.type === 'observation-tower') drawTower(structure);
  };

  type BatchedSurface = {
    points: ScreenPoint[];
    fill: string;
    edge: string;
    width: number;
    depth: number;
  };

  const projectSurface = (corners: Vec3[], fill: string, edge: string, width: number): BatchedSurface | null => {
    const clipped = clipNear(corners);
    if (clipped.length < 3) return null;
    const points: ScreenPoint[] = [];
    for (const corner of clipped) {
      const screen = project(corner);
      if (!screen) return null;
      points.push(screen);
    }
    return {
      points,
      fill,
      edge,
      width,
      depth: points.reduce((sum, point) => sum + point.depth, 0) / points.length,
    };
  };

  const drawBuildingsBatched = (nearerThanDepth: number | null = null) => {
    if ((!layerVisible('buildings') && !layerVisible('structures')) || !preparedBuildings.length) return;
    const eye = cameraBasis().eye;
    const bucketSizeM = viewMode === 'plan' ? 1 : 40;
    const buckets = new Map<number, Map<string, { fill:string; edge:string; width:number; layer:CityLayerKey; polygons:ScreenPoint[][] }>>();

    const addSurface = (surface: BatchedSurface | null, layer: CityLayerKey) => {
      if (!surface) return;
      if (nearerThanDepth !== null && surface.depth >= nearerThanDepth) return;
      const bucket = viewMode === 'plan' ? 0 : Math.floor(surface.depth / bucketSizeM);
      const styleKey = `${surface.fill}|${surface.edge}|${surface.width}|${layer}`;
      let styles = buckets.get(bucket);
      if (!styles) {
        styles = new Map();
        buckets.set(bucket, styles);
      }
      let group = styles.get(styleKey);
      if (!group) {
        group = { fill: surface.fill, edge: surface.edge, width: surface.width, layer, polygons: [] };
        styles.set(styleKey, group);
      }
      group.polygons.push(surface.points);
    };

    for (const item of preparedBuildings) {
      if (!sphereVisible(item.centre, item.radiusM, 36)) continue;
      const centreScreen = project(item.centre);
      if (!centreScreen) continue;
      if (nearerThanDepth !== null && centreScreen.depth >= nearerThanDepth + item.radiusM) continue;

      const building = item.building;
      const footprint = building.footprint;
      const baseZ = building.minHeightM ?? 0;
      const roofZ = building.heightM;
      const keyBuilding = landmarkIds.has(building.id);
      if (!layerVisible(keyBuilding ? 'structures' : 'buildings')) continue;
      const landmark = keyBuilding || building.class === 'landmark-massing';
      const edge = keyBuilding && layers.highlight ? CITY_LINE_BRIGHT : CITY_LINE;
      const layer: CityLayerKey = keyBuilding ? 'structures' : 'buildings';

      if (viewMode === 'skyline') {
        footprint.forEach(([x, y], index) => {
          const [nx, ny] = footprint[(index + 1) % footprint.length];
          const mx = (x + nx) / 2;
          const my = (y + ny) / 2;
          const visible = item.winding * ((ny - y) * (eye.x - mx) - (nx - x) * (eye.y - my));
          if (visible <= 0) return;
          const normalLight = Math.abs(nx - x) / (Math.hypot(nx - x, ny - y) || 1);
          const fill = landmark
            ? (normalLight > .55 ? '#152027' : '#111a20')
            : (normalLight > .55 ? '#10191f' : '#0c1419');
          addSurface(projectSurface([
            { x, y, z: baseZ }, { x: nx, y: ny, z: baseZ },
            { x: nx, y: ny, z: roofZ }, { x, y, z: roofZ },
          ], fill, edge, landmark ? .95 : .7), layer);
        });
      }

      addSurface(projectSurface(
        footprint.map(([x, y]) => ({ x, y, z: roofZ })),
        landmark ? '#19242a' : '#152027',
        edge,
        landmark ? 1.05 : .8,
      ), layer);
    }

    const orderedBuckets = [...buckets.keys()].sort((a, b) => b - a);
    context.save();
    for (const bucket of orderedBuckets) {
      const styles = buckets.get(bucket);
      if (!styles) continue;
      for (const group of styles.values()) {
        context.globalAlpha = layers.opacity[group.layer];
        context.beginPath();
        for (const points of group.polygons) {
          if (points.length < 3) continue;
          context.moveTo(points[0].x, points[0].y);
          for (let index = 1; index < points.length; index += 1) context.lineTo(points[index].x, points[index].y);
          context.closePath();
        }
        context.fillStyle = group.fill;
        context.fill();
        context.strokeStyle = group.edge;
        context.lineWidth = group.width;
        context.stroke();
      }
    }
    context.restore();
  };

  const structureDrawables = (excludeGpuTowers = false): Array<{ depth:number; render:() => void }> => {
    if (!city) return [];
    if (!layerVisible('structures')) return [];
    return city.structures.filter(structure => !(excludeGpuTowers && structure.type === 'observation-tower')).map(structure => ({
      depth: project({x:structure.x,y:structure.y,z:structure.heightM/2})?.depth ?? Number.POSITIVE_INFINITY,
      render:() => {
        context.save();
        context.globalAlpha *= layers.opacity.structures;
        drawStructure(structure);
        context.restore();
      },
    }));
  };

  const drawArchitecture = (nearerThanDepth: number | null = null) => {
    drawBuildingsBatched(nearerThanDepth);
    structureDrawables()
      .filter(item => Number.isFinite(item.depth) && (nearerThanDepth === null || item.depth < nearerThanDepth))
      .sort((a,b)=>b.depth-a.depth)
      .forEach(item=>item.render());
  };

  const drawCity = (gpuCity = false) => {
    if (!city) return;
    if (!gpuCity) drawLand();
    // Empty harbour stays empty; the former grid crossed both land and water.
    if (!gpuCity && layerVisible('land') && !city.land?.triangles?.length) {
      context.save();
      context.globalAlpha *= layers.opacity.land;
      if (viewMode === 'plan') drawPlanGrid();
      else drawSkylineGrid();
      context.restore();
    }
    if (gpuCity) {
      // WebGL paints the city in either perspective SKYLINE or orthographic PLAN.
      // Avoid duplicate Canvas building paths and structure silhouettes.
    } else {
      drawRoads();
      drawTransportPoints();
      drawArchitecture();
    }

    if (firstCityRenderMs === null && cityReadyAt > 0) {
      firstCityRenderMs = performance.now() - cityReadyAt;
      cityModeLabel.textContent = city.city.geometryMode === 'procedural-calibration'
        ? `SYDNEY / CALIBRATION · ${city.profile.roadCount ?? 0} STREETS`
        : `${activeCityPreview ? 'GREATER SYDNEY TEST' : 'SYDNEY'} / OVERTURE ${city.profile.buildingCount} BUILDINGS · ${city.profile.roadCount ?? 0} STREETS`;
    }
  };

  const drawFireworkOccluders = () => {
    if (!city || viewMode !== 'skyline') return;
    const site = launchSite();
    const fireworkDepth = project({ x: site.x, y: site.y, z: state.heightM })?.depth;
    if (fireworkDepth && Number.isFinite(fireworkDepth)) drawArchitecture(fireworkDepth);
  };

  const gravityMultiplier = () => {
    const defaults = state.preset.renderDefaults;
    return defaults.gravityScale * (0.78 + defaults.droopScale * 0.42);
  };

  const particlePosition = (particle: ParticleSeed, timeS: number): Vec3 => {
    const defaults = state.preset.renderDefaults;
    const radius = radialDisplacement(timeS, defaults.durationS, state.spreadM / 2, defaults, expansionAnchorMps) * particle.radialScale;
    const gravityDrop = 0.5 * GRAVITY * gravityMultiplier() * timeS * timeS;
    const origin = launchSite();
    return {
      x: origin.x + particle.dx * radius,
      y: origin.y + particle.depth * radius,
      z: origin.z + state.heightM + particle.dy * radius - gravityDrop,
    };
  };

  const particleColour = (particle: ParticleSeed, timeS: number) => {
    const colours = state.preset.tipColours.length ? state.preset.tipColours : [state.primaryColourId];
    let colourId = particle.colourIndex === 0 ? state.primaryColourId : colours[particle.colourIndex % colours.length];
    if (state.preset.colourPattern === 'transition' && colours.length > 1) {
      const split = state.preset.renderDefaults.splitAt ?? 0.5;
      colourId = timeS / state.preset.renderDefaults.durationS >= split ? colours[1] : state.primaryColourId;
    }
    return colourHex(colourId);
  };

  const drawPoint = (screenX: number, screenY: number, colour: string, alpha: number, size: number) => {
    context.globalAlpha = alpha * 0.18;
    context.fillStyle = colour;
    context.beginPath();
    context.arc(screenX, screenY, size * 2.7, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = alpha;
    context.beginPath();
    context.arc(screenX, screenY, size, 0, Math.PI * 2);
    context.fill();
  };

  const drawTrail = (particle: ParticleSeed, timeS: number, colour: string) => {
    const defaults = state.preset.renderDefaults;
    if (defaults.trailLifetimeS <= 0 || defaults.trailWidth <= 0 || timeS <= 0) return;
    const trailDuration = Math.min(defaults.trailLifetimeS, timeS);
    const samples = clamp(Math.round(8 + defaults.trailLifetimeS * 4), 8, 20);
    const start = Math.max(0, timeS - trailDuration);
    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = lerp(0.55, 1.75, clamp(defaults.trailWidth, 0, 1.2) / 1.2);
    context.strokeStyle = colour;
    for (let sample = 0; sample < samples - 1; sample += 1) {
      const a = sample / (samples - 1);
      const b = (sample + 1) / (samples - 1);
      const pa = project(particlePosition(particle, lerp(start, timeS, a)));
      const pb = project(particlePosition(particle, lerp(start, timeS, b)));
      if (!pa || !pb) continue;
      context.globalAlpha = Math.pow(b, 1.8) * 0.52 * particle.brightness;
      context.beginPath();
      context.moveTo(pa.x, pa.y);
      context.lineTo(pb.x, pb.y);
      context.stroke();
    }
    context.restore();
  };

  const drawStandardBurst = (timeS: number) => {
    const defaults = state.preset.renderDefaults;
    const life = clamp(timeS / defaults.durationS, 0, 1);
    const fade = 1 - Math.pow(life, 2.25);
    const trailColour = colourHex(state.preset.trailColour, colourHex(state.primaryColourId));
    context.save();
    context.globalCompositeOperation = 'lighter';
    seeds.forEach((particle) => {
      if (state.family.id !== 'peony') drawTrail(particle, timeS, trailColour);
      const screen = project(particlePosition(particle, timeS));
      if (!screen) return;
      const colour = particleColour(particle, timeS);
      const strobe = defaults.strobeHz > 0
        ? (Math.sin(timeS * Math.PI * 2 * defaults.strobeHz + particle.phase) > -0.15 ? 1 : 0.14)
        : 1;
      const depthAlpha = lerp(0.58, 1, (particle.depth + 1) / 2);
      const alpha = clamp(fade * particle.brightness * depthAlpha * strobe, 0, 1);
      const perspectiveScale = viewMode === 'skyline' ? clamp(1450 / screen.depth, 0.55, 1.55) : 1;
      const size = lerp(0.8, 1.65, (particle.depth + 1) / 2) * perspectiveScale;
      drawPoint(screen.x, screen.y, colour, alpha, size);
    });
    context.restore();
  };

  const drawCrossette = (timeS: number) => {
    const defaults = state.preset.renderDefaults;
    const splitAt = (defaults.splitAt ?? 0.52) * defaults.durationS;
    const parentTime = Math.min(timeS, splitAt);
    const parentFade = clamp(1 - parentTime / Math.max(splitAt, 0.01) * 0.4, 0.45, 1);
    const primary = colourHex(state.primaryColourId);
    const secondary = colourHex(state.preset.tipColours[1] ?? 'yellow');
    context.save();
    context.globalCompositeOperation = 'lighter';

    seeds.forEach((particle) => {
      if (timeS <= splitAt) {
        const screen = project(particlePosition(particle, parentTime));
        if (screen) drawPoint(screen.x, screen.y, primary, parentFade * particle.brightness, 1.05);
        return;
      }
      const splitPosition = particlePosition(particle, splitAt);
      const splitScreen = project(splitPosition);
      const childTime = timeS - splitAt;
      const childDuration = Math.max(0.35, defaults.durationS - splitAt);
      const childLife = clamp(childTime / childDuration, 0, 1);
      const childRadius = state.spreadM * 0.13 * easeOutCubic(childLife);
      const inheritedDirection = Math.atan2(particle.dy, particle.dx);
      const gravityDrop = 0.5 * GRAVITY * 0.8 * childTime * childTime;

      for (let child = 0; child < 4; child += 1) {
        const angle = inheritedDirection + Math.PI * 0.25 + child * Math.PI * 0.5;
        const jitter = (particle.phase / (Math.PI * 2) - 0.5) * 0.11;
        const direction = angle + jitter;
        const point: Vec3 = {
          x: splitPosition.x + Math.cos(direction) * childRadius,
          y: splitPosition.y + Math.sin(direction + particle.phase) * childRadius * 0.28,
          z: splitPosition.z + Math.sin(direction) * childRadius - gravityDrop,
        };
        const tailLife = Math.max(0, childLife - 0.28);
        const tailRadius = state.spreadM * 0.13 * easeOutCubic(tailLife);
        const tail: Vec3 = {
          x: splitPosition.x + Math.cos(direction) * tailRadius,
          y: splitPosition.y + Math.sin(direction + particle.phase) * tailRadius * 0.28,
          z: splitPosition.z + Math.sin(direction) * tailRadius - 0.5 * GRAVITY * 0.8 * Math.max(0, childTime - childDuration * 0.28) ** 2,
        };
        const screen = project(point);
        const tailScreen = project(tail);
        if (!screen || !tailScreen) continue;
        const alpha = (1 - Math.pow(childLife, 2.1)) * particle.brightness;
        context.save();
        context.globalAlpha = alpha * 0.42;
        context.strokeStyle = secondary;
        context.lineWidth = 0.7;
        context.beginPath();
        context.moveTo(tailScreen.x, tailScreen.y);
        context.lineTo(screen.x, screen.y);
        context.stroke();
        context.restore();
        if (splitScreen && childTime < 0.12) drawPoint(splitScreen.x, splitScreen.y, '#fff4d2', (0.12 - childTime) / 0.12, 1.5);
        drawPoint(screen.x, screen.y, secondary, alpha, 0.95);
      }
    });
    context.restore();
  };

  const drawBurstFlash = (timeS: number) => {
    if (timeS > 0.14) return;
    const origin = launchSite();
    const centre = project({ x: origin.x, y: origin.y, z: origin.z + state.heightM });
    if (!centre) return;
    const intensity = 1 - timeS / 0.14;
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.fillStyle = `rgba(255,244,211,${0.1 * intensity})`;
    context.beginPath();
    context.arc(centre.x, centre.y, lerp(22, 3, 1 - intensity), 0, Math.PI * 2);
    context.fill();
    context.fillStyle = `rgba(255,255,247,${0.82 * intensity})`;
    context.beginPath();
    context.arc(centre.x, centre.y, lerp(5, 1.5, 1 - intensity), 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const drawLaunch = (elapsedS: number, liftTimeS: number) => {
    const progress = clamp(elapsedS / liftTimeS, 0, 1);
    const origin = launchSite();
    const position = (p: number): Vec3 => ({
      x: origin.x + Math.sin(p * Math.PI * 3) * 0.55 * (1 - p),
      y: origin.y,
      z: origin.z + state.heightM * (2 * p - p * p),
    });
    const screen = project(position(progress));
    if (!screen) return;
    const trailSamples = viewport.width < MOBILE_BREAKPOINT ? 10 : 16;
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.strokeStyle = 'rgba(238,212,158,.58)';
    context.lineWidth = 1;
    context.lineCap = 'round';
    context.beginPath();
    let hasPoint = false;
    for (let index = 0; index < trailSamples; index += 1) {
      const sampleProgress = clamp(progress - index * 0.014, 0, 1);
      const point = project(position(sampleProgress));
      if (!point) continue;
      if (!hasPoint) {
        context.moveTo(point.x, point.y);
        hasPoint = true;
      } else context.lineTo(point.x, point.y);
    }
    if (hasPoint) context.stroke();
    drawPoint(screen.x, screen.y, '#ffe6a8', 1, 1.35);
    context.restore();
  };

  const drawLaunchMarker = () => {
    if (!city) return;
    const site = launchSite();
    const point = project(site);
    if (!point) return;
    context.save();
    context.strokeStyle = 'rgba(240,213,148,.36)';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.moveTo(point.x - 8, point.y);
    context.lineTo(point.x + 8, point.y);
    context.moveTo(point.x, point.y - 8);
    context.lineTo(point.x, point.y + 8);
    context.stroke();
    context.restore();
  };

  const drawStaticReducedMotion = () => {
    const defaults = state.preset.renderDefaults;
    const previewTime = state.family.id === 'crossette' ? defaults.durationS * 0.76 : defaults.durationS * 0.64;
    drawBurstFlash(0.1);
    if (state.family.id === 'crossette') drawCrossette(previewTime);
    else drawStandardBurst(previewTime);
  };

  // Hover and selection are independent: hovering another landmark must
  // not deselect the current camera focus. CSS colours animate on the labels,
  // while the tiny per-landmark GPU accent buffers fade by strength.
  const syncLandmarkState = () => {
    for (const [id, label] of keyLabelNodes) {
      label.dataset.selected = String(id === selectedLandmarkId);
      label.dataset.hovered = String(id === hoveredLandmarkId);
      label.querySelector<HTMLButtonElement>('[data-landmark-name]')?.setAttribute('aria-pressed', String(id === selectedLandmarkId));
    }
    landmarkList?.querySelectorAll<HTMLButtonElement>('button[data-landmark-id]').forEach(button => {
      const id = button.dataset.landmarkId;
      button.dataset.selected = String(id === selectedLandmarkId);
      button.dataset.hovered = String(id === hoveredLandmarkId);
      if (id === selectedLandmarkId) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    cityDirty = true;
  };
  const clearSelectedLandmark = () => {
    if (selectedLandmarkId === null) return;
    selectedLandmarkId = null;
    syncLandmarkState();
  };
  const hoverLandmark = (id: string | null) => {
    if (hoveredLandmarkId === id) return;
    hoveredLandmarkId = id;
    syncLandmarkState();
  };
  const animateLandmarkAccents = (deltaS: number) => {
    let changing = false;
    const ids = new Set([...landmarkAccentWeights.keys(), ...(selectedLandmarkId ? [selectedLandmarkId] : []),
      ...(hoveredLandmarkId ? [hoveredLandmarkId] : [])]);
    for (const id of ids) {
      const type = accentTypeForLandmark(id, selectedLandmarkId, hoveredLandmarkId);
      const enabled = layers.highlight && layerVisible('structures');
      const existing = landmarkAccentWeights.get(id) ?? { hover: 0, selected: 0 };
      // Independent channels cross-fade pale hover to dark selected when a
      // hovered flag is clicked instead of changing GPU colour abruptly.
      const next = {
        hover: smoothAccentStrength(existing.hover, enabled && type === 'hover' ? 1 : 0, deltaS, reducedMotion),
        selected: smoothAccentStrength(existing.selected, enabled && type === 'selected' ? 1 : 0, deltaS, reducedMotion),
      };
      if (Math.abs(next.hover - existing.hover) > .001 || Math.abs(next.selected - existing.selected) > .001) changing = true;
      if (next.hover <= .008 && next.selected <= .008 && type === null) {
        if (landmarkAccentWeights.has(id)) changing = true;
        landmarkAccentWeights.delete(id);
      } else landmarkAccentWeights.set(id, next);
    }
    if (changing) {
      layers.landmarkAccents = [...landmarkAccentWeights].flatMap(([id, value]) => {
        const memberIds = landmarks.find(item => item.id === id)?.memberIds ?? [id];
        return memberIds.flatMap(memberId => [
          { id: memberId, type: 'hover' as const, strength: value.hover },
          { id: memberId, type: 'selected' as const, strength: value.selected },
        ].filter(item => item.strength > .004));
      });
      cityDirty = true;
    }
  };

  // Labels use the same centre and height as their sourced geometry.
  const updateKeyLabels = () => {
    if (!city || !keyLabelsRoot) return;
    const visible = layers.highlight && layerVisible('structures');
    const occupied: Array<{ x: number; y: number }> = [];
    const ordered = [...landmarks].sort((a, b) =>
      Number(b.id === selectedLandmarkId) - Number(a.id === selectedLandmarkId) ||
      Number(b.id === hoveredLandmarkId) - Number(a.id === hoveredLandmarkId));
    for (const item of ordered) {
      const label = keyLabelNodes.get(item.id);
      if (!label) continue;
      const anchor = visible ? project({ ...item.centre, z: item.centre.z + item.heightM * .5 + 8 }) : null;
      if (!anchor || anchor.x < 60 || anchor.x > viewport.width - 60 ||
          anchor.y < 50 || anchor.y > viewport.height - 75) {
        if (!label.hidden) label.hidden = true;
        continue;
      }
      // Keep hovered and selected labels visible even near other CBD flags.
      const prioritised = item.id === selectedLandmarkId || item.id === hoveredLandmarkId;
      const nearby = occupied.some(p => Math.abs(p.x - anchor.x) < 126 && Math.abs(p.y - anchor.y) < 59);
      if (nearby && !prioritised) {
        if (!label.hidden) label.hidden = true;
        continue;
      }
      occupied.push({ x: anchor.x, y: anchor.y });
      if (label.hidden) label.hidden = false;
      label.style.left = `${anchor.x}px`;
      label.style.top = `${anchor.y}px`;
      label.style.opacity = String(layers.opacity.structures);
    }
  };

  const fireworkDrawer = setupEdgeDrawer({
    viewport: root, drawer: controlsDrawer, tab: drawerToggle, panel: controlsForm,
    edge: 'left', initiallyOpen: true, initialTopFraction: .64,
    name: 'firework controls', reducedMotion: () => reducedMotion,
  });
  const keyBuildingDrawer = landmarkDrawer && landmarkToggle && landmarkPanel
    ? setupEdgeDrawer({
      viewport: root, drawer: landmarkDrawer, tab: landmarkToggle, panel: landmarkPanel,
      edge: 'right', initiallyOpen: false, initialTopFraction: .32,
      name: 'key buildings', reducedMotion: () => reducedMotion,
    }) : null;
  const setLandmarkDrawerOpen = (open: boolean) => keyBuildingDrawer?.setOpen(open);

  let landmarkSort: LandmarkSort = 'abc';
  let landmarkGroupByType = true;
  const renderLandmarkList = () => {
    if (!landmarkList) return;
    landmarkList.replaceChildren();
    let previousCategory: Landmark['category'] | null = null;
    for (const landmark of sortedLandmarkList(landmarks, landmarkSort, landmarkGroupByType)) {
      if (landmarkGroupByType && previousCategory !== landmark.category) {
        const heading = document.createElement('p');
        heading.className = 'fireworks-simulator__landmark-category';
        heading.textContent = landmark.category;
        landmarkList.append(heading);
        previousCategory = landmark.category;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.landmarkId = landmark.id;
      button.title = `Focus camera on ${landmark.name}`;
      const name = document.createElement('span');
      name.textContent = landmark.name;
      const height = document.createElement('small');
      height.textContent = landmarkHeightLabel(landmark);
      height.title = landmark.heightComparable ? 'Source height' : 'Estimated or fallback height';
      button.append(name, height);
      button.addEventListener('pointerenter', () => hoverLandmark(landmark.id));
      button.addEventListener('pointerleave', () => { if (hoveredLandmarkId === landmark.id) hoverLandmark(null); });
      button.addEventListener('focus', () => hoverLandmark(landmark.id));
      button.addEventListener('blur', () => { if (hoveredLandmarkId === landmark.id) hoverLandmark(null); });
      button.addEventListener('click', () => focusLandmark(landmark));
      landmarkList.append(button);
    }
    landmarkSortButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.landmarkSort === landmarkSort)));
    if (landmarkGroupInput) landmarkGroupInput.checked = landmarkGroupByType;
    syncLandmarkState();
  };
  landmarkSortButtons.forEach(button => button.addEventListener('click', () => {
    landmarkSort = button.dataset.landmarkSort === 'height' ? 'height' : 'abc';
    renderLandmarkList();
    if (selectedLandmarkId) scrollToSelectedLandmark(selectedLandmarkId);
  }));
  landmarkGroupInput?.addEventListener('change', () => {
    landmarkGroupByType = landmarkGroupInput.checked;
    renderLandmarkList();
    if (selectedLandmarkId) scrollToSelectedLandmark(selectedLandmarkId);
  });

  // The landmark flight/orbit is cinematic only. On direct viewport input,
  // manual rotation uses the map plane, never the landmark or virtual target.
  const restoreManualNavigation = () => {
    if (!landmarkFlight && !landmarkOrbit) return;
    landmarkFlight = null;
    landmarkOrbit = null;
    manualRotationPivot = null;
    camera.target = normalisedManualTarget(camera.eye, camera.target);
    cameraBasisCache = null;
    cityDirty = true;
  };
  landmarkOrbitInput?.addEventListener('change', () => {
    orbitEnabled = landmarkOrbitInput.checked;
    try { window.localStorage.setItem(orbitPreferenceKey, String(orbitEnabled)); } catch { /* Optional setting. */ }
    if (!orbitEnabled && landmarkOrbit) restoreManualNavigation();
  });
  const scrollToSelectedLandmark = (id: string) => {
    const button = Array.from(landmarkList?.querySelectorAll<HTMLButtonElement>('button[data-landmark-id]') ?? [])
      .find(item => item.dataset.landmarkId === id);
    button?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
  };
  const focusLandmark = (landmark: Landmark) => {
    landmarkFlight = null;
    landmarkOrbit = null;
    manualRotationPivot = null;
    selectedLandmarkId = landmark.id;
    syncLandmarkState();
    setLandmarkDrawerOpen(true);
    scrollToSelectedLandmark(landmark.id);
    const extent = Math.max(landmark.widthM, landmark.depthM, landmark.heightM * 1.15, 65);
    if (viewMode === 'plan') {
      const bounds = city?.bounds;
      if (!bounds) return;
      plan.x = landmark.centre.x - (bounds.minX + bounds.maxX) / 2;
      plan.y = landmark.centre.y - (bounds.minY + bounds.maxY) / 2;
      planZoomTarget = clamp(Math.min(viewport.width, viewport.height) * .52 / (viewport.planScale * extent), .15, 35);
      plan.zoom = planZoomTarget;
    } else {
      const centre = landmark.centre;
      // Fit the entire landmark into the middle half of the viewport.
      const distance = clamp(extent * skylineFocalPx / (viewport.height * .58), 120, 6000);
      const offsetZ = Math.max(28, Math.min(180, extent * .28));
      const target = { ...centre };
      // Sample eight ground-level sightlines; score intervening tall footprints.
      let best = { penalty: Infinity, eye: { x: centre.x + distance, y: centre.y, z: centre.z + offsetZ } };
      for (let i = 0; i < 12; i++) {
        const azimuth = i * Math.PI / 6;
        const eye = { x: centre.x + Math.cos(azimuth) * distance,
          y: centre.y + Math.sin(azimuth) * distance, z: centre.z + offsetZ };
        let penalty = 0;
        for (const building of preparedBuildings) {
          const dx = building.centre.x - eye.x, dy = building.centre.y - eye.y;
          const vx = centre.x - eye.x, vy = centre.y - eye.y;
          const t = (dx * vx + dy * vy) / (distance * distance);
          if (t <= .035 || t >= .97) continue;
          const cross = Math.hypot(dx - vx * t, dy - vy * t);
          if (cross < building.radiusM + extent * .07) {
            const rayHeight = eye.z + t * (centre.z - eye.z);
            if (building.building.heightM > rayHeight + extent * .08) penalty += 1 + (1 - t) * 2;
          }
        }
        // Prefer a familiar harbour-side angle when views are equally clear.
        penalty += i * .015;
        if (penalty < best.penalty) best = { penalty, eye };
      }
      best.eye.z = Math.max(GROUND_CLEARANCE_M, best.eye.z);
      landmarkFlight = {
        start: { eye: { ...camera.eye }, target: { ...camera.target }, rollRad: camera.rollRad },
        end: { eye: best.eye, target, rollRad: 0 }, elapsed: 0, duration: reducedMotion ? 0 : .8, centre: { ...target },
      };
      skylineDollyRemaining = { x: 0, y: 0, z: 0 };
      heightAnimationTargetZ = null;
      heightSelectionTargetZ = null;
    }
    hasMovedCamera = true;
    cityDirty = true;
    status.textContent = `Viewing ${landmark.name}.`;
  };

  const restoreNavigationAfterFocus = () => {
    // The flight itself is over; the default controls need a distant, stable pivot.
    camera.target = normalisedManualTarget(camera.eye, camera.target);
    manualRotationPivot = null;
    cameraBasisCache = null;
    cityDirty = true;
  };

  const draw = (now: number) => {
    const deltaS = clamp((now - lastAnimationTime) / 1000, 0, .05);
    lastAnimationTime = now;
    if (landmarkFlight) {
      landmarkFlight.elapsed += deltaS;
      const t = landmarkFlight.duration ? Math.min(1, landmarkFlight.elapsed / landmarkFlight.duration) : 1;
      const k = t * t * (3 - 2 * t);
      const start = landmarkFlight.start, end = landmarkFlight.end;
      camera.eye = { x: lerp(start.eye.x, end.eye.x, k), y: lerp(start.eye.y, end.eye.y, k), z: lerp(start.eye.z, end.eye.z, k) };
      camera.target = { x: lerp(start.target.x, end.target.x, k), y: lerp(start.target.y, end.target.y, k), z: lerp(start.target.z, end.target.z, k) };
      camera.rollRad = lerp(start.rollRad, end.rollRad, k);
      constrainSkylineGround();
      cameraBasisCache = null;
      cityDirty = true;
      if (t >= 1) {
        const centre = { ...landmarkFlight.centre };
        landmarkFlight = null;
        if (orbitEnabled && !reducedMotion && viewMode === 'skyline') {
          const offset = subtract(camera.eye, centre);
          landmarkOrbit = {
            centre, radius: Math.hypot(offset.x, offset.y),
            azimuth: Math.atan2(offset.y, offset.x), elevation: offset.z,
          };
        } else restoreNavigationAfterFocus();
      }
    }
    if (landmarkOrbit && viewMode === 'skyline') {
      // A slow cinematic orbit runs only when no user controls the viewport.
      landmarkOrbit.azimuth += deltaS * .065;
      const { centre, radius, azimuth, elevation } = landmarkOrbit;
      camera.eye = orbitCameraEye(centre, radius, azimuth, elevation);
      camera.target = { ...centre };
      constrainSkylineGround();
      cameraBasisCache = null;
      cityDirty = true;
    }
    applyKeyboardNavigation(deltaS);
    applyCameraSmoothing(deltaS);
    syncCurveCurrent();
    animateLandmarkAccents(deltaS);
    // Keep the controller dim through eased travel, then restore it shortly
    // after the final camera input, without scheduling timers every frame.
    const stillMoving = pressedNavigationKeys.size > 0 || heightSelectionTargetZ !== null ||
      heightAnimationTargetZ !== null || vectorLength(skylineDollyRemaining) > .02 ||
      (viewMode === 'plan' && Math.abs(planZoomTarget - plan.zoom) > .0005) ||
      landmarkFlight !== null || now - lastCameraMotionAt < 190;
    root.classList.toggle('is-camera-moving', stillMoving);
    const stillZooming = now - lastZoomInputAt < 420 ||
      (viewMode === 'skyline' && vectorLength(skylineDollyRemaining) > .02) ||
      (viewMode === 'plan' && Math.abs(planZoomTarget - plan.zoom) > .0005);
    root.classList.toggle('is-zooming', stillZooming);
    drawNightSky(now);
    context = mainContext;
    context.clearRect(0, 0, viewport.width, viewport.height);
    const gpuCity = Boolean(webglCity && cityWebglCanvas);
    const gpuSkyline = gpuCity && viewMode === 'skyline';
    if (city && cityContext) {
      if (cityDirty) {
        if (cityWebglCanvas) cityWebglCanvas.style.display = gpuCity ? 'block' : 'none';
        if (gpuSkyline && webglCity) {
          webglCity.renderSkyline(camera, {
            width: viewport.width,
            height: viewport.height,
            dpr: viewport.dpr,
            skylineHorizonY: viewport.skylineHorizonY,
            skylineScreenX: viewport.skylineScreenX,
            skylineFocalPx,
          }, layers);
        } else if (gpuCity && webglCity && viewMode === 'plan') {
          webglCity.renderPlan(camera, {
            width: viewport.width, height: viewport.height, dpr: viewport.dpr,
            skylineScreenX: viewport.planScreenX, skylineHorizonY: viewport.planScreenY,
            skylineFocalPx,
          }, {
            centreX: viewport.planCentreX + plan.x,
            centreY: viewport.planCentreY + plan.y,
            rotationRad: plan.rotationRad,
            scale: viewport.planScale * plan.zoom,
          }, layers);
        }
        if (gpuCity) {
          // GPU buffers are retained across gestures; avoid reallocating a
          // device-pixel-ratio-sized Canvas backing store every pan frame.
          context = cityContext;
          drawCity(true);
        } else {
          cityCanvas.width = canvas.width;
          cityCanvas.height = canvas.height;
          cityContext.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
          context = cityContext;
          context.clearRect(0, 0, viewport.width, viewport.height);
          drawCity(false);
          drawCityEdgeFade();
        }
        context = mainContext;
        cityDirty = false;
        occlusionDirty = true;
      }
      if (!gpuCity) context.drawImage(cityCanvas, 0, 0, viewport.width, viewport.height);
    } else drawCity();
    drawLaunchMarker();
    updateKeyLabels();

    if (reducedMotion) {
      drawStaticReducedMotion();
    } else {
      const elapsedS = Math.max(0, (now - launchStart) / 1000);
      const liftTimeS = prototypeLiftTime(state.heightM);
      if (elapsedS < liftTimeS) drawLaunch(elapsedS, liftTimeS);
      else {
        const burstTime = elapsedS - liftTimeS;
        drawBurstFlash(burstTime);
        if (burstTime <= state.preset.renderDefaults.durationS) {
          if (state.family.id === 'crossette') drawCrossette(burstTime);
          else drawStandardBurst(burstTime);
        } else if (burstTime > state.preset.renderDefaults.durationS + AUTO_REPLAY_DELAY_S) {
          launchStart = now + 120;
        }
      }
    }

    // The SKYLINE WebGL city sits above the fireworks Canvas to hide sparks
    // behind structures without another building pass. This is layer-based
    // occlusion, not exact per-particle 3D depth. The no-WebGL fallback keeps
    // its lightweight approximate foreground Canvas pass.
    if (city && occlusionContext && !gpuCity) {
      if (occlusionDirty && now >= occlusionDeferUntil) {
        occlusionCanvas.width = canvas.width;
        occlusionCanvas.height = canvas.height;
        occlusionContext.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
        context = occlusionContext;
        context.clearRect(0, 0, viewport.width, viewport.height);
        drawFireworkOccluders();
        drawCityEdgeFade();
        context = mainContext;
        occlusionDirty = false;
      }
      if (viewMode === 'skyline' && !occlusionDirty) context.drawImage(occlusionCanvas, 0, 0, viewport.width, viewport.height);
    }

    fpsFrames += 1;
    if (now - fpsWindowStart >= 1000) {
      fpsLabel.textContent = `FPS ${Math.round((fpsFrames * 1000) / (now - fpsWindowStart))}`;
      fpsFrames = 0;
      fpsWindowStart = now;
    }
    animationFrame = window.requestAnimationFrame(draw);
  };

  const syncControls = () => {
    presetSelect.value = state.preset.id;
    calibreSelect.value = String(state.calibreMm);
    colourSelect.value = state.primaryColourId;
    heightInput.value = String(Math.round(state.heightM));
    spreadInput.value = String(Math.round(state.spreadM));
    heightOutput.value = `${Math.round(state.heightM)} M`;
    spreadOutput.value = `${Math.round(state.spreadM)} M`;
    effectLabel.textContent = displayEffectName().toUpperCase();
    customState.textContent = state.custom ? 'CUSTOM SETTINGS' : 'RESEARCH PRESET';
    readoutCalibre.textContent = `${state.calibreMm} MM SHELL`;
    readoutHeight.textContent = `${Math.round(state.heightM)} M HEIGHT`;
    readoutSpread.textContent = `${Math.round(state.spreadM)} M SPREAD`;
    readoutDuration.textContent = `${state.preset.renderDefaults.durationS.toFixed(1)} S EFFECT`;
  };

  const syncHeightIndicator = () => {
    if (viewMode !== 'skyline') {
      scaleTop.textContent = '2 KM';
      root.classList.remove('is-height-comparing');
      heightCue.style.top = '';
      heightScale.classList.remove('is-height-targeting', 'is-height-selecting');
      heightCue.classList.remove('is-active');
      return;
    }

    const comparing = heightSelectionTargetZ !== null || heightAnimationTargetZ !== null;
    root.classList.toggle('is-height-comparing', comparing);
    // On narrow screens the idle ruler is hidden. Its layout height becomes
    // measurable only once the comparison temporarily makes it visible.
    if (comparing) heightTrackHeightPx = Math.max(1, heightTrack.clientHeight);
    const indicatorZ = heightSelectionTargetZ ?? heightAnimationTargetZ ?? camera.eye.z;
    heightScaleMaxM = comparisonScaleMaxM(indicatorZ, city?.bounds.maxZ ?? 0, camera.eye.z, comparing);
    scaleTop.textContent = `${Math.round(heightScaleMaxM)} M`;
    const ratio = clamp(indicatorZ / heightScaleMaxM, 0, 1);
    // Track on compositor-friendly transforms, rather than layout-changing
    // `top`. Camera orbit updates continuously throughout right/dual drag;
    // short transform transitions visibly follow those updates even during
    // expensive city frames, instead of snapping at the end of a gesture.
    heightNode.style.setProperty('--height-node-offset', `${((1 - ratio) * heightTrackHeightPx).toFixed(2)}px`);
    heightGhost.style.setProperty('--height-node-offset', `${((1 - clamp(camera.eye.z / heightScaleMaxM, 0, 1)) * heightTrackHeightPx).toFixed(2)}px`);
    const gap = Math.abs(indicatorZ - camera.eye.z);
    // At the ghost the target has exactly the same 7px radius; 150 m away
    // it reaches 3x. It contracts on the return trip as the ghost catches up.
    heightScale.style.setProperty('--target-node-scale', String((1 + 2 * clamp(gap / 150, 0, 1)).toFixed(3)));
    const selecting = heightSelectionTargetZ !== null;
    heightScale.classList.toggle('is-height-targeting', selecting || heightAnimationTargetZ !== null);
    heightScale.classList.toggle('is-height-selecting', selecting);
    heightCue.classList.toggle('is-active', comparing);
    if (heightCueValue) heightCueValue.textContent = `${Math.round(indicatorZ).toLocaleString('en-AU')} M`;
    if (comparing) {
      syncHeightComparison(indicatorZ, heightScaleMaxM);
      // Arrows travel with the height node, rather than remaining stranded
      // at the screen centre when the target moves up/down.
      const trackRect = heightTrack.getBoundingClientRect();
      heightCue.style.top = `${(trackRect.top - root.getBoundingClientRect().top + (1 - ratio) * heightTrackHeightPx).toFixed(1)}px`;
    } else heightCue.style.top = '';
    const differenceM = comparing ? indicatorZ - camera.eye.z : 0;
    const cueDirection = Math.abs(differenceM) <= 3 ? 'level' : differenceM > 0 ? 'above' : 'below';
    heightCue.dataset.direction = cueDirection;
    // Increasing separation raises the relevant arrow's opacity, without
    // making either inactive arrow or the centre marker disappear entirely.
    heightCue.style.setProperty('--cue-opacity', String((.38 + .62 * clamp(Math.abs(differenceM) / 300, 0, 1)).toFixed(3)));
  };


  const cardinalLabel = (headingDeg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round((((headingDeg % 360) + 360) % 360) / 22.5) % directions.length];
  };

  const syncOrientationHud = () => {
    if (!cameraHeading || !cameraElevation || !cameraCompass) return;
    if (viewMode === 'plan') {
      cameraHeading.textContent = 'VIEW / PLAN NORTH-UP';
      cameraElevation.textContent = `ZOOM / ${plan.zoom.toFixed(1)}X`;
      cameraCompass.style.setProperty('--compass-heading', '0');
      cameraCompass.style.setProperty('--compass-tilt', '0deg');
      return;
    }
    const { forward } = cameraBasis();
    const headingDeg = (Math.atan2(forward.x, forward.y) * 180 / Math.PI + 360) % 360;
    const elevationDeg = Math.asin(clamp(forward.z, -1, 1)) * 180 / Math.PI;
    cameraHeading.textContent = `VIEW / ${cardinalLabel(headingDeg)} ${Math.round(headingDeg).toString().padStart(3, '0')}°`;
    cameraElevation.textContent = `ALT / ${elevationDeg >= 0 ? '+' : ''}${Math.round(elevationDeg)}°`;
    const tiltDeg = 80 * (1 - clamp(Math.abs(elevationDeg) / 90, 0, 1));
    cameraCompass.style.setProperty('--compass-heading', headingDeg.toFixed(2));
    cameraCompass.style.setProperty('--compass-tilt', `${tiltDeg.toFixed(2)}deg`);
  };

  const syncCameraReadout = () => {
    if (viewMode === 'plan') {
      cameraReadout.textContent = `PLAN X ${Math.round(viewport.planCentreX + plan.x)}  Y ${Math.round(viewport.planCentreY + plan.y)}  ZOOM ${plan.zoom.toFixed(1)}X`;
    } else {
      const { eye } = camera;
      cameraReadout.textContent = `POV X ${Math.round(eye.x)}  Y ${Math.round(eye.y)}  Z ${Math.round(eye.z)} M`;
    }
    syncHeightIndicator();
    syncOrientationHud();
    // Copyable context follows the actual camera, not an old snapshot.
    if (viewOptions?.open && navigationConfig) navigationConfig.value = calibrationLine();
    syncCurveCurrent();
  };

  const markCameraChanged = () => {
    hasMovedCamera = true;
    noteCameraMotion();
    cameraBasisCache = null;
    cityDirty = true;
    occlusionDirty = true;
    // Do not rebuild the foreground occlusion bitmap while the user is
    // continuously moving the camera. The main city still follows every
    // frame; the exact firework/building mask is regenerated shortly after
    // input settles. This removes a second full architecture pass from camera
    // interaction without dropping any city geometry from the final frame.
    occlusionDeferUntil = performance.now() + 110;
    syncCameraReadout();
  };

  const cameraDistance = () => {
    const offset = subtract(camera.eye, camera.target);
    return Math.max(0.001, Math.hypot(offset.x, offset.y, offset.z));
  };

  const skylineScreenRay = (clientX: number, clientY: number, rect = stageInteraction.getBoundingClientRect()): Vec3 => {
    const localX = (clientX - rect.left) * (viewport.width / Math.max(1, rect.width));
    const localY = (clientY - rect.top) * (viewport.height / Math.max(1, rect.height));
    // The ray and the temporary zoom marker share one projection aim origin.
    const aim = zoomAimScreenPoint('skyline', viewport);
    const horizontal = (localX - aim.x) / Math.max(1, skylineFocalPx);
    const vertical = (aim.y - localY) / Math.max(1, skylineFocalPx);
    const { forward, right, up } = cameraBasis();
    return normalise({
      x: forward.x + right.x * horizontal + up.x * vertical,
      y: forward.y + right.y * horizontal + up.y * vertical,
      z: forward.z + right.z * horizontal + up.z * vertical,
    });
  };

  const constrainSkylineGround = () => {
    // Only the physical camera eye is constrained by the ground plane. The
    // look target is a direction reference and may sit below z=0 when the user
    // looks down from a near-ground viewpoint. If an external operation ever
    // pushes the eye below the floor, lift eye and target together so the view
    // direction does not jump.
    if (camera.eye.z < GROUND_CLEARANCE_M) {
      const lift = GROUND_CLEARANCE_M - camera.eye.z;
      camera.eye.z += lift;
      camera.target.z += lift;
    }
  };

  const resetCamera = () => {
    landmarkFlight = null;
    landmarkOrbit = null;
    hoverLandmark(null);
    camera = makeCamera(viewport.width < MOBILE_BREAKPOINT);
    constrainSkylineGround();
    skylineDollyRemaining = { x: 0, y: 0, z: 0 };
    lastZoomInputAt = -Infinity;
    root.classList.remove('is-zooming');
    heightSelectionTargetZ = null;
    heightAnimationTargetZ = null;
    heightScaleMaxM = 600;
    manualRotationPivot = null;
    plan = { x: 0, y: 0, rotationRad: 0, zoom: 1 };
    planZoomTarget = 1;
    hasMovedCamera = false;
    cameraBasisCache = null;
    cityDirty = true;
    occlusionDirty = true;
    syncCameraReadout();
    syncHeightIndicator();
    syncOrientationHud();
    status.textContent = 'Camera reset to the Sydney Harbour view.';
  };

  // Right drag rotates the map about one ground-based pivot at every height.
  // Neither the floating landmark view target nor the ground-collision state
  // changes the yaw model. Keep the pivot for the duration of a drag/key hold.
  const rotateMap = (dx: number, dy: number) => {
    const pivot = manualRotationPivot ?? manualMapPivot(camera);
    const rotated = rotateManualMap(camera, pivot, dx, dy,
      GROUND_CLEARANCE_M, MAP_ROTATE_YAW_RAD_PER_PX, MAP_ROTATE_PITCH_RAD_PER_PX);
    camera.eye = rotated.eye;
    camera.target = rotated.target;
    constrainSkylineGround();
    markCameraChanged();
  };

  const rotateYaw = (radians: number) => {
    manualRotationPivot = null;
    // Touch twist rotates the viewing direction in place. Keyboard Q/E now
    // use the map-pivot rotation path so they match right-drag semantics.
    const distance = Math.max(25, cameraDistance());
    const forward = normalise(subtract(camera.target, camera.eye));
    const c = Math.cos(radians), s = Math.sin(radians);
    const direction = {
      x: forward.x * c - forward.y * s,
      y: forward.x * s + forward.y * c,
      z: forward.z,
    };
    camera.target = add(camera.eye, scaleVector(direction, distance));
    markCameraChanged();
  };

  const translateSkyline = (displacement: Vec3): boolean => {
    let scale = 1;
    if (displacement.z < 0) {
      const availableDrop = Math.max(0, camera.eye.z - GROUND_CLEARANCE_M);
      const requestedDrop = -displacement.z;
      if (requestedDrop > availableDrop) scale = requestedDrop > 0 ? availableDrop / requestedDrop : 0;
    }
    const applied = scaleVector(displacement, clamp(scale, 0, 1));
    if (vectorLength(applied) < 1e-5) return false;
    camera.eye = add(camera.eye, applied);
    camera.target = add(camera.target, applied);
    if (manualRotationPivot) manualRotationPivot = add(manualRotationPivot, applied);
    constrainSkylineGround();
    markCameraChanged();
    return scale >= .9999;
  };

  // All skyline pan inputs use the visible ground's screen-space scale,
  // independent of camera.target (which changes after landmark inspection).
  // Pointer drags grab a real ground point when its ray is stable; otherwise
  // the same bounded screen-space fallback as keyboard navigation applies.
  // Only x/y change: dragging never alters altitude or the viewing direction.
  const panSkyline = (dx: number, dy: number, inputFactor = 1, from?: PointerSpot, to?: PointerSpot) => {
    const basis = cameraBasis();
    const rect = from && to ? stageInteraction.getBoundingClientRect() : null;
    const movement = skylinePanDisplacement({
      eye: camera.eye,
      forward: basis.forward,
      right: basis.right,
      focalPx: skylineFocalPx,
      dxPx: dx,
      dyPx: dy,
      inputFactor,
      previousRay: rect && from ? skylineScreenRay(from.x, from.y, rect) : undefined,
      currentRay: rect && to ? skylineScreenRay(to.x, to.y, rect) : undefined,
    });
    translateSkyline({ x: movement.x, y: movement.y, z: 0 });
  };

  const adjustSkylineHeight = (dy: number) => {
    // Keyboard Q/E retains the established height-translation direction. The
    // viewing angle stays unchanged and the physical eye cannot cross ground.
    translateSkyline({ x: 0, y: 0, z: dy * keyboardHeightMetresPerPixel(cameraDistance()) });
  };

  const cancelHeightTarget = () => {
    heightWheelAccumulator = 0;
    heightScrollStreak = 0;
    lastHeightScrollAt = -Infinity;
    heightSelectionTargetZ = null;
    heightAnimationTargetZ = null;
    syncHeightIndicator();
    syncOrientationHud();
  };

  const moveSkylineHeightByWheel = (delta: number) => {
    heightSelectionTargetZ = null;
    heightAnimationTargetZ = null;
    skylineDollyRemaining = { x: 0, y: 0, z: 0 };
    const requestedZ = clamp(
      camera.eye.z - delta * mouseHeightMetresPerWheelUnit(cameraDistance()),
      GROUND_CLEARANCE_M,
      HEIGHT_SELECTOR_MAX_M,
    );
    translateSkyline({ x: 0, y: 0, z: requestedZ - camera.eye.z });
  };

  const selectSkylineHeightByWheel = (delta: number) => {
    skylineDollyRemaining = { x: 0, y: 0, z: 0 };
    noteCameraMotion();
    heightAnimationTargetZ = null;
    const wasSelecting = heightSelectionTargetZ !== null;
    if (!wasSelecting) {
      // Start at a whole target-height step, independent of the eye's decimal altitude.
      heightWheelAccumulator = 0;
      heightSelectionTargetZ = clamp(Math.round(camera.eye.z / TARGET_HEIGHT_STEP_M) * TARGET_HEIGHT_STEP_M, GROUND_CLEARANCE_M, HEIGHT_SELECTOR_MAX_M);
    }
    // Normal mouse-wheel notches commonly produce ~100-120 normalized pixels.
    // Accumulate smaller trackpad deltas so every visible change is a 1 m step;
    // one event cannot skip multiple landmark heights, even after a large delta.
    if (Math.sign(delta) !== Math.sign(heightWheelAccumulator)) heightWheelAccumulator = 0;
    heightWheelAccumulator += delta;
    const wheelThreshold = 65;
    if (Math.abs(heightWheelAccumulator) >= wheelThreshold) {
      const direction = Math.sign(heightWheelAccumulator);
      const now = performance.now();
      if (now - lastHeightScrollAt > 560) heightScrollStreak = 0;
      const stepM = targetHeightStepMForStreak(heightScrollStreak);
      heightSelectionTargetZ = nextTargetHeightM(heightSelectionTargetZ!, direction, GROUND_CLEARANCE_M, HEIGHT_SELECTOR_MAX_M, stepM);
      heightWheelAccumulator = clamp(heightWheelAccumulator - direction * wheelThreshold, -wheelThreshold + 1, wheelThreshold - 1);
      heightScrollStreak += 1;
      lastHeightScrollAt = now;
    }
    syncHeightIndicator();
    syncOrientationHud();
    if (!wasSelecting) status.textContent = 'Height target active. Use the wheel to choose a height, then release the right button to travel there.';
  };

  const commitSkylineHeightSelection = () => {
    if (heightSelectionTargetZ === null) return;
    heightWheelAccumulator = 0;
    heightScrollStreak = 0;
    lastHeightScrollAt = -Infinity;
    const targetZ = heightSelectionTargetZ;
    heightSelectionTargetZ = null;
    status.textContent = `Camera height selected: ${Math.round(targetZ)} metres.`;
    if (reducedMotion) {
      heightAnimationTargetZ = null;
      translateSkyline({ x: 0, y: 0, z: targetZ - camera.eye.z });
      syncHeightIndicator();
    syncOrientationHud();
      return;
    }
    heightAnimationTargetZ = targetZ;
    noteCameraMotion();
    syncHeightIndicator();
    syncOrientationHud();
  };

  const dragSkylineDolly = (dy: number) => {
    // Shift+left-drag uses the same aim ray as wheel and keyboard travel.
    const metresPerPixel = clamp(cameraDistance() * .0012, .12, 5);
    queueSkylineDolly(-dy * metresPerPixel);
  };

  const dollySkyline = (distanceM: number) => {
    // All ordinary SKYLINE zoom gestures translate along the camera aim ray.
    // Eye and look target move together and the 10 m ground floor still applies.
    if (Math.abs(distanceM) > 1e-6) showZoomAim();
    return translateSkyline(scaleVector(cameraZoomAimDirection(camera.eye, camera.target), distanceM));
  };

  const queueSkylineDolly = (distanceM: number) => {
    if (Math.abs(distanceM) <= 1e-6) return;
    showZoomAim();
    const queued = add(skylineDollyRemaining, scaleVector(cameraZoomAimDirection(camera.eye, camera.target), distanceM));
    const magnitude = vectorLength(queued);
    skylineDollyRemaining = magnitude > 6000 ? scaleVector(queued, 6000 / magnitude) : queued;
    hasMovedCamera = true;
  };

  const queuePlanZoom = (factor: number) => {
    if (Math.abs(factor - 1) > 1e-6) showZoomAim();
    planZoomTarget = clamp(planZoomTarget * factor, .2, 30);
    hasMovedCamera = true;
  };

  const applyKeyboardNavigation = (deltaS: number) => {
    // WASD retains its inverse-to-left-drag directions. Arrow-key rotation
    // now matches physical right-drag (left/up with left/up); Q/E translate
    // height and +/- control travel.
    const panLeft = pressedNavigationKeys.has('panLeft') ? 1 : 0;
    const panRight = pressedNavigationKeys.has('panRight') ? 1 : 0;
    const panUp = pressedNavigationKeys.has('panUp') ? 1 : 0;
    const panDown = pressedNavigationKeys.has('panDown') ? 1 : 0;
    let desiredPanX = panLeft - panRight;
    let desiredPanY = panUp - panDown;
    const panMagnitude = Math.hypot(desiredPanX, desiredPanY);
    if (panMagnitude > 1) {
      desiredPanX /= panMagnitude;
      desiredPanY /= panMagnitude;
    }

    // Arrows rotate in the same visible directions as mouse right-drag:
    // Left and Up correspond to a leftward/upward physical mouse drag.
    let desiredRotateX = (pressedNavigationKeys.has('rotateLeft') ? 1 : 0) - (pressedNavigationKeys.has('rotateRight') ? 1 : 0);
    let desiredRotateY = (pressedNavigationKeys.has('rotateUp') ? 1 : 0) - (pressedNavigationKeys.has('rotateDown') ? 1 : 0);
    const rotateMagnitude = Math.hypot(desiredRotateX, desiredRotateY);
    if (rotateMagnitude > 1) {
      desiredRotateX /= rotateMagnitude;
      desiredRotateY /= rotateMagnitude;
    }

    // Q/E are the two opposite directions of direct map-height translation.
    // Q takes the positive direction and E the negative one, preserving the
    // user's established left-key/right-key convention.
    const desiredHeight = (pressedNavigationKeys.has('heightPositive') ? 1 : 0) - (pressedNavigationKeys.has('heightNegative') ? 1 : 0);
    const dollyDirection = (pressedNavigationKeys.has('moveForward') ? 1 : 0) - (pressedNavigationKeys.has('moveBackward') ? 1 : 0);

    const panSpeed = (keyboardFast ? KEYBOARD_PAN_FAST_PX_PER_S : KEYBOARD_PAN_PX_PER_S) * effectiveKeyboardMove();
    const rotateSpeed = (keyboardFast ? KEYBOARD_ROTATE_FAST_PX_PER_S : KEYBOARD_ROTATE_PX_PER_S) * effectiveKeyboardPan();
    const heightSpeed = (keyboardFast ? KEYBOARD_HEIGHT_FAST_PX_PER_S : KEYBOARD_HEIGHT_PX_PER_S) * effectiveKeyboardMove();
    const dollySpeed = clamp(
      cameraDistance() * (keyboardFast ? 1.2 : .78),
      keyboardFast ? 420 : 260,
      keyboardFast ? 1650 : 1100,
    );
    const response = 28;
    const blend = 1 - Math.exp(-response * deltaS);

    keyboardPanVelocityX += (desiredPanX * panSpeed - keyboardPanVelocityX) * blend;
    keyboardPanVelocityY += (desiredPanY * panSpeed - keyboardPanVelocityY) * blend;
    keyboardRotateVelocityX += (desiredRotateX * rotateSpeed - keyboardRotateVelocityX) * blend;
    keyboardRotateVelocityY += (desiredRotateY * rotateSpeed - keyboardRotateVelocityY) * blend;
    keyboardHeightVelocity += (desiredHeight * heightSpeed - keyboardHeightVelocity) * blend;
    keyboardDollyVelocity += (dollyDirection * dollySpeed * effectiveKeyboardMove() - keyboardDollyVelocity) * blend;

    if (Math.abs(keyboardPanVelocityX) < .05) keyboardPanVelocityX = 0;
    if (Math.abs(keyboardPanVelocityY) < .05) keyboardPanVelocityY = 0;
    if (Math.abs(keyboardRotateVelocityX) < .05) keyboardRotateVelocityX = 0;
    if (Math.abs(keyboardRotateVelocityY) < .05) keyboardRotateVelocityY = 0;
    if (Math.abs(keyboardHeightVelocity) < .05) keyboardHeightVelocity = 0;
    if (Math.abs(keyboardDollyVelocity) < .05) keyboardDollyVelocity = 0;

    if (keyboardPanVelocityX || keyboardPanVelocityY) {
      const dragX = keyboardPanVelocityX * deltaS;
      const dragY = keyboardPanVelocityY * deltaS;
      if (viewMode === 'plan') panPlan(dragX, dragY, MOUSE_PAN_FACTOR);
      else panSkyline(dragX, dragY, MOUSE_PAN_FACTOR);
    }

    if (keyboardRotateVelocityX || keyboardRotateVelocityY) {
      const dragX = keyboardRotateVelocityX * deltaS;
      const dragY = keyboardRotateVelocityY * deltaS;
      if (viewMode === 'plan') {
        // PLAN right-drag has only a horizontal rotation axis.
        plan.rotationRad += dragX * MAP_ROTATE_YAW_RAD_PER_PX;
        markCameraChanged();
      } else {
        rotateMap(dragX, dragY);
      }
    }

    if (!keyboardRotateVelocityX && !keyboardRotateVelocityY && !activePointers.size &&
        !(['rotateUp', 'rotateDown', 'rotateLeft', 'rotateRight'] as NavigationKey[]).some(key => pressedNavigationKeys.has(key))) {
      manualRotationPivot = null;
    }

    if (keyboardHeightVelocity && viewMode === 'skyline') {
      adjustSkylineHeight(keyboardHeightVelocity * deltaS);
    }

    if (keyboardDollyVelocity) {
      if (viewMode === 'plan') {
        const factor = Math.exp((keyboardDollyVelocity / dollySpeed) * 1.45 * deltaS);
        queuePlanZoom(factor);
      } else {
        dollySkyline(keyboardDollyVelocity * deltaS);
      }
    }
  };

  const applyCameraSmoothing = (deltaS: number) => {
    if (viewMode === 'skyline') {
      if (heightAnimationTargetZ !== null) {
        const deltaZ = heightAnimationTargetZ - camera.eye.z;
        if (Math.abs(deltaZ) <= .05) {
          if (Math.abs(deltaZ) > .001) translateSkyline({ x: 0, y: 0, z: deltaZ });
          heightAnimationTargetZ = null;
          syncHeightIndicator();
    syncOrientationHud();
        } else {
          const fraction = 1 - Math.exp(-7 * deltaS);
          translateSkyline({ x: 0, y: 0, z: deltaZ * fraction });
        }
      }

      const remaining = vectorLength(skylineDollyRemaining);
      if (remaining > .02) {
        const fraction = 1 - Math.exp(-13 * deltaS);
        const step = scaleVector(skylineDollyRemaining, fraction);
        skylineDollyRemaining = subtract(skylineDollyRemaining, step);
        const fullyApplied = translateSkyline(step);
        if (!fullyApplied) skylineDollyRemaining = { x: 0, y: 0, z: 0 };
      } else skylineDollyRemaining = { x: 0, y: 0, z: 0 };
    } else {
      const delta = planZoomTarget - plan.zoom;
      if (Math.abs(delta) > .0005) {
        plan.zoom = clamp(plan.zoom + delta * .18, .2, 30);
        cityDirty = true;
        occlusionDirty = true;
        syncCameraReadout();
      }
    }
  };

  const panPlan = (dx: number, dy: number, inputFactor = 1) => {
    const scale = Math.max(.0001, viewport.planScale * plan.zoom);
    const c = Math.cos(plan.rotationRad), s = Math.sin(plan.rotationRad);
    const sx = -(dx * inputFactor) / scale, sy = (dy * inputFactor) / scale;
    plan.x += sx*c + sy*s;
    plan.y += -sx*s + sy*c;
    markCameraChanged();
  };

  const syncView = () => {
    positionZoomAim();
    viewButtons.forEach((button) => {
      const active = button.dataset.viewMode === viewMode;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    root.dataset.view = viewMode;
    syncCameraReadout();
    syncHeightIndicator();
    syncOrientationHud();
    cityDirty = true;
    occlusionDirty = true;
    sceneHint.textContent = viewMode === 'skyline'
      ? 'LEFT DRAG PAN · RIGHT DRAG ROTATE · BOTH DRAG PAN+ROTATE · WHEEL MOVE · L+WHEEL HEIGHT · R+WHEEL TARGET HEIGHT'
      : 'LEFT DRAG PAN · RIGHT DRAG ROTATE · WHEEL ZOOM';
    status.textContent = `${viewMode === 'skyline' ? 'Skyline' : 'Plan'} view selected.`;
  };

  const replay = (announce = true) => {
    launchStart = performance.now() + (reducedMotion ? 0 : 90);
    if (announce) {
      status.textContent = reducedMotion
        ? `${displayEffectName()} static reduced-motion preview.`
        : `${displayEffectName()} launched over Sydney Harbour. ${state.calibreMm} millimetres, ${Math.round(state.heightM)} metres high, ${Math.round(state.spreadM)} metre spread.`;
    }
  };

  const applyPreset = (preset: Preset) => {
    const family = familyById.get(preset.familyId);
    const shell = shellByCalibre.get(preset.calibreMm);
    if (!family || !shell) return;
    state = {
      preset,
      family,
      calibreMm: preset.calibreMm,
      heightM: preset.burstHeightOverrideM ?? shell.approxBurstHeightM,
      spreadM: preset.spreadDiameterOverrideM ?? shell.approxMaxSpreadDiameterM,
      primaryColourId: preset.tipColours[0] ?? 'white',
      custom: false,
    };
    syncControls();
    createSeeds();
    occlusionDirty = true;
    replay(false);
  };

  const markCustom = () => {
    state.custom = true;
    syncControls();
    createSeeds();
    replay(false);
  };

  const loadCity = async () => {
    const started = performance.now();
    try {
      // Opt-in local review uses a separate generated static asset. Normal
      // users retain the accepted Sydney bundle, even after a test acquisition.
      const requestedPreview = new URLSearchParams(window.location.search).get('city') !== 'original-sydney';
      const cityUrl = requestedPreview
        ? '/data/fireworks-simulator/sydney-city-greater-sydney-test.json'
        : config.cityUrl;
      const response = await fetch(cityUrl, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status} loading ${cityUrl}`);
      const loaded = await response.json() as CityBundle;
      if (!loaded?.city || !Array.isArray(loaded.buildings)) throw new Error('invalid city bundle');
      // Do not silently label a copied or stale standard Sydney file as the
      // greater-Sydney test. The preview route must load the matching extent.
      if (requestedPreview && loaded.city.sceneExtent !== 'greater-sydney-test') {
        throw new Error(`preview file is not the greater-sydney-test extent (${loaded.city.sceneExtent ?? 'unknown'})`);
      }
      city = loaded;
      activeCityPreview = requestedPreview;
      if (previewOverviewButton) previewOverviewButton.hidden = !activeCityPreview;
      landmarks = cityLandmarks(loaded.city.id, loaded.buildings, loaded.structures ?? []);
      buildHeightComparison();
      landmarkIds.clear();
      for (const item of landmarks) {
        if (item.source === 'overture') landmarkIds.add(item.id);
        for (const memberId of item.memberIds ?? []) landmarkIds.add(memberId);
      }
      if (keyLabelsRoot) {
        keyLabelsRoot.replaceChildren();
        keyLabelNodes.clear();
        for (const landmark of landmarks) {
          const label = document.createElement('div');
          label.className = 'fireworks-simulator__key-flag';
          label.dataset.landmarkId = landmark.id;
          label.hidden = true;
          const nameButton = document.createElement('button');
          nameButton.type = 'button';
          nameButton.dataset.landmarkName = '';
          nameButton.textContent = landmark.name;
          nameButton.title = `View ${landmark.name}`;
          nameButton.setAttribute('aria-label', `View ${landmark.name}`);
          nameButton.setAttribute('aria-pressed', 'false');
          const clearButton = document.createElement('button');
          clearButton.type = 'button';
          clearButton.dataset.landmarkClear = '';
          clearButton.textContent = '×';
          clearButton.setAttribute('aria-label', `Deselect ${landmark.name}`);
          clearButton.title = `Deselect ${landmark.name}`;
          clearButton.addEventListener('click', (event) => {
            event.stopPropagation();
            clearSelectedLandmark();
          });
          label.append(nameButton, clearButton);
          label.addEventListener('pointerenter', () => hoverLandmark(landmark.id));
          label.addEventListener('pointerleave', () => { if (hoveredLandmarkId === landmark.id) hoverLandmark(null); });
          label.addEventListener('focusin', () => hoverLandmark(landmark.id));
          label.addEventListener('focusout', (event) => {
            if (!label.contains(event.relatedTarget as Node) && hoveredLandmarkId === landmark.id) hoverLandmark(null);
          });
          nameButton.addEventListener('click', () => focusLandmark(landmark));
          keyLabelsRoot.append(label);
          keyLabelNodes.set(landmark.id, label);
        }
      }
      renderLandmarkList();
      const landmarkNote = landmarkPanel?.querySelector<HTMLElement>('.fireworks-simulator__landmark-note');
      if (landmarkNote) landmarkNote.textContent = `${landmarks.length} SOURCE-BACKED PLACES · SELECT TO FRAME`;
      hoveredLandmarkId = null;
      selectedLandmarkId = null;
      landmarkAccentWeights.clear();
      syncLandmarkState();
      prepareCityGeometry();
      webglCity?.setCity(loaded);
      cityLoadMs = performance.now() - started;
      cityReadyAt = performance.now();
      const roadCount = loaded.profile.roadCount ?? loaded.roads?.length ?? 0;
      cityLabel.textContent = `CITY ${loaded.profile.buildingCount + loaded.profile.structureCount}  STREETS ${roadCount}`;
      cityModeLabel.textContent = activeCityPreview ? 'GREATER SYDNEY TEST / LOADING VIEW' : 'SYDNEY / LOADING VIEW';
      updateViewport();
      replay(false);
      status.textContent = loaded.city.geometryMode === 'procedural-calibration'
        ? `Sydney calibration buildings loaded.${roadCount ? ` ${roadCount} sourced street segments are active.` : ' Run the Sydney transport acquisition command to add sourced streets.'}`
        : activeCityPreview
          ? `Greater Sydney preview loaded: ${loaded.profile.buildingCount} buildings, ${roadCount} streets. Use View Full Extent to see the expanded coverage.`
          : `Sydney city data loaded with ${roadCount} street segments.`;
    } catch (error) {
      activeCityPreview = false;
      if (previewOverviewButton) previewOverviewButton.hidden = true;
      cityLabel.textContent = 'CITY ERR';
      cityModeLabel.textContent = 'SYDNEY / CITY DATA UNAVAILABLE';
      status.textContent = `Sydney city data could not be loaded: ${error instanceof Error ? error.message : 'unknown error'}. Firework controls remain available.`;
      updateViewport();
    }
  };

  presetSelect.addEventListener('change', () => {
    const preset = presetById.get(presetSelect.value);
    if (preset) applyPreset(preset);
  });

  calibreSelect.addEventListener('change', () => {
    const calibre = Number(calibreSelect.value);
    const shell = shellByCalibre.get(calibre);
    if (!shell) return;
    state.calibreMm = calibre;
    state.heightM = shell.approxBurstHeightM;
    state.spreadM = shell.approxMaxSpreadDiameterM;
    state.custom = true;
    syncControls();
    createSeeds();
    occlusionDirty = true;
    replay(false);
  });

  colourSelect.addEventListener('change', () => {
    state.primaryColourId = colourSelect.value;
    markCustom();
  });

  heightInput.addEventListener('input', () => {
    state.heightM = Number(heightInput.value);
    occlusionDirty = true;
    markCustom();
  });

  spreadInput.addEventListener('input', () => {
    state.spreadM = Number(spreadInput.value);
    markCustom();
  });

  // Sliders specify transparency rather than opacity. Keep their remembered
  // values when a layer is switched off, so switching it on restores the view.

  const syncLayers = () => {
    for (const key of layerKeys) {
      const controls = layerRows.get(key);
      if (!controls?.toggle || !controls.slider || !controls.output) continue;
      const transparency = clamp(Number(controls.slider.value), 0, 100);
      layers.opacity[key] = controls.toggle.checked ? (100 - transparency) / 100 : 0;
      controls.slider.disabled = !controls.toggle.checked;
      controls.output.textContent = `${transparency}%`;
      controls.slider.setAttribute('aria-valuetext', `${transparency}% transparent`);
      controls.row?.classList.toggle('is-off', !controls.toggle.checked);
    }
    if (highlightInput) {
      highlightInput.disabled = !layerRows.get('structures')?.toggle?.checked;
      layers.highlight = highlightInput.checked && !highlightInput.disabled;
    }
    cityDirty = true;
    occlusionDirty = true;
  };
  for (const key of layerKeys) {
    const controls = layerRows.get(key);
    controls?.toggle?.addEventListener('change', syncLayers);
    controls?.slider?.addEventListener('input', syncLayers);
  }
  highlightInput?.addEventListener('change', syncLayers);
  syncLayers();

  launchButton.addEventListener('click', () => replay());
  cameraReset.addEventListener('click', resetCamera);

  // Shared left and right drawers are attached above through setupEdgeDrawer.

  // Pointer events support mouse, pen and multitouch without activating replay
  // after a drag. The native LAUNCH button always remains available.
  const pointerMetrics = () => {
    const values = [...activePointers.values()];
    if (values.length < 2) return null;
    const a = values[0], b = values[1];
    return {
      centroid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.hypot(b.x - a.x, b.y - a.y),
      angle: Math.atan2(b.y - a.y, b.x - a.x),
    };
  };
  const recordGesture = () => {
    const current = pointerMetrics();
    if (current) {
      gestureLastCentroid = current.centroid;
      gestureLastDistance = current.distance;
      gestureLastAngle = current.angle;
    } else {
      gestureLastCentroid = null;
      gestureLastDistance = 0;
    }
  };
  // Pointer lock gives effectively unlimited movement even at an OS monitor edge.
  // We keep an independent virtual pointer for map-ground ray anchoring because
  // browsers freeze clientX/clientY while locked. Touch/pen are unaffected.
  let pointerLockedToStage = false;
  let pointerLockPending = false;
  document.addEventListener('pointerlockchange', () => {
    pointerLockPending = false;
    pointerLockedToStage = document.pointerLockElement === stageInteraction;
    if (pointerLockedToStage && !activePointers.size) document.exitPointerLock();
    if (!pointerLockedToStage && activePointers.size && heldMouseButtons !== 0) {
      // Escape must terminate the gesture rather than jump to client coords.
      activePointers.clear(); pointerOrigins.clear(); pointerTravel.clear();
      manualRotationPivot = null; heldMouseButtons = 0; suppressSceneClick = true;
      if (heightSelectionTargetZ !== null) cancelHeightTarget();
    }
    root.classList.toggle('is-pointer-locked', pointerLockedToStage);
  });
  document.addEventListener('pointerlockerror', () => { pointerLockPending = false; });
  // Native cursors cannot fade, so use a compositor-only transform for the
  // crosshair. Do not remeasure layout or animate cursor position per event.
  const positionSceneCursor = (clientX: number, clientY: number) => {
    cameraCursor.style.transform = `translate3d(${(clientX - cursorOriginX).toFixed(2)}px, ${(clientY - cursorOriginY).toFixed(2)}px, 0) translate(-50%, -50%)`;
  };
  stageInteraction.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    positionSceneCursor(event.clientX, event.clientY);
    root.classList.add('is-cursor-present');
  });
  stageInteraction.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse' && !pointerLockedToStage) root.classList.remove('is-cursor-present');
  });
  stageInteraction.addEventListener('pointerdown', (event) => {
    hoverLandmark(null);
    restoreManualNavigation();
    if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1 && event.button !== 2) return;
    setGuideInput(event.pointerType === 'touch' ? 'touch' : 'mouse');
    if (event.pointerType === 'mouse') {
      heldMouseButtons = event.buttons;
      positionSceneCursor(event.clientX, event.clientY);
    }
    // Right and middle mouse actions are camera controls even before dragging.
    if (viewMode === 'skyline' && (event.button === 2 || (event.button === 0 && event.ctrlKey))) {
      manualRotationPivot = manualMapPivot(camera);
    }
    if (event.button === 2 || event.button === 1) noteCameraMotion();
    if (heightAnimationTargetZ !== null) cancelHeightTarget();
    if (heightSelectionTargetZ !== null && event.pointerType === 'mouse' && event.button !== 2) cancelHeightTarget();
    stageInteraction.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.pointerType === 'mouse' && event.buttons !== 0 && typeof stageInteraction.requestPointerLock === 'function' && document.pointerLockElement !== stageInteraction) {
      try {
        // Pointer lock requires a real user gesture. If denied (e.g. browser
        // permissions), pointer capture remains the conventional fallback.
        pointerLockPending = true;
        const request = stageInteraction.requestPointerLock();
        if (request && typeof request.catch === 'function') void request.catch(() => { pointerLockPending = false; });
      } catch { pointerLockPending = false; /* Keep standard pointer capture. */ }
    }
    pointerOrigins.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pointerTravel.set(event.pointerId, 0);
    if (activePointers.size > 1 || event.button !== 0 || event.ctrlKey || event.shiftKey) suppressSceneClick = true;
    recordGesture();
    if (event.button === 2 || event.ctrlKey || event.shiftKey) event.preventDefault();
  });
  stageInteraction.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' && !pointerLockedToStage) positionSceneCursor(event.clientX, event.clientY);
    const previous = activePointers.get(event.pointerId);
    if (!previous) return;
    const locked = event.pointerType === 'mouse' && pointerLockedToStage;
    const delta = navigationPointerDelta(locked, event.movementX, event.movementY,
      { x: event.clientX, y: event.clientY }, previous);
    const dx = delta.x, dy = delta.y;
    const spot = locked
      ? navigationVirtualPosition(previous, delta, stageInteraction.getBoundingClientRect())
      : { x: event.clientX, y: event.clientY };
    activePointers.set(event.pointerId, spot);
    if (locked) positionSceneCursor(spot.x, spot.y);
    // Once the virtual pointer meets an edge, retain physical mouse deltas
    // and use screen-space pan. Two identical ground rays would stop motion.
    const anchorFrom = navigationCanAnchorPointer(previous, spot, delta) ? previous : undefined;
    const anchorTo = anchorFrom ? spot : undefined;
    const travel = (pointerTravel.get(event.pointerId) ?? 0) + Math.hypot(dx, dy);
    pointerTravel.set(event.pointerId, travel);
    const origin = pointerOrigins.get(event.pointerId) ?? previous;
    if (travel > 6 || Math.hypot(spot.x - origin.x, spot.y - origin.y) > 6) suppressSceneClick = true;
    if (!suppressSceneClick && activePointers.size === 1) return;
    const multi = pointerMetrics();
    if (multi) {
      if (gestureLastCentroid) {
        const mx = multi.centroid.x - gestureLastCentroid.x;
        const my = multi.centroid.y - gestureLastCentroid.y;
        const angleDelta = multi.angle - gestureLastAngle;
        if (viewMode === 'plan') {
          // One finger pans. Two fingers can still pan together while pinch
          // controls zoom and twist controls rotation.
          panPlan(mx, my);
          queuePlanZoom(multi.distance / Math.max(1, gestureLastDistance));
          plan.rotationRad += angleDelta;
          markCameraChanged();
        } else {
          panSkyline(mx, my, 1, gestureLastCentroid, multi.centroid);
          const aimDistance = clamp(cameraDistance(), 25, 6000);
          const pinchDistance = aimDistance * Math.log(Math.max(.1, multi.distance) / Math.max(.1, gestureLastDistance)) * .9;
          if (Math.abs(pinchDistance) > .001) queueSkylineDolly(pinchDistance);
          rotateYaw(-angleDelta);
        }
      }
      recordGesture();
    } else if (viewMode === 'plan') {
      if (event.pointerType === 'mouse' && event.buttons === 3) {
        // Dual-button drag combines the two mouse drag families. In PLAN that
        // means pan plus horizontal rotation from the same pointer movement.
        panPlan(dx, dy, MOUSE_PAN_FACTOR * effectiveMouseMove());
        plan.rotationRad += mouseMapRotationDelta(dx, dy).dx * MAP_ROTATE_YAW_RAD_PER_PX * effectiveMousePan();
        markCameraChanged();
      } else if (event.pointerType === 'mouse' && (event.buttons === 2 || (event.buttons === 1 && event.ctrlKey))) {
        plan.rotationRad += mouseMapRotationDelta(dx, dy).dx * MAP_ROTATE_YAW_RAD_PER_PX * effectiveMousePan();
        markCameraChanged();
      } else if (event.pointerType === 'mouse' && event.buttons === 1 && event.shiftKey) {
        queuePlanZoom(Math.exp(-dy * .006));
      } else {
        panPlan(dx, dy, event.pointerType === 'mouse' ? MOUSE_PAN_FACTOR * effectiveMouseMove() : 1);
      }
    } else if (event.pointerType === 'mouse' && event.buttons === 3) {
      // Apply left-drag pan and right-drag map rotation together. This gives a
      // mouse-only user the complete drag camera without assigning the chord
      // to a separate third operation.
      panSkyline(dx, dy, MOUSE_PAN_FACTOR * effectiveMouseMove(), anchorFrom, anchorTo);
      const direction = mouseMapRotationDelta(dx, dy);
      rotateMap(direction.dx * effectiveMousePan(), direction.dy * effectiveMousePan());
    } else if (event.pointerType === 'mouse' && (event.buttons === 2 || (event.buttons === 1 && event.ctrlKey))) {
      // Once right+wheel has entered height-target mode, keep the scene still
      // until release instead of letting small wheel-hand movements also orbit.
      if (heightSelectionTargetZ === null) {
        const direction = mouseMapRotationDelta(dx, dy);
        rotateMap(direction.dx * effectiveMousePan(), direction.dy * effectiveMousePan());
      }
    } else if (event.pointerType === 'mouse' && event.buttons === 1 && event.shiftKey) {
      dragSkylineDolly(dy);
    } else {
      // Plain left mouse, pen and one-finger touch all grab/pan the city.
      panSkyline(dx, dy, event.pointerType === 'mouse' ? MOUSE_PAN_FACTOR * effectiveMouseMove() : 1, anchorFrom, anchorTo);
    }
  });
  const finishPointer = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') heldMouseButtons = event.type === 'pointerup' ? event.buttons : 0;
    if (!activePointers.has(event.pointerId)) return;
    if (event.type === 'pointerup' && event.pointerType === 'mouse' && event.button === 2 && heightSelectionTargetZ !== null) {
      commitSkylineHeightSelection();
    } else if (event.type !== 'pointerup' && heightSelectionTargetZ !== null) {
      cancelHeightTarget();
    }
    // A mouse uses one pointerId for all physical buttons. If one button of a
    // chord is released while another remains down, keep tracking that pointer
    // so the user can flow directly from the combined gesture into left- or
    // right-drag without having to release everything and start again.
    if (event.type === 'pointerup' && event.pointerType === 'mouse' && event.buttons !== 0) {
      // Keep the virtual pointer in lock mode. The native client coordinate
      // may be frozen and would otherwise produce a jump mid-chord.
      const lastSpot = activePointers.get(event.pointerId) ?? { x: event.clientX, y: event.clientY };
      activePointers.set(event.pointerId, lastSpot);
      pointerOrigins.set(event.pointerId, lastSpot);
      recordGesture();
      return;
    }
    const wasSingle = activePointers.size === 1;
    activePointers.delete(event.pointerId);
    pointerOrigins.delete(event.pointerId);
    pointerTravel.delete(event.pointerId);
    recordGesture();
    if (activePointers.size === 0) {
      manualRotationPivot = null;
      if (document.pointerLockElement === stageInteraction) document.exitPointerLock();
      syncCalibration();
    }
    if (wasSingle) {
      if (!suppressSceneClick && event.type === 'pointerup' && event.button === 0) replay();
      suppressSceneClick = false;
    }
  };
  stageInteraction.addEventListener('pointerup', finishPointer);
  stageInteraction.addEventListener('pointercancel', (event) => { suppressSceneClick = true; finishPointer(event); });
  stageInteraction.addEventListener('lostpointercapture', (event) => {
    // Browsers may relinquish pointer capture as they enter Pointer Lock;
    // the locked element keeps receiving movement and release events.
    if (!pointerLockedToStage && !pointerLockPending && activePointers.has(event.pointerId)) { suppressSceneClick = true; finishPointer(event); }
  });
  stageInteraction.addEventListener('wheel', (event) => {
    hoverLandmark(null);
    restoreManualNavigation();
    manualRotationPivot = null;
    event.preventDefault();
    setGuideInput('mouse');
    positionSceneCursor(event.clientX, event.clientY);
    noteCameraMotion();
    // WheelEvent deltaY may be pixels, lines or pages. Normalise it before
    // applying the same smooth physical travel on different mice/trackpads.
    const deltaPixels = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? event.deltaY * 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? event.deltaY * viewport.height
        : event.deltaY;
    const delta = clamp(deltaPixels, -240, 240);
    const wheelButtons = heldMouseButtons || event.buttons;
    if (viewMode === 'skyline') {
      if (wheelButtons === 1) {
        // Left button + wheel changes altitude immediately. The height marker
        // stays neutral and follows the live camera position.
        suppressSceneClick = true;
        moveSkylineHeightByWheel(delta);
      } else if (wheelButtons === 2) {
        // Right button + wheel only moves the highlighted target marker. The
        // camera itself eases to that target after the right button is released.
        suppressSceneClick = true;
        selectSkylineHeightByWheel(delta);
      } else if (wheelButtons === 0) {
        if (heightAnimationTargetZ !== null || heightSelectionTargetZ !== null) cancelHeightTarget();
        const metresPerWheelUnit = clamp(cameraDistance() * .00035, .15, 1.5);
        queueSkylineDolly(-delta * metresPerWheelUnit);
      }
    }
    else if (wheelButtons === 0) queuePlanZoom(Math.exp(-delta * .0007));
  }, { passive: false });

  const isTextEntryTarget = (target: EventTarget | null) => {
    const element = target instanceof HTMLElement ? target : null;
    if (!element) return false;
    return element.isContentEditable || ['INPUT','SELECT','TEXTAREA'].includes(element.tagName);
  };

  // Navigation shortcuts are global so the user can move the viewport without
  // clicking it first. Keydown/keyup only maintain state; requestAnimationFrame
  // applies movement using elapsed time so held keys are independent of the
  // operating system's keyboard-repeat interval. Form controls keep native
  // keyboard behaviour.
  const navigationKey = (event: KeyboardEvent): NavigationKey | null => {
    const key = event.key.toLowerCase();
    if (event.code === 'KeyW') return 'panUp';
    if (event.code === 'KeyS') return 'panDown';
    if (event.code === 'KeyA') return 'panLeft';
    if (event.code === 'KeyD') return 'panRight';
    if (key === 'arrowup') return 'rotateUp';
    if (key === 'arrowdown') return 'rotateDown';
    if (key === 'arrowleft') return 'rotateLeft';
    if (key === 'arrowright') return 'rotateRight';
    if (event.code === 'KeyQ') return 'heightPositive';
    if (event.code === 'KeyE') return 'heightNegative';
    if (key === '+' || key === '=' || key === 'add' || event.code === 'NumpadAdd') return 'moveForward';
    if (key === '-' || key === '_' || key === 'subtract' || event.code === 'NumpadSubtract') return 'moveBackward';
    return null;
  };

  const stopKeyboardMotion = () => {
    pressedNavigationKeys.clear();
    keyboardFast = false;
    keyboardPanVelocityX = 0;
    keyboardPanVelocityY = 0;
    keyboardRotateVelocityX = 0;
    keyboardRotateVelocityY = 0;
    keyboardHeightVelocity = 0;
    keyboardDollyVelocity = 0;
    if (!activePointers.size) manualRotationPivot = null;
  };

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Shift') {
      keyboardFast = true;
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || isTextEntryTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === 'r' || key === 'home') {
      event.preventDefault();
      setGuideInput('keyboard');
      if (!event.repeat) {
        stopKeyboardMotion();
        resetCamera();
        stageInteraction.focus({ preventScroll: true });
      }
      return;
    }
    const mapped = navigationKey(event);
    if (!mapped) return;
    event.preventDefault();
    setGuideInput('keyboard');
    if (heightAnimationTargetZ !== null || heightSelectionTargetZ !== null) cancelHeightTarget();
    if (!event.repeat) restoreManualNavigation();
    if (viewMode === 'skyline' && mapped.startsWith('rotate') && !manualRotationPivot) {
      manualRotationPivot = manualMapPivot(camera);
    }
    pressedNavigationKeys.add(mapped);
    keyboardFast = event.shiftKey || keyboardFast;
    stageInteraction.focus({ preventScroll: true });
  });

  window.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') keyboardFast = false;
    const mapped = navigationKey(event);
    if (mapped) pressedNavigationKeys.delete(mapped);
    // Keep the same map pivot until the eased keyboard rotation has stopped.
  });
  window.addEventListener('blur', () => {
    heldMouseButtons = 0; stopKeyboardMotion();
    if (document.pointerLockElement === stageInteraction) document.exitPointerLock();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopKeyboardMotion();
  });

  stageInteraction.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      replay();
    }
  });

  previewOverviewButton?.addEventListener('click', () => {
    if (!activeCityPreview || !city) return;
    // PLAN already computes its fit scale from the loaded city bounds.
    // Reset the planar offset/zoom so the *whole* expanded extent is visible.
    if (viewMode !== 'plan') viewButtons.find(button => button.dataset.viewMode === 'plan')?.click();
    plan = { x: 0, y: 0, rotationRad: 0, zoom: 1 };
    planZoomTarget = 1;
    syncView();
    status.textContent = 'Greater Sydney test: full source extent shown in PLAN. Switch to SKYLINE to explore individual areas.';
    replay(false);
  });

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.viewMode;
      if (next !== 'plan' && next !== 'skyline') return;
      if (heightAnimationTargetZ !== null || heightSelectionTargetZ !== null) cancelHeightTarget();
      hoverLandmark(null);
      restoreManualNavigation();
      landmarkFlight = null;
      landmarkOrbit = null;
      manualRotationPivot = null;
      stopKeyboardMotion();
      lastZoomInputAt = -Infinity;
      root.classList.remove('is-zooming');
      viewMode = next;
      syncView();
      replay(false);
    });
  });

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotionQuery.addEventListener('change', (event) => {
    reducedMotion = event.matches;
    createSeeds();
    replay(false);
    status.textContent = reducedMotion
      ? 'Reduced motion enabled. Showing a static effect preview.'
      : 'Reduced motion disabled. Firework animation restored.';
  });

  const resizeObserver = new ResizeObserver(() => updateViewport());
  resizeObserver.observe(root);

  syncControls();
  syncView();
  updateViewport();
  void loadCity();
  launchStart = performance.now() + 520;
  animationFrame = window.requestAnimationFrame(draw);

  window.addEventListener('pagehide', () => {
    window.clearTimeout(identityTimer);
    document.removeEventListener('contextmenu', blockPageContextMenu, true);

    window.cancelAnimationFrame(animationFrame);
    if (document.pointerLockElement === stageInteraction) document.exitPointerLock();
    resizeObserver.disconnect();
    webglCity?.dispose();
  }, { once: true });
}

document.querySelectorAll<HTMLElement>('[data-fireworks-simulator]').forEach(initialise);
