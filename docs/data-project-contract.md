# Data Project Contract

Each visualisation project should answer these questions before implementation moves beyond a prototype.

Record the answers in the project's execution plan and link its `data/sources/<project-slug>.md` note. Label unknown facts explicitly; unresolved source or reuse terms block data publication, including LAB prototypes.

## 1. Question

What single question or experience is the visual trying to communicate?

## 2. Data source

- What is the authoritative source?
- Is it public?
- What are the reuse terms?
- How often does it update?
- What is the date and geographic coverage?
- Which update model applies? Default to an explicitly prepared manual snapshot, separate from the Astro build.

## 3. Data shape

Document:

- source format
- approximate raw size
- approximate row or feature count
- keys or identifiers
- coordinates and coordinate reference system when geographic
- timestamps and timezone
- units

## 4. Transformation

State what will be calculated before the browser receives the data.

Examples:

- geocoding
- aggregation
- timeline bucketing
- ranking
- percentiles
- route geometry simplification
- coordinate projection
- derived animation states
- summary statistics

## 5. Client contract

Define the browser-ready files or API endpoints.

Example:

```text
/data/pulse-of-adelaide/stations.json
/data/pulse-of-adelaide/timeline.json
/data/pulse-of-adelaide/summary.json
/data/pulse-of-adelaide/metadata.json
```

For each output, state:

- fields
- units
- ordering
- null policy
- approximate size
- measured raw bytes and compressed transfer before release
- identifiers, schema/version, and record-count meaning

Generate metadata using [the template](templates/dataset-metadata.template.json) or document an equivalent. Proposed filenames are not evidence that the source exists.

## 6. Storage choice

Choose one primary model:

- static assets
- D1
- R2
- KV plus another canonical store

Static assets are the default. Measure derived payload, loading/query needs and update frequency; document why static exports or chunking are insufficient before adding D1, R2 or KV. No resource should be provisioned just because it appears in this list.

## 7. Local development

State how a developer can run the project locally without touching production data.

Currently use `npm run dev`, or `npm run build` and `npm run preview`, with files in `public/data/`. Document acquisition and processing as separate explicit commands once scripts exist. Any future bindings must use verified isolated local resources; production-mutating remote access requires an explicit task requirement and user approval.

## 8. Failure behaviour

State what the visual should show when:

- the dataset fails to load
- an API is unavailable
- no data exists for a selected period
- only part of the dataset is available

## 9. Attribution

State where source attribution and methodology will appear in the UI.

## 10. Release checks

Use [the data release checklist](checklists/data-release.md) before publishing any dataset, including a LAB prototype, materially updating data, or promoting a project into DATA or MAPS.
