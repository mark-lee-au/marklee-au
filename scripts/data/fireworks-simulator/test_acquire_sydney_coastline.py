"""Offline Overture ocean inversion and land mesh regression tests."""
import copy
import unittest
from unittest.mock import patch

from shapely.geometry import Point, Polygon, mapping, box

from acquire_sydney_coastline import (
    apply_coastline, coastline_frame_bounds, coastline_to_land, content_bounds, is_scene_water_feature, query_bbox,
)

FRAME = {'minX': -100, 'maxX': 100, 'minY': -100, 'maxY': 100}


def raw_ocean(*polygons):
    return {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {'subtype': 'ocean', 'class': None},
         'geometry': mapping(polygon)} for polygon in polygons
    ]}


def land_triangles(mesh):
    return [Polygon(t) for t in mesh['triangles']]


class CoastlineMeshTests(unittest.TestCase):

    def test_bay_class_is_accepted_as_scene_water(self):
        self.assertTrue(is_scene_water_feature({'class': 'bay'}))
        self.assertTrue(is_scene_water_feature({'subtype': 'ocean'}))
        self.assertTrue(is_scene_water_feature({'subtype': 'water', 'class': 'water'}))
        self.assertFalse(is_scene_water_feature({'subtype': 'lake', 'class': 'lake'}))

    def project_identity(self):
        return patch('acquire_sydney_coastline._project_geometry', lambda shape: shape)

    def test_dividing_shoreline_land_is_inverse_ocean(self):
        with self.project_identity():
            mesh = coastline_to_land(raw_ocean(box(0, -100, 100, 100)), FRAME)
        triangles = land_triangles(mesh)
        self.assertTrue(any(t.covers(Point(-50, 0)) for t in triangles))
        self.assertFalse(any(t.covers(Point(50, 0)) for t in triangles))
        self.assertAlmostEqual(mesh['landAreaFraction'], .5, places=2)

    def test_island_within_ocean_preserved(self):
        ocean = box(-100, -100, 100, 100).difference(box(25, -12, 50, 12))
        # Leave a 40 m land strip at the west as well as the island.
        ocean = ocean.intersection(box(-60, -100, 100, 100))
        with self.project_identity():
            mesh = coastline_to_land(raw_ocean(ocean), FRAME)
        triangles = land_triangles(mesh)
        self.assertTrue(any(t.covers(Point(35, 0)) for t in triangles))
        self.assertFalse(any(t.covers(Point(0, 0)) for t in triangles))
        self.assertTrue(any(t.covers(Point(-90, 0)) for t in triangles))
        # No boundary gaps: exact covered area matches source inverse to 0.1%.
        self.assertAlmostEqual(sum(t.area for t in triangles),
                               box(-100,-100,100,100).difference(ocean).area, delta=40)

    def test_multiple_ocean_tiles_do_not_leave_tile_seams(self):
        with self.project_identity():
            mesh = coastline_to_land(raw_ocean(box(0, -100, 50, 100), box(50, -100, 100, 100)), FRAME)
        self.assertAlmostEqual(mesh['landAreaFraction'], .5, places=2)

    def test_other_base_water_features_do_not_turn_into_ocean(self):
        raw = raw_ocean(box(0, -100, 100, 100))
        raw['features'].append({'type': 'Feature', 'properties': {'subtype': 'lake'},
                                'geometry': mapping(box(-70, -70, -20, -20))})
        with self.project_identity():
            mesh = coastline_to_land(raw, FRAME)
        self.assertAlmostEqual(mesh['landAreaFraction'], .5, places=2)

    def test_empty_overpass_response_rejected_explicitly(self):
        with self.assertRaisesRegex(ValueError, 'Overture water GeoJSON'):
            coastline_to_land({'elements': []}, FRAME)

    def test_empty_ocean_refuses_replacement(self):
        with self.project_identity():
            with self.assertRaisesRegex(ValueError, 'No usable Overture harbour/ocean'):
                coastline_to_land(raw_ocean(), FRAME)

    def test_wrong_land_water_inversion_rejected(self):
        # Whole scene is ocean => impossible land area.
        with self.project_identity():
            with self.assertRaisesRegex(ValueError, 'Implausible'):
                coastline_to_land(raw_ocean(box(-100,-100,100,100)), FRAME)


    def test_content_bounds_reads_buildings_and_roads(self):
        bundle = {
            'bounds': FRAME,
            'buildings': [{'footprint': [[-20, -10], [10, -10], [10, 5], [-20, 5]]}],
            'roads': [{'points': [[-40, 40], [60, 40]]}],
        }
        self.assertEqual(content_bounds(bundle), {'minX': -40, 'maxX': 60, 'minY': -10, 'maxY': 40})

    def test_coastline_frame_caps_west_north_south_but_keeps_east(self):
        bundle = {
            'bounds': {'minX': -100, 'maxX': 140, 'minY': -90, 'maxY': 120},
            'buildings': [{'footprint': [[-40, -30], [10, -30], [10, 20], [-40, 20]]}],
            'roads': [{'points': [[-60, 60], [80, 60]]}],
        }
        self.assertEqual(coastline_frame_bounds(bundle), {'minX': -60, 'maxX': 140, 'minY': -30, 'maxY': 60})

    def test_browser_bundle_updated_without_changing_original(self):
        bundle = {'bounds': FRAME, 'sources': [],
                  'buildings': [{'footprint': [[-90, -30], [-20, -30], [-20, 20], [-90, 20]]}],
                  'roads': [{'points': [[-80, 45], [50, 45]]}],
                  'water': {'polygons': [[[1, 1], [2, 2], [3, 3]]]},
                  'profile': {'waterVertexCount': 3}}
        original = copy.deepcopy(bundle)
        with self.project_identity():
            changed = apply_coastline(copy.deepcopy(bundle), raw_ocean(box(0,-100,100,100)), '2026-10-09', '2026-09-23.1')
        self.assertEqual(bundle, original)
        self.assertEqual(changed['water']['polygons'], [])
        self.assertGreater(changed['profile']['landTriangleCount'], 0)
        self.assertEqual(changed['profile']['oceanFeatureCount'], 1)
        self.assertEqual(changed['sources'][0]['release'], '2026-09-23.1')
        self.assertEqual(changed['bounds']['minX'], -90)
        self.assertEqual(changed['bounds']['maxX'], 100)
        self.assertEqual(changed['bounds']['minY'], -30)
        self.assertEqual(changed['bounds']['maxY'], 45)

    def test_request_is_padded_and_preserves_bbox_order(self):
        self.assertEqual(query_bbox([151.18, -33.903, 151.238, -33.829]),
                         [151.168, -33.915, 151.25, -33.817])


if __name__ == '__main__':
    unittest.main()
