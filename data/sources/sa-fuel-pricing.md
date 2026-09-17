# Separate, paused SA Government fuel API project

The previous Pulse government integration has been separated from the historical map. The accepted February 2021 publisher terms, API limits and publisher obligations remain documented in `docs/sa-fuel-pricing-publisher-terms.md`. This project is paused and has no public page or scheduled refresh.

The subscriber confirmed a successful authorised API check and private retrieval of 298 priced Adelaide stations, 8 fuel types. See `scripts/data/sa-fuel-pricing/refresh.py` and its README; its outputs stay under ignored `data/raw/sa-fuel-pricing/` and `data/processed/sa-fuel-pricing/`. No token or live data is included in the repository patch. The supplier agreement for that service does not establish rights for the separately supplied historical archive.
