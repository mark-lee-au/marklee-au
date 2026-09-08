# Git Workflow

## Branch

Production uses:

```text
main
```

For small changes, direct work on `main` is acceptable when the user is working locally and reviewing changes.

For larger or risky changes, use a feature branch if requested.

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
