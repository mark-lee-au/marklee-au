"""Build complete static, lazy-loaded SA historical fuel browser assets from a private archive."""
from __future__ import annotations

import argparse
from collections import defaultdict
from datetime import datetime, timezone
import json
import math
from pathlib import Path, PurePosixPath
import re
import sys
import tempfile
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[3]
ADELAIDE = ZoneInfo('Australia/Adelaide')
FUEL = re.compile(r'[A-Z0-9]{2,8}\Z')
MONTH = re.compile(r'\d{4}-(0[1-9]|1[0-2])\Z')


def read(path: Path) -> dict:
    if not path.is_file():
        raise ValueError(f'Missing file: {path}')
    item = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(item, dict):
        raise ValueError(f'Expected an object: {path}')
    return item


def parse_time(value: object) -> datetime:
    if not isinstance(value, str) or not value.endswith('Z'):
        raise ValueError(f'Expected UTC timestamp, received {value!r}')
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as exc:
        raise ValueError(f'Invalid UTC timestamp: {value!r}') from exc
    return dt.astimezone(timezone.utc)


def safe_file(archive: Path, value: object) -> Path:
    if not isinstance(value, str) or '\\' in value:
        raise ValueError('Invalid partition filename')
    part = PurePosixPath(value)
    if part.is_absolute() or '..' in part.parts or not re.fullmatch(r'history/\d{4}-\d{2}/fuel-\d{3}\.json', value):
        raise ValueError(f'Unexpected partition filename: {value!r}')
    path = archive.joinpath(*part.parts)
    if not path.resolve().is_relative_to(archive.resolve()):
        raise ValueError('Partition is outside the archive')
    return path


def as_json(obj: object) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + '\n'


def write(target: Path, obj: object) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=target.parent, prefix='.pulse-', suffix='.tmp', delete=False) as out:
        path = Path(out.name)
        out.write(as_json(obj))
    path.replace(target)


def build(archive: Path, output: Path) -> dict:
    manifest = read(archive / 'manifest.json')
    metadata = read(archive / 'stations.json')
    sites = metadata.get('stations')
    specs = manifest.get('partitions')
    if manifest.get('schemaVersion') != 1 or metadata.get('schemaVersion') != 1:
        raise ValueError('Unsupported source schema')
    if not isinstance(sites, list) or not sites or manifest.get('stationCount') != len(sites):
        raise ValueError('Stations missing or stationCount does not match')
    if not isinstance(specs, list) or not specs:
        raise ValueError('No source partitions')
    generated = parse_time(manifest.get('generatedAt'))
    if generated > datetime.now(timezone.utc):
        raise ValueError('Export generation is in the future')
    lookup: dict[str, dict] = {}
    skipped = 0
    known_ids: set[str] = set()
    for site in sites:
        if not isinstance(site, dict) or str(site.get('state', '')).strip().upper() != 'SOUTH AUSTRALIA':
            raise ValueError('Historical metadata is not SA-only')
        sid = site.get('station_id')
        if not isinstance(sid, str) or not sid or sid in known_ids:
            raise ValueError('Station IDs must be nonempty and distinct strings')
        known_ids.add(sid)
        lat, lon = site.get('latitude'), site.get('longitude')
        if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in (lat, lon)) or not (-38.6 < lat < -25.5 and 129 < lon < 141):
            skipped += 1
            continue
        lookup[sid] = {'id': sid, 'name': str(site.get('name') or sid),
                       'address': str(site.get('address') or ''), 'region': str(site.get('region') or ''),
                       'latitude': lat, 'longitude': lon}
    if not lookup:
        raise ValueError('No stations with valid South Australian coordinates')

    days: dict[tuple[str, str, str], dict[str, tuple[datetime, dict]]] = defaultdict(dict)
    seen: dict[tuple[str, str, str], tuple[float, str]] = {}
    count = 0
    first: datetime | None = None
    last: datetime | None = None
    spec_keys: set[tuple[str, str]] = set()
    for pos, spec in enumerate(specs, 1):
        if not isinstance(spec, dict):
            raise ValueError('Invalid partition specification')
        month, fuel = spec.get('month'), spec.get('fuelCode')
        if not isinstance(month, str) or not MONTH.fullmatch(month) or not isinstance(fuel, str) or not FUEL.fullmatch(fuel):
            raise ValueError('Invalid partition month or fuel code')
        if (month, fuel) in spec_keys:
            raise ValueError(f'Duplicate partition: {month}/{fuel}')
        spec_keys.add((month, fuel))
        location = safe_file(archive, spec.get('file'))
        part = read(location)
        rows = part.get('records')
        if part.get('schemaVersion') != 1 or part.get('month') != month or part.get('fuelCode') != fuel or not isinstance(rows, list):
            raise ValueError(f'Partition header mismatch: {location}')
        if len(rows) != spec.get('recordCount') or len({row.get('station_id') for row in rows if isinstance(row, dict)}) != spec.get('stationCount'):
            raise ValueError(f'Partition counts mismatch: {location}')
        for row in rows:
            if not isinstance(row, dict) or row.get('fuel_code') != fuel:
                raise ValueError(f'Wrong fuel in {location}')
            sid, price, source = row.get('station_id'), row.get('price_cpl'), row.get('source')
            if not isinstance(sid, str) or sid not in known_ids:
                raise ValueError(f'Price station missing from SA metadata: {sid!r}')
            if not isinstance(price, (int, float)) or not math.isfinite(price) or not 0 < price < 1000 or not isinstance(source, str) or not source:
                raise ValueError(f'Invalid price or source in {location}')
            observed = row.get('observed_at_utc')
            ts = parse_time(observed)
            if observed[:7] != month or ts > generated:
                raise ValueError(f'Wrong month or future timestamp in {location}: {observed}')
            key = (sid, fuel, observed)
            previous = seen.get(key)
            if previous is not None and previous != (price, source):
                raise ValueError(f'Conflicting records for {key}')
            seen[key] = (price, source)
            count += 1
            first = ts if first is None else min(first, ts)
            last = ts if last is None else max(last, ts)
            if sid not in lookup:
                continue
            date = ts.astimezone(ADELAIDE).date().isoformat()
            bucket = days[(date[:7], fuel, date)]
            if sid not in bucket or ts > bucket[sid][0]:
                bucket[sid] = (ts, {'id': sid, 'priceCpl': price, 'observedAt': observed, 'source': source})
        print(f'[{pos}/{len(specs)}] {month} {fuel}: {len(rows):,} records')
    if count != manifest.get('recordCount'):
        raise ValueError(f'Manifest recordCount mismatch: {count} vs {manifest.get("recordCount")}')
    if not days or first is None or last is None:
        raise ValueError('No historical price days produced')

    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for (month, fuel, date), entries in sorted(days.items()):
        grouped[(month, fuel)].append({'date': date, 'prices': [pair[1] for sid, pair in sorted(entries.items())]})
    # Assemble all content before writing the public assets. A failure leaves the old published set unchanged.
    outputs: dict[str, dict] = {}
    catalogue = []
    metro = {sid for sid, site in lookup.items() if site['region'].strip().casefold() == 'adelaide' and
             -35.6 < site['latitude'] < -34.3 and 138 < site['longitude'] < 139.2}
    for (month, fuel), collection in sorted(grouped.items()):
        relative = f'{month}/{fuel}.json'
        used = {p['id'] for day in collection for p in day['prices']}
        metro_count = len(used & metro)
        outputs[relative] = {'schemaVersion': 2, 'kind': 'historical-daily-partition', 'month': month,
                             'fuelCode': fuel, 'days': collection}
        catalogue.append({'month': month, 'fuelCode': fuel, 'file': relative,
                          'dayCount': len(collection), 'stationCount': len(used), 'adelaideStations': metro_count})
    index = {'schemaVersion': 2, 'kind': 'historical-fuel-index', 'generatedAt': manifest['generatedAt'],
             'firstObservation': first.isoformat().replace('+00:00', 'Z'),
             'lastObservation': last.isoformat().replace('+00:00', 'Z'), 'sourceRecordCount': count,
             'stationCount': len(lookup), 'adelaideStationCount': len(metro), 'skippedUnlocatedStations': skipped,
             'stations': [lookup[sid] for sid in sorted(lookup)], 'partitions': catalogue,
             'method': 'Last observed price per station on each Adelaide calendar day. No interpolation or carry-forward.'}
    output.mkdir(parents=True, exist_ok=True)
    for relative, part in outputs.items():
        write(output / relative, part)
    write(output / 'index.json', index)
    return index


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'public/data/pulse-of-adelaide/history')
    args = parser.parse_args()
    index = build(args.archive, args.output)
    print(f'Complete: {index["sourceRecordCount"]:,} source rows; {index["stationCount"]} SA stations, '
          f'{index["adelaideStationCount"]} Adelaide stations; {len(index["partitions"])} browser partitions at {args.output}')
    print('Local-only assets: files under public/ are also included in Astro builds. Do not deploy until source reuse is resolved.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f'History browser not created: {exc}', file=sys.stderr)
        sys.exit(1)
