import { SKY_STARS, BRIGHT_STARS, type BrightStar } from './bright-stars.ts';

// First-stage local astronomical sky. Fixed site is the Sydney city-bundle
// origin (Harbour Bridge). Do not use the visitor's device time zone.
export const SYDNEY_SKY = Object.freeze({ latitude: -33.8544294233, longitude: 151.209399142, timeZone: 'Australia/Sydney' });
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const J2000 = 2451545;
const normalDegrees = (degrees: number) => ((degrees % 360) + 360) % 360;
const sinDeg = (degrees: number) => Math.sin(degrees * D2R);
const cosDeg = (degrees: number) => Math.cos(degrees * D2R);
const dateParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: SYDNEY_SKY.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function sydneyClock(instant: Date): { day: string; minutes: number } {
  const pieces = Object.fromEntries(dateParts.formatToParts(instant).map(p => [p.type, p.value]));
  return { day: `${pieces.year}-${pieces.month}-${pieces.day}`, minutes: Number(pieces.hour) * 60 + Number(pieces.minute) };
}

/** Convert Sydney wall time to instant, recalculating the DST offset for the date. */
export function sydneyInstant(day: string, minute: number): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Invalid Sydney civil date');
  const [y, m, d] = day.split('-').map(Number);
  const requested = Date.UTC(y, m - 1, d, 0, minute);
  let guess = requested - 11 * 3600000;
  for (let pass = 0; pass < 3; pass++) {
    const actual = sydneyClock(new Date(guess));
    const [ay, am, ad] = actual.day.split('-').map(Number);
    const actualNaive = Date.UTC(ay, am - 1, ad, 0, actual.minutes);
    guess += requested - actualNaive;
  }
  return new Date(guess);
}

export type SkyVector = { x: number; y: number; z: number };
export type SkyBody = { direction: SkyVector; altitudeDeg: number; azimuthDeg: number };
export type SkyStar = SkyBody & { name: string; magnitude: number };
export type MoonBody = SkyBody & { illuminated: number; waxing: boolean; phaseName: string };
export type SkyScene = { stars: SkyStar[]; sun: SkyBody; moon: MoonBody; darkness: number };

const epochDays = (date: Date) => date.getTime() / 86400000 + 2440587.5 - J2000;
export function equatorialToHorizon(raDeg: number, decDeg: number, instant: Date, lat = SYDNEY_SKY.latitude, lon = SYDNEY_SKY.longitude): SkyBody {
  const days = epochDays(instant);
  const localSidereal = normalDegrees(280.46061837 + 360.98564736629 * days + lon);
  const hourAngle = normalDegrees(localSidereal - raDeg) * D2R;
  const declination = decDeg * D2R;
  const latitude = lat * D2R;
  const east = -Math.cos(declination) * Math.sin(hourAngle);
  const north = Math.sin(declination) * Math.cos(latitude) - Math.cos(declination) * Math.cos(hourAngle) * Math.sin(latitude);
  const up = Math.sin(declination) * Math.sin(latitude) + Math.cos(declination) * Math.cos(hourAngle) * Math.cos(latitude);
  return {
    direction: { x: east, y: north, z: up },
    altitudeDeg: Math.asin(Math.max(-1, Math.min(1, up))) * R2D,
    azimuthDeg: normalDegrees(Math.atan2(east, north) * R2D),
  };
}

function eclipticToEquatorial(longitude: number, latitude = 0, days = 0): { raDeg: number; decDeg: number } {
  const obliquity = (23.439291 - 0.00000036 * days) * D2R;
  const lambda = longitude * D2R, beta = latitude * D2R;
  const x = Math.cos(lambda) * Math.cos(beta);
  const y = Math.sin(lambda) * Math.cos(beta) * Math.cos(obliquity) - Math.sin(beta) * Math.sin(obliquity);
  const z = Math.sin(lambda) * Math.cos(beta) * Math.sin(obliquity) + Math.sin(beta) * Math.cos(obliquity);
  return { raDeg: normalDegrees(Math.atan2(y, x) * R2D), decDeg: Math.asin(z) * R2D };
}

/** Low-order solar/lunar ephemeris, suitable for the prototype but not eclipse prediction. */
export function solarLunarBodies(instant: Date): { sun: SkyBody; moon: MoonBody } {
  const d = epochDays(instant);
  const g = normalDegrees(357.529 + 0.98560028 * d);
  const sunLambda = normalDegrees(280.459 + 0.98564736 * d + 1.915 * sinDeg(g) + 0.020 * sinDeg(2 * g));
  const moonMeanLong = normalDegrees(218.316 + 13.176396 * d);
  const moonAnomaly = normalDegrees(134.963 + 13.064993 * d);
  const elongation = normalDegrees(297.850 + 12.190749 * d);
  const argumentLat = normalDegrees(93.272 + 13.229350 * d);
  const moonLambda = normalDegrees(moonMeanLong + 6.289 * sinDeg(moonAnomaly)
    + 1.274 * sinDeg(2 * elongation - moonAnomaly) + 0.658 * sinDeg(2 * elongation)
    + 0.214 * sinDeg(2 * moonAnomaly) - 0.186 * sinDeg(g));
  const moonBeta = 5.128 * sinDeg(argumentLat) + 0.280 * sinDeg(moonAnomaly + argumentLat)
    + 0.277 * sinDeg(moonAnomaly - argumentLat) + 0.173 * sinDeg(2 * elongation - argumentLat);
  const sunEq = eclipticToEquatorial(sunLambda, 0, d);
  const moonEq = eclipticToEquatorial(moonLambda, moonBeta, d);
  const sun = equatorialToHorizon(sunEq.raDeg, sunEq.decDeg, instant);
  const position = equatorialToHorizon(moonEq.raDeg, moonEq.decDeg, instant);
  const phaseDegrees = normalDegrees(moonLambda - sunLambda);
  const illuminated = (1 - cosDeg(phaseDegrees)) / 2;
  const waxing = phaseDegrees < 180;
  const phaseName = illuminated < 0.025 ? 'NEW MOON' : illuminated > 0.975 ? 'FULL MOON'
    : illuminated >= 0.48 && illuminated <= 0.52 ? (waxing ? 'FIRST QUARTER' : 'LAST QUARTER')
    : waxing ? (illuminated < 0.5 ? 'WAXING CRESCENT' : 'WAXING GIBBOUS')
    : illuminated < 0.5 ? 'WANING CRESCENT' : 'WANING GIBBOUS';
  return { sun, moon: { ...position, illuminated, waxing, phaseName } };
}

export function skyScene(instant: Date, stars: readonly BrightStar[] = SKY_STARS): SkyScene {
  const { sun, moon } = solarLunarBodies(instant);
  // Twilight suppression approximates star visibility, not local pollution.
  const darkness = Math.max(0, Math.min(1, (-sun.altitudeDeg - 5) / 13));
  return {
    sun, moon, darkness,
    stars: stars.map(star => ({ ...equatorialToHorizon(star.raHours * 15, star.decDeg, instant), name: star.name, magnitude: star.magnitude }))
      .filter(star => star.altitudeDeg > 0),
  };
}

export type SolarEvents = { sunrise: number | null; sunset: number | null };
export function sydneySolarEvents(day: string): SolarEvents {
  const events: SolarEvents = { sunrise: null, sunset: null };
  let previousAltitude = solarLunarBodies(sydneyInstant(day, 0)).sun.altitudeDeg + 0.833;
  for (let minute = 15; minute <= 1440; minute += 15) {
    const altitude = solarLunarBodies(sydneyInstant(day, minute)).sun.altitudeDeg + 0.833;
    if ((previousAltitude <= 0 && altitude > 0) || (previousAltitude >= 0 && altitude < 0)) {
      let lower = minute - 15, upper = minute;
      for (let attempt = 0; attempt < 12; attempt++) {
        const mid = (lower + upper) / 2;
        const atMid = solarLunarBodies(sydneyInstant(day, mid)).sun.altitudeDeg + 0.833;
        if ((previousAltitude <= 0 && atMid <= 0) || (previousAltitude >= 0 && atMid >= 0)) lower = mid;
        else upper = mid;
      }
      if (previousAltitude <= 0) events.sunrise = Math.round((lower + upper) / 2);
      else events.sunset = Math.round((lower + upper) / 2);
    }
    previousAltitude = altitude;
  }
  return events;
}
export const skyClockLabel = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(Math.floor(minute % 60)).padStart(2, '0')}`;
export function defaultSkySelection(now: Date): { day: string; minutes: number } {
  const { day } = sydneyClock(now);
  const { sunset } = sydneySolarEvents(day);
  return { day, minutes: sunset === null ? 20 * 60 : Math.min(1439, sunset + 60) };
}
