"""Offline regression checks for resumable Sydney coastal acquisition."""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).parent))
import acquire_sydney as acquire
import acquire_sydney_transport as transport


class CachedSourcesTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.cache = Path(self.temp.name)
        self.bbox = [151.18, -33.903, 151.315, -33.829]
        self.release = '2026-09-23.1'
        self.calls = 0

    def downloader(self, path):
        self.calls += 1
        path.write_text(json.dumps({'type': 'FeatureCollection', 'features': [{'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [151.2, -33.85]}}]}), encoding='utf-8')

    def test_uses_completed_cached_download_without_repeating(self):
        first = acquire.cached_download(self.cache, 'building', self.bbox, self.release, self.downloader)
        again = acquire.cached_download(self.cache, 'building', self.bbox, self.release, self.downloader)
        self.assertEqual(first, again)
        self.assertEqual(self.calls, 1)

    def test_rejects_same_filename_for_different_bbox_or_release(self):
        acquire.cached_download(self.cache, 'building', self.bbox, self.release, self.downloader)
        acquire.cached_download(self.cache, 'building', [151.18, -33.903, 151.24, -33.829], self.release, self.downloader)
        acquire.cached_download(self.cache, 'building', self.bbox, '2026-10-01.0', self.downloader)
        self.assertEqual(self.calls, 3)

    def test_incomplete_download_does_not_overwrite_good_cache(self):
        valid = acquire.cached_download(self.cache, 'building', self.bbox, self.release, self.downloader)
        before = valid.read_bytes()
        def fail(path):
            path.write_text('{"type":"FeatureCollection","features":[', encoding='utf-8')
            raise HTTPError('https://example.org', 504, 'Gateway Timeout', None, None)
        with self.assertRaises(HTTPError):
            acquire.cached_download(self.cache, 'building', self.bbox, 'changed', fail)
        self.assertEqual(valid.read_bytes(), before)
        self.assertFalse((self.cache / 'overture-buildings.geojson.partial').exists())

    def test_does_not_cache_empty_source(self):
        def empty(path):
            path.write_text('{"type":"FeatureCollection","features":[]}', encoding='utf-8')
        with self.assertRaisesRegex(RuntimeError, 'empty'):
            acquire.cached_download(self.cache, 'nsw-roads', self.bbox, self.release, empty)
        self.assertFalse((self.cache / 'nsw-road-segments.geojson').exists())

    def test_rejects_truncated_cache_even_if_json_remains_valid(self):
        self.downloader(self.cache / 'overture-water.geojson')
        (self.cache / 'overture-water.geojson.meta.json').write_text(json.dumps({
            'bbox': self.bbox, 'overtureRelease': self.release,
            'type': 'water', 'recordCount': 3305,
        }))
        with self.assertRaisesRegex(RuntimeError, 'record count differs'):
            acquire.cached_download(self.cache, 'water', self.bbox, self.release,
                                    lambda _: self.fail('must not download over a suspect cache'))

    def test_nsw_only_coastal_run_skips_overpass_and_marks_source_as_partial(self):
        """NSW geometry must be exportable while a public Overpass tile is down."""
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            raw = root / 'raw'
            output = root / 'public' / 'sydney-city.json'
            cached_types = []

            def cached(cache_dir, kind, bbox, release, downloader):
                cached_types.append(kind)
                path = cache_dir / f'{kind}.geojson'
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[151.21,-33.86]}}]}')
                return path

            def build(*args, **kwargs):
                self.assertIsNone(kwargs['osm_transport_path'])
                return {
                    'city': {'sceneExtent': 'east-coast'},
                    'buildings': [], 'roads': [], 'land': {}, 'profile': {
                        'buildingCount': 5000, 'roadCount': 4000,
                        'directHeightCount': 5000, 'floorFallbackCount': 0,
                        'defaultHeightCount': 0,
                    },
                }

            def coastal(bundle, raw_land, raw_water, retrieved, release):
                bundle['land'] = {'sourceClass': 'overture-osm-coastline-land', 'triangles': []}
                return bundle

            with patch.object(acquire, 'ROOT', root), patch.object(acquire, 'RAW', raw), patch.object(acquire, 'DEFAULT_OUTPUT', output), \
                    patch.object(acquire, 'current_release', return_value='2026-09-23.1'), \
                    patch.object(acquire, 'cached_download', side_effect=cached), \
                    patch.object(acquire, 'build_bundle', side_effect=build), \
                    patch.object(acquire, 'apply_coastal_land', side_effect=coastal), \
                    patch.object(acquire, 'validate_expanded_coverage', return_value={'east': 100}), \
                    patch.object(acquire, 'promote_sources'), \
                    patch.object(acquire, 'download_osm_transport', side_effect=AssertionError('Overpass must not be called')), \
                    patch.object(sys, 'argv', ['acquire_sydney.py', '--extent', 'east-coast', '--transport-source', 'nsw-only']):
                acquire.main()

            self.assertEqual(cached_types, ['building', 'building_part', 'nsw-roads', 'land', 'water'])
            result = json.loads(output.read_text())
            self.assertEqual(result['profile']['transportSourceMode'], 'nsw-only')
            self.assertIn('OSM enrichment pending', result['city']['sourceNote'])
            manifest = json.loads((raw / 'sydney-source-acquisition.json').read_text())
            self.assertFalse(manifest['osmTransportDownloaded'])
            self.assertTrue(manifest['coastalWaterDownloaded'])

    def test_pinned_release_uses_cache_without_catalog_or_download(self):
        """The user has already downloaded five verified 2026-09-23.1 layers."""
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            cache = root / 'raw/acquisition-cache-east-coast'
            output = root / 'public/sydney-city.json'
            bbox, release = self.bbox, self.release
            for kind, name in [('building', 'overture-buildings.geojson'),
                               ('building_part', 'overture-building-parts.geojson'),
                               ('nsw-roads', 'nsw-road-segments.geojson'),
                               ('land', 'overture-land.geojson'),
                               ('water', 'overture-water.geojson')]:
                cache.mkdir(parents=True, exist_ok=True)
                (cache / name).write_text('{"type":"FeatureCollection","features":[{"type":"Feature"}]}')
                (cache / (name + '.meta.json')).write_text(json.dumps({
                    'bbox': bbox, 'overtureRelease': release, 'type': kind, 'recordCount': 1
                }))
            output.parent.mkdir(parents=True, exist_ok=True)
            original = '{"city":{"sceneExtent":"inner-sydney"}}\n'
            output.write_text(original)
            with patch.object(acquire, 'ROOT', root), patch.object(acquire, 'RAW', root / 'raw'), \
                 patch.object(acquire, 'DEFAULT_OUTPUT', output), \
                 patch.object(acquire, 'current_release', side_effect=AssertionError('no catalog call')), \
                 patch.object(acquire, 'download_type', side_effect=AssertionError('no re-download')), \
                 patch.object(acquire, 'download_nsw_roads', side_effect=AssertionError('no re-download')), \
                 patch.object(acquire, 'build_bundle', side_effect=ValueError('invalid coastal data')), \
                 patch.object(sys, 'argv', ['acquire_sydney.py', '--extent', 'east-coast', '--transport-source', 'nsw-only', '--overture-release', release]):
                with self.assertRaisesRegex(ValueError, 'invalid coastal data'):
                    acquire.main()
            self.assertEqual(output.read_text(), original)
            self.assertTrue((cache / 'overture-water.geojson').exists())


class OverpassTileTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.cache = Path(self.temp.name) / 'tiles'
        self.bbox = [151.18, -33.903, 151.315, -33.829]

    def test_split_four_tiles_covers_original_bounds(self):
        tiles = transport._split_bbox(self.bbox)
        self.assertEqual(len(tiles), 4)
        self.assertEqual(min(t[0] for t in tiles), self.bbox[0])
        self.assertEqual(max(t[2] for t in tiles), self.bbox[2])
        self.assertEqual(min(t[1] for t in tiles), self.bbox[1])
        self.assertEqual(max(t[3] for t in tiles), self.bbox[3])

    def test_tiled_download_deduplicates_duplicate_ways(self):
        way = {'type': 'way', 'id': 70, 'geometry': [{'lat': -33.86, 'lon': 151.2}]}
        more = {'type': 'way', 'id': 70, 'geometry': [{'lat': -33.86, 'lon': 151.2}, {'lat': -33.87, 'lon': 151.21}]}
        data = iter([{'elements': [way]}, {'elements': [more]}, {'elements': [{'type': 'node', 'id': 14}]}, {'elements': []}])
        dest = Path(self.temp.name) / 'osm.json'
        with patch.object(transport, '_query_transport_tile', side_effect=lambda _: next(data)), patch.object(transport.time, 'sleep'):
            transport.download_osm_transport(dest, self.bbox, tile_cache_dir=self.cache)
        result = json.loads(dest.read_text(encoding='utf-8'))
        self.assertEqual(len(result['elements']), 2)
        self.assertEqual(len(next(e['geometry'] for e in result['elements'] if e['type'] == 'way')), 2)
        # The complete file is cached and the same four tiles aren't fetched twice.
        with patch.object(transport, '_query_transport_tile', side_effect=AssertionError('should use tile cache')), patch.object(transport.time, 'sleep'):
            transport.download_osm_transport(dest, self.bbox, tile_cache_dir=self.cache)

    def test_504_splits_failed_tile_and_keeps_successful_subtiles(self):
        calls = []
        def query(bounds):
            calls.append(bounds)
            if bounds == self.bbox:
                raise HTTPError('https://example.org', 504, 'Gateway Timeout', None, None)
            return {'elements': [{'type': 'node', 'id': len(calls)}]}
        with patch.object(transport, '_query_transport_tile', side_effect=query), patch.object(transport.time, 'sleep'):
            result = transport._cached_tile(self.bbox, self.cache)
        self.assertEqual(len(result), 4)
        self.assertEqual(len(calls), 5)
        with patch.object(transport, '_query_transport_tile', side_effect=AssertionError('should use child tile cache')), patch.object(transport.time, 'sleep'):
            result = transport._cached_tile(self.bbox, self.cache)
        self.assertEqual(len(result), 4)

    def test_interrupted_split_resumes_children_without_requerying_parent(self):
        calls = []
        tiles = transport._split_bbox(self.bbox)
        def interrupted(bounds):
            calls.append(bounds)
            if bounds == self.bbox:
                raise HTTPError('https://example.org', 504, 'Gateway Timeout', None, None)
            if bounds == tiles[1]:
                raise HTTPError('https://example.org', 503, 'Busy', None, None)
            return {'elements': [{'type': 'node', 'id': 1}]}
        with patch.object(transport, '_query_transport_tile', side_effect=interrupted), patch.object(transport.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, 'completed tiles are cached'):
                transport._cached_tile(self.bbox, self.cache)
        later = []
        def resumed(bounds):
            later.append(bounds)
            if bounds in (self.bbox, tiles[0]):
                raise AssertionError('parent or already completed tile fetched again')
            return {'elements': [{'type': 'node', 'id': len(later) + 1}]}
        with patch.object(transport, '_query_transport_tile', side_effect=resumed), patch.object(transport.time, 'sleep'):
            result = transport._cached_tile(self.bbox, self.cache)
        self.assertEqual(len(result), 4)
        self.assertNotIn(self.bbox, later)
        self.assertNotIn(tiles[0], later)

    def test_transient_503_retries_with_limit(self):
        calls = []
        def query(bounds):
            calls.append(1)
            if len(calls) == 1:
                raise HTTPError('https://example.org', 503, 'Service Unavailable', None, None)
            return {'elements': [{'type': 'node', 'id': 1}]}
        with patch.object(transport, '_query_transport_tile', side_effect=query), patch.object(transport.time, 'sleep'):
            result = transport._cached_tile(self.bbox, self.cache)
        self.assertEqual(len(result), 1)
        self.assertEqual(len(calls), 2)


if __name__ == '__main__':
    unittest.main()
