# Data Guidelines

Use [data architecture](data-architecture.md) for storage and directories, [governance](data-governance.md) for provenance, [the project contract](data-project-contract.md) before implementation, and [the data release checklist](checklists/data-release.md) before publishing or updating data.

## Source rules

Prefer data from:

1. government open-data portals
2. official APIs
3. statistical agencies
4. academic or research institutions
5. recognised open-data projects
6. reputable secondary sources when primary data is unavailable

Use community datasets carefully and document their origin.

## Employer data

Do not use confidential, internal, proprietary, or personally identifying employer data.

Industry knowledge may guide questions, but fuel projects must use public or explicitly licensed sources with suitable reuse terms. Never use, infer, reconstruct or approximate private employer data, including from memory or private work outputs. Independently created synthetic fixtures for other projects must be clearly labelled and cannot stand in for observed findings.

## Attribution

Every published project should identify the dataset source.

Include source URLs where possible.

If a licence requires specific attribution, reproduce the required attribution accurately.

## Reproducibility

When practical, keep data preparation scripts in the repository.

A future reader should be able to understand:

- where the raw data came from
- what transformations were performed
- what derived values mean

## Raw data

Do not automatically commit large raw datasets.

This repository ignores `data/raw/` and `data/processed/` contents except their READMEs. Keep provenance in committed `data/sources/<project-slug>.md` notes and scripts under `scripts/data/`. Ignoring a file does not make it safe to store confidential data.

For each source, decide among:

- download at build or preparation time
- small committed raw sample
- ignored local raw-data directory
- externally hosted source

## Processed data

Browser-facing data should contain only what the visual needs.

Publish approved static exports and metadata under `public/data/<project-slug>/`. Every file under `public/` is internet-accessible. Add D1, R2 or KV only after a measured requirement and documented decision, with local development isolated from production resources.

Use compact formats appropriate to the project:

- JSON
- GeoJSON
- CSV
- TopoJSON
- vector tiles

Do not optimise prematurely. Start simple, then reduce payloads when measurement shows a need.

## Personal information

Avoid publishing personal data that could identify individuals unless it is clearly public, lawful to republish, relevant to the project, and handled responsibly.

Aggregate or remove sensitive fields where possible.

## Time-sensitive data

Record:

- data extraction date
- coverage period
- update frequency
- known publication delay

Display a last-updated date on the project when visitors could reasonably assume the visual is current.

## Data quality

Document meaningful limitations such as:

- missing observations
- changed definitions
- inconsistent geographic boundaries
- estimated values
- geocoding uncertainty
- sampling bias
- reporting delays
