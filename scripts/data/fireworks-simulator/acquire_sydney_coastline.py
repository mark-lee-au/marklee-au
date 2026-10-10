#!/usr/bin/env python3
"""Build Sydney land triangles from Overture's QA'd OSM-derived ocean polygons.

This is an opt-in local data step; it never runs in Astro or the browser.
The ocean is not drawn. Its inverse inside the existing scene frame becomes
land. Never replace the browser city if the download or geometry checks fail.
"""
from __future__ import annotations

import argparse
import gzip
import json
import math
from datetime import datetime, timezone
from pathlib import Path

try:
    from shapely import constrained_delaunay_triangles
except ImportError as exc:
    raise SystemExit('Requires Shapely 2.1+: py -m pip install --upgrade "shapely>=2.1"') from exc
from shapely.affinity import translate
from shapely.geometry import GeometryCollection, MultiPolygon, Point, Polygon, box, shape
from shapely.ops import transform as shapely_transform, unary_union
from shapely.validation import make_valid

from acquire_sydney import current_release, download_type
from prepare_sydney_city import (
    DEFAULT_OUTPUT, ORIGIN_E, ORIGIN_N, ROOT, WGS84_TO_MGA56,
)

RAW = ROOT / 'data/raw/fireworks-simulator/sydney'
SOURCE = 'https://docs.overturemaps.org/schema/reference/base/water/'
CACHE = RAW / 'overture-water.geojson'
META = RAW / 'overture-water-meta.json'


def query_bbox(bbox: list[float]) -> list[float]:
    """Expand the building bbox to include the city frame's small margins."""
    west, south, east, north = bbox
    return [round(west - .012, 6), round(south - .012, 6),
            round(east + .012, 6), round(north + .012, 6)]


def _project_geometry(geom):
    projected = shapely_transform(WGS84_TO_MGA56.transform, geom)
    return translate(projected, xoff=-ORIGIN_E, yoff=-ORIGIN_N)


def _polygon_parts(geom):
    if isinstance(geom, Polygon):
        yield geom
    elif isinstance(geom, (MultiPolygon, GeometryCollection)):
        for part in geom.geoms:
            yield from _polygon_parts(part)


def _features(raw: dict):
    if raw.get('type') == 'FeatureCollection':
        return raw.get('features', [])
    if raw.get('type') == 'Feature':
        return [raw]
    raise ValueError('Expected Overture water GeoJSON FeatureCollection; existing city unchanged')


def content_bounds(bundle: dict) -> dict[str, float]:
    min_x = math.inf
    max_x = -math.inf
    min_y = math.inf
    max_y = -math.inf

    for building in bundle.get('buildings', []):
        for x, y in building.get('footprint', []):
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

    for road in bundle.get('roads', []):
        for x, y in road.get('points', []):
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

    if not all(math.isfinite(value) for value in (min_x, max_x, min_y, max_y)):
        fallback = bundle['bounds']
        return {'minX': fallback['minX'], 'maxX': fallback['maxX'], 'minY': fallback['minY'], 'maxY': fallback['maxY']}
    return {'minX': round(min_x, 1), 'maxX': round(max_x, 1), 'minY': round(min_y, 1), 'maxY': round(max_y, 1)}


def coastline_frame_bounds(bundle: dict) -> dict[str, float]:
    # West/north/south stop at the last sourced road/building geometry.
    # East remains open to the coastline so the Pacific edge can stay visible.
    source = bundle['bounds']
    content = content_bounds(bundle)
    return {
        'minX': max(source['minX'], content['minX']),
        'maxX': max(source['maxX'], content['maxX']),
        'minY': max(source['minY'], content['minY']),
        'maxY': min(source['maxY'], content['maxY']),
    }


def is_scene_water_feature(props: dict) -> bool:
    subtype = props.get('subtype')
    water_class = props.get('class')
    return subtype == 'ocean' or water_class in {'ocean', 'bay'} or (subtype == 'water' and water_class == 'water')


def coastline_to_land(raw: dict, bounds: dict[str, float]) -> dict:
    """Clip Overture ocean/harbour polygons and triangulate the complementary land."""
    frame = box(bounds['minX'], bounds['minY'], bounds['maxX'], bounds['maxY'])
    ocean_parts = []
    ocean_count = 0
    for feature in _features(raw):
        props = feature.get('properties') or {}
        if not is_scene_water_feature(props):
            continue
        geom = feature.get('geometry')
        if not geom:
            continue
        source_shape = shape(geom)
        if not isinstance(source_shape, (Polygon, MultiPolygon)):
            continue
        try:
            projected = _project_geometry(source_shape)
            if not projected.is_valid:
                projected = make_valid(projected)
            if not projected.intersects(frame):
                continue
            clipped = projected.intersection(frame)
            ocean_parts.extend(p for p in _polygon_parts(clipped) if p.area >= .05)
        except Exception as exc:
            raise ValueError(f'Invalid Overture ocean geometry {feature.get("id", "unknown")}: {exc}') from exc
        ocean_count += 1
    if not ocean_parts:
        raise ValueError('No usable Overture harbour/ocean polygons intersect the Sydney scene; existing city unchanged. Check that the downloaded water features include class=bay or ocean.')

    ocean = unary_union(ocean_parts)
    if not ocean.is_valid:
        raise ValueError('Combined ocean geometry is invalid; existing city unchanged')
    land = frame.difference(ocean)
    if not land.is_valid:
        raise ValueError('Derived land geometry is invalid; existing city unchanged')
    land_fraction = land.area / frame.area
    if not .15 < land_fraction < .995:
        raise ValueError(f'Implausible land area fraction {land_fraction:.3f}; existing city unchanged')

    # These calibrated positions are within the expanded Sydney scene. Test
    # identifiable land and harbour independently to detect flipped/missing
    # ocean polygons before publishing a replacement browser file.
    for name, xy, expected_land in [
        ('Sydney CBD', (-18.2, -1780.08), True),
        ('Sydney Harbour channel', (400.0, 150.0), False),
        ('North Sydney', (250.0, 1600.0), True),
    ]:
        point = Point(*xy)
        if frame.contains(point) and land.covers(point) != expected_land:
            raise ValueError(f'Land/ocean validation failed at {name}; existing city unchanged')

    triangles: list[list[list[float]]] = []

    def split_large_triangle(vertices):
        stack = [vertices]
        while stack:
            corners = stack.pop()
            lengths = [math.dist(corners[i], corners[(i + 1) % 3]) for i in range(3)]
            index = max(range(3), key=lengths.__getitem__)
            if lengths[index] <= 180:
                triangles.append([[round(x, 1), round(y, 1)] for x, y in corners])
                continue
            a, b, c = corners[index], corners[(index + 1) % 3], corners[(index + 2) % 3]
            midpoint = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            stack.append([a, midpoint, c])
            stack.append([midpoint, b, c])

    for polygon in _polygon_parts(land):
        if polygon.area < .05:
            continue
        # Constrained triangulation respects polygon boundaries AND holes.
        # Ordinary Delaunay triangulation plus 'contains' silently drops
        # shoreline triangles along irregular bays.
        mesh = constrained_delaunay_triangles(polygon)
        for triangle in _polygon_parts(mesh):
            if triangle.area < .01:
                continue
            split_large_triangle(list(triangle.exterior.coords)[:3])
    if len(triangles) < 2:
        raise ValueError('Land triangulation returned no usable mesh; existing city unchanged')
    triangles.sort(key=lambda t: (t[0][0], t[0][1], t[1][0], t[1][1]))
    return {
        'sourceClass': 'overture-ocean-inverse-osm-derived',
        'triangles': triangles,
        'oceanFeatureCount': ocean_count,
        'landAreaFraction': round(land_fraction, 4),
    }


def apply_coastline(bundle: dict, raw: dict, acquired_at: str, release: str | None = None) -> dict:
    frame_bounds = coastline_frame_bounds(bundle)
    land = coastline_to_land(raw, frame_bounds)
    bundle['bounds'] = {
        **bundle['bounds'],
        **frame_bounds,
    }
    bundle['land'] = land
    bundle['water'] = {'sourceClass': 'none-water-is-scene-background', 'polygons': []}
    bundle['profile']['waterVertexCount'] = 0
    bundle['profile'].pop('coastlineWayCount', None)
    bundle['profile']['landTriangleCount'] = len(land['triangles'])
    bundle['profile']['oceanFeatureCount'] = land['oceanFeatureCount']
    bundle['profile']['landAreaFraction'] = land['landAreaFraction']
    bundle['profile']['landBounds'] = frame_bounds
    bundle['sources'] = [src for src in bundle.get('sources', [])
                         if src.get('id') not in ('osm-coastline', 'overture-ocean')] + [{
        'id': 'overture-ocean', 'sourceUrl': SOURCE, 'licence': 'ODbL-1.0',
        'release': release, 'retrievedAt': acquired_at, 'used': True,
        'role': 'OSM-derived, QA coastline ocean polygons inverted into land mesh',
    }]
    bundle['generatedAt'] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    return bundle


def main() -> None:
    parser = argparse.ArgumentParser(description='Build Sydney land from Overture ocean polygons, without drawing water')
    parser.add_argument('--reuse-local', action='store_true', help='Reuse previously saved Overture water GeoJSON')
    parser.add_argument('--source-file', type=Path, help='Use a local Overture base/water GeoJSON export')
    args = parser.parse_args()
    if args.reuse_local and args.source_file:
        parser.error('Choose --reuse-local or --source-file, not both')
    if not DEFAULT_OUTPUT.exists():
        parser.error('Sydney city bundle missing. Generate the existing city first.')
    city = json.loads(DEFAULT_OUTPUT.read_text(encoding='utf-8'))
    if city.get('city', {}).get('id') != 'sydney':
        parser.error('Only Sydney bundles are accepted')
    scene_bbox = city.get('city', {}).get('sceneBboxWgs84')
    if not scene_bbox or len(scene_bbox) != 4:
        parser.error('City bundle lacks a scene boundary')
    extent = query_bbox(scene_bbox)
    RAW.mkdir(parents=True, exist_ok=True)
    if args.source_file:
        raw = json.loads(args.source_file.read_text(encoding='utf-8'))
        acquired_at = datetime.now(timezone.utc).date().isoformat()
        release = None  # unknown unless acquired by our checked Overture client
    elif args.reuse_local:
        if not CACHE.exists() or not META.exists():
            parser.error('No saved Overture water GeoJSON. The previous osm-coastline.json has zero features and cannot be reused. Run without --reuse-local.')
        meta = json.loads(META.read_text(encoding='utf-8'))
        if meta.get('bbox') != scene_bbox or meta.get('queryBbox') != extent:
            parser.error('Saved Overture water extent does not match this city; download again.')
        raw = json.loads(CACHE.read_text(encoding='utf-8'))
        acquired_at = meta['retrievedAt']
        release = meta.get('release')
    else:
        print('Downloading bounded Overture base/water polygons; browser city remains untouched...', flush=True)
        release = current_release()
        pending = RAW / 'overture-water.partial.geojson'
        try:
            download_type('water', pending, extent)
            if current_release() != release:
                raise RuntimeError('Overture release changed during download; existing city unchanged. Retry.')
            raw = json.loads(pending.read_text(encoding='utf-8'))
            if not _features(raw):
                raise ValueError('Overture returned an empty water dataset; existing city unchanged')
            pending.replace(CACHE)
            acquired_at = datetime.now(timezone.utc).date().isoformat()
            META.write_text(json.dumps({'bbox': scene_bbox, 'queryBbox': extent,
                                        'release': release, 'retrievedAt': acquired_at}, indent=2) + '\n', encoding='utf-8')
        finally:
            pending.unlink(missing_ok=True)
    updated = apply_coastline(city, raw, acquired_at, release)
    updated['profile']['outputByteSize'] = 0
    for _ in range(10):
        content = json.dumps(updated, ensure_ascii=False, separators=(',', ':')) + '\n'
        size = len(content.encode('utf-8'))
        if updated['profile']['outputByteSize'] == size:
            break
        updated['profile']['outputByteSize'] = size
    backup = RAW / 'sydney-city-before-coastline.json'
    if not backup.exists():
        backup.write_bytes(DEFAULT_OUTPUT.read_bytes())
    temp = DEFAULT_OUTPUT.with_name(DEFAULT_OUTPUT.name + '.partial')
    temp.write_text(content, encoding='utf-8')
    temp.replace(DEFAULT_OUTPUT)
    print(f"Land mesh: {updated['profile']['landTriangleCount']:,} triangles from {updated['profile']['oceanFeatureCount']} ocean features")
    print(f"Land coverage: {updated['profile']['landAreaFraction']:.1%}; water remains empty")
    print(f'Updated {DEFAULT_OUTPUT.relative_to(ROOT)} ({size:,} bytes, {len(gzip.compress(content.encode("utf-8"))):,} gzip bytes)')
    print(f'Backup: {backup.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
