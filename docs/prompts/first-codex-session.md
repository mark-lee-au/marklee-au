# Codex Session Prompt

Paste this into a new Codex chat, then add the specific task below it.

```text
Read AGENTS.md, docs/current-handoff.md and docs/index.md before changing files. Read the active execution plan and any topic-specific documents linked from the index that apply to this task.

Inspect the repository itself. Run git status --short --branch and git log -1 --oneline. If remote access is available, fetch origin and compare the current branch with its upstream. Report the branch, base commit, existing dirty state and exact paths you intend to change before editing.

Treat all existing uncommitted files as user work. Do not discard, reset, replace or reformat unrelated changes. Stop and ask if this task overlaps unclear work from another session.

Keep the task to the requested stage or revision set. Update docs/current-handoff.md after a material implementation or decision change. Run focused checks during review work and npm run build before handing over normal application changes.

At the end, report changed files, checks run, checks not run, unresolved issues and a suggested commit message. Do not commit, push, merge, deploy or change Cloudflare, DNS or email settings unless I explicitly request that exact action.
```
