"""Deterministic offline checks for Stage 5 real Overture geometry ingestion."""
import json
import tempfile
import unittest
import io
import sys
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

import acquire_sydney
from shapely.errors import GEOSException

from prepare_sydney_city import (
    apply_road_clearance, build_bundle, calibration_buildings, features_from_geojson, transport_network,
    remove_duplicate_observation_towers, repair_landmark_overlaps, structures, scene_bbox, SCENE_BBOX_WGS84,
)
from acquire_sydney import validate_expanded_coverage


def footprint(lon):
    lat = -33.855
    return {"type": "Polygon", "coordinates": [[[lon, lat], [lon + .00008, lat],
            [lon + .00008, lat + .00008], [lon, lat + .00008], [lon, lat]]]}


class CityPreparationTests(unittest.TestCase):
    def test_expanded_scene_covers_four_directions_without_changing_cbd(self):
        self.assertEqual(scene_bbox("cbd"), SCENE_BBOX_WGS84)
        self.assertLess(scene_bbox("inner-sydney")[0], SCENE_BBOX_WGS84[0])
        self.assertLess(scene_bbox("inner-sydney")[1], SCENE_BBOX_WGS84[1])
        self.assertGreater(scene_bbox("inner-sydney")[2], SCENE_BBOX_WGS84[2])
        self.assertGreater(scene_bbox("inner-sydney")[3], SCENE_BBOX_WGS84[3])
        with self.assertRaises(ValueError):
            scene_bbox("unbounded")

        locations = {
            "cbd": (151.207, -33.861),
            "north": (151.207, -33.836),
            "south": (151.205, -33.897),
            "west": (151.185, -33.865),
            "east": (151.232, -33.868),
        }
        def feature(identifier, lon, lat):
            ring = [[lon, lat], [lon + .00008, lat], [lon + .00008, lat + .00008],
                    [lon, lat + .00008], [lon, lat]]
            return {"type": "Feature", "id": identifier,
                    "geometry": {"type": "Polygon", "coordinates": [ring]},
                    "properties": {"num_floors": 3}}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "bounded.geojson"
            path.write_text(json.dumps({"type": "FeatureCollection", "features": [
                feature(name, *coordinates) for name, coordinates in locations.items()
            ]}), encoding="utf-8")
            core = build_bundle(path, 1, "2026-09-23.1", "2026-10-08")
            expanded = build_bundle(path, 1, "2026-09-23.1", "2026-10-08", extent="inner-sydney")
            self.assertEqual({b["id"] for b in core["buildings"]}, {"cbd"})
            self.assertEqual({b["id"] for b in expanded["buildings"]}, set(locations))
            self.assertEqual(expanded["city"]["sceneBboxWgs84"], scene_bbox("inner-sydney"))
            self.assertEqual(expanded["city"]["sceneExtent"], "inner-sydney")
            self.assertEqual(validate_expanded_coverage(expanded),
                             {"north": 1, "south": 1, "west": 1, "east": 1})
            with self.assertRaises(RuntimeError):
                validate_expanded_coverage(core)

    def test_calibration_fallback_contains_harbour_front_tower_cluster(self):
        buildings = {building["id"]: building for building in calibration_buildings()}
        required = {
            "crown-sydney",
            "one-sydney-harbour-1",
            "one-sydney-harbour-2",
            "international-towers-1",
            "international-towers-2",
            "international-towers-3",
            "salesforce-tower",
            "quay-quarter-tower",
            "governor-phillip-tower",
        }
        self.assertTrue(required.issubset(buildings))
        self.assertEqual(buildings["crown-sydney"]["heightM"], 271.3)
        self.assertEqual(buildings["one-sydney-harbour-2"]["heightM"], 230)
        self.assertEqual(buildings["international-towers-1"]["heightM"], 217)
        self.assertTrue(all(buildings[item]["geometrySource"] == "procedural-calibration" for item in required))

    def test_part_height_fallback_and_provenance(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            buildings = [
                {"type": "Feature", "id": "parent", "geometry": footprint(151.207), "properties": {"height": 110, "has_parts": True}},
                {"type": "Feature", "id": "floors", "geometry": footprint(151.2072), "properties": {"num_floors": 7}},
                {"type": "Feature", "id": "unknown", "geometry": footprint(151.2074), "properties": {}},
            ]
            parts = [{"type": "Feature", "id": "part", "geometry": footprint(151.207),
                      "properties": {"building_id": "parent", "min_height": 30, "height": 60}}]
            (root / "b.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": buildings}))
            (root / "p.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": parts}))
            result = build_bundle(root / "b.geojson", 1, "2026-09-23.1", "2026-10-07", root / "p.geojson")
            output = {b["id"]: b for b in result["buildings"]}
            self.assertEqual(set(output), {"part", "floors", "unknown"})
            self.assertEqual((output["part"]["minHeightM"], output["part"]["heightM"]), (30, 90))
            self.assertEqual(output["floors"]["heightM"], 22.4)
            self.assertEqual(output["unknown"]["heightM"], 18.0)
            self.assertEqual(result["city"]["geometryMode"], "overture-prototype")
            self.assertEqual(result["profile"]["buildingPartCount"], 1)
            self.assertEqual(result["profile"]["directHeightCount"], 1)
            self.assertEqual(result["profile"]["floorFallbackCount"], 1)
            self.assertEqual(result["profile"]["defaultHeightCount"], 1)
            self.assertEqual(result["sources"][0]["release"], "2026-09-23.1")
            self.assertTrue(all(b["geometrySource"].startswith("overture-") for b in result["buildings"]))

    def test_sydney_tower_conflict_audit_preserves_westfield_and_other_towers(self):
        tower = next(item for item in structures() if item["id"] == "sydney-tower")
        x, y = tower["x"], tower["y"]
        def nearby(identifier, dx, dy, height, source="overture-building-part"):
            return {
                "id": identifier, "geometrySource": source, "heightSource": "overture-height",
                "footprint": [[x+dx-5,y+dy-5], [x+dx+5,y+dy-5],
                              [x+dx+5,y+dy+5], [x+dx-5,y+dy+5]], "heightM": height,
            }
        buildings = [
            nearby("unnamed-tower-part", 8, 0, 290),
            nearby("named-tower-part", 5, 4, 510),
            nearby("westfield", 6, 2, 38.4),
            nearby("neighbour-tower", 80, 0, 270),
            nearby("procedural", 2, 2, 350, "procedural-calibration"),
        ]
        kept, removed = remove_duplicate_observation_towers(buildings, [tower])
        self.assertEqual(removed, ["unnamed-tower-part", "named-tower-part"])
        self.assertEqual({item["id"] for item in kept}, {"westfield", "neighbour-tower", "procedural"})
        bundle = {"buildings": buildings, "structures": [tower], "profile": {}, "city": {"transformations": []}}
        self.assertEqual(repair_landmark_overlaps(bundle), removed)
        self.assertEqual(bundle["profile"]["buildingCount"], 3)
        self.assertEqual(bundle["profile"]["landmarkDuplicateRemovalCount"], 2)
        self.assertEqual(repair_landmark_overlaps(bundle), [])
        self.assertEqual(bundle["profile"]["landmarkDuplicateRemovalCount"], 2)
        self.assertEqual(len(bundle["city"]["transformations"]), 1)

    def test_checked_in_city_has_one_309m_sydney_tower_and_preserves_westfield(self):
        source = Path(__file__).resolve().parents[3] / "public/data/fireworks-simulator/sydney-city.json"
        city = json.loads(source.read_text(encoding="utf-8"))
        self.assertEqual(city["profile"]["landmarkDuplicateRemovalCount"], 2)
        self.assertEqual(city["profile"]["buildingCount"], len(city["buildings"]))
        self.assertGreater(city["profile"]["buildingCount"], 4000)
        self.assertEqual(next(s for s in city["structures"] if s["id"] == "sydney-tower")["heightM"], 309)
        bridge = next(s for s in city["structures"] if s["id"] == "sydney-harbour-bridge")
        self.assertEqual(bridge["rotationDeg"], -25.3)
        self.assertEqual((bridge["x"], bridge["y"]), (114.0, 239.5))
        # The authored five-polygon harbour approximation was superseded by
        # sourced land triangulation. Keep this regression check aligned with
        # the actual checked-in browser contract.
        self.assertEqual(city["water"]["polygons"], [])
        self.assertGreater(len(city["land"]["triangles"]), 0)
        self.assertIn("Westfield Sydney", [b.get("name") for b in city["buildings"]])
        self.assertNotIn("Sydney Tower", [b.get("name") for b in city["buildings"]])
        kept, removed = remove_duplicate_observation_towers(city["buildings"], city["structures"])
        self.assertEqual(removed, [])
        self.assertEqual(len(kept), city["profile"]["buildingCount"])

    def test_reject_missing_real_data(self):
        with tempfile.TemporaryDirectory() as folder:
            empty = Path(folder) / 'empty.geojson'
            empty.write_text('{"type":"FeatureCollection","features":[]}')
            with self.assertRaises(ValueError):
                build_bundle(empty, 1, "2026-09-23.1", "2026-10-07")

    def test_geojsonseq_record_separator(self):
        with tempfile.TemporaryDirectory() as folder:
            seq = Path(folder) / 'parts.geojsonseq'
            seq.write_text('\x1e' + json.dumps({"type":"Feature", "geometry":footprint(151.207)}) + '\n')
            self.assertEqual(len(features_from_geojson(seq)), 1)


    def test_nsw_lane_code_is_category_not_exact_count_and_osm_can_enrich(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            roads = [{
                "type": "Feature", "id": "nsw-1",
                "geometry": {"type": "LineString", "coordinates": [[151.2050, -33.8650], [151.2070, -33.8650]]},
                "properties": {
                    "roadnamebase": "George", "roadnametype": "Street",
                    "lanecount": 2, "functionhierarchy": 2, "roadontype": 1, "surface": 1,
                },
            }]
            (root / "roads.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": roads}))
            osm = {"elements": [{
                "type": "way", "id": 50,
                "tags": {"highway": "primary", "name": "George Street", "lanes": "4"},
                "geometry": [{"lon": 151.2050, "lat": -33.8650}, {"lon": 151.2070, "lat": -33.8650}],
            }]}
            (root / "osm.json").write_text(json.dumps(osm))
            enriched, _, profile = transport_network(root / "roads.geojson", root / "osm.json")
            self.assertEqual(len(enriched), 1)
            self.assertEqual(enriched[0]["laneCategory"], "two-or-more")
            self.assertEqual(enriched[0]["laneCountExact"], 4)
            self.assertEqual(enriched[0]["laneSource"], "openstreetmap-lanes")
            self.assertEqual(profile["exactLaneCount"], 1)

            categorical, _, _ = transport_network(root / "roads.geojson", None)
            self.assertEqual(categorical[0]["laneCategory"], "two-or-more")
            self.assertIsNone(categorical[0]["laneCountExact"])

    def test_osm_signals_crossings_and_derived_junctions(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            lat, lon = -33.8650, 151.2060
            roads = []
            lines = [
                [[151.2055, lat], [lon, lat]],
                [[lon, lat], [151.2065, lat]],
                [[lon, -33.8655], [lon, lat]],
            ]
            for index, coords in enumerate(lines):
                roads.append({
                    "type": "Feature", "id": f"r{index}",
                    "geometry": {"type": "LineString", "coordinates": coords},
                    "properties": {"roadnamebase": f"Road {index}", "lanecount": 1, "functionhierarchy": 6, "roadontype": 1},
                })
            (root / "roads.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": roads}))
            osm = {"elements": [
                {"type": "node", "id": 1, "lat": lat, "lon": lon, "tags": {"highway": "traffic_signals"}},
                {"type": "node", "id": 2, "lat": lat + .0001, "lon": lon, "tags": {"highway": "crossing", "crossing": "marked"}},
            ]}
            (root / "osm.json").write_text(json.dumps(osm))
            _, points, profile = transport_network(root / "roads.geojson", root / "osm.json")
            types = [point["type"] for point in points]
            self.assertIn("traffic-signal", types)
            self.assertIn("crossing", types)
            self.assertIn("junction", types)
            self.assertEqual(profile["trafficSignalCount"], 1)
            self.assertEqual(profile["crossingCount"], 1)

    def test_calibration_building_is_cut_back_from_ground_road(self):
        road = {"id": "r", "points": [[-7, -20], [-7, 20]], "displayWidthM": 4, "onType": "ground"}
        calibration = {
            "id": "cal", "name": None, "footprint": [[-10, -10], [10, -10], [10, 10], [-10, 10]],
            "heightM": 20, "heightSource": "rendering-hypothesis", "geometrySource": "procedural-calibration", "class": "background-massing",
        }
        output, profile = apply_road_clearance([calibration], [road])
        self.assertEqual(profile["roadConflictCount"], 1)
        self.assertEqual(profile["roadClearedCalibrationCount"], 1)
        self.assertFalse(output[0].get("roadConflict", False))
        self.assertTrue(output[0].get("roadClearanceAdjusted"))

    def test_road_clearance_never_mutates_real_building_geometry(self):
        road = {"id": "r", "points": [[-20, 0], [20, 0]], "displayWidthM": 8, "onType": "ground"}
        real = {
            "id": "real", "name": None, "footprint": [[-5, -5], [5, -5], [5, 5], [-5, 5]],
            "heightM": 20, "heightSource": "overture-height", "geometrySource": "overture-building", "class": "building",
        }
        output, profile = apply_road_clearance([real], [road])
        self.assertEqual(output[0]["footprint"], real["footprint"])
        self.assertTrue(output[0]["roadConflict"])
        self.assertEqual(profile["roadHiddenBuildingCount"], 1)

    def test_invalid_building_polygon_does_not_abort_entire_road_audit(self):
        # A self-intersecting ring formerly made the city-wide corridor overlay
        # raise TopologyException and prevent the expanded dataset being built.
        road = {"id": "r", "points": [[0, -20], [0, 20]],
                "displayWidthM": 8, "onType": "ground"}
        bow_tie = [[-5, -5], [5, 5], [-5, 5], [5, -5]]
        good_ring = [[-4, -4], [4, -4], [4, 4], [-4, 4]]
        far_ring = [[100, 100], [104, 100], [104, 104], [100, 104]]
        items = [{"id": "bad", "footprint": bow_tie, "geometrySource": "overture-building"},
                 {"id": "near", "footprint": good_ring, "geometrySource": "overture-building"},
                 {"id": "far", "footprint": far_ring, "geometrySource": "overture-building"}]
        result, profile = apply_road_clearance(items, [road])
        self.assertEqual(result[0]["footprint"], bow_tie)
        self.assertTrue(result[0]["roadConflict"])
        self.assertTrue(result[0]["roadAuditError"])
        self.assertTrue(result[1]["roadConflict"])
        self.assertFalse(result[1].get("roadAuditError", False))
        self.assertFalse(result[2].get("roadConflict", False))
        self.assertEqual(profile["roadAuditErrorCount"], 1)
        self.assertEqual(profile["roadAuditErrorSampleIds"], ["bad"])

    def test_local_overlay_geos_topology_failure_is_audited_not_fatal(self):
        roads = [{"id": f"road-{i}", "points": [[x, -20], [x, 20]],
                  "displayWidthM": 6, "onType": "ground"}
                 for i, x in enumerate((-2, 2))]
        building = {"id": "source-building", "geometrySource": "overture-building",
                    "footprint": [[-5, -5], [5, -5], [5, 5], [-5, 5]]}
        with patch("prepare_sydney_city.unary_union", side_effect=GEOSException("TopologyException: side location conflict")):
            items, counts = apply_road_clearance([building], roads)
        self.assertEqual(items[0]["footprint"], building["footprint"])
        self.assertTrue(items[0]["roadAuditError"])
        self.assertTrue(items[0]["roadConflict"])
        self.assertEqual(counts["roadAuditErrorCount"], 1)

    def test_reuse_local_acquisition_requires_no_network_and_preserves_provenance_warning(self):
        with tempfile.TemporaryDirectory() as folder:
            raw = Path(folder) / "raw"
            raw.mkdir()
            for name in ("overture-buildings.geojson", "overture-building-parts.geojson",
                         "nsw-road-segments.geojson", "osm-transport.json"):
                (raw / name).write_text("{}", encoding="utf-8")
            output = Path(folder) / "sydney-city.json"
            fixture = {"profile": {"buildingCount": 20, "roadCount": 20,
                                   "directHeightCount": 10, "floorFallbackCount": 0,
                                   "defaultHeightCount": 10, "roadAuditErrorCount": 0},
                       "city": {"sceneBboxWgs84": SCENE_BBOX_WGS84},
                       "buildings": [{"id": f"b{i}"} for i in range(20)]}
            with (patch.object(acquire_sydney, "RAW", raw),
                  patch.object(acquire_sydney, "ROOT", Path(folder)),
                  patch.object(acquire_sydney, "DEFAULT_OUTPUT", output),
                  patch.object(acquire_sydney, "current_release", side_effect=AssertionError("network used")),
                  patch.object(acquire_sydney, "build_bundle", return_value=fixture) as build,
                  patch.object(sys, "argv", ["acquire_sydney.py", "--reuse-local"])):
                with redirect_stdout(io.StringIO()):
                    acquire_sydney.main()
            self.assertTrue(output.is_file())
            self.assertFalse(json.loads(output.read_text())["profile"]["overtureReleaseVerified"])
            self.assertIsNone(build.call_args.kwargs["overture_release"])

    def test_reuse_local_rejects_mismatching_bounds(self):
        with tempfile.TemporaryDirectory() as folder:
            raw = Path(folder)
            for name in ("overture-buildings.geojson", "overture-building-parts.geojson",
                         "nsw-road-segments.geojson", "osm-transport.json"):
                (raw / name).write_text("{}", encoding="utf-8")
            (raw / "sydney-source-acquisition.json").write_text(
                json.dumps({"bbox": SCENE_BBOX_WGS84, "overtureRelease": "2026-09-23.1",
                            "retrievedAt": "2026-10-08"}), encoding="utf-8")
            with (patch.object(acquire_sydney, "RAW", raw),
                  patch.object(acquire_sydney, "current_release", side_effect=AssertionError("network used")),
                  patch.object(sys, "argv", ["acquire_sydney.py", "--reuse-local", "--extent", "inner-sydney"])):
                with self.assertRaisesRegex(RuntimeError, "not requested"):
                    acquire_sydney.main()



if __name__ == '__main__':
    unittest.main()
