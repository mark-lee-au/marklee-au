# First Codex Session Prompt

Copy the text below into Codex after these documentation files are in the repository.

```text
Read the repository root AGENTS.md first, then read docs/index.md, docs/project-brief.md, docs/product-principles.md, docs/architecture.md, docs/project-status.md, and docs/exec-plans/active/001-foundation-project-system.md.

Inspect the existing Astro starter before making changes.

Your task is to implement Execution Plan 001: Foundation Project System.

Do not materially redesign the current site. Preserve the existing visual direction while replacing duplicated hard-coded project metadata with a reusable structured project system. Use current Astro APIs and verify any implementation assumptions against the installed Astro version and its local package types or current official documentation if web access is available.

Before editing, give me a concise implementation plan and list the files you expect to add or change. Then carry out the work.

At the end:
1. run npm run build
2. report all changed files
3. report any warnings or unresolved issues
4. update docs/project-status.md
5. give me a suggested Git commit message
6. do not push to GitHub unless I explicitly ask
```
