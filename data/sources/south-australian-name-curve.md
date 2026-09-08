# South Australian Name Curve — source and provenance

- Project: South Australian Name Curve
- Dataset: Popular Baby Names (`9849aa7f-e316-426e-8ab5-74658a62c7e6`)
- Publisher: Attorney-General's Department, Government of South Australia; dataset author listed as Consumer and Business Services
- Source URL: <https://data.sa.gov.au/data/dataset/popular-baby-names>
- Catalogue API: <https://data.sa.gov.au/data/api/3/action/package_show?id=popular-baby-names>
- Licence: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
- Retrieved: 2026-09-08
- Coverage: South Australia, registration years 1944–2025, in the source's male and female registration categories
- Update frequency: annual; the catalogue says annual data is normally published in January or February
- Processing script: `scripts/data/south-australian-name-curve/process.py`
- Reproduction command: `python scripts/data/south-australian-name-curve/process.py`
- Units and timezone: annual registration counts and annual rank; timezone not applicable

## Resources used

- Official `baby-names-1944-2013.zip`, containing one male and one female CSV for every year 1944–2013.
- Annual male and female CSV resources for 2014–2024.
- Annual male and female XLSX resources for 2025.
- The amended male and female 2016 files are used in preference to the two earlier 2016 uploads.

Exact resource IDs, URLs, catalogue timestamps, byte sizes and source hashes are captured in the ignored raw `catalogue.json` and the checked processing manifest. Source acquisition is an explicit operation and is never part of `npm run dev` or `npm run build`.

The catalogue metadata was modified on 2026-01-02 and adds two 2025 resources on that date. Its prose description and `temporal_coverage_to` value still end at 2024; the individual official resources establish the actual snapshot coverage through 2025.

## Publication depth and interpretation

The 1944–2017 annual files contain full published distributions, including many rows with a single registration. Resources from 2018 onward are explicitly labelled “Top 100”. Ties mean an annual file may include slightly more than 100 rows or end on a tied rank below 100.

An absent record is never treated as zero. In 1944–2017 the browser can only say a missing point is below this project's display threshold or was not registered. In 2018–2025 it can only say the name is outside the published top 100. Lines break across missing years; no interpolation is used.

## Privacy decision

The public browser export has a minimum annual display threshold of **five registrations**. Rows with counts 1–4 are removed before export, and names with no remaining eligible observations are omitted from search. This avoids amplifying single-person or unusually rare annual records merely because the historical source is public. Ranks are never recomputed after privacy suppression.

## Transformation

The deterministic processor:

- normalises historical header variants (`Given Name`/`First Name`, `Amount`/`Number`);
- removes blank and `TOTAL` footer rows;
- excludes the source placeholder `UNNAMED` from the name experience;
- validates years, categories, numeric fields and the expected coverage boundary;
- merges exact duplicate category/name/year source rows by summing their counts, then recomputes competition ranks within the published annual category;
- title-cases display names and creates stable category-qualified IDs;
- suppresses annual rows below five registrations;
- verifies rank ordering and keeps the recomputed pre-suppression competition ranks;
- derives peak, first/last eligible record and latest-list context;
- sorts all output stably; and
- writes compact browser JSON plus a detailed ignored validation report.

## Known limitations

- Counts are registrations, not the number of people currently living in South Australia and not a national Australian measure.
- Population and birth totals changed across the 82-year span. Counts are useful but are not normalised to all births because this project has no authoritative denominator.
- The publication-depth change after 2017 creates right-censored series. A missing recent point does not mean zero registrations.
- The source categories are retained as published. They describe registration groupings in the files and should not be read as broader claims about identity.
- Spelling variants are separate names. The processor does not merge punctuation, diminutives or variants.
- Complete-era source files contain split duplicate rows for some exact names. Counts are summed for those exact keys and ranks are recomputed before privacy filtering; the validation report records the affected group and row totals.
- The catalogue provides no detailed methodology note explaining retrospective amendments or rank-tie policy. The project uses supplied values and documents the amended 2016 resource selection.

## Validation record

The 2026-09-08 release-candidate run validated 164 annual source files and 233,631 rows. It produced 231,601 merged annual records, combined 2,029 duplicate key groups (2,030 surplus rows), suppressed 190,709 annual records below five, and exported 40,762 observations across 2,425 category-qualified series. The minimum browser count is five and `UNNAMED` does not appear.

`names.json` is 942,332 bytes raw. Independent Node measurements produced 188,290 bytes with gzip and 126,022 bytes with Brotli. Derived summaries were checked against prepared observations for Mark, Jennifer, Oliver and Charlotte. The detailed machine-readable validation report remains under ignored `data/processed/`; the public totals, resource manifest and output hashes are recorded in `public/data/south-australian-name-curve/metadata.json`.
