# Pulse of Adelaide: historical fuel data

Status: **local-only prototype; no historical data approved for public release.** The project no longer uses the South Australian Government Direct API. That separate, paused integration has its own notes at `data/sources/sa-fuel-pricing.md`.

| Item | Current evidence |
| --- | --- |
| Historical supplier / reuse terms | Not supplied. Do not assume the SA Government publisher agreement covers this source. |
| Original format | User's Parquet dataset, exported with R into station metadata, a manifest and monthly/fuel JSON partitions. |
| Original data columns | `station_id` text, `fuel_code` text, `price_cpl` decimal, `observed_at_utc` ISO UTC text, `source` text (code `G` not yet decoded). |
| Claimed span | 2022-12-13 to 2026-09-16; validate times before use. |
| Intended geography | Adelaide metropolitan area from verified South Australia station metadata, `region = Adelaide` plus valid local coordinates. |
| Transformation | `scripts/data/pulse-of-adelaide/build_history_preview.py` reads one monthly partition, uses the last station observation per Adelaide calendar date, and does not fill missing days. |
| Browser output | `history-preview.json` only when explicitly requested for a local preview, ignored by Git but still copied by Astro builds. |

## Uploaded export validation failure (2026-09-16)

The supplied `stations.json` contains 2,367 NSW stations and **40 SA stations**, despite an SA-only dataset description and a 2,407-station total. The supplied 2026-09 LPG partition has 2,737 records and **no observations for those 40 SA IDs**. The manifest says `generatedAt = 2026-09-16T10:02:47Z` but `lastObservation = 2026-09-16T18:54:00Z` (later than generation). These are input-data errors, not a reason to reassign NSW coordinates or fabricate Adelaide values.

Re-export from a stable, verified `netwatch_data` object filtered on `Region.3 == "SOUTH AUSTRALIA"` before joining price history. Confirm the original timestamp timezone and avoid labelling local clock time with `Z`. Supply a corrected SA-only manifest and stations export and at least one matching partition before trying the importer. Retain original source identifiers and record source rights before any publication.

## Corrected private archive and full local browser (2026-09-16)

The user regenerated and privately copied a corrected SA-only archive: 40 price-reporting SA stations (9 Adelaide-region stations), 77,589 historical rows, 246 source UTC-month/fuel partitions; observations in the source station lookup lack matches for a further 454 SA sites. The first June 2026 ULP preview contained two reporting Adelaide stations. The browser now prepares all available monthly/fuel partitions, regrouped by Australia/Adelaide calendar date, and optionally displays all SA sites. The full private archive is retained locally; browser partitions keep daily last-observed prices rather than all intraday rows. Provider identity, source-code meaning and public redistribution permission are still unknown. No government API inputs or terms apply to this historical-only project.

## 2026-09-17 corrected station lookup and event contract

The previous 40-SA/nine-Adelaide export came from a defective lookup containing only Closed SA sites and unrelated NSW sites. The user's corrected `netwatch_data` has 1,219 SA sites, including 725 Active and 494 Closed. Exact joins yield 757 historical SA sites and 311 Adelaide-region sites. Adelaide ULP covers 306 sites and 561,757 original observations; 295 report in the February 2024 model. The old private monthly archive must not be used as evidence of citywide coverage.

The supplied original SQL formats `TRANSACTIONDATE` as ISO text and appends `Z` without timezone conversion. Treat archive timestamps as unverified labels until the SQL source timezone is established. The local event exporter uses the current timestamp labels unchanged, never fabricates price changes and limits cross-month prior-state retrieval to a 48-hour lookback. User confirms `G` records are authoritative reported prices; large movements and fast reversals are not discarded. No historical source licence or public release approval has been supplied.

## Coastline reference for the visual prototype (2026-09-17)

- The former manually drawn coastline was inaccurate and has been removed. The current map overlay uses **GSHHG intermediate-resolution, level-1 land/ocean shoreline geometry**, from the `mpl_toolkits.basemap_data` 2.0.0 installed dataset. Source documentation: [NOAA NCEI GSHHG](https://www.ngdc.noaa.gov/mgg/shorelines/shorelines.html). NOAA states GSHHG is released under the GNU Lesser General Public License (LGPL).
- The local preparation clipped segments to `[138.08, -35.65, 139.0, -34.45]` in WGS84, simplified each line with a 0.0005-degree tolerance and rounded coordinates to six decimal places. The resulting 3 shoreline lines and 59 vertices are recorded as local GeoJSON in `src/visualisations/pulse-of-adelaide/adelaide-coastline.json`, with source URL and licence note. This is geographic context, not a survey-grade cadastral boundary or station coverage area.
- Geometry uses the same MapLibre projection and rendered dimensions as the station sprites and is recalculated on map movement and resize. Only the coastline appears, fading to transparency at the visual's edges. Any data attribution and LGPL source obligations need to remain visible or accessible at public release; historical fuel observation reuse rights are separate and remain unresolved.

## 2026-09-17 detailed coastline only

The earlier intermediate-resolution GSHHG `adelaide-coastline.json` prototype has been retired and its runtime import removed. That file must be deleted separately from the local repository; ZIP extraction cannot remove it. The current map intentionally remains without a coastline until the Location SA coastline layer 44 GeoJSON request succeeds. If it fails because of CORS, connectivity or unusable geometry, no outline is shown. The browser must not first draw an approximate coastline and then visibly replace it. The former GSHHG dataset and licensing notes below remain as historical provenance only, not as the current mapping input. Verify the Location SA service and attribution/reuse terms before publishing. No fuel-price observation source or rights are changed by this geographic edit.

## Additional city geography for the 2026-09-17 visual review

- **Current coastline source:** the browser requests GeoJSON from [Location SA, Coastline layer 44](https://location.sa.gov.au/arcgis/rest/services/BaseMaps/TopographicNoFill_wmas/MapServer/44) for the Adelaide metropolitan bounding box, with WGS84 output and a small simplification offset. Its geometry uses the same MapLibre projection as the station observations. This is an optional public reference-service request, not a fuel-data service or a new backend. If the service is unreachable, unavailable through browser CORS or returns unusable data, the coastline remains absent. The source link is shown only once real geometry is loaded. The official service was not accessible for a live network test in the isolated build environment.
- **Suburb reference squares:** approximate place-centre coordinates in `src/visualisations/pulse-of-adelaide/adelaide-places.json`, used only for orientation. They are not suburb polygons, station locations or fuel-data coverage. Location references include [Flinders Port Holdings Port Adelaide coordinates](https://www.flindersportholdings.com.au/port-adelaide/), [Adelaide CBD](https://mapcarta.com/35393328), [Gawler](https://mapcarta.com/Gawler), [Seaford](https://mapcarta.com/16469216), [Modbury](https://mapcarta.com/16477760), [Glenelg](https://maps.apple.com/place?auid=6320388399755340286), and the named suburb coordinate entries for Elizabeth, Goodwood, Klemzig, Magill, Mount Barker and Stirling. The locations are manually selected reference points from those named-place coordinates, not a computed mean of fuel-station locations.
- The coastline and place references do not establish fuel observation ownership or publication permission. Historical fuel observations remain local-only pending source review.

## 2026-09-17 road-reference overlay

The client requests major-road line geometry from [Location SA StreetMapCased roads, layer 42](https://location.sa.gov.au/arcgis/rest/services/BaseMaps/StreetMapCased_wmas/MapServer/42). The service advertises GeoJSON, WGS84 projection output, offset pagination, and `CLASS` codes `FREE` (freeway), `HWY` (highway) and `ART` (arterial). A bounding rectangle `[138.30, -35.44, 138.95, -34.53]` limits requests. Four pages of at most 1,000 features each are the browser safety cap, not a claim of network completeness. Returned lines are clipped to the Adelaide map and drawn faintly using the same projection/mask as the sourced Location SA coastline. The browser does not invent roads or connect fuel stations; road geometry is contextual only. The query's actual payload, pagination coverage, CORS and source attribution/reuse conditions have not been independently verified in the user's network. The overlay is optional if fetch fails. The historical fuel data's rights remain separate and unresolved.


## 2026-09-17 follow-up rendering note

- The new landform look still uses the same client-fetched Location SA metropolitan coastline geometry and major-road geometry already referenced above. The ocean-wave field and land-fill/shadow treatment are purely presentational browser rendering, not extra geographic data.


## 2026-09-17 coastline display correction

- The Location SA coast query returns open line geometry clipped to the metropolitan query window. A prior iteration drew a land-shaped trapezoid by closing one of those open lines against arbitrary viewport corners. That filled shape was not a geographic land boundary and has been removed. The current map projects and draws the actual coastline lines only, with a subtle edge shadow; it does not fill land or infer where the land ends. A future proper land fill would require a verified closed polygon dataset. The ocean waves remain fixed decorative CSS and are not geographic data.

## 2026-09-17 major-road layer revision

The road overlay now requests the published [Location SA StreetMapCased road layer 118](https://maps.sa.gov.au/arcgis/rest/services/BaseMaps/StreetMapCased_wmas/MapServer/118) first. Its geographic scale is closer to the city overview than the earlier, highly detailed layer 42. The client requests GeoJSON with WGS84 output and filters the documented `CLASS` field to `FREE`, `HWY` and `ART`. If a service returns an error or empty geometry, it tries more detailed layers 103 and 42 and then the alternate Location SA host. No proprietary road geometry is copied into this repository; the data is fetched as a runtime reference overlay. A cool dashed rendering separates roads from the continuous coastline. Actual browser CORS/service response and any future public-use attribution requirements still need verification before release. Historical fuel data publication rights remain separate and unresolved.


## 2026-09-17 road image fallback

- The client first requests a transparent PNG from [Location SA StreetMapCased MapServer export](https://maps.sa.gov.au/arcgis/rest/services/BaseMaps/StreetMapCased_wmas/MapServer) using the documented dynamic-layer support. The source is road layer 118, with `CLASS IN ('FREE','HWY','ART')`, a separate cool-blue line symbol per class and labels disabled. Geographic bounds are transformed from the current MapLibre WGS84 view into EPSG:3857; the transparent image is reprojected onto the same map view and refreshed after movement. Unlike JavaScript GeoJSON fetches, loading an ordinary cross-origin image does not require a CORS header. The existing vector query is retained if image loading fails.
- This visual reference does not transfer ownership or licensing of the roads. No road coordinates or fuel observations are bundled. Source terms, the real image contents and network behaviour on the user's computer still require verification before release. If both public hosts and the vector fallback fail, the map shows an unobtrusive road-unavailable message rather than claiming that no roads exist.


## Static public geographic reference, 2026-09-17

**Roads:** Geofabrik's South Australia free shapefile extract dated 2026-09-16T20:21:21Z, supplied as `south-australia-260916-free.shp.zip`. [Source and daily downloads](https://download.geofabrik.de/australia-oceania/australia/south-australia.html); [OpenStreetMap copyright / ODbL 1.0](https://www.openstreetmap.org/copyright). The local `gis_osm_roads_free_1` layer has 271,893 total road records; the published extract selects **all 31,284 source records** with fclass motorway, motorway_link, trunk, trunk_link, primary, primary_link, secondary, secondary_link, tertiary or tertiary_link. Missing/other OSM road classifications are not represented. The source's polygonal coverage may include small adjoining areas and is not a newly surveyed SA boundary. Classes become three visual tiers; there is no routing, network inference or price-causality claim. GeoJSON uses original geometry rounded to six decimal places, clipped with a 0.00002-degree overlap to prevent seams. Adaptive half-degree subdivisions cap detail files near 450 KB, and the separately simplified overview displays major tiers at broad zoom. Generated files total 305 detail tiles, one overview and a manifest. All roads use an uninterrupted native MapLibre vector stroke at line opacity 0.25.

**Coast:** [NOAA NCEI GSHHG](https://www.ngdc.noaa.gov/mgg/shorelines/shorelines.html), level-1 intermediate shoreline geometry installed with Basemap data 2.0.0. Licence: LGPL, separate from OSM roads. The WGS84 line extract clips to `[125.5,-39.3,144.5,-30.2]`, includes 68 mainland/island coastal paths and extends well into WA and Victoria. Two short stylistic meridian cues are anchored to the source shoreline at 129 E and approximately 141 E. They are not an authoritative surveyed legal border; consult Geoscience Australia if precision is needed. Shoreline is intermediate-resolution *overview* geometry, so it is not equivalent to the previous detailed Location SA metropolitan coastline; no intermediate-to-detailed visual swap remains.

**Rebuild:** `scripts/data/pulse-of-adelaide/build_static_geography.py --roads-zip <SA-free-shp.zip> --gshhs-data <gshhs_i.dat> --gshhs-meta <gshhsmeta_i.dat>`. Python dependencies: `pyshp` and `shapely`. Browser assets are committed under `public/data/pulse-of-adelaide/geography/`, with `metadata.json` recording provenance, file counts and byte sizes. The original 141 MB road ZIP, GSHHG binary source and any private fuel observations remain excluded. `public/data/pulse-of-adelaide/events/` remains ignored and unapproved for deployment; static geography does not change historical-fuel source permissions.


## 2026-09-17 static geography presentation refinement

The same GSHHG level-1 shoreline source is trimmed after clipping: SA coastline is retained from 129 E to 141 E, while neighbouring WA and Victoria extend 0.55 and 0.65 degrees beyond those boundaries. Coastal border cues are now 0.085 degrees long and are illustrative meridians, not surveyed boundaries. Projected SVG gradients fade the neighbouring lines and border cues, and a projected CSS mask fades static OSM roads near the state borders. The original 31,284 SA major-road records and 305 detail partitions remain on disk; an always-present simplified overview avoids source cutover during zooming. The road control only changes the paint and visibility, not the source geometry or fuel price observations.


## 2026-09-17 solid land reference

`public/data/pulse-of-adelaide/geography/land.geojson` is a deterministic, bounded mainland polygon derived from the longest continuous GSHHG intermediate-resolution shoreline already in `coast.geojson`, with inland-only closure geometry and reference-point checks. Rebuild it after the coastline trim using `scripts/data/pulse-of-adelaide/build_land_overlay.py`. Land fill and visible shoreline are from the same dataset. The `land.geojson` file is not OSM land geometry, and no new high-resolution shoreline has been downloaded. A sampled spatial check against the locally uploaded OSM shapefile placed approximately 98.3% of road-segment vertices in the Adelaide metro check area on the GSHHG-derived mainland. The remainder include coast-adjacent roads, causeways and differences between geographic source scales. Do not correct legitimate road/station coordinates to match this approximate coastline. A higher-resolution licensed mainland polygon would be required for precise harbour mapping.

## 2026-09-17 Adelaide harbour alignment correction

- The prior static `land.geojson` used intermediate-resolution GSHHG (LGPL), while the road network and fuel-station locations used different, more detailed coordinates. This is a difference in shoreline resolution/source vintage, not a common longitude/latitude or projection offset. For the OSM 2026-09-16 `gis_osm_water_a_free_1` polygon labelled **Port River**, the previous GSHHG-derived land covered approximately one-third of its mapped water surface. Such disagreements make the earlier coast appear to cross water and roads incorrectly.
- The user-supplied Geofabrik `south-australia-260916-free.shp.zip` contains OSM `water` and `riverbank` polygons under ODbL. `scripts/data/pulse-of-adelaide/build_land_overlay.py` now selects 117 bounded Adelaide harbour water features from that same extract, subtracts their union from the statewide GSHHG-based land polygon, and publishes the OSM cut-out shapes as `harbour-water.geojson`. This makes the Port River polygon water in the overlay and provides a more detailed local water boundary. Features outside this harbour correction continue to use the existing GSHHG shoreline and state border cues. This transformation does not move, approximate or delete road or fuel-station coordinates; bridges and causeways may legitimately lie above water.
- The Geofabrik free shapefile extract does **not** include a complete high-resolution open-ocean land polygon. Inland water cut-outs improve the harbour, but cannot guarantee the entire coastline matches OSM at every inlet. A separately sourced and licensed comprehensive OSM coastline polygon would be needed for that level of accuracy. Source data and build script remain separate from all private historical fuel observations.
