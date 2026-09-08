# Roadmap

## Phase 0: Public foundation

Status: mostly complete or in progress

- Astro starter site
- homepage
- DATA page
- MAPS page
- LAB page
- ABOUT page
- GitHub repository
- Cloudflare Pages deployment
- `marklee.au` domain connection

## Phase 1: Reusable project system

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
