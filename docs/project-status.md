# Project Status

## Current state

The repository started from an Astro portfolio starter with:

- homepage
- DATA page
- MAPS page
- LAB page
- ABOUT page
- reusable site header
- reusable footer
- category cards
- project cards
- global CSS

The user confirms an existing Cloudflare Worker deployment. The repository builds static Astro output into `dist/` with no adapter, Wrangler configuration, Worker source or D1/R2/KV bindings. Earlier Pages assumptions have been corrected; externally managed deployment commands and triggers remain unverified. See [deployment workflow](deployment-workflow.md).

The domain `marklee.au` is being moved to Cloudflare DNS while email remains hosted by VentraIP.

## Data foundation (Plan 003)

Implemented 2026-09-08: durable data rules merged into root `AGENTS.md`; separate raw, processed, provenance, browser output and script directories; raw/intermediate ignore defaults; source and metadata conventions; contract and release checklist; Pulse V1 aligned to an explicitly prepared static snapshot. No source data, pipeline, schema validator, dependency or Cloudflare resource was added. Existing application code and deployment configuration were preserved.

See [Plan 003](exec-plans/active/003-data-foundation.md) for the completion and validation record. Fuel source research remains unresolved; see [the source note](../data/sources/pulse-of-adelaide.md).

## Current priority

Do not redesign the homepage again before building the reusable project system.

Next technical task:

`docs/exec-plans/active/001-foundation-project-system.md`

## First real project

The planned first major LAB project is:

The Pulse of Adelaide

Plan:

`docs/exec-plans/active/002-pulse-of-adelaide.md`

## Update rule

Update this file after major milestones so a new Codex session can quickly determine current state.
