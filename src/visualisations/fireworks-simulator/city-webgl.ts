import { cityLandmarks, overlapsAuthoredLandmark } from './city-landmarks';
type Point2 = [number, number];
type Vec3 = { x: number; y: number; z: number };

type CityBuilding = {
  id: string;
  name?: string | null;
  footprint: Point2[];
  heightM: number;
  minHeightM?: number;
  roadConflict?: boolean;
};

type CityRoad = {
  points: Point2[];
  onType: 'ground' | 'bridge' | 'tunnel' | 'unknown';
  laneCountExact: number | null;
  functionHierarchy: number | null;
  displayWidthM: number;
};

type CityStructure = {
  id: string;
  name: string;
  rotationDeg?: number;
  spanM?: number;
  widthM?: number;
  depthM?: number;
  pylonHeightM?: number;
  type: 'arch-bridge' | 'opera-house' | 'observation-tower';
  x: number;
  y: number;
  z?: number;
  heightM: number;
  podHeightM?: number;
};

type CityTransportPoint = {
  type: 'junction' | 'traffic-signal' | 'crossing' | 'other';
  x: number;
  y: number;
  z?: number;
};

export type WebGLCityBundle = {
  city?: { id?: string };
  land?: { sourceClass: string; triangles: Point2[][] };
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
  buildings: CityBuilding[];
  structures?: CityStructure[];
  roads?: CityRoad[];
  transportPoints?: CityTransportPoint[];
};

export type CityLayerKey = 'structures' | 'buildings' | 'roads' | 'land';
export type CityLayerOpacities = Record<CityLayerKey, number>;
export type CityRenderSettings = {
  opacity: CityLayerOpacities; highlight: boolean;
  landmarkAccents?: Array<{ id: string; type: 'hover' | 'selected'; strength: number }>;
};

export type WebGLCamera = {
  eye: Vec3;
  target: Vec3;
  rollRad: number;
};

export type WebGLViewport = {
  width: number;
  height: number;
  dpr: number;
  skylineHorizonY: number;
  skylineScreenX: number;
  skylineFocalPx: number;
};

export type WebGLPlan = {
  centreX: number; centreY: number; rotationRad: number; scale: number;
};

type DrawBuffer = {
  buffer: WebGLBuffer;
  count: number;
};

type ProgramInfo = {
  program: WebGLProgram;
  position: number;
  uniforms: {
    eye: WebGLUniformLocation;
    forward: WebGLUniformLocation;
    right: WebGLUniformLocation;
    up: WebGLUniformLocation;
    viewport: WebGLUniformLocation;
    screenOrigin: WebGLUniformLocation;
    focal: WebGLUniformLocation;
    planMode: WebGLUniformLocation; planCentre: WebGLUniformLocation;
    planRotation: WebGLUniformLocation; planScale: WebGLUniformLocation;
    near: WebGLUniformLocation;
    far: WebGLUniformLocation;
    colour: WebGLUniformLocation;
    pointSize: WebGLUniformLocation;
    edgeBounds: WebGLUniformLocation;
    edgeFadeMetres: WebGLUniformLocation;
    fadeEast: WebGLUniformLocation;
  };
};

const LAND_FILL: [number, number, number, number] = [0.145, 0.155, 0.16, 0.78];
const CITY_EDGE_FADE_METRES = 300;
const LAND_EDGE_FADE_METRES = 300;
const BUILDING_FILL: [number, number, number, number] = [0.058, 0.092, 0.112, 1];
const BUILDING_EDGE: [number, number, number, number] = [0.71, 0.80, 0.81, 0.48];
const LANDMARK_EDGE: [number, number, number, number] = [0.82, 0.89, 0.88, 0.76];
const LANDMARK_HOVER_EDGE: [number, number, number, number] = [1.0, .93, .62, .92];
const LANDMARK_SELECTED_EDGE: [number, number, number, number] = [.83, .67, .37, .83];
const ROAD_MAJOR: [number, number, number, number] = [0.027, 0.047, 0.059, 1];
const ROAD_MINOR: [number, number, number, number] = [0.035, 0.055, 0.067, 1];
const ROAD_TUNNEL: [number, number, number, number] = [0.05, 0.07, 0.08, 0.25];
const ROAD_EDGE: [number, number, number, number] = [0.45, 0.55, 0.58, 0.38];
const ROAD_LANE: [number, number, number, number] = [0.78, 0.75, 0.64, 0.22];
const JUNCTION: [number, number, number, number] = [0.59, 0.69, 0.71, 0.36];
const SIGNAL: [number, number, number, number] = [0.88, 0.76, 0.45, 0.82];
const CROSSING: [number, number, number, number] = [0.78, 0.84, 0.84, 0.65];

const normalise = (v: Vec3): Vec3 => {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};
const subtract = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

function polygonArea(points: Point2[]): number {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[(index + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return area * 0.5;
}

function triangleContains(a: Point2, b: Point2, c: Point2, p: Point2): boolean {
  const sign = (p1: Point2, p2: Point2, p3: Point2) =>
    (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const hasNegative = d1 < -1e-7 || d2 < -1e-7 || d3 < -1e-7;
  const hasPositive = d1 > 1e-7 || d2 > 1e-7 || d3 > 1e-7;
  return !(hasNegative && hasPositive);
}

function triangulatePolygon(points: Point2[]): number[] {
  if (points.length < 3) return [];
  const order = Array.from({ length: points.length }, (_, index) => index);
  if (polygonArea(points) < 0) order.reverse();
  const triangles: number[] = [];
  let guard = points.length * points.length;

  while (order.length > 3 && guard > 0) {
    guard -= 1;
    let clipped = false;
    for (let index = 0; index < order.length; index += 1) {
      const prev = order[(index - 1 + order.length) % order.length];
      const current = order[index];
      const next = order[(index + 1) % order.length];
      const a = points[prev], b = points[current], c = points[next];
      const crossZ = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (crossZ <= 1e-7) continue;
      let contains = false;
      for (const candidate of order) {
        if (candidate === prev || candidate === current || candidate === next) continue;
        if (triangleContains(a, b, c, points[candidate])) {
          contains = true;
          break;
        }
      }
      if (contains) continue;
      triangles.push(prev, current, next);
      order.splice(index, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }

  if (order.length === 3) triangles.push(order[0], order[1], order[2]);
  if (triangles.length < (points.length - 2) * 3) {
    triangles.length = 0;
    for (let index = 1; index < points.length - 1; index += 1) triangles.push(0, index, index + 1);
  }
  return triangles;
}

function pushVertex(target: number[], x: number, y: number, z: number) {
  target.push(x, y, z);
}

function pushTriangle(target: number[], a: Vec3, b: Vec3, c: Vec3) {
  pushVertex(target, a.x, a.y, a.z);
  pushVertex(target, b.x, b.y, b.z);
  pushVertex(target, c.x, c.y, c.z);
}

function pushLine(target: number[], a: Vec3, b: Vec3) {
  pushVertex(target, a.x, a.y, a.z);
  pushVertex(target, b.x, b.y, b.z);
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const detail = gl.getShaderInfoLog(shader) || 'unknown shader error';
    gl.deleteShader(shader);
    throw new Error(detail);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): ProgramInfo {
  const vertex = createShader(gl, gl.VERTEX_SHADER, `#version 300 es
    precision highp float;
    in vec3 a_position;
    uniform vec3 u_eye;
    uniform vec3 u_forward;
    uniform vec3 u_right;
    uniform vec3 u_up;
    uniform vec2 u_viewport;
    uniform vec2 u_screenOrigin;
    uniform float u_focal;
    uniform float u_planMode;
    uniform vec2 u_planCentre;
    uniform vec2 u_planRotation;
    uniform float u_planScale;
    uniform float u_near;
    uniform float u_far;
    uniform float u_pointSize;
    out highp vec2 v_worldXY;
    void main() {
      v_worldXY = a_position.xy;
      if (u_planMode > 0.5) {
        // Match PLAN's Canvas projection exactly, without CPU footprint passes.
        vec2 offset = a_position.xy - u_planCentre;
        vec2 rotated = vec2(
          offset.x * u_planRotation.x - offset.y * u_planRotation.y,
          offset.x * u_planRotation.y + offset.y * u_planRotation.x
        ) * u_planScale;
        vec2 screen = u_screenOrigin + vec2(rotated.x, -rotated.y);
        // Higher roofs are closer to the top-down camera; preserve depth.
        float depth = clamp(-a_position.z / 1000.0, -1.0, 1.0);
        gl_Position = vec4(2.0 * screen.x / u_viewport.x - 1.0,
          1.0 - 2.0 * screen.y / u_viewport.y, depth, 1.0);
        gl_PointSize = u_pointSize;
        return;
      }
      vec3 relative = a_position - u_eye;
      float depth = dot(relative, u_forward);
      // Clip homogeneous geometry at the near plane. Sending individual
      // vertices behind the camera to a fake screen position creates
      // horizon-following giant triangles at grazing camera angles.
      float ndcX = ((2.0 * u_screenOrigin.x / u_viewport.x) - 1.0) * depth
                 + 2.0 * dot(relative, u_right) * u_focal / u_viewport.x;
      float ndcY = (1.0 - 2.0 * u_screenOrigin.y / u_viewport.y) * depth
                 + 2.0 * dot(relative, u_up) * u_focal / u_viewport.y;
      float a = (u_far + u_near) / (u_far - u_near);
      float b = (-2.0 * u_far * u_near) / (u_far - u_near);
      gl_Position = vec4(ndcX, ndcY, a * depth + b, depth);
      gl_PointSize = u_pointSize;
    }
  `);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
    precision highp float;
    uniform vec4 u_colour;
    uniform vec4 u_edgeBounds; // min X, max X, min Y, max Y (local metres)
    uniform float u_edgeFadeMetres;
    uniform float u_fadeEast;
    in highp vec2 v_worldXY;
    out vec4 outColor;
    void main() {
      float alpha = u_colour.a;
      if (u_edgeFadeMetres > 0.0) {
        // Fade the *geometry*, not a dark rectangle laid over the scene.
        // Interpolating world coordinates gives a smooth result through every
        // triangle, road strip and building edge regardless of camera angle.
        float edgeDistance = min(
          min(v_worldXY.x - u_edgeBounds.x, (u_fadeEast > 0.5 ? u_edgeBounds.y - v_worldXY.x : 1.0e9)),
          min(v_worldXY.y - u_edgeBounds.z, u_edgeBounds.w - v_worldXY.y)
        );
        alpha *= smoothstep(0.0, u_edgeFadeMetres, edgeDistance);
      }
      if (alpha <= 0.001) discard;
      outColor = vec4(u_colour.rgb, alpha);
    }
  `);
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create WebGL program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const detail = gl.getProgramInfoLog(program) || 'unknown link error';
    gl.deleteProgram(program);
    throw new Error(detail);
  }
  const uniform = (name: string) => {
    const value = gl.getUniformLocation(program, name);
    if (!value) throw new Error(`Missing WebGL uniform ${name}`);
    return value;
  };
  return {
    program,
    position: gl.getAttribLocation(program, 'a_position'),
    uniforms: {
      eye: uniform('u_eye'), forward: uniform('u_forward'), right: uniform('u_right'), up: uniform('u_up'),
      viewport: uniform('u_viewport'), screenOrigin: uniform('u_screenOrigin'), focal: uniform('u_focal'),
      planMode: uniform('u_planMode'), planCentre: uniform('u_planCentre'),
      planRotation: uniform('u_planRotation'), planScale: uniform('u_planScale'),
      near: uniform('u_near'), far: uniform('u_far'), colour: uniform('u_colour'), pointSize: uniform('u_pointSize'),
      edgeBounds: uniform('u_edgeBounds'), edgeFadeMetres: uniform('u_edgeFadeMetres'), fadeEast: uniform('u_fadeEast'),
    },
  };
}

function cityFeatureBounds(city: WebGLCityBundle): WebGLCityBundle['bounds'] {
  // The coastline layer intentionally extends farther east than buildings.
  // Fade sourced buildings/roads at their own limit and land at its limit.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const include = ([x, y]: Point2) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  };
  for (const building of city.buildings) {
    if (building.roadConflict) continue;
    for (const point of building.footprint) include(point);
  }
  for (const road of city.roads ?? []) {
    for (const point of road.points) include(point);
  }
  return Number.isFinite(minX) && minX < maxX && minY < maxY
    ? { minX, maxX, minY, maxY }
    : city.bounds;
}

function upload(gl: WebGL2RenderingContext, data: number[]): DrawBuffer | null {
  if (!data.length) return null;
  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return { buffer, count: data.length / 3 };
}

export type CityWebGLRenderer = {
  setCity(city: WebGLCityBundle): void;
  resize(width: number, height: number, dpr: number): void;
  renderSkyline(camera: WebGLCamera, viewport: WebGLViewport, layers: CityRenderSettings): void;
  renderPlan(camera: WebGLCamera, viewport: WebGLViewport, plan: WebGLPlan, layers: CityRenderSettings): void;
  dispose(): void;
};

export function createCityWebGLRenderer(canvas: HTMLCanvasElement): CityWebGLRenderer | null {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return null;

  let info: ProgramInfo;
  try {
    info = createProgram(gl);
  } catch (error) {
    console.warn('Fireworks city WebGL renderer unavailable:', error);
    return null;
  }

  let landFill: DrawBuffer | null = null;
  let buildingFill: DrawBuffer | null = null;
  let structureFill: DrawBuffer | null = null;
  let buildingEdges: DrawBuffer | null = null;
  let landmarkEdges: DrawBuffer | null = null;
  const individualLandmarkEdges = new Map<string, DrawBuffer>();
  let namedBuildingFill: DrawBuffer | null = null;
  let namedBuildingEdges: DrawBuffer | null = null;
  let roadMajor: DrawBuffer | null = null;
  let roadMinor: DrawBuffer | null = null;
  let roadTunnel: DrawBuffer | null = null;
  let roadEdges: DrawBuffer | null = null;
  let roadLanes: DrawBuffer | null = null;
  let junctions: DrawBuffer | null = null;
  let signals: DrawBuffer | null = null;
  let crossings: DrawBuffer | null = null;
  let allBuffers: DrawBuffer[] = [];
  let sceneBounds: WebGLCityBundle['bounds'] = undefined;
  let featureBounds: WebGLCityBundle['bounds'] = undefined;

  const clearBuffers = () => {
    for (const item of allBuffers) gl.deleteBuffer(item.buffer);
    allBuffers = [];
    individualLandmarkEdges.clear();
    landFill = buildingFill = structureFill = buildingEdges = landmarkEdges = namedBuildingFill = namedBuildingEdges = roadMajor = roadMinor = roadTunnel = roadEdges = roadLanes = null;
    junctions = signals = crossings = null;
  };

  const setCity = (city: WebGLCityBundle) => {
    clearBuffers();
    // No fade for calibration data that does not declare a reliable extent.
    sceneBounds = city.bounds;
    featureBounds = cityFeatureBounds(city);
    const landTriangles: number[] = [];
    for (const triangle of city.land?.triangles ?? []) {
      if (triangle.length !== 3) continue;
      for (const [x, y] of triangle) pushVertex(landTriangles, x, y, -.35);
    }
    const buildingTriangles: number[] = [];
    const namedTriangles: number[] = [];
    const namedLines: number[] = [];
    const towerTriangles: number[] = [];
    const buildingLines: number[] = [];
    const towerLines: number[] = [];
    const majorTriangles: number[] = [];
    const minorTriangles: number[] = [];
    const tunnelTriangles: number[] = [];
    const roadLineVertices: number[] = [];
    const laneVertices: number[] = [];
    const junctionVertices: number[] = [];
    const signalVertices: number[] = [];
    const crossingVertices: number[] = [];
    const individualLandmarkVertices = new Map<string, number[]>();

    const authored = city.structures ?? [];
    const selectedIds = new Set(cityLandmarks(city.city?.id ?? '', city.buildings, authored).filter(l => l.source === 'overture').map(l => l.id));
    for (const building of city.buildings) {
      if (building.roadConflict || building.footprint.length < 3 || overlapsAuthoredLandmark(building, authored)) continue;
      const fillTarget = selectedIds.has(building.id) ? namedTriangles : buildingTriangles;
      const lineTarget = selectedIds.has(building.id) ? namedLines : buildingLines;
      const firstLandmarkLine = lineTarget.length;
      const baseZ = building.minHeightM ?? 0;
      const roofZ = building.heightM;
      // Normalise footprints to counter-clockwise winding so the GPU can
      // safely back-face-cull opaque building triangles. This removes hidden
      // fragments without changing any source vertices or visible resolution.
      const footprint = polygonArea(building.footprint) < 0
        ? [...building.footprint].reverse()
        : building.footprint;
      for (let index = 0; index < footprint.length; index += 1) {
        const [x1, y1] = footprint[index];
        const [x2, y2] = footprint[(index + 1) % footprint.length];
        const a = { x: x1, y: y1, z: baseZ };
        const b = { x: x2, y: y2, z: baseZ };
        const c = { x: x2, y: y2, z: roofZ };
        const d = { x: x1, y: y1, z: roofZ };
        pushTriangle(fillTarget, a, b, c);
        pushTriangle(fillTarget, a, c, d);
        pushLine(lineTarget, d, c);
        pushLine(lineTarget, a, d);
        if (baseZ > 0.01) pushLine(lineTarget, a, b);
      }
      if (selectedIds.has(building.id)) individualLandmarkVertices.set(building.id, lineTarget.slice(firstLandmarkLine));
      const triangles = triangulatePolygon(footprint);
      for (let index = 0; index < triangles.length; index += 3) {
        const p0 = footprint[triangles[index]];
        const p1 = footprint[triangles[index + 1]];
        const p2 = footprint[triangles[index + 2]];
        pushTriangle(fillTarget,
          { x: p0[0], y: p0[1], z: roofZ },
          { x: p1[0], y: p1[1], z: roofZ },
          { x: p2[0], y: p2[1], z: roofZ });
      }
    }

    // Authored harbour geometry shares the same GPU depth buffer as sourced
    // buildings. A Canvas overlay made it shine through towers and caused
    // near-camera/horizon artefacts, especially on the Opera House shells.
    const addQuad = (a: Vec3, b: Vec3, c: Vec3, d: Vec3, target = towerTriangles) => {
      pushTriangle(target, a, b, c);
      pushTriangle(target, a, c, d);
    };
    const addSolidPrism = (footprint: Point2[], low: number, high: number) => {
      for (let i = 0; i < footprint.length; i++) {
        const [x, y] = footprint[i], [nx, ny] = footprint[(i + 1) % footprint.length];
        const a = { x, y, z: low }, b = { x: nx, y: ny, z: low };
        const c = { x: nx, y: ny, z: high }, d = { x, y, z: high };
        addQuad(a, b, c, d);
        pushLine(towerLines, d, c);
        pushLine(towerLines, a, d);
      }
      const tris = triangulatePolygon(footprint);
      for (let i = 0; i < tris.length; i += 3) {
        const a = footprint[tris[i]], b = footprint[tris[i + 1]], c = footprint[tris[i + 2]];
        pushTriangle(towerTriangles, { x: a[0], y: a[1], z: high },
          { x: b[0], y: b[1], z: high }, { x: c[0], y: c[1], z: high });
      }
    };
    for (const structure of city.structures ?? []) {
      if (structure.type !== 'arch-bridge' && structure.type !== 'opera-house') continue;
      const firstLandmarkLine = towerLines.length;
      const heading = (structure.rotationDeg ?? 0) * Math.PI / 180;
      const toWorld = (x: number, y: number, z: number): Vec3 => ({
        x: structure.x + x * Math.cos(heading) - y * Math.sin(heading),
        y: structure.y + x * Math.sin(heading) + y * Math.cos(heading), z,
      });
      const mapped = (points: Point2[]) => points.map(([x, y]) => {
        const p = toWorld(x, y, 0);
        return [p.x, p.y] as Point2;
      });
      if (structure.type === 'arch-bridge') {
        const half = (structure.spanM ?? 503) / 2;
        const deckZ = 49;
        addSolidPrism(mapped([[-25, -half * 1.23], [25, -half * 1.23],
          [25, half * 1.23], [-25, half * 1.23]]), deckZ - 8, deckZ);
        for (const y of [-half * 1.14, half * 1.14]) {
          for (const x of [-29, 29]) {
            addSolidPrism(mapped([[x-7, y-12], [x+7, y-12], [x+7, y+12], [x-7, y+12]]),
              0, structure.pylonHeightM ?? 89);
          }
        }
        const upper = (t: number) => structure.heightM - 68 * t * t;
        const lower = (t: number) => upper(t) - (18 + 39 * t * t);
        for (const x of [-20, 20]) {
          for (let i = 0; i < 28; i++) {
            const t0 = -1 + i / 14, t1 = -1 + (i + 1) / 14;
            const y0 = t0 * half, y1 = t1 * half;
            const a = toWorld(x, y0, lower(t0)), b = toWorld(x, y1, lower(t1));
            const c = toWorld(x, y1, upper(t1)), d = toWorld(x, y0, upper(t0));
            addQuad(a, b, c, d);
            pushLine(towerLines, a, b); pushLine(towerLines, d, c);
            pushLine(towerLines, a, d);
            pushLine(towerLines, i % 2 ? a : d, i % 2 ? c : b);
            if (i % 2 === 0) pushLine(towerLines, a, c);
          }
        }
        for (let i = 0; i <= 28; i += 2) {
          const t = -1 + i / 14, y = t * half;
          pushLine(towerLines, toWorld(-20, y, upper(t)), toWorld(20, y, upper(t)));
          if (lower(t) > deckZ + 1) {
            for (const x of [-20, 20]) pushLine(towerLines, toWorld(x, y, deckZ), toWorld(x, y, lower(t)));
          }
        }
      } else {
        const width = structure.widthM ?? 120, depth = structure.depthM ?? 185;
        addSolidPrism(mapped([[-width*.53, -depth*.5], [width*.53, -depth*.5],
          [width*.49, depth*.3], [width*.38, depth*.5],
          [-width*.38, depth*.5], [-width*.49, depth*.3]]), 0, 7);
        const shells = [
          [-27,-47,structure.heightM-7,52,48,-9,7,-4],
          [-20,-18,53,46,44,7,5,-2], [-13,9,43,39,39,-5,3,0],
          [24,-42,50,46,45,8,5,4], [29,-13,43,40,40,-6,3,5],
          [33,14,35,34,35,5,2,6], [-15,52,29,31,30,-4,1,9],
          [18,55,25,28,27,4,1,10],
        ];
        for (const [x, y, h, w, run, lean, sweep, deg] of shells) {
          const shell = (u: number, t: number): Vec3 => {
            const rise = Math.sin(t * Math.PI * .5);
            const side = u * 2 - 1;
            const halfWidth = w * Math.pow(Math.max(0, 1-t), .66);
            const arc = Math.sqrt(Math.max(0, 1-(Math.abs(side)*.92)**2));
            const sx = side * halfWidth * .5 + lean * rise**1.2;
            const sy = (t-.44)*run + sweep*Math.sin(t*Math.PI);
            const sa = deg * Math.PI / 180;
            return toWorld(x + sx*Math.cos(sa)-sy*Math.sin(sa), y + sx*Math.sin(sa)+sy*Math.cos(sa),
              7 + h * rise**.82 - h * .42 * (1-arc) * rise**.9);
          };
          for (let i=0; i<16; i++) {
            for (let j=0; j<6; j++) {
              const t0=i/16,t1=(i+1)/16,u0=j/6,u1=(j+1)/6;
              addQuad(shell(u0,t0), shell(u1,t0), shell(u1,t1), shell(u0,t1));
            }
          }
          for (const u of [0,1/6,2/6,3/6,4/6,5/6,1]) {
            for (let i=0; i<16; i++) pushLine(towerLines,shell(u,i/16),shell(u,(i+1)/16));
          }
          for (const t of [.18,.36,.54,.72,.9]) {
            for (let i=0;i<6;i++) pushLine(towerLines,shell(i/6,t),shell((i+1)/6,t));
          }
        }
      }
      individualLandmarkVertices.set(structure.id, towerLines.slice(firstLandmarkLine));
    }

    // Render the authored Sydney observation tower in the same WebGL depth
    // buffer as the surrounding buildings. Canvas overlay would always appear
    // in front, making its cylindrical observation deck look detached.
    for (const tower of city.structures ?? []) {
      if (tower.type !== 'observation-tower') continue;
      const firstLandmarkLine = towerLines.length;
      const x = tower.x, y = tower.y, groundZ = tower.z ?? 0;
      const pod = groundZ + (tower.podHeightM ?? tower.heightM * .84);
      const summit = groundZ + tower.heightM;
      const addPrism = (footprint: Point2[], low: number, high: number) => {
        for (let i = 0; i < footprint.length; i += 1) {
          const [x1, y1] = footprint[i];
          const [x2, y2] = footprint[(i + 1) % footprint.length];
          const a = { x: x1, y: y1, z: low }, b = { x: x2, y: y2, z: low };
          const c = { x: x2, y: y2, z: high }, d = { x: x1, y: y1, z: high };
          pushTriangle(towerTriangles, a, b, c);
          pushTriangle(towerTriangles, a, c, d);
          pushLine(towerLines, d, c);
          pushLine(towerLines, a, d);
        }
        const triangles = triangulatePolygon(footprint);
        for (let i = 0; i < triangles.length; i += 3) {
          const a = footprint[triangles[i]], b = footprint[triangles[i + 1]], c = footprint[triangles[i + 2]];
          pushTriangle(towerTriangles, { x: a[0], y: a[1], z: high },
            { x: b[0], y: b[1], z: high }, { x: c[0], y: c[1], z: high });
        }
      };
      addPrism([[x-5,y-5], [x+5,y-5], [x+5,y+5], [x-5,y+5]], groundZ, pod);
      const deck: Point2[] = Array.from({ length: 16 }, (_, i) => {
        const angle = i * Math.PI / 8;
        return [x + 21 * Math.cos(angle), y + 21 * Math.sin(angle)];
      });
      addPrism(deck, pod - 10, pod + 10);
      pushLine(towerLines, { x, y, z: pod + 10 }, { x, y, z: summit });
      individualLandmarkVertices.set(tower.id, towerLines.slice(firstLandmarkLine));
    }

    for (const road of city.roads ?? []) {
      if (road.points.length < 2) continue;
      const z = road.onType === 'bridge' ? .65 : road.onType === 'tunnel' ? .05 : .16;
      const target = road.onType === 'tunnel'
        ? tunnelTriangles
        : ((road.laneCountExact ?? 0) >= 4 || (road.functionHierarchy ?? 99) <= 2 ? majorTriangles : minorTriangles);
      for (let index = 0; index < road.points.length - 1; index += 1) {
        const [x1, y1] = road.points[index];
        const [x2, y2] = road.points[index + 1];
        const dx = x2 - x1, dy = y2 - y1;
        const length = Math.hypot(dx, dy);
        if (length < .01) continue;
        const half = Math.max(.5, road.displayWidthM / 2);
        const nx = -dy / length * half;
        const ny = dx / length * half;
        const a = { x: x1 + nx, y: y1 + ny, z };
        const b = { x: x2 + nx, y: y2 + ny, z };
        const c = { x: x2 - nx, y: y2 - ny, z };
        const d = { x: x1 - nx, y: y1 - ny, z };
        pushTriangle(target, a, b, c);
        pushTriangle(target, a, c, d);
        pushLine(roadLineVertices, { ...a, z: z + .025 }, { ...b, z: z + .025 });
        pushLine(roadLineVertices, { ...d, z: z + .025 }, { ...c, z: z + .025 });
        if ((road.laneCountExact ?? 0) >= 2) {
          pushLine(laneVertices, { x: x1, y: y1, z: z + .035 }, { x: x2, y: y2, z: z + .035 });
        }
      }
    }

    for (const item of city.transportPoints ?? []) {
      const target = item.type === 'traffic-signal' ? signalVertices : item.type === 'crossing' ? crossingVertices : junctionVertices;
      pushVertex(target, item.x, item.y, item.z ?? .4);
    }

    const track = (item: DrawBuffer | null) => {
      if (item) allBuffers.push(item);
      return item;
    };
    landFill = track(upload(gl, landTriangles));
    buildingFill = track(upload(gl, buildingTriangles));
    structureFill = track(upload(gl, towerTriangles));
    namedBuildingFill = track(upload(gl, namedTriangles));
    namedBuildingEdges = track(upload(gl, namedLines));
    buildingEdges = track(upload(gl, buildingLines));
    landmarkEdges = track(upload(gl, towerLines));
    for (const [id, vertices] of individualLandmarkVertices) {
      const buffer = track(upload(gl, vertices));
      if (buffer) individualLandmarkEdges.set(id, buffer);
    }
    roadMajor = track(upload(gl, majorTriangles));
    roadMinor = track(upload(gl, minorTriangles));
    roadTunnel = track(upload(gl, tunnelTriangles));
    roadEdges = track(upload(gl, roadLineVertices));
    roadLanes = track(upload(gl, laneVertices));
    junctions = track(upload(gl, junctionVertices));
    signals = track(upload(gl, signalVertices));
    crossings = track(upload(gl, crossingVertices));
  };

  const resize = (width: number, height: number, dpr: number) => {
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  };

  const bind = (item: DrawBuffer | null, mode: number, colour: [number, number, number, number], pointSize = 1) => {
    if (!item) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, item.buffer);
    gl.enableVertexAttribArray(info.position);
    gl.vertexAttribPointer(info.position, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(info.uniforms.colour, colour);
    gl.uniform1f(info.uniforms.pointSize, pointSize);
    gl.drawArrays(mode, 0, item.count);
  };

  const renderScene = (camera: WebGLCamera, viewport: WebGLViewport, layers: CityRenderSettings, plan?: WebGLPlan) => {
    const forward = normalise(subtract(camera.target, camera.eye));
    // Maintain the same world-up frame at every elevation. Changing the
    // reference axis near vertical used to abruptly flip the whole city.
    // SKYLINE pitch is limited below 90 degrees so this cross stays defined.
    const baseRight = normalise(cross(forward, { x: 0, y: 0, z: 1 }));
    const baseUp = normalise(cross(baseRight, forward));
    const cr = Math.cos(camera.rollRad), sr = Math.sin(camera.rollRad);
    const right = { x: baseRight.x * cr + baseUp.x * sr, y: baseRight.y * cr + baseUp.y * sr, z: baseRight.z * cr + baseUp.z * sr };
    const up = { x: baseUp.x * cr - baseRight.x * sr, y: baseUp.y * cr - baseRight.y * sr, z: baseUp.z * cr - baseRight.z * sr };

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(info.program);
    gl.uniform3f(info.uniforms.eye, camera.eye.x, camera.eye.y, camera.eye.z);
    gl.uniform3f(info.uniforms.forward, forward.x, forward.y, forward.z);
    gl.uniform3f(info.uniforms.right, right.x, right.y, right.z);
    gl.uniform3f(info.uniforms.up, up.x, up.y, up.z);
    gl.uniform2f(info.uniforms.viewport, viewport.width, viewport.height);
    gl.uniform2f(info.uniforms.screenOrigin, viewport.skylineScreenX, viewport.skylineHorizonY);
    gl.uniform1f(info.uniforms.focal, viewport.skylineFocalPx);
    gl.uniform1f(info.uniforms.planMode, plan ? 1 : 0);
    gl.uniform2f(info.uniforms.planCentre, plan?.centreX ?? 0, plan?.centreY ?? 0);
    gl.uniform2f(info.uniforms.planRotation, Math.cos(plan?.rotationRad ?? 0), Math.sin(plan?.rotationRad ?? 0));
    gl.uniform1f(info.uniforms.planScale, plan?.scale ?? 1);
    gl.uniform1f(info.uniforms.near, 8);
    gl.uniform1f(info.uniforms.far, 20000);
    const setFadeBounds = (bounds: WebGLCityBundle['bounds'], fadeMetres: number, fadeEast = true) => {
      gl.uniform4f(info.uniforms.edgeBounds,
        bounds?.minX ?? 0, bounds?.maxX ?? 0, bounds?.minY ?? 0, bounds?.maxY ?? 0);
      const valid = Boolean(bounds && bounds.maxX > bounds.minX && bounds.maxY > bounds.minY);
      gl.uniform1f(info.uniforms.edgeFadeMetres, valid ? fadeMetres : 0);
      gl.uniform1f(info.uniforms.fadeEast, fadeEast ? 1 : 0);
    };

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Existing opacity defines the scene's appearance; user transparency
    // scales it without rebuilding the sizeable GPU buffers.
    const withOpacity = (colour: [number, number, number, number], layer: CityLayerKey): [number, number, number, number] =>
      [colour[0], colour[1], colour[2], colour[3] * layers.opacity[layer]];
    const drawLayer = (item: DrawBuffer | null, mode: number, colour: [number, number, number, number], layer: CityLayerKey, size = 1) => {
      if (layers.opacity[layer] > 0) bind(item, mode, withOpacity(colour, layer), size);
    };

    gl.disable(gl.CULL_FACE);
    // Dissolve artificial west/north/south map cuts completely to the black
    // background. Keep the actual eastern shoreline crisp against the ocean.
    setFadeBounds(sceneBounds ?? featureBounds, LAND_EDGE_FADE_METRES, false);
    drawLayer(landFill, gl.TRIANGLES, LAND_FILL, 'land');
    setFadeBounds(featureBounds ?? sceneBounds, CITY_EDGE_FADE_METRES);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);
    gl.disable(gl.CULL_FACE);
    drawLayer(roadTunnel, gl.TRIANGLES, ROAD_TUNNEL, 'roads');
    drawLayer(roadMinor, gl.TRIANGLES, ROAD_MINOR, 'roads');
    drawLayer(roadMajor, gl.TRIANGLES, ROAD_MAJOR, 'roads');
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    drawLayer(buildingFill, gl.TRIANGLES, BUILDING_FILL, 'buildings');
    drawLayer(namedBuildingFill, gl.TRIANGLES, BUILDING_FILL, 'structures');
    gl.disable(gl.CULL_FACE); // schematic shell/arch panels are two-sided
    drawLayer(structureFill, gl.TRIANGLES, BUILDING_FILL, 'structures');
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.POLYGON_OFFSET_FILL);

    drawLayer(roadEdges, gl.LINES, ROAD_EDGE, 'roads');
    drawLayer(roadLanes, gl.LINES, ROAD_LANE, 'roads');
    drawLayer(buildingEdges, gl.LINES, BUILDING_EDGE, 'buildings');
    drawLayer(namedBuildingEdges, gl.LINES, layers.highlight ? LANDMARK_EDGE : BUILDING_EDGE, 'structures');
    drawLayer(landmarkEdges, gl.LINES, layers.highlight ? LANDMARK_EDGE : BUILDING_EDGE, 'structures');
    // Small selected/hovered line buffers share the normal city depth test.
    // No duplicate full-building pass, so foreground buildings still occlude them.
    if (layers.highlight && layers.opacity.structures > 0 && layers.landmarkAccents?.length) {
      gl.depthMask(false);
      for (const accent of layers.landmarkAccents) {
        const colour = accent.type === 'selected' ? LANDMARK_SELECTED_EDGE : LANDMARK_HOVER_EDGE;
        const alpha = colour[3] * Math.max(0, Math.min(1, accent.strength));
        if (alpha > .004) bind(individualLandmarkEdges.get(accent.id) ?? null, gl.LINES,
          [colour[0], colour[1], colour[2], alpha * layers.opacity.structures]);
      }
      gl.depthMask(true);
    }
    drawLayer(junctions, gl.POINTS, JUNCTION, 'roads', 2.1 * viewport.dpr);
    drawLayer(crossings, gl.POINTS, CROSSING, 'roads', 2.4 * viewport.dpr);
    drawLayer(signals, gl.POINTS, SIGNAL, 'roads', 3.0 * viewport.dpr);
  };

  const renderSkyline = (camera: WebGLCamera, viewport: WebGLViewport, layers: CityRenderSettings) =>
    renderScene(camera, viewport, layers);
  const renderPlan = (camera: WebGLCamera, viewport: WebGLViewport, plan: WebGLPlan, layers: CityRenderSettings) =>
    renderScene(camera, viewport, layers, plan);

  const dispose = () => {
    clearBuffers();
    gl.deleteProgram(info.program);
  };

  return { setCity, resize, renderSkyline, renderPlan, dispose };
}
