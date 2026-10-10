import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const renderer = readFileSync(new URL('./city-webgl.ts', import.meta.url), 'utf8');
const controller = readFileSync(new URL('./fireworks-simulator.ts', import.meta.url), 'utf8');

const projectPlan = ({x,y}, viewport, plan) => {
  const dx = x - plan.centreX;
  const dy = y - plan.centreY;
  const c = Math.cos(plan.rotationRad), s = Math.sin(plan.rotationRad);
  return { x: viewport.x + (dx * c - dy * s) * plan.scale,
    y: viewport.y - (dx * s + dy * c) * plan.scale };
};

test('orthographic PLAN projection preserves centred/rotated/skew-free map geometry', () => {
  const view = { x: 1024, y: 495 };
  const plan = { centreX: 300, centreY: 200, rotationRad: Math.PI / 2, scale: .8 };
  assert.deepEqual(projectPlan({x:300,y:200},view,plan),view);
  const east = projectPlan({x:400,y:200},view,plan);
  assert.ok(Math.abs(east.x-1024)<1e-8);
  assert.ok(Math.abs(east.y-415)<1e-8);
  const north = projectPlan({x:300,y:300},view,plan);
  assert.ok(Math.abs(north.x-944)<1e-8);
  assert.ok(Math.abs(north.y-495)<1e-8);
});

test('PLAN uses existing WebGL buffers, not the per-frame Canvas building path', () => {
  assert.match(renderer, /uniform float u_planMode;/);
  assert.match(renderer, /uniform vec2 u_planCentre;/);
  assert.match(renderer, /u_planMode > 0\.5/);
  assert.match(renderer, /renderPlan\(/);
  assert.match(controller, /webglCity\.renderPlan\(/);
  assert.match(controller, /if \(!gpuCity\) context\.drawImage\(cityCanvas/);
  assert.match(controller, /if \(gpuCity\) \{\s*\/\/ GPU buffers are retained/);
});

test('test extent is opt-in and never replaces default Sydney load', () => {
  assert.match(controller, /new URLSearchParams\(window\.location\.search\)\.get\('city'\) === 'greater-sydney-test'/);
  assert.match(controller, /: config\.cityUrl/);
});

test('preview explicitly identifies the loaded extent and offers a full PLAN overview', () => {
  const astro = readFileSync(new URL('./FireworksSimulator.astro', import.meta.url), 'utf8');
  assert.match(astro, /data-city-preview-overview hidden/);
  assert.match(controller, /loaded\.city\.sceneExtent !== 'greater-sydney-test'/);
  assert.match(controller, /GREATER SYDNEY TEST/);
  assert.match(controller, /previewOverviewButton\.hidden = !activeCityPreview/);
  assert.match(controller, /if \(viewMode !== 'plan'\) viewButtons\.find/);
  assert.match(controller, /plan = \{ x: 0, y: 0, rotationRad: 0, zoom: 1 \};/);
  assert.match(controller, /planZoomTarget = 1/);
});
