/** Scene-derived landmark registry. No separate city assets or hard-coded local positions. */
export type Point2 = [number, number];
export type LandmarkBuilding = {
  id: string;
  name?: string | null;
  footprint: Point2[];
  heightM: number;
  minHeightM?: number;
  roadConflict?: boolean;
  heightSource?: string;
};
export type LandmarkStructure = {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  z?: number;
  heightM: number;
  spanM?: number;
  widthM?: number;
  depthM?: number;
  rotationDeg?: number;
};
export type Landmark = {
  id: string;
  name: string;
  source: 'authored' | 'overture' | 'overture-group';
  category: 'ICONS' | 'TOWERS' | 'HISTORY' | 'CULTURE' | 'SPORT';
  heightComparable: boolean;
  memberIds?: string[];
  centre: { x: number; y: number; z: number };
  widthM: number;
  depthM: number;
  heightM: number;
};

// A curated *open-ended* registry of actual Overture names, not the first N tall
// buildings. A name is shown only when its footprint is present in the bundle.
// Historic and cultural landmarks remain viewable even if their height was a
// 3.2 m/floor estimate or the renderer's generic 18 m fallback.
export const SYDNEY_LANDMARK_GROUPS = {
  TOWERS: [
    'Salesforce Tower', '25 Martin Place', 'Governor Phillip Tower',
    'Australia Square', 'Grosvenor Place', '8 Chifley', 'Citigroup Centre',
    'Gateway at 1 Macquarie Place', '1 Denison', '88 Walker', '55 Pitt',
    'Deutsche Bank Plaza', 'Quay West Apartments', 'One Central Park East',
    'Atlassian Central', 'Governor Macquarie Tower', 'Horizon Apartments',
    'Shangri-La Hotel', 'Brookfield Place', 'Lùmiere Residences',
    'Quay Quarter Tower', 'Parkline Place', '39 Martin Place',
    'Darling Park - Tower 1', 'Darling Park - Tower 2', 'Darling Park - Tower 3',
    'AWA Tower', 'Blues Point Tower', 'Aspect Tower', 'Sydney Central (North Tower)',
    'AON Tower', 'Commonwealth Bank North Tower', 'Commonwealth Bank South Tower',
  ],
  HISTORY: [
    'Sydney Town Hall', 'Queen Victoria Building', 'Hyde Park Barracks',
    'Customs House', "St Mary's Cathedral", 'St Andrews Cathedral',
    'State Library of New South Wales', 'Mitchell Library', 'Sydney Observatory',
    'State Theatre Building', 'Grace Hotel', 'The Gunners Barracks',
    'Australian Hotel', 'Central Clocktower', 'Pyrmont Bridge Control Tower',
    'Paddington Town Hall', 'Glebe Town Hall', 'Glebe Court House',
  ],
  CULTURE: [
    'Powerhouse Museum', 'Museum of Sydney', 'Australian National Maritime Museum',
    'Chau Chak Wing Museum', 'SEA LIFE Sydney Aquarium', 'Roslyn Packer Theatre',
    'Phoenix Central Park', 'White Rabbit Gallery', 'Sydney Fish Market',
    "Central Station's Chalmers Street entrance", 'Barangaroo House',
    'Hordern Pavilion', 'Taronga Zoo Entrance Plaza',
  ],
  SPORT: [
    "Members' Stand", 'Brewongle Stand', "Bill O'Reilly Stand",
    'Clive Churchill Stand', 'Victor Trumper Stand', "Ladies' Stand", 'Messenger Stand',
  ],
} as const;

const SCG_STANDS = new Set<string>(SYDNEY_LANDMARK_GROUPS.SPORT);

export function footprintCentre(footprint: Point2[]) {
  return {
    x: footprint.reduce((sum, point) => sum + point[0], 0) / footprint.length,
    y: footprint.reduce((sum, point) => sum + point[1], 0) / footprint.length,
  };
}

// Overture's detailed Opera House roof parts and Harbour Bridge pylons overlap
// the schematic authored models. Suppress those duplicate *rendered features*
// in both renderers; keep all source data intact in the published bundle.
export function overlapsAuthoredLandmark(building: LandmarkBuilding, structures: LandmarkStructure[]): boolean {
  if (building.footprint.length < 3) return false;
  const centre = footprintCentre(building.footprint);
  for (const structure of structures) {
    if (structure.type === 'opera-house') {
      const a = (structure.rotationDeg ?? 0) * Math.PI / 180;
      const dx = centre.x - structure.x, dy = centre.y - structure.y;
      const x = dx * Math.cos(a) + dy * Math.sin(a);
      const y = -dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(x) < (structure.widthM ?? 120) * .56 && Math.abs(y) < (structure.depthM ?? 185) * .54) return true;
    }
    if (structure.type === 'arch-bridge') {
      const name = building.name ?? '';
      // The Overture pylons are explicit duplicates of the authored pylons.
      if (/^Sydney Harbour Bridge - .*Pylon$/i.test(name)) return true;
    }
  }
  return false;
}

export function cityLandmarks(cityId: string, buildings: LandmarkBuilding[], structures: LandmarkStructure[]): Landmark[] {
  const result: Landmark[] = structures.map((structure) => ({
    id: structure.id,
    name: structure.name,
    source: 'authored' as const,
    category: 'ICONS' as const,
    heightComparable: true,
    centre: { x: structure.x, y: structure.y, z: (structure.z ?? 0) + structure.heightM * .5 },
    widthM: structure.type === 'arch-bridge' ? (structure.widthM ?? 65) : (structure.widthM ?? 48),
    depthM: structure.type === 'arch-bridge' ? (structure.spanM ?? 503) * 1.25 : (structure.depthM ?? 48),
    heightM: structure.heightM,
  }));
  if (cityId !== 'sydney') return result;
  const byName = new Map<string, LandmarkBuilding>();
  const categories = Object.entries(SYDNEY_LANDMARK_GROUPS) as Array<[Landmark['category'], readonly string[]]>;
  const requested = new Set([...categories.flatMap(([, names]) => [...names]), 'Tower 1', 'Tower 2']);
  for (const building of buildings) {
    if (!building.name || !requested.has(building.name) || building.roadConflict ||
        overlapsAuthoredLandmark(building, structures) || building.footprint.length < 3) continue;
    const previous = byName.get(building.name);
    // Prefer the actual height, then the taller of equally sourced footprints.
    if (!previous ||
        (building.heightSource === 'overture-height' && previous.heightSource !== 'overture-height') ||
        (building.heightSource === previous.heightSource && building.heightM > previous.heightM)) {
      byName.set(building.name, building);
    }
  }
  const addBuilding = (building: LandmarkBuilding, name: string, category: Landmark['category']) => {
    const xs = building.footprint.map(p => p[0]);
    const ys = building.footprint.map(p => p[1]);
    const centre = footprintCentre(building.footprint);
    result.push({
      id: building.id, name, source: 'overture', category,
      heightComparable: building.heightSource === 'overture-height',
      centre: { ...centre, z: ((building.minHeightM ?? 0) + building.heightM) * .5 },
      widthM: Math.max(4, Math.max(...xs) - Math.min(...xs)),
      depthM: Math.max(4, Math.max(...ys) - Math.min(...ys)),
      heightM: building.heightM,
    });
  };
  // Crown Sydney is an unnamed Overture building in this release. Only use
  // the exact observed footprint ID if its 271 m height and proximity to the
  // independently named 247 m Barangaroo Tower 1 are still consistent. This
  // deliberately fails closed rather than relabelling an arbitrary tower.
  const crown = buildings.find(b => b.id === 'eb9f7209-547b-3888-973f-1866de7ca6e3' && b.heightM >= 270 && b.heightM <= 273 && b.heightSource === 'overture-height' && b.footprint.length >= 3);
  const barangarooTower = byName.get('Tower 1');
  if (crown && barangarooTower) {
    const a = footprintCentre(crown.footprint), b = footprintCentre(barangarooTower.footprint);
    if (Math.hypot(a.x - b.x, a.y - b.y) < 300) addBuilding(crown, 'Crown Sydney (One Barangaroo)', 'ICONS');
  }
  // Explicitly named Barangaroo towers. Do not use unqualified 'Tower 1/2'
  // unless their heights and immediate Barangaroo proximity match this release.
  if (barangarooTower && barangarooTower.heightM === 247 && crown) {
    addBuilding(barangarooTower, 'One Sydney Harbour, Tower 1', 'TOWERS');
    const tower2 = byName.get('Tower 2') ?? buildings.find(b => b.name === 'Tower 2');
    if (tower2 && tower2.heightM === 230 && tower2.footprint.length >= 3) {
      const a = footprintCentre(tower2.footprint), b = footprintCentre(crown.footprint);
      if (Math.hypot(a.x - b.x, a.y - b.y) < 300) addBuilding(tower2, 'One Sydney Harbour, Tower 2', 'TOWERS');
    }
  }
  for (const [category, names] of categories) {
    for (const name of names) {
      if (SCG_STANDS.has(name)) continue;
      const building = byName.get(name);
      if (building) addBuilding(building, name, category);
    }
  }
  // SCG has no single named stadium footprint in the Overture export. A
  // group of geographically verified, source-named stands provides one camera
  // target and one selection highlight without inventing stadium geometry.
  const stands = [...SCG_STANDS].map(n => byName.get(n)).filter((b): b is LandmarkBuilding => !!b);
  if (stands.length >= 4) {
    const points = stands.flatMap(b => b.footprint);
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const bounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    if (bounds.maxX - bounds.minX < 500 && bounds.maxY - bounds.minY < 500) {
      const heightM = Math.max(...stands.map(b => b.heightM));
      result.push({
        id: 'scg-named-stands', name: 'Sydney Cricket Ground (SCG)',
        source: 'overture-group', category: 'SPORT', heightComparable: false,
        memberIds: stands.map(b => b.id),
        centre: { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2, z: heightM * .5 },
        widthM: bounds.maxX - bounds.minX, depthM: bounds.maxY - bounds.minY, heightM,
      });
    }
  }
  return result;
}
