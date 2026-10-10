/** Compact J2000 bright-star prototype. Approximate RA to minute and Dec to
 * 0.1 degree, apparent visual magnitude. See data/sources/fireworks-simulator-sky.md.
 * Named catalogue stars remain factual. A deterministic supplemental background
 * layer is added separately to make the draft night sky feel fuller. */
export type BrightStar = { name: string; raHours: number; decDeg: number; magnitude: number };
const entries = `
Sirius|6:45|-16.7|-1.44
Canopus|6:24|-52.7|-0.62
Alpha Centauri|14:40|-60.8|-0.28
Arcturus|14:16|19.2|-0.05
Vega|18:37|38.8|0.03
Capella|5:17|46.0|0.08
Rigel|5:15|-8.2|0.18
Procyon|7:39|5.2|0.40
Betelgeuse|5:55|7.4|0.45
Achernar|1:38|-57.2|0.45
Hadar|14:04|-60.4|0.61
Altair|19:51|8.9|0.76
Acrux|12:27|-63.1|0.77
Aldebaran|4:36|16.5|0.87
Spica|13:25|-11.2|0.98
Antares|16:29|-26.4|1.06
Pollux|7:45|28.0|1.16
Fomalhaut|22:58|-29.6|1.17
Deneb|20:41|45.3|1.25
Mimosa|12:48|-59.7|1.25
Regulus|10:08|12.0|1.36
Adhara|6:59|-29.0|1.50
Castor|7:35|31.9|1.58
Gacrux|12:31|-57.1|1.59
Shaula|17:34|-37.1|1.62
Bellatrix|5:25|6.3|1.64
Elnath|5:26|28.6|1.65
Miaplacidus|9:13|-69.7|1.67
Alnilam|5:36|-1.2|1.69
Alnair|22:08|-47.0|1.73
Alnitak|5:41|-1.9|1.74
Regor|8:10|-47.3|1.75
Alioth|12:54|56.0|1.76
Kaus Australis|18:24|-34.4|1.79
Mirfak|3:24|49.9|1.79
Dubhe|11:04|61.8|1.81
Wezen|7:08|-26.4|1.83
Alkaid|13:48|49.3|1.85
Sargas|17:37|-43.0|1.86
Avior|8:23|-59.5|1.86
Menkalinan|6:00|44.9|1.90
Atria|16:49|-69.0|1.91
Koo She|8:45|-54.7|1.93
Alhena|6:38|16.4|1.93
Peacock|20:26|-56.7|1.94
Polaris|2:32|89.3|1.97
Mirzam|6:23|-18.0|1.98
Alphard|9:28|-8.7|1.99
Algieba|10:20|19.8|2.01
Hamal|2:07|23.5|2.01
Algol|3:08|40.9|2.09
Mizar|13:24|54.9|2.23
Mintaka|5:32|-0.3|2.25
`.trim();
export const BRIGHT_STARS: readonly BrightStar[] = entries.split('\n').map(line => {
  const [name, ra, dec, magnitude] = line.split('|');
  const [h, m] = ra.split(':').map(Number);
  return { name, raHours: h + m / 60, decDeg: Number(dec), magnitude: Number(magnitude) };
});

const lcg = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
};

/** Draft-only supplemental sky speckle. These are deterministic, stable J2000
 * RA/Dec points chosen to visually thicken the sky without another dependency.
 * They are intentionally weaker/fainter than the named catalogue stars. */
export function generateBackgroundSpeckleStars(count = 420, seed = 0x5359444e): BrightStar[] {
  const random = lcg(seed);
  const stars: BrightStar[] = [];
  for (let index = 0; index < count; index++) {
    const raHours = random() * 24;
    const decDeg = Math.asin(random() * 2 - 1) * (180 / Math.PI);
    const magnitude = 2.8 + random() * 2.3 + random() * 0.8;
    stars.push({
      name: `SKY-${String(index + 1).padStart(3, '0')}`,
      raHours,
      decDeg,
      magnitude: Math.min(5.7, magnitude),
    });
  }
  return stars;
}

export const BACKGROUND_SPECKLE_STARS: readonly BrightStar[] = generateBackgroundSpeckleStars();
export const SKY_STARS: readonly BrightStar[] = [...BRIGHT_STARS, ...BACKGROUND_SPECKLE_STARS];
