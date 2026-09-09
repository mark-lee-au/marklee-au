# Change Package Workflow

## Goal

A ChatGPT Project returns small update ZIPs that the user can extract into the repository root. Git still records, compares and publishes the result.

## Package contract

Each file-changing response must provide one ZIP with this shape:

```text
update.zip
|-- docs/current-handoff.md       # when material state changes
|-- src/...                       # only changed or new source files
|-- public/...                    # only changed or new public assets
`-- scripts/...                   # only changed or new scripts
```

The ZIP must not contain an enclosing `marklee-au/` directory. It must not contain `.git`, dependencies, generated output, local data or secrets.

Extraction can add or replace files. It cannot remove obsolete files. The response and handoff must list each deletion as a separate manual action.

## Before preparing a package

Record:

- source branch;
- full source commit;
- working-tree state stated in the uploaded snapshot;
- intended file paths;
- accepted task boundary.

If the task needs a file absent from the snapshot, request a new context export. Do not recreate an unseen current file from memory.

## Before applying a package

Run:

```powershell
git status --short --branch
git rev-parse HEAD
```

Compare the result with the package handoff. A commit mismatch does not always make the package unusable, but it requires a careful diff. A dirty tree with overlapping paths is a stop condition.

## After applying a package

Run:

```powershell
git status --short
git diff --stat
git diff
```

Then run the focused checks named in the handoff. Use `npm run build` for normal application changes. Do not commit before reviewing the diff.

## Concurrent changes

Use one of these patterns:

| Situation | Safe pattern |
| --- | --- |
| Codex and chat touch different files | Record disjoint path sets and use the same base commit. |
| Codex and chat may touch the same files | Finish one task, review it, then refresh the other tool's source snapshot. |
| Two larger tasks proceed together | Use separate Git branches or worktrees, then merge through Git. |
| A task starts from an old uploaded ZIP | Refresh the context before implementation. |

Do not use ZIP extraction as a merge strategy for overlapping edits.

## Commit and publication

Applying a package does not authorise a commit or publication. When the user asks to publish, stage only approved paths, build, commit with a focused message, push through the agreed branch flow and verify the existing Cloudflare deployment.
