## 2026-10-09 coastal land and water correction

The original east-coast processing treated Overture coastline `land` polygons
as a complete land surface. These polygons contain the Pacific coastline, but
**do not contain interior Sydney Harbour water holes**. This caused the
Harbour-channel validation to fail, protecting the old `inner-sydney` bundle.
The corrected processor uses the matching-release `water` layer to subtract
mapped bays, harbour channels and inland water from sourced land. Ocean stays
black/unpainted. It does not add hand-drawn shorelines or alter the renderer.

The user's complete east-coast cache now contains **five verified downloads**:
45,055 buildings, 1,103 building parts, 13,888 NSW roads, 18,616 land features
and 3,305 water features. All five use extent `[151.18,-33.903,151.315,-33.829]`
and Overture release `2026-09-23.1`. **From the repository root, after applying
the corresponding code ZIP, run exactly this:**

```powershell
py -u scripts/data/fireworks-simulator/acquire_sydney.py --extent east-coast --transport-source nsw-only --overture-release 2026-09-23.1
```

Do **not** use `--fresh-download` or `--reuse-local`. The command verifies the
extent/release/count metadata and reuses all five cache files, without calling
Overpass or changing source releases. It builds the real expanded city,
validates the coast and harbour, and atomically replaces the public JSON only
if all checks pass. On a failure, the existing browser JSON is preserved.

The old `data/raw/.../sydney/overture-water.geojson` covers only inner Sydney;
do not copy it over the new `acquisition-cache-east-coast/overture-water.geojson`.
The earlier `acquire_sydney_coastline.py` is a separate, legacy ocean-inverse
processor and must not be used on the expanded output.

After a successful run, verify `city.sceneExtent = east-coast`, the source
counts, `profile.landTriangleCount`, the shoreline in SKYLINE and PLAN, the
building fade, frame rate and output/gzip sizes. The full 3,305-feature water
source was downloaded locally after the repository snapshot, so final coastal
coverage and browser performance still require review on that machine.

## First east-coast preview without Overpass (recommended while 504 persists)

The NSW RoadSegment data is already a complete line network for the requested
Sydney extent. OpenStreetMap adds exact lane/width annotations and some traffic
controls, but **is not required to generate the baseline city streets**. A
stalled Overpass tile should not prevent a coastline/building review.

The verified local acquisition cache from the 2026-10-09 east-coast run contains
45,055 Overture buildings, 1,103 parts and 13,888 NSW road features. Run:

```powershell
py -u scripts/data/fireworks-simulator/acquire_sydney.py --extent east-coast --transport-source nsw-only --overture-release 2026-09-23.1
```

This command reuses valid extent/release-matched cached sources, skips Overpass
entirely and requires Overture `land` plus `water` for coastal masking. Processing
still requires all the existing coastal and geometry checks to pass. On success,
`public/data/fireworks-simulator/sydney-city.json` will change to
`sceneExtent=east-coast`, and the profile will contain
`transportSourceMode=nsw-only`. NSW road centrelines remain present, but OSM
lane-width enrichment and OSM traffic signal/crossing locations are absent.
NSW-derived road junctions remain available. This is an honest, deliberately
partial source mode, not invented OSM data. No city file is replaced on failure.

After the coastal baseline looks correct, the regular command can enrich it:

```powershell
py -u scripts/data/fireworks-simulator/acquire_sydney.py --extent east-coast --transport-source nsw-osm
```

The cache retains the validated source records and completed Overpass tiles.
Do not use `--reuse-local` with incomplete acquisition; it requires a matching
promoted source manifest. Do not run the legacy coastline script over the new
coast-derived land.

### Reuse for Newcastle and later cities

The existing browser contract (local X/Y metres, land triangles, building
footprints and heights, roads, transport points, authored structures) can be
reused. A second city's adapter must supply its own:

- explicit WGS84 acquisition bounds and locally appropriate projection/origin;
- Overture buildings, building parts and coast/land polygons;
- an available road provider, optionally supplemented by OSM (not mandatory);
- validation landmarks and coast/land spot checks;
- city-specific structural models and attribution.

`prepare_sydney_city.py` still hard-codes the Sydney origin, EPSG:7856 and
landmark calibrations. **Do not run it on Newcastle inputs** until those are
extracted into a city profile. The NSW-only switch demonstrates that OSM
transport enrichment can be optional without altering the common renderer.

---

## Retrying east-coast downloads after HTTP 504

The `east-coast` request can fail at the OSM Overpass step after Overture and NSW
have already responded. Do **not** use `--reuse-local` after an incomplete
first acquisition: that option requires a fully accepted source manifest.

Apply the 2026-10-09 resume patch and run the normal command again:

```powershell
py -u scripts/data/fireworks-simulator/acquire_sydney.py --extent east-coast
```

The patched command stores each completed source in
`data/raw/fireworks-simulator/sydney/acquisition-cache-east-coast/`. It verifies
its geographic bounding box, Overture release, type and nonempty content
before reusing it. OSM transport is requested in smaller sequential tiles, with
adaptive subdivision for HTTP 504 responses. Completed tiles remain cached
for subsequent runs. The first retry still needs to download earlier successful
sources once because the previous downloader discarded their temporary files.

**Never run `--reuse-local` while acquisition is incomplete.** It expects all
five source layers and the matching manifest. On success the script validates
the whole coastal scene before promoting source files and replacing
`public/data/fireworks-simulator/sydney-city.json`.

`--fresh-download` clears the staged cache if you deliberately need an entirely
new set of source downloads. Do not use it for ordinary network retries.

The raw download cache is local and must not be included in a commit or patch.

# Sydney city import, transport network and camera prototype

The browser scene is a **static, local-metre dataset**. The input is Overture Maps Buildings (`building` plus `building_part`). There is no browser API key, server-side runtime, data scrape or confidential source. See `docs/fireworks-simulator-sydney-city-research.md` and `data/sources/fireworks-simulator-sydney-city.md`.

## Pacific coastline completion (2026-10-09 review stage)

The previous `inner-sydney` source box ends at `151.238°E`, before Sydney's
Pacific shoreline. The uploaded building/road data and `overture-water.geojson`
are from that older extraction. **They cannot supply the missing coast.** The
empty OSM coastline Overpass response cannot be reused either.

Run the new *bounded* coast option from the repository root in PowerShell with
internet access:

```powershell
py -m pip install --upgrade "shapely>=2.1" overturemaps pyproj
py scripts/data/fireworks-simulator/acquire_sydney.py --extent east-coast
npm run dev
```

The explicit source bbox is `[151.180, -33.903, 151.315, -33.829]` in
`[west, south, east, north]` WGS84 order. This preserves the previous western,
southern and northern limits while allowing enough eastern search space to
reach the Pacific. Its eastern longitude is an **acquisition bound**, not an
invented shoreline or a permanent visible map edge.

The command acquires and processes **all five layers together**: Overture
`building`, `building_part` and `land`; NSW RoadSegment; and OSM transport.
The land source is Overture's OSM-coastline-derived `subtype=land`,
`class=land` polygons. The generator measures the eastmost point of the
sourced coastal land *within the scene's north/south limits* and sets the final
scene frame **300 metres east of it**. Pacific water remains transparent.
The west/north/south land boundaries remain clipped to the urban data limits.

The script refuses to replace the existing public city when the Overture land
is missing, extends to the far eastern acquisition edge, misclassifies its
known harbour/CBD checks, fails triangulation checks, or cannot pass existing
building/road quality checks. A `--reuse-local --extent east-coast` run requires
an exact matching local manifest and cached Overture land extract; the old
inner-Sydney files are deliberately rejected. Raw sources stay ignored under
`data/raw/fireworks-simulator/sydney/`. Inspect building/road counts, coastal
extent, data size and FPS before deciding to commit a regenerated public JSON.
Do **not** rerun the older `acquire_sydney_coastline.py` on this new output:
that legacy pass uses the former harbour-water inversion instead of the new
source-land coastline.

In SKYLINE the renderer fades city geometry at its own bounds. The **land
itself fades to full transparency on the artificial north/south/west edges**
over the final 300 metres, revealing the existing near-black page background.
The genuine eastern coastline keeps its precise edge against unpainted ocean.
The Canvas fallback uses the same three artificial-edge directions.

The previous inner-Sydney city JSON is backed up to
`data/raw/fireworks-simulator/sydney/sydney-city-inner-sydney-backup.json`
when present. If the acquisition or processing fails, the public JSON is not
replaced. Internet access to the Overture, NSW and OSM providers is required.
This change package does not include newly downloaded coastal source data.

---

## Wider inner-Sydney scene (review-stage option)

### Retry after a GEOS `TopologyException` (no new download)

The expanded 2026-10-09 acquisition can finish downloading all four raw layers
and still fail while computing a city-wide union of road buffers. The raw layers
are saved under ignored `data/raw/fireworks-simulator/sydney/` *before* that
processing step. Apply the corresponding preprocessing fix, then run:

```powershell
py scripts/data/fireworks-simulator/acquire_sydney.py --extent inner-sydney --reuse-local
```

This command does not contact Overture, NSW or OSM. It uses the saved Overture
buildings and parts, NSW roads and OSM transport data, and applies the same
quality checks as a new download. If a raw file is missing, it fails rather
than silently fetching a different dataset. The existing browser city JSON
remains unchanged until all checks succeed.

The geometry audit now uses nearby road buffers, indexed spatially, rather
than unioning the entire city road network. Source building footprints remain
unchanged. Invalid rings can be repaired **for the audit only**. Unresolvable
features are flagged `roadConflict`/`roadAuditError` and withheld from the
renderer. Their count and up to 10 IDs appear in the output profile. The
command refuses to replace the city if more than 0.5% of buildings (minimum
allowance 25) have geometry-audit errors. This protects against a wider
projection or geometry-processing failure being mistaken for isolated bad data.

Previous acquisitions did not save a release manifest. When retrying those
raw files, the exact Overture release cannot be established from filenames.
The script prints a warning, records `overtureReleaseVerified: false`, and
does not invent a release. Supply `--overture-release RELEASE_ID` **only if
you have verified that identifier**. New acquisitions save their release,
retrieval date and bounding box in ignored `sydney-source-acquisition.json`
as soon as the downloads finish, even if later geometry processing fails.
Do not commit/publish an expanded output with unverified release provenance.

The topology fix is tested on Shapely 2.x. If your local installation lacks
`shapely.errors.GEOSException`, update it with
`py -m pip install --upgrade "shapely>=2.0"` before retrying.

The supplied `sydney-city.json` is still the actual **CBD extract** from Overture release `2026-09-23.1`, with the Sydney Tower duplicate correction. It is **not** yet expanded. This checkout contains no raw GIS files outside the CBD and cannot fabricate the missing buildings or streets. The larger extract is generated locally with internet access:

```powershell
py scripts/data/fireworks-simulator/acquire_sydney.py --extent inner-sydney
npm run dev
```

Use `Ctrl+F5` after reloading the Fireworks LAB page. The wider rectangle, `[west, south, east, north] = [151.180, -33.903, 151.238, -33.829]`, adds North Sydney, the Pyrmont/Glebe side, Redfern/Waterloo and Potts Point/Darlinghurst. The original CBD extent `[151.195, -33.882, 151.222, -33.848]` is still the **default** when `--extent` is omitted. The skyline camera starts at the existing viewpoint; PLAN frames the full new scene on first load.

All four data channels use the same requested bounds: Overture `building` and `building_part`, NSW RoadSegment and OSM transport detail. The preparer clips both roads and buildings to the selected bounds, keeps the same Harbour Bridge local-metre origin, and applies the Sydney Tower duplicate suppression. Expanded acquisition checks that real buildings exist beyond each edge of the old CBD. The public JSON is replaced only after **all** downloads and these validation checks succeed. A copy of the last CBD JSON is placed locally at `data/raw/fireworks-simulator/sydney/sydney-city-cbd-backup.json` (ignored by Git) before first replacement.

To restore the smaller city after reviewing the expansion:

```powershell
Copy-Item data/raw/fireworks-simulator/sydney/sydney-city-cbd-backup.json public/data/fireworks-simulator/sydney-city.json -Force
```

Record the generated `buildingCount`, `roadCount`, `outputByteSize`, gzip estimate and FPS at your own display size. The wider extract can be several times heavier than CBD. There is **no viewport streaming or level-of-detail system yet**; the GPU builds one city mesh. If startup time or interaction speed becomes poor, review a tiled/streamed city bundle in the next stage rather than weakening the measured-data rules. Additional harbour water/shoreline geometry, terrain and bridge details beyond the core remain **procedural approximations**, not a surveyed expanded model.

## One-command real Sydney acquisition on Windows

From the repository root in PowerShell, with internet access and Python installed:

```powershell
py -m pip install overturemaps pyproj shapely
py scripts/data/fireworks-simulator/acquire_sydney.py
npm run dev
```

For the street layer only, without re-downloading Overture buildings:

```powershell
py -m pip install pyproj shapely
py scripts/data/fireworks-simulator/acquire_sydney_transport.py
npm run dev
```

Open the LAB Fireworks Simulator and confirm the top label now says **SYDNEY / OVERTURE ... BUILDINGS** rather than **SYDNEY / CALIBRATION BUILDINGS**. Use `Ctrl+F5` if your browser cached the previous JSON.

Without `--extent`, the acquisition script reads the current Overture STAC release, uses Overture's official Python API to fetch a **bounded** `building` and `building_part` extract for `151.195,-33.882,151.222,-33.848`, checks the release again, and processes it into `public/data/fireworks-simulator/sydney-city.json`. It leaves your existing public city file unchanged if the download, schema or quality check fails. **Internet access is required to acquire the source.**

**IMPORTANT:** The checked-in JSON **already contains real CBD buildings** acquired locally on 2026-10-08. The ZIP for this expansion does not contain any newly acquired outlying suburbs because the source hosts could not be reached from the patch environment. Run the explicit expansion command to create the wider city. Do not confuse the calibration-only output of `prepare_sydney_city.py` with the current real city export.

The checked-in JSON also includes real CBD street segments and transport points. The wider suburbs' street data has not been acquired yet.

## Street and transport sources

Sydney uses two complementary sources, both transformed through the same EPSG:7856 to local-metre pipeline as buildings:

- **NSW Spatial Services RoadSegment** is the Australia-first street centreline and naming source. It supplies `roadnamebase`, `roadnametype`, `roadnamesuffix`, `functionhierarchy`, `roadontype`, `surface` and a coded `lanecount`. The coded lane values are `0 = unknown`, `1 = one lane`, `2 = two or more lanes`. Code `2` is **not an exact two-lane count**.
- **OpenStreetMap** is bounded enrichment for exact `lanes=*` values when present, explicit `width=*`, `highway=traffic_signals` and `highway=crossing`. It also acts as a global fallback road source if a future city has no government adapter.
- **Overture Transportation** is the preferred common international contract for future city adapters. It provides segment centrelines, connector topology, names, road class/subclass, width rules, surfaces, speed limits and level rules. Current Overture road schema does not provide a direct lane-count field, so lane enrichment stays separate.

Browser roads store names now so labels can be added later without changing the schema. The renderer uses `displayWidthM`; when a source width is unavailable, this is explicitly tagged as a rendering estimate rather than a measured carriageway width.

Derived `junction` points are created only where three or more road-segment endpoints meet within a 2 m snap cell. Explicit OSM traffic-signal and crossing nodes remain separate point types. The TfNSW Traffic Lights Location dataset is recorded as a later NSW-authoritative validation/enrichment source because its current download requires portal login.

## Building / road coordinate integrity

Roads and buildings are checked in the **same local metre coordinate system**. Only ground-level road corridors participate in the overlap audit. Bridge and tunnel segments do not automatically invalidate a building footprint.

- Procedural calibration massing may be cut back or withheld where it intersects a sourced ground road because the calibration footprint is invented.
- Real Overture building geometry is never silently moved or clipped. A material ground-road conflict is flagged `roadConflict: true` and withheld by the renderer until the source/date/level mismatch is reviewed.
- Building parts whose `minHeightM` is 4.5 m or more are not treated as ground-level conflicts.

This policy prevents a visually tidy scene from corrupting valid source geometry, while also preventing known road/building conflicts from being rendered as if they were correct.

## Data contract

- Input: WGS84 GeoJSON (`FeatureCollection`) for `building`; optionally `building_part` GeoJSON. The preprocessing CLI also reads line-delimited GeoJSONSeq.
- Transform: WGS84 to GDA2020 MGA 56 (`EPSG:7856`), then subtract the fixed Harbour Bridge origin to obtain `x east, y north, z up` in metres.
- Clip source polygons to the fixed WGS84 bounding box. Simplify real polygon exteriors to 1.0 metre by default for the one-command workflow. Holes and non-flat roof shapes are not rendered yet.
- Height: actual `height` first, then `num_floors * 3.2 m`, then provisional 18 m. For building parts, `min_height`/`min_floor` controls the lower elevation; part `height` is added to that base. The corresponding height-source flag travels with every exported prism.
- Building parts: when a usable `building_part` belongs to a returned parent, emit those distinct parts in place of the full-height parent prism. If it has no usable parts, keep its original parent footprint. No guessed geometry is substituted for Overture source polygons.
- Browser: one compact `sydney-city.json`; `city.geometryMode = "overture-prototype"` only when real data was processed. A measured `profile` includes usable count, parts count, source coverage, height fallbacks, simplification vertices and output bytes.
- Opera House, Harbour Bridge, Sydney Tower and the harbour water polygon are **still procedural/calibration approximations**. Replacing building footprints does not turn these into surveyed meshes, and Overture building parts do not guarantee roof-shape completeness.

Raw acquisitions are ignored by Git and stay in `data/raw/fireworks-simulator/sydney/`. The derived browser JSON is the only output to include in a later approved patch or commit after local review. Check the ODbL-1.0 conditions and attribution before public deployment. Current data geometry and script are not coupled to Astro builds, Cloudflare or live services.

## Manual/offline reproduction

If you already have an actual bounded Overture GeoJSON extract and know its release and retrieval date:

```powershell
py scripts/data/fireworks-simulator/prepare_sydney_city.py `
  --overture data/raw/fireworks-simulator/sydney/overture-buildings.geojson `
  --building-parts data/raw/fireworks-simulator/sydney/overture-building-parts.geojson `
  --overture-release 2026-09-23.1 `
  --overture-retrieved-at 2026-10-07 `
  --roads data/raw/fireworks-simulator/sydney/nsw-road-segments.geojson `
  --roads-retrieved-at 2026-10-07 `
  --osm-transport data/raw/fireworks-simulator/sydney/osm-transport.json `
  --osm-retrieved-at 2026-10-07 `
  --simplify-m 1.0
```

Replace the release/date with **the release and retrieval date of your files**. The official API currently targets the latest release, and the one-command script captures the actual identifier. Do not claim a historical release unless the source actually came from it.

For comparison without overwriting your public file, pass `--output` to a temporary local path and compare `--simplify-m 0.25` with `1.0` on the same input. Use real data to measure height completeness, footprint complexity, browser parse time and moving-camera FPS before broadening Sydney.

**Do not run `prepare_sydney_city.py` without `--overture` against the checked-in browser output after acquiring real data.** Calibration mode intentionally regenerates the fallback scene, currently 26 generic background blocks plus 11 published-height/coordinate tower anchors, and would overwrite your acquired building geometry.

## Camera interaction contract

In **SKYLINE** mode, left-drag or one-finger drag pans the city across the ground plane. Right-drag rotates. Holding both mouse buttons and dragging vertically changes camera height with a 2 m ground stop. Mouse wheel, pinch and `+`/`-` physically move the camera forward/backward along its current viewing direction rather than changing field of view. `W/A/S/D` and the arrow keys pan smoothly in viewport directions, `Q`/`E` rotate, and `R`/`Home` resets.

In **PLAN** mode, the directional controls pan, `Q`/`E` rotates and wheel/pinch/`+`/`-` retains orthographic zoom. RESET VIEW restores the original defaults.

This remains a Canvas 2D renderer. Opaque city architecture is drawn behind the firework and nearer architecture is redrawn after the firework using camera depth. This is a painter-depth approximation, not a per-pixel z-buffer.

## Review gate

After importing data, check: usable Overture building/part count, direct height versus floor/fallback percentages, raw and compressed JSON bytes, recognisability of Bridge/Opera House/CBD at typical camera distances, gesture smoothness on your actual phone, and visual ordering when the camera moves behind buildings. Stage 5 real-data acceptance is not complete until those checks are recorded.

Official: <https://docs.overturemaps.org/getting-data/overturemaps-py/>, <https://docs.overturemaps.org/guides/buildings/>, <https://docs.overturemaps.org/schema/reference/buildings/building_part/>, <https://docs.overturemaps.org/attribution/>.

## Sydney Tower duplicate-source correction (2026-10-08)

The Overture export can contain tall building parts inside the separately modelled Sydney Tower observation-tower anchor. The preparation script now suppresses only tall (at least 55% of authored height) Overture footprint centroids within 20 m of an authored observation tower. Low podium building parts, including Westfield Sydney, remain untouched. IDs/counts are logged in `profile.landmarkDuplicateRemovedIds` and `landmarkDuplicateRemovalCount`. The original height handling remains unchanged for other buildings.

For an existing **real** Sydney browser bundle when the local raw Overture files are unavailable, use the same audited correction without replacing the real dataset with a procedural fallback:

```powershell
py scripts/data/fireworks-simulator/prepare_sydney_city.py --repair-existing
```

For a future Overture export, the same audit runs as part of `build_bundle` automatically. The `--repair-existing` flag changes only the browser export at `public/data/fireworks-simulator/sydney-city.json`; do not use it for other cities. Follow with `py -m unittest discover -s scripts/data/fireworks-simulator -p test_prepare_sydney_city.py`. Skyline WebGL now draws Centrepoint in the city depth buffer; Canvas remains the PLAN/WebGL-unavailable fallback.

## Sydney land-only mesh from Overture ocean polygons (2026-10-09)

**The old hand-authored water wedges are obsolete.** The first Overpass
`natural=coastline` request returned a valid JSON response with `elements: []`.
This cannot build a coastline and must not be reused or interpreted as a
coordinate conversion failure. The corrected acquisition instead downloads
bounded **Overture base/water** features. Overture's `subtype=ocean` polygons
come from a quality-checked OpenStreetMap coastline process. The land layer is
derived as `city frame - ocean`, preserving islands and harbours. Water remains
an empty black background in WebGL/Canvas.

From the repository root in PowerShell:

```powershell
py -m pip install --upgrade "shapely>=2.1" overturemaps pyproj
py scripts/data/fireworks-simulator/acquire_sydney_coastline.py
npm run dev
```

The script downloads **water only**, not buildings or roads, and uses the
existing `public/data/fireworks-simulator/sydney-city.json` for coordinates
and bounds. It checks Overture's release before and after acquisition, saves
the raw bounded water GeoJSON and metadata under ignored `data/raw/`, validates
three land/harbour anchors, checks overall coverage, and triangulates the land
using Shapely's constrained Delaunay triangles (which respect shoreline holes).
Only after those checks pass does it atomically replace the existing browser
city JSON, saving a one-time backup. The Overture release and retrieval date
are recorded separately from the older, unverified building acquisition.

If Overture water was **already downloaded with this revised script** and only
the conversion needs a retry:

```powershell
py scripts/data/fireworks-simulator/acquire_sydney_coastline.py --reuse-local
```

**Do not use `--reuse-local` with the old `osm-coastline.json`.** It contains no
features and is deliberately ignored by the revised script. The new cache is
`overture-water.geojson`. If the new raw water extract lacks ocean features,
conversion fails without modifying the current city file.

Render order: black stage, land-only triangles, roads, buildings, landmarks,
fireworks. The ground grid and old water polygons are not drawn. The new land
mesh is derived offline and is not a browser map service. Overture's OSM-based
geometry is ODbL licensed and needs suitable attribution before publication.

Review the Bridge, Opera House, islands, inner harbour shoreline, FPS and JSON
transfer size locally. Source retrieval and browser performance were not
validated in the patch-building environment.
