# Data Governance and Provenance

## Scope

These rules apply to every DATA, MAPS, and LAB project on `marklee.au`.

## Public-data rule

Portfolio projects should use:

- government open data
- public APIs
- public datasets with suitable reuse terms
- personally collected data that is safe to publish
- derived data produced from the above

Do not use:

- employer datasets
- internal reports
- confidential business information
- customer-level information
- credentials or tokens
- private personal data
- data copied from a source when its licence does not permit the intended use

Fuel projects must use public or explicitly licensed sources with suitable reuse terms. Never use, infer, reconstruct or approximate private employer data from memory or private work outputs. A publicly reachable API does not by itself establish permission to redistribute its data.

These rules apply to local working files too. Every file under `public/` is publicly accessible, regardless of extension or Git tracking. Provenance notes outside `public/` must also be safe for a public repository; omit credentials and signed access URLs.

## Source record

Each project must have a source note under:

```text
data/sources/<project-slug>.md
```

At minimum record:

```text
Project:
Dataset:
Publisher:
Source URL:
Licence or terms:
Retrieved:
Coverage:
Update frequency:
Processing script:
Reproduction command and parameters:
Transformation method:
Units and timezone:
Validation results:
Known limitations:
```

If several sources are used, document each source separately inside the same project source note or link to additional source notes.

## Browser metadata

Every released public dataset folder must contain `metadata.json` or a documented equivalent provenance record. This does not require fabricated metadata for the empty `public/data/` root.

Start from the [metadata template](templates/dataset-metadata.template.json). It is a drafting convention, not a validator or a publishable dataset. Replace placeholders with verified values before release.

Record the dataset version and UTC generation time, each source's publisher, URL, licence and retrieval time, actual date/geographic coverage, processing script and method, and limitations. `files` records each browser filename, its record count and uncompressed byte size; define what a record means for that file in the project contract. Measure compressed initial transfer separately in the release notes. `generatedAt` is not a substitute for `retrievedAt` or the observation period.

Do not fabricate values. Omit or use `null` when something is not known.

Unknown source or reuse terms block publication. Nulls document incomplete research; they do not satisfy the release checklist. Source notes and project metadata describe different things: the Astro `sources` frontmatter supplies verified UI links, while dataset metadata and source notes carry the full provenance and method.

## Attribution

Each published project should expose data attribution somewhere users can reach from the visualisation.

Attribution should include:

- publisher or source
- source link
- licence when required
- retrieval or dataset period when useful

## Validation

Before publishing a data change, Codex should check:

- expected columns or fields exist
- required coordinates are valid
- dates parse consistently
- duplicate handling is intentional
- null handling is documented
- numeric units are explicit
- counts and summary totals are plausible
- derived metrics can be traced to processing logic
- public output does not contain unneeded source fields

## Reproducibility

Where practical:

- pin or record source retrieval dates
- keep transformations in scripts
- write deterministic outputs
- keep a small test fixture if the source is large
- document manual steps that cannot be automated

## Updates

For datasets that change over time, define one of these update models in the project execution plan:

- manual snapshot
- build-time fetch
- scheduled ingestion
- live API proxy

Do not implement automated ingestion before the update frequency and source terms are known.

Default to a manual snapshot prepared explicitly outside the Astro build. Only publish outputs after validation. Document generation/retrieval dates and retain a known-good snapshot when a refresh fails; never silently label stale observations as current.
