# marklee.au data portfolio starter

Astro starter for a personal data visualisation portfolio.

## Local setup

```bash
npm install
npm run dev
```

Open http://localhost:4321

## Production build

```bash
npm run build
npm run preview
```

The static production output is written to `dist/`.

## Cloudflare deployment

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

The existing host is a Cloudflare Worker. This checkout builds static assets and has no adapter, Wrangler config or deploy command. Preserve the externally configured deployment; see [deployment workflow](docs/deployment-workflow.md) for the correction to the starter's earlier Pages assumption.

## Data foundation

Visualisations default to approved static browser data under `public/data/<project-slug>/`. Every file under `public/` is publicly accessible. Keep ignored downloads in `data/raw/`, ignored intermediates in `data/processed/`, committed provenance in `data/sources/`, and processing scripts in `scripts/data/`. No real datasets or Cloudflare storage resources have been added.

See [data architecture](docs/data-architecture.md), [data governance](docs/data-governance.md) and [project status](docs/project-status.md). Fuel-source research for Pulse of Adelaide remains unresolved.

## Main files

- `src/pages/index.astro` homepage
- `src/pages/data.astro` DATA collection
- `src/pages/maps.astro` MAPS collection
- `src/pages/lab.astro` LAB collection
- `src/pages/about.astro` about page
- `src/components/` reusable site components
- `src/styles/global.css` site styling
- `public/` static files
