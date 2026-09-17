"""Rebuild public static Pulse geography from Geofabrik roads and GSHHG shorelines.

Dependencies: pip install pyshp shapely numpy
Inputs: Geofabrik SA free shapefile ZIP (roads), GSHHG intermediate coastline
        in Basemap data's gshhs_i.dat and gshhsmeta_i.dat format.
The public geometry is a separate ODbL road database and LGPL coastline layer.
"""

from __future__ import annotations

import argparse
import io
import json
import math
import struct
import zipfile
from datetime import datetime, timezone
from collections import defaultdict
from pathlib import Path

import shapefile
from shapely.geometry import GeometryCollection, LineString, MultiLineString, box
from trim_coast import transform as trim_neighbouring_coast

TILE_SIZE = 0.5
FCLASSES = {
    "motorway": "high", "motorway_link": "high", "trunk": "high", "trunk_link": "high",
    "primary": "arterial", "primary_link": "arterial",
    "secondary": "arterial", "secondary_link": "arterial",
    "tertiary": "regional", "tertiary_link": "regional",
}
COAST_BOX = (125.5, -39.3, 144.5, -30.2)


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def pairs(points: object) -> list[list[float]]:
    return [[round(float(x), 6), round(float(y), 6)] for x, y in points]


def lines(geometry: object) -> list[LineString]:
    if isinstance(geometry, LineString):
        return [geometry] if not geometry.is_empty and len(geometry.coords) >= 2 else []
    if isinstance(geometry, (MultiLineString, GeometryCollection)):
        return [part for part in geometry.geoms for part in lines(part)]
    return []


def build_roads(archive: Path, target: Path) -> dict:
    with zipfile.ZipFile(archive) as source:
        prefix = "gis_osm_roads_free_1"
        reader = shapefile.Reader(
            shp=io.BytesIO(source.read(f"{prefix}.shp")),
            shx=io.BytesIO(source.read(f"{prefix}.shx")),
            dbf=io.BytesIO(source.read(f"{prefix}.dbf")),
            encoding="utf-8",
        )
        tiles: dict[tuple[int, int], list[dict]] = defaultdict(list)
        counts = defaultdict(int)
        overview_features: list[dict] = []
        source_count = 0
        for record in reader.iterShapeRecords():
            cls = record.record["fclass"]
            tier = FCLASSES.get(cls)
            if not tier:
                continue
            source_count += 1
            counts[cls] += 1
            shape = record.shape
            if len(shape.points) < 2:
                raise ValueError(f"Road {record.record['osm_id']} has no line geometry")
            breaks = list(shape.parts) + [len(shape.points)]
            for start, end in zip(breaks[:-1], breaks[1:]):
                coords = shape.points[start:end]
                if len(coords) < 2:
                    continue
                west = math.floor(min(p[0] for p in coords) / TILE_SIZE)
                east = math.floor(max(p[0] for p in coords) / TILE_SIZE)
                south = math.floor(min(p[1] for p in coords) / TILE_SIZE)
                north = math.floor(max(p[1] for p in coords) / TILE_SIZE)
                geometry = LineString(coords)
                if tier != "regional":
                    overview = geometry.simplify(0.002, preserve_topology=False)
                    if len(overview.coords) >= 2:
                        overview_features.append({"type": "Feature", "properties": {"tier": tier}, "geometry": {"type": "LineString", "coordinates": pairs(overview.coords)}})
                for ix in range(west, east + 1):
                    for iy in range(south, north + 1):
                        bounds = (ix * TILE_SIZE, iy * TILE_SIZE, (ix + 1) * TILE_SIZE, (iy + 1) * TILE_SIZE)
                        if bounds[0] <= geometry.bounds[0] and bounds[1] <= geometry.bounds[1] and bounds[2] >= geometry.bounds[2] and bounds[3] >= geometry.bounds[3]:
                            clipped = [geometry]
                        else:
                            # A fractional-degree overlap prevents subpixel breaks at tile seams.
                            clipped = lines(geometry.intersection(box(*bounds).buffer(0.00002)))
                        for segment in clipped:
                            coordinates = pairs(segment.coords)
                            if len(coordinates) < 2 or coordinates[0] == coordinates[-1] and len(coordinates) == 2:
                                continue
                            tiles[(ix, iy)].append({
                                "type": "Feature",
                                "properties": {"tier": tier},
                                "geometry": {"type": "LineString", "coordinates": coordinates},
                            })
    if source_count != sum(counts.values()) or source_count == 0:
        raise ValueError("Road count reconciliation failed")
    manifest = []

    def emit_cell(ix: int, iy: int, features: list[dict], bounds: tuple[float, float, float, float], suffix: str = "", depth: int = 0) -> None:
        packed = json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":"))
        if len(packed) > 450_000 and depth < 4:
            west, south, east, north = bounds
            mid_x, mid_y = (west + east) / 2, (south + north) / 2
            quadrants = [
                (west, south, mid_x, mid_y), (mid_x, south, east, mid_y),
                (west, mid_y, mid_x, north), (mid_x, mid_y, east, north),
            ]
            for q, child in enumerate(quadrants):
                cell = box(*child).buffer(0.00002)
                selected = []
                for feature in features:
                    geometry = LineString(feature["geometry"]["coordinates"])
                    for piece in lines(geometry.intersection(cell)):
                        selected.append({"type": "Feature", "properties": feature["properties"], "geometry": {"type": "LineString", "coordinates": pairs(piece.coords)}})
                if selected:
                    emit_cell(ix, iy, selected, child, suffix + str(q), depth + 1)
            return
        relpath = f"roads/{ix}_{iy}{('_' + suffix) if suffix else ''}.geojson"
        write_json(target / relpath, {"type": "FeatureCollection", "features": features})
        manifest.append({"file": relpath, "bbox": list(bounds), "count": len(features)})

    for (ix, iy), features in sorted(tiles.items()):
        emit_cell(ix, iy, features, (ix * TILE_SIZE, iy * TILE_SIZE, (ix + 1) * TILE_SIZE, (iy + 1) * TILE_SIZE))
    write_json(target / "roads/overview.geojson", {"type": "FeatureCollection", "features": overview_features})
    index = {
        "schemaVersion": 1, "kind": "pulse-static-roads", "source": "Geofabrik OSM South Australia 2026-09-16",
        "sourceRecords": source_count, "classes": dict(sorted(counts.items())), "overviewFile": "roads/overview.geojson", "overviewRecords": len(overview_features), "tileSizeDegrees": TILE_SIZE,
        "tiles": manifest,
    }
    write_json(target / "roads/index.json", index)
    print(f"roads: {source_count} source records, {len(manifest)} static tiles, {sum(t['count'] for t in manifest)} clipped segments")
    return index


def build_coast(data: Path, metadata: Path, target: Path) -> dict:
    clip = box(*COAST_BOX)
    features = []
    mainland = None
    with data.open("rb") as binary, metadata.open(encoding="utf-8") as meta:
        for line in meta:
            fields = line.split()
            kind, south, north = int(fields[0]), float(fields[3]), float(fields[4])
            if kind != 1 or south > COAST_BOX[3] or north < COAST_BOX[1]:
                continue
            binary.seek(int(fields[5]))
            length = int(fields[6])
            values = struct.iter_unpack("<ff", binary.read(length))
            coordinates = list(values)
            if not coordinates:
                continue
            if min(x for x, _ in coordinates) > COAST_BOX[2] or max(x for x, _ in coordinates) < COAST_BOX[0]:
                continue
            shoreline = LineString(coordinates)
            for part in lines(shoreline.intersection(clip)):
                features.append({"type": "Feature", "properties": {"kind": "coast"}, "geometry": {"type": "LineString", "coordinates": pairs(part.coords)}})
            if mainland is None or shoreline.length > mainland.length:
                mainland = shoreline
    if mainland is None:
        raise ValueError("Mainland GSHHG coastline was not found")
    for border, longitude in (("WA/SA", 129.0), ("SA/VIC", 141.0)):
        hits = mainland.intersection(LineString([(longitude, -39.3), (longitude, -30.2)]))
        options = [hits] if hits.geom_type == "Point" else list(getattr(hits, "geoms", []))
        candidates = [p.y for p in options if p.geom_type == "Point"]
        if not candidates:
            raise ValueError(f"No shoreline intersection for {border}")
        latitude = max(candidates) if border == "WA/SA" else min(candidates)
        # A short stylised meridian marker, not an official surveyed cadastral boundary.
        features.append({"type": "Feature", "properties": {"kind": "border", "name": border}, "geometry": {"type": "LineString", "coordinates": [[longitude, round(latitude, 6)], [longitude, round(latitude + 0.22, 6)]]}})
        print(f"{border} approximate coast intersection: {longitude}, {latitude:.6f}")
    result = trim_neighbouring_coast({"type": "FeatureCollection", "features": features})
    write_json(target / "coast.geojson", result)
    print(f"coast: {len(features) - 2} shoreline paths and 2 short border markers")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--roads-zip", required=True, type=Path)
    parser.add_argument("--gshhs-data", required=True, type=Path)
    parser.add_argument("--gshhs-meta", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=Path("public/data/pulse-of-adelaide/geography"))
    args = parser.parse_args()
    roads = build_roads(args.roads_zip, args.output)
    coast = build_coast(args.gshhs_data, args.gshhs_meta, args.output)
    output_files = [args.output / "coast.geojson", args.output / "roads/index.json", args.output / "roads/overview.geojson"]
    output_files.extend(args.output / tile["file"] for tile in roads["tiles"])
    metadata = {
        "schemaVersion": 1,
        "kind": "pulse-geographic-source-metadata",
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sources": [
            {
                "name": "Geofabrik OpenStreetMap South Australia free shapefiles",
                "sourceUrl": "https://download.geofabrik.de/australia-oceania/australia/south-australia.html",
                "dataAsOf": "2026-09-16T20:21:21Z",
                "license": "ODbL 1.0",
                "licenseUrl": "https://www.openstreetmap.org/copyright",
                "geometry": "All 31,284 motorway, trunk, primary, secondary and tertiary segments, including links, in the supplied extract.",
            },
            {
                "name": "GSHHG intermediate shoreline via Basemap data 2.0.0",
                "sourceUrl": "https://www.ngdc.noaa.gov/mgg/shorelines/shorelines.html",
                "license": "LGPL",
                "geometry": "Full SA shoreline (129..141 E) plus short 0.55° WA and 0.65° VIC extensions; approximate 0.085° state-border cues",
            },
        ],
        "coordinateSystem": "WGS84 (EPSG:4326)",
        "files": [
            {"path": file.relative_to(args.output).as_posix(), "bytes": file.stat().st_size,
             "count": len(coast["features"]) if file.name == "coast.geojson" else (
                 roads["sourceRecords"] if file.name == "index.json" else (
                     roads["overviewRecords"] if file.name == "overview.geojson" else next((tile["count"] for tile in roads["tiles"] if tile["file"] == file.relative_to(args.output).as_posix()), None))) }
            for file in output_files
        ],
        "limitations": "Coastline is intermediate-resolution overview data with intentionally trimmed neighbouring shorelines. Border marks are short meridian cues, not surveyed cadastral lines. OSM road coverage reflects the snapshot, not a guaranteed exhaustive real-world network.",
    }
    write_json(args.output / "metadata.json", metadata)


if __name__ == "__main__":
    main()
