# Separate, paused SA Government API integration

This former Pulse ingestion script has its own isolated private paths. It is **not used by The Pulse of Adelaide** and is not scheduled or deployed. No government data may be served through the historical project.

For an optional private check, set `SAFPIS_TOKEN` in your process environment and run `python scripts/data/sa-fuel-pricing/refresh.py --check-access`. For a private refresh use `--refresh`. Output remains in ignored `data/raw/sa-fuel-pricing/` and `data/processed/sa-fuel-pricing/browser-preview/`, not under `public/`. Do not paste your token into source files, prompts or shell commands.

The separate accepted terms and operational obligations are in `docs/sa-fuel-pricing-publisher-terms.md`. Public release would require a new, independently approved project stage.
