# Execution Plan 002: The Pulse of Adelaide

Status: planned; data-source research blocked pending a verified source (reviewed 2026-09-08).

No suitable fuel source or reuse terms have been established in this repository. V1 uses the static-first [data contract](../../data-project-contract.md), [architecture](../../data-architecture.md) and [governance](../../data-governance.md). The [source note](../../../data/sources/pulse-of-adelaide.md) records unknowns; no dataset, pipeline or findings exist yet.

## Working title

The Pulse of Adelaide

## Initial category

LAB

Likely final category:

MAPS

## Question

How does Adelaide's petrol price cycle move across the city through time?

## Portfolio purpose

Demonstrate:

- data acquisition
- data cleaning
- time-series analysis
- geographic analysis
- data transformation
- interactive mapping
- animation
- responsive visual design
- concise analytical communication

## Data rule

Use public or explicitly licensed fuel data with terms permitting the intended use and redistribution.

Do not use confidential employer datasets, internal price feeds, internal station metadata, or proprietary analysis.

Never infer, reconstruct or approximate private employer data, including from memory. Missing source observations must not be filled using private knowledge.

## Minimum viable project

Build a dark Adelaide map with service-station points and a time control.

Required interactions:

- play
- pause
- timeline scrub
- tap or click station
- station detail view

Required data display:

- station location
- observed fuel price
- time of observation or change
- selected fuel grade
- city-level summary for the current time

Possible summary metrics:

- city median or average price
- cheapest observed station
- price spread
- percentage of stations that recently changed price

Exact metrics should depend on data quality.

## Visual concept

Potential mappings:

```text
station position = latitude and longitude
price level = colour or intensity
price change = pulse event
time = animation timeline
brand = optional symbol or filter
```

Do not commit to colour encoding until the dataset and accessibility needs are reviewed.

## Technical direction

Likely tools:

- Astro project page
- MapLibre GL JS
- TypeScript
- Python or Node preprocessing
- compact JSON or GeoJSON output

D3 may be used for timeline or supporting chart elements if useful.

## Data pipeline

Target pattern:

```text
permitted source -> data/raw/pulse-of-adelaide/ (ignored local input)
   |
   v
scripts/data/pulse-of-adelaide/ (add after research)
   |
   +-- validation
   +-- cleaning
   +-- station matching
   +-- time normalisation
   +-- derived metrics
   |
   v
data/processed/pulse-of-adelaide/ (ignored intermediates)
   |
   v
public/data/pulse-of-adelaide/ (approved browser exports + metadata)
   |
   v
interactive map
```

Commit provenance in `data/sources/pulse-of-adelaide.md`. Document exact retrieval and processing commands when implemented. Given the same pinned inputs and parameters, transformations must produce the same data values and stable ordering; generation time is separate metadata. Validate a new snapshot before replacing approved outputs.

## V1 data contract

Storage and updates: static browser-ready files deployed with the existing Astro output and Cloudflare Worker. Start with an explicitly prepared manual snapshot, with its observation period visible. Source acquisition is separate from `npm run dev` and `npm run build`; no live API, scheduled ingestion or Cloudflare storage is required for V1.

The following is a proposed client contract, subject to inspection of a legitimate source. It does not claim these source fields or coverage exist. Finalise exact schemas, fuel grade, units, timezone, null policy and measured sizes before implementing the map.

| Proposed file | Browser fields and meaning | Ordering and missing-data policy |
| --- | --- | --- |
| `stations.json` | Stable station ID, display name and map coordinates; optional brand only if needed and permitted. Target coordinates: longitude/latitude in WGS84 decimal degrees, transformed from the verified source CRS. | Stable ID order, unique IDs. Exclude unlocatable stations from the map and disclose counts; do not invent coordinates. |
| `timeline.json` | Station ID, observation/change timestamp, selected grade and observed price. Convert verified price units to cents/litre and timestamps to explicit UTC instants; display in `Australia/Adelaide`. | Time then station ID. Finalise duplicate resolution after inspection. Missing observations are unavailable, never zero; any carry-forward/expiry rule requires evidence and disclosure. |
| `summary.json` | Time bucket, count of valid observations, and only metrics supported by the source (for example median price in cents/litre). | Ascending time. No valid observations means count zero and null metrics. Define bucket size, weighting and inclusion rules before export. |
| `metadata.json` | Version, generation and retrieval times, verified sources/terms, actual coverage, processing method, per-file counts/bytes and limitations. | Follow the [metadata convention](../../data-governance.md#browser-metadata); use null for unknown facts during drafting, never fabricate provenance. |

Keep station metadata out of repeated timeline observations. Raw format, size, row count, source identifiers, CRS, timezone, cadence and each output's size are all currently unknown. Record them in the source note after retrieval. Define each file's record-count meaning and payload measurements before release. Aim below about 2 MB compressed for the initial visual data; consider chunks when total data approaches 10 MB. These are planning targets, not measured results or platform limits.

D1, R2 or KV may be considered only after measuring a specific query, payload or update requirement and documenting why static exports/chunking cannot satisfy it. Record the decision and isolated local setup before adding any service. Default commands must not mutate production resources; remote access requires an explicit task requirement and user approval.

Local development uses `npm run dev`; verify built assets with `npm run build` then `npm run preview`. Proposed data URLs are `/data/pulse-of-adelaide/<filename>` in both environments. Before data exists, retain the current PLANNED project page.

Failure behaviour: show loading progress, a readable load-error message and retry control on fetch failure; disable playback until required assets load. Empty periods show an explicit no-observations state. Partial coverage shows available observations and valid-station counts with a visible limitation. Do not portray unavailable values as zero or stale values as current. A future refresh failure retains the last validated snapshot and its original coverage dates.

Attribution: use the existing project `sources` frontmatter for verified source links. Put licence/terms, observation period, retrieval date, limitations and concise methodology in the project body, with a link to public metadata once released. Add real update dates only when data is available; no fabricated citations on the current idea page.

## Research before implementation

Before coding the visual:

1. identify a legitimate public source for historical or current Adelaide fuel prices
2. document access terms
3. inspect available fields
4. confirm geographic coordinates or a geocoding strategy
5. measure observation frequency
6. determine how price-change events can be derived
7. select one fuel grade for the first version
8. estimate browser dataset size

Also confirm redistribution rights, historical availability, raw byte/row counts, stable identifiers, source CRS, timestamp timezone and price units. Record evidence in the source note and finalise the V1 contract above. If research cannot establish a suitable source, leave the visualisation blocked and revise its scope from public evidence; do not invent data or substitute employer knowledge.

## Mobile strategy

On phones:

- map remains primary
- timeline spans available width
- station details use a bottom sheet or stacked panel rather than a desktop side panel
- labels are reduced
- nonessential map decoration is removed

## Accessibility

- provide play and pause controls
- respect reduced motion
- allow scrubbing without animation
- do not rely only on colour to identify change direction or state
- provide written findings below the visual

## Later enhancements

Only after the first version works:

- brand filters
- multiple fuel grades
- cycle comparison
- price-change propagation analysis
- suburb summaries
- day and night visual modes
- downloadable derived data
- annotation of major cycle events

## Completion criteria for LAB publication

- data source is documented
- source/redistribution terms are verified and the research blocker is resolved
- reproducible processing, validated static exports and metadata follow the V1 contract
- actual initial transfer and output sizes are recorded
- [data release checklist](../../checklists/data-release.md) is complete, including load/empty/partial states
- interactive map works
- timeline works on desktop and mobile
- at least one useful finding is written from the data
- methodology is documented
- reduced-motion behaviour exists
- `npm run build` passes
- project page has a stable URL
