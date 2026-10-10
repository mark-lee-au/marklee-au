#!/usr/bin/env python3
"""Download bounded Sydney buildings, streets and transport controls, then publish the browser slice.

This is a manual, network-requiring *data preparation* command, never called by
Astro at build/runtime. Leaves the existing city JSON unchanged on errors.
"""
from __future__ import annotations

import argparse
import gzip
import json
import math
import re
import shutil
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.request import urlopen

from prepare_sydney_city import (
    DEFAULT_OUTPUT, ROOT, SCENE_BBOX_WGS84, SCENE_EXTENTS_WGS84,
    build_bundle, local_xy, scene_bbox,
)
from acquire_sydney_transport import download_nsw_roads, download_osm_transport
from sydney_coastal_land import apply_coastal_land

RAW = ROOT / "data/raw/fireworks-simulator/sydney"
RELEASE_CATALOG = "https://stac.overturemaps.org/catalog.json"


def current_release() -> str:
    with urlopen(RELEASE_CATALOG, timeout=25) as response:
        catalog = json.load(response)
    latest = str(catalog.get("latest", ""))
    match = re.search(r"\d{4}-\d{2}-\d{2}\.\d+", latest)
    if not match:
        raise RuntimeError(f"Could not read a dated Overture release from STAC: {latest[:150]}")
    return match.group(0)


def download_type(feature_type: str, path: Path, bbox: list[float], release: str | None = None) -> None:
    try:
        from overturemaps import record_batch_reader
        from overturemaps.writers import copy, get_writer
    except ImportError as exc:
        raise RuntimeError("Install Python dependencies first: py -m pip install overturemaps pyproj shapely") from exc
    print(f"Downloading bounded Overture {feature_type}: {bbox}", flush=True)
    reader = record_batch_reader(feature_type, bbox=tuple(bbox), release=release)
    if reader is None:
        raise RuntimeError(f"Overture returned no reader for {feature_type}")
    with get_writer("geojson", str(path), schema=reader.schema) as writer:
        copy(reader, writer)


def _valid_download(path: Path, kind: str) -> int:
    """Reject missing, malformed or empty downloads before caching them."""
    payload = json.loads(path.read_text(encoding="utf-8"))
    if kind == "osm-transport":
        records = payload.get("elements") if isinstance(payload, dict) else None
    else:
        records = payload.get("features") if isinstance(payload, dict) and payload.get("type") == "FeatureCollection" else None
    if not isinstance(records, list) or not records:
        raise RuntimeError(f"Invalid or empty {kind} response: {path.name}")
    return len(records)


def cached_download(cache: Path, kind: str, bbox: list[float], release: str,
                    downloader) -> Path:
    """Persist each complete extent/release-specific source across failed runs."""
    cache.mkdir(parents=True, exist_ok=True)
    filename = {
        "building": "overture-buildings.geojson",
        "building_part": "overture-building-parts.geojson",
        "nsw-roads": "nsw-road-segments.geojson",
        "osm-transport": "osm-transport.json",
        "land": "overture-land.geojson",
        "water": "overture-water.geojson",
    }[kind]
    output = cache / filename
    meta = cache / (filename + ".meta.json")
    expected = {"bbox": bbox, "overtureRelease": release, "type": kind}
    if output.exists() and meta.exists():
        try:
            metadata = json.loads(meta.read_text(encoding="utf-8"))
            if all(metadata.get(key) == value for key, value in expected.items()):
                count = _valid_download(output, kind)
                if metadata.get('recordCount') != count:
                    raise RuntimeError(f"Cached {kind} record count differs from its manifest: {count} vs {metadata.get('recordCount')}. Stop for review.")
                print(f"Reusing cached {kind}: {count:,} records", flush=True)
                return output
        except (OSError, ValueError, TypeError):
            pass
    temporary = cache / (filename + ".partial")
    temporary.unlink(missing_ok=True)
    try:
        downloader(temporary)
        count = _valid_download(temporary, kind)
        temporary.replace(output)
        metadata = {**expected, "recordCount": count,
                    "downloadedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat()}
        temporary_meta = meta.with_name(meta.name + ".partial")
        temporary_meta.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        temporary_meta.replace(meta)
        print(f"Cached {kind}: {count:,} records", flush=True)
        return output
    finally:
        temporary.unlink(missing_ok=True)


def promote_sources(sources: dict[str, Path], targets: dict[str, Path]) -> None:
    """Only promote source extracts after *all* downloads and city checks pass."""
    for kind, cached in sources.items():
        final = targets[kind]
        temporary = final.with_name(final.name + ".partial")
        shutil.copyfile(cached, temporary)
        temporary.replace(final)


def validate_expanded_coverage(bundle: dict) -> dict[str, int]:
    """Reject accidentally reusing CBD-only extracts for the wider scene."""
    west, south, east, north = SCENE_BBOX_WGS84
    x_coords = [local_xy(lon, lat)[0] for lon in (west, east) for lat in (south, north)]
    y_coords = [local_xy(lon, lat)[1] for lon in (west, east) for lat in (south, north)]
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    counts = {"north": 0, "south": 0, "west": 0, "east": 0}
    for building in bundle["buildings"]:
        footprint = building.get("footprint") or []
        if not footprint:
            continue
        x = sum(p[0] for p in footprint) / len(footprint)
        y = sum(p[1] for p in footprint) / len(footprint)
        counts["north"] += y > max_y + 25
        counts["south"] += y < min_y - 25
        counts["west"] += x < min_x - 25
        counts["east"] += x > max_x + 25
    if not all(counts.values()):
        raise RuntimeError(f"Expanded Sydney source is missing coverage outside the CBD bounds: {counts}")
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="Acquire a Sydney city bundle from public Overture/NSW/OSM sources")
    parser.add_argument("--extent", choices=SCENE_EXTENTS_WGS84, default="cbd",
                        help="Opt into inner-Sydney or the Pacific-side east-coast scene")
    parser.add_argument("--reuse-local", action="store_true",
                        help="Reprocess already-downloaded raw source files without another network download")
    parser.add_argument("--overture-release", help="Exact Overture release, if known, for older local downloads without a manifest")
    parser.add_argument("--fresh-download", action="store_true",
                        help="Ignore the staged download cache and fetch all sources again")
    parser.add_argument("--transport-source", choices=("nsw-osm", "nsw-only"), default="nsw-osm",
                        help="Use reliable NSW road geometry without Overpass enrichment, or include OSM lane/control details")
    args = parser.parse_args()
    use_osm = args.transport_source == "nsw-osm"
    bbox = scene_bbox(args.extent)
    RAW.mkdir(parents=True, exist_ok=True)
    buildings = RAW / "overture-buildings.geojson"
    parts = RAW / "overture-building-parts.geojson"
    roads = RAW / "nsw-road-segments.geojson"
    osm_transport = RAW / "osm-transport.json"
    cache = RAW / f"acquisition-cache-{args.extent}"
    manifest = RAW / "sydney-source-acquisition.json"
    coastal = args.extent == "east-coast"
    land = RAW / "overture-land.geojson"
    water = RAW / "overture-water.geojson"
    staged: dict[str, Path] = {}
    try:
        if args.reuse_local:
            needed = (buildings, parts, roads, osm_transport) if use_osm else (buildings, parts, roads)
            missing = [p for p in needed if not p.is_file()]
            if missing:
                raise RuntimeError("Cannot reuse local Sydney sources. Missing: " + ", ".join(str(p.relative_to(ROOT)) for p in missing))
            source_meta = json.loads(manifest.read_text(encoding="utf-8")) if manifest.exists() else None
            if coastal and not source_meta:
                raise RuntimeError("East-coast reuse requires a matching verified source manifest. Download first.")
            if source_meta and source_meta.get("bbox") != bbox:
                raise RuntimeError(f"Saved Sydney sources cover {source_meta.get('bbox')}, not requested {bbox}. Re-download for this extent")
            if coastal and (not land.exists() or not water.exists() or not (source_meta or {}).get("coastalLandDownloaded") or not (source_meta or {}).get("coastalWaterDownloaded")):
                raise RuntimeError("Missing verified Overture land/water for east-coast extent. Use cached acquisition instead.")
            if use_osm and source_meta and not source_meta.get("osmTransportDownloaded", True):
                raise RuntimeError("Saved extract has no OSM enrichment. Rerun the normal acquisition to add it.")
            release = args.overture_release or ((source_meta or {}).get("overtureRelease"))
            retrieved_at = (source_meta or {}).get("retrievedAt") or date.fromtimestamp(buildings.stat().st_mtime).isoformat()
            if not release:
                print("WARNING: Overture release of existing raw files is unverified. This output needs provenance review before publication.", flush=True)
            print(f"Reprocessing saved Sydney sources ({args.transport_source}). No downloads required.", flush=True)
        else:
            release = args.overture_release or current_release()
            if args.fresh_download and cache.exists():
                shutil.rmtree(cache)
            # Each completed source stays in an extent/release-labelled cache.
            # A later 504 must not throw away the 45,000 buildings just fetched.
            staged["building"] = cached_download(cache, "building", bbox, release,
                                                    lambda path: download_type("building", path, bbox, release))
            staged["building_part"] = cached_download(cache, "building_part", bbox, release,
                                                         lambda path: download_type("building_part", path, bbox, release))
            staged["nsw-roads"] = cached_download(cache, "nsw-roads", bbox, release,
                                                   lambda path: download_nsw_roads(path, bbox))
            if use_osm:
                staged["osm-transport"] = cached_download(cache, "osm-transport", bbox, release,
                                                           lambda path: download_osm_transport(
                                                               path, bbox, tile_cache_dir=cache / "osm-tiles"))
            else:
                print("NSW-only transport: skipping Overpass. OSM lane details, traffic signals and crossings will not be included.", flush=True)
            if coastal:
                staged["land"] = cached_download(cache, "land", bbox, release,
                                                  lambda path: download_type("land", path, bbox, release))
                staged["water"] = cached_download(cache, "water", bbox, release,
                                                   lambda path: download_type("water", path, bbox, release))
            if not args.overture_release and release != current_release():
                raise RuntimeError(f"Overture release changed during the extract ({release} to {after}); retry")
            retrieved_at = date.today().isoformat()
        # Run the full geometry and data-quality checks against the staged files.
        # Leave the previously accepted raw extracts intact if processing fails.
        input_buildings = staged.get("building", buildings)
        input_parts = staged.get("building_part", parts)
        input_roads = staged.get("nsw-roads", roads)
        # Do not leak the old inner-Sydney OSM extract into a NSW-only coastal bundle.
        input_osm = staged.get("osm-transport", osm_transport) if use_osm else None
        input_land = staged.get("land", land)
        input_water = staged.get("water", water)
        bundle = build_bundle(
            input_buildings, 1.0,
            overture_release=release,
            overture_retrieved_at=retrieved_at,
            parts_path=input_parts,
            roads_path=input_roads,
            roads_retrieved_at=retrieved_at,
            osm_transport_path=input_osm,
            osm_retrieved_at=retrieved_at,
            extent=args.extent,
        )
        if coastal:
            raw_land = json.loads(input_land.read_text(encoding="utf-8"))
            raw_water = json.loads(input_water.read_text(encoding="utf-8"))
            bundle = apply_coastal_land(bundle, raw_land, raw_water, retrieved_at, release)
            bundle["city"]["sourceNote"] = (
                "Sourced Overture buildings and coastline-derived land, NSW roads"
                + (" with OSM transport enrichment" if use_osm else " (OSM enrichment pending)")
                + "; authored landmarks remain schematic, and heights include identified fallbacks."
            )
        bundle["profile"]["transportSourceMode"] = args.transport_source
        count = bundle["profile"]["buildingCount"]
        if count < 20:
            raise RuntimeError(f"Only {count} usable building polygons. Refusing to replace city without review")
        audit_errors = bundle["profile"].get("roadAuditErrorCount", 0)
        # A small number of malformed source rings can be safely withheld for
        # review. Widespread audit failures likely indicate a CRS/GEOS bug.
        if audit_errors > max(25, math.ceil(count * 0.005)):
            raise RuntimeError(f"Road clearance geometry audit failed for {audit_errors}/{count} buildings; refusing to replace city")
        if audit_errors:
            print(f"WARNING: {audit_errors} buildings withheld after local geometry audit errors; inspect profile.roadAuditErrorSampleIds.", flush=True)
        road_count = bundle["profile"].get("roadCount", 0)
        if road_count < 20:
            raise RuntimeError(f"Only {road_count} usable road segments. Refusing to replace city without review")
        if args.extent in ("inner-sydney", "east-coast"):
            directional_counts = validate_expanded_coverage(bundle)
            bundle["profile"]["expandedBeyondCbdByDirection"] = directional_counts
        bundle["profile"]["overtureReleaseVerified"] = bool(release)
        output = DEFAULT_OUTPUT
        output.parent.mkdir(parents=True, exist_ok=True)
        bundle["profile"]["outputByteSize"] = 0
        for _ in range(10):
            data = json.dumps(bundle, ensure_ascii=False, separators=(",", ":")) + "\n"
            measured = len(data.encode("utf-8"))
            if bundle["profile"]["outputByteSize"] == measured:
                break
            bundle["profile"]["outputByteSize"] = measured
        # Keep the last CBD scene locally if the expanded scene replaces it.
        # This file is inside ignored raw data, never included in the patch.
        if args.extent in ("inner-sydney", "east-coast") and output.exists():
            previous = json.loads(output.read_text(encoding="utf-8"))
            backup = RAW / "sydney-city-cbd-backup.json"
            if previous.get("city", {}).get("sceneBboxWgs84") == SCENE_BBOX_WGS84 and not backup.exists():
                backup.write_bytes(output.read_bytes())
                print(f"Previous CBD data backed up at {backup.relative_to(ROOT)}")
        if coastal and output.exists():
            previous = json.loads(output.read_text(encoding="utf-8"))
            if previous.get("city", {}).get("sceneExtent") == "inner-sydney":
                backup = RAW / "sydney-city-inner-sydney-backup.json"
                if not backup.exists():
                    backup.write_bytes(output.read_bytes())
                    print(f"Previous inner-Sydney city backed up at {backup.relative_to(ROOT)}")
        if staged:
            targets = {
                "building": buildings, "building_part": parts, "nsw-roads": roads,
                "osm-transport": osm_transport, "land": land, "water": water,
            }
            promote_sources(staged, targets)
            manifest_temp = manifest.with_name(manifest.name + ".partial")
            manifest_temp.write_text(json.dumps({
                "bbox": bbox, "overtureRelease": release, "retrievedAt": retrieved_at,
                "coastalLandDownloaded": coastal,
                "coastalWaterDownloaded": coastal,
                "osmTransportDownloaded": use_osm,
                "transportSourceMode": args.transport_source,
            }, indent=2) + "\n", encoding="utf-8")
            manifest_temp.replace(manifest)
        temporary_output = output.with_name(output.name + ".partial")
        temporary_output.write_text(data, encoding="utf-8")
        temporary_output.replace(output)
        print(f"Extent: {args.extent} {bbox}")
        print(f"Overture release: {release or 'UNVERIFIED'}; retrieved: {retrieved_at}")
        print(f"Wrote real Sydney browser geometry to {output.relative_to(ROOT)}")
        print(json.dumps(bundle["profile"], indent=2))
        print(f"Gzip transfer estimate: {len(gzip.compress(data.encode('utf-8'), compresslevel=9)):,} bytes")
        usable = max(1, bundle["profile"]["buildingCount"])
        print(f"Direct height: {bundle['profile']['directHeightCount'] / usable:.1%}; floor fallback: {bundle['profile']['floorFallbackCount'] / usable:.1%}; assumed: {bundle['profile']['defaultHeightCount'] / usable:.1%}")
        print("Inspect the city in your local browser and commit this derived JSON after reviewing its attribution, skyline and size.")
    finally:
        # Remove only incomplete promotion files. Validated source and tile
        # caches persist for the next retry after a transient network error.
        for path in (RAW / "overture-buildings.geojson", RAW / "overture-building-parts.geojson",
                     RAW / "nsw-road-segments.geojson", RAW / "osm-transport.json",
                     RAW / "overture-land.geojson"):
            path.with_name(path.name + ".partial").unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Sydney download failed: {exc}", file=sys.stderr)
        print("Your existing sydney-city.json was not replaced.", file=sys.stderr)
        raise SystemExit(1) from exc
