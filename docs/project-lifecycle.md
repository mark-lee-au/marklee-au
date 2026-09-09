# Project Lifecycle

## Goal

Allow projects to start small and mature without requiring a complete redesign. Data and visualisation work in progress starts in LAB; games remain in GAMES and use status to show maturity.

Projects move through these stages collaboratively. Follow the [collaborative project workflow](collaboration-workflow.md): stop for local review after direction, data feasibility and prototype work; use the review-and-iteration loop until the user asks for a release candidate; publish only after a separate explicit approval.

## Stage 1: Idea

Capture:

- question
- likely data source
- rough visual idea
- likely category if completed

Store the idea in `docs/backlog.md` or a new project plan if active work is starting.

## Stage 2: LAB or GAMES prototype

Build the smallest version that tests the idea.

Use the [data project contract](data-project-contract.md) and record provenance in `data/sources/<project-slug>.md`. Unverified source or reuse terms remain a research blocker; prototype status does not permit publication of unapproved data.

A prototype should answer:

- Is the data usable?
- Does the visual representation work?
- Is there an interesting finding?
- Does it work on mobile?

It can be published even if it remains small.

During local review, keep it at `status: prototype`. Use `category: lab` for data and visualisation experiments and `category: games` for games. A prototype being usable locally does not itself authorise a commit, merge, push or public release.

## Stage 3: Published LAB

A published LAB item should have:

- stable URL
- title and summary
- working visual
- source attribution
- basic methodology
- mobile support

It does not need a long narrative.

Complete the [data release checklist](checklists/data-release.md) before publishing any dataset, including LAB work. Default to validated static exports with public metadata.

Move into this stage only after the user has reviewed the local release candidate and explicitly approved publication.

Published games follow the same release requirements but remain in GAMES rather than being promoted through LAB.

## Stage 4: Promotion candidate

Promote a LAB project when the idea supports a richer finished story.

Signals include:

- strong analytical findings
- substantial spatial analysis
- useful historical context
- meaningful interaction
- repeatable or refreshed data
- clear portfolio value

## Stage 5: DATA or MAPS

Choose DATA when the core story is analytical and geography is secondary.

Choose MAPS when geography, movement, location, spatial relationships, or cartography are central.

Promotion should usually change project metadata rather than the canonical URL.

## Stage 6: Maintain or archive

For projects tied to changing data:

- show last updated date
- document update method
- repair broken upstream data sources
- archive the project clearly if it can no longer be maintained

Do not silently present stale live-data work as current.
