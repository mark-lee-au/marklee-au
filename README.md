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

## Cloudflare Pages settings

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

## Main files

- `src/pages/index.astro` homepage
- `src/pages/data.astro` DATA collection
- `src/pages/maps.astro` MAPS collection
- `src/pages/lab.astro` LAB collection
- `src/pages/about.astro` about page
- `src/components/` reusable site components
- `src/styles/global.css` site styling
- `public/` static files
