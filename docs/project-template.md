# Project Template

Use this structure as a default, then simplify when a small LAB project does not need every section.

## Adding a project

1. Add a Markdown file under `src/content/projects/` with the frontmatter below and the relevant body sections.
2. Use a unique lowercase, hyphenated `slug`. It defines `/projects/<slug>/` independently of category and filename.
3. Start concepts in `category: lab` with `status: idea` (shown as PLANNED) or `prototype`. Set `featured: true` to show the card on the homepage.
4. Run `npm run build` and check the project and collection pages with `npm run dev`.

No manual route or card entry is required. All collection entries are publicly generated, including ideas and archived work. Keep unpublished notes in `docs/`.

## Metadata

```yaml
title: Project title
slug: project-slug
category: lab
status: published
featured: false
publishedDate: YYYY-MM-DD
updatedDate: YYYY-MM-DD
summary: One sentence for cards and sharing.
question: The question this project investigates.
tags:
  - mapping
  - transport
sortOrder: 100
# Optional local image path, relative to this Markdown file:
# previewImage: ./project-preview.jpg
# previewAlt: A concise description of the preview.
# Optional verified attribution and project source code:
# sources:
#   - name: Dataset publisher
#     url: https://example.org/dataset
# repositoryUrl: https://github.com/owner/repository
```

The schema is in `src/content.config.ts`. Category values are `data`, `maps`, and `lab`; statuses are `idea`, `prototype`, `published`, and `archived`. `featured` defaults to false, `sortOrder` to 100, and tags/sources to empty lists. Ordering is ascending `sortOrder`, then slug.

Dates are optional: omit them for ideas without a publication or update date. Provided dates appear on the detail page using Australian date formatting. Provide real attribution only after confirming the source; explain pending data research in the body for planned work.

Promotion changes `category` and, where appropriate, `status`; keep the slug unchanged. The existing URL, cards and canonical link continue to work.

The shared layout renders the title, question and optional preview before the Markdown body, followed by source links, dates and tags. Body content should start at `##` because the layout supplies the page's `h1`. A future interactive project can pass a component to the layout's named `visual` slot from the project route, keeping its metadata in the collection.

## Hero

### Title

Short project title.

### Question

One clear line describing what is being investigated.

### Main visual

Place the primary interactive or static visual here.

## What you are looking at

Two to four short paragraphs at most.

Explain:

- what each major visual element represents
- how to interact with it
- any important limitations needed before interpretation

## Findings

List a small number of observations supported by the data.

Example:

1. Finding one
2. Finding two
3. Finding three

## Data

Complete the [data project contract](data-project-contract.md) in the execution plan, keep provenance in `data/sources/<project-slug>.md`, and use [the data release checklist](checklists/data-release.md) before publishing. Default to approved static files and metadata under `public/data/<project-slug>/`. Project frontmatter source links complement the full dataset provenance; they do not replace it.

Include:

- source name
- source URL
- period covered
- download or access date where useful
- licence or usage information where relevant
- known gaps

## Method

Briefly explain:

- cleaning
- filtering
- aggregation
- derived fields
- geographic transformations
- assumptions

Do not dump implementation details that do not help a reader understand the analysis.

## Tools

Example:

- Python
- pandas
- Astro
- D3
- MapLibre GL JS

## Project links

Optional:

- GitHub source
- original dataset
- related article or documentation

## Last updated

Show this clearly for live or frequently changing projects.
