# Fireworks Simulator Research Reference

Status: Stage 2 research and data-feasibility reference, 2026-10-06. No public route or renderer is implemented yet.

## Purpose

This document converts fireworks research into an implementation-ready model for the proposed `fireworks-simulator` LAB project. The intended experience is a fullscreen city-scale visual where a user can select researched fireworks presets or create a custom effect, then view the result against a city in a flat plan-style view or a skyline perspective.

The simulator should be data-led rather than a collection of hand-authored animations. A firework is represented as a device scale plus launch behaviour plus break geometry plus star behaviour plus colour/trail behaviour plus optional secondary effects. Named effects such as Peony, Chrysanthemum, Willow, Crossette and Ring are therefore structured presets over the same underlying renderer.

The first implementation stage is deliberately limited to professional aerial shells. Cakes, mines, Roman candles, ground effects, salutes/reports, audio, show sequencing and city data are deferred.

## Safety and content boundary

The project needs only visual and kinematic information. Do not store or publish explosive formulations, charge quantities, mortar construction, ignition instructions, manufacturing instructions or other information that is unnecessary for visual simulation.

The research sources include professional safety manuals because they contain useful scale terminology and observed dimensions. Only simulation-relevant facts are carried into the project model.

## Core model

Use this mental model throughout implementation:

```text
firework = device scale
         + launch path
         + break geometry
         + star motion
         + star lifetime
         + colour sequence
         + trail behaviour
         + optional modifiers/secondary effects
         + rendering presentation
```

This separation is supported by professional simulation software. Finale 3D treats calibre, effect height, duration, prefire/lift time and effect description as separate properties that contribute to its visual simulation. That is a better model for this project than treating an effect name as a single animation asset.

## Terminology hierarchy

### Device class

Stage 1 renderer scope:

- `aerial-shell`: projection-type shell that rises and breaks near the top of its trajectory.

Deferred device classes:

- `comet`
- `mine`
- `roman-candle`
- `cake`
- `ground-effect`
- `nautical-effect`

Natural Resources Canada distinguishes projection-type fireworks, such as aerial shells, from emission-type effects, such as mines. Finale 3D similarly distinguishes shells, comets, mines, candles and cakes in its effect data model.

### Effect family

An effect family defines the characteristic break geometry and star behaviour. It is not a colour.

High-confidence families for the first library:

| Family | Research description | Renderer implication |
| --- | --- | --- |
| Peony | Spherical break of coloured stars without spark trails. | Uniform radial emission; no persistent trail by default. |
| Chrysanthemum | Spherical break similar to Peony, but stars leave visible spark trails. | Peony-like radial motion plus persistent trail emission. |
| Dahlia | Relatively few, large, bright stars that travel farther than a typical Peony; no trail by default. | Lower particle density, larger star sprites, longer radial reach. |
| Brocade | Long trails of gold glittering sparks. | Dense long-lived gold trail system; usually slower visual decay. |
| Willow | Long bright gold spark trails that hang and descend. | Long-lived trails, stronger visible gravity/droop after expansion. |
| Crown | Long-duration spherical break whose stars droop toward the ground late in their life. | Radial break transitioning to a drooping dome. |
| Palm | Sparse strong radial arms, commonly represented by a small number of prominent tendrils. | Very low arm count, thick/bright paths, strong directional separation. |
| Coconut | Similar to Palm, with relatively few large stars and bright, thick, short-duration trails. | Sparse radial arms with short thick trails. |
| Horsetail / Waterfall | Soft break with long-duration stars that travel little outward before arching and cascading down. | Low break impulse, strong downward evolution, long trails. |
| Crossette | Stars travel outward and then split into four pieces. | Secondary split event per selected star, typically into four child paths. |
| Ring | Stars arranged in a ring instead of a full sphere. | Planar circular distribution, orientation in 3D space matters. |
| Sweeper Ghost | Colour changes occur at different times across sections of the shell. | Spatially phased colour-transition timing. |
| Falling Leaves | Long-lived falling stars with irregular descending movement. | Low expansion and irregular/fluttering downward motion. |
| Shell of Shells / multibreak concept | A parent shell produces multiple secondary bursts or multiple breaks. | Hierarchical spawn events; defer from first renderer if performance is not ready. |

Secondary candidate:

- `kamuro`: commonly described by professional/industry glossaries as a dense, long-lived gold or silver drooping crown. Primary-source terminology in the current research set is weaker than for the families above, so keep it as a later candidate rather than a Stage 1 canonical family.

### Modifiers

Treat these as independent controls wherever practical. Pistil/Core and Strobing are modifiers in the machine-readable model rather than base families.

- pistil/core: smaller central pattern inside a larger break
- strobing: star brightness oscillates between visible and dark states
- break size: small / normal / large
- density: sparse / normal / dense
- brightness: dim / normal / bright
- trail brightness
- trail width
- trail lifetime
- star lifetime
- raggedness versus uniformity
- strobe
- glitter
- crackle visual event
- rising tail
- pistil/core
- colour change
- phased/ghost colour change
- multicolour/variegated distribution

Finale 3D explicitly exposes adjustments for break size, brightness, star density, trail width, trail duration, star duration, droop and raggedness/uniformity. These are strong candidates for custom-mode controls because they map cleanly to visual parameters.

## Physical scale

### Regulatory approximation by shell calibre

Natural Resources Canada's Display Fireworks Manual states these approximate relationships for aerial shells:

- burst height: about **33 m per 25 mm** of nominal shell diameter;
- maximum star-dispersion diameter: about **27 m per 25 mm** of nominal shell diameter.

Derived reference values:

| Nominal shell | Calibre | Approx burst height | Approx maximum spread diameter |
| --- | ---: | ---: | ---: |
| 3 in | 75 mm | 99 m | 81 m |
| 4 in | 100 mm | 132 m | 108 m |
| 5 in | 125 mm | 165 m | 135 m |
| 6 in | 150 mm | 198 m | 162 m |
| 8 in | 200 mm | 264 m | 216 m |
| 10 in | 250 mm | 330 m | 270 m |
| 12 in | 300 mm | 396 m | 324 m |

These are scale references, not exact product specifications. Do not derive every preset solely from calibre.

### Manufacturer variation

One current professional shell catalogue provides examples that differ from the regulatory approximation:

- 75 mm display shells: stated effect height about 100 to 110 m;
- 125 mm display shells: stated effect height about 130 to 150 m;
- 150 mm display shells: stated effect height about 160 to 170 m.

This reinforces an important schema decision: store `calibreMm` and `burstHeightM` independently. Calibre can supply a fallback baseline, while a researched product or preset may override height.

The manufacturer examples are evidence of variation only. They are not universal defaults.

## Empirical burst observations and motion

The strongest quantitative motion source found is Zrnić et al., *Fireworks on Weather Radar and Camera* (Bulletin of the American Meteorological Society, 2020). The researchers recorded a public display with video and weather radar.

### Measured Peony example

One analysed Peony burst had approximately:

- burst altitude: **190 m** above ground;
- maximum diameter: **100 m**;
- visible stars counted: **121**;
- visible lifetime: about **1 s**;
- initial radial expansion speed: about **170 m/s**.

The paper fitted the observed radial velocity to:

```text
v(t) = 170 / (1 + 0.04 * 170 * t)
```

where `t` is seconds after the start of the tracked expansion. The important visual lesson is not the exact coefficient. It is that constant-speed radial expansion is wrong: aerodynamic drag rapidly slows the stars immediately after the break.

Integrating that fitted curve gives a radial displacement model for this one calibration case:

```text
r(t) = ln(1 + 0.04 * 170 * t) / 0.04
```

At one second this is about 51 m radius, consistent with a burst roughly 100 m across.

Do not use `170 m/s` or `0.04` as universal values for every shell. Store this as an empirical calibration profile for a Peony-like radial shell, then tune other families as explicitly labelled rendering hypotheses until better measurements exist.

### Whole-display observed ranges

The same study reports:

- typical burst heights: **100 to 200 m**;
- highest observed burst: about **270 m**;
- most burst diameters: **100 to 150 m**;
- a few burst diameters exceeded **200 m**;
- visible duration: approximately **1 to 6 s**;
- terminal fall velocity for stars in most symmetric Peony-like bursts: about **14 to 16 m/s**;
- observed Willow terminal velocity: about **22 m/s** in one measured case.

These observations provide sanity bounds for the first renderer. They are observations from one display, not specifications for all commercial fireworks.

## Launch timing

Professional show software distinguishes firing/ignition time from the perceived effect time. For aerial shells, the prefire value is commonly associated with lift time. Finale 3D stores lift/prefire separately from effect duration and effect height.

The first dataset therefore reserves:

- `liftTimeS`
- `burstHeightM`
- `visibleDurationS`

as independent fields.

Current research does not provide a sufficiently authoritative calibre-by-calibre lift-time table for this project. Stage 1 presets should leave research-backed `liftTimeS` null unless a verified product source is added. The prototype renderer may use an explicitly labelled provisional visual default, but it must not be presented as measured data.

## Colour model

Colour belongs to stars/tips and trails, not to the effect family itself. A Peony can be red, blue or multicoloured; a Pistil can use a different centre colour; a changing shell can transition over time.

Professional simulation terminology supports a much broader palette than basic RGB. For the first project palette, use a restrained subset that is easy to distinguish visually:

- red
- ruby/pink
- orange
- yellow/lemon
- green/lime
- blue/sea blue
- aqua/cyan
- violet/purple
- white
- gold
- silver
- charcoal/amber

Gold, silver and charcoal need special treatment because professional terminology often implies spark trails rather than a simple solid-colour point. The implementation data therefore distinguishes `tipColour` from `trailColour` and can mark palette entries as trail-oriented.

Exact screen colours are presentation choices rather than measured physical data. Store them under rendering defaults, not research facts.

## Colour transitions and layering

The model must support at least:

- single colour;
- simultaneous colour change, such as red to blue;
- centre and outer-shell colours, such as blue Peony with red Pistil;
- trail colour separate from star-tip colour;
- multicolour distributions;
- spatially phased colour changes for Ghost effects.

Represent transitions as ordered keyframes over normalized star lifetime rather than hard-coding named combinations.

Example conceptual structure:

```json
{
  "tipSequence": [
    { "at": 0, "colour": "red" },
    { "at": 0.55, "colour": "blue" }
  ],
  "trailColour": "gold"
}
```

## Renderer physics profiles

The renderer should use a small set of reusable motion profiles rather than one implementation per named shell:

| Profile | Intended families | Core behaviour |
| --- | --- | --- |
| `radial-drag` | Peony, Chrysanthemum, Dahlia | Strong radial impulse followed by rapid drag; gravity becomes visible later. |
| `radial-droop` | Willow, Brocade, Crown | Radial break with long-lived particles/trails and stronger late downward motion. |
| `sparse-arms` | Palm, Coconut | Small number of coherent radial arms rather than a uniform sphere. |
| `soft-cascade` | Horsetail, Waterfall | Low outward impulse and early transition into downward cascade. |
| `planar-pattern` | Ring and later hearts/shapes | Points distributed on a plane that can be rotated in 3D. |
| `branching` | Crossette | Parent trajectories split into child trajectories during the visible lifetime. |
| `nested` | Pistil / concentric combinations | Multiple coordinated layers with independent colour and scale. |
| `phased-colour` | Sweeper Ghost | Geometry can remain radial while colour timing varies spatially. |
| `flutter-fall` | Falling Leaves | Irregular low-energy downward trajectories. |
| `spawn` | Shell of Shells / multibreak | Parent effect creates timed child bursts. Deferred if first renderer cannot support it cleanly. |

### Minimum motion pipeline

For each aerial shell:

1. launch along a metre-based trajectory toward `burstHeightM`;
2. trigger the break at the requested height/time;
3. generate direction vectors according to geometry;
4. apply an initial velocity or family-specific impulse;
5. apply drag so the initial burst slows quickly;
6. apply gravity as velocities fall;
7. update colour, strobe and secondary events over normalized lifetime;
8. emit trail particles from the parent trajectory when enabled;
9. fade star and trail systems independently;
10. recycle particles instead of allocating continuously during a show.

Do not simulate detailed combustion or fluid dynamics in the first prototype. The research supports a visually grounded particle system without requiring a full physical solver.

## Research facts versus rendering defaults

Every numeric field should have an evidence class. The dataset currently uses these concepts:

| Evidence class | Meaning |
| --- | --- |
| `measured` | Directly measured in a scientific observation. |
| `regulatory-approximation` | Approximation supplied in an official display-fireworks manual. |
| `manufacturer-declared` | Product value stated by a manufacturer/supplier. |
| `professional-simulator-convention` | Field or semantic convention used by professional show/simulation software. |
| `derived` | Mathematically calculated from a cited source value. |
| `rendering-hypothesis` | Provisional value chosen to create a useful browser visual. It must not be presented as measured reality. |

Keep these classes visible in the data model. A future methodology panel can explain that the simulator is research-calibrated rather than a certification or engineering tool.

## Proposed custom-mode controls

### Research-grounded controls

- shell calibre
- burst height
- maximum burst/spread diameter
- visible duration
- effect family / break geometry
- primary colour
- secondary/pistil colour
- trail enabled/type
- colour transition pattern

### Rendering controls

- star density
- star visual size
- brightness
- break-speed multiplier
- drag multiplier
- gravity/droop multiplier
- symmetry
- raggedness
- trail width
- trail density
- trail lifetime
- strobe rate
- crossette split timing
- child count where the family supports secondary bursts
- smoke amount, once researched/implemented

The UI should distinguish realistic scale controls from artistic controls. It should be possible to return every custom parameter to the named preset default.

## First preset library

The first renderer should test representative behaviours rather than maximize the catalogue. Recommended initial presets:

1. Red Peony
2. Blue Chrysanthemum
3. Pastel Dahlia
4. Gold Brocade
5. Gold Willow
6. Gold Crown
7. Silver Palm
8. Gold Coconut
9. Brocade Horsetail
10. Blue to Yellow Crossette
11. Rainbow Ring
12. Blue Peony with Red Pistil
13. White Strobing Willow
14. Green to Purple Ghost
15. Red and Green Falling Leaves

Use 75, 100, 125 and 150 mm shell scales across the library. Do not imply that a particular effect can only exist at the chosen prototype calibre.

The machine-readable prototype library is in `src/data/fireworks-simulator/firework-presets.json`. Values under `renderDefaults` are deliberately labelled as provisional visual hypotheses. Research-backed scale and motion references live alongside them so later implementation does not lose provenance.

## Metre-based scene model

The future city and firework scene should share metre-based coordinates.

Benefits:

- a 150 m burst remains visually comparable with a 150 m building;
- switching between 2D and skyline modes can change camera/projection rather than rescale the firework rules;
- city-specific geometry can be loaded independently from the fireworks library;
- zoom and field of view can be defined without breaking physical proportions.

Proposed scene convention:

```text
x = horizontal city/local east-west axis in metres
y = vertical height above local ground/water in metres
z = depth / north-south axis in metres
```

The exact local coordinate reference for Sydney is a later city-data decision.

## Performance considerations for browser implementation

Research star counts are not the same thing as renderer particle counts. A physical shell may contain many stars, while each visible trail may require multiple screen particles. The browser model therefore needs a separate rendering budget.

Recommended first prototype:

- pooled particles;
- no per-frame object allocation in the hot path;
- separate star and trail particle budgets;
- adaptive visual density for mobile;
- deterministic seeded randomness for repeatable presets and screenshots;
- reduce or remove trail history under `prefers-reduced-motion` if needed while retaining the final shape/state;
- begin with Canvas 2D unless the first prototype proves that WebGL/Three.js is necessary for the skyline or particle count.

The project already permits Three.js when there is a real 3D requirement, but it should not be added before measurement.

## Source hierarchy

Use sources in this order when parameters conflict:

1. direct scientific measurement of the relevant property;
2. official government/regulatory technical reference;
3. manufacturer-declared product performance;
4. professional simulation terminology/conventions;
5. industry glossary corroboration;
6. rendering hypothesis.

Never silently average conflicting values. Store the source and reason for the chosen default.

## Known gaps before a release candidate

The following remain unresolved and should not be represented as researched facts yet:

- reliable lift-time ranges by shell calibre and effect type;
- measured initial expansion velocities for families other than the one Peony example;
- measured star counts/distributions by effect family and calibre;
- quantitative trail lifetimes, droop coefficients, strobe rates and glitter behaviour;
- wind-drift response for visible stars/trails at city-display scale;
- smoke generation, dispersion and illumination;
- exact colourimetry of pyrotechnic stars as perceived by camera/display;
- city geometry sources and licences;
- Sydney firing-site assumptions, which are not needed for the visual prototype;
- audio timing and propagation.

These gaps do not block a visual prototype because the dataset can clearly separate measured facts from rendering hypotheses.

## Stage 3 recommendation

The next approved stage should build only the smallest visual test:

- no public content entry yet unless the user wants the local route exposed through the normal project collection;
- one fullscreen dark scene;
- metre-based vertical scale;
- simple temporary Sydney-like horizon or neutral scale grid, not researched city geometry yet;
- 3 or 4 representative shells: Peony, Chrysanthemum, Willow and Crossette;
- 75, 100, 125 and 150 mm scale selector;
- play/reset and preset selector;
- optional simple custom controls for colour, height and spread;
- one desktop and one mobile local review;
- focused performance measurement before deciding Canvas 2D versus WebGL/Three.js.

City research and 2D/skyline switching should be the following stage once the firework motion itself looks convincing.

## Research sources

Full provenance, retrieval dates and publication/reuse notes are kept in [`../data/sources/fireworks-simulator.md`](../data/sources/fireworks-simulator.md). The active project plan is [`exec-plans/active/010-fireworks-simulator.md`](exec-plans/active/010-fireworks-simulator.md).
