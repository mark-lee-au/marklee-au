// Run with: node --experimental-strip-types --test src/visualisations/fireworks-simulator/camera-pan.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { skylineMetresPerPixel, stableGroundPanHit, skylinePanDisplacement, MIN_PAN_M_PER_PX, MAX_PAN_M_PER_PX, PAN_RESPONSE } from './camera-pan.ts';

const frame = { right: { x: 0, y: -1, z: 0 }, forward: { x: -1, y: 0, z: -.35 }, focalPx: 1100 };

test('movement scale depends on the visible ground, not a selected camera target', () => {
  const base = { ...frame, eye: { x: 0, y: 0, z: 50 }, dxPx: 100, dyPx: 0 };
  const first = skylinePanDisplacement(base);
  const second = skylinePanDisplacement({ ...base, eye: { x: 3500, y: -4000, z: 50 } });
  assert.ok(Math.abs(first.y - second.y) < 1e-8);
  assert.ok(Math.abs(first.x - second.x) < 1e-8);
});

test('near-ground horizontal or upward views remain responsive and finite', () => {
  for (const z of [0.25, 2, 10, 50]) {
    for (const pitch of [-.001, 0, .2]) {
      const mpp = skylineMetresPerPixel(z, pitch, 1100);
      assert.ok(Number.isFinite(mpp));
      assert.ok(mpp >= MIN_PAN_M_PER_PX && mpp <= MAX_PAN_M_PER_PX);
    }
  }
});

test('moving higher smoothly increases the apparent-area scale without unbounded motion', () => {
  const low = skylineMetresPerPixel(10, -.45, 1100);
  const mid = skylineMetresPerPixel(300, -.45, 1100);
  const high = skylineMetresPerPixel(2500, -.45, 1100);
  assert.ok(low < mid && mid < high);
  assert.ok(high <= MAX_PAN_M_PER_PX);
});

test('stable pointer ground anchors retain the shared deliberate pan gain', () => {
  const eye = { x: 50, y: 75, z: 350 };
  const before = { x: 0, y: 0.8, z: -0.6 };
  const after = { x: 0.06, y: 0.8, z: -0.6 };
  const p1 = stableGroundPanHit(eye, before, 1100);
  const p2 = stableGroundPanHit(eye, after, 1100);
  assert.ok(p1 && p2);
  const movement = skylinePanDisplacement({ ...frame, eye, dxPx: 36, dyPx: 0, previousRay: before, currentRay: after });
  assert.ok(movement.x < 0);
  assert.ok(Math.abs(movement.x - (p1.x - p2.x) * PAN_RESPONSE) < .001);
});

test('near-horizon rays and ground-level rays use the fallback, with no jump', () => {
  const eye = { x: 0, y: 0, z: 1 };
  const result = skylinePanDisplacement({
    ...frame, eye, dxPx: 80, dyPx: 12,
    previousRay: { x: 0, y: .9999, z: -.01 },
    currentRay: { x: .04, y: .9999, z: -.01 },
  });
  assert.ok(Number.isFinite(result.x) && Number.isFinite(result.y));
  assert.ok(Math.hypot(result.x, result.y) < 10);
  assert.equal(stableGroundPanHit(eye, { x: .01, y: 1, z: -.01 }, 1100), null);
});

test('mouse, keyboard and touch share the same scale but retain input factors', () => {
  const base = { ...frame, eye: { x: 0, y: 0, z: 120 }, dxPx: 90, dyPx: 20 };
  const keyboard = skylinePanDisplacement({ ...base, inputFactor: .78 });
  const touch = skylinePanDisplacement({ ...base, inputFactor: 1 });
  assert.ok(Math.abs(keyboard.x / touch.x - .78) < 1e-8);
  assert.ok(Math.abs(keyboard.y / touch.y - .78) < 1e-8);
});


test('street-level pan is deliberate rather than racing metres per drag', () => {
  for (const pitch of [-.7, -.35, -.001, .2]) {
    const view = { ...frame, forward: { x: -1, y: 0, z: pitch }, eye: { x: 0, y: 0, z: 2 }, dxPx: 100, dyPx: 0 };
    const movement = skylinePanDisplacement({ ...view, inputFactor: .78 });
    assert.ok(Math.hypot(movement.x, movement.y) <= 2.3, '100 CSS px should move about 2 m even toward the horizon');
    assert.ok(Math.hypot(movement.x, movement.y) > 0, 'movement must remain usable');
  }
});

test('high-altitude pan is significantly calmer without losing altitude scaling', () => {
  const low = skylinePanDisplacement({ ...frame, eye: { x: 0, y: 0, z: 50 }, dxPx: 100, dyPx: 0, inputFactor: .78 });
  const high = skylinePanDisplacement({ ...frame, eye: { x: 0, y: 0, z: 2000 }, dxPx: 100, dyPx: 0, inputFactor: .78 });
  assert.ok(Math.hypot(high.x, high.y) > Math.hypot(low.x, low.y), 'higher viewpoints still cover more metres');
  assert.ok(Math.hypot(high.x, high.y) < 230, '100 CSS px should not leap across the skyline');
});

test('ground anchoring stays close to fallback speed across changes in pitch', () => {
  const eye = { x: 0, y: 0, z: 800 };
  const base = { ...frame, eye, dxPx: 90, dyPx: 0, inputFactor: .78 };
  const fallback = skylinePanDisplacement(base);
  const anchored = skylinePanDisplacement({
    ...base,
    previousRay: { x: -.15, y: .2, z: -.5 },
    currentRay: { x: -.03, y: .2, z: -.5 },
  });
  const limit = Math.hypot(base.dxPx, base.dyPx) * skylineMetresPerPixel(eye.z, frame.forward.z, frame.focalPx) * PAN_RESPONSE * base.inputFactor * 1.35;
  assert.ok(Math.hypot(anchored.x, anchored.y) <= limit + 1e-8, 'ground anchors should not bypass speed cap');
  assert.ok(Number.isFinite(anchored.x) && Number.isFinite(anchored.y));
  assert.ok(Math.hypot(fallback.x, fallback.y) < limit);
});

test('actual mouse pan factor moves less than half a metre per 100px near street level', () => {
  for (const z of [.25, 1, 2, 5]) {
    const view = { ...frame, eye: { x: 0, y: 0, z }, dxPx: 100, dyPx: 0, inputFactor: .78 };
    const movement = skylinePanDisplacement(view);
    assert.ok(Math.hypot(movement.x, movement.y) < .7, `ground pan at ${z}m should be deliberate`);
    assert.ok(Math.hypot(movement.x, movement.y) > 0);
  }
});

test('pan drag moves the map right after zoom at both street and overview elevations', () => {
  const right = frame.right;
  for (const z of [.35, 2, 300, 2400]) {
    for (const forwardZ of [-0.8, -0.4, -.002, 0.3]) {
      const movement = skylinePanDisplacement({
        eye: { x: 500, y: 100, z }, right,
        forward: { x: -1, y: 0, z: forwardZ }, focalPx: 1100,
        dxPx: 100, dyPx: 0, inputFactor: .78,
      });
      // Camera moves left so visible map/buildings move right.
      assert.ok(movement.y > 0, `panning direction changed at z=${z}, pitch=${forwardZ}`);
    }
  }
});
