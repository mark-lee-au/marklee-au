# Data Release Checklist

Use before publishing a new dataset or materially changing an existing one.

During research and prototype stages, use the relevant source, privacy and processing sections as focused review gates. Complete the entire checklist only when the user asks for a release candidate. Completion does not authorise publication.

## Source

- [ ] Source is public or explicitly licensed for the intended use.
- [ ] Source URL and publisher are recorded.
- [ ] Licence or reuse terms are recorded.
- [ ] Retrieval date is recorded.
- [ ] Known limitations are documented.

## Privacy and security

- [ ] No employer data is included.
- [ ] Fuel data has not been inferred, reconstructed or approximated from private employer information.
- [ ] No private or commercially sensitive data is included.
- [ ] No credentials, API keys, tokens, or secrets are included.
- [ ] Every file under `public/`, including non-data assets, is intended for unrestricted public access.

## Processing

- [ ] Transformations are scripted where practical.
- [ ] Raw inputs, intermediate outputs, provenance and browser exports are separated; reproduction commands are documented.
- [ ] Units and timezones are explicit.
- [ ] Null and duplicate handling is intentional.
- [ ] Geographic coordinates have been validated where relevant.
- [ ] Summary values have plausibility checks.

## Browser output

- [ ] Browser files contain only fields required by the visual.
- [ ] Initial payload has been measured.
- [ ] Large datasets are chunked or queried when appropriate.
- [ ] A metadata file or equivalent provenance record exists.
- [ ] Metadata uses actual retrieval/generation dates, coverage and per-file counts; no unresolved source/licence placeholders remain.
- [ ] Error and empty-data states work.

## Storage and updates

- [ ] Static browser assets are used, or measured requirements and the D1/R2/KV decision were documented before implementation.
- [ ] Local development and validation do not mutate production resources by default.
- [ ] Update model and behaviour on failed/stale refreshes are documented.

## Site

- [ ] Desktop view works.
- [ ] Mobile view works.
- [ ] Reduced-motion behaviour works when animation is used.
- [ ] Source attribution is visible or linked.
- [ ] `npm run build` passes.
- [ ] Other configured checks pass (`package.json` currently has no test, formatter or typecheck script).
