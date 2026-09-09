# Import this data foundation into marklee-au

This pack adds durable data architecture guidance for Codex without replacing the existing project documentation.

Integration completed on 2026-09-08 in [Plan 003](docs/exec-plans/active/003-data-foundation.md). Root `AGENTS.md` now includes the durable rules. The following instructions are retained as import history; use [the documentation index](docs/index.md) for the current repository guidance.

## Copy into the repository

Copy these items into the root of `C:\Users\Rush\Documents\GitHub\marklee-au`:

- `AGENTS_DATA_SECTION.md`
- `docs/`

Do not replace the existing root `AGENTS.md` with `AGENTS_DATA_SECTION.md`. Codex will merge the section into the existing `AGENTS.md` as part of the alignment task.

## Start Codex

Open the `marklee-au` repository in Codex and paste the contents of:

`docs/prompts/align-data-foundation.md`

Codex should first inspect the repository, then merge these rules into the existing project structure.

## Expected result

After the alignment task, the repo should have a data structure similar to:

```text
data/
  raw/
  processed/
  sources/
public/
  data/
    <project-slug>/
scripts/
  data/
```

The exact structure may differ if Codex finds an existing equivalent that is cleaner.
