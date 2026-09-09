# Repository Map

## Application

| Path | Role | Change notes |
| --- | --- | --- |
| `src/pages/` | Astro routes and collection pages | Keep canonical project routes under `/projects/<slug>/`. |
| `src/components/` | Shared site shell and reusable cards | Project-specific behaviour should not leak here without a shared need. |
| `src/layouts/` | Shared page layouts | `ProjectLayout.astro` owns the common project page shell. |
| `src/content/projects/` | Project metadata and supporting copy | Frontmatter is validated by `src/content.config.ts`. |
| `src/visualisations/<slug>/` | Project-specific components, scripts and CSS | Preferred home for interactive project code. |
| `src/styles/global.css` | Shared visual system | Avoid project-specific rules here. |
| `public/data/<slug>/` | Public browser-ready datasets | Every file is internet-accessible. |
| `data/sources/` | Dataset provenance | Commit source, licence, retrieval and limitation notes. |
| `data/raw/` | Local source downloads | Ignored except for its README. Never package private inputs. |
| `data/processed/` | Reproducible intermediate data | Ignored except for its README. |
| `scripts/data/<slug>/` | Data acquisition and processing | Prefer deterministic scripts. |

## Documentation

| Path | Role | Update trigger |
| --- | --- | --- |
| `AGENTS.md` | Repository-wide rules for coding agents | Durable workflow or engineering rule changes. |
| `PROJECT_INSTRUCTIONS.md` | ChatGPT Project behaviour and output contract | Project-level working rules change. |
| `docs/current-handoff.md` | Short current working state | Every material implementation or decision handoff. |
| `docs/project-status.md` | Site-wide milestone state | Major releases or priority changes. |
| `docs/exec-plans/active/` | Detailed active project plans and review logs | Each approved project stage or iteration. |
| `docs/decisions/` | Durable architecture decisions | A choice changes the technical direction. |
| `docs/checklists/` | Release gates | Release requirements change. |

## Generated and local-only paths

Never put these in an update ZIP or project context unless a specific diagnostic task needs a small named file:

- `.git/`
- `node_modules/`
- `.astro/`
- `dist/`
- `.wrangler/`
- `.env*`
- `.dev.vars*`
- ignored raw or intermediate data

## Current project routing

Project metadata comes from `src/content/projects/*.md`. The dynamic route in `src/pages/projects/[slug].astro` renders common content and mounts project-specific visuals. Category pages filter the shared collection for DATA, MAPS, GAMES and LAB.

Do not create a second registry or hard-code duplicate cards unless the current architecture cannot support a measured requirement.
