# Import These Docs Into marklee.au

This ZIP is designed to be copied into the root of the existing `marklee-au` repository.

## Resulting structure

After copying, the repository should contain:

```text
marklee-au/
|-- AGENTS.md
|-- CODEX_START_HERE.md
|-- README_IMPORT.md
|-- docs/
|   |-- index.md
|   |-- project-brief.md
|   |-- product-principles.md
|   |-- architecture.md
|   |-- design-system.md
|   |-- project-lifecycle.md
|   |-- project-template.md
|   |-- data-guidelines.md
|   |-- accessibility-performance.md
|   |-- deployment-workflow.md
|   |-- git-workflow.md
|   |-- roadmap.md
|   |-- backlog.md
|   |-- project-status.md
|   |-- decisions/
|   |-- exec-plans/
|   |-- prompts/
|   `-- checklists/
|-- src/
|-- public/
|-- package.json
`-- ...
```

## Copy steps

1. Download and extract this ZIP.
2. Open the extracted folder.
3. Copy `AGENTS.md`, `CODEX_START_HERE.md`, `README_IMPORT.md`, and the entire `docs` folder.
4. Paste them into the root of your local `marklee-au` repository.
5. If Windows asks to merge folders, allow it.
6. Open the repository in VS Code.
7. Run:

```powershell
git status
```

8. Confirm the new documentation files are listed.
9. Open `CODEX_START_HERE.md`.
10. Open the project in Codex.
11. Paste the prompt from `docs/prompts/first-codex-session.md` into Codex.

## Optional first documentation commit

After reviewing the files:

```powershell
git add AGENTS.md CODEX_START_HERE.md README_IMPORT.md docs/
git commit -m "Add Codex project documentation"
git push origin main
```

Do not run the push while DNS propagation is pending unless you are comfortable with Cloudflare automatically deploying the documentation-only repository change. The Markdown files do not affect the public Astro site unless imported by site code.
