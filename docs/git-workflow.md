# Git Workflow

## Source of truth

GitHub is authoritative for committed work. The current working tree is authoritative for reviewed but uncommitted work. Uploaded source archives are time-stamped snapshots.

Start each implementation task with:

```bash
git status --short --branch
git log -1 --oneline
git fetch origin
```

Compare the working branch with its upstream before editing. Do not pull, switch, rebase or apply a ZIP across unrelated uncommitted changes. See [change package workflow](change-package-workflow.md) for ChatGPT Project updates.

## Branch

Production uses:

```text
main
```

For small changes, direct work on `main` is acceptable when the user is working locally and reviewing changes.

For substantial new projects, redesigns or risky changes, create `codex/<project-slug>` before implementation unless the user requests another branch. Local review and iteration happen there so unfinished work cannot trigger the production deployment.

Do not merge or push to `main` until the user has reviewed a local release candidate and explicitly approved publication. Feature-branch commits and pushes also require explicit approval.

## Commits

Keep commits focused.

Good examples:

```text
Add reusable project content collection
Build LAB project page template
Add mobile timeline controls
Create fuel price preprocessing script
```

Avoid vague messages such as:

```text
updates
changes
fix stuff
```

## Before commit

Run:

```bash
git status
npm run build
```

Review the changed files.

For a project release, also confirm that the user has approved the release candidate. Prototype approval and release approval are separate decisions.

## Staging

Prefer staging only files related to the completed task.

Example:

```bash
git add src/pages/projects/[slug].astro src/content.config.ts src/content/projects/
```

Then:

```bash
git commit -m "Add reusable project content system"
git push origin main
```

## Codex completion reports

For each task, Codex should state:

- changed files
- build or tests run
- unresolved issues
- suggested commit message

Codex should not push unless explicitly asked.

For material work, also update `docs/current-handoff.md`. Record the branch, base commit, files changed, validation and next decision so later Codex and ChatGPT Project sessions can start from repository facts rather than chat memory.
