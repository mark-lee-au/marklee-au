# Current Handoff

Snapshot date: 2026-09-10

## Repository state supplied to ChatGPT

- Working branch in the latest supplied source snapshot: `codex/ascend-random-mutations`.
- Base commit: `e06a71e57fe112a100d02f7cea35049bc0a82d26` (`Record Ascend prototype publication`).
- `origin/main` and local `main` pointed to `e06a71e` in that supplied snapshot.
- The supplied working tree contains uncommitted Ascend Genesis expansion work.
- Later ChatGPT change packages add the local archive helper and this publication helper. The repository itself remains the source of truth when the helper runs.
- Do not discard, reset or replace the current Ascend files before the approved checkpoint is committed.

## Current product state

- South Australian Name Curve is published in LAB.
- Formula Daily is published as a GAMES prototype.
- Ascend's earlier Genesis prototype is published as a GAMES prototype.
- A later Ascend Genesis expansion exists in the working tree on `codex/ascend-random-mutations` in the supplied snapshot.
- The user has now explicitly approved committing and publishing the complete current project checkpoint, including that Ascend expansion, before starting the next improvement round.
- Pulse of Adelaide remains blocked on a suitable public fuel source with confirmed reuse terms.

## Ascend checkpoint scope

The local Ascend expansion recorded in the supplied snapshot adds:

- seeded procedural cell phenotypes that persist for a run;
- lineage-preserving evolution visuals;
- a second adaptation choice at 60 lifetime Energy;
- a Complex Cell milestone at 120 lifetime Energy;
- queued update notices and saved evolution history;
- optional anatomy nodes and a `NODES` visibility control;
- save migration through version 4.

The detailed implementation and prior validation record is in `docs/exec-plans/active/006-ascend.md`.

## Local context archive utility

- `archive-project.bat` provides a double-click Windows launcher for project snapshots.
- `scripts/export-project-context.ps1` creates timestamped, branch/commit-labelled archives by default in `marklee-au-archives` beside the repository.
- Snapshots preserve relevant uncommitted files for ChatGPT review while excluding dependencies, Git metadata, generated output, secrets, local raw/intermediate data and prior archives.
- This workflow does not commit, push or publish anything.

## One-click publication helper

- `publish-project.bat` is the double-click Windows entry point and `scripts/publish-project.ps1` performs the guarded Git workflow.
- The helper shows current changes, asks for a commit message when needed, and asks for one explicit publication confirmation.
- After approval it creates a project archive when the archive helper is installed, fetches `origin`, verifies branch ancestry, runs `npm run build`, stages all current non-ignored changes, runs the staged whitespace check, commits, fast-forwards local `main`, and pushes `origin/main`.
- The helper refuses divergent branch history and never force-pushes. If remote `main` changes during the run, the normal Git push rejection remains a safety boundary.
- A successful Git push does not independently prove that the externally configured Cloudflare deployment completed. Check the existing Cloudflare deployment and live routes after the script finishes.

## Next action

1. Apply the publication-helper change package to the repository root.
2. Double-click `publish-project.bat` and review the displayed working-tree paths before approving publication.
3. Enter the checkpoint commit message or accept the provided default.
4. Allow the helper to build, commit, fast-forward `main`, and push `origin/main`.
5. Check the existing Cloudflare deployment and the live site.
6. Start substantial new work from the newly published `main` baseline on an appropriate feature branch.
