# Architecture

## Current architecture

```text
Browser
  |
  v
Existing Cloudflare Worker hosting
  |
  v
Static Astro site
  |
  +-- HTML
  +-- CSS
  +-- project-specific JavaScript
  +-- static processed datasets
```

GitHub is the source repository, with `main` as the production branch. Astro builds static output into `dist/`; there is no Cloudflare adapter, Wrangler configuration, Worker source or storage binding in this checkout. The user confirms a working Worker deployment. Earlier Pages assumptions and unverified deployment triggers are clarified in [deployment workflow](deployment-workflow.md); preserve the externally configured deployment.

## Architectural direction

Keep the base site static. Add dynamic infrastructure only when a specific project needs it.

A project that needs regularly refreshed public data may later use a scheduled data pipeline or server-side Worker logic, but only after its requirements and source terms are established.

## Intended repository structure

The repository contains the project content system described below and the data foundation directories. Visualisation and project-specific asset directories are added when needed.

As the site grows, prefer the following structure:

```text
marklee-au/
|-- AGENTS.md
|-- README.md
|-- astro.config.mjs
|-- package.json
|-- tsconfig.json
|-- data/
|   |-- raw/          # ignored local downloads, except README.md
|   |-- processed/    # ignored intermediate outputs, except README.md
|   `-- sources/      # committed provenance notes
|-- public/
|   |-- data/
|   |-- images/
|   `-- project-assets/
|-- scripts/
|   `-- data/
|       `-- <project-slug>/  # add with the first pipeline
|-- src/
|   |-- components/
|   |-- content/
|   |   `-- projects/
|   |-- layouts/
|   |-- pages/
|   |-- styles/
|   `-- visualisations/
|       `-- <project-name>/
`-- docs/
```

The data foundation directories contain short READMEs. Other proposed directories should be added only as required. Every file in `public/` is a public website asset.

## Project metadata

Project metadata lives in Markdown frontmatter under `src/content/projects/`, validated by `src/content.config.ts`. The collection uses Astro's Content Layer `glob()` loader. This implementation was verified against installed Astro 7.3.1, including its local content types, slug handling and `render()` API.

Implemented fields:

```text
slug
title
summary
question
category
status
featured
publishedDate
updatedDate
tags
sortOrder
previewImage
previewAlt
sources
repositoryUrl
```

Category values:

```text
data
maps
lab
```

Status values:

```text
idea
prototype
published
archived
```

A project can move from category `lab` to `data` or `maps` without changing its URL unless there is a strong reason.

`src/lib/projects.ts` provides collection types, status labels, stable URLs and deterministic ordering (`sortOrder` ascending, then slug). `idea` displays as PLANNED. All entries are public, including ideas and archived projects; status describes maturity, not draft visibility. Keep private or unpublished ideas in `docs/backlog.md` instead. Only entries with `featured: true` appear on the homepage.

`ProjectListing.astro` filters the shared collection by category, while `ProjectCard.astro` takes a complete collection entry. The three starter concepts are LAB ideas. DATA and MAPS remain empty until work is ready for promotion.

Dates, preview images and source information are optional. Planned concepts omit publication dates and source citations until those are established. `sources` pairs each name with an HTTP(S) URL. `previewImage` uses Astro's local image schema and `Image` component; cards retain the starter orbit artwork when it is absent.

## Routing

Prefer stable project URLs such as:

```text
/projects/pulse-of-adelaide/
/projects/adelaide-in-motion/
```

Do not put the category in the canonical project URL. This allows promotion from LAB to MAPS or DATA without breaking links.

Category pages filter project metadata rather than owning separate copies of project content.

`src/pages/projects/[slug].astro` builds every project from its frontmatter `slug` and renders its Markdown with `render(entry)`. `ProjectLayout.astro` supplies the page shell, canonical link, title/question, optional preview, content and optional source/date metadata. A named `visual` slot allows future project components to sit above the supporting text. Keep slugs unique and unchanged when changing category, status, title or filename.

See [`project-template.md`](project-template.md) for authoring instructions. No extra dependency or client-side JavaScript is needed for this foundation.

## Visualisation boundaries

Project-specific visualisation code should not leak into the site shell.

Recommended pattern:

```text
src/visualisations/pulse-of-adelaide/
  index.ts
  types.ts
  controls.ts
  styles.css
```

Small projects may use fewer files.

## Data processing

Prefer:

```text
permitted source -> data/raw/<project-slug>/
      |
      v
scripts/data/<project-slug>/ -> data/processed/<project-slug>/
      |
      v
public/data/<project-slug>/ (compact exports and metadata)
      |
      v
browser visualisation
```

Do not send large raw source datasets to every visitor if the browser only needs a small derived result.

Record provenance in `data/sources/<project-slug>.md`. Static exports are the default; D1, R2 and KV require a measured need and a documented decision first. See [data architecture](data-architecture.md), [governance](data-governance.md), [project contract](data-project-contract.md) and [data release checklist](checklists/data-release.md).

## Secrets

Never place secrets in:

- `public/`
- client-side JavaScript
- committed data files
- Markdown documentation

Use local environment variables and Cloudflare environment configuration if a future project needs protected credentials.
