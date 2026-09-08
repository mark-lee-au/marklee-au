# Deployment Workflow

## Production

- Repository: GitHub
- Production branch: `main`
- Host: Cloudflare Pages
- Domain: `marklee.au`
- Build command: `npm run build`
- Output directory: `dist`

## Standard deployment

```text
local development
      |
      v
git commit
      |
      v
git push origin main
      |
      v
GitHub
      |
      v
Cloudflare Pages build
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

Do not change DNS or email-related records as part of normal website development.

## Domain and email separation

Cloudflare manages DNS and hosts the website.

VentraIP remains the email host.

Website development must not alter MX, SPF, DKIM, autodiscover, or autoconfig records unless the user explicitly requests an email infrastructure change.
