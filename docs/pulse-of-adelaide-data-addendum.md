# The Pulse of Adelaide: Data Addendum

The V1 contract from this import has been incorporated into [Plan 002](exec-plans/active/002-pulse-of-adelaide.md), which is the authoritative project plan. This addendum retains the proposed file overview for reference. No source, pipeline or browser dataset has been established; see the [source research note](../data/sources/pulse-of-adelaide.md).

## V1 storage

Default to static browser-ready files unless source research proves this is impractical.

Target structure:

```text
data/sources/pulse-of-adelaide.md
scripts/data/pulse-of-adelaide/
public/data/pulse-of-adelaide/
  stations.json
  timeline.json
  summary.json
  metadata.json
```

Raw downloads may live locally under:

```text
data/raw/pulse-of-adelaide/
```

Intermediate outputs may live under:

```text
data/processed/pulse-of-adelaide/
```

## Browser contract

### `stations.json`

Stable station information required by the map.

Likely fields, subject to the actual source:

- stable station ID
- display name
- latitude
- longitude
- brand or category only if legally and analytically appropriate

### `timeline.json`

Time-varying values needed by the animation.

Do not duplicate full station metadata for every timestamp.

Prefer compact structures keyed by stable station ID.

### `summary.json`

Precomputed values used in headline statistics and annotations.

Examples may include:

- city average by time bucket
- minimum and maximum
- station count with valid observations
- distribution summaries

Final metrics depend on source coverage and methodology.

### `metadata.json`

Record source provenance, generation time, coverage, record counts, and known limitations.

## Upgrade triggers

Consider D1 only if the public historical source becomes large enough that users need arbitrary server-side time or station queries.

Consider R2 for large source archives, large map assets, or downloadable historical packages.

Consider KV only for small latest-state or cache values.

Do not add any of them during V1 solely in anticipation of future scale.

Measure the actual requirement and document why static exports/chunking are insufficient in Plan 002 before adding a service. Keep development resources isolated from production.
