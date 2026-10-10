#!/usr/bin/env python3
"""Acquire bounded Sydney streets/transport controls and merge them into the city bundle.

This is a manual network-requiring preprocessing command. It uses NSW Spatial
Services RoadSegment as the Australia-first road centreline source and a bounded
OpenStreetMap Overpass extract for exact lane tags (where present), traffic
signals and street crossings. It never runs in Astro or in the browser.
"""
from __future__ import annotations

import gzip
import hashlib
import json
import time
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from prepare_sydney_city import (
    DEFAULT_OUTPUT,
    ROOT,
    SCENE_BBOX_WGS84,
    apply_road_clearance,
    transport_network,
)

RAW = ROOT / "data/raw/fireworks-simulator/sydney"
NSW_ROADS_QUERY = "https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/FeatureServer/5/query"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def download_nsw_roads(path: Path, bbox: list[float] | None = None) -> None:
    """Download bounded NSW RoadSegment features in WGS84 GeoJSON pages."""
    features: list[dict] = []
    offset = 0
    page_size = 2000
    bbox = bbox or SCENE_BBOX_WGS84
    while True:
        params = {
            "where": "1=1",
            "geometry": ",".join(str(value) for value in bbox),
            "geometryType": "esriGeometryEnvelope",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
            "outFields": "objectid,roadnamebase,roadnametype,roadnamesuffix,functionhierarchy,roadontype,surface,lanecount,shapeuuid",
            "returnGeometry": "true",
            "outSR": "4326",
            "orderByFields": "objectid",
            "resultOffset": str(offset),
            "resultRecordCount": str(page_size),
            "f": "geojson",
        }
        request = Request(f"{NSW_ROADS_QUERY}?{urlencode(params)}", headers={"User-Agent": "marklee.au-fireworks-data-prep/1.0"})
        with urlopen(request, timeout=60) as response:
            page = json.load(response)
        batch = page.get("features") or []
        features.extend(batch)
        if len(batch) < page_size:
            break
        offset += len(batch)
        if offset > 50000:
            raise RuntimeError("Unexpectedly large Sydney RoadSegment response; refusing an unbounded download")
    if not features:
        raise RuntimeError("NSW Spatial Services returned no RoadSegment features in the Sydney scene bounds")
    path.write_text(json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")), encoding="utf-8")
    print(f"Downloaded {len(features)} bounded NSW RoadSegment features", flush=True)


def _transport_tile_query(bounds: list[float]) -> str:
    west, south, east, north = bounds
    bbox = f"{south:.7f},{west:.7f},{north:.7f},{east:.7f}"
    return f'''[out:json][timeout:60];
(
  way["highway"]({bbox});
  node["highway"="traffic_signals"]({bbox});
  node["highway"="crossing"]({bbox});
);
out body geom;'''


def _query_transport_tile(bounds: list[float]) -> dict:
    """One bounded Overpass query. Transient failures are handled by caller."""
    request = Request(
        OVERPASS_URL,
        data=urlencode({"data": _transport_tile_query(bounds)}).encode("utf-8"),
        headers={"User-Agent": "marklee.au-fireworks-data-prep/1.0", "Content-Type": "application/x-www-form-urlencoded"},
    )
    with urlopen(request, timeout=95) as response:
        result = json.load(response)
    if not isinstance(result, dict) or not isinstance(result.get("elements"), list):
        raise RuntimeError("Invalid Overpass transport response")
    if result.get("remark"):
        raise RuntimeError("Overpass transport query failed: " + str(result["remark"])[:280])
    return result


def _split_bbox(bounds: list[float]) -> list[list[float]]:
    west, south, east, north = bounds
    mid_lon = (west + east) / 2
    mid_lat = (south + north) / 2
    return [
        [west, south, mid_lon, mid_lat], [mid_lon, south, east, mid_lat],
        [west, mid_lat, mid_lon, north], [mid_lon, mid_lat, east, north],
    ]


def _cached_tile(bounds: list[float], cache_dir: Path | None, depth: int = 0) -> list[dict]:
    signature = hashlib.sha256(json.dumps(bounds, separators=(",", ":")).encode("utf-8")).hexdigest()[:18]
    tile_path = cache_dir / f"overpass-{signature}.json" if cache_dir else None
    split_marker = cache_dir / f"overpass-{signature}.split.json" if cache_dir else None
    if tile_path and tile_path.is_file():
        try:
            saved = json.loads(tile_path.read_text(encoding="utf-8"))
            if saved.get("bounds") == bounds and isinstance(saved.get("elements"), list):
                print(f"Reusing OSM tile {signature}: {len(saved['elements']):,} elements", flush=True)
                return saved["elements"]
        except (ValueError, OSError, AttributeError):
            pass
    # If the parent request already proved too large, resume its children
    # directly rather than timing out at the same parent again.
    if split_marker and split_marker.is_file() and depth < 2:
        try:
            saved = json.loads(split_marker.read_text(encoding="utf-8"))
            if saved.get("bounds") == bounds:
                return _combine_split_tiles(bounds, cache_dir, depth, tile_path)
        except (ValueError, OSError, AttributeError):
            pass

    for attempt in range(3):
        try:
            data = _query_transport_tile(bounds)
            elements = data["elements"]
            if tile_path:
                cache_dir.mkdir(parents=True, exist_ok=True)
                tmp = tile_path.with_name(tile_path.name + ".partial")
                tmp.write_text(json.dumps({"bounds": bounds, "elements": elements}, separators=(",", ":")), encoding="utf-8")
                tmp.replace(tile_path)
            print(f"Downloaded OSM transport tile {signature}: {len(elements):,} elements", flush=True)
            return elements
        except HTTPError as exc:
            if exc.code not in {429, 502, 503, 504}:
                raise
            if exc.code == 504 and depth < 2:
                print(f"Overpass tile timed out; splitting bbox {bounds} into four smaller requests", flush=True)
                if split_marker:
                    cache_dir.mkdir(parents=True, exist_ok=True)
                    split_marker.write_text(json.dumps({"bounds": bounds}), encoding="utf-8")
                return _combine_split_tiles(bounds, cache_dir, depth, tile_path)
            if attempt == 2:
                raise RuntimeError(f"Overpass HTTP {exc.code} for tile {bounds}; completed tiles are cached. Retry later") from exc
        except (URLError, TimeoutError, ConnectionError) as exc:
            if attempt == 2:
                raise RuntimeError(f"Overpass connection failed for tile {bounds}; completed tiles are cached. Retry later") from exc
        time.sleep(min(3 * (attempt + 1), 8))
    raise RuntimeError(f"Unable to download Overpass tile {bounds}")


def _combine_split_tiles(bounds: list[float], cache_dir: Path | None,
                         depth: int, tile_path: Path | None) -> list[dict]:
    elements = [element for sub in _split_bbox(bounds) for element in _cached_tile(sub, cache_dir, depth + 1)]
    if tile_path:
        cache_dir.mkdir(parents=True, exist_ok=True)
        temporary = tile_path.with_name(tile_path.name + ".partial")
        temporary.write_text(json.dumps({"bounds": bounds, "elements": elements}, separators=(",", ":")), encoding="utf-8")
        temporary.replace(tile_path)
    return elements


def download_osm_transport(path: Path, bounds: list[float] | None = None,
                           *, tile_cache_dir: Path | None = None) -> None:
    """Acquire transport in resumable tiles to avoid whole-scene Overpass 504s."""
    bounds = bounds or SCENE_BBOX_WGS84
    # Four modest requests are safer for a public Overpass service than one
    # large query, and successful tiles are reused if a later tile fails.
    parts = _split_bbox(bounds)
    features: dict[tuple[str, int], dict] = {}
    for index, tile in enumerate(parts, 1):
        print(f"OSM transport tile {index}/{len(parts)}: {tile}", flush=True)
        for element in _cached_tile(tile, tile_cache_dir):
            key = (str(element.get("type")), element.get("id"))
            if not key[0] or key[1] is None:
                continue
            # Full way geometry is provided by 'out body geom'. Retain the
            # more detailed copy if a way intersects multiple query tiles.
            previous = features.get(key)
            if previous is None or len(element.get("geometry") or ()) > len(previous.get("geometry") or ()):
                features[key] = element
        if index < len(parts):
            time.sleep(1)
    if not features:
        raise RuntimeError("OpenStreetMap Overpass returned no transport features in the Sydney scene bounds")
    parsed = {"version": 0.6, "generator": "Overpass API tiled acquisition", "elements": list(features.values())}
    path.write_text(json.dumps(parsed, separators=(",", ":")), encoding="utf-8")
    print(f"Downloaded {len(features):,} unique bounded OSM transport elements across {len(parts)} tiles", flush=True)


def stable_write(bundle: dict) -> str:
    bundle.setdefault("profile", {})["outputByteSize"] = 0
    text = ""
    for _ in range(12):
        text = json.dumps(bundle, ensure_ascii=False, separators=(",", ":")) + "\n"
        measured = len(text.encode("utf-8"))
        if bundle["profile"]["outputByteSize"] == measured:
            return text
        bundle["profile"]["outputByteSize"] = measured
    return text


def main() -> None:
    if not DEFAULT_OUTPUT.exists():
        raise RuntimeError(f"Existing city bundle not found: {DEFAULT_OUTPUT.relative_to(ROOT)}")
    bundle = json.loads(DEFAULT_OUTPUT.read_text(encoding="utf-8"))
    bounds = bundle.get("city", {}).get("sceneBboxWgs84")
    if not isinstance(bounds, list) or len(bounds) != 4 or not all(isinstance(n, (int, float)) for n in bounds):
        raise RuntimeError("Existing city has no valid sceneBboxWgs84; refusing a mismatched road extract")
    RAW.mkdir(parents=True, exist_ok=True)
    roads = RAW / "nsw-road-segments.geojson"
    osm = RAW / "osm-transport.json"
    tmp_roads = RAW / "nsw-road-segments.partial.geojson"
    tmp_osm = RAW / "osm-transport.partial.json"
    retrieved = date.today().isoformat()
    try:
        download_nsw_roads(tmp_roads, bounds)
        download_osm_transport(tmp_osm, bounds)
        tmp_roads.replace(roads)
        tmp_osm.replace(osm)

        road_records, transport_points, road_profile = transport_network(roads, osm, bbox_wgs84=bounds)
        if road_profile["roadCount"] < 20:
            raise RuntimeError(f"Only {road_profile['roadCount']} usable road segments. Refusing to replace transport layer")

        if not isinstance(bundle.get("buildings"), list) or not isinstance(bundle.get("city"), dict):
            raise RuntimeError("Current Sydney city bundle is not compatible with the transport merger")
        buildings, conflict_profile = apply_road_clearance(bundle["buildings"], road_records)
        bundle["schemaVersion"] = "0.3.0"
        bundle["generatedAt"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        bundle["roads"] = road_records
        bundle["transportPoints"] = transport_points
        bundle["buildings"] = buildings
        if road_records:
            xs = [point[0] for road in road_records for point in road.get("points", [])]
            ys = [point[1] for road in road_records for point in road.get("points", [])]
            bounds = bundle.setdefault("bounds", {})
            bounds["minX"] = round(min(float(bounds.get("minX", min(xs))), min(xs) - 80), 1)
            bounds["maxX"] = round(max(float(bounds.get("maxX", max(xs))), max(xs) + 80), 1)
            bounds["minY"] = round(min(float(bounds.get("minY", min(ys))), min(ys) - 80), 1)
            bounds["maxY"] = round(max(float(bounds.get("maxY", max(ys))), max(ys) + 80), 1)
        bundle.setdefault("city", {})["transportMode"] = "nsw-roadsegment-osm-enriched"
        bundle["city"]["transportNote"] = "NSW RoadSegment centrelines in the common local-metre frame; OSM adds exact lanes/width only where explicitly tagged plus traffic-signal/crossing points."
        transformations = bundle["city"].setdefault("transformations", [])
        for step in (
            "project road centrelines through the same EPSG:7856 local-metre transform",
            "audit ground-road corridors against building footprints before browser export",
        ):
            if step not in transformations:
                transformations.append(step)
        sources = [source for source in bundle.get("sources", []) if source.get("id") not in {"nsw-road-segment", "openstreetmap-transport"}]
        sources.extend([
            {"id": "nsw-road-segment", "retrievedAt": retrieved, "licence": "CC BY (TfNSW catalogue)", "used": True},
            {"id": "openstreetmap-transport", "retrievedAt": retrieved, "licence": "ODbL-1.0", "used": True, "role": "exact lane/width enrichment and traffic signal/crossing points"},
        ])
        bundle["sources"] = sources
        bundle.setdefault("profile", {}).update(road_profile)
        bundle["profile"].update(conflict_profile)
        text = stable_write(bundle)
        temporary_output = DEFAULT_OUTPUT.with_name(DEFAULT_OUTPUT.name + ".partial")
        temporary_output.write_text(text, encoding="utf-8")
        temporary_output.replace(DEFAULT_OUTPUT)
        print(f"Wrote Sydney transport layer to {DEFAULT_OUTPUT.relative_to(ROOT)}")
        print(json.dumps({**road_profile, **conflict_profile}, indent=2))
        print(f"Gzip transfer estimate: {len(gzip.compress(text.encode('utf-8'), compresslevel=9)):,} bytes")
        print("Review roads, junction markers and road/building conflicts locally before committing the derived browser JSON.")
    finally:
        tmp_roads.unlink(missing_ok=True)
        tmp_osm.unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Sydney transport acquisition failed: {exc}", file=sys.stderr)
        print("Your existing sydney-city.json was not replaced.", file=sys.stderr)
        raise SystemExit(1) from exc
