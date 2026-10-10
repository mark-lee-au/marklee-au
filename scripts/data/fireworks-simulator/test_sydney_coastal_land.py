"""Offline tests for the Pacific coast acquisition contract and mesh."""
import copy
import unittest
from unittest.mock import patch
from shapely.geometry import box, Polygon, Point, mapping
from sydney_coastal_land import apply_coastal_land, land_mesh_from_overture, is_mapped_water
from prepare_sydney_city import scene_bbox


def scene():
    return {
        'bounds': {'minX': -90, 'maxX': 80, 'minY': -80, 'maxY': 80, 'maxZ': 400},
        'city': {'sceneBboxWgs84': [-100, -100, 900, 100]},
        'buildings': [{'footprint': [[-90,-50], [-20,-50], [-20,-20], [-90,-20]]}],
        'roads': [{'points': [[-80,-80], [80,80]]}],
        'profile': {}, 'sources': [],
    }


def land_source(coast_x=200):
    # Overture coastline land does not contain the inland harbour void.
    source = box(-100, -100, coast_x, 100)
    return {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {'class': 'land', 'subtype': 'land'}, 'geometry': mapping(source)},
        {'type': 'Feature', 'properties': {'class': 'cliff', 'subtype': 'physical'},
         'geometry': mapping(box(300,-20,600,20))},
    ]}


def water_source():
    return {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {'class': 'water', 'subtype': 'water'},
         'geometry': mapping(box(-5, -30, 20, 30))},
        {'type': 'Feature', 'properties': {'class': 'swimming_pool', 'subtype': 'human_made'},
         'geometry': mapping(box(120, -30, 150, 30))},
        {'type': 'Feature', 'properties': {'class': 'bay', 'subtype': 'physical'},
         'geometry': mapping(box(50, -10, 60, 10))},
    ]}


class CoastalMeshTests(unittest.TestCase):
    def project_identity(self):
        return patch.multiple('sydney_coastal_land', ORIGIN_E=0, ORIGIN_N=0, local_xy=lambda x, y: (x, y))

    def test_eastward_extent_preserves_north_south_west(self):
        coast = scene_bbox('east-coast')
        inner = scene_bbox('inner-sydney')
        self.assertEqual(coast[:2], inner[:2])
        self.assertEqual(coast[3], inner[3])
        self.assertGreater(coast[2], inner[2] + .06)

    def test_extended_extent_reaches_northern_and_southern_coast(self):
        wide = scene()
        wide['city']['sceneExtent'] = 'greater-sydney-test'
        # A complete coast has land in strips against both northern and southern bounds.
        filled_water = water_source()
        filled_water['features'] *= 30  # Source-completeness guard on larger extents
        with self.project_identity(), patch('sydney_coastal_land.shapely_transform', lambda f, s: s):
            mesh, info = land_mesh_from_overture(land_source(), filled_water, wide)
        self.assertGreater(len(mesh['triangles']), 0)
        self.assertAlmostEqual(info['bounds']['maxX'], 500)

    def test_extended_extent_rejects_missing_northern_coastal_strip(self):
        wide = scene()
        wide['city']['sceneExtent'] = 'greater-sydney-test'
        truncated = land_source()
        truncated['features'][0]['geometry'] = mapping(box(-100, -100, 200, 0))
        filled_water = water_source()
        filled_water['features'] *= 30
        with self.project_identity(), patch('sydney_coastal_land.shapely_transform', lambda f, s: s):
            with self.assertRaisesRegex(ValueError, 'northern coastal land'):
                land_mesh_from_overture(truncated, filled_water, wide)

    def test_measured_shoreline_plus_300m_and_no_painted_ocean(self):
        with self.project_identity(), patch('sydney_coastal_land.shapely_transform', lambda f, s: s):
            mesh, info = land_mesh_from_overture(land_source(), water_source(), scene())
        self.assertAlmostEqual(info['bounds']['maxX'], 500, delta=.01)
        self.assertEqual(info['bounds']['minX'], -90)
        self.assertEqual(info['bounds']['minY'], -80)
        self.assertEqual(info['bounds']['maxY'], 80)
        polys = [Polygon(t) for t in mesh['triangles']]
        self.assertTrue(any(p.covers(Point(150, 0)) for p in polys))
        self.assertFalse(any(p.covers(Point(400, 0)) for p in polys))
        self.assertFalse(any(p.covers(Point(0, 0)) for p in polys))
        self.assertFalse(any(p.covers(Point(55, 0)) for p in polys))
        self.assertTrue(any(p.covers(Point(135, 0)) for p in polys))
        self.assertEqual(info['mappedWaterFeatureCount'], 2)

    def test_source_truncation_rejects_city_replacement(self):
        with self.project_identity(), patch('sydney_coastal_land.shapely_transform', lambda f, s: s):
            with self.assertRaisesRegex(ValueError, 'eastern source boundary'):
                land_mesh_from_overture(land_source(800), water_source(), scene())

    def test_missing_coast_rejected(self):
        with self.project_identity(), patch('sydney_coastal_land.shapely_transform', lambda f, s: s):
            with self.assertRaisesRegex(ValueError, 'No Overture coastline'):
                land_mesh_from_overture({'type':'FeatureCollection','features':[]}, water_source(), scene())

    def test_missing_water_fails_instead_of_filling_harbour(self):
        with self.project_identity(), patch('sydney_coastal_land.shapely_transform', lambda f, s: s):
            with self.assertRaisesRegex(ValueError, 'No Overture surface-water'):
                land_mesh_from_overture(land_source(), {'type': 'FeatureCollection', 'features': []}, scene())

    def test_surface_water_classification_excludes_landmarks_and_pools(self):
        self.assertTrue(is_mapped_water({'subtype': 'physical', 'class': 'bay'}))
        self.assertTrue(is_mapped_water({'subtype': 'water', 'class': 'water'}))
        self.assertTrue(is_mapped_water({'subtype': 'ocean', 'class': 'ocean'}))
        self.assertFalse(is_mapped_water({'subtype': 'physical', 'class': 'cape'}))
        self.assertFalse(is_mapped_water({'subtype': 'human_made', 'class': 'swimming_pool'}))
        self.assertFalse(is_mapped_water({'subtype': 'canal', 'class': 'drain'}))

    def test_update_source_metadata(self):
        original = scene()
        with self.project_identity(), patch('sydney_coastal_land.shapely_transform', lambda f, s: s):
            updated = apply_coastal_land(copy.deepcopy(original), land_source(), water_source(), '2026-10-09', '2026-09-23.1')
        self.assertNotIn('land', original)
        self.assertEqual(updated['profile']['coastBufferM'], 300)
        self.assertEqual(updated['water']['polygons'], [])
        self.assertEqual(updated['sources'][-1]['release'], '2026-09-23.1')
        self.assertEqual(updated['sources'][-1]['id'], 'overture-coastal-water')


if __name__ == '__main__':
    unittest.main()
