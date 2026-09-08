# Deployment Workflow

## Production

- Repository: GitHub
- Production branch: `main`
- Host: existing Cloudflare Worker deployment (confirmed by the user)
- Domain: `marklee.au`
- Build command: `npm run build`
- Output directory: `dist`

## Verified repository configuration (2026-09-08)

`package.json` declares Astro `^7.1.6`; the lockfile and installed package resolve to `7.3.1`. `astro.config.mjs` sets only `site: 'https://marklee.au'`, leaving Astro's static output and `dist/` defaults in place. There is no Cloudflare adapter, Worker source, Wrangler configuration, deployment script, or CI workflow in this checkout. No D1, R2 or KV bindings are configured here.

The local commands are `npm run dev` (`astro dev`), `npm run build` (`astro build`) and `npm run preview` (`astro preview`). `.nvmrc` specifies Node `22.20.0`. Building copies `public/` assets into `dist/`; it does not deploy them.

Earlier repository documents assumed Cloudflare Pages. The user identifies the working host as a Cloudflare Worker. Preserve that deployment and the existing static build. The production deploy command, Worker asset configuration, and GitHub build trigger are managed outside this checkout and have not been independently verified. Inspect the existing Cloudflare project settings before any future deployment change; do not invent a Wrangler command or add an adapter to reconcile the old documentation.

## Standard deployment

```text
local development
      |
      v
authorised commit and push
      |
      v
GitHub production branch main
      |
      v
existing externally configured deployment
      |
      v
static dist/ assets served by Cloudflare Worker
      |
      v
marklee.au
```

## Before pushing

Run:

```bash
npm run build
```

If the change affects visible pages, also run:

```bash
npm run dev
```

and inspect the affected routes locally.

## Cloudflare configuration

The site should remain deployable as a static Astro build unless a later project explicitly requires server functionality.

Keep all of `public/` safe for unrestricted internet access, including documentation, source maps and other non-data files. Raw inputs and intermediate outputs belong outside it. No storage service is needed for static browser datasets.

Local development, preview and build currently have no Cloudflare resource bindings or ingestion commands. If a later project needs D1, R2 or KV, first document measured requirements, the storage decision and local setup in its execution plan. Default to isolated local resources; remote bindings or commands that mutate production data require an explicit task requirement and user approval. Keep local state and development secrets out of Git (`.wrangler/`, `.dev.vars*`, `.env*`).

Do not change DNS or email-related records as part of normal website development.

## Domain and email separation

Cloudflare manages DNS and hosts the website.

VentraIP remains the email host.

Website development must not alter MX, SPF, DKIM, autodiscover, or autoconfig records unless the user explicitly requests an email infrastructure change.
