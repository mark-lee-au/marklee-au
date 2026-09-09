# Project Status

## Current state

Execution Plan 001 is complete as of 2026-09-08. The Astro starter now has:

- homepage
- DATA page
- MAPS page
- GAMES page
- LAB page
- ABOUT page
- reusable site header
- reusable footer
- category cards
- project cards
- global CSS
- a validated project content collection in `src/content.config.ts`
- five Markdown project entries in `src/content/projects/`
- shared project ordering, URL and status helpers
- homepage featured projects and category listings driven by the same entries
- a reusable project layout and eleven static routes, including `/games/` and `/projects/<slug>/`
- optional preview images, publication/update dates, source links and repository links

South Australian Name Curve is a published LAB project with a prepared public dataset and dedicated interactive visual. It was released from commit `5890e1c` and verified on the live Cloudflare site on 2026-09-08. The Pulse of Adelaide, Adelaide in Motion and Powering South Australia remain public LAB ideas displayed as PLANNED. DATA and MAPS remain empty until projects are ready for promotion.

The existing visual direction, navigation and card system are preserved. GAMES is now a separate collection for interactive games; LAB remains for data projects and visualisations in progress. Formula Daily is an unpublished local prototype. Project-specific TypeScript and CSS are loaded only on their routes.

## Validation

- The latest `npm run build` passes: nine static pages, no build warnings.
- All five main routes and all four project routes inspected using `npm run dev`.
- All nine routes checked at 360 px for horizontal overflow; the About heading issue was corrected and rechecked. Representative layouts, including the interactive project, were visually inspected at 390, 768, 1280 and 1600 px too.
- Project cards support Tab focus with a visible outline and Enter navigation.
- A temporary metadata change verified promotion into DATA/MAPS, removal from LAB, unchanged project URLs/canonical links, and homepage removal with `featured: false`. Original LAB metadata was restored and the final site rebuilt.
- `git diff --check` passes.
- APIs verified against locally installed Astro 7.3.1. The build ran with available Node 24.20.0; `.nvmrc` remains 22.20.0. Both meet this Astro version's supported Node range, but the pinned Node version was not separately tested.
- No standalone type-check or test command is configured in `package.json`.

No unresolved foundation issues. South Australian Name Curve now exercises preview, source, date and dedicated visual-slot support with real project content. Research for the planned Pulse of Adelaide project remains in Plan 002.

## Deployment context

The user confirms an existing Cloudflare Worker deployment. The repository builds static Astro output into `dist/` with no adapter, Wrangler configuration, Worker source or D1/R2/KV bindings. Earlier Pages assumptions have been corrected; externally managed deployment commands and triggers remain unverified. See [deployment workflow](deployment-workflow.md).

The domain `marklee.au` is being moved to Cloudflare DNS while email remains hosted by VentraIP.

## Current priority

Formula Daily is the current staged project; see [Plan 005](exec-plans/active/005-formula-daily.md). The Pulse of Adelaide stays blocked on a suitable public fuel source with confirmed reuse terms; see [the source note](../data/sources/pulse-of-adelaide.md).

## Data foundation (Plan 003)

Implemented 2026-09-08: durable data rules merged into root `AGENTS.md`; separate raw, processed, provenance, browser output and script directories; raw/intermediate ignore defaults; source and metadata conventions; contract and release checklist; Pulse V1 aligned to an explicitly prepared static snapshot. No source data, pipeline, schema validator, dependency or Cloudflare resource was added. Existing application code and deployment configuration were preserved.

See [Plan 003](exec-plans/active/003-data-foundation.md) for the completion and validation record. The earlier visual checks above belong to Plan 001; this documentation and directory task does not change routes, cards or layouts.

Next technical task:

`docs/exec-plans/active/002-pulse-of-adelaide.md`

For adding future project entries, see `docs/project-template.md`. Keep project slugs unchanged during category promotion.

## First real project

South Australian Name Curve is the first implemented interactive LAB project. Its release and validation record is documented in [Plan 004](exec-plans/active/004-south-australian-name-curve.md). The earlier Pulse of Adelaide concept remains planned in [Plan 002](exec-plans/active/002-pulse-of-adelaide.md).

## Update rule

Update this file after major milestones so a new Codex session can quickly determine current state.
