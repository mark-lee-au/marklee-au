"""Fetch a dated Adelaide fuel-price snapshot using a private server-side token.

The subscriber token is supplied only through the process environment. Refreshing
does not deploy data or change any Cloudflare/GitHub settings. See README.md for
the separate publication, usage-reporting and termination responsibilities.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import time
from decimal import Decimal, InvalidOperation
import json
import os
from pathlib import Path
import sys
import tempfile
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[3]
BASE = 'https://fppdirectapi-prod.safuelpricinginformation.com.au'
RAW = ROOT / 'data/raw/pulse-of-adelaide'
PUBLIC = ROOT / 'public/data/pulse-of-adelaide'
COUNTRY = 21
# Clause 3.1, verbatim as printed in the supplied February 2021 terms.
ATTRIBUTION = ('Based on or contains data provided by the State of South Australia '
               '(Office of Consumer and Business Services 2021-2023. '
               'Copyright of the State of South Australia')
TERMS = 'SA Fuel Pricing Information Scheme Data Publisher Terms and Conditions, v1 February 2021'


def rows(payload: object, fields: tuple[str, ...]) -> list[dict]:
    if isinstance(payload, list):
        result = payload
    elif isinstance(payload, dict):
        if any(field in payload and not isinstance(payload[field], (list, dict)) for field in fields):
            result = [payload]
        else:
            result = next((value for value in payload.values()
                           if isinstance(value, list) and (not value or isinstance(value[0], dict))), None)
            if result is None:
                raise ValueError('Unexpected API response envelope. Inspect your local raw JSON before changing the parser.')
    else:
        raise ValueError('Unexpected API response type')
    if not all(isinstance(record, dict) for record in result):
        raise ValueError('API records are not objects')
    return result


def get_json(path: str, params: dict[str, int], token: str) -> object:
    request = Request(f'{BASE}{path}?{urlencode(params)}', headers={
        'Authorization': f'FPDAPI SubscriberToken={token}',
        'Accept': 'application/json',
    })
    try:
        with urlopen(request, timeout=35) as response:
            return json.load(response)
    except HTTPError as error:
        raise ValueError(f'{path}: HTTP {error.code}; check token activation and API parameters') from None
    except (URLError, TimeoutError) as error:
        raise ValueError(f'{path}: network error ({type(error).__name__})') from None


def utc(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError('Missing price timestamp')
    date = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if date.tzinfo is None:
        date = date.replace(tzinfo=timezone.utc)  # TransactionDateUtc per API guide.
    return date.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def price_cpl(value: object) -> float | None:
    try:
        raw = Decimal(str(value))
    except (InvalidOperation, TypeError):
        return None
    if not raw.is_finite() or raw <= 0 or raw == 9999:
        return None
    converted = raw / Decimal('10')  # API value is tenths of a cent.
    return float(converted) if converted <= 1000 else None


def write(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # Replace only fully written files. Never expose a partially written snapshot.
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent,
                                     prefix='.pulse-', suffix='.tmp', delete=False) as handle:
        temporary = Path(handle.name)
        try:
            handle.write(json.dumps(obj, ensure_ascii=False, separators=(',', ':'), sort_keys=True) + '\n')
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise
    temporary.replace(path)


def cached_json(name: str, path: str, params: dict[str, int], token: str, ttl: int) -> object:
    local = RAW / f'{name}.json'
    if local.is_file() and time.time() - local.stat().st_mtime < ttl:
        return json.loads(local.read_text(encoding='utf-8'))
    if name == 'prices':
        # Apply the API's once-per-minute ceiling to *attempts*, including failures.
        # This is a single-process local job; do not run parallel workers.
        attempted = RAW / 'price-request-attempt.txt'
        if attempted.exists() and time.time() - attempted.stat().st_mtime < 65:
            raise ValueError('Price endpoint was called recently. Wait at least 65 seconds before retrying.')
        attempted.parent.mkdir(parents=True, exist_ok=True)
        attempted.write_text('Last attempted price call (UTC epoch via file mtime).\n', encoding='utf-8')
    data = get_json(path, params, token)
    write(local, data)
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    task = parser.add_mutually_exclusive_group(required=True)
    task.add_argument('--check-access', action='store_true', help='Verify API authentication without requesting prices')
    task.add_argument('--refresh', action='store_true', help='Fetch and prepare an updated browser snapshot; does not deploy')
    task.add_argument('--retire', action='store_true', help='Remove local public fuel exports after termination; separately remove deployed copies')
    args = parser.parse_args()
    if args.retire:
        for name in ('snapshot.json', 'metadata.json'):
            (PUBLIC / name).unlink(missing_ok=True)
        print('Local published exports removed. Remove deployed copies and clear caches separately; this command cannot do that.')
        return 0
    token = os.environ.get('SAFPIS_TOKEN', '').strip()
    if not token:
        parser.error('Set SAFPIS_TOKEN in your local process environment. Never add it to files or Git.')

    country = {'countryId': COUNTRY}
    if args.check_access:
        response = get_json('/Subscriber/GetCountryFuelTypes', country, token)
        if not rows(response, ('FuelId', 'Name')):
            raise ValueError('Authenticated response contained no fuel types.')
        print('API authentication succeeded. No price call was made; no data was published.')
        return 0
    fuel_payload = cached_json('fuel-types', '/Subscriber/GetCountryFuelTypes', country, token, 86400)
    region_payload = cached_json('regions', '/Subscriber/GetCountryGeographicRegions', country, token, 86400)
    regions = rows(region_payload, ('GeoRegionId', 'GeoRegionLevel'))
    adelaide = [region for region in regions if str(region.get('Name', '')).strip().casefold() == 'adelaide'
                and int(region.get('GeoRegionLevel', 0)) == 2]
    if len(adelaide) != 1:
        raise ValueError('Could not uniquely identify the Adelaide city region from the live region list.')
    city_id = int(adelaide[0]['GeoRegionId'])
    location = {**country, 'geoRegionLevel': 2, 'geoRegionId': city_id}
    sites_payload = cached_json('sites', '/Subscriber/GetFullSiteDetails', location, token, 86400)
    price_payload = cached_json('prices', '/Price/GetSitesPrices', location, token, 65)
    retrieved = datetime.fromtimestamp((RAW / 'prices.json').stat().st_mtime, timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')

    fuels = sorted(({'id': int(record['FuelId']), 'name': str(record['Name']).strip()}
                    for record in rows(fuel_payload, ('FuelId', 'Name'))), key=lambda item: item['id'])
    if not fuels or len({fuel['id'] for fuel in fuels}) != len(fuels):
        raise ValueError('Invalid fuel type catalogue')
    fuel_ids = {fuel['id'] for fuel in fuels}
    stations: dict[int, dict] = {}
    skipped_coords = 0
    for record in rows(sites_payload, ('S', 'Lat', 'Lng')):
        try:
            station_id = int(record['S'])
            latitude = float(record['Lat'])
            longitude = float(record['Lng'])
            if not (-45 <= latitude <= -9 and 110 <= longitude <= 155):
                raise ValueError('Outside Australia')
            if station_id in stations:
                raise ValueError('Duplicate site ID')
            stations[station_id] = {'id': station_id, 'name': str(record['N']).strip(),
                                    'address': str(record.get('A') or '').strip(),
                                    'latitude': latitude, 'longitude': longitude, 'prices': []}
        except (KeyError, TypeError, ValueError):
            skipped_coords += 1
    if not stations:
        raise ValueError('No sites with valid Australian coordinates; no output written.')

    latest: dict[tuple[int, int], dict] = {}
    unavailable = 0
    unmatched = 0
    for record in rows(price_payload, ('SiteId', 'FuelId', 'Price')):
        try:
            station_id = int(record['SiteId'])
            fuel_id = int(record['FuelId'])
            if station_id not in stations or fuel_id not in fuel_ids:
                unmatched += 1
                continue
            price = price_cpl(record['Price'])
            if price is None:
                unavailable += 1
                continue
            timestamp = utc(record['TransactionDateUtc'])
            value = {'fuelId': fuel_id, 'priceCpl': price, 'updatedAt': timestamp}
            key = (station_id, fuel_id)
            if key not in latest or timestamp > latest[key]['updatedAt']:
                latest[key] = value
        except (KeyError, ValueError, TypeError):
            unavailable += 1
    for (station_id, _), item in sorted(latest.items()):
        stations[station_id]['prices'].append(item)
    stations_list = [stations[key] for key in sorted(stations) if stations[key]['prices']]
    if not stations_list:
        raise ValueError('No valid priced stations; the previous snapshot was not replaced.')
    active_fuels = [fuel for fuel in fuels if any(price['fuelId'] == fuel['id'] for station in stations_list for price in station['prices'])]
    snapshot = {'schemaVersion': 1, 'retrievedAt': retrieved, 'city': 'Adelaide',
                'attribution': ATTRIBUTION,
                'source': 'State of South Australia fuel price data (via the authorised Direct API)',
                'fuelTypes': active_fuels, 'stations': stations_list}
    metadata = {'project': 'pulse-of-adelaide', 'datasetVersion': 1, 'generatedAt': retrieved,
                'attribution': ATTRIBUTION,
                'sources': [{'name': 'SA Fuel Pricing Information Scheme Direct API (OUT)',
                             'publisher': 'State of South Australia, Office of Consumer and Business Services',
                             'url': 'https://www.sa.gov.au/topics/driving-and-transport/fuel-pricing/fuel-price-reporting',
                             'licence': TERMS, 'retrievedAt': retrieved}],
                'coverage': {'start': min(item['updatedAt'] for item in latest.values()),
                             'end': max(item['updatedAt'] for item in latest.values()),
                             'geography': 'Adelaide city region from API region catalogue'},
                'processing': {'script': 'scripts/data/pulse-of-adelaide/refresh.py',
                               'method': 'One manual snapshot; join by SiteId/FuelId; tenths of cent / 10; unavailable 9999 omitted.'},
                'files': [{'path': 'snapshot.json', 'recordCount': len(stations_list), 'bytes': None}],
                'notes': ['Free publication under the accepted publisher terms; not endorsed by the State.',
                          f'{skipped_coords} sites excluded for missing/invalid coordinates; {unavailable} unavailable/invalid prices; {unmatched} unmatched prices.',
                          'API retrieval time differs from the station price observation timestamp.',
                          'This is a single retrieval, not a continuous direct feed. Confirm operational refresh and monthly audience reporting before release.']}
    # Raw responses were cached outside public/ on retrieval; never commit them.
    serialized = json.dumps(snapshot, ensure_ascii=False, separators=(',', ':'), sort_keys=True) + '\n'
    metadata['files'][0]['bytes'] = len(serialized.encode('utf-8'))
    write(PUBLIC / 'metadata.json', metadata)
    write(PUBLIC / 'snapshot.json', snapshot)
    print(f'Prepared: {len(stations_list)} priced Adelaide stations, {len(active_fuels)} fuel types; {retrieved}')
    print('Files are gitignored and not deployed. Verify freshness, usage reporting and deployment before making them public.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except ValueError as exc:
        print(f'Fuel snapshot not created: {exc}', file=sys.stderr)
        sys.exit(1)
