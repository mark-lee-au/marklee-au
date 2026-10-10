// Run with: node --experimental-strip-types --test src/visualisations/fireworks-simulator/camera-map-rotation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_CAMERA_HEIGHT_M, manualMapPivot, mouseMapRotationDelta, rotateManualMap } from './camera-map-rotation.ts';
import { normalisedManualTarget } from './camera-landmark-orbit.ts';

function projectX(pose, point) {
  const e = pose.eye, t = pose.target;
  const vx = t.x - e.x, vy = t.y - e.y, vz = t.z - e.z;
  const length = Math.hypot(vx, vy, vz);
  const forward = { x: vx / length, y: vy / length, z: vz / length };
  const h = Math.hypot(forward.x, forward.y);
  const right = { x: forward.y / h, y: -forward.x / h };
  const dx = point.x - e.x, dy = point.y - e.y, dz = point.z - e.z;
  const depth = dx * forward.x + dy * forward.y + dz * forward.z;
  assert.ok(depth > 0, 'the test building should be in front of the camera');
  return 1100 * (dx * right.x + dy * right.y) / depth;
}

function distance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z); }
function samePose(a,b) {
  assert.ok(distance(a.eye,b.eye) < 1e-8, 'the camera eye must match');
  assert.ok(distance(a.target,b.target) < 1e-8, 'the view target must match');
}

for (const elevation of [10, 25, 60, 400, 2400]) {
  test(`physical right-drag moves the forward skyline toward screen left at ${elevation} m`, () => {
    const pose = { eye: { x: 1000, y: 0, z: elevation }, target: { x: 0, y: 0, z: 0 } };
    const feature = { x: -150, y: 0, z: 20 };
    const pivot = manualMapPivot(pose);
    const before = projectX(pose, feature);
    const { dx, dy } = mouseMapRotationDelta(60, 0);
    const changed = rotateManualMap(pose, pivot, dx, dy);
    const after = projectX(changed, feature);
    assert.ok(after < before, `right-drag should move scenery left at ${elevation} m (${before} -> ${after})`);
    assert.ok(Math.abs(changed.eye.z - elevation) < 1e-6, 'horizontal drag must not change altitude');
  });
}

test('mouse left/up right-drag matches Left/Up Arrow movement and reverses both axes', () => {
  assert.deepEqual(mouseMapRotationDelta(-60, -30), { dx: 60, dy: 30 });
  assert.deepEqual(mouseMapRotationDelta(60, 30), { dx: -60, dy: -30 });
  const pose = { eye: { x: 650, y: 0, z: 240 }, target: { x: 0, y: 0, z: 20 } };
  const pivot = manualMapPivot(pose);
  // The existing arrow mapping generates +dx for Left, +dy for Up.
  const keyboard = rotateManualMap(pose, pivot, 60, 30);
  const { dx, dy } = mouseMapRotationDelta(-60, -30);
  const mouse = rotateManualMap(pose, pivot, dx, dy);
  samePose(mouse, keyboard);
  const oldMouseDown = rotateManualMap(pose, pivot, 0, 30);
  const downwardDrag = mouseMapRotationDelta(0, 30);
  const newMouseDown = rotateManualMap(pose, pivot, downwardDrag.dx, downwardDrag.dy);
  assert.ok(oldMouseDown.eye.z !== newMouseDown.eye.z, 'vertical direction must reverse');
});

test('manual map rotation remains independent of landmark view-target distance', () => {
  const eye = { x: 500, y: 0, z: 300 };
  const landmarkTarget = { x: 0, y: 0, z: 25 };
  const normalised = normalisedManualTarget(eye, landmarkTarget, 1200);
  const a = { eye, target: landmarkTarget }, b = { eye, target: normalised };
  const pivotA = manualMapPivot(a), pivotB = manualMapPivot(b);
  assert.ok(Math.hypot(pivotA.x-pivotB.x, pivotA.y-pivotB.y) < 1e-6);
  const rotatedA = rotateManualMap(a, pivotA, 40, 0);
  const rotatedB = rotateManualMap(b, pivotB, 40, 0);
  assert.ok(Math.hypot(rotatedA.eye.x-rotatedB.eye.x, rotatedA.eye.y-rotatedB.eye.y) < 1e-6);
});

test('map rotation keeps the eye and look target a rigid pair', () => {
  const pose = { eye: { x: 1000, y: 0, z: 500 }, target: { x: 0, y: 0, z: 20 } };
  const changed = rotateManualMap(pose, manualMapPivot(pose), 70, 15);
  assert.ok(Math.abs(distance(changed.eye,changed.target)-distance(pose.eye,pose.target)) < 1e-6);
  assert.ok(changed.eye.z >= MIN_CAMERA_HEIGHT_M);
});

test('upward right-drag and Up Arrow keep tilting from the exact 10m floor', () => {
  assert.equal(MIN_CAMERA_HEIGHT_M, 10);
  const initial = { eye: { x: 100, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 } };
  const pivot = manualMapPivot(initial);
  const originalRange = distance(initial.eye, initial.target);
  const pitchOf = (pose) => Math.atan2(pose.target.z - pose.eye.z,
    Math.hypot(pose.target.x - pose.eye.x, pose.target.y - pose.eye.y));

  // Both input routes deliver positive dy: Up Arrow and a physical right-drag up.
  const mouseDelta = mouseMapRotationDelta(0, -80);
  const fromMouse = rotateManualMap(initial, pivot, mouseDelta.dx, mouseDelta.dy);
  const fromKeyboard = rotateManualMap(initial, pivot, 0, 80);
  samePose(fromMouse, fromKeyboard);
  assert.ok(pitchOf(fromMouse) > pitchOf(initial) + .05, 'looking up must not stall at 10m');
  assert.ok(Math.abs(fromMouse.eye.z - 10) < 1e-8, 'camera stays at its 10m floor');
  assert.ok(Math.abs(distance(fromMouse.eye, fromMouse.target) - originalRange) < 1e-6,
    'eye and target still move as a rigid pair');
  assert.ok(Math.hypot(fromMouse.eye.x - initial.eye.x, fromMouse.eye.y - initial.eye.y) > .001,
    'map-orbit movement must remain, rather than an in-place eye-only tilt');

  // Further upward input remains available, and reversing it raises the eye.
  let pose = fromMouse;
  for (let i=0; i<6; i++) {
    const next = rotateManualMap(pose, pivot, 0, 40);
    assert.ok(pitchOf(next) >= pitchOf(pose) - 1e-8, 'repeated upward input cannot reverse');
    assert.ok(next.eye.z >= 10 - 1e-8);
    pose = next;
  }
  const beforeReverse = pitchOf(pose);
  pose = rotateManualMap(pose, pivot, 0, -120);
  assert.ok(pitchOf(pose) < beforeReverse - .01, 'reversing input tilts back down');
  assert.ok(pose.eye.z >= 10 - 1e-8, 'camera still respects floor after reversing');
});

test('pitch response is continuous immediately above the 10m camera floor', () => {
  const makePose = (z) => ({ eye: { x: 100, y: 0, z }, target: { x: 0, y: 0, z: z - 10 } });
  const pitchOf = (pose) => Math.atan2(pose.target.z - pose.eye.z,
    Math.hypot(pose.target.x - pose.eye.x, pose.target.y - pose.eye.y));
  const atFloor = makePose(10);
  const nearFloor = makePose(10.001);
  const a = rotateManualMap(atFloor, manualMapPivot(atFloor), 0, 30);
  const b = rotateManualMap(nearFloor, manualMapPivot(nearFloor), 0, 30);
  assert.ok(Math.abs((pitchOf(a) - pitchOf(atFloor)) - (pitchOf(b) - pitchOf(nearFloor))) < 1e-6,
    'look-up pitch must be consistent across the exact floor threshold');
  assert.ok(Math.abs(a.eye.z - 10) < 1e-8);
  assert.ok(Math.abs(b.eye.z - 10) < 1e-8);
});

test('wheel-like altitude and range changes do not reverse mouse right-drag', () => {
  const look = { x: 0, y: 0, z: 15 };
  for (const eyeZ of [10, 15, 40, 400, 2500]) {
    for (const eyeX of [80, 250, 1100, 3000]) {
      const pose = { eye: { x: eyeX, y: 0, z: eyeZ }, target: look };
      const feature = { x: -300, y: 0, z: 20 };
      const before = projectX(pose, feature);
      const { dx, dy } = mouseMapRotationDelta(60, 0);
      const after = projectX(rotateManualMap(pose, manualMapPivot(pose), dx, dy), feature);
      assert.ok(after < before, `physical right-drag direction reversed at x=${eyeX}, z=${eyeZ}`);
    }
  }
});

test('extreme pitch drags stay world-up and never cross the 10m camera floor', () => {
  let pose = { eye: { x: 350, y: 0, z: 1800 }, target: { x: 0, y: 0, z: 0 } };
  const pivot = manualMapPivot(pose);
  for (const dy of [1000, 1000, -4000, -4000]) {
    pose = rotateManualMap(pose, pivot, 0, dy);
    const f = {
      x: pose.target.x-pose.eye.x, y: pose.target.y-pose.eye.y, z: pose.target.z-pose.eye.z,
    };
    assert.ok(Math.hypot(f.x,f.y) > Math.abs(f.z)*.02, 'screen right must not invert');
    assert.ok(pose.eye.z >= 10 - 1e-8);
  }
});
