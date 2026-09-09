# Codex Start Here

Use this file when opening or resuming the repository in Codex.

## Start every Codex task

1. Open the real repository working directory, not an extracted source snapshot.
2. Read `AGENTS.md`, `docs/current-handoff.md` and `docs/index.md`.
3. Read the active execution plan related to the task.
4. Run `git status --short --branch` and `git log -1 --oneline`.
5. If network access is available, run `git fetch origin` and compare the working branch with its upstream.
6. Report the branch, base commit, existing dirty state and intended file paths before editing.

Do not discard uncommitted files applied from ChatGPT, created by the user or left by another Codex task. Stop if the requested work overlaps them and the intended merge is unclear.

## Recommended prompt

Use `docs/prompts/first-codex-session.md` for a new Codex chat. Add the exact task and its scope after the supplied text.

## Local review

For application changes:

```bash
npm run dev
```

Use the affected local route for focused review. Run `npm run build` before handing over a normal code change. Larger release checks begin only after the user asks for a release candidate.

## ChatGPT Project updates

Files extracted from a ChatGPT update ZIP are user changes. Inspect them with Git and preserve them. See `PROJECT_SETUP.md` and `docs/change-package-workflow.md`.

## Commit and publication

Do not commit or push without an explicit request. A local prototype approval does not authorise publication. When the user asks to publish, stage only approved files and follow `docs/deployment-workflow.md`.
