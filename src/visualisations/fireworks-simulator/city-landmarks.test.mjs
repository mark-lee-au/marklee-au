import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cityLandmarks, SYDNEY_LANDMARK_GROUPS } from './city-landmarks.ts';

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
