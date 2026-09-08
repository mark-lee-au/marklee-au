# Decision 0001: Core Stack

Status: accepted

## Decision

Use:

- Astro for the website
- TypeScript for project scripting where useful
- plain CSS for the core site styling
- Cloudflare for production hosting; the working deployment is a Worker serving the static site (see clarification below)
- GitHub for source control
- static generation by default

Add visualisation libraries per project rather than globally by default.

Hosting clarification (2026-09-08): the original decision assumed Pages, but the user confirms an existing Worker deployment. The repository produces static `dist/` output and has no adapter, Wrangler configuration or Worker source. Preserve the working setup; externally managed deployment commands remain unverified. See [deployment workflow](../deployment-workflow.md).

Preferred options:

- D3
- MapLibre GL JS
- Observable Plot
- Motion
- deck.gl
- Three.js

## Constraints

Do not introduce a database, CMS, full client framework, or backend without a concrete need.

## Repository model

As the project catalogue grows, use structured project metadata, preferably an Astro content collection, to prevent duplicated project definitions across pages.

## URL model

Project URLs should remain independent of category:

```text
/projects/<slug>/
```

This supports promotion from LAB to DATA or MAPS without changing links.
