# Architecture

## Current architecture

```text
Browser
  |
  v
Cloudflare Pages
  |
  v
Static Astro site
  |
  +-- HTML
  +-- CSS
  +-- project-specific JavaScript
  +-- static processed datasets
```

GitHub is the source repository. Pushes to `main` trigger the production Cloudflare Pages build.

## Architectural direction

Keep the base site static. Add dynamic infrastructure only when a specific project needs it.

A project that needs regularly refreshed public data may later use a small scheduled data pipeline or Cloudflare Worker, but that should be introduced per requirement.

## Intended repository structure

The starter repository currently contains `src/pages`, `src/components`, and `src/styles`.

As the site grows, prefer the following structure:

```text
marklee-au/
|-- AGENTS.md
|-- README.md
|-- astro.config.mjs
|-- package.json
|-- tsconfig.json
|-- public/
|   |-- data/
|   |-- images/
|   `-- project-assets/
|-- scripts/
|   `-- <project-name>/
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

Do not create empty directories only to match this diagram. Add them as required.

## Project metadata

Once the portfolio has several projects, project metadata should use an Astro content collection or another single structured source rather than hard-coded duplicate lists on DATA, MAPS, LAB, and the homepage.

Suggested fields:

```text
slug
title
shortTitle
summary
question
category
status
featured
publishedDate
updatedDate
tags
heroType
heroAsset
sourceNames
sourceUrls
repositoryUrl
```

Category values:

```text
data
maps
lab
```

Suggested status values:

```text
idea
prototype
published
archived
```

A project can move from category `lab` to `data` or `maps` without changing its URL unless there is a strong reason.

## Routing

Prefer stable project URLs such as:

```text
/projects/pulse-of-adelaide/
/projects/adelaide-in-motion/
```

Do not put the category in the canonical project URL. This allows promotion from LAB to MAPS or DATA without breaking links.

Category pages filter project metadata rather than owning separate copies of project content.

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
raw external data
      |
      v
Python or Node preprocessing
      |
      v
compact derived dataset
      |
      v
browser visualisation
```

Do not send large raw source datasets to every visitor if the browser only needs a small derived result.

## Secrets

Never place secrets in:

- `public/`
- client-side JavaScript
- committed data files
- Markdown documentation

Use local environment variables and Cloudflare environment configuration if a future project needs protected credentials.
