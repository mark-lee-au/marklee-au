# Fireworks Simulator: Sydney sky prototype (2026-10-10)

**Stage / publication:** prototype; not a complete astronomical dataset or a production-accuracy planetarium. This file documents only the new sky layer, not the NSW city data. No network fetch is required when visiting the static page.

## Observer and calendar

- Sydney observer: Harbour Bridge centre at latitude **-33.8544294233**, longitude **151.209399142** (existing Sydney bundle origin). Altitude is simplified to sea level for sky ephemerides; skyline camera height affects only what part of the sky is visible.
- Civil time: IANA `Australia/Sydney`, using browser `Intl.DateTimeFormat` to account for AEDT/AEST on the selected date (independent of the visitor's time zone).
- Initial date: **today in Sydney** at page load, and **one hour after calculated local sunset**. Date selector and 1-minute time slider show sunrise/sunset markers and clock labels on the chosen day.
- Solar times: low-order solar ecliptic longitude, local sidereal time and a geometric sunrise/sunset search at apparent solar centre elevation of -0.833°, a conventional near-horizon correction. Not corrected for local terrain or buildings; approximate rise/set (do not market as almanac-precision). Daylight-saving transition hours can be ambiguous or nonexistent.

## Star data

- Current bundled dataset: 53 bright individual catalogue stars, with names, visual magnitudes and approximate J2000 right ascension/declination (RA rounded to one minute, declination to 0.1 degree). Transcribed as factual measurements from the published AstroPixels bright-star table, with additional listed stars. To make the prototype night sky feel fuller, the renderer also adds **420 deterministic supplemental speckle stars** with generated J2000 RA/Dec and faint magnitudes. Those supplemental stars are visually useful but are **not audited catalogue identities**.
- Reference: Fred Espenak, [AstroPixels — 50 Brightest Stars](https://astropixels.com/stars/brightstars.html); original positions drawn from Hipparcos measurements. Factual coordinates only are used; no illustrations, page prose or full tables copied. The presentation is not a reproduction of the source website.
- Broader catalogues to evaluate before a release: [Yale Bright Star Catalogue (BSC5)](https://tdc-www.harvard.edu/catalogs/bsc5.html), ~9,110 sources, including visible magnitudes; potential 9,096-star compact public-domain-derived subset [isene/starmap dataset description](https://github.com/isene/starmap/blob/master/data/README.md). Confirm original redistribution terms before importing its full data.
- Alternative [HYG v4.1](https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md) is CC BY-SA 4.0; any derivative would need appropriate attribution and share-alike compliance. The ESA Hipparcos catalogue is licensed CC BY-NC 3.0 IGO per [ESA](https://www.cosmos.esa.int/web/hipparcos/catalogues); do not assume all astronomy sources are unrestricted.
- Render coordinates are computed from a J2000 RA/Dec and a sidereal-angle approximation into local **east/north/up**, aligned with the Sydney city axes. Precession, annual aberration, atmospheric extinction/refraction and variable star magnitudes have not been modelled.
- Apparent magnitude, **not physical distance**, drives drawn brightness. The supplemental speckle layer uses approximate faint magnitudes for visual density rather than named-star photometry. Small, slow brightness variations are visual draft only, not scientific scintillation. Urban light pollution and cloud cover are not included. Sky is hidden in PLAN.

## Moon draft

- Position: low-order approximate Sun/Moon ecliptic longitude/latitude equations, equatorial rotation and observer horizontal coordinates. Moon drawn **only above the ideal horizon**.
- Phase: the approximate ecliptic elongation gives illumination fraction and waxing/waning labels. A shaded circle simulates phase and subdued lunar maria, **not a photograph or accurate lunar-surface map**. South-hemisphere lit-side orientation is simplified; libration, topocentric parallax, near-horizon atmospheric effects and exact phase-limb orientation are not corrected.
- For a later precision implementation, evaluate [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT, client-side transforms / Moon phase / rise-set). Keep compiled astronomy assets local and static; avoid runtime API keys, extra canvases for city geometry, or premature dependency growth.

## QA outstanding

1. Compare sunrise/sunset and Moon apparent altitude against Sydney Observatory / authoritative almanac across summer and winter.
2. Compare the sky direction with Stellarium at several Sydney local dates, especially Southern Cross / Orion and around horizon.
3. Review practical visibility from city light pollution and choose a validated fuller bright-star limit.
4. Check visual layering behind WebGL and Canvas fallback, responsive dates / marker positioning, reduced motion, and browser DST edge cases.
