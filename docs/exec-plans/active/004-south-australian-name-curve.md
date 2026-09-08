# Execution Plan 004: South Australian Name Curve

Status: local release candidate complete (2026-09-08); commit, push and live verification await user approval.

## Objective

Publish a polished LAB project at `/projects/south-australian-name-curve/` that asks: “When did your name peak in South Australia, and what other names rose and fell around it?” The canonical slug remains stable if the project later moves to DATA.

## Data-project contract

### 1. Question

Let a visitor find a registered baby name, see its annual curve and peak, compare it with up to two other name/category series, and understand what an unpublished year does—and does not—mean.

### 2. Authoritative source and terms

- Dataset: **Popular Baby Names**, Data.SA dataset ID `9849aa7f-e316-426e-8ab5-74658a62c7e6`.
- Publisher: Attorney-General's Department, Government of South Australia; dataset author is Consumer and Business Services.
- Catalogue: <https://data.sa.gov.au/data/dataset/popular-baby-names>
- Licence: Creative Commons Attribution 4.0, confirmed in the catalogue metadata; redistribution with attribution is permitted.
- Snapshot retrieved: 2026-09-08.
- Actual resource coverage: registrations categorised by the source as male or female, 1944–2025. The catalogue description and temporal metadata still say 1944–2024, but two resources published on 2026-01-02 add 2025.
- Update cadence: annual, normally January or February according to the catalogue.
- Update model: explicitly prepared manual static snapshot. Acquisition and transformation are separate from Astro development and builds.

Resource depth changes materially: annual CSV files contain full published distributions for 1944–2017, including many one-registration rows. From 2018 onward, resources are explicitly “Top 100”; 2018–2024 are CSV and 2025 is XLSX. Tied counts can make the row count or final rank differ from exactly 100. The amended 2016 resources supersede the earlier duplicate 2016 uploads.

No source documentation was found that authorises treating an absent name as zero. The UI therefore distinguishes:

- 1944–2017 absence after privacy filtering: “fewer than 5 registrations or not registered”; and
- 2018–2025 absence: “outside the published top 100”.

### 3. Data shape

- Raw source: 140 historical CSV files inside the official 1944–2013 ZIP, annual male/female CSV files for 2014–2024, and two XLSX files for 2025.
- Fields: `Given Name` or `First Name`; `Amount` or `Number`; `Position`.
- Natural key after normalisation: `(source category, canonical name, year)`.
- Units: annual registration count and source-supplied annual rank. No timezone applies.
- Geography: South Australia.
- Source category: retain `male` and `female` exactly as registration categories. Do not generalise them into claims about identity.
- The pinned source snapshot plus extracted CSVs occupies 5.69 MiB across 166 local raw files. The processor validates 164 annual source files and 233,631 source rows.

### 4. Privacy, validation and transformation

The browser export excludes every annual row with fewer than **5 registrations**. This conservative disclosure control prevents the project from republishing single-person and unusually rare annual records even though they appear in older public files. Names without at least one eligible annual record do not enter the search index.

Processing will:

1. validate filename years, expected columns, integer counts/ranks, category, and 1944–2025 coverage;
2. ignore blank and `TOTAL` footer rows;
3. normalise names for display and lookup while preserving punctuation and diacritics where present;
4. use the amended 2016 resources, merge exact duplicate `(category, name, year)` source rows by summing their registration counts, and recompute competition rank within that published annual category;
5. exclude the `UNNAMED` placeholder, then suppress annual counts below five before any browser export;
6. never recompute ranks after privacy suppression;
7. precompute first/last published record, eligible peak year/value/rank, latest-list status, active span, and discovery scores;
8. order output deterministically by category then name and observations by year;
9. validate selected summaries against their source rows and generate a machine-readable report.

No percentage of births is calculated because no authoritative annual birth denominator is part of this source.

### 5. Browser client contract

| File | Purpose and fields | Missing-data policy |
| --- | --- | --- |
| `names.json` | Schema version, year extent, publication-depth bands, curated example IDs, and eligible series. Each series has a stable `category:name` ID, display name, source category, compact `[year,count,rank]` observations, and precomputed summary metrics. | No synthetic zeroes or interpolated points. Missing years are interpreted from the coverage band in the UI. |
| `metadata.json` | Snapshot/generation dates, publisher, source/resource URLs, CC BY 4.0 licence, coverage, threshold, methods, limitations, validation summary, and per-file counts/bytes. | Unknown values are not fabricated. Publication is blocked if source or licence fields are unresolved. |

The full browser data loads only on the project route. Target: comfortably under 2 MB gzip; exact raw and gzip/brotli sizes will be recorded after generation. A single compact file is preferred if it remains well below budget because search and “Surprise me” need the full index and the payload is reused for comparisons.

Identifiers use lowercase source category plus a colon plus a URL-safe canonical name, for example `male:mark`. Record count for `names.json` means both series count and eligible annual observation count, recorded separately in metadata.

### 6. Storage choice

Static files under `public/data/south-australian-name-curve/`. The dataset is public, changes annually, fits the browser budget after thresholding and compaction, and needs no server query. D1, R2, KV, runtime API, CMS, or framework is not justified.

### 7. Local development and reproduction

- Acquire or refresh source files explicitly with `powershell -ExecutionPolicy Bypass -File scripts/data/south-australian-name-curve/acquire.ps1`.
- Generate and validate the snapshot with the documented Python command in the source note.
- Run the site with `npm run dev`; build with `npm run build`. Neither command fetches data or accesses production services.

### 8. Failure and partial states

- Static HTML includes an explanatory fallback and source/coverage note before JavaScript runs.
- During fetch: a compact loading message preserves the visual frame.
- Load or schema failure: readable error, retry button, and the non-interactive explanation remain available.
- No search result: explicit suggestion to check spelling or choose an example.
- Missing year: the scrubber and textual readout state either “fewer than 5 or not registered” (complete-list era) or “outside the published top 100” (top-100 era), never zero.
- A future refresh failure retains the last validated snapshot and its visible retrieval/coverage dates.

### 9. Attribution

A concise coverage warning sits beside the chart. Full source, CC BY 4.0 attribution, snapshot date, threshold, duplicate handling, derived metrics, and limitations appear immediately below the visual and in `data/sources/south-australian-name-curve.md`. Public metadata is linked from the project copy.

### 10. Release checks

Complete `docs/checklists/data-release.md` and `docs/checklists/project-release.md`, including payload measurement, build, direct route refresh, listings/homepage, error/empty states, keyboard/touch, reduced motion, console, overflow, and visual checks at 360, 390–430, 768, 1280 and 1600 px. Do not commit or push until the user approves the completed local version.

## Visual concept

Three directions were considered:

1. **Rank river** — names flow between rank positions. It makes competition vivid but overstates continuity where only top-100 rows exist.
2. **Ridgeline archive** — each decade becomes a stacked ridge. It is atmospheric but makes exact years and comparison harder.
3. **Name field** — a selected luminous curve crosses a quiet field of historically adjacent trajectories, with direct labels, an exact-year focus line, and a count/rank mode. This best balances gallery presence, honest gaps, readable values and comparison.

The chosen **name field** uses horizontal position for year and vertical position for count or rank. Selected names use distinct colour plus stroke pattern/marker shape; contextual names are chosen by peak-era proximity and recede into a restrained background. Gaps stay discontinuous. Motion traces state changes rather than decorating the page, and reduced-motion users get the final geometry immediately.

Desktop gives the field a wide cinematic aspect. Mobile makes the primary name dominant, lowers contextual density, stacks metrics, keeps controls above the fold, and retains a full-width year scrubber for tap/keyboard access.

## Implementation outline

- `scripts/data/south-australian-name-curve/`: pinned acquisition, transformation and validation.
- `data/processed/south-australian-name-curve/`: ignored detailed validation report.
- `public/data/south-australian-name-curve/`: compact browser snapshot and metadata.
- `data/sources/south-australian-name-curve.md`: public provenance and reproduction note.
- `src/visualisations/south-australian-name-curve/`: project-only Astro, TypeScript and CSS.
- `src/content/projects/south-australian-name-curve.md`: metadata and concise editorial copy.
- Project route dispatches this slug into its dedicated visual slot while all other projects keep the generic route.
- A rendered preview captured from the final visual supplies project cards and homepage feature art.

## Release boundary

Local implementation and verification are authorised. Commit, push, external Cloudflare verification, DNS changes and deployment configuration changes are not authorised in this phase.

## Completion and validation record

The local implementation is complete. The prepared snapshot contains 2,425 searchable category-qualified series and 40,762 eligible annual observations after suppressing counts below five. Processing read 233,631 source rows from 164 annual files, merged 2,029 duplicate name/category/year groups (2,030 surplus rows), and suppressed 190,709 low-count rows. The exported `names.json` is 942,332 bytes raw, 188,290 bytes with gzip and 126,022 bytes with Brotli in an independent Node measurement—well below the approximate 2 MB compressed target.

Data-release checks passed: the source and CC BY 4.0 terms are recorded; every pinned resource is hash-verified; coverage is continuous from 1944 through 2025; date, count, rank, duplicate, null and threshold rules are validated; the minimum exported count is five; `UNNAMED` is absent; no browser secret or raw rare-name row is exported; deterministic peak summaries were spot-checked for Mark, Jennifer, Oliver and Charlotte; and provenance plus machine-readable metadata are present.

Project-release checks passed locally: `npm run build`; direct route and query-state refresh; LAB listing and homepage feature placement; generated preview artwork; loading, empty-search and forced data-failure/retry states; count/rank switching; two- and three-name comparison; mouse, keyboard, pointer/tap and year-slider operation; accessible combobox semantics; visible focus and non-colour stroke/marker distinctions; screen-reader and no-script summaries; deliberate reduced-motion code paths; no horizontal overflow; and no console warnings or errors in a clean session. The page was visually inspected and iterated at 360, 390, 768, 1280 and 1600 CSS pixels.

The remaining release-only checks are intentionally pending: commit, push, externally managed Cloudflare Worker deployment status and the public `marklee.au` URL. Those require the user's explicit approval. No production service, DNS record or deployment configuration was changed.
