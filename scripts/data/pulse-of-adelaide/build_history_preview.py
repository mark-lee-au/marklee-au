"""Validate an SA-only historical archive and build one Adelaide month/fuel preview.

No network access or government API. Default output stays in ignored data/processed/.
--local-preview explicitly writes browser JSON to ignored public/ for LOCAL use only.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import sys
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[3]
ADELAIDE = ZoneInfo('Australia/Adelaide')


def load_json(path: Path) -> dict:
    if not path.is_file():
        raise ValueError(f'Missing input: {path}')
    value = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(value, dict):
        raise ValueError(f'Expected JSON object: {path}')
    return value


def utc(value: object) -> datetime:
    if not isinstance(value, str) or not value.endswith('Z'):
        raise ValueError(f'Expected an explicit UTC timestamp, got {value!r}')
    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if dt.tzinfo is None:
        raise ValueError('Timestamp has no timezone')
    return dt.astimezone(timezone.utc)


def build(archive: Path, month: str, fuel: str) -> dict:
    manifest = load_json(archive / 'manifest.json')
    metadata = load_json(archive / 'stations.json')
    if manifest.get('schemaVersion') != 1 or metadata.get('schemaVersion') != 1:
        raise ValueError('Unsupported source schema')
    sites = metadata.get('stations')
    if not isinstance(sites, list) or not sites:
        raise ValueError('No stations in stations.json')
    if manifest.get('stationCount') != len(sites):
        raise ValueError('Manifest stationCount does not match stations.json')
    states = {str(item.get('state', '')).strip().upper() for item in sites if isinstance(item, dict)}
    if states != {'SOUTH AUSTRALIA'}:
        from collections import Counter
        counts = Counter(str(item.get('state', '<missing>')) for item in sites if isinstance(item, dict))
        raise ValueError(f'Archive is not SA-only: station states = {dict(counts)}. Correct the R export first.')
    generated = utc(manifest.get('generatedAt'))
    latest = utc(manifest.get('lastObservation'))
    if latest > generated:
        raise ValueError(f'Future observations: lastObservation {latest.isoformat()} is after generatedAt {generated.isoformat()}. Check UTC conversion in R.')
    if not isinstance(manifest.get('partitions'), list):
        raise ValueError('Manifest partitions are missing')
    candidates = [item for item in manifest['partitions'] if item.get('month') == month and item.get('fuelCode') == fuel]
    if len(candidates) != 1:
        raise ValueError(f'Expected one partition for {month} / {fuel}, found {len(candidates)}')
    spec = candidates[0]
    relative = spec.get('file')
    if not isinstance(relative, str) or Path(relative).is_absolute() or '..' in Path(relative).parts or '\\' in relative:
        raise ValueError('Unsafe partition path in manifest')
    partition = load_json(archive / relative)
    rows = partition.get('records')
    if partition.get('schemaVersion') != 1 or partition.get('month') != month or partition.get('fuelCode') != fuel or not isinstance(rows, list):
        raise ValueError('Partition header does not match manifest')
    if len(rows) != spec.get('recordCount'):
        raise ValueError(f'Partition row count differs: {len(rows)} versus {spec.get("recordCount")}')
    site_lookup: dict[str, dict] = {}
    for site in sites:
        sid = site.get('station_id')
        if not isinstance(sid, str) or sid in site_lookup:
            raise ValueError('Missing/duplicate station ID in metadata')
        site_lookup[sid] = site
    if len({row.get('station_id') for row in rows}) != spec.get('stationCount'):
        raise ValueError('Partition station count differs from manifest')
    if any(row.get('station_id') not in site_lookup for row in rows):
        raise ValueError('Price partition contains stations absent from SA-only metadata')
    # This first-stage browser preview covers the Adelaide region only. It does
    # not silently equate every South Australian location with metropolitan Adelaide.
    metro: dict[str, dict] = {}
    for sid, site in site_lookup.items():
        if str(site.get('region', '')).strip().casefold() != 'adelaide':
            continue
        lat, lon = site.get('latitude'), site.get('longitude')
        if not isinstance(lat, (float, int)) or not isinstance(lon, (float, int)) or not math.isfinite(lat) or not math.isfinite(lon) or not (-35.6 < lat < -34.3 and 138.0 < lon < 139.2):
            continue
        metro[sid] = site
    if not metro:
        raise ValueError('No valid Adelaide region station metadata')
    daily: dict[str, dict[str, tuple[datetime, dict]]] = {}
    seen: dict[tuple[str, str], tuple[float, str]] = {}
    for row in rows:
        if not isinstance(row, dict) or row.get('fuel_code') != fuel:
            raise ValueError('Invalid partition row or fuel code')
        ts = utc(row.get('observed_at_utc'))
        if ts > generated:
            raise ValueError('Partition has observations after the export generation time')
        if row['observed_at_utc'][:7] != month:
            raise ValueError('Partition contains an observation from a different UTC month')
        price = row.get('price_cpl')
        if not isinstance(price, (float, int)) or not math.isfinite(price) or not (0 < price < 1000):
            raise ValueError('Invalid cents/litre price')
        source = row.get('source')
        if not isinstance(source, str) or not source:
            raise ValueError('Missing historical source code')
        sid = row['station_id']
        key = (sid, row['observed_at_utc'])
        previous = seen.get(key)
        if previous is not None and previous != (price, source):
            raise ValueError('Conflicting observations for a station at the same timestamp')
        seen[key] = (price, source)
        if sid not in metro:
            continue
        day = ts.astimezone(ADELAIDE).date().isoformat()
        by_site = daily.setdefault(day, {})
        if sid not in by_site or ts > by_site[sid][0]:
            by_site[sid] = (ts, {'id': sid, 'priceCpl': price, 'observedAt': row['observed_at_utc'], 'source': source})
    if not daily:
        raise ValueError(f'No historical observations for Adelaide in {month} / {fuel}')
    days = [{'date': day, 'prices': [pair[1] for sid, pair in sorted(daily[day].items())]} for day in sorted(daily)]
    used = {price['id'] for day in days for price in day['prices']}
    stations = [{'id': sid, 'name': metro[sid].get('name') or sid, 'address': metro[sid].get('address') or '',
                 'latitude': metro[sid]['latitude'], 'longitude': metro[sid]['longitude']} for sid in sorted(used)]
    return {'schemaVersion': 1, 'kind': 'historical-adelaide-daily', 'month': month, 'fuelCode': fuel,
            'generatedAt': manifest['generatedAt'], 'stations': stations, 'days': days,
            'method': 'Last observed price per station on each Adelaide calendar date; missing days are not filled.'}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True, help='Folder holding the corrected manifest.json, stations.json and history/')
    parser.add_argument('--month', required=True, help='UTC partition month, YYYY-MM')
    parser.add_argument('--fuel', default='ULP', help='Original fuel code, default ULP')
    parser.add_argument('--local-preview', action='store_true', help='Explicitly place preview JSON in public/ for LOCAL browsing only; never deploy it without source permission')
    args = parser.parse_args()
    if not __import__('re').fullmatch(r'\d{4}-(0[1-9]|1[0-2])', args.month):
        parser.error('--month must be YYYY-MM')
    preview = build(args.archive, args.month, args.fuel)
    folder = (ROOT / 'public/data/pulse-of-adelaide' if args.local_preview else ROOT / 'data/processed/pulse-of-adelaide')
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / 'history-preview.json'
    import tempfile
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=folder, prefix='.history-', suffix='.tmp', delete=False) as out:
        temp = Path(out.name)
        json.dump(preview, out, ensure_ascii=False, separators=(',', ':'))
        out.write('\n')
    temp.replace(target)
    print(f'Wrote {len(preview["days"])} Adelaide calendar days, {len(preview["stations"])} stations, {target.stat().st_size:,} bytes: {target}')
    if args.local_preview:
        print('LOCAL PREVIEW ONLY: public/ is copied into every Astro build. Remove history-preview.json before deployment until historical source reuse rights are verified.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f'History preview not created: {exc}', file=sys.stderr)
        sys.exit(1)
