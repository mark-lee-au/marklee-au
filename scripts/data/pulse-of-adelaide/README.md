# Pulse of Adelaide: local event playback

The active Pulse page reads `public/data/pulse-of-adelaide/events/index.json` and its month/fuel partitions. Generate those local, ignored files from the user's corrected SA station lookup and Parquet history. Unlike the previous daily importer, this exporter retains each distinct intraday record, original timestamp text, duplicate count and a prior observation per station when one exists in the preceding 48 hours. Prices are carried forward only for playback; unknown stations have no displayed price. No interpolation or causal links.

From the repository root in PowerShell, run this first with the February model already produced in R:

```powershell
Rscript scripts/data/pulse-of-adelaide/build_event_playback.R --model 'C:\Users\Rush\Documents\pulse_feb2024_model.rds'
npm run dev
```

Open `http://localhost:4321/projects/pulse-of-adelaide/`. This gives the February 1 to 15, 2024 local proof of concept, using the real 295 reporting stations in that model. The RDS is never included in the ZIP or committed.

To export from the original Parquet, first save the corrected `netwatch_data` from the R session as a private CSV:

```r
write.csv(netwatch_data, 'C:/Users/Rush/Documents/netwatch_sa_corrected.csv', row.names = FALSE)
```

Then run one month/fuel, or all available months and grades, from PowerShell in the repository root:

```powershell
Rscript scripts/data/pulse-of-adelaide/build_event_playback.R --parquet 'C:\Users\Rush\Documents\fuel_price_history.parquet' --stations 'C:\Users\Rush\Documents\netwatch_sa_corrected.csv' --month 2024-02 --fuel ULP
Rscript scripts/data/pulse-of-adelaide/build_event_playback.R --parquet 'C:\Users\Rush\Documents\fuel_price_history.parquet' --stations 'C:\Users\Rush\Documents\netwatch_sa_corrected.csv' --all
```

The full export runs locally, scans one UTC calendar month plus a 48-hour lookback at a time and can take considerable time on 35 million source records. The browser fetches just the chosen month and fuel; no all-history browser download. A station last recorded earlier than the 48-hour lookback begins as unknown until a new observation. The chart uses an unweighted arithmetic mean of the latest recorded prices among stations with a known price; it is not an observed citywide average and it does not estimate prices for missing stations. All price changes, including immediate reversals, are retained. Repeated observations refresh the last-observed time and do not create a pulse. The 1× setting advances one historical hour in approximately 1.4 seconds.

`TRANSACTIONDATE` was formatted as text and suffixed with `Z` in the original SQL, without proving its original timezone. The event exporter intentionally leaves that timestamp unchanged at the user's request. Adelaide display times and month boundaries are therefore provisional until the source timezone is verified. Station coordinates from `netwatch_data` are filtered to Adelaide region and a broad metro box; current Active/Closed status is not used to exclude historical stations.

**Local only.** The historical source owner and reuse rights remain unverified. All files under `public/`, even ignored ones, enter Astro builds and deployments. Do not publish or deploy the generated `events/` files until rights and the archive time basis are reviewed. The old local `history/` browser export and `history-preview.json` are no longer read by the active page and may be deleted separately. No SA Government Direct API integration is used.


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
