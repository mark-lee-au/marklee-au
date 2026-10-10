import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cityLandmarks, SYDNEY_LANDMARK_GROUPS, overlapsAuthoredLandmark } from './city-landmarks.ts';

const city = JSON.parse(readFileSync(new URL('../../../public/data/fireworks-simulator/sydney-city.json', import.meta.url), 'utf8'));
const landmarks = cityLandmarks(city.city.id, city.buildings, city.structures);

test('curated Sydney landmark registry includes dozens of sourced places without a fixed count cap', () => {
  assert.ok(landmarks.length >= 50, `Only ${landmarks.length} sourced landmarks`);
  assert.ok(SYDNEY_LANDMARK_GROUPS.HISTORY.includes('Sydney Town Hall'));
  for (const name of ['Sydney Town Hall', 'Queen Victoria Building', 'Hyde Park Barracks', 'Powerhouse Museum', 'Crown Sydney (One Barangaroo)', 'Sydney Cricket Ground (SCG)']) {
    assert.ok(landmarks.some(item => item.name === name), `${name} missing`);
  }
});

test('all selected landmarks have sourced footprints or existing authored geometry', () => {
  const buildings = new Set(city.buildings.map(b => b.id));
  const structures = new Set(city.structures.map(s => s.id));
  for (const item of landmarks) {
    assert.ok(item.widthM > 0 && item.depthM > 0 && item.heightM > 0, `Bad dimensions: ${item.name}`);
    const ids = item.memberIds ?? [item.id];
    assert.ok(ids.every(id => buildings.has(id) || structures.has(id)), `Missing source: ${item.name}`);
  }
  const scg = landmarks.find(item => item.name === 'Sydney Cricket Ground (SCG)');
  assert.ok(scg.memberIds.length >= 4);
  assert.equal(scg.heightComparable, false);
});

test('failing Crown spatial checks or missing named geometry does not manufacture landmarks', () => {
  const missing = cityLandmarks('sydney', [], []);
  assert.equal(missing.length, 0);
  assert.ok(landmarks.some(item => item.heightComparable));
  assert.ok(landmarks.some(item => !item.heightComparable));
});


test('authored Harbour Bridge centre follows the two sourced pylon pairs', () => {
  const bridge = city.structures.find(s => s.id === 'sydney-harbour-bridge');
  assert.deepEqual([bridge.x, bridge.y], [114, 239.5]);
  const pylonParts = city.buildings.filter(b => /^Sydney Harbour Bridge - .*Pylon$/i.test(b.name ?? ''));
  assert.equal(pylonParts.length, 4);
  const midpoints = pylonParts.map(b => ({
    x: b.footprint.reduce((total, p) => total + p[0], 0) / b.footprint.length,
    y: b.footprint.reduce((total, p) => total + p[1], 0) / b.footprint.length,
  }));
  const centre = midpoints.reduce((sum, p) => ({ x: sum.x + p.x / 4, y: sum.y + p.y / 4 }), { x: 0, y: 0 });
  assert.ok(Math.hypot(centre.x - bridge.x, centre.y - bridge.y) < 5);
});

test('both renderers suppress only verified Overture bridge pylon duplicates', () => {
  const bridge = city.structures.find(s => s.id === 'sydney-harbour-bridge');
  const ids = [
    '88d86b8e-0235-39e7-b118-6f71cb92961b',
    '2eeda083-a182-336a-a922-d99f7cac767f',
  ];
  for (const id of ids) {
    const building = city.buildings.find(b => b.id === id);
    assert.ok(building, `Missing sourced bridge volume ${id}`);
    assert.equal(building.heightM, 89);
    assert.equal(building.name ?? null, null);
    assert.equal(overlapsAuthoredLandmark(building, [bridge]), true, id);
    assert.equal(overlapsAuthoredLandmark({ ...building, heightM: 30 }, [bridge]), false, 'Other low-rise structure must remain');
    assert.equal(overlapsAuthoredLandmark({ ...building, footprint: building.footprint.map(([x,y]) => [x + 400,y]) }, [bridge]), false, 'Other-location building must remain');
  }
  const verifiedIds = new Set(ids);
  const suppressedUnnamed = city.buildings.filter(b => !b.name && overlapsAuthoredLandmark(b, [bridge]));
  assert.deepEqual(new Set(suppressedUnnamed.map(b => b.id)), verifiedIds);
  const webgl = readFileSync(new URL('./city-webgl.ts', import.meta.url), 'utf8');
  const canvas = readFileSync(new URL('./fireworks-simulator.ts', import.meta.url), 'utf8');
  assert.match(webgl, /overlapsAuthoredLandmark\(building, authored\)/);
  assert.match(canvas, /overlapsAuthoredLandmark\(building, city\?\.structures \?\? \[\]\)/);
});
