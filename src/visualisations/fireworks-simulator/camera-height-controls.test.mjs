// Run with: node --experimental-strip-types --test src/visualisations/fireworks-simulator/camera-height-controls.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { keyboardHeightMetresPerPixel, mouseHeightMetresPerWheelUnit } from './camera-height-controls.ts';

const previousKeyboardScale = distanceM => Math.max(.25, Math.min(8, distanceM * .0015)) * .75;
const previousMouseScale = distanceM => Math.max(.1, Math.min(.8, distanceM * .00022));

test('Q/E camera-height movement is 8–10 times slower across typical viewing distances', () => {
  for (const distanceM of [80, 120, 500, 1000, 2000, 5000]) {
    const next = keyboardHeightMetresPerPixel(distanceM);
    const ratio = previousKeyboardScale(distanceM) / next;
    assert.ok(ratio >= 7.49 && ratio <= 10.01, `${distanceM} m distance: ${ratio.toFixed(2)}x`);
  }
  // A one-second key hold with 460 CSS-pixel-equivalent input and a 2×
  // keyboard multiplier should cover a manageable distance at street level.
  assert.ok(keyboardHeightMetresPerPixel(120) * 460 * 2 < 20);
});

test('left-button wheel camera-height movement is about five times slower', () => {
  for (const distanceM of [80, 120, 500, 1000, 2000, 5000]) {
    const next = mouseHeightMetresPerWheelUnit(distanceM);
    const ratio = previousMouseScale(distanceM) / next;
    assert.ok(ratio >= 4.9 && ratio <= 5.6, `${distanceM} m distance: ${ratio.toFixed(2)}x`);
  }
  // Wheel inputs are normalised in the controller before this is applied.
  assert.equal(mouseHeightMetresPerWheelUnit(120) * 100, 2);
});

test('both height controls remain bounded without depending on the selected landmark', () => {
  for (const distanceM of [0, 1, 10, 10000, 1e6, NaN, Infinity]) {
    const key = keyboardHeightMetresPerPixel(distanceM);
    const wheel = mouseHeightMetresPerWheelUnit(distanceM);
    assert.ok(Number.isFinite(key) && key >= .01875 && key <= .75);
    assert.ok(Number.isFinite(wheel) && wheel >= .02 && wheel <= .16);
  }
});
