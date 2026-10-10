# Fireworks Simulator source and provenance note

Project: Fireworks Simulator
Stable slug: `fireworks-simulator`
Category during review: LAB
Research snapshot: 2026-10-06
Update model: manual research snapshot
Public browser dataset: not released
Processing script: none yet
Reproduction command: none yet; the current machine-readable file is maintained manually from cited research and validated against its JSON Schema

## Scope

This source note covers the research dataset used to model visual fireworks behaviour. It does not cover city geometry, Sydney skyline data, music/show sequencing or audio.

The research dataset contains only simulation-relevant facts and derived values. It intentionally excludes explosive formulations, charge quantities, mortar construction, firing instructions and manufacturing details.

## Sources

### 1. Natural Resources Canada: Display Fireworks Manual 2010

- Publisher: Natural Resources Canada, Explosives Regulatory Division
- Title: *Display Fireworks Manual 2010*, second edition
- Source URL: https://natural-resources.canada.ca/minerals-mining/explosives-fireworks-ammunition/explosives/display-fireworks-manual-2010
- Retrieved: 2026-10-06
- Role: official terminology and scale approximation for aerial shells
- Relevant facts retained:
  - projection-type versus emission-type distinction;
  - aerial-shell concepts such as break, stars and burst height;
  - approximate burst height of 33 m per 25 mm nominal shell diameter;
  - approximate maximum star-dispersion diameter of 27 m per 25 mm nominal shell diameter.
- Reuse: Government of Canada information is generally made available under the Open Government Licence - Canada when offered under that licence. The licence permits copying, adaptation and redistribution with attribution. Before public release, confirm the specific manual page remains covered by the applicable Government of Canada terms and include the required attribution.
- Licence reference: https://open.canada.ca/en/open-government-licence-canada
- Notes: the project uses the manual as a scale reference, not as an operational fireworks guide.

### 2. Zrnić, Zhang, Melnikov and Kabela: Fireworks on Weather Radar and Camera

- Publisher: American Meteorological Society
- Journal: *Bulletin of the American Meteorological Society*
- Publication: 2020, volume 101, issue 2, pages E90-E108
- DOI: https://doi.org/10.1175/BAMS-D-18-0248.1
- Article URL: https://journals.ametsoc.org/view/journals/bams/101/2/bams-d-18-0248.1.xml
- NOAA repository record: https://repository.library.noaa.gov/view/noaa/26172
- Retrieved: 2026-10-06
- Role: direct empirical observation of burst dimensions, lifetime and particle/star motion
- Relevant facts retained:
  - one Peony example at about 190 m altitude, about 100 m maximum diameter, 121 counted visible stars and about 1 s visible lifetime;
  - fitted initial radial expansion about 170 m/s, with strong quadratic-drag deceleration;
  - fit shown as `v(t) = 170 / (1 + 0.04 * 170 * t)` for that measured burst;
  - typical observed burst heights 100-200 m and highest about 270 m;
  - most burst diameters 100-150 m, with a few above 200 m;
  - visible burst durations about 1-6 s;
  - Peony-like terminal star velocities about 14-16 m/s;
  - one Willow observation about 22 m/s terminal velocity.
- Reuse: copyrighted scholarly article. The repository stores only factual observations, short mathematical facts and original derived implementation notes, not article text, figures or media. Recheck AMS permissions if future work proposes redistributing any original figure/table rather than citing it.

### 3. American Pyrotechnics Association: Display Fireworks Glossary

- Publisher: American Pyrotechnics Association
- Source URL: https://www.americanpyro.com/display-fireworks-glossary
- Retrieved: 2026-10-06
- Role: industry terminology cross-check for common effect families
- Relevant terminology retained: Brocade, Chrysanthemum, Crossette, Dahlia, Peony, Pistil, Roman Candle, Spider, Strobe and Waterfall/Horsetail-style descriptions.
- Reuse: used as terminology/reference only. No glossary text is redistributed verbatim in the machine-readable dataset. Check site terms before copying any source media or substantial text.

### 4. Finale 3D: Visual Descriptive Language and effect data documentation

- Publisher: Finale Fireworks / Finale 3D
- Retrieved: 2026-10-06
- Role: professional simulation data conventions and modern pyrotechnic terminology
- Key URLs:
  - effect glossary: https://finale3d.com/documentation/vdl-effect-glossary/
  - effect adjustment terms: https://finale3d.com/documentation/vdl-effect-adjustment-terms-big-bright-etc/
  - colours: https://finale3d.com/documentation/vdl-colors/
  - prefire/lift time: https://finale3d.com/documentation/prefire/
  - effect columns: https://finale3d.com/documentation/effects-table-columns/
  - supplier import fields: https://finale3d.com/documentation/importing-supplier-catalog-into-finale-3d/
- Relevant conventions retained:
  - calibre/size, height, duration and prefire/lift time are distinct effect attributes;
  - effect description defines visual family/behaviour in combination with scale/timing fields;
  - modifiers can change break size, density, brightness, trail width, trail duration, star duration, droop and raggedness/uniformity;
  - colour and trail semantics can be independent;
  - Crossette splits, Ring is planar, Pistil/Core is nested, Horsetail cascades, and Sweeper Ghost phases colour changes spatially.
- Reuse: used as terminology and field-design reference. The project does not copy Finale's simulator code, assets, full colour table or proprietary effect library. Recheck terms before public redistribution of any substantial Finale-authored content.

### 5. JinPing Fireworks professional shell catalogue examples

- Publisher/supplier: JinPing Fireworks
- Retrieved: 2026-10-06
- Role: evidence that product-declared effect height varies from simple calibre approximations
- Relevant URLs:
  - 75 mm / 3 inch series: https://www.pyrotechnic-manufacture.com/3-series-display-shell-products/
  - 125 mm / 5 inch display shell examples: https://www.pyrotechnic-manufacture.com/china-wholesale-cold-flame-indoor-fireworks-factories-5-series-display-shell-jinping-fireworks-products/
  - 150 mm / 6 inch display shell examples: https://www.pyrotechnic-manufacture.com/china-wholesale-shells-fireworks-factories-6-series-display-shell-jinping-fireworks-products/
- Relevant examples retained:
  - 75 mm normal display-shell effects listed at about 100-110 m effect height;
  - 125 mm normal display-shell effects listed at about 130-150 m effect height;
  - 150 mm normal display-shell effects listed at about 160-170 m effect height.
- Reuse: manufacturer-declared examples are retained only as factual comparison points with attribution. Do not treat one supplier's products as universal standards and do not copy product photos or catalog text without permission.

### 6. Secondary Kamuro corroboration

- Phantom Fireworks glossary: https://fireworks.com/education-and-safety/glossary
- Retrieved: 2026-10-06
- Role: secondary terminology corroboration only
- Relevant point: Kamuro is described as a dense gold/silver glittering break with heavy long trails.
- Confidence: medium. Keep Kamuro outside the canonical first renderer family list until a stronger primary/professional terminology source is recorded.

## Derived reference values

The following values are deterministic calculations from the NRCan approximation and are safe to regenerate:

| Calibre | Nominal | Approx burst height | Approx max spread diameter |
| ---: | ---: | ---: | ---: |
| 75 mm | 3 in | 99 m | 81 m |
| 100 mm | 4 in | 132 m | 108 m |
| 125 mm | 5 in | 165 m | 135 m |
| 150 mm | 6 in | 198 m | 162 m |
| 200 mm | 8 in | 264 m | 216 m |
| 250 mm | 10 in | 330 m | 270 m |
| 300 mm | 12 in | 396 m | 324 m |

Formulae:

```text
burstHeightM = calibreMm / 25 * 33
maxSpreadDiameterM = calibreMm / 25 * 27
```

These are regulatory approximations, not guaranteed product performance.

The one empirical Peony radial displacement expression in the research document is derived by integrating the velocity fit published in the AMS paper. It is labelled `derived` and tied to that calibration case only.

## Machine-readable research file

Current file:

```text
src/data/fireworks-simulator/firework-presets.json
```

Schema:

```text
src/data/fireworks-simulator/firework-presets.schema.json
```

The file separates:

- source-backed scale references;
- empirical physics observations;
- qualitative effect-family definitions;
- rendering palette choices;
- provisional renderer profiles and presets.

Fields marked or described as `rendering-hypothesis` are implementation defaults, not measured physical facts.

## Units

- distance and height: metres
- shell calibre: millimetres
- speed: metres per second
- time: seconds
- angles: degrees
- colour timing: normalized 0-1 effect lifetime

No timezone applies to the fireworks research library.

## Validation

Stage 2 validation should confirm:

- JSON parses successfully;
- JSON validates against the committed schema;
- all source reference IDs used by research sections exist;
- all effect family IDs used by presets exist;
- all palette IDs used by presets exist;
- calibre-derived height/spread values reproduce the documented formulae;
- evidence classes are present for research-backed and provisional values;
- no operational pyrotechnic construction/manufacturing data is included.

## Known limitations and release blockers

- Lift time is structurally supported but not yet populated with research-backed calibre defaults.
- Family-specific initial velocities, star counts, trail lifetime and droop coefficients are not sufficiently measured in the current source set.
- The current palette is a renderer palette, not pyrotechnic colourimetry.
- One manufacturer is used only to demonstrate product variation; broader manufacturer sampling is required before claiming market ranges.
- Source/reuse terms must be rechecked during release-candidate QA, particularly for non-government terminology sources.
- No public dataset should be emitted under `public/data/fireworks-simulator/` until the user approves the visual prototype and the data-release checklist is completed.
