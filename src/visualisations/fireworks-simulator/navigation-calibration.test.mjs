import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normaliseNavigationMultiplier, navigationCalibrationLine,
  navigationPointerDelta, navigationVirtualPosition, navigationCanAnchorPointer,
  NAV_DEFAULT_KEYBOARD, NAV_DEFAULT_MOUSE_MOVE, NAV_DEFAULT_MOUSE_PAN, NAV_DEFAULT_PROFILE,
  navigationAltitudeMultiplier, navigationAltitudeProgress, normaliseNavigationCurve, navigationDefaultLow,
  NAV_LOW_HEIGHT_M, NAV_HIGH_HEIGHT_M,
} from './navigation-calibration.ts';

test('calibration defaults and entered values are constrained', () => {
  assert.equal(normaliseNavigationMultiplier('not a number', NAV_DEFAULT_MOUSE_MOVE), NAV_DEFAULT_MOUSE_MOVE);
  assert.equal(normaliseNavigationMultiplier(null, NAV_DEFAULT_MOUSE_PAN), NAV_DEFAULT_MOUSE_PAN);
  assert.equal(normaliseNavigationMultiplier(null, NAV_DEFAULT_KEYBOARD), NAV_DEFAULT_KEYBOARD);
  assert.equal(normaliseNavigationMultiplier('2.23', NAV_DEFAULT_MOUSE_MOVE), 2.25);
  assert.equal(normaliseNavigationMultiplier(999, NAV_DEFAULT_MOUSE_PAN), 10);
  assert.equal(normaliseNavigationMultiplier(-1, NAV_DEFAULT_MOUSE_MOVE), .25);
});

test('pointer lock retains physical deltas even at screen edge', () => {
  const prev = { x: 999, y: 400 };
  const d = navigationPointerDelta(true, 280, -7, { x: 999, y: 400 }, prev);
  assert.deepEqual(d, { x: 280, y: -7 });
  const clamped = navigationVirtualPosition(prev, d, { left: 0, top: 0, right: 1000, bottom: 800 });
  assert.deepEqual(clamped, { x: 999, y: 393 });
  const next = navigationPointerDelta(true, 180, 0, { x: 999, y: 393 }, clamped);
  assert.equal(next.x, 180);
});

test('unlocked pointer movement uses client coordinates as before', () => {
  assert.deepEqual(navigationPointerDelta(false, 500, 500, { x: 140, y: 90 }, { x: 125, y: 100 }), { x: 15, y: -10 });
});

test('altitude profile interpolates between independently calibrated endpoints', () => {
  assert.equal(navigationAltitudeMultiplier(10, 4, 1.75, 1), 4);
  assert.equal(navigationAltitudeMultiplier(2000, 4, 1.75, 1), 1.75);
  assert.equal(navigationAltitudeMultiplier(1, 4, 1.75, 1), 4);
  assert.equal(navigationAltitudeMultiplier(20000, 4, 1.75, 1), 1.75);
  const atMid = Math.sqrt(NAV_LOW_HEIGHT_M * NAV_HIGH_HEIGHT_M);
  assert.ok(Math.abs(navigationAltitudeMultiplier(atMid, 4, 1.75, 1) - 2.875) < 0.00001);
  assert.equal(navigationAltitudeMultiplier(10, 8, 5, 1), 8);
  assert.equal(navigationAltitudeMultiplier(2000, 8, 5, 1), 5);
  assert.equal(navigationAltitudeMultiplier(100, 5, 5, 1.8), 5);
});

test('curve power controls when the ground boost fades without changing endpoints', () => {
  const mid = Math.sqrt(NAV_LOW_HEIGHT_M * NAV_HIGH_HEIGHT_M);
  const earlyFade = navigationAltitudeMultiplier(mid, 4, 1.75, .5);
  const laterFade = navigationAltitudeMultiplier(mid, 4, 1.75, 2);
  assert.ok(laterFade > earlyFade);
  assert.equal(navigationAltitudeMultiplier(10, 4, 1.75, 2), 4);
  assert.equal(navigationAltitudeMultiplier(2000, 4, 1.75, .5), 1.75);
  assert.equal(normaliseNavigationCurve('not a number'), NAV_DEFAULT_PROFILE.curvePower);
  assert.equal(normaliseNavigationCurve('2.26'), 2.3);
  assert.equal(normaliseNavigationCurve(100), 3);
  assert.equal(normaliseNavigationCurve(-10), .4);
  assert.equal(navigationAltitudeProgress(10, 2), 0);
  assert.equal(navigationAltitudeProgress(2000, 2), 1);
  assert.equal(navigationAltitudeProgress(NaN, 2), 1);
  assert.equal(navigationDefaultLow(1.5), 2.4);
  assert.equal(navigationDefaultLow(9.5), 10);
});

test('copy line records low/high, curve shape, effective speed and display context', () => {
  const line = navigationCalibrationLine({ mouseMoveLow: 4, mouseMoveHigh: 1.75,
    mousePanLow: 3.5, mousePanHigh: 2, keyboardMoveLow: 8, keyboardMoveHigh: 5, keyboardPanLow: 6, keyboardPanHigh: 2.5, curvePower: 1.4,
    viewportWidth: 1440, viewportHeight: 900, devicePixelRatio: 1.25,
    screenWidth: 3840, screenHeight: 2160, viewMode: 'skyline',
    cameraHeightM: 10, pointerLockSupported: true });
  assert.match(line, /FW-NAV:v4 \| mouse_move_low=4\.00 \| mouse_move_high=1\.75/);
  assert.match(line, /mouse_pan_low=3\.50 \| mouse_pan_high=2\.00/);
  assert.match(line, /keyboard_move_low=8\.00 \| keyboard_move_high=5\.00 \| keyboard_pan_low=6\.00 \| keyboard_pan_high=2\.50/);
  assert.match(line, /curve_power=1\.4 \| altitude_range_m=10-2000/);
  assert.match(line, /effective_move=4\.00 \| effective_pan=3\.50 \| effective_keyboard_move=8\.00 \| effective_keyboard_pan=6\.00/);
  assert.match(line, /viewport=1440x900/);
  assert.match(line, /screen=3840x2160/);
  assert.match(line, /height_m=10\.0/);
  assert.match(line, /mouse_dpi=unknown/);
});

test('ground-point anchoring is disabled at a locked virtual edge so a drag still moves', () => {
  const previous = { x: 999, y: 400 };
  const delta = { x: 130, y: 0 };
  const next = navigationVirtualPosition(previous, delta, { left: 0, top: 0, right: 1000, bottom: 800 });
  assert.equal(navigationCanAnchorPointer(previous, next, delta), false);
  assert.equal(navigationCanAnchorPointer(previous, { x: 899, y: 400 }, { x: -100, y: 0 }), true);
});


test('owner-calibrated profile is the exact starting baseline and keeps keyboard actions equal until tuned', () => {
  assert.deepEqual({ ...NAV_DEFAULT_PROFILE }, {
    mouseMoveLow: 2.35, mouseMoveHigh: 1,
    mousePanLow: 1.5, mousePanHigh: .75,
    keyboardMoveLow: 5.75, keyboardMoveHigh: 2.25,
    keyboardPanLow: 5.75, keyboardPanHigh: 2.25,
    curvePower: 1.6,
  });
  for (const h of [10, 230.3, 2000]) {
    const move = navigationAltitudeMultiplier(h, NAV_DEFAULT_PROFILE.keyboardMoveLow, NAV_DEFAULT_PROFILE.keyboardMoveHigh, NAV_DEFAULT_PROFILE.curvePower);
    const pan = navigationAltitudeMultiplier(h, NAV_DEFAULT_PROFILE.keyboardPanLow, NAV_DEFAULT_PROFILE.keyboardPanHigh, NAV_DEFAULT_PROFILE.curvePower);
    assert.equal(move, pan);
  }
  const line = navigationCalibrationLine({ ...NAV_DEFAULT_PROFILE,
    viewportWidth: 2048, viewportHeight: 991, screenWidth: 2048, screenHeight: 1152,
    devicePixelRatio: 1.25, viewMode: 'skyline', cameraHeightM: 230.3,
    pointerLockSupported: true,
  });
  assert.match(line, /mouse_move_low=2\.35 \| mouse_move_high=1\.00/);
  assert.match(line, /mouse_pan_low=1\.50 \| mouse_pan_high=0\.75/);
  assert.match(line, /keyboard_move_low=5\.75 \| keyboard_move_high=2\.25/);
  assert.match(line, /keyboard_pan_low=5\.75 \| keyboard_pan_high=2\.25/);
  assert.match(line, /curve_power=1\.6/);
});

test('keyboard navigation wires WASD, Q/E and dolly to Move, arrows to Pan/Rotate', () => {
  const source = readFileSync(new URL('./fireworks-simulator.ts', import.meta.url), 'utf8');
  assert.match(source, /const panSpeed = [^\n]*effectiveKeyboardMove\(\)/);
  assert.match(source, /const rotateSpeed = [^\n]*effectiveKeyboardPan\(\)/);
  assert.match(source, /const heightSpeed = [^\n]*effectiveKeyboardMove\(\)/);
  assert.match(source, /keyboardDollyVelocity \+= [^\n]*effectiveKeyboardMove\(\)/);
  assert.doesNotMatch(source, /navigation-calibration:v3/);
  assert.doesNotMatch(source, /localStorage\.setItem\(speedStorageKey/);
  assert.doesNotMatch(source, /localStorage\.getItem\(speedStorageKey/);
  const panel = readFileSync(new URL('./FireworksSimulator.astro', import.meta.url), 'utf8');
  for (const id of ['keyboard-move', 'keyboard-pan']) {
    assert.match(panel, new RegExp(`slug: '${id}'`));
    assert.match(panel, new RegExp(`data-nav-curve-path="${id}"`));
    assert.match(panel, new RegExp(`data-nav-curve-dot="${id}"`));
  }
  assert.match(panel, /NAV_DEFAULT_PROFILE\.curvePower/);
});
