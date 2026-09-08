# Execution Plan 002: The Pulse of Adelaide

Status: planned

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

Use public, licensed, or otherwise publishable data only.

Do not use confidential employer datasets, internal price feeds, internal station metadata, or proprietary analysis.

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
source data
   |
   v
scripts/pulse-of-adelaide/
   |
   +-- validation
   +-- cleaning
   +-- station matching
   +-- time normalisation
   +-- derived metrics
   |
   v
compact browser dataset
   |
   v
interactive map
```

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
- interactive map works
- timeline works on desktop and mobile
- at least one useful finding is written from the data
- methodology is documented
- reduced-motion behaviour exists
- `npm run build` passes
- project page has a stable URL
