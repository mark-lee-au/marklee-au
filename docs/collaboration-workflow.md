# Collaborative Project Workflow

## Purpose

Projects are developed with the user through visible local stages. A promising prototype should remain easy to inspect, discuss and revise before it becomes a release candidate. Publication is a separate decision, not the automatic final step of implementation.

This workflow applies to substantial new DATA, MAPS, GAMES and LAB projects and major redesigns. Small, low-risk fixes can use a shorter path when the user agrees.

## Working branch and local review

`main` is the production branch and may trigger the externally managed Cloudflare deployment. Start substantial project work on `codex/<project-slug>` unless the user requests another branch.

Keep review work local by default:

- run the project with `npm run dev`;
- give the user the local route and a concise account of what is ready to inspect;
- keep unfinished content at `idea` or `prototype` status;
- make scoped revisions from the user's feedback;
- do not merge, push to `main`, or describe the work as published without explicit release approval.

Commits on a feature branch can provide useful checkpoints, but still require the user's explicit permission. Uncommitted user changes must remain untouched.

## Stage 1: Brief and direction

Agree on:

- the central question and intended audience;
- the likely category and stable slug;
- the data source or research question;
- the smallest useful prototype;
- what is deliberately out of scope for the first pass.

Create or update the execution plan. Present the proposed direction and wait for approval before data acquisition or implementation.

## Stage 2: Source and data feasibility

Confirm source authority, reuse terms, coverage, schema, privacy concerns, reporting limitations and update behaviour. Complete the data-project contract far enough to decide whether the idea is feasible.

Deliver a short research and data-readiness report. Include a small number of findings or sample records where useful. Stop if the source or licence is unresolved. Otherwise wait for approval before building the visual prototype.

## Stage 3: Visual prototype

Build the smallest local implementation that can test the visual argument and core interaction. Use representative prepared data when the full pipeline is not yet necessary, provided the prototype is clearly labelled and no unsupported data is published.

For the first review, usually inspect one representative desktop width and one mobile width. Run focused validation, not the full release checklist. Deliver:

- the local route and run command;
- screenshots or a live local preview when useful;
- the main visual and interaction decisions;
- known rough edges and open questions;
- the usage change for the stage when available.

Wait for user feedback.

## Stage 4: Review and iteration loop

This stage can repeat as often as useful:

1. The user reviews the local project and suggests changes.
2. Codex implements only the agreed revision set.
3. Codex runs focused checks related to those changes.
4. Codex presents the revised local result and remaining choices.

Do not repeatedly run every breakpoint, failure-state and release check after small visual changes. Keep a short review log in the execution plan so decisions survive across sessions without loading the full conversation history.

The user decides when the prototype is ready to become a release candidate.

## Stage 5: Release candidate

Only after the user asks for release readiness:

- complete the data pipeline and final browser export;
- finish content, provenance, accessibility and preview assets;
- run the complete data-release and project-release checklists;
- inspect all required responsive widths and failure states;
- run `npm run build` and review the final diff;
- present files changed, payload measurements, QA results, unresolved issues, staging commands and a suggested commit message.

Stop with the verified result local. Release-candidate approval is a separate user decision.

## Stage 6: Publication

After explicit user approval:

1. stage only the authorised files;
2. commit with a specific message;
3. merge or commit to `main` as agreed;
4. push `main`;
5. verify the existing externally managed Cloudflare deployment and live URL;
6. update project status documentation if needed.

Do not invent a deployment command or change Cloudflare, DNS or email configuration.

## Usage checkpoints

At the start and end of each substantial stage, check Codex usage when the product exposes it. Record the starting and ending percentages in the handoff rather than guessing from elapsed time.

The default per-stage ceiling is:

- 15 percentage points of the weekly allowance; or
- 40 percentage points of the rolling five-hour allowance.

Usage is nonlinear and an individual turn may cross a threshold. When a stage approaches or reaches a ceiling, stop at the next safe local state, report what is complete, and ask whether to continue, reduce scope, or change model.

Prefer an economical implementation model and batch routine operations. Use full-source rereads, repeated processing, exhaustive visual QA and high-cost reasoning only when the current stage needs them.
