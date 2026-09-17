"""Focused tests for the complete SA historical static export."""
import json
from datetime import datetime, timezone
from pathlib import Path
import tempfile
import unittest

from build_history_browser import build


class FullHistoryTests(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory()
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name)
        self.archive = self.root / 'archive'
        self.output = self.root / 'browser'
        self.archive.mkdir()
        self.sites = [
            {'station_id': '61500001', 'name': 'Adelaide Station', 'state': 'SOUTH AUSTRALIA',
             'region': 'Adelaide', 'latitude': -34.93, 'longitude': 138.60, 'address': 'Adelaide'},
            {'station_id': '61500002', 'name': 'Country Station', 'state': 'SOUTH AUSTRALIA',
             'region': 'Port Augusta', 'latitude': -32.49, 'longitude': 137.76, 'address': 'Port Augusta'},
        ]
        self.rows = [
            ('2023-12', 'ULP', [
                {'station_id': '61500001', 'fuel_code': 'ULP', 'price_cpl': 170.9, 'observed_at_utc': '2023-12-31T14:40:00Z', 'source': 'G'},
                {'station_id': '61500002', 'fuel_code': 'ULP', 'price_cpl': 173.9, 'observed_at_utc': '2023-12-31T14:50:00Z', 'source': 'G'},
            ]),
            ('2024-01', 'ULP', [
                {'station_id': '61500001', 'fuel_code': 'ULP', 'price_cpl': 171.9, 'observed_at_utc': '2024-01-01T00:05:00Z', 'source': 'G'},
            ]),
            ('2024-01', 'DSL', [
                {'station_id': '61500001', 'fuel_code': 'DSL', 'price_cpl': 185.9, 'observed_at_utc': '2024-01-01T01:05:00Z', 'source': 'G'},
            ]),
        ]
        self.make_fixture()

    def write(self, path, obj):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(obj), encoding='utf-8')

    def make_fixture(self):
        specs = []
        for i, (month, fuel, rows) in enumerate(self.rows, 1):
            relative = f'history/{month}/fuel-{i:03d}.json'
            self.write(self.archive / relative, {'schemaVersion': 1, 'month': month, 'fuelCode': fuel, 'records': rows})
            specs.append({'month': month, 'fuelCode': fuel, 'file': relative,
                          'recordCount': len(rows), 'stationCount': len({r['station_id'] for r in rows})})
        self.write(self.archive / 'stations.json', {'schemaVersion': 1, 'stations': self.sites})
        self.write(self.archive / 'manifest.json', {'schemaVersion': 1, 'stationCount': len(self.sites),
                   'recordCount': sum(len(row[2]) for row in self.rows),
                   'generatedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                   'partitions': specs})

    def test_all_months_fuels_and_local_month_boundary(self):
        index = build(self.archive, self.output)
        self.assertEqual(index['sourceRecordCount'], 4)
        self.assertEqual(index['stationCount'], 2)
        self.assertEqual(index['adelaideStationCount'], 1)
        self.assertEqual([(p['month'], p['fuelCode']) for p in index['partitions']], [('2024-01', 'DSL'), ('2024-01', 'ULP')])
        jan = json.loads((self.output / '2024-01/ULP.json').read_text())
        self.assertEqual(len(jan['days']), 1)
        self.assertEqual(jan['days'][0]['date'], '2024-01-01')
        self.assertEqual({p['id']: p['priceCpl'] for p in jan['days'][0]['prices']},
                         {'61500001': 171.9, '61500002': 173.9})
        self.assertTrue((self.output / 'index.json').is_file())
        self.assertEqual(index['firstObservation'], '2023-12-31T14:40:00Z')

    def test_nsw_site_is_rejected(self):
        self.sites[1]['state'] = 'NEW SOUTH WALES'
        self.make_fixture()
        with self.assertRaisesRegex(ValueError, 'not SA-only'):
            build(self.archive, self.output)

    def test_bad_manifest_count_is_rejected(self):
        manifest = json.loads((self.archive / 'manifest.json').read_text())
        manifest['recordCount'] += 1
        self.write(self.archive / 'manifest.json', manifest)
        with self.assertRaisesRegex(ValueError, 'recordCount mismatch'):
            build(self.archive, self.output)

    def test_conflicting_observations_are_rejected(self):
        self.rows[0][2].append({'station_id': '61500001', 'fuel_code': 'ULP', 'price_cpl': 175.9,
                                'observed_at_utc': '2023-12-31T14:40:00Z', 'source': 'G'})
        self.make_fixture()
        with self.assertRaisesRegex(ValueError, 'Conflicting records'):
            build(self.archive, self.output)


if __name__ == '__main__':
    unittest.main()
