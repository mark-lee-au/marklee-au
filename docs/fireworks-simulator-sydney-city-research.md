# Fireworks Simulator: Sydney City Feasibility

Research date: 2026-10-06

Stage: 4, source and geometry feasibility only

This document defines the Sydney city data stack for the Fireworks Simulator. Stage 5 now implements the shared local-metre browser contract and both camera projections using a clearly labelled calibration fixture. Real Overture Sydney profiling remains open because the execution environment could not retrieve the external source extract. The fixture must be replaced before the project claims real building completeness or expands to a larger city area.

## Decision summary

Sydney is feasible as the first city without using proprietary 3D models or restricted NSW Government building products.

Recommended source stack:

1. **Overture Maps Buildings** for the global building footprint baseline and available building-part/height attributes.
2. **NSW Elevation and Depth via ELVIS** for Sydney-specific terrain and height checking or enrichment, subject to inspection of the exact selected tiles.
3. **NSW Water foundation data** for Sydney Harbour and water polygons.
4. **Official public landmark dimensions** for a very small procedural landmark layer where ordinary building extrusion does not describe the structure well.
5. **GDA2020 / MGA Zone 56, EPSG:7856** as the Sydney preprocessing coordinate reference system, converted to local metre coordinates for the browser.

The City of Sydney Floor Space and Employment Survey and NSW Spatial Digital Twin Geoscape building data are not approved as Stage 5 geometry sources. The former has unresolved public reuse metadata in the current data catalogue and the latter is distributed to NSW state and local government under restricted terms.

## Visual target

The city is a spatial reference for the fireworks, not a photorealistic digital twin.

The target visual language is:

- black fullscreen field;
- fine wireframe or restrained filled building massing;
- real metre scale;
- recognisable harbour form and a small number of landmarks;
- no satellite imagery or conventional basemap styling;
- fireworks remain the visual focus;
- the same city data supports a top-down plan view and an oblique skyline view.

Accuracy should be sufficient for recognisable relative scale and position. Survey-grade architectural reconstruction is outside scope.

## Source assessment

| Source | Candidate use | Licence / access | Decision | Main limitation |
| --- | --- | --- | --- | --- |
| Overture Maps Buildings | Building footprints, building parts, names and available heights | Buildings theme is ODbL | **Use as global baseline** | Height and building-part completeness must be measured for the Sydney extract |
| OpenStreetMap through Overture | Community building geometry and attributes | ODbL, attribution required | **Use through Overture baseline** | Quality and attribute completeness vary |
| NSW Elevation and Depth / ELVIS | LiDAR point cloud, terrain and height enrichment | Open data; Data.NSW records Creative Commons Attribution | **Use conditionally** | Exact Sydney capture date, coverage, classification and tile metadata must be checked before processing |
| NSW Water foundation data | Harbour/water polygons and shoreline context | Open NSW foundation data; exact resource licence must be pinned at extraction | **Preferred Sydney water source** | Use hydro/water polygons for the harbour, not a coast-only line |
| City of Sydney FES 2022 | Authoritative building-related GIS reference | Current Data.gov.au catalogue metadata shows licence `Not Specified` | **Blocked unless licence is clarified** | Reuse terms are not clear enough for publication |
| City of Sydney SDCP building height in storeys | Planning controls | Current public catalogue entry does not resolve a suitable reuse contract for this project | **Do not use for physical skyline height** | Planning-control storeys are not measured current building heights |
| NSW Spatial Digital Twin Geoscape buildings | Footprints, height, roof information | Distribution described as exclusive to NSW Government agencies with restricted terms | **Reject for this public portfolio** | Restricted access and redistribution |
| Third-party 3D model libraries | Landmark meshes | Varies and often unclear | **Reject by default** | Redistribution and provenance are difficult to defend |
| Official landmark pages / engineering references | Public dimensions for procedural landmark cues | Factual reference only | **Use selectively** | Enough for simplified geometry, not exact architectural models |

Detailed provenance and source links are recorded in `data/sources/fireworks-simulator-sydney-city.md`.

## Why Overture is the baseline

Overture's buildings theme is designed for 2D and 3D visualisation and has global coverage. A building is supplied as a polygon or multipolygon and may contain `height`, `num_floors`, roof attributes and a `has_parts` flag. `building_part` features can contain their own footprint, `height`, `min_height`, floor and roof attributes.

That structure matches the simulator well:

- a plain building can become a simple extruded prism;
- a building with parts can become several stacked/extruded prisms;
- the same footprint works in top-down and skyline views;
- the source can be reused when later cities are added;
- a stable global schema prevents a Sydney-only city implementation.

Overture's documentation also states that many height fields can be absent. Stage 5 must measure actual Sydney completeness rather than assuming every building has usable vertical data.

## Sydney-specific elevation strategy

NSW Spatial Services publishes point clouds captured from LiDAR or derived from airborne imagery, with point-cloud and DEM products available through ELVIS. This provides an open path to better Sydney vertical information without using the restricted Geoscape building product.

Stage 5 should not immediately process all Sydney LiDAR. It should:

1. choose a compact Sydney test area;
2. identify the exact ELVIS tiles intersecting that area;
3. record capture date, source, licence and available classifications from the tile metadata;
4. derive only the information the visual needs;
5. keep raw LAS/LAZ files outside the repository;
6. compare the derived height coverage with Overture before deciding if LiDAR enrichment is worth the added pipeline cost.

Possible outputs from LiDAR are:

- ground elevation for each building footprint;
- approximate roof elevation;
- approximate building height from roof minus ground;
- a low-resolution terrain surface if the skyline view benefits from it.

Do not store raw point clouds in `public/` or commit them to Git.

## Water and harbour geometry

Sydney needs water polygons, not only a coastline polyline. Sydney Harbour is an estuarine system with many bays, inlets and islands, so a state coastline line alone is not enough for the visual.

Use NSW foundation hydro/water polygon features for the Sydney-specific scene if their exact extraction licence is confirmed in Stage 5. Simplify geometry during preprocessing to the minimum level that preserves the harbour silhouette at the intended camera distance.

A later non-Australian city can use an Overture or equivalent global water source while retaining the same browser contract.

## Landmark strategy

Ordinary towers can come from Overture building footprints and heights. A few structures need separate treatment because an extruded footprint would not be recognisable.

Initial landmark candidates:

- Sydney Opera House;
- Sydney Harbour Bridge;
- Sydney Tower.

The landmark layer should use original procedural or simplified geometry, not downloaded third-party meshes.

Examples of useful official scale references found during Stage 4:

- NSW Public Works states that the Sydney Opera House reaches about 65 m high and covers about 1.8 ha.
- NSW Government states that the Sydney Harbour Bridge reaches 134 m above the harbour; Transport for NSW also records a 503 m arch span and 89 m pylons.

These facts are enough to calibrate simplified wireframe cues. They are not a basis for survey-grade reconstruction.

### Proposed landmark representation

```text
opera-house
  simplified site footprint
  several procedural shell arcs / ribs
  calibrated maximum height

harbour-bridge
  deck centreline
  arch curve
  four simplified pylons
  calibrated span and height

sydney-tower
  footprint / centre point
  narrow shaft
  observation/turret massing
  calibrated from an approved source before Stage 5 implementation
```

If a landmark can be represented well enough by Overture building parts, prefer those parts over custom geometry.

## Coordinate model

### Preprocessing CRS

Use **GDA2020 / MGA Zone 56, EPSG:7856** for Sydney preprocessing.

Reasons:

- coordinates are in metres;
- Sydney lies in MGA Zone 56;
- it is appropriate for engineering/topographic work;
- metre units match the existing fireworks model.

### Browser coordinates

Do not send large MGA eastings/northings into the animation loop. Every city should define a local origin and store local coordinates in metres.

```text
x = projected easting - city origin easting
y = projected northing - city origin northing
z = elevation / height in metres
```

Axis convention:

- `x`: east;
- `y`: north;
- `z`: up.

This creates one reusable 3D city space. The current Stage 3 side-on firework renderer can later map its burst plane into this space without changing the physical units.

### Proposed city metadata contract

```json
{
  "schemaVersion": 1,
  "city": {
    "id": "sydney-au",
    "name": "Sydney",
    "countryCode": "AU",
    "sourceCrs": "EPSG:7856",
    "units": "m",
    "axis": { "x": "east", "y": "north", "z": "up" },
    "origin": {
      "easting": 0,
      "northing": 0,
      "elevation": 0
    }
  },
  "boundsLocalM": {
    "minX": 0,
    "minY": 0,
    "maxX": 0,
    "maxY": 0
  },
  "sources": [],
  "cameras": {}
}
```

The zero values are placeholders. Stage 5 must derive and commit the actual origin and bounds from the selected Sydney extract.

## Proposed derived browser data

Do not serve source GIS formats directly to the browser. Stage 5 should generate a compact city-specific dataset.

### Buildings

Minimum record:

```json
{
  "id": "stable-derived-id",
  "footprint": [[0, 0], [12.4, 0], [12.4, 18.1], [0, 18.1]],
  "heightM": 42.5,
  "minHeightM": 0,
  "heightSource": "overture",
  "confidence": "source"
}
```

Optional fields:

- building parts;
- roof height/shape if visually useful;
- name for landmark matching;
- source feature IDs kept in metadata or a debug build;
- ground elevation if terrain is enabled.

### Height source classification

Each derived height should record one of:

- `overture-height`;
- `overture-floors-derived`;
- `lidar-derived`;
- `landmark-reference`;
- `fallback-rendering-height`.

A fallback rendering height is visual scaffolding, not factual height, and must never be represented as measured/source data.

### Water

Store simplified polygon rings in local metres. Keep source IDs/provenance in build metadata, not in every hot-loop vertex.

### Terrain

Terrain is optional for the first Sydney prototype. If the visual result works with a flat local ground plane, defer terrain. If terrain materially improves the skyline, export only a low-resolution grid or simplified profile needed by the camera.

### Landmarks

Store a small procedural definition with source references and dimensions. Do not bundle external mesh files unless a future source has explicit compatible redistribution terms.

## Camera model

The two requested views should be camera modes over the **same city coordinates**, not separate city assets.

### 2D plan mode

- orthographic top-down view;
- `x` and `y` map to screen position;
- buildings read primarily from footprints;
- firework launch sites can be placed directly on the city plane;
- burst altitude remains `z` and can be indicated by scale/labels or a temporary side projection if needed.

### Skyline mode

- oblique or perspective projection;
- buildings extrude from the same footprints using `z` height;
- depth sorting is based on camera-space distance;
- firework launch point uses the same `x`, `y` location and burst `z` altitude;
- camera preset is stored in the city metadata so Sydney loads with a composed harbour/CBD view.

### Renderer decision

Do not add Three.js in Stage 4.

Stage 5 should first test a small wireframe city with the existing Canvas 2D approach plus a simple 3D-to-2D camera transform. The geometry target is deliberately basic and does not yet require materials, lighting or complex mesh handling. Keep the firework simulation state independent from the projection code.

Move the city renderer to Three.js/WebGL only if the Stage 5 benchmark shows a clear need, for example:

- depth sorting becomes fragile;
- landmark geometry becomes too complex for the custom projection;
- the combined city plus fireworks frame budget drops below the project target;
- later camera movement needs real 3D clipping and transforms.

## Proposed Stage 5 processing pipeline

```text
Overture building + building_part extract
             |
             v
       Sydney test bounds
             |
             +--------------------+
             |                    |
             v                    v
        EPSG:7856           NSW water extract
             |
             v
     measure height coverage
             |
        [optional]
       ELVIS LiDAR
             |
             v
  derive/compare vertical data
             |
             v
 simplify + localise coordinates
             |
             v
 add procedural landmarks
             |
             v
 validate source classes / bounds
             |
             v
 compact browser city dataset
             |
             v
 Canvas 2D plan + skyline benchmark
```

## Licensing and publication approach

Overture's buildings theme is ODbL because it includes OpenStreetMap. OSM Foundation guidance requires visible attribution for public interactive maps and treats adapted/enhanced OSM data as a potential derivative database.

Project policy for this simulator should be conservative:

- show visible `© OpenStreetMap contributors, Overture Maps Foundation` attribution when Overture building geometry is displayed;
- provide a methodology/source panel with the applicable ODbL link and NSW source attribution;
- if Stage 5 publishes an adapted building database that combines Overture geometry with derived height attributes, publish that derived city database under ODbL and make the processing method available;
- keep separately sourced water or other layers identifiable in provenance;
- pin the exact source versions, retrieval dates and licences used by each generated city bundle.

This is a project data-governance choice, not legal advice. Recheck the upstream licence text before public release.

## Stage 5 data-quality audit

Before the city renderer is considered valid, record at least:

| Metric | Why |
| --- | --- |
| Total building features | Confirms extract size |
| Buildings with direct height | Measures Overture vertical coverage |
| Buildings with floor count but no height | Quantifies possible derived-height fallback |
| Buildings with parts | Indicates 3D detail potential |
| Buildings using fallback renderer height | Shows how much of the skyline is synthetic |
| LiDAR-enriched buildings, if used | Measures value added by the extra pipeline |
| Geometry vertex count before/after simplification | Controls browser cost |
| Water polygon vertex count | Controls harbour payload |
| Raw and compressed client payload | Controls page cost |
| Parse time and first-render time | Measures browser impact |
| Combined city + firework FPS | Decides Canvas 2D versus WebGL |

The audit should also visually check at least the Opera House, Harbour Bridge, Circular Quay/CBD massing and the relationship between 100 to 250 m firework burst heights and nearby structures.

## Stage 5 initial scene boundary

Do not start with the whole metropolitan area.

The first city extract should be a compact harbour/CBD test scene large enough to include:

- Sydney Opera House;
- Sydney Harbour Bridge;
- Circular Quay;
- a representative section of the CBD skyline;
- enough harbour water to place fireworks over water without crowding the camera.

The exact bounding box should be chosen during Stage 5 from the real data, after checking feature count and camera composition. Do not hard-code a bounding box from rough web coordinates in this research document.

## Stage 5 implementation checkpoint

Stage 5 confirms that the proposed coordinate/camera architecture works in the existing Canvas 2D renderer. Firework particles, buildings, water and procedural landmarks now share one `x east`, `y north`, `z up` metre space. The UI switches between an orthographic plan projection and a perspective skyline projection without swapping city datasets.

The browser contract is now `public/data/fireworks-simulator/sydney-city.json`, generated by `scripts/data/fireworks-simulator/prepare_sydney_city.py`. The script can write either the checked-in calibration fixture or a bounded Overture building extract using the same output shape.

The checked-in fixture is deliberately limited:

- landmark positions/heights are based on documented reference points;
- ordinary CBD building footprints, widths/rotations and most heights are procedural rendering hypotheses;
- the harbour polygon is a visual calibration envelope, not NSW hydro data;
- named tall-building massing is used only to check skyline scale and is marked secondary calibration;
- it must not be described as an Overture, cadastral or survey-derived Sydney model.

At Stage 5 research time Overture lists `2026-09-23.1` as the current release. Its official Python client supports bounding-box GeoJSON downloads and uses the STAC catalogue to find the latest release. The real-data pass must record the exact release used. Overture schema v2.0.0 keeps `height`, `num_floors`, `has_parts` and `building_part` as the relevant vertical/detail fields.

Current calibration bundle profile: 31 building prisms, 3 procedural landmark structures, 124 building footprint vertices, 19 harbour vertices and 10,320 raw JSON bytes (2,602 bytes with a local gzip check). This is a renderer benchmark only. It is not evidence about Overture's Sydney coverage.

A headless Chromium integration harness reported 60 FPS with the current 156-particle Peony in both desktop skyline and plan modes at 1440 x 900, plus 60 FPS with 97 particles at 390 x 844. Canvas 2D therefore remains the default for the next data pass.

The real-data gate still needs: actual building count, direct-height percentage, floor-only percentage, default-height percentage, building-part coverage, vertex reduction, gzip/Brotli payload, real water geometry, optional ELVIS value and final parse/first-draw timing.

## Multi-city extension

Sydney should be an instance of a city contract, not a special renderer.

Future city bundles should differ only by:

- source CRS used during preprocessing;
- local origin;
- bounds;
- source/provenance metadata;
- buildings/water/terrain data;
- landmark definitions;
- default cameras.

The browser contract stays in local metres with `x east`, `y north`, `z up`.

This means London, New York, Paris, Tokyo or another city can later reuse the firework physics and camera code even if their best local geometry sources differ.

## Stage 4 conclusion

**Feasibility: approved with conditions.**

There is a defensible open-data route for Sydney. Overture provides the global building backbone, NSW open elevation data can improve vertical accuracy if the selected Sydney tiles support it, and NSW foundation water data can provide the harbour geometry. Restricted Geoscape building data is unnecessary.

Stage 5 should now test a compact Sydney harbour/CBD extract. The first task is data profiling, not visual polish: measure Overture height completeness, inspect the exact ELVIS coverage, pin licences/version dates, simplify to local metre coordinates, then benchmark the same small city model in plan and skyline projections.

## 2026-10-07 skyline fidelity and camera correction

The latest visual review exposed two separate problems that must not be conflated with an open-data resolution limit.

### Why the skyline looked unlike Sydney

The checked-in browser bundle is still `procedural-calibration`, not an acquired Overture extract. Before this correction it contained only five named high-rise anchors plus 26 generic rectangular blocks arranged in artificial rows. That arrangement was useful for projection and frame-budget testing, but it systematically underrepresented the harbour-front cluster, especially Barangaroo, and made several tall buildings appear too far inland.

The calibration fallback now adds published height/coordinate anchors for the missing harbour-front cluster: One Sydney Harbour Tower 2, International Towers Sydney Towers 1 to 3, Quay Quarter Tower and Governor Phillip Tower, while retaining One Barangaroo/Crown Sydney, One Sydney Harbour Tower 1, Salesforce Tower, Chifley Tower and Deutsche Bank Place. Published references put the Barangaroo South complex at 271.3 m for One Barangaroo, 247 m and 230 m for One Sydney Harbour Towers 1 and 2, and 217 m, 178 m and 169 m for International Towers 1 to 3. These additions improve silhouette calibration but **do not make the fallback a real city model**: its tower footprint widths, rotations and all generic background blocks remain rendering hypotheses.

The permanent fix is still the bounded Overture `building` plus `building_part` import. Overture's current schema explicitly supports building footprints, heights/floor counts and optional parts for more representative 3D massing. Real Sydney feature coverage must be measured after acquisition rather than inferred from the schema.

### Why the Opera House model was wrong

The previous renderer created six independent tapered roof patches. Three were explicitly generated with a `reverse` flag, so alternating shells tapered in opposite longitudinal directions. That implementation explains the user's screenshot: several sails pointed away from neighbouring sails and read as generic cones rather than interlocking vaults.

That geometry contradicted the architectural source material. Sydney Opera House describes the final roof forms as derived from a common spherical geometry, with one side of a shell profile mirrored to complete the arch. UNESCO describes the building as **three groups of interlocking vaulted shells** over the two main halls and restaurant.

The revised procedural landmark therefore follows these visual rules:

- three conceptual shell groups rather than six unrelated cones;
- eight nested ribbed shell surfaces built from one shared spherical-inspired profile rule;
- a common longitudinal rise with modest group-specific fanning, instead of alternating front/back reversal;
- a much shorter horizontal run relative to shell height so the roof reads as upright sails rather than shallow canopies;
- individual peak positions, heights, widths and lateral lean so the shells remain visibly different;
- a mirrored transverse arch within each shell, matching the source principle that one side of a shell profile can be mirrored to complete the arch;
- a tapered Bennelong Point podium instead of the previous plain rectangle;
- dark opaque shell faces with ribs as structure cues;
- no copied survey mesh, proprietary model, tile geometry or claim of architectural reconstruction accuracy.

The model remains a stylised landmark reference. A future higher-fidelity Opera House should use an explicitly redistributable surveyed/open geometry source if one is found. Until then, procedural geometry must continue to be labelled as an approximation.

Sources used for this correction:

- Sydney Opera House, *The spherical solution*: https://www.sydneyoperahouse.com/our-story/the-spherical-solution
- UNESCO World Heritage Centre, Sydney Opera House description: https://whc.unesco.org/en/list/166/
- Council on Vertical Urbanism / Skyscraper Center, Barangaroo South complex: https://www.skyscrapercenter.com/complex/375
- Crown Sydney, One Barangaroo residences: https://www.crownsydney.com.au/general/property/residences
- Overture Maps building schema: https://docs.overturemaps.org/schema/reference/buildings/building/
- Overture Maps building-part schema: https://docs.overturemaps.org/schema/reference/buildings/building_part/

### Camera interaction contract after visual review

Skyline navigation now treats the scene as a map that the user grabs rather than a model that rotates on every drag.

- left mouse drag / one-finger drag: pan the scene on the horizontal city plane;
- right mouse drag: smooth lens zoom, with no change to camera `z`;
- mouse wheel: smooth lens zoom;
- both mouse buttons + drag: orbit around the pivot;
- two-finger pinch: smooth lens zoom;
- two-finger twist: yaw rotation;
- `W/A/S/D` and arrow keys: matching screen-direction pan;
- `Q/E`: yaw rotation;
- `+/-`: zoom;
- `R` / `Home`: reset;
- keyboard navigation activates from anywhere on the page, including when a non-entry button has focus; native data-entry controls and content editors keep their own keys;
- skyline eye and pivot cannot move below the ground plane.

Zoom is a lens/projection zoom rather than a dolly. This was chosen because the user's requirement explicitly separates zooming the current viewport from raising/lowering the camera.

### Occlusion decision

Canvas 2D has no depth buffer. The city layer is still cached behind the firework for performance, but after particles are drawn, architecture nearer than the burst centre is redrawn. This makes solid building/landmark faces mask firework trails and reduces the previous x-ray appearance. It is intentionally documented as a painter-depth approximation, because individual particles can sit in front of or behind a building within one burst. If real Overture geometry plus arbitrary camera movement exposes unacceptable ordering errors, the case for WebGL/Three.js is then measured and functional rather than speculative.

## 2026-10-07 street network and coordinate-integrity pass

The street layer uses a city-agnostic browser contract rather than exposing NSW field names directly to the renderer. Sydney is the first acquisition adapter, but later Australian and international cities can populate the same `roads` and `transportPoints` arrays from different source systems.

### Sydney road source

The preferred Sydney centreline source is NSW Spatial Services `RoadSegment` (`NSW_Transport_Theme`, FeatureServer layer 5). The live layer supports GeoJSON queries and includes street-name components, `functionhierarchy`, `roadontype`, `surface` and `lanecount`.

A correction from an abandoned earlier draft is important: NSW `lanecount` is **categorical**, not an exact lane number. The service domain is:

- `0`: Unknown Lanes
- `1`: OneLane
- `2`: TwoOrMoreLanes

Therefore `2` must never be displayed or analysed as exactly two lanes. The browser contract stores `laneCategory` separately from `laneCountExact`.

### Exact lanes, signals and pedestrian/street crossings

OpenStreetMap is used as bounded enrichment, not as a second rendered duplicate network. Where an OSM way with the same normalised street name lies within 18 m of the NSW centreline, an explicit numeric `lanes=*` value can populate `laneCountExact`. If `lanes=*` is absent, `lanes:forward` plus `lanes:backward` may be used only when both are explicit positive integers. An explicit `width=*` can populate the display width directly.

OSM nodes tagged `highway=traffic_signals` become `traffic-signal` points. Nodes tagged `highway=crossing` become `crossing` points. Road-network junctions are also derived from three or more road endpoints sharing a 2 m snap cell. These point types share the same local-metre coordinates as buildings and fireworks. Street names are retained now so labels can be added later without changing the data model, but labels are not rendered in this pass.

TfNSW's dedicated `Traffic Lights Location` dataset is recorded as a later authoritative NSW validation/enrichment source. Its current public catalogue lists Creative Commons Attribution but the data download requires portal login, so the preparation pipeline does not automate around that access control.

### International transport contract

Overture Transportation remains the preferred global schema reference. Its road `segment` geometry is a centreline and `connector` points describe physical routing connections. Current segment fields support names, road class/subclass, surfaces, speed-limit rules, level rules and edge-to-edge `width_rules`. The reviewed current schema does not expose a direct lane-count field, so exact lane count remains an optional enrichment attribute rather than a required global field.

The browser road contract currently carries:

- `id`, `name`, and local-metre `points`;
- optional `roadClass` and numeric source hierarchy;
- `onType` (`ground`, `bridge`, `tunnel`, `unknown`);
- `laneCategory` plus optional `laneCountExact` and `laneSource`;
- `displayWidthM` plus `widthSource`;
- source class/provenance.

`displayWidthM` is a rendering width. It is source-backed only when an explicit width is available. Widths inferred from exact lanes, NSW lane category or road hierarchy are labelled rendering estimates.

### Road and building overlap policy

Coordinate integrity is treated as a data-quality rule, not a cosmetic renderer fix. Roads and buildings are projected from WGS84 to GDA2020 / MGA Zone 56 (`EPSG:7856`) and then shifted by the same fixed Harbour Bridge local origin.

Only `ground` road corridors participate in automatic overlap checks. Bridge and tunnel segments are excluded because a 2D intersection can be physically valid. Building parts beginning 4.5 m or more above ground are also excluded from the ground conflict test.

- Procedural calibration footprints may be clipped or withheld because they are explicitly invented geometry.
- Real Overture footprints are never silently moved or reshaped. A material ground-road overlap sets `roadConflict: true`; the browser does not render that building until the mismatch is reviewed.
- The generated profile records total road conflicts, calibration footprints adjusted for clearance, and real/source buildings withheld.

This makes source disagreement visible instead of hiding it and prevents the current calibration massing from sitting across sourced streets.

### Acquisition limitation for this patch

The patch-generation container cannot resolve the NSW GIS or Overpass hosts. The checked-in browser fixture therefore contains the new transport schema with zero sourced streets. `scripts/data/fireworks-simulator/acquire_sydney_transport.py` performs the bounded network acquisition locally and merges it into the existing city bundle without requiring a new Overture building download.
