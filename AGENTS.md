# Codex Instructions for marklee.au

## Purpose

This repository is a personal portfolio for Mark Lee. It presents data as visual stories, maps, animations, interactive games, experiments, and small exploratory pieces.

The site must feel like a gallery of data work, not a dashboard product.

## Read before working

Before making changes, read:

1. `docs/index.md`
2. `docs/current-handoff.md`
3. `docs/project-brief.md`
4. `docs/product-principles.md`
5. The relevant active plan in `docs/exec-plans/active/`
6. Any topic-specific document linked from `docs/index.md`

If the task conflicts with these documents, follow the user's latest explicit instruction and update the documentation if the change is durable.

## Source of truth and session start

GitHub is the source of truth for committed work. The current working tree is the source of truth for reviewed but uncommitted work. Chat transcripts and uploaded ZIP files are snapshots, not authoritative copies.

At the start of every implementation task:

1. Run `git status --short --branch` and `git log -1 --oneline`.
2. Read `docs/current-handoff.md` and the relevant execution plan.
3. Report the branch, base commit, dirty state and intended files before editing.
4. If remote access is available, run `git fetch origin` and compare the current branch with its upstream.
5. Do not pull, switch branches, rebase, merge, apply an update ZIP or overwrite files while unrelated uncommitted changes exist. Stop and ask the user how to proceed.

Never treat a ChatGPT Project file upload as automatically current. If its recorded commit differs from the repository or its handoff conflicts with the working tree, request a fresh context export or use the repository state supplied by the user.

Do not edit or include `.git/`, `node_modules/`, `.astro/`, `dist/`, `.wrangler/`, environment files or local raw data in a handoff package.

## Concurrent work

Only one writer may change a given file set at a time. Codex and a ChatGPT Project can work during the same period only when they use separate branches or clearly disjoint file sets based on the same recorded commit.

Before editing, state the intended file paths. If another active task may touch them, stop and let the user choose which task proceeds first. Never resolve concurrent changes by silently replacing the newer file.

After material work, update `docs/current-handoff.md` with the branch, base commit, state, files changed, validation and next decision. Keep the relevant execution plan as the detailed history.
When a project gains, removes, or materially changes a user-facing UX or accessibility feature, also update that project section in `docs/ux-accessibility-features.md`. Keep that file as the cross-project feature inventory used for case studies; keep implementation chronology in the execution plan.

## ChatGPT Project file delivery

When work occurs in a ChatGPT Project or another chat that cannot write directly to the repository, every response that creates or changes repository files must provide one root-ready ZIP archive.

- The archive must contain only new or replacement files at their repository-relative paths.
- The archive root must be the repository root. Do not add an enclosing `marklee-au/` directory.
- Include `docs/current-handoff.md` when the change materially alters implementation state or decisions.
- List deletions separately in the handoff because extracting a ZIP cannot delete old files.
- Do not include unchanged files merely for completeness.
- State the base branch and full base commit used to prepare the archive.
- State the files included, files to delete, validation run and any unresolved issue.
- Do not claim that the ZIP was applied, committed, pushed or published.

Pure advice, research or review that changes no repository files does not need an empty ZIP.

## Collaborative staged delivery

Substantial new projects and redesigns must follow `docs/collaboration-workflow.md`. The default is collaborative local development, not autonomous end-to-end publication.

- Work in stages: brief, source/data feasibility, visual prototype, review iterations, release candidate, then publication.
- At the end of each stage, stop at a usable local state, summarize decisions and open questions, and wait for the user's approval before entering the next stage.
- Treat review as an iteration loop. Keep the local project easy to run while the user makes suggestions; implement scoped changes and show the revised result without prematurely running the entire release process.
- For substantial work, use a non-production `codex/<project-slug>` branch unless the user requests another branch. Do not merge or push to `main` until the user explicitly approves the release candidate for publication.
- Do not mark content `published`, add a publication date, or present it as live before release approval. Use `idea` or `prototype` while it is under review.
- A request to start or continue a project authorizes only the current agreed stage. It does not implicitly authorize later stages, committing, pushing, merging, or deployment.

Small, low-risk fixes do not require every stage, but still require explicit approval before commit or publication.

## Usage management

Keep Codex usage proportionate and visible.

- For a substantial stage, check current Codex usage at the start and end when usage information is available. Report the measured change in the stage handoff.
- Use 15 percentage points of the weekly allowance or 40 percentage points of the rolling five-hour allowance as the default ceiling for one stage. Because usage is nonlinear, stop at the next safe handoff if the measured increase approaches or reaches either ceiling; ask before continuing.
- Recommend an economical model before substantial work. Prefer GPT-5.6 Terra for normal implementation and GPT-5.6 Luna for routine, mechanical, or high-volume work when available. Reserve more expensive reasoning models for genuinely difficult methodology, architecture, or final review, and explain the reason before using them.
- Batch related file reads, searches and checks. Keep command output focused. Avoid repeating full builds, full data processing, or multi-breakpoint browser QA after minor edits.
- During prototype and review stages, validate only what is needed for useful feedback. Run the complete data and project release checklists once the user asks for a release candidate.
- If the requested stage is likely to exceed its budget, narrow the scope or propose a separate follow-up stage before proceeding.

## Current stack

- Astro
- TypeScript where scripting is needed
- Plain CSS for the site shell
- Static output by default
- Existing Cloudflare Worker hosting with static Astro output; see `docs/deployment-workflow.md`
- GitHub repository with production branch `main`
- Node version is defined by `.nvmrc`

Add libraries only when a project needs them.

Preferred visualisation tools:

- D3 for custom SVG and data-driven visuals
- MapLibre GL JS for interactive maps
- Observable Plot for conventional statistical charts
- Motion for interface animation
- deck.gl only for large geographic datasets
- Three.js only when a real 3D requirement exists

Do not add React, Vue, a database, a CMS, or server-side infrastructure unless a clear project requirement needs it.

## Product rules

- DATA contains finished data stories that are not primarily geographic.
- MAPS contains finished work where geography is central.
- GAMES contains interactive games and playful systems, whether or not data is their primary subject.
- LAB contains data projects, visualisations, experiments, prototypes, small ideas, and work in progress; games do not belong in LAB.
- A LAB project may later be promoted into DATA or MAPS.
- Projects should lead with the visual and the question, not a long explanation.
- Avoid generic analytics-dashboard layouts.
- Keep the site shell restrained so individual projects can have their own visual identity.
- Use public or properly licensed data. Never use confidential employer data.
- Cite data sources and show a last-updated date when freshness matters.

## Coding rules

- Keep components small and understandable.
- Prefer Astro components for static UI.
- Keep client-side JavaScript limited to actual interactivity.
- Preprocess large datasets outside the browser where practical.
- Put reusable visualisation code under `src/visualisations/` when that directory exists.
- Put data preparation scripts under `scripts/` when that directory exists.
- Put static processed datasets under `public/data/` only when suitable for public download.
- Do not expose API keys or secrets in browser code.
- Use semantic HTML.
- Preserve responsive layouts.
- Respect `prefers-reduced-motion`.
- Support keyboard access for interactive controls.
- Do not rely on hover as the only way to reveal information.

## Data and visualisation rules

- Read `docs/data-architecture.md`, `docs/data-governance.md`, and `docs/data-project-contract.md` before changing pipelines, browser datasets, or Cloudflare storage.
- Default to preprocessed public static datasets. Add D1, R2, or KV only after measuring a project requirement and documenting the decision in its execution plan.
- Every file under `public/` is publicly accessible. Never put secrets, credentials, private or employer data, commercially sensitive data, or personal information there.
- Never use, infer, reconstruct, or approximate private employer fuel data. Fuel projects must use public or explicitly licensed sources with suitable reuse terms.
- Separate local raw data (`data/raw/`), intermediate outputs (`data/processed/`), provenance (`data/sources/`), and browser exports (`public/data/<project-slug>/`). Gitignore is not a security boundary.
- Prefer deterministic processing scripts in `scripts/data/`. Export only fields needed by the visual and measure browser payloads before adding infrastructure.
- Record source, licence, retrieval time, transformation method, date range, geography, and known limitations. Use `docs/checklists/data-release.md` for dataset releases.
- Local development must not mutate production D1, R2, or KV. Remote bindings require an explicit task requirement and user approval.
- Run documented validation and build commands after data code or browser dataset changes.

## Styling rules

- Default site shell is dark, minimal, and typography-led.
- Use a small neutral colour system for navigation and structure.
- Let each project define its own accent colours where the data calls for it.
- Avoid decorative gradients, glassmorphism, excessive shadows, and generic SaaS styling.
- Avoid visual clutter around the main data visual.
- Mobile layouts must be designed, not merely shrunk from desktop.

## Performance rules

- Static generation is preferred.
- Avoid shipping raw large datasets to the browser.
- Avoid loading visualisation libraries globally when only one project uses them.
- Lazy-load expensive interactive components when sensible.
- Keep animations frame-rate aware and pause work when off-screen where practical.
- Test project pages at narrow mobile widths.

## Validation

For any code change:

1. Run `npm run build`.
2. Fix build errors before completion.
3. If the task changes navigation, routes, or project cards, verify affected pages manually with `npm run dev` when possible.
4. If new tests or checks are later added to `package.json`, run the relevant commands too.

## Documentation maintenance

Update documentation when a change alters:

- architecture
- project lifecycle
- category rules
- data handling
- deployment workflow
- durable design conventions
- active roadmap status

Do not turn `AGENTS.md` into a long project encyclopedia. Put detailed information under `docs/` and link it from `docs/index.md`.

## Git behaviour

Do not commit or push unless the user explicitly asks.

At the end of a task, report:

- files changed
- tests or build commands run
- any unresolved issues
- suggested commit message

When useful, provide commands that stage only the files changed by the task.
