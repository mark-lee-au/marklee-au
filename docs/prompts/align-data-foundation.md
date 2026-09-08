Read the repository instructions and inspect the current codebase before making changes.

Then read these files:

- AGENTS_DATA_SECTION.md
- docs/data-architecture.md
- docs/data-governance.md
- docs/data-project-contract.md
- docs/checklists/data-release.md
- docs/exec-plans/active/003-data-foundation.md
- docs/exec-plans/active/002-pulse-of-adelaide.md

Implement `docs/exec-plans/active/003-data-foundation.md`.

Important requirements:

1. Preserve the current working Astro and Cloudflare Worker deployment. Adapt the documentation to the actual repo rather than rebuilding the deployment to match an example.
2. Make static, browser-ready public data the default for visualisations.
3. Separate raw source data, intermediate processed data, provenance notes, and public browser output.
4. Treat every file under `public/` as publicly accessible.
5. Never use, infer, reconstruct, or approximate private employer data. Fuel projects must use public or explicitly licensed data only.
6. Add D1, R2, or KV only when a specific project has a measured requirement and the decision is documented first.
7. Local development must not alter production Cloudflare data resources by default.
8. Merge the concise durable rules from `AGENTS_DATA_SECTION.md` into the existing root `AGENTS.md`. Do not replace the existing AGENTS.md.
9. Review and update `002-pulse-of-adelaide.md` so V1 follows the static-first data contract, but do not invent a fuel data source if research has not established one.
10. Update relevant documentation indexes and project status files if the repository uses them.
11. Run the repo's normal checks and `npm run build` after changes.
12. Report all files changed, final folder structure, validation results, and unresolved blockers.
13. Do not commit or push unless I explicitly ask you to.

If the current repository architecture conflicts with any assumption in the new documents, use the working repository as the source of truth, explain the conflict, and make the smallest sensible documentation or structural adjustment.
