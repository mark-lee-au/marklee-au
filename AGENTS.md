# Codex Instructions for marklee.au

## Purpose

This repository is a personal data portfolio for Mark Lee. It presents data as visual stories, maps, animations, interactive experiments, and small exploratory pieces.

The site must feel like a gallery of data work, not a dashboard product.

## Read before working

Before making changes, read:

1. `docs/index.md`
2. `docs/project-brief.md`
3. `docs/product-principles.md`
4. The relevant active plan in `docs/exec-plans/active/`
5. Any topic-specific document linked from `docs/index.md`

If the task conflicts with these documents, follow the user's latest explicit instruction and update the documentation if the change is durable.

## Current stack

- Astro
- TypeScript where scripting is needed
- Plain CSS for the site shell
- Static output by default
- Existing Cloudflare Worker hosting with static Astro output; see `docs/deployment-workflow.md`
- GitHub repository with production branch `main`
- Node version is defined by `.nvmrc`

Add libraries only when a project needs them.

Preferred visualisation tools:

- D3 for custom SVG and data-driven visuals
- MapLibre GL JS for interactive maps
- Observable Plot for conventional statistical charts
- Motion for interface animation
- deck.gl only for large geographic datasets
- Three.js only when a real 3D requirement exists

Do not add React, Vue, a database, a CMS, or server-side infrastructure unless a clear project requirement needs it.

## Product rules

- DATA contains finished data stories that are not primarily geographic.
- MAPS contains finished work where geography is central.
- LAB contains experiments, prototypes, small ideas, and work in progress.
- A LAB project may later be promoted into DATA or MAPS.
- Projects should lead with the visual and the question, not a long explanation.
- Avoid generic analytics-dashboard layouts.
- Keep the site shell restrained so individual projects can have their own visual identity.
- Use public or properly licensed data. Never use confidential employer data.
- Cite data sources and show a last-updated date when freshness matters.

## Coding rules

- Keep components small and understandable.
- Prefer Astro components for static UI.
- Keep client-side JavaScript limited to actual interactivity.
- Preprocess large datasets outside the browser where practical.
- Put reusable visualisation code under `src/visualisations/` when that directory exists.
- Put data preparation scripts under `scripts/` when that directory exists.
- Put static processed datasets under `public/data/` only when suitable for public download.
- Do not expose API keys or secrets in browser code.
- Use semantic HTML.
- Preserve responsive layouts.
- Respect `prefers-reduced-motion`.
- Support keyboard access for interactive controls.
- Do not rely on hover as the only way to reveal information.

## Data and visualisation rules

- Read `docs/data-architecture.md`, `docs/data-governance.md`, and `docs/data-project-contract.md` before changing pipelines, browser datasets, or Cloudflare storage.
- Default to preprocessed public static datasets. Add D1, R2, or KV only after measuring a project requirement and documenting the decision in its execution plan.
- Every file under `public/` is publicly accessible. Never put secrets, credentials, private or employer data, commercially sensitive data, or personal information there.
- Never use, infer, reconstruct, or approximate private employer fuel data. Fuel projects must use public or explicitly licensed sources with suitable reuse terms.
- Separate local raw data (`data/raw/`), intermediate outputs (`data/processed/`), provenance (`data/sources/`), and browser exports (`public/data/<project-slug>/`). Gitignore is not a security boundary.
- Prefer deterministic processing scripts in `scripts/data/`. Export only fields needed by the visual and measure browser payloads before adding infrastructure.
- Record source, licence, retrieval time, transformation method, date range, geography, and known limitations. Use `docs/checklists/data-release.md` for dataset releases.
- Local development must not mutate production D1, R2, or KV. Remote bindings require an explicit task requirement and user approval.
- Run documented validation and build commands after data code or browser dataset changes.

## Styling rules

- Default site shell is dark, minimal, and typography-led.
- Use a small neutral colour system for navigation and structure.
- Let each project define its own accent colours where the data calls for it.
- Avoid decorative gradients, glassmorphism, excessive shadows, and generic SaaS styling.
- Avoid visual clutter around the main data visual.
- Mobile layouts must be designed, not merely shrunk from desktop.

## Performance rules

- Static generation is preferred.
- Avoid shipping raw large datasets to the browser.
- Avoid loading visualisation libraries globally when only one project uses them.
- Lazy-load expensive interactive components when sensible.
- Keep animations frame-rate aware and pause work when off-screen where practical.
- Test project pages at narrow mobile widths.

## Validation

For any code change:

1. Run `npm run build`.
2. Fix build errors before completion.
3. If the task changes navigation, routes, or project cards, verify affected pages manually with `npm run dev` when possible.
4. If new tests or checks are later added to `package.json`, run the relevant commands too.

## Documentation maintenance

Update documentation when a change alters:

- architecture
- project lifecycle
- category rules
- data handling
- deployment workflow
- durable design conventions
- active roadmap status

Do not turn `AGENTS.md` into a long project encyclopedia. Put detailed information under `docs/` and link it from `docs/index.md`.

## Git behaviour

Do not commit or push unless the user explicitly asks.

At the end of a task, report:

- files changed
- tests or build commands run
- any unresolved issues
- suggested commit message

When useful, provide commands that stage only the files changed by the task.
