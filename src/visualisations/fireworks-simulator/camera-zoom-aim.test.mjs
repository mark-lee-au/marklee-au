import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { cameraZoomAimDirection, projectionScreenCentre, zoomAimScreenPoint } from './camera-zoom-aim.ts';

test('zoom follows the camera aim instead of the pointer position', () => {
  const eye = { x: 35, y: -25, z: 250 };
  const target = { x: 35, y: 975, z: 250 };
  assert.deepEqual(cameraZoomAimDirection(eye, target), { x: 0, y: 1, z: 0 });
  // Translating eye and target along the aim ray preserves the same visual bearing.
  const moved = { x: eye.x, y: eye.y + 70, z: eye.z };
  assert.deepEqual(cameraZoomAimDirection(moved, { ...target, y: target.y + 70 }), { x: 0, y: 1, z: 0 });
});

test('both views and the zoom marker have exactly the same centred projection at every size', () => {
  for (const [width, height] of [[2048, 991], [1500, 900], [768, 1024], [390, 844], [1, 1]]) {
    const centre = projectionScreenCentre(width, height);
    assert.deepEqual(centre, { x: width / 2, y: height / 2 });
    const viewport = {
      planScreenX: centre.x,
      planScreenY: centre.y,
      skylineScreenX: centre.x,
      skylineHorizonY: centre.y,
    };
    assert.deepEqual(zoomAimScreenPoint('skyline', viewport), centre);
    assert.deepEqual(zoomAimScreenPoint('plan', viewport), centre);
  }
});

test('the scene, GPU origin, reverse screen ray and marker share the viewport centre', () => {
  const controller = readFileSync(new URL('./fireworks-simulator.ts', import.meta.url), 'utf8');
  assert.match(controller, /const screenCentre = projectionScreenCentre\(width, height\)/);
  for (const field of ['planScreenX', 'planScreenY', 'skylineScreenX', 'skylineHorizonY']) {
    assert.match(controller, new RegExp(`${field}: screenCentre\\.[xy]`));
  }
  assert.match(controller, /x: viewport\.skylineScreenX \+ \(dot\(relative, right\) \* focal\) \/ depth/);
  assert.match(controller, /y: viewport\.skylineHorizonY - \(dot\(relative, up\) \* focal\) \/ depth/);
  assert.match(controller, /skylineScreenX: viewport\.skylineScreenX/);
  assert.match(controller, /const aim = zoomAimScreenPoint\('skyline', viewport\)/);
  assert.match(controller, /zoomAimScreenPoint\(viewMode, viewport\)/);
  assert.match(controller, /x: viewport\.planScreenX \+/);
  assert.match(controller, /y: viewport\.planScreenY -/);
  assert.doesNotMatch(controller, /viewport\.width \* \(viewport\.width < MOBILE_BREAKPOINT/);
});

test('aim direction follows arbitrary tilt, with a safe degenerate fallback', () => {
  const direction = cameraZoomAimDirection({ x: 1, y: 2, z: 10 }, { x: 4, y: 6, z: 10 });
  assert.ok(Math.abs(direction.x - 0.6) < 1e-12);
  assert.ok(Math.abs(direction.y - 0.8) < 1e-12);
  assert.equal(direction.z, 0);
  assert.deepEqual(cameraZoomAimDirection({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }), { x: 0, y: 1, z: 0 });
});

test('real wheel, Shift-drag and pinch handlers use centred camera travel', () => {
  const controller = readFileSync(new URL('./fireworks-simulator.ts', import.meta.url), 'utf8');
  assert.match(controller, /queueSkylineDolly\(-delta \* metresPerWheelUnit\);/);
  assert.match(controller, /queueSkylineDolly\(-dy \* metresPerPixel\);/);
  assert.match(controller, /queueSkylineDolly\(pinchDistance\);/);
  assert.doesNotMatch(controller, /queueSkylineDolly\([^;]*skylineScreenRay/);
  assert.match(controller, /root\.classList\.toggle\('is-zooming', stillZooming\)/);
  assert.match(controller, /zoomAimScreenPoint\(viewMode, viewport\)/);
});
