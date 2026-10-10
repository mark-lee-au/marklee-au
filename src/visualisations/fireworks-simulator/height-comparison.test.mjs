// Run with: node --experimental-strip-types --test src/visualisations/fireworks-simulator/height-comparison.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTargetHeightM, comparisonScaleMaxM, activeHeightLandmarkIndex, sortHeightLandmarks, targetHeightStepMForStreak, comparisonDisplayedHeightPx, heightAtlasLandmarks } from './height-comparison.ts';

const least = 0.25;
const most = 5000;

test('right-button wheel raises and lowers the target by the requested step size', () => {
  assert.equal(nextTargetHeightM(87, -1, least, most), 88);
  assert.equal(nextTargetHeightM(88, -1, least, most, 2), 90);
  assert.equal(nextTargetHeightM(90, 1, least, most, 5), 85);
  assert.equal(nextTargetHeightM(85, 1, least, most), 84);
});

test('height selection step ramps with a sustained scroll streak', () => {
  assert.equal(targetHeightStepMForStreak(0), 1);
  assert.equal(targetHeightStepMForStreak(9), 1);
  assert.equal(targetHeightStepMForStreak(10), 2);
  assert.equal(targetHeightStepMForStreak(19), 2);
  assert.equal(targetHeightStepMForStreak(20), 5);
  assert.equal(targetHeightStepMForStreak(29), 5);
  assert.equal(targetHeightStepMForStreak(30), 10);
  assert.equal(targetHeightStepMForStreak(300), 10);
});

test('height boundaries never overshoot', () => {
  assert.equal(nextTargetHeightM(5000, -1, least, most), 5000);
  assert.equal(nextTargetHeightM(5000, 1, least, most), 4999);
  assert.equal(nextTargetHeightM(0.25, 1, least, most), least);
  assert.equal(nextTargetHeightM(0.25, -1, least, most), 1);
});

test('comparison scale grows at high targets but shrinks again on descent', () => {
  assert.equal(comparisonScaleMaxM(5000, 340, 87, true), 5100);
  assert.equal(comparisonScaleMaxM(3000, 340, 87, true), 3100);
  assert.equal(comparisonScaleMaxM(300, 340, 5000, true), 600);
  assert.equal(comparisonScaleMaxM(100, 340, 5000, true), 600);
  assert.equal(comparisonScaleMaxM(100, 340, 5000, false), 5100);
});

test('active landmark changes in both directions after viewing the maximum', () => {
  const landmarks = sortHeightLandmarks([
    { id: 'tall', name: 'Tower', heightM: 309 },
    { id: 'short', name: 'House', heightM: 65 },
    { id: 'mid', name: 'Building', heightM: 134 },
  ]);
  assert.equal(activeHeightLandmarkIndex(landmarks, 5000), -1);
  assert.equal(activeHeightLandmarkIndex(landmarks, 250), 2);
  assert.equal(activeHeightLandmarkIndex(landmarks, 100), 1);
  assert.equal(activeHeightLandmarkIndex(landmarks, 50), 0);
  assert.equal(activeHeightLandmarkIndex(landmarks, 5000), -1);
});

test('inactive height atlas keeps identical source-scaled heights to active buildings', () => {
  assert.equal(comparisonDisplayedHeightPx(200, true), 200);
  assert.equal(comparisonDisplayedHeightPx(200, false), 200);
  assert.equal(comparisonDisplayedHeightPx(65, false), 65);
});

test('height comparison excludes unmeasured fallback heights without hiding their map labels', () => {
  const landmarks = [
    { name: 'Measured', id: 'm', heightM: 170, heightComparable: true },
    { name: 'Historic', id: 'h', heightM: 18, heightComparable: false },
  ];
  assert.deepEqual(heightAtlasLandmarks(landmarks).map(item => item.id), ['m']);
  assert.equal(landmarks.length, 2);
});
