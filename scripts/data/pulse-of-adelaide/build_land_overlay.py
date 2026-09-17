"""Rebuild the Pulse mainland, correcting GSHHG harbour water with matching OSM data.

The statewide mainland remains derived from the published GSHHG coastline.
The Adelaide harbour cut-outs use Geofabrik's water and riverbank polygons
from the same 2026-09-16 extract as the static OSM road network. No coordinate
translations, hand-drawn shorelines or fuel observations are used.
"""
from __future__ import annotations

import argparse
import io
import json
import zipfile
from pathlib import Path

import shapefile
from shapely.geometry import LineString, Polygon, box, mapping, shape
from shapely.ops import unary_union
from shapely.validation import explain_validity

ROOT = Path(__file__).resolve().parents[3]
GEOGRAPHY = ROOT / "public/data/pulse-of-adelaide/geography"
BOUNDS = (128.35, -39.5, 141.65, -29.5)
HARBOUR = box(138.43, -34.94, 138.64, -34.65)
MIN_AREA = 0.0000005


def build(coast: dict, water_polygons: list | None = None) -> dict:
    parts = [feature["geometry"]["coordinates"] for feature in coast["features"]
             if feature.get("properties", {}).get("kind") == "coast"]
    if not parts:
        raise ValueError("Missing GSHHG mainland coastline")
    mainland = max(parts, key=lambda points: LineString(points).length)
    if len(mainland) < 100:
        raise ValueError("Mainland line is incomplete")
    east, west = mainland[0], mainland[-1]
    if not (140.9 < east[0] < 141.1 and 128.9 < west[0] < 129.1):
        raise ValueError("Unexpected coastline endpoints; refusing to infer land")
    ring = mainland + [[west[0], -27.0], [143.0, -27.0], [143.0, -41.0], east]
    polygon = Polygon(ring)
    if not polygon.is_valid:
        raise ValueError(f"Invalid derived polygon: {explain_validity(polygon)}")
    clipped = polygon.intersection(box(*BOUNDS))
    if water_polygons:
        water = unary_union(water_polygons)
        clipped = clipped.difference(water)
    if clipped.is_empty or not clipped.is_valid:
        raise ValueError("Clipped mainland polygon is invalid")
    checks = ((138.6007, -34.9285, True), (138.5140, -34.9813, True),
              (138.30, -34.95, False), (138.45, -34.95, False))
    for lon, lat, expected in checks:
        from shapely.geometry import Point
        if clipped.covers(Point(lon, lat)) != expected:
            raise ValueError(f"Land/sea reference check failed at {lon}, {lat}")
    return {"type": "FeatureCollection", "features": [{"type": "Feature",
        "properties": {"kind": "mainland", "source": "GSHHG i + OSM 2026-09-16 harbour water" if water_polygons else "GSHHG i"},
        "geometry": mapping(clipped)}]}


def extract_harbour_water(roads_zip: Path) -> tuple[list, list]:
    prefix = "gis_osm_water_a_free_1"
    with zipfile.ZipFile(roads_zip) as archive:
        reader = shapefile.Reader(
            shp=io.BytesIO(archive.read(f"{prefix}.shp")),
            shx=io.BytesIO(archive.read(f"{prefix}.shx")),
            dbf=io.BytesIO(archive.read(f"{prefix}.dbf")),
            encoding="utf-8",
        )
        clipped = []
        for item in reader.iterShapeRecords():
            if item.record["fclass"] not in {"water", "riverbank"}:
                continue
            if not box(*item.shape.bbox).intersects(HARBOUR):
                continue
            geom = shape(item.shape.__geo_interface__).intersection(HARBOUR)
            if not geom.is_valid:
                geom = geom.buffer(0)
            if geom.area >= MIN_AREA:
                clipped.append(geom)
    if not clipped:
        raise ValueError("No OSM harbour water features found")
    dissolved = unary_union(clipped)
    if not dissolved.is_valid:
        raise ValueError("OSM harbour water union is invalid")
    polygons = [dissolved] if dissolved.geom_type == "Polygon" else list(dissolved.geoms)
    return polygons, clipped


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--roads-zip", type=Path, required=True,
                        help="Geofabrik South Australia 2026-09-16 shapefile ZIP")
    args = parser.parse_args()
    coast = json.loads((GEOGRAPHY / "coast.geojson").read_text(encoding="utf-8"))
    polygons, original = extract_harbour_water(args.roads_zip)
    result = build(coast, polygons)
    (GEOGRAPHY / "land.geojson").write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
    shore = {"type": "FeatureCollection", "features": [{"type": "Feature",
        "properties": {"kind": "harbour-water", "source": "Geofabrik OSM South Australia 2026-09-16",
                       "area": round(poly.area, 9)}, "geometry": mapping(poly)} for poly in polygons]}
    (GEOGRAPHY / "harbour-water.geojson").write_text(json.dumps(shore, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Land updated with {len(original)} OSM harbour water polygons; {len(polygons)} dissolved polygons exported")


if __name__ == "__main__":
    main()
