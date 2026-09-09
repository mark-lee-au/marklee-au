# Roadmap

## Phase 0: Public foundation

Status: mostly complete or in progress

- Astro starter site
- homepage
- DATA page
- MAPS page
- GAMES page
- LAB page
- ABOUT page
- GitHub repository
- existing Cloudflare Worker deployment (externally configured; see `docs/deployment-workflow.md`)
- `marklee.au` domain connection

## Phase 1: Reusable project system

Status: complete (2026-09-08)

Goal: make future projects easy to add.

- project content model
- stable `/projects/<slug>/` route
- project page layout
- category filtering
- featured projects on homepage
- project status support
- source and methodology fields
- consistent project preview cards

Execution plan:

`docs/exec-plans/active/001-foundation-project-system.md`

## Phase 2: First major LAB project

Status: complete (2026-09-08)

South Australian Name Curve is the first published interactive LAB project. It established the static snapshot, project-scoped visualisation and release-validation pattern in [Plan 004](exec-plans/active/004-south-australian-name-curve.md).

Future projects now follow the [collaborative project workflow](collaboration-workflow.md): direction, data feasibility, local prototype, review iterations, release candidate and separately approved publication.

## Phase 2A: Next major LAB project

Data foundation prerequisite: complete (2026-09-08), see [Plan 003](exec-plans/active/003-data-foundation.md). Raw inputs, intermediates, source notes and public exports now have separate homes, with a static-first project contract and release checklist.

Project status: source research unresolved. No suitable fuel source or reuse terms have been established. Resolve that gate before implementing the pipeline or visualisation.

Working project:

The Pulse of Adelaide

Initial scope:

- Adelaide fuel-station map
- time-based price changes
- play and pause
- timeline scrubber
- station details
- concise city-level summary statistics
- mobile version
- public data only
- explicitly prepared static snapshot, reproducible processing and public metadata for V1

Execution plan:

`docs/exec-plans/active/002-pulse-of-adelaide.md`

## Phase 3: Mapping toolkit

Build reusable components only after the first map demonstrates what is genuinely reusable.

Possible reusable elements:

- MapLibre loader
- map theme
- map controls
- tooltip or detail panel
- timeline
- responsive legend
- loading state

## Phase 4: Second major project

Candidate:

Adelaide in Motion

Use Adelaide Metro GTFS and real-time data to visualise public transport movement.

## Phase 5: Broader portfolio

Possible themes:

- South Australian electricity
- census change
- historical geography
- infrastructure
- weather and climate
- migration
- transport
- cities
- unusual public datasets

## Phase 6: Portfolio polish

After several real projects exist:

- stronger About page
- resume link
- social preview images
- project sharing metadata
- search or tag filtering only if the catalogue needs it
- analytics if useful
- accessibility audit
- performance audit
