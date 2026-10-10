// Run with: node --experimental-strip-types --test src/visualisations/fireworks-simulator/edge-drawer.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { clampEdgeDrawerTop } from './edge-drawer.ts';

test('the shared drawer cannot go above its top margin', () => {
  assert.equal(clampEdgeDrawerTop(-1000, 900, 280), 6);
  assert.equal(clampEdgeDrawerTop(0, 900, 280), 6);
});

test('dragging down stops at the panel-height limit even when the drawer is collapsed', () => {
  // A 280 px drawer with its tab centred is limited to 614 px at the bottom.
  // Using the tab's 60 px height here would incorrectly allow the tab offscreen.
  const top = clampEdgeDrawerTop(10000, 900, 280);
  assert.equal(top, 614);
  assert.equal(top + 280 / 2, 754);
  assert.equal(900 - (top + 280 / 2), 146);
  assert.equal(6 + 280 / 2, 146);
});

test('left and right drawers use the same limits regardless of open state', () => {
  // The caller always measures the drawer, not the tab, in either state.
  for (const height of [240, 580]) {
    const upper = clampEdgeDrawerTop(-500, 900, height);
    const lower = clampEdgeDrawerTop(5000, 900, height);
    assert.equal(upper, 6);
    assert.equal(lower, 900 - height - 6);
    assert.equal(upper + height / 2, 900 - (lower + height / 2));
  }
});

test('a resized drawer gets clamped back inside the viewport', () => {
  assert.equal(clampEdgeDrawerTop(600, 900, 240), 600);
  assert.equal(clampEdgeDrawerTop(600, 900, 500), 394);
  assert.equal(clampEdgeDrawerTop(600, 680, 500), 174);
});
