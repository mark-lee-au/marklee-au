import test from 'node:test';
import assert from 'node:assert/strict';
import { normalisedManualTarget, orbitCameraEye } from './camera-landmark-orbit.ts';
test('Ending a short landmark orbit preserves sightline and restores stable movement distance', () => {
  const eye = { x: 500, y: -300, z: 70 };
  const landmark = { x: 560, y: -300, z: 50 };
  const target = normalisedManualTarget(eye, landmark);
  assert.ok(Math.abs(Math.hypot(target.x-eye.x,target.y-eye.y,target.z-eye.z)-1200) < .00001);
  assert.ok(Math.abs((target.z-eye.z)/(target.x-eye.x) - (landmark.z-eye.z)/(landmark.x-eye.x)) < .00001);
});
test('Slow orbit keeps a constant ground radius, elevation and landmark centre', () => {
  const centre = {x:2,y:3,z:50};
  const a = orbitCameraEye(centre,200,0,40);
  const b = orbitCameraEye(centre,200,Math.PI/2,40);
  assert.deepEqual(a,{x:202,y:3,z:90});
  assert.ok(Math.abs(b.x-2)<.000001);
  assert.equal(b.y,203);
  assert.equal(b.z,90);
});
