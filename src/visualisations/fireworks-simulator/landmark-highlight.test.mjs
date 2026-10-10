// Run with: node --experimental-strip-types --test src/visualisations/fireworks-simulator/landmark-highlight.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { accentTypeForLandmark, smoothAccentStrength } from './landmark-highlight.ts';

test('hovering a second building does not deselect the first', () => {
  assert.equal(accentTypeForLandmark('tower', 'tower', 'bridge'), 'selected');
  assert.equal(accentTypeForLandmark('bridge', 'tower', 'bridge'), 'hover');
  assert.equal(accentTypeForLandmark('house', 'tower', 'bridge'), null);
  assert.equal(accentTypeForLandmark('bridge', 'bridge', 'bridge'), 'selected');
});

test('replacing the selected landmark removes its selected state', () => {
  assert.equal(accentTypeForLandmark('tower', 'bridge', null), null);
  assert.equal(accentTypeForLandmark('bridge', 'bridge', null), 'selected');
});

test('manual camera interaction retains the selected accent and another hover does not replace it', () => {
  assert.equal(accentTypeForLandmark('tower', 'tower', null), 'selected');
  assert.equal(accentTypeForLandmark('bridge', 'tower', 'bridge'), 'hover');
  assert.equal(accentTypeForLandmark('tower', 'tower', 'bridge'), 'selected');
});

test('accent fade eases in and out without overshoot', () => {
  const first = smoothAccentStrength(0, 1, .016, false);
  const second = smoothAccentStrength(first, 1, .016, false);
  const reverse = smoothAccentStrength(second, 0, .016, false);
  assert.ok(first > 0 && first < second && second < 1);
  assert.ok(reverse > 0 && reverse < second);
  assert.equal(smoothAccentStrength(.45, 1, .016, true), 1);
  assert.equal(smoothAccentStrength(.45, 0, .016, true), 0);
});
