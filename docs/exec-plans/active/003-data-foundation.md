# Execution Plan 003: Data Foundation

Status: complete (2026-09-08). Kept at the original path to preserve documentation links, following Plan 001's convention.

## Implementation and deployment findings

- Astro `^7.1.6` is declared; the lockfile and installed version are `7.3.1`. The unchanged configuration sets only the site URL and builds eight static pages into `dist/`.
- No Cloudflare adapter, Worker source, Wrangler config, storage binding, deploy script or CI workflow exists in this checkout. The user confirms a working Worker deployment; older documents assumed Pages. Documentation now describes the actual static build and preserves the externally managed Worker setup. The exact production deploy command and trigger cannot be established from this checkout and were not invented.
- Existing commands remain `npm run dev`, `npm run build` and `npm run preview`. No application code, dependency, lockfile, Astro configuration or Cloudflare resource changed in this task.
- Root guidance now includes the durable data rules. Raw/intermediate directories are ignored except their READMEs; provenance and browser assets remain trackable. Local `.wrangler/` state and `.dev.vars*` secrets are ignored too.
- Source notes, a metadata drafting template and release checks define provenance. Schema validation and processing scripts are deferred until a real dataset establishes useful requirements.
- Pulse V1 now specifies an explicitly prepared static snapshot, reproducible processing, proposed browser files, metadata, failure states and attribution. Source research remains unresolved; no fuel dataset or findings have been invented.

## Final data structure

```text
data/
  raw/
    README.md                 # all other contents ignored by default
  processed/
    README.md                 # all other contents ignored by default
  sources/
    README.md
    pulse-of-adelaide.md       # unresolved research note
public/
  data/
    README.md                 # intentionally public; no project data yet
scripts/
  data/
    README.md                 # no scripts until a source/schema exists
docs/
  templates/
    dataset-metadata.template.json
```

No `.gitkeep` files are needed because the directories contain guidance. Project-specific raw, intermediate, script and public-output subdirectories will be created with the first real dataset.

## Validation results

- `npm run build`: passed against the existing working tree, producing eight static pages with no build warnings. Three project routes come from pre-existing uncommitted Plan 001 work and are deliberately outside this commit; the Data Foundation staged change contains no application code. Ran with Node `24.20.0` and npm `12.0.2`; pinned Node `22.20.0` was not separately tested.
- `npm run dev -- --host 127.0.0.1`: started successfully. HTTP smoke checks returned 200 for all eight routes and `/data/README.md`.
- Verified `public/data/README.md` is copied unchanged to `dist/data/README.md`; raw, intermediate, provenance and script directories are absent from built output.
- `git check-ignore`: raw/intermediate samples (including nested paths), local Wrangler state and development secrets are ignored. README exceptions, provenance, scripts and public data remain trackable.
- Metadata template parses as JSON; relative Markdown file links resolve.
- `git diff --check`: passed. Git's Windows line-ending notices are informational.
- `package.json` has no test, formatter or standalone typecheck command. No generic validation framework was added for empty directories.

This task did not change routes, navigation, project cards or layouts, so no new visual/interaction checks were needed. Earlier Plan 001 browser checks remain recorded separately in `docs/project-status.md`.

## Unresolved items

No data-foundation implementation blocker remains. Pulse source/licence, historical coverage, identifiers, coordinates, observation frequency and payload sizes require research before its pipeline or visualisation can proceed. Production Worker settings were not inspected or changed; their absence from this checkout limits deployment verification. No production deployment, commit or push was performed.

## Files changed by this task

Pre-existing uncommitted project-system work was preserved. This task added six directory/source-note files and edited the following repository/import documents (some were already modified or untracked before the task).

- Root: `.gitignore`, `AGENTS.md`, `AGENTS_DATA_SECTION.md`, `README.md`, `README_IMPORT.md`.
- New directory files: `data/raw/README.md`, `data/processed/README.md`, `data/sources/README.md`, `data/sources/pulse-of-adelaide.md`, `public/data/README.md`, `scripts/data/README.md`.
- Data guidance: `docs/data-architecture.md`, `docs/data-governance.md`, `docs/data-project-contract.md`, `docs/data-guidelines.md`, `docs/checklists/data-release.md`, `docs/templates/dataset-metadata.template.json`.
- Architecture and lifecycle: `docs/architecture.md`, `docs/deployment-workflow.md`, `docs/decisions/0001-core-stack.md`, `docs/project-brief.md`, `docs/project-lifecycle.md`, `docs/project-template.md`, `docs/checklists/project-release.md`.
- Plans and status: `docs/exec-plans/active/002-pulse-of-adelaide.md`, `docs/exec-plans/active/003-data-foundation.md`, `docs/pulse-of-adelaide-data-addendum.md`, `docs/index.md`, `docs/project-status.md`, `docs/roadmap.md`.

Suggested commit message: `Add static-first data foundation and align Pulse V1 contract`.

## Goal

Align the repository with a static-first data architecture that works locally and on Cloudflare Workers, while leaving clear upgrade paths to D1, R2, and KV.

## Read first

- `AGENTS.md`
- `AGENTS_DATA_SECTION.md`
- `docs/data-architecture.md`
- `docs/data-governance.md`
- `docs/data-project-contract.md`
- existing architecture, deployment, and project lifecycle documents
- `docs/exec-plans/active/002-pulse-of-adelaide.md`

## Tasks

### 1. Inspect current deployment

Determine:

- Astro version and output mode
- Cloudflare adapter or Worker integration in use
- current Wrangler configuration
- current static asset output path
- local development command
- production deployment command

Do not replace a working deployment architecture solely to match examples in these documents.

### 2. Merge durable Codex guidance

Merge the important rules in `AGENTS_DATA_SECTION.md` into the existing root `AGENTS.md`.

Keep `AGENTS.md` concise and point to deeper docs rather than copying all detail into it.

### 3. Add data directories

Create, if absent:

```text
data/raw/
data/processed/
data/sources/
public/data/
scripts/data/
```

Add placeholder `.gitkeep` files only if the repository needs them.

### 4. Update `.gitignore`

Ignore large or local working data by default.

Implemented rules (READMEs keep the directories present without placeholders):

```gitignore
# Local/raw data working files
/data/raw/*
!/data/raw/README.md

# Reproducible intermediate data
/data/processed/*
!/data/processed/README.md
```

Do not ignore `data/sources/` or `public/data/` globally.

Preserve existing ignore rules.

### 5. Add source and metadata conventions

Create a short README in each data directory if that makes the structure clearer.

Document that:

- raw is local source material
- processed is intermediate output
- sources contains provenance notes
- public/data is public browser output

### 6. Add validation helpers only if useful now

Do not add a framework or dependency simply to validate empty folders.

If the repo already has a test or data validation approach, extend it.

Otherwise, defer generic validation code until the first real dataset gives us concrete schemas.

### 7. Align Pulse of Adelaide

Review `docs/exec-plans/active/002-pulse-of-adelaide.md` against the new data architecture.

Update the plan so its first implementation defaults to:

- public data only
- static processed browser data for V1
- a documented source note
- reproducible processing
- metadata output
- D1/R2/KV only after a measured need

Do not invent a public fuel dataset. If a source is still unresolved, leave it as an explicit research blocker.

### 8. Update documentation indexes

Add the new data documents to the existing docs index or architecture links.

### 9. Validate

Run the repository's documented checks and at minimum:

```text
npm run build
```

If a formatter or typecheck already exists, run it as well.

### 10. Report

Report:

- files changed
- final data folder structure
- `.gitignore` changes
- any changes to the Pulse plan
- build/test results
- unresolved questions

Do not commit or push unless explicitly instructed by the user.

## Completion criteria

The task is complete when:

- Codex has durable data rules in repo guidance
- static public datasets have a clear home
- raw and intermediate data have a clear non-public home
- provenance and metadata conventions are documented
- the first fuel project follows the same contract
- no Cloudflare database or object store has been added without a concrete need
- local development remains functional
- production build passes
