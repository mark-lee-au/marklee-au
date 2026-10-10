#!/usr/bin/env python3
"""Prepare the Fireworks Simulator Sydney browser bundle.

Two modes are supported:

1. Calibration mode (default): writes the small Stage 5 wireframe scene checked
   into the repo. It uses source-backed landmark positions/heights plus clearly
   labelled procedural CBD massing. Coastline land is a separate data pass. It is for renderer
   integration only and must not be described as an Overture extract.
2. Overture mode (--overture PATH): replaces procedural CBD massing with
   building polygons from an Overture GeoJSON download, projects them to
   GDA2020 / MGA Zone 56 (EPSG:7856), simplifies them, assigns height fallbacks,
   and writes the same browser contract.

Raw Overture data belongs under data/raw/fireworks-simulator/sydney/ and should
remain local. The browser bundle contains only local metre coordinates.
"""

from __future__ import annotations

import argparse
import json
import math
from numbers import Integral
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from pyproj import Transformer
    from shapely.geometry import Polygon, MultiPolygon, LineString, MultiLineString, shape, box
    from shapely.errors import GEOSException
    from shapely.ops import transform as shapely_transform, unary_union
    from shapely.strtree import STRtree
    from shapely.validation import make_valid
except ImportError as exc:  # pragma: no cover - dependency guard for local data work
    raise SystemExit(
        "This script needs pyproj and shapely. Install with: py -m pip install pyproj shapely"
    ) from exc

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT = ROOT / "public/data/fireworks-simulator/sydney-city.json"
SCENE_BBOX_WGS84 = [151.195, -33.882, 151.222, -33.848]
# Explicit, bounded extracts. Do not silently expand the CBD fixture or make
# acquiring the larger city the default: the rendering cost needs local review.
# The wider slice includes North Sydney, Pyrmont/Glebe, Redfern/Waterloo and
# Potts Point/Darlinghurst. It is NOT a surveyed water/terrain model.
SCENE_EXTENTS_WGS84 = {
    "cbd": SCENE_BBOX_WGS84,
    "inner-sydney": [151.180, -33.903, 151.238, -33.829],
    # Pacific-side acquisition box, deliberately beyond the coastline.
    # Actual rendered land stops at sourced shoreline + 300 local metres.
    "east-coast": [151.180, -33.903, 151.315, -33.829],
}


def scene_bbox(extent: str) -> list[float]:
    if extent not in SCENE_EXTENTS_WGS84:
        raise ValueError(f"Unknown Sydney extent: {extent}")
    return list(SCENE_EXTENTS_WGS84[extent])
OVERTURE_RELEASE_AT_STAGE5 = "2026-09-23.1"

# Heritage NSW location for Sydney Harbour Bridge. Using it as the local origin
# keeps the browser coordinates compact and gives the bridge a stable anchor.
ORIGIN_LON = 151.2093991420
ORIGIN_LAT = -33.8544294233

WGS84_TO_MGA56 = Transformer.from_crs("EPSG:4326", "EPSG:7856", always_xy=True)
ORIGIN_E, ORIGIN_N = WGS84_TO_MGA56.transform(ORIGIN_LON, ORIGIN_LAT)


def local_xy(lon: float, lat: float) -> tuple[float, float]:
    easting, northing = WGS84_TO_MGA56.transform(lon, lat)
    return round(easting - ORIGIN_E, 2), round(northing - ORIGIN_N, 2)


def rect(cx: float, cy: float, width: float, depth: float, rotation_deg: float = 0) -> list[list[float]]:
    angle = math.radians(rotation_deg)
    ca, sa = math.cos(angle), math.sin(angle)
    points = []
    for dx, dy in [(-width / 2, -depth / 2), (width / 2, -depth / 2), (width / 2, depth / 2), (-width / 2, depth / 2)]:
        x = cx + dx * ca - dy * sa
        y = cy + dx * sa + dy * ca
        points.append([round(x, 1), round(y, 1)])
    return points


def named_tower(id_: str, name: str, lon: float, lat: float, height: float, width: float, depth: float, rotation: float = 0) -> dict[str, Any]:
    x, y = local_xy(lon, lat)
    return {
        "id": id_,
        "name": name,
        "footprint": rect(x, y, width, depth, rotation),
        "heightM": height,
        "heightSource": "published-secondary-calibration",
        "geometrySource": "procedural-calibration",
        "class": "landmark-massing",
    }


def procedural_massing() -> list[dict[str, Any]]:
    """Create deterministic background massing around the factual landmark anchors.

    These blocks are intentionally generic. They exist to test density, depth,
    occlusion and performance before a real Overture extract is checked in.
    """
    blocks: list[dict[str, Any]] = []
    rows = [
        (-1320, [-440, -260, -70, 130, 340, 520], [65, 105, 145, 90, 125, 58]),
        (-1100, [-390, -185, 20, 220, 430], [52, 115, 165, 76, 112]),
        (-880, [-420, -245, -55, 145, 325, 500], [58, 92, 138, 175, 103, 62]),
        (-650, [-365, -155, 55, 270, 470], [48, 125, 85, 148, 72]),
        (-430, [-320, -95, 120, 345], [42, 88, 118, 74]),
    ]
    idx = 1
    for y, xs, heights in rows:
        for x, h in zip(xs, heights):
            width = 92 + (idx % 4) * 18
            depth = 70 + (idx % 3) * 20
            blocks.append({
                "id": f"calibration-block-{idx:02d}",
                "name": None,
                "footprint": rect(x, y, width, depth, -8 + (idx % 5) * 4),
                "heightM": h,
                "heightSource": "rendering-hypothesis",
                "geometrySource": "procedural-calibration",
                "class": "background-massing",
            })
            idx += 1
    return blocks


def calibration_buildings() -> list[dict[str, Any]]:
    # Coordinates and heights for these towers are used only as skyline anchors.
    # Footprint dimensions/rotation are renderer hypotheses, not cadastral data.
    # Stage 8 adds the missing Barangaroo cluster and harbour-edge towers because
    # the Stage 5 fixture had only five named high-rise anchors and therefore
    # produced a visibly false low-rise waterfront silhouette.
    towers = [
        named_tower("crown-sydney", "One Barangaroo / Crown Sydney", 151.201050, -33.862354, 271.3, 62, 46, -10),
        named_tower("salesforce-tower", "Salesforce Tower", 151.208655, -33.862384, 263, 58, 48, 4),
        named_tower("one-sydney-harbour-1", "One Sydney Harbour Tower 1", 151.201760, -33.862772, 247, 54, 42, -12),
        named_tower("one-sydney-harbour-2", "One Sydney Harbour Tower 2", 151.201900, -33.863108, 230, 51, 40, -12),
        named_tower("international-towers-1", "International Towers Sydney Tower 1", 151.202100, -33.863880, 217, 78, 56, -8),
        named_tower("international-towers-2", "International Towers Sydney Tower 2", 151.202160, -33.864410, 178, 74, 54, -8),
        named_tower("international-towers-3", "International Towers Sydney Tower 3", 151.202240, -33.865110, 169, 72, 52, -8),
        named_tower("quay-quarter-tower", "Quay Quarter Tower", 151.211520, -33.862820, 216, 66, 54, 12),
        named_tower("governor-phillip-tower", "Governor Phillip Tower", 151.211283, -33.864018, 227, 55, 44, 8),
        named_tower("chifley-tower", "Chifley Tower", 151.21169711994, -33.865649836914, 244, 56, 44, 8),
        named_tower("deutsche-bank-place", "Deutsche Bank Place", 151.2118361, -33.8668167, 240, 54, 46, 6),
    ]
    return procedural_massing() + towers


def structures() -> list[dict[str, Any]]:
    opera_x, opera_y = local_xy(151.2152213360, -33.8566674153)
    tower_x, tower_y = local_xy(151.20886740087, -33.870473453925)
    return [
        {
            "id": "sydney-harbour-bridge",
            "type": "arch-bridge",
            "name": "Sydney Harbour Bridge",
            "x": 175.0,
            "y": 356.0,
            "z": 0,
            "rotationDeg": -25.3,
            "spanM": 503,
            "heightM": 134,
            "pylonHeightM": 89,
            "sourceClass": "official-dimension-plus-road-alignment-calibration",
        },
        {
            "id": "sydney-opera-house",
            "type": "opera-house",
            "name": "Sydney Opera House",
            "x": opera_x,
            "y": opera_y,
            "z": 0,
            "widthM": 120,
            "depthM": 185,
            "heightM": 65,
            "rotationDeg": -18,
            "sourceClass": "official-location-height-calibration",
        },
        {
            "id": "sydney-tower",
            "type": "observation-tower",
            "name": "Sydney Tower",
            "x": tower_x,
            "y": tower_y,
            "z": 0,
            "heightM": 309,
            "podHeightM": 260,
            "sourceClass": "published-height-calibration",
        },
    ]



def remove_duplicate_observation_towers(
    buildings: list[dict[str, Any]], landmark_structures: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[str]]:
    """Keep authored observation towers, not overlapping tall Overture tower parts.

    Restrict suppression to tall parts whose footprint centroid is immediately
    adjacent to a modelled observation tower. Retail podiums, notably Westfield
    Sydney beneath Sydney Tower, remain part of the sourced scene. This audit is
    reusable for other cities with authored observation-tower landmarks.
    """
    towers = [item for item in landmark_structures if item.get("type") == "observation-tower"]
    kept: list[dict[str, Any]] = []
    removed: list[str] = []
    for building in buildings:
        footprint = building.get("footprint") or []
        if not str(building.get("geometrySource", "")).startswith("overture-") or len(footprint) < 3:
            kept.append(building)
            continue
        cx = sum(p[0] for p in footprint) / len(footprint)
        cy = sum(p[1] for p in footprint) / len(footprint)
        if any(
            math.hypot(cx - float(tower["x"]), cy - float(tower["y"])) <= 20
            and float(building.get("heightM") or 0) >= float(tower["heightM"]) * 0.55
            for tower in towers
        ):
            removed.append(str(building["id"]))
        else:
            kept.append(building)
    return kept, removed


def repair_landmark_overlaps(bundle: dict[str, Any]) -> list[str]:
    """Apply the same landmark audit to existing exports or newly acquired data."""
    original = bundle["buildings"]
    buildings, removed = remove_duplicate_observation_towers(original, bundle["structures"])
    bundle["buildings"] = buildings
    profile = bundle["profile"]
    old_removed = profile.get("landmarkDuplicateRemovedIds", [])
    all_removed = list(dict.fromkeys([*old_removed, *removed]))
    profile["landmarkDuplicateRemovalCount"] = len(all_removed)
    profile["landmarkDuplicateRemovedIds"] = all_removed
    profile["buildingCount"] = len(buildings)
    # Export counts refer to visible geometry. Input counts remain unchanged.
    profile["buildingPartCount"] = sum(item.get("geometrySource") == "overture-building-part" for item in buildings)
    profile["directHeightCount"] = sum(item.get("heightSource") == "overture-height" for item in buildings)
    profile["floorFallbackCount"] = sum(str(item.get("heightSource", "")).startswith("overture-floors") for item in buildings)
    profile["defaultHeightCount"] = sum(str(item.get("heightSource", "")).startswith("renderer-fallback") for item in buildings)
    profile["verticesAfterSimplification"] = sum(len(item["footprint"]) for item in buildings)
    note = "suppress tall Overture parts overlapping authored observation towers; preserve surrounding podiums"
    transformations = bundle["city"].setdefault("transformations", [])
    if note not in transformations:
        transformations.append(note)
    return removed


def normalise_height(props: dict[str, Any]) -> tuple[float, str]:
    value = props.get("height")
    if isinstance(value, (int, float)) and value > 0:
        return float(value), "overture-height"
    floors = props.get("num_floors")
    if isinstance(floors, (int, float)) and floors > 0:
        return float(floors) * 3.2, "overture-floors-x-3.2m"
    return 18.0, "renderer-fallback-18m"


def features_from_geojson(path: Path) -> list[dict[str, Any]]:
    """Read official Overture CLI/API GeoJSON or newline-delimited GeoJSONSeq."""
    content = path.read_text(encoding="utf-8")
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return [json.loads(line.lstrip("\x1e")) for line in content.splitlines() if line.strip().lstrip("\x1e").strip()]
    if isinstance(parsed, dict) and parsed.get("type") == "FeatureCollection":
        return parsed.get("features") or []
    if isinstance(parsed, dict) and parsed.get("type") == "Feature":
        return [parsed]
    if isinstance(parsed, list):
        return parsed
    raise ValueError(f"Expected GeoJSON FeatureCollection or GeoJSONSeq: {path}")


def overture_buildings(
    path: Path, simplify_m: float, parts_path: Path | None = None,
    bbox_wgs84: list[float] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Project bounded Overture buildings and optional building parts into local metres.

    Only official source geometries become browser buildings. Parent prisms are
    omitted when matching usable parts exist, avoiding duplicate full-height
    walls around segmented towers. Part height is treated as a rise ABOVE
    min_height, following the v2.0 BuildingPart definition.
    """
    if simplify_m < 0 or simplify_m > 20:
        raise ValueError("Footprint simplification must be between 0 and 20 metres")
    source_buildings = features_from_geojson(path)
    source_parts = features_from_geojson(parts_path) if parts_path else []
    if not source_buildings:
        raise ValueError("No real Overture buildings found. Refusing to replace the calibration city.")

    clip_wgs84 = box(*(bbox_wgs84 or SCENE_BBOX_WGS84))
    def project_geom(x: float, y: float, z: float | None = None):
        e, n = WGS84_TO_MGA56.transform(x, y)
        return (e - ORIGIN_E, n - ORIGIN_N) if z is None else (e - ORIGIN_E, n - ORIGIN_N, z)

    output: list[dict[str, Any]] = []
    vertices_for_item: dict[str, tuple[int, int]] = {}
    children: dict[str, list[dict[str, Any]]] = {}
    counts = {
        "inputBuildingCount": len(source_buildings),
        "inputPartCount": len(source_parts),
        "buildingPartCount": 0,
        "parentBuildingsWithParts": 0,
        "directHeightCount": 0,
        "floorFallbackCount": 0,
        "defaultHeightCount": 0,
        "verticesBeforeSimplification": 0,
        "verticesAfterSimplification": 0,
        "skippedInvalidCount": 0,
    }

    def converted(feature: dict[str, Any], part: bool) -> list[dict[str, Any]]:
        props = feature.get("properties") or {}
        geometry = feature.get("geometry")
        if props.get("is_underground") or not geometry or geometry.get("type") not in {"Polygon", "MultiPolygon"}:
            counts["skippedInvalidCount"] += 1
            return []
        try:
            raw_shape = shape(geometry)
            # Clipping is important: a bounded download may return complete
            # footprints that extend well beyond our intended Sydney slice.
            raw_shape = raw_shape.intersection(clip_wgs84)
            if raw_shape.is_empty:
                return []
            projected = shapely_transform(project_geom, raw_shape)
        except Exception:
            counts["skippedInvalidCount"] += 1
            return []
        polygons = list(projected.geoms) if isinstance(projected, MultiPolygon) else [projected]
        height, height_source = normalise_height(props)
        base_z = 0.0
        if part:
            min_height = props.get("min_height")
            min_floor = props.get("min_floor")
            if isinstance(min_height, (float, int)) and math.isfinite(min_height) and min_height >= 0:
                base_z = float(min_height)
            elif isinstance(min_floor, (float, int)) and min_floor > 0:
                base_z = float(min_floor) * 3.2
            height += base_z
        if not math.isfinite(height) or height <= base_z or height > 900 or base_z > 900:
            counts["skippedInvalidCount"] += 1
            return []
        fid = str(feature.get("id") or props.get("id") or f"feature-{len(output)}")
        records: list[dict[str, Any]] = []
        for index, polygon in enumerate(polygons):
            if not isinstance(polygon, Polygon) or polygon.area < 16:
                continue
            before = len(polygon.exterior.coords) - 1
            simplified = polygon.simplify(simplify_m, preserve_topology=True) if simplify_m else polygon
            if simplified.is_empty or not isinstance(simplified, Polygon):
                simplified = polygon
            coords = [[round(x, 1), round(y, 1)] for x, y in list(simplified.exterior.coords)[:-1]]
            if len(set(map(tuple, coords))) < 3:
                continue
            rendered_id = f"{fid}-{index}" if len(polygons) > 1 else fid
            vertices_for_item[rendered_id] = (before, len(coords))
            item = {
                "id": rendered_id,
                "name": (props.get("names") or {}).get("primary") if isinstance(props.get("names"), dict) else None,
                "footprint": coords,
                "heightM": round(height, 1),
                "heightSource": height_source,
                "geometrySource": "overture-building-part" if part else "overture-building",
                "class": (props.get("class") or "building-part") if part else (props.get("class") or "building"),
            }
            if part and base_z > 0:
                item["minHeightM"] = round(base_z, 1)
            records.append(item)
        return records

    for feature in source_parts:
        props = feature.get("properties") or {}
        parent_id = props.get("building_id")
        if not parent_id: continue
        records = converted(feature, True)
        if records: children.setdefault(str(parent_id), []).extend(records)

    for feature in source_buildings:
        fid = str(feature.get("id") or (feature.get("properties") or {}).get("id") or "")
        parent_records = converted(feature, False)
        if not parent_records: continue
        # Keep the Overture parent (not a guessed rectangle) if parts have gaps,
        # but omit the parent from the rendered group where supported parts exist.
        # The bounding source may contain parent buildings missing their parts.
        if fid in children:
            output.extend(children[fid])
            counts["parentBuildingsWithParts"] += 1
            counts["buildingPartCount"] += len(children[fid])
        else:
            output.extend(parent_records)

    # Recompute counts for the final browser export, not unrendered parent features.
    counts["verticesBeforeSimplification"] = sum(vertices_for_item[b["id"]][0] for b in output)
    counts["verticesAfterSimplification"] = sum(vertices_for_item[b["id"]][1] for b in output)
    counts["directHeightCount"] = sum(b["heightSource"] == "overture-height" for b in output)
    counts["floorFallbackCount"] = sum(b["heightSource"].startswith("overture-floors") for b in output)
    counts["defaultHeightCount"] = len(output) - counts["directHeightCount"] - counts["floorFallbackCount"]
    if not output:
        raise ValueError("Overture source did not contain any usable Sydney building polygons")
    return output, counts



LANE_CATEGORY_BY_CODE = {0: "unknown", 1: "one", 2: "two-or-more"}
ROAD_ON_TYPE_BY_CODE = {1: "ground", 2: "bridge", 3: "tunnel"}
MOTOR_ROAD_CLASSES = {
    "motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link",
    "secondary", "secondary_link", "tertiary", "tertiary_link", "unclassified",
    "residential", "living_street", "service", "pedestrian",
}


def _normalise_name(value: str | None) -> str:
    return " ".join((value or "").lower().replace(".", "").split())


def _road_name(props: dict[str, Any]) -> str | None:
    pieces = [props.get("roadnamebase"), props.get("roadnametype"), props.get("roadnamesuffix")]
    value = " ".join(str(piece).strip() for piece in pieces if piece not in (None, ""))
    return value or None


def _parse_positive_int(value: Any) -> int | None:
    try:
        parsed = int(str(value).strip())
    except (TypeError, ValueError):
        return None
    return parsed if 0 < parsed < 30 else None


def _parse_width_m(value: Any) -> float | None:
    if value in (None, ""):
        return None
    import re
    match = re.search(r"[-+]?\d+(?:\.\d+)?", str(value))
    if not match:
        return None
    parsed = float(match.group(0))
    return parsed if 1.5 <= parsed <= 60 else None


def _display_width(lane_exact: int | None, lane_category: str, hierarchy: int | None, osm_width: float | None) -> tuple[float, str]:
    if osm_width is not None:
        return round(osm_width, 1), "osm-width"
    if lane_exact is not None:
        return round(max(3.2, lane_exact * 3.2), 1), "osm-lanes-x-3.2m-rendering-estimate"
    if lane_category == "one":
        return 3.6, "nsw-one-lane-rendering-estimate"
    if lane_category == "two-or-more":
        estimates = {1: 18.0, 2: 14.0, 3: 12.0, 4: 10.0, 5: 8.0, 6: 7.0}
        return estimates.get(hierarchy or 99, 7.0), "nsw-lane-category-and-hierarchy-rendering-estimate"
    estimates = {1: 18.0, 2: 14.0, 3: 11.0, 4: 9.0, 5: 7.0, 6: 6.0}
    return estimates.get(hierarchy or 99, 6.0), "road-hierarchy-rendering-estimate"


def osm_transport(path: Path | None) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Read a bounded Overpass JSON extract for lane/width enrichment and point controls."""
    if not path:
        return [], []
    data = json.loads(path.read_text(encoding="utf-8"))
    ways: list[dict[str, Any]] = []
    points: list[dict[str, Any]] = []
    for element in data.get("elements", []):
        tags = element.get("tags") or {}
        if element.get("type") == "way" and tags.get("highway") in MOTOR_ROAD_CLASSES:
            geometry = element.get("geometry") or []
            coords = [local_xy(float(item["lon"]), float(item["lat"])) for item in geometry if "lon" in item and "lat" in item]
            if len(coords) < 2:
                continue
            lane_exact = _parse_positive_int(tags.get("lanes"))
            if lane_exact is None:
                forward = _parse_positive_int(tags.get("lanes:forward"))
                backward = _parse_positive_int(tags.get("lanes:backward"))
                if forward is not None and backward is not None:
                    lane_exact = forward + backward
            ways.append({
                "id": str(element.get("id")),
                "name": tags.get("name"),
                "normalisedName": _normalise_name(tags.get("name")),
                "points": [[round(x, 1), round(y, 1)] for x, y in coords],
                "laneCountExact": lane_exact,
                "widthM": _parse_width_m(tags.get("width")),
                "roadClass": tags.get("highway"),
                "onType": "tunnel" if tags.get("tunnel") not in (None, "no") else ("bridge" if tags.get("bridge") not in (None, "no") else "ground"),
            })
        elif element.get("type") == "node" and "lat" in element and "lon" in element:
            point_type = None
            if tags.get("highway") == "traffic_signals":
                point_type = "traffic-signal"
            elif tags.get("highway") == "crossing":
                point_type = "crossing"
            if point_type:
                x, y = local_xy(float(element["lon"]), float(element["lat"]))
                points.append({
                    "id": f"osm-{element.get('id')}", "type": point_type, "name": tags.get("name"),
                    "x": x, "y": y, "z": 0.0, "sourceClass": "openstreetmap",
                })
    return ways, points


def _project_line_geometry(geometry: dict[str, Any], clip_wgs84, simplify_m: float) -> list[LineString]:
    def project_geom(x: float, y: float, z: float | None = None):
        e, n = WGS84_TO_MGA56.transform(x, y)
        return (e - ORIGIN_E, n - ORIGIN_N) if z is None else (e - ORIGIN_E, n - ORIGIN_N, z)
    raw = shape(geometry).intersection(clip_wgs84)
    if raw.is_empty:
        return []
    projected = shapely_transform(project_geom, raw)
    lines = list(projected.geoms) if isinstance(projected, MultiLineString) else [projected]
    output = []
    for line in lines:
        if not isinstance(line, LineString) or line.length < 3:
            continue
        simplified = line.simplify(simplify_m, preserve_topology=True) if simplify_m else line
        if isinstance(simplified, LineString) and len(simplified.coords) >= 2:
            output.append(simplified)
    return output


def transport_network(roads_path: Path | None, osm_path: Path | None, simplify_m: float = 0.35,
                      bbox_wgs84: list[float] | None = None) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, int]]:
    """Map Australian road sources into a city-agnostic browser transport contract."""
    osm_ways, transport_points = osm_transport(osm_path)
    osm_by_name: dict[str, list[dict[str, Any]]] = {}
    for way in osm_ways:
        if way["normalisedName"]:
            osm_by_name.setdefault(way["normalisedName"], []).append(way)

    roads: list[dict[str, Any]] = []
    clip_wgs84 = box(*(bbox_wgs84 or SCENE_BBOX_WGS84))
    source_features = features_from_geojson(roads_path) if roads_path else []

    if source_features:
        for feature in source_features:
            geometry = feature.get("geometry")
            props = feature.get("properties") or {}
            if not geometry or geometry.get("type") not in {"LineString", "MultiLineString"}:
                continue
            try:
                lines = _project_line_geometry(geometry, clip_wgs84, simplify_m)
            except Exception:
                continue
            name = _road_name(props)
            normalised = _normalise_name(name)
            hierarchy = props.get("functionhierarchy") if isinstance(props.get("functionhierarchy"), (int, float)) else None
            lane_category = LANE_CATEGORY_BY_CODE.get(int(props.get("lanecount") or 0), "unknown")
            on_type = ROAD_ON_TYPE_BY_CODE.get(int(props.get("roadontype") or 0), "unknown")
            fid = str(feature.get("id") or props.get("objectid") or props.get("OBJECTID") or props.get("shapeuuid") or f"road-{len(roads)+1}")
            for index, line in enumerate(lines):
                match = None
                if normalised and normalised in osm_by_name:
                    best_distance = float("inf")
                    for candidate in osm_by_name[normalised]:
                        candidate_line = LineString(candidate["points"])
                        distance = line.distance(candidate_line)
                        if distance < best_distance and distance <= 18:
                            match, best_distance = candidate, distance
                lane_exact = match.get("laneCountExact") if match else None
                osm_width = match.get("widthM") if match else None
                display_width, width_source = _display_width(lane_exact, lane_category, int(hierarchy) if hierarchy is not None else None, osm_width)
                points = [[round(x, 1), round(y, 1)] for x, y in line.coords]
                roads.append({
                    "id": f"{fid}-{index}" if len(lines) > 1 else fid,
                    "name": name,
                    "points": points,
                    "roadClass": match.get("roadClass") if match else None,
                    "functionHierarchy": int(hierarchy) if hierarchy is not None else None,
                    "onType": on_type,
                    "surfaceCode": int(props["surface"]) if isinstance(props.get("surface"), (int, float)) else None,
                    "laneCategory": lane_category,
                    "laneCountExact": lane_exact,
                    "laneSource": "openstreetmap-lanes" if lane_exact is not None else "nsw-lanecount-category",
                    "displayWidthM": display_width,
                    "widthSource": width_source,
                    "sourceClass": "nsw-transport-theme-road-segment",
                })
    elif osm_ways:
        for way in osm_ways:
            lane_exact = way.get("laneCountExact")
            display_width, width_source = _display_width(lane_exact, "unknown", None, way.get("widthM"))
            roads.append({
                "id": f"osm-way-{way['id']}", "name": way.get("name"), "points": way["points"],
                "roadClass": way.get("roadClass"), "functionHierarchy": None, "onType": way.get("onType", "unknown"),
                "surfaceCode": None, "laneCategory": "unknown", "laneCountExact": lane_exact,
                "laneSource": "openstreetmap-lanes" if lane_exact is not None else None,
                "displayWidthM": display_width, "widthSource": width_source, "sourceClass": "openstreetmap",
            })

    endpoint_groups: dict[tuple[int, int], dict[str, Any]] = {}
    for road in roads:
        if len(road["points"]) < 2:
            continue
        for point in (road["points"][0], road["points"][-1]):
            key = (round(point[0] / 2), round(point[1] / 2))
            group = endpoint_groups.setdefault(key, {"x": [], "y": [], "roads": set()})
            group["x"].append(point[0]); group["y"].append(point[1]); group["roads"].add(road["id"])
    for key, group in endpoint_groups.items():
        if len(group["roads"]) >= 3:
            transport_points.append({
                "id": f"junction-{key[0]}-{key[1]}", "type": "junction", "name": None,
                "x": round(sum(group["x"]) / len(group["x"]), 1), "y": round(sum(group["y"]) / len(group["y"]), 1),
                "z": 0.0, "sourceClass": "derived-road-topology",
            })

    profile = {
        "inputRoadCount": len(source_features), "roadCount": len(roads),
        "namedRoadCount": sum(bool(road.get("name")) for road in roads),
        "exactLaneCount": sum(road.get("laneCountExact") is not None for road in roads),
        "laneCategoryKnownCount": sum(road.get("laneCategory") != "unknown" for road in roads),
        "roadVertexCount": sum(len(road.get("points") or []) for road in roads),
        "junctionCount": sum(point["type"] == "junction" for point in transport_points),
        "trafficSignalCount": sum(point["type"] == "traffic-signal" for point in transport_points),
        "crossingCount": sum(point["type"] == "crossing" for point in transport_points),
    }
    return roads, transport_points, profile


def apply_road_clearance(buildings: list[dict[str, Any]], roads: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Prevent ground-road/building overlap without altering real source geometry."""
    empty_profile = {"roadConflictCount": 0, "roadClearedCalibrationCount": 0,
                     "roadHiddenBuildingCount": 0, "roadAuditErrorCount": 0}
    ground_buffers = []
    for road in roads:
        if road.get("onType") != "ground" or len(road.get("points") or []) < 2:
            continue
        try:
            buffer = LineString(road["points"]).buffer(
                float(road.get("displayWidthM") or 6) / 2 + 0.75,
                cap_style=2, join_style=2,
            )
            if not buffer.is_empty and buffer.area > 0:
                ground_buffers.append(buffer)
        except (ValueError, TypeError, GEOSException):
            # A malformed segment cannot be used in the clearance audit.
            continue
    if not ground_buffers:
        return buildings, empty_profile

    # Never union the entire city road network. That was both expensive for the
    # expanded extract and vulnerable to a single GEOS topology failure. The
    # spatial index restricts each overlay to nearby road segments.
    index = STRtree(ground_buffers)
    by_identity = {id(geom): geom for geom in ground_buffers}  # Shapely 1.x query compatibility
    result = []
    conflicts = cleared = hidden = errors = 0
    error_sample_ids: list[str] = []
    for building in buildings:
        item = dict(building)
        if float(item.get("minHeightM") or 0) >= 4.5:
            result.append(item); continue
        try:
            polygon = Polygon(item["footprint"])
            if polygon.is_empty or polygon.area <= 0:
                raise ValueError("Empty or zero-area footprint")
            # Repair only the temporary *audit* shape. Keep the real Overture
            # footprint byte-for-byte unchanged in the browser export.
            audit_polygon = polygon if polygon.is_valid else make_valid(polygon)
            if audit_polygon.is_empty or audit_polygon.area <= 0:
                raise ValueError("No usable polygon area for the clearance audit")
            matches = index.query(audit_polygon)
            candidates = [
                ground_buffers[int(hit)] if isinstance(hit, Integral)
                else by_identity[id(hit)] for hit in matches
            ]
            if not candidates:
                result.append(item); continue
            corridor = unary_union(candidates) if len(candidates) > 1 else candidates[0]
            overlap = audit_polygon.intersection(corridor).area
        except (ValueError, TypeError, KeyError, GEOSException):
            # A bad source ring or GEOS overlay must not abort the entire city
            # export or silently certify a building as clear. Flag it for
            # review; the renderer already withholds roadConflict buildings.
            item["roadConflict"] = True
            item["roadAuditError"] = True
            conflicts += 1
            hidden += 1
            errors += 1
            if len(error_sample_ids) < 10:
                error_sample_ids.append(str(item.get("id", "unknown")))
            result.append(item)
            continue
        threshold = max(3.0, polygon.area * 0.025)
        if overlap <= threshold:
            result.append(item); continue
        conflicts += 1
        if str(item.get("geometrySource", "")).startswith("procedural-calibration"):
            remaining = audit_polygon.difference(corridor)
            candidates = list(remaining.geoms) if isinstance(remaining, MultiPolygon) else [remaining]
            candidates = [candidate for candidate in candidates if isinstance(candidate, Polygon) and candidate.area >= 16]
            if candidates:
                best = max(candidates, key=lambda candidate: candidate.area)
                if best.area >= polygon.area * 0.45:
                    item["footprint"] = [[round(x, 1), round(y, 1)] for x, y in list(best.exterior.coords)[:-1]]
                    item["geometrySource"] = f"{item['geometrySource']}-road-cleared"
                    item["roadClearanceAdjusted"] = True
                    cleared += 1
                    result.append(item)
                    continue
        item["roadConflict"] = True
        item["roadConflictAreaM2"] = round(overlap, 1)
        hidden += 1
        result.append(item)
    return result, {"roadConflictCount": conflicts, "roadClearedCalibrationCount": cleared,
                    "roadHiddenBuildingCount": hidden, "roadAuditErrorCount": errors,
                    "roadAuditErrorSampleIds": error_sample_ids}

def build_bundle(
    overture_path: Path | None,
    simplify_m: float,
    overture_release: str | None = None,
    overture_retrieved_at: str | None = None,
    parts_path: Path | None = None,
    roads_path: Path | None = None,
    roads_retrieved_at: str | None = None,
    osm_transport_path: Path | None = None,
    osm_retrieved_at: str | None = None,
    extent: str = "cbd",
) -> dict[str, Any]:
    bbox_wgs84 = scene_bbox(extent)
    if overture_path:
        buildings, profile = overture_buildings(overture_path, simplify_m, parts_path, bbox_wgs84)
        geometry_mode = "overture-prototype"
        source_note = "Real Overture footprint and building-part geometry with sourced or identified fallback heights; landmark models are schematic, and land requires a separate OSM coastline pass."
    else:
        buildings = calibration_buildings()
        profile = {
            "directHeightCount": 0,
            "floorFallbackCount": 0,
            "defaultHeightCount": 0,
            "verticesBeforeSimplification": sum(len(item["footprint"]) for item in buildings),
            "verticesAfterSimplification": sum(len(item["footprint"]) for item in buildings),
        }
        geometry_mode = "procedural-calibration"
        source_note = "Calibration fallback, not a real building extract. Published-height/coordinate anchors now include the Barangaroo and Circular Quay high-rise clusters; ordinary background massing and footprint sizes remain rendering hypotheses; land needs the separate coastline pass."

    roads, transport_points, road_profile = transport_network(roads_path, osm_transport_path, bbox_wgs84=bbox_wgs84)
    buildings, conflict_profile = apply_road_clearance(buildings, roads)

    all_x = [p[0] for b in buildings for p in b["footprint"]]
    all_y = [p[1] for b in buildings for p in b["footprint"]]
    all_x.extend(point[0] for road in roads for point in road.get("points", []))
    all_y.extend(point[1] for road in roads for point in road.get("points", []))
    for structure in structures():
        all_x.append(float(structure["x"]))
        all_y.append(float(structure["y"]))

    bundle = {
        "schemaVersion": "0.3.0",
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "city": {
            "id": "sydney",
            "name": "Sydney",
            "country": "Australia",
            "geometryMode": geometry_mode,
            "sourceNote": source_note,
            "sourceCrs": "EPSG:4326",
            "processingCrs": "EPSG:7856",
            "localAxes": {"x": "east", "y": "north", "z": "up", "unit": "metre"},
            "origin": {
                "label": "Sydney Harbour Bridge Heritage NSW location",
                "longitude": ORIGIN_LON,
                "latitude": ORIGIN_LAT,
                "easting": round(ORIGIN_E, 3),
                "northing": round(ORIGIN_N, 3),
            },
            "sceneBboxWgs84": bbox_wgs84,
            "sceneExtent": extent,
            "transformations": [
                "project EPSG:4326 geometry to EPSG:7856",
                "subtract local Harbour Bridge origin",
                "simplify Overture footprints when real source data is supplied",
                "retain heights in metres with labelled fallbacks",
                "project road centrelines through the same EPSG:7856 local-metre transform",
                "audit ground-road corridors against building footprints before browser export",
            ],
        },
        "sources": [
            {"id": "overture-buildings", "release": overture_release if overture_path else None, "retrievedAt": overture_retrieved_at, "licence": "ODbL-1.0", "used": bool(overture_path)},
            {"id": "overture-building-parts", "release": overture_release if parts_path else None, "retrievedAt": overture_retrieved_at if parts_path else None, "licence": "ODbL-1.0", "used": bool(parts_path)},
            {"id": "nsw-road-segment", "retrievedAt": roads_retrieved_at if roads_path else None, "licence": "CC BY (TfNSW catalogue)", "used": bool(roads_path)},
            {"id": "openstreetmap-transport", "retrievedAt": osm_retrieved_at if osm_transport_path else None, "licence": "ODbL-1.0", "used": bool(osm_transport_path), "role": "exact lane/width enrichment and traffic signal/crossing points; fallback road geometry when NSW roads are unavailable"},
            {"id": "heritage-nsw-opera-house", "role": "location/scale reference", "used": True},
            {"id": "heritage-nsw-harbour-bridge", "role": "location/scale reference", "used": True},
            {"id": "sydney-tower-eye", "role": "height reference", "used": True},
            {"id": "cvu-tall-building-calibration", "role": "secondary height and harbour-front skyline calibration", "used": not bool(overture_path)},
{"id": "stage5-procedural-calibration", "role": "renderer hypothesis for landmarks; separate OSM coastline pass supplies land", "licence": "original project geometry", "used": True},
        ],
        "bounds": {
            "minX": round(min(all_x) - 220, 1),
            "maxX": round(max(all_x) + 420, 1),
            "minY": round(min(all_y) - 220, 1),
            "maxY": round(max(all_y) + 220, 1),
            "maxZ": 340.0,
        },
        "water": {
            "sourceClass": "none-awaiting-coastline-land-mesh",
            "polygons": [],
        },
        "roads": roads,
        "transportPoints": transport_points,
        "buildings": buildings,
        "structures": structures(),
        "launchSites": [
            {"id": "harbour-east", "label": "SYDNEY HARBOUR", "x": 340.0, "y": -80.0, "z": 0.0},
        ],
        "profile": {
            "buildingCount": len(buildings),
            **profile,
            "waterVertexCount": 0,
            "structureCount": len(structures()),
            "simplificationToleranceM": simplify_m if overture_path else 0,
            "geometryIsMeasured": bool(overture_path),
            **road_profile,
            **conflict_profile,
        },
    }
    repair_landmark_overlaps(bundle)
    return bundle


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--overture", type=Path, help="Path to a clipped Overture building GeoJSON download")
    parser.add_argument("--building-parts", type=Path, help="Optional bounded Overture building_part GeoJSON or GeoJSONSeq")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--extent", choices=SCENE_EXTENTS_WGS84, default="cbd", help="The bounds of the raw inputs; defaults to the original CBD slice")
    parser.add_argument("--repair-existing", action="store_true", help="Correct the existing browser bundle without access to raw source extracts")
    parser.add_argument("--simplify-m", type=float, default=1.25)
    parser.add_argument("--overture-release", help="Exact Overture release used for --overture input, for example 2026-09-23.1")
    parser.add_argument("--overture-retrieved-at", help="Retrieval date for --overture input in YYYY-MM-DD format")
    parser.add_argument("--roads", type=Path, help="Optional bounded NSW RoadSegment GeoJSON")
    parser.add_argument("--roads-retrieved-at", help="Retrieval date for --roads input in YYYY-MM-DD format")
    parser.add_argument("--osm-transport", type=Path, help="Optional bounded Overpass JSON for exact lanes, signals and crossings")
    parser.add_argument("--osm-retrieved-at", help="Retrieval date for --osm-transport input in YYYY-MM-DD format")
    args = parser.parse_args()

    if args.overture and not args.overture.exists():
        raise SystemExit(f"Overture input not found: {args.overture}")
    if args.building_parts and not args.overture:
        raise SystemExit("--building-parts requires --overture")
    if args.building_parts and not args.building_parts.exists():
        raise SystemExit(f"Building-parts input not found: {args.building_parts}")
    if args.overture and not args.overture_release:
        raise SystemExit("--overture-release is required with --overture so provenance cannot drift")
    if args.overture and not args.overture_retrieved_at:
        raise SystemExit("--overture-retrieved-at is required with --overture so provenance records acquisition date")
    if args.roads and not args.roads.exists():
        raise SystemExit(f"Road input not found: {args.roads}")
    if args.roads and not args.roads_retrieved_at:
        raise SystemExit("--roads-retrieved-at is required with --roads")
    if args.osm_transport and not args.osm_transport.exists():
        raise SystemExit(f"OSM transport input not found: {args.osm_transport}")
    if args.osm_transport and not args.osm_retrieved_at:
        raise SystemExit("--osm-retrieved-at is required with --osm-transport")

    if args.repair_existing:
        if args.extent != "cbd":
            raise SystemExit("--extent does not apply to --repair-existing; it retains the current stored bounds")
        if any((args.overture, args.building_parts, args.roads, args.osm_transport)):
            raise SystemExit("--repair-existing only accepts --output; do not combine with raw source arguments")
        if not args.output.exists():
            raise SystemExit(f"Existing browser bundle not found: {args.output}")
        bundle = json.loads(args.output.read_text(encoding="utf-8"))
        if bundle.get("city", {}).get("id") != "sydney":
            raise SystemExit("--repair-existing expects the existing Sydney city bundle")
        removed = repair_landmark_overlaps(bundle)
        bundle["generatedAt"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        print(f"Removed {len(removed)} duplicate observation-tower building parts: {removed}")
    else:
        bundle = build_bundle(
            args.overture, args.simplify_m, args.overture_release, args.overture_retrieved_at, args.building_parts,
            args.roads, args.roads_retrieved_at, args.osm_transport, args.osm_retrieved_at,
            args.extent,
        )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    bundle["profile"]["outputByteSize"] = 0
    while True:
        text = json.dumps(bundle, separators=(",", ":"), ensure_ascii=False) + "\n"
        byte_size = len(text.encode("utf-8"))
        if bundle["profile"]["outputByteSize"] == byte_size:
            break
        bundle["profile"]["outputByteSize"] = byte_size
    args.output.write_text(text, encoding="utf-8")
    print(f"Wrote {args.output}")
    print(json.dumps(bundle["profile"], indent=2))
    print(f"Bytes: {byte_size}")


if __name__ == "__main__":
    main()
