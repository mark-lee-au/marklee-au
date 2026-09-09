# ChatGPT Project Setup for marklee.au

## Purpose

This pack lets a ChatGPT Project help with small site changes, prototypes, design revisions, project ideas and documentation while GitHub and Codex continue to manage the working repository.

The ChatGPT Project does not automatically see newer Git commits or local Codex edits. Give it a fresh project-context ZIP at the start of a new work stream and after any overlapping change.

## Files to add to the ChatGPT Project

Upload these first:

1. `PROJECT_INSTRUCTIONS.md`
2. `docs/current-handoff.md`
3. `docs/index.md`
4. `docs/repository-map.md`
5. The execution plan for the active project
6. A fresh source context ZIP made with `scripts/export-project-context.ps1`

The source context ZIP already contains the tracked and relevant untracked repository files. You do not need to upload `node_modules`. `package.json` and `package-lock.json` provide the dependency record.

## Project instructions

Paste the full contents of `PROJECT_INSTRUCTIONS.md` into the ChatGPT Project instructions field. Keep `AGENTS.md` in the uploaded source context so repository-specific engineering rules remain available.

## Refresh the Project's source snapshot

The easiest option on Windows is to double-click this file in the repository root:

```text
archive-project.bat
```

It creates a versioned ZIP in a `marklee-au-archives` folder beside the repository. The filename records the local timestamp, branch, short commit and whether the working tree was clean or dirty, for example:

```text
marklee-au-context-20260910-091530-214-codex-ascend-random-mutations-e06a71e-dirty.zip
```

This gives you a local snapshot history even when you have not committed recent work. Upload the newest relevant ZIP to the ChatGPT Project when the Project needs a fresh view of your working tree. Older ZIPs can remain in the archive folder because it sits outside the repository and is never included in later snapshots.

You can run the underlying PowerShell script directly from the repository root instead:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export-project-context.ps1
```

The archive includes tracked files plus relevant untracked files. It excludes Git history, `node_modules`, `.astro`, `dist`, `.wrangler`, common cache/build folders, ZIP/archive files, environment-secret files and local raw/intermediate data. It adds `_PROJECT_SNAPSHOT.md` inside the ZIP with the branch, full commit, creation time and working-tree status.

Use a custom output path if needed:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export-project-context.ps1 -OutputPath "$env:USERPROFILE\Downloads\marklee-au-project-context.zip"
```

Or keep the automatic versioned filename but choose a different archive folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export-project-context.ps1 -ArchiveDirectory "$env:USERPROFILE\Documents\marklee-au-archives"
```

## Apply an update ZIP from a chat

Do not extract an update while Codex is editing the same files.

1. Ask the chat for its base branch, base commit, included files and deletion list.
2. In PowerShell, open the repository root and inspect your current state:

```powershell
git status --short --branch
git rev-parse HEAD
```

3. If the working tree contains unrelated changes or the base commit does not match, stop. Finish or preserve that work before applying the ZIP.
4. Extract the ZIP into the repository root:

```powershell
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\marklee-au-update.zip" -DestinationPath . -Force
```

5. Apply any listed deletions manually only after checking the exact paths.
6. Review what changed:

```powershell
git status --short
git diff --stat
git diff
```

7. Run the validation stated in the handoff. For normal source changes:

```powershell
npm run build
```

Do not copy `.git`, `node_modules`, `.astro`, `dist` or environment files from any update archive. A valid update ZIP from this workflow will not contain them.

## Return to Codex after manual changes

Codex can read the latest files directly if it opens the same working directory. Start the Codex task with:

```text
Read AGENTS.md, docs/current-handoff.md and the relevant active execution plan. Inspect git status before editing. The working tree may contain files applied from a ChatGPT update ZIP. Treat those files as user changes and do not discard them. Report the branch, base commit and intended file paths before making changes.
```

If Codex uses a separate clone or cloud checkout, commit and push the reviewed manual change first, or give Codex the same update ZIP. Do not assume separate checkouts share uncommitted files.

## Publication boundary

Applying a ZIP changes local files only. It does not publish the site. A later explicit publication request should trigger the documented build, targeted staging, commit, push and live verification steps in `docs/deployment-workflow.md`.
