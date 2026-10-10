## 2026-10-09 Sydney key-building curation and source matching

Landmark selection is curated by historical/cultural/sporting value and tall/iconic skyline relevance rather than a fixed number of the highest buildings. A place is only selectable when named Overture building footprints or already-authored structures exist. The current processed east-coast JSON provides 65 qualifying landmarks in five categories. Height-atlas membership is more restrictive: 27 landmarks with an explicit Overture height value or an authored structure value. The generic 18 m and floors × 3.2 m approximations must not be presented as accurately ranked roof heights.

The 2026-09-23.1 export contains an **unnamed** 271 m building at source ID `eb9f7209-547b-3888-973f-1866de7ca6e3`, close to the source-named Barangaroo `Tower 1` (247 m). This is matched provisionally to Crown Sydney / One Barangaroo using source geometry/height and the independent [Skyscraper Center One Barangaroo listing](https://www.skyscrapercenter.com/building/id/13283). Its 271 m height is already in the source bundle; the script does not manufacture a height. This is a release-bound alias subject to later building-identity QA, not a general arbitrary-nearest-building rule. Named 247 m and 230 m Barangaroo towers are similarly displayed as One Sydney Harbour Towers 1 and 2 only if height and location gates pass.

The dataset has no single named SCG stadium geometry. The SCG camera target uses a bounded cluster of seven named source stands (Members', Brewongle, Bill O'Reilly, Clive Churchill, Victor Trumper, Ladies' and Messenger) and highlights those original footprints; it does not manufacture a giant stadium building. It is excluded from numeric height comparison because stand heights use fallback values. For other cities, choose registry entries from that city's actual source/provenance, with no city-independent count ceiling.

## 2026-10-09 Coastal source correction (full local validation pending)

The wider Sydney acquisition frame is `[151.18, -33.903, 151.315, -33.829]`
(WGS84). The user's extent/release-labelled cache contains 45,055 Overture
building records, 1,103 building parts, 13,888 NSW road segments, 18,616
Overture land records and 3,305 Overture water records. All Overture layers
are from release `2026-09-23.1`; water retrieval completed 2026-10-09 UTC.
Source schema: <https://docs.overturemaps.org/schema/reference/base/land/>
and <https://docs.overturemaps.org/schema/reference/base/water/>.

The coastal `subtype=land/class=land` source polygon provides the Pacific
shoreline, but has no interior Sydney Harbour holes. The browser export must
subtract matching Overture `water` polygon geometry for harbour, bays and
inland water from the coast-derived land *before* triangulation. The selection
excludes swimming pools, drains and non-polygon water labels. Source projection
remains WGS84 to EPSG:7856 with Sydney's declared local-metre origin. Water
is empty background in the browser; only derived land triangles are shipped.
The layer source licence is ODbL and requires appropriate Overture and OSM
attribution. NSW road terms are tracked separately in this source note.

The 3,305-feature expanded water cache exists on the user's Windows computer
but is **not present in the supplied snapshot**. Tests here used the old
inner-city water dataset only and cannot certify eastern water coverage.
The browser still uses `inner-sydney` pending an accepted local rebuild and
visual/FPS/attribution review. Do not claim the wider city is published.

## 2026-10-09 Pacific coast extension (acquisition pending)

A new explicit `east-coast` extraction uses the same north/south/west source
limits as inner-Sydney and a broader east longitude of `151.315`. Overture
`building`, `building_part`, `land` (coastline-derived class/subtype `land`),
NSW Spatial Services RoadSegment and OSM transport are acquired together.
Official land schema: <https://docs.overturemaps.org/schema/reference/base/land/>.
Only the real sourced shoreline can set the final eastern scene boundary;
the scene frame is 300 m beyond its eastmost land point, with ocean unpainted.

**Provenance:** The supplied October 9 GIS files remain the earlier inner-Sydney
extract. They cannot prove coverage of the expanded area. No new coastal data
has been downloaded or verified in the ChatGPT environment because the source
hosts are unreachable. The local acquisition must record the actual Overture
release, retrieval date, source counts, spatial bounds and attribution before
publication. Inspect the derived JSON and browser performance separately.

# Fireworks Simulator: Sydney City Source Notes

Research date: 2026-10-06

Purpose: provenance and publication constraints for the proposed Sydney city layer in the Fireworks Simulator.

## 2026-10-09 expanded geometry failure and local reprocessing

The first larger extract downloaded 26,606 Overture building rows, 949 parts,
10,304 NSW road features and 36,968 OSM elements, then stopped on a GEOS
`TopologyException` during preprocessing; no wider browser data was accepted.
The prior global road-buffer union has been replaced by local spatial-index
queries, and local overlay failures are withheld/audited without modifying
source building footprints. Raw source files from the interrupted run stay
under ignored `data/raw/` and can be reprocessed with
`--extent inner-sydney --reuse-local` without new network access.
This earlier acquisition has no saved release manifest: its exact Overture
release must be verified separately before publishing a regenerated dataset.
New acquisitions retain the release/bounds/date alongside the raw sources.

## 2026-10-08 bounded inner-Sydney expansion option

The current checked-in browser data remains the Overture `2026-09-23.1` Sydney CBD extract (4690 buildings after Sydney Tower overlap removal). No additional real GIS features are bundled with this patch. `acquire_sydney.py --extent inner-sydney` now requests an **explicitly larger** rectangle: `151.180,-33.903,151.238,-33.829` in WGS84. Its four extra bands cover North Sydney, parts of Pyrmont/Glebe, Redfern/Waterloo and Potts Point/Darlinghurst. The previous CBD rectangle is available with `--extent cbd` and remains the default.

Every raw feature layer uses the same bounds before being clipped to local MGA Zone 56 metres. After downloading, the script verifies Overture building coverage extends past each old CBD edge, records the selected extent and source retrieval date, and retains a local ignored backup of the previous CBD JSON. Source licence obligations remain ODbL for Overture and OSM, plus the declared NSW transport source terms. No source access occurred in the patch-generation environment, so expanded feature counts, byte size and FPS must be recorded on the user's connected machine before publication. Water remains a procedural CBD-focused harbour approximation; larger-bay geometry is a separate source task.

Stage 4 selected the source stack. Stage 5 now includes a browser calibration fixture and deterministic preparation script, but no real Overture or NSW GIS extract has been checked into the project. The calibration file is renderer test data and must not be represented as source-derived Sydney building geometry.

## Approved baseline candidate: Overture Maps Buildings

Publisher: Overture Maps Foundation

Documentation:

- https://docs.overturemaps.org/guides/buildings/
- https://docs.overturemaps.org/schema/reference/buildings/building/
- https://docs.overturemaps.org/schema/reference/buildings/building_part/
- https://docs.overturemaps.org/attribution/

Stage 4 observations:

- global building coverage;
- intended use includes 2D and 3D visualisation;
- `building` geometry is a footprint or roofprint polygon/multipolygon;
- optional fields include `height`, `num_floors`, `min_height`, roof attributes and `has_parts`;
- `building_part` can provide more detailed 3D massing and its own vertical attributes;
- building heights are in metres when present;
- the theme combines OpenStreetMap and other compatible open sources;
- buildings theme licence: ODbL;
- Overture documentation shows monthly releases and currently references release `2026-09-23.1` at research time.

Stage 5 use:

- extract only the selected Sydney test bounds;
- include both `building` and `building_part` for the profiling pass;
- pin the exact release ID used in generated metadata;
- quantify missing heights, floor counts and building parts before deciding the vertical fallback strategy;
- do not assume the release shown in this note remains current when Stage 5 runs.

Attribution baseline shown by Overture for OSM-derived data:

`© OpenStreetMap contributors, Overture Maps Foundation`

## Underlying OSM licence obligations

Publisher: OpenStreetMap contributors / OpenStreetMap Foundation

References:

- https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline
- https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ

Stage 4 interpretation for project governance:

- OpenStreetMap is ODbL data;
- public interactive maps require visible attribution in or near the map/visual;
- an adapted, modified or enhanced OSM-derived database may be a Derivative Database;
- a rendered visual can be a Produced Work, but the applicable underlying database obligations still need to be followed.

Project decision:

If Stage 5 combines Overture building geometry with derived height data into a browser city database, treat the resulting building database conservatively as ODbL/share-alike, publish/source it accordingly and retain a reproducible transformation description. Recheck the licence before public release.

## Approved conditional enrichment candidate: NSW Elevation and Depth / ELVIS

Publisher: NSW Spatial Services / Geoscience Australia ELVIS delivery

References:

- https://www.spatial.nsw.gov.au/what_we_do/the_natural_environment/elevation_and_depth
- https://portal.spatial.nsw.gov.au/client/services?id=f1b1b26b23ab4574a561f890edd3bd7e
- https://data.nsw.gov.au/data/en/dataset/nsw-foundation-spatial-data-framework-elevation-and-depth-point-cloud
- https://elevation.fsdf.org.au/

Stage 4 observations:

- NSW point clouds are captured from LiDAR or derived from airborne imagery;
- point cloud and DEM data are available through ELVIS;
- LiDAR-derived DEM products can be 1 m or 2 m resolution;
- Data.NSW lists the NSW Point Cloud dataset under Creative Commons Attribution;
- point-cloud coverage/capture timing varies by project area.

Stage 5 use:

1. locate exact tiles intersecting the selected Sydney test extent;
2. record dataset/title, capture date, tile identifiers, licence and technical metadata;
3. inspect the available classification/point attributes before writing an extraction rule;
4. derive only ground/roof/height information needed by the visual;
5. keep raw LAS/LAZ tiles local and out of Git/public assets;
6. measure the improvement over Overture before retaining LiDAR in the permanent pipeline.

Do not claim current Sydney LiDAR coverage or classification details until the exact Stage 5 tiles have been inspected.

## Preferred Sydney water candidate: NSW Foundation Spatial Data Water Theme

Publisher: NSW Spatial Services

References:

- https://www.spatial.nsw.gov.au/products_and_services/spatial_data
- https://www.spatial.nsw.gov.au/products_and_services/web_services
- NSW Foundation Spatial Data Framework Water Theme documentation: https://www.spatial.nsw.gov.au/__data/assets/pdf_file/0004/232726/37824_NSW_Foundation_Spatial_Data_Framework_July24.pdf

Stage 4 observations:

- NSW Water is part of the Foundation Spatial Data Framework;
- Spatial Services makes many FSDF products available through open data services;
- the water theme includes hydrographic polygon features such as NSW Hydro Area;
- harbour rendering needs water-area geometry, not only a state coastline polyline.

Stage 5 use:

- identify the exact Hydro Area / water resource used for the Sydney extract;
- capture the exact resource licence and version/update date in generated metadata;
- clip to the Stage 5 scene bounds;
- simplify the polygon geometry while preserving the recognisable harbour shape;
- keep water as a separate source layer in provenance even if coordinates are exported in the same city bundle.

## Coordinate reference: GDA2020 / MGA Zone 56

Reference: EPSG:7856

Source:

- https://epsg.io/7856

Stage 4 observations:

- unit: metre;
- axes: easting, northing;
- appropriate area includes longitudes 150 E to 156 E;
- scope includes engineering survey and topographic mapping.

Project use:

Use EPSG:7856 during Sydney preprocessing, then subtract a city origin and export small local metre coordinates to the browser. Browser axis convention is `x east`, `y north`, `z up`.

## Official landmark scale references

### Sydney Opera House

Publisher: NSW Public Works

Reference:

- https://www.publicworks.nsw.gov.au/projects/south-coast/sydney-opera-house-deformation-survey

Stage 4 facts used:

- maximum height approximately 65 m;
- site/building coverage approximately 1.8 ha;
- current survey work references MGA2020 transformation.

Use only as a scale reference for original simplified/procedural geometry. Do not infer detailed shell geometry from these figures.

### Sydney Harbour Bridge

Publishers: NSW Government / Transport for NSW

References:

- https://www.nsw.gov.au/visiting-and-exploring-nsw/locations-and-attractions/sydney-harbour-bridge
- https://www.transport.nsw.gov.au/system/files/media/documents/2023/harbour-bridge-history.pdf

Stage 4 facts used:

- highest point approximately 134 m above harbour/sea level;
- arch span approximately 503 m;
- pylons approximately 89 m high.

Use as scale references for a procedural wireframe bridge, not an exact engineering model.

### Sydney Tower

Stage 4 decision:

No geometry/dimension value is locked in this research package. Stage 5 must select a current official source before procedural tower dimensions are committed.

## Blocked source: City of Sydney Floor Space and Employment Survey

Publisher: City of Sydney

References:

- https://www.cityofsydney.nsw.gov.au/research-reports/floor-space-employment-survey-2022
- https://data.gov.au/data/dataset/nsw-5-cityofsydney-employment-in-the-city

Useful qualities:

- 2022 survey reports 26,321 buildings in the local area;
- GIS capture supports 2D and 3D spatial analysis.

Publication issue:

The current Data.gov.au catalogue record for `Employment in the City` lists the dataset licence as `Not Specified`. Under this project's data-governance rules, unclear reuse terms block publication.

Decision:

Do not use FES geometry/data in Stage 5 unless the City of Sydney provides a clear licence that permits the intended public reuse.

## Rejected source: City of Sydney SDCP building height controls

Publisher: City of Sydney

Reference discovery:

- https://data.gov.au/data/organization/city-of-sydney-datansw

Reason for rejection:

- the dataset describes planning controls such as building height in storeys rather than measured current building height;
- public catalogue reuse metadata is not a stronger fit than the open alternatives already available.

It may later be useful in a planning-specific project, but it is not the physical skyline height source for this simulator.

## Rejected source: NSW Spatial Digital Twin Geoscape buildings

Publisher/distributor: NSW Spatial Services, Geoscape source product

Reference:

- https://www.spatial.nsw.gov.au/news/dcs_spatial_services_secures_new_geoscape_datasets_for_whole-of-government_access

Useful qualities:

- building roof outlines;
- building height;
- roof material/colour;
- area and volume attributes.

Reason for rejection:

NSW Spatial Services describes the datasets as procured for distribution exclusively to NSW Government agencies, with state/local government access and restricted terms of use.

Decision:

Do not extract, reproduce or scrape this building product for the public portfolio. The public Spatial Digital Twin can be used only as a visual reference/check unless separate reuse rights are established.

## Rejected source class: third-party downloadable 3D landmark meshes

Examples include community model repositories and CAD/model-sharing sites.

Reason for rejection:

- licences and redistribution rights vary by individual asset;
- provenance can be unclear;
- geometry complexity is unnecessary for the intended wireframe style;
- downloaded architectural meshes would make the future multi-city pipeline inconsistent.

Use open footprints plus original procedural landmark geometry instead.

## Stage 5 acquisition and calibration checkpoint

Checked on 2026-10-07:

- Overture's current release page lists `2026-09-23.1`;
- the September patch corrected GERS IDs for base and `building_part` features;
- Overture's official Python client supports bounding-box downloads to GeoJSON/GeoJSONSeq/GeoParquet and uses STAC to target the latest release;
- the current building schema exposes footprint geometry plus optional `height`, `num_floors`, `has_parts` and related vertical fields;
- `building_part` can carry its own footprint, height, floor count and minimum height/floor;
- Buildings theme licence remains ODbL.

Official references:

- https://docs.overturemaps.org/release-calendar/
- https://docs.overturemaps.org/blog/2026/09/23/release-notes/
- https://docs.overturemaps.org/getting-data/overturemaps-py/
- https://docs.overturemaps.org/guides/buildings/
- https://docs.overturemaps.org/schema/reference/buildings/building/
- https://docs.overturemaps.org/schema/reference/buildings/building_part/
- https://docs.overturemaps.org/attribution/

The Stage 5 extraction box is `151.195,-33.882,151.222,-33.848` in WGS84. The local preparation script requires the exact Overture release identifier and retrieval date when processing a real extract.

External GIS distribution endpoints were not reachable from the execution environment used to create Stage 5. For that reason the checked-in `sydney-city.json` is generated in calibration mode. No Overture feature count, height completeness, building-part coverage or NSW water/LiDAR claim is recorded yet.

### Calibration-only tall-building anchors

The current fixture contains rough rectangular footprints for skyline scale testing. Footprint geometry is invented and tagged `procedural-calibration`. Heights are secondary calibration references, not the permanent city dataset.

- One Barangaroo / Crown Sydney: 271.3 m in the Council on Vertical Urbanism / Skyscraper Center database.
- Salesforce Tower Sydney: Salesforce states 263 m; the Skyscraper Center lists 263.1 m.
- One Sydney Harbour Tower 1: 247 m in the Skyscraper Center and project engineering references.
- Chifley Tower: 244 m in the Skyscraper Center.
- Deutsche Bank Place: 240 m in the Skyscraper Center.

References:

- https://www.skyscrapercenter.com/building/crown-sydney-hotel-and-resort/13283
- https://www.salesforce.com/au/blog/salesforce-tower-sydney/
- https://www.skyscrapercenter.com/building/r4a-tower/13284
- https://www.skyscrapercenter.com/building/wd/938
- https://www.skyscrapercenter.com/building/building/1016

The final Overture-derived footprint/height records should replace these procedural blocks wherever coverage is suitable.

### Sydney Tower Stage 5 calibration

The Sydney Tower Eye's official site states 309 m from the bottom to the tip of the spire. Stage 5 uses that height for an original simplified tower wireframe. Its current local position is a calibration point only and should be reconciled against the final city dataset.

Reference:

- https://www.sydneytowereye.com.au/explore/explore/about-sydney-tower/

## Stage 5 derived-data policy

Raw source data:

```text
data/raw/fireworks-simulator/sydney/
```

Local only and ignored. Do not include raw Overture extracts, LiDAR tiles or large GIS downloads in change packages unless a later plan explicitly approves a small reusable source extract and its licence.

The Stage 5 browser contract is `public/data/fireworks-simulator/sydney-city.json`. Raw source downloads stay local; the preparation script transforms a bounded source extract directly into the compact static browser bundle. Intermediate review files may remain under project-specific local processed paths when needed.

Every generated city bundle must record:

- city ID;
- generation timestamp;
- scene bounds;
- source CRS and local origin;
- each source dataset and exact version/release;
- retrieval date;
- source licence;
- transformation steps;
- height source counts;
- geometry simplification settings;
- feature and vertex counts;
- output byte size.

No runtime API is required. The city layer should remain static, reproducible and versioned.

## 2026-10-07 skyline visual-revision provenance

This revision changes only the **renderer**, not the Sydney city dataset. The 31 procedural buildings remain invented calibration footprints/heights as marked in the JSON. Overture `building` / `building_part` source records have **not** been downloaded or included. A dark opaque face and a larger polygon/line mesh do not make a building shape more geographically accurate.

The original Harbour Bridge rendering now uses 28 arch panels, supported as a historical design fact in Transport for NSW's *Sydney Harbour Bridge Conservation Management Plan* (published report, see below). The synthetic arch profile, member joins, deck/pylon cuboids and bracing are approximate artistry constrained by documented overall dimensions, not survey or construction details. The Bridge remains an open steel truss, rather than a solid opaque arch.

- Transport for NSW, *Sydney Harbour Bridge Conservation Management Plan*: https://www.transport.nsw.gov.au/system/files/media/documents/2023/sydney-harbour-bridge-conservation-management-plan_0.pdf
- Sydney Opera House, *The spherical solution*: https://www.sydneyoperahouse.com/our-story/the-spherical-solution

Six original Opera House roof patches mimic curved, subdivided shells; no 3D model, artwork, proprietary geometry or tile layout was imported from Sydney Opera House. The opacity/style settings and refined Bridge/Opera House meshes are labelled `visual approximation`.

## 2026-10-07 real-building import and free-camera review patch

**Acquisition status:** No source download was possible in the patch environment (external GIS hosts were unreachable). The distributed `sydney-city.json` remains `procedural-calibration` and contains **zero acquired Overture building features**. This is an intentionally visible blocker; no claim of completed Sydney real-data acquisition is made. The downloadable patch includes the tested data-processing and camera code, not invented Overture geometry.

The supported workflow is `py scripts/data/fireworks-simulator/acquire_sydney.py` on an internet-connected system after installing `overturemaps`, `pyproj`, `shapely`. It uses Overture's official Python API for the two bounded feature types, captures STAC's current release before/after retrieval, stores the two raw GeoJSON source files only under ignored `data/raw/fireworks-simulator/sydney/`, and atomically replaces the static browser bundle **only after** source, shape and minimum-count checks pass. Geometry is clipped to `151.195,-33.882,151.222,-33.848`, projected to EPSG:7856, shifted to the bridge-centred local metre origin, and simplified to 1.0 m for the default command. This exact output may be openly redistributed **subject to ODbL attribution and applicable share-alike/database obligations**; the public source/provenance fields are in JSON, and the transformation script is committed. Check conditions before actual publication.

`building_part` records belong to parents through `building_id`. They can contain `min_height` and `height` plus a distinct footprint. The converter includes those parts instead of duplicating a full parent extrusion where valid matches exist, and retains the full parent when no part matches. Holes, detailed shaped roofs, absolute terrain elevation and any water/shoreline accuracy remain out of scope. Some Overture attributes are missing: fallback heights are flagged as `overture-floors-x-3.2m` or `renderer-fallback-18m`. The renderer does not claim those as measured heights.

No measured real-data feature count, source-height percentages, output gzip bytes or moving-camera FPS can be asserted yet. After running the acquisition command locally, review and record those measurements before claiming Stage 5 real building integration complete. The single project-scoped browser dataset is intentionally not sourced via a runtime API.

Source references: <https://docs.overturemaps.org/getting-data/overturemaps-py/>; <https://docs.overturemaps.org/guides/buildings/>; <https://docs.overturemaps.org/schema/reference/buildings/building_part/>; <https://docs.overturemaps.org/attribution/>.

## 2026-10-07 skyline calibration correction after visual comparison

The user's visual comparison showed that the checked-in calibration fallback did not reproduce Sydney's harbour-front high-rise distribution. This was traced to the fixture itself, not to an inherent Overture resolution limit: it had five named tower anchors and 26 generic blocks, while the real Barangaroo waterfront contains several major towers close together.

The calibration generator now includes these additional **secondary skyline anchors**. Coordinates/heights are used only to place rough rectangular massing. Rectangle dimensions and rotations remain invented and `geometrySource` remains `procedural-calibration`.

- One Barangaroo / Crown Sydney: 271.3 m calibration height. https://www.skyscrapercenter.com/building/crown-sydney-hotel-and-resort/13283
- One Sydney Harbour Tower 1: 247 m. https://www.skyscrapercenter.com/building/b/13284
- One Sydney Harbour Tower 2: 230 m. https://www.skyscrapercenter.com/building/b/13285
- International Towers Sydney Tower 1: 217 m. https://www.skyscrapercenter.com/building/international-towers-tower-1/13280
- International Towers Sydney Tower 2: 178 m, coordinate calibration near `151.20216,-33.86441` from an OSM-derived location reference.
- International Towers Sydney Tower 3: 169 m, coordinate calibration near `151.20224,-33.86511` from an OSM-derived location reference. Height: https://www.skyscrapercenter.com/building/international-towers-sydney-tower-3/13281
- Quay Quarter Tower: harbour-edge calibration near `151.21152,-33.86282`; footprint remains invented.
- Governor Phillip Tower: 227 m harbour-edge calibration; footprint remains invented.

The Council on Vertical Urbanism Barangaroo South complex page is the main cluster-height cross-check and lists One Barangaroo, both One Sydney Harbour towers and all three International Towers in one complex: https://www.skyscrapercenter.com/complex/375

### Opera House procedural-model correction

The prior six roof patches were generated as tapered surfaces and alternated a renderer-only `reverse` flag. That code, rather than the source data, caused adjacent sails to point in opposing directions. It is retired.

The correction is based on two source statements:

- Sydney Opera House documents the final shell geometry as sections derived from a common sphere, with one side of each profile mirrored to complete the arch: https://www.sydneyoperahouse.com/our-story/the-spherical-solution
- UNESCO describes three groups of interlocking vaulted shells over two performance halls and a restaurant: https://whc.unesco.org/en/list/166/

The renderer now creates three conceptual groups containing eight nested curved shell surfaces. They share a northward rise with modest group-specific fanning, use a mirrored transverse arch, shorten horizontal run relative to height so the shells read as upright sails, and sit on an original tapered podium. This remains `visual approximation`, not source geometry.

### Overture status remains unchanged

No real Overture file was acquired in this execution environment. The improved fallback should not be confused with the real-data import. Overture's schema confirms that `building` footprints can carry `height`, `num_floors` and `has_parts`, while `building_part` features can carry distinct footprints, heights and `min_height` values for richer 3D massing:

- https://docs.overturemaps.org/schema/reference/buildings/building/
- https://docs.overturemaps.org/schema/reference/buildings/building_part/

The real-data gate therefore remains open even though the calibration skyline is now less misleading.

## 2026-10-07 transport-network sources

### NSW Spatial Services RoadSegment

Purpose: Australia-first Sydney street centrelines and street-name attributes.

Authoritative service reviewed:

- https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/FeatureServer/5
- TfNSW catalogue entry: https://opendata.transport.nsw.gov.au/data/dataset/road-segment-data-from-datansw

The service supports GeoJSON queries. Fields used by the adapter are `roadnamebase`, `roadnametype`, `roadnamesuffix`, `functionhierarchy`, `roadontype`, `surface`, `lanecount` and the source identifiers.

Critical semantic note: `lanecount` is coded as `0 = Unknown Lanes`, `1 = OneLane`, `2 = TwoOrMoreLanes`. It is not a literal numeric lane count. An earlier abandoned implementation draft treated code `2` as exactly two lanes; that interpretation was incorrect and is not used in the current pipeline.

TfNSW's catalogue lists the Road Segment dataset under Creative Commons Attribution. Capture the retrieval date when generating a publishable street bundle and recheck the current catalogue/service terms before release.

### OpenStreetMap transport enrichment

Purpose: globally available optional enrichment for attributes the NSW coded road layer does not represent exactly, plus explicit traffic-control/crossing points.

References:

- lane count: https://wiki.openstreetmap.org/wiki/Key:lanes
- traffic signals: https://wiki.openstreetmap.org/wiki/Tag:highway=traffic_signals
- crossings: https://wiki.openstreetmap.org/wiki/Tag:highway=crossing
- licence/attribution: https://www.openstreetmap.org/copyright

The Sydney adapter queries only the fixed prototype bounds. Exact numeric lanes are retained only from explicit numeric OSM tags. OSM `highway=traffic_signals` and `highway=crossing` nodes are retained as point features. OSM is ODbL and requires OpenStreetMap contributor attribution.

### Overture Transportation

Purpose: common road-network schema reference for future cities.

References:

- https://docs.overturemaps.org/guides/transportation/segments-and-connectors/
- https://docs.overturemaps.org/schema/reference/transportation/segment/
- https://docs.overturemaps.org/schema/reference/transportation/connector/
- https://docs.overturemaps.org/schema/reference/transportation/types/segment/width_rules/

Current reviewed schema version is v2.0.0. Segments are centreline LineStrings; connectors describe physical network connection points. Road segments can carry names, road class/subclass, surface, speed-limit, level and edge-to-edge width rules. Direct lane count is not part of the reviewed current segment fields, so the project does not invent it from Overture.

### TfNSW Traffic Lights Location

Reference: https://opendata.transport.nsw.gov.au/dataset/traffic-lights-location

The dataset contains NSW traffic-light locations and is listed under Creative Commons Attribution. The current download requires portal login. It is a future NSW-authoritative validation/enrichment source; the project does not automate around the login requirement.

### Derived browser policy

All street geometry is transformed through the same `EPSG:7856` to local-metre coordinate contract as buildings. Raw road/OSM downloads stay under ignored `data/raw/fireworks-simulator/sydney/` paths. The browser bundle records source/retrieval metadata and does not treat inferred display width as surveyed carriageway width.

## 2026-10-08 Sydney Tower overlap audit (current checked-in Overture bundle)

The currently supplied 4692-building Overture Sydney browser export included two tower parts centred about 8 m from the separate 309 m authored Sydney Tower: `176723e1-0a5a-37b0-8a56-9903cbc7fe60` (roof at 290 m), and `3e5f6979-40c8-3584-ab4e-e526f72b5ef5` (base 240 m plus rise 270 m produces a physically implausible 510 m roof). The separate 38.4 m `Westfield Sydney` Overture part lies at the same location and is **retained**. The prepared local-metre export suppresses those two tall part records only; it retains source identities in `profile.landmarkDuplicateRemovedIds`, and reports 4690 building records after correction. No new raw Overture acquisition was performed for this correction.

The removal is reproducible via the scoped observation-tower proximity/height audit in `prepare_sydney_city.py`, using `--repair-existing` for an already acquired browser bundle. It does not modify the universal Overture `min_height` + `height` convention. The source-backed 309 m Sydney Tower coordinate remains the procedural landmark anchor from Sydney Tower Eye/reference calibration, not an independently surveyed mesh. This is one identified exception; the remainder of Sydney is still a prototype with incomplete height coverage and approximate roofs/landmarks. Canvas/WebGL depth disagreement at Centrepoint is resolved by drawing its procedural geometry in WebGL when that renderer is active.

## 2026-10-09 source correction: Overture ocean polygons

The first bounded Overpass request returned a valid response with an empty
`elements` array. It supplied **no** shoreline linework and cannot be reused.
The subsequent land-mesh script uses **Overture Maps base/water**, querying a
bounded region and selecting `subtype=ocean` polygon/multipolygon features.
Overture describes these ocean features as derived from quality-checked OSM
coastlines and tiled for manageable complexity:

- https://docs.overturemaps.org/schema/reference/base/water/
- https://docs.overturemaps.org/getting-data/overturemaps-py/

The scene's land polygons are the complement of the ocean surface inside the
existing local-metre city bounds. Only land triangles are exported. This is
not a new surveyed terrain dataset; water and land are flat at the current
scene's zero-elevation baseline. The underlying OSM data remains ODbL; record
Overture release, retrieval date and attribution. The expanded building
source's previously unverified release is **not** retroactively verified.

Quality checks reject absent ocean features, implausible land coverage, wrong
CBD/harbour/North Sydney classification, and invalid polygons, preserving the
old browser city on failure. No successful live acquisition has yet been
confirmed in the patch-building environment.

## 2026-10-09 Sydney land mesh source: OpenStreetMap coastline

- **Publisher:** OpenStreetMap contributors
- **Source / access:** https://wiki.openstreetmap.org/wiki/Tag:natural%3Dcoastline and https://overpass-api.de/api/interpreter
- **Licence:** ODbL 1.0; attribution at https://www.openstreetmap.org/copyright
- **Retrieval:** manual local extraction, date added by the acquisition script, unverified until actually run
- **Coverage:** current `sydney-city.json` scene bounding box, downloaded with a margin to cover coastline ways extending past the scene
- **Process:** `py scripts/data/fireworks-simulator/acquire_sydney_coastline.py` or `--reuse-local`
- **Transformation:** EPSG:4326 to EPSG:7856, local XY subtract Sydney Harbour Bridge origin; clip directed coastlines to city bounds; polygonise with export border; classify land by OSM's land-left/water-right direction; validate boundaries and sample land/water anchors; triangulate land offline, including islands and holes. Water is **absence of land**, not overlay polygons.
- **Browser fields:** `land.sourceClass`, `land.triangles` (three local XY points per triangle), `land.coastlineWayCount`, `land.landAreaFraction`; `water.polygons` empty after acquisition.
- **Release status:** new real coastline acquisition pending local execution and visual review; the ZIP deliberately does not bundle invented geography or replace the user's 26,156-building city file. Exact Overture release for earlier expanded buildings is independently unverified.
- **Constraints:** OSM coastline marks tidal shoreline, not inland lakes/rivers. The coast dataset requires topology continuity. Missing ways, open segments and reversed orientation cause a failed export instead of an inaccurate water mask. Coastline source licence and attribution apply to the derived browser geometry.

The five hand-authored water basins in the previous review patch were a temporary
calibration experiment and are no longer rendered. NSW's coastline service
(https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Water_Theme_multiCRS/FeatureServer/4)
excludes some estuarine shoreline detail, so OSM coastline was selected for
this inner-harbour pass.
