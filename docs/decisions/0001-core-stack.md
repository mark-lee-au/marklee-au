# Decision 0001: Core Stack

Status: accepted

## Decision

Use:

- Astro for the website
- TypeScript for project scripting where useful
- plain CSS for the core site styling
- Cloudflare Pages for production hosting
- GitHub for source control
- static generation by default

Add visualisation libraries per project rather than globally by default.

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
