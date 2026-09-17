# Plan 008: SA Government fuel API (separate and paused)

This is a separate project from The Pulse of Adelaide. It retains the user's accepted current-price publisher agreement and the private API ingestion prototype. There is no user-facing page, active publishing schedule or live dataset for this project. The historical Pulse map does not load these files.

- Source: SA Fuel Pricing Information Scheme Direct API (OUT), subject to the separate publisher agreement and API call limits. See `data/sources/sa-fuel-pricing.md` and `docs/sa-fuel-pricing-publisher-terms.md`.
- Code: `scripts/data/sa-fuel-pricing/refresh.py`, with private raw/output directories `data/raw/sa-fuel-pricing/` and `data/processed/sa-fuel-pricing/browser-preview/`. A token is supplied only via the local process environment.
- Status: user previously confirmed authentication and retrieval of 298 Adelaide priced stations for 8 fuel types. This has not been deployed by this project.
- Before starting any public work: separately approve scope, confirm account and terms, check output quality, configure and verify update/retraction processes and monthly audience reporting, and obtain explicit publication approval. Do not blend this dataset or its publisher obligations into the historical project.
