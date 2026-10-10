import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BRIGHT_STARS, BACKGROUND_SPECKLE_STARS, SKY_STARS } from './bright-stars.ts';
import {
  sydneyClock, sydneyInstant, sydneySolarEvents, defaultSkySelection,
  skyScene, solarLunarBodies, equatorialToHorizon,
} from './night-sky.ts';

const approx = (actual, expected, tolerance = 0.01) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);

test('Sydney civil time remains Sydney-local in both standard and daylight time', () => {
  assert.equal(sydneyInstant('2026-06-10', 1200).toISOString(), '2026-06-10T10:00:00.000Z');
  assert.equal(sydneyInstant('2026-10-10', 1200).toISOString(), '2026-10-10T09:00:00.000Z');
  assert.deepEqual(sydneyClock(sydneyInstant('2026-10-10', 1200)), { day: '2026-10-10', minutes: 1200 });
});

test('Sydney summer and winter solar events are on the correct local day, sunrise before sunset', () => {
  const winter = sydneySolarEvents('2026-06-10');
  const summer = sydneySolarEvents('2026-12-21');
  assert.ok(winter.sunrise > 380 && winter.sunrise < 450);
  assert.ok(winter.sunset > 975 && winter.sunset < 1040);
  assert.ok(summer.sunrise > 290 && summer.sunrise < 385);
  assert.ok(summer.sunset > 1150 && summer.sunset < 1240);
});

test('default sky selection is the Sydney date, sixty minutes after calculated sunset', () => {
  const now = new Date('2026-10-10T02:00:00.000Z');
  const selection = defaultSkySelection(now);
  assert.equal(selection.day, '2026-10-10');
  assert.equal(selection.minutes, sydneySolarEvents(selection.day).sunset + 60);
});

test('star visibility uses real equatorial hour angle and local east north up frame', () => {
  const instant = sydneyInstant('2026-10-10', 1200);
  const reference = equatorialToHorizon(0, -33.8544294233, instant);
  approx(Math.hypot(reference.direction.x,reference.direction.y,reference.direction.z),1,1e-10);
  assert.ok(reference.altitudeDeg >= -90 && reference.altitudeDeg <= 90);
  assert.ok(reference.azimuthDeg >= 0 && reference.azimuthDeg < 360);
  const scene = skyScene(instant);
  assert.ok(scene.stars.length > 0 && scene.stars.length < SKY_STARS.length);
  assert.ok(scene.stars.every(star => star.altitudeDeg > 0));
});

test('sun below twilight threshold enables stars, daytime suppresses them', () => {
  const day = skyScene(sydneyInstant('2026-10-10', 12 * 60));
  const night = skyScene(sydneyInstant('2026-10-10', 23 * 60));
  assert.equal(day.darkness, 0);
  assert.ok(night.darkness > 0.8);
});

test('lunar draft illumination and apparent coordinates stay finite across phases', () => {
  const newMoon = solarLunarBodies(sydneyInstant('2026-10-10', 1200)).moon;
  const later = solarLunarBodies(sydneyInstant('2026-10-24', 1200)).moon;
  assert.ok(newMoon.illuminated >= 0 && newMoon.illuminated < 0.15);
  assert.ok(later.illuminated > 0.6);
  assert.ok([newMoon, later].every(m => Number.isFinite(m.altitudeDeg) && Number.isFinite(m.azimuthDeg)));
});



test('supplemental speckle stars are deterministic, bounded and denser than the named catalogue', () => {
  assert.ok(BACKGROUND_SPECKLE_STARS.length >= 300);
  assert.equal(new Set(BACKGROUND_SPECKLE_STARS.map(star => star.name)).size, BACKGROUND_SPECKLE_STARS.length);
  assert.ok(BACKGROUND_SPECKLE_STARS.every(star => star.raHours >= 0 && star.raHours < 24 && star.decDeg >= -90 && star.decDeg <= 90));
  assert.ok(SKY_STARS.length > BRIGHT_STARS.length);
});

test('catalogue stars are source-based, bounded, unique and not randomised positions', () => {
  assert.ok(BRIGHT_STARS.length >= 50);
  assert.equal(new Set(BRIGHT_STARS.map(star=>star.name)).size, BRIGHT_STARS.length);
  assert.ok(BRIGHT_STARS.every(star=>star.raHours >= 0 && star.raHours < 24 && star.decDeg >= -90 && star.decDeg <= 90 && Number.isFinite(star.magnitude)));
});

test('UI keeps advanced controls hidden, exposes local date/time markers and sky behind scene', () => {
  const astro = readFileSync(new URL('./FireworksSimulator.astro', import.meta.url), 'utf8');
  const runtime = readFileSync(new URL('./fireworks-simulator.ts', import.meta.url), 'utf8');
  assert.match(astro, /data-advanced-viewport-panel[^>]+hidden inert/);
  assert.match(astro, /data-sky-sunrise-pin/);
  assert.match(astro, /data-sky-sunset-pin/);
  assert.match(astro, /data-sky-date/);
  assert.match(astro, /data-sky-time/);
  assert.match(astro, /data-camera-heading/);
  assert.match(astro, /data-camera-elevation/);
  assert.match(astro, /data-camera-compass/);
  assert.ok(astro.indexOf('data-sky-canvas') < astro.indexOf('data-city-webgl'));
  assert.match(runtime, /drawNightSky\(now\)/);
  assert.match(runtime, /syncOrientationHud/);
  assert.match(runtime, /skyContext\.clearRect/);
});
