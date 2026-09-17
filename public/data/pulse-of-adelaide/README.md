# Historical browser data (local only)

Run `scripts/data/pulse-of-adelaide/build_history_browser.py --archive <private-corrected-archive>` from the repository root to generate ignored `history/index.json` and `history/YYYY-MM/FUEL.json` files. The historical page fetches the index and only the chosen month/fuel file. It does not use `history-preview.json`, the SA Government API, or an API token.

The generated files are ignored by Git but **will be copied into every Astro build**. Keep them local until the historical provider's publication rights are resolved and publication is expressly approved. Remove the local `history/` directory and old `history-preview.json` before any unrelated deployment. No data is supplied in the patch ZIP.
