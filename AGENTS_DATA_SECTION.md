# Data architecture rules to merge into AGENTS.md

Codex should merge the following durable rules into the existing root `AGENTS.md`. Keep `AGENTS.md` concise and link to the deeper documents under `docs/`.

Merged on 2026-09-08 by Plan 003. The root `AGENTS.md` is authoritative; this file preserves the import reference.

## Data and visualisation rules

- Read `docs/data-architecture.md` and `docs/data-governance.md` before changing data pipelines, browser datasets, Cloudflare storage, or project visualisation data contracts.
- Default to public, preprocessed static datasets for visualisations. Add D1, R2, or KV only when a project has a measured need and the decision is documented first in an execution plan.
- Treat `public/` as public internet content. Never place secrets, credentials, private data, employer data, commercially sensitive data, or personal information in `public/`.
- Do not use, infer, reconstruct, or approximate private employer fuel data. Fuel projects must use public or explicitly licensed sources only.
- Keep raw source data separate from browser-ready data.
- Prefer deterministic processing scripts over manual edits to generated datasets.
- Record dataset source, licence, retrieval time, transformation method, date range, geography, and known limitations.
- Browser data should be shaped for the visualisation. Do not send large raw analytical tables to the client when a smaller derived dataset can answer the same interaction.
- Local development must not mutate production D1, KV, or R2 data unless the task explicitly requires remote bindings and the user approves it.
- Run the documented validation and build commands after changing data code or browser datasets.
- Do not commit or push unless the current user instruction explicitly asks for it.

Deep references:

- `docs/data-architecture.md`
- `docs/data-governance.md`
- `docs/data-project-contract.md`
- `docs/checklists/data-release.md`
