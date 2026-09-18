# Pulse of Adelaide: local event playback

The active Pulse page reads `public/data/pulse-of-adelaide/events/index.json`, its month/fuel partitions, and a generated full-history summary. Generate those local, ignored files from the user's corrected SA station lookup and Parquet history. Unlike the previous daily importer, this exporter retains each distinct intraday record, original timestamp text, duplicate count and a prior observation per station when one exists in the preceding 48 hours. Prices are carried forward only for playback; unknown stations have no displayed price. No interpolation or causal links.

## Full-history month-range prototype, 2026-09-18

After your **full** R export is copied into `public/data/pulse-of-adelaide/events/`, build an archive summary from the existing monthly JSON files. No second Parquet scan, external library or raw-data inclusion is needed:

```powershell
node scripts/data/pulse-of-adelaide/build_archive_summary.mjs
npm run dev
```

The generator writes `events/summary/FUEL.json` for each fuel in the index. Each summary contains every historical hourly mean/known-station count, month boundaries and a cumulative station-state checkpoint at each month start. It processes one event file at a time, keeping the previous latest reported price across consecutive months rather than dropping stations that were last reported more than 48 hours ago. Missing months show gaps in the chart; station prices remain unobserved until an actual report or a valid prior seed. For playback and manual scrubbing, the browser downloads only the needed month, retaining at most three monthly event files in memory. The default chart and playback interval cover the **entire available archive** for the selected fuel; the History popover chooses a contiguous start and end month and zooms the chart to that span. The A/B chart drag still selects a narrower playback interval within the displayed months.

If you replace any monthly export or its index, rerun this command before previewing or publishing. The site reports a missing or index-incompatible archive summary instead of silently falling back to February test data. The `events/` directory, including generated summaries, is not included in code patch ZIPs. Its contents are publicly accessible if present under `public/` during deployment, even when Git-ignored. Review the historical data's origin and redistribution rights before publication. Playback across a month boundary may pause briefly while the next static partition downloads; timestamp timezone interpretation remains provisional.

For a February-only model check, run this from the repository root in PowerShell:

```powershell
Rscript scripts/data/pulse-of-adelaide/build_event_playback.R --model 'C:\Users\Rush\Documents\pulse_feb2024_model.rds'
node scripts/data/pulse-of-adelaide/build_archive_summary.mjs
npm run dev
```

Open `http://localhost:4321/projects/pulse-of-adelaide/`. This gives the February 1 to 15, 2024 local proof of concept, using the real 295 reporting stations in that model. The RDS is never included in the ZIP or committed.

For the current full-history export, use the user's existing local `netwatch_pulse_export.csv` lookup (prepared from `netwatch_16092026.csv` with `Site.Id`, `Site.Name`, `Region.1` and `Region.2` column names), or another lookup with the same expected columns. To regenerate from the original Parquet, run one month/fuel or all months and grades from PowerShell in the repository root:

```powershell
Rscript scripts/data/pulse-of-adelaide/build_event_playback.R --parquet 'C:\Users\Rush\Documents\fuel_price_history.parquet' --stations 'C:\Users\Rush\Documents\netwatch_pulse_export.csv' --month 2024-02 --fuel ULP
Rscript scripts/data/pulse-of-adelaide/build_event_playback.R --parquet 'C:\Users\Rush\Documents\fuel_price_history.parquet' --stations 'C:\Users\Rush\Documents\netwatch_pulse_export.csv' --all
```

The full export runs locally, scans one UTC calendar month plus a 48-hour lookback at a time and can take considerable time on 35 million source records. The browser fetches a compact all-history summary and just the month needed for playback. The first partition uses its own 48-hour seed; the summary checkpoints carry valid older known states forward across subsequent months. The chart uses an unweighted arithmetic mean of the latest recorded prices among stations with a known price; it is not an observed citywide average and it does not estimate prices for missing stations. All price changes, including immediate reversals, are retained. Repeated observations refresh the last-observed time and do not create a pulse. The 1× setting retains its existing restrained historical playback rate.

`TRANSACTIONDATE` was formatted as text and suffixed with `Z` in the original SQL, without proving its original timezone. The event exporter intentionally leaves that timestamp unchanged at the user's request. Adelaide display times and month boundaries are therefore provisional until the source timezone is verified. Station coordinates from `netwatch_data` are filtered to Adelaide region and a broad metro box; current Active/Closed status is not used to exclude historical stations.

**Data release review.** The user reports having collated the history personally and needing no attribution. The underlying source's redistribution terms and timestamp basis have not been independently checked in this code patch. All files under `public/`, even ignored ones, enter Astro builds and deployments; approve the event export before publishing it. The old local `history/` browser export and `history-preview.json` are no longer read by the active page and may be deleted separately. No SA Government Direct API integration is used.


## Rebuild the public static geography

Roads and coastline are independent public reference data, not part of the private historical fuel archive. They are already bundled under `public/data/pulse-of-adelaide/geography/` and need **no runtime geographic API requests**. To rebuild, install `pyshp` and `shapely` and provide the original Geofabrik SA free shapefile ZIP plus NOAA GSHHG intermediate-resolution data and metadata files (available through the Basemap data package):

```powershell
python -m pip install pyshp shapely
python scripts/data/pulse-of-adelaide/build_static_geography.py --roads-zip 'C:\path\to\south-australia-260916-free.shp.zip' --gshhs-data 'C:\path\to\gshhs_i.dat' --gshhs-meta 'C:\path\to\gshhsmeta_i.dat'
```

The script processes 31,284 road records in the requested motorway/trunk/primary/secondary/tertiary classes (including links) and writes adaptive road partitions, a state overview and a coastline extending into WA and Victoria. See `data/sources/pulse-of-adelaide.md` and geography `metadata.json` for limitations and ODbL/LGPL attribution. Do not put source ZIPs or private fuel data under `public/`. The repository `.gitignore` exception permits only the public `geography/` folder; local `events/` remains blocked.

### Solid land overlay for the Pulse title

After building and trimming `coast.geojson`, run `python scripts/data/pulse-of-adelaide/build_land_overlay.py` from the repository root. It creates the small public `land.geojson` from the same GSHHG intermediate-resolution mainland shoreline, validates the coast endpoints and known land/sea reference points, and clips inland closure geometry to a bounded WGS84 extent. The inland closure is not shown as an additional shoreline. MapLibre renders the land as a static fill, with roads above it. Do not regenerate the fill from detached shoreline fragments or fill an open SVG path. A higher-resolution, properly licensed coastal polygon would be needed to resolve all harbour-level differences against OpenStreetMap roads.

### Refresh the Adelaide harbour land correction

`land.geojson` is a GSHHG-derived statewide land polygon corrected using water and riverbank polygons from the same September 2026 Geofabrik extract as the roads. After rebuilding `coast.geojson`, run:

```powershell
python scripts/data/pulse-of-adelaide/build_land_overlay.py --roads-zip 'C:\path\to\south-australia-260916-free.shp.zip'
```

This writes `land.geojson` and `harbour-water.geojson`. Keep them together. The script does not reconstruct a complete OSM ocean coastline and does not transform road coordinates. Any future regeneration of static coastline files must rerun this command, or the older coast and harbour correction will disagree.
