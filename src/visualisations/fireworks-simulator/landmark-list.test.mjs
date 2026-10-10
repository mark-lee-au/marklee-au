import test from 'node:test';
import assert from 'node:assert/strict';
import { sortedLandmarkList, landmarkHeightLabel } from './landmark-list.ts';
const items = [
  { id: 'b', name: 'Bridge', category: 'ICONS', heightM: 100, heightComparable: true },
  { id: 'z', name: 'Z Tower', category: 'TOWERS', heightM: 270, heightComparable: true },
  { id: 'a', name: 'A Tower', category: 'TOWERS', heightM: 150, heightComparable: false },
  { id: 'c', name: 'Clock', category: 'HISTORY', heightM: 20, heightComparable: false },
];
test('ABC sorts across categories when Type is off', () => {
  assert.deepEqual(sortedLandmarkList(items, 'abc', false).map(x=>x.id), ['a','b','c','z']);
});
test('Height sorts descending across categories', () => {
  assert.deepEqual(sortedLandmarkList(items, 'height', false).map(x=>x.id), ['z','a','b','c']);
});
test('Type groups and then applies chosen sort inside each category', () => {
  assert.deepEqual(sortedLandmarkList(items, 'abc', true).map(x=>x.id), ['b','a','z','c']);
  assert.deepEqual(sortedLandmarkList(items, 'height', true).map(x=>x.id), ['b','z','a','c']);
});
test('Height labels distinguish fallback heights', () => {
  assert.equal(landmarkHeightLabel(items[0]), '100 m');
  assert.equal(landmarkHeightLabel(items[2]), '~150 m');
});
